import { useEffect, useRef, useState } from 'react'
import { paletteFor } from '../art/palette'
import { FogCanvas } from '../art/FogCanvas'
import { evalCondition } from '../engine/conditions'
import { useMeta } from '../engine/meta'
import { timeInfo } from '../engine/time'
import type { Hotspot } from '../engine/types'
import { registry, useGame } from '../game'
import { Icon } from '../ui/icons'
import { World, type Input } from './World'

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
}

const VERB: Record<Hotspot['kind'], string> = { character: 'Nói chuyện', object: 'Xem', exit: 'Đi' }

function isTyping(e: Event): boolean {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

/**
 * Sân khấu 3D góc nhìn thứ ba: người chơi tự điều khiển lữ khách đi lại trong làng.
 * - Bàn phím: WASD / phím mũi tên để đi, E để tương tác, kéo chuột để xoay camera.
 * - Cảm ứng: joystick ảo bên trái, nút tương tác bên phải, vuốt màn hình để xoay camera.
 * - Bấm/chạm vào nhân vật hay đồ vật: tự đi tới và tương tác.
 */
export default function Stage3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<World | null>(null)
  const input = useRef<Input>({ moveX: 0, moveY: 0, yawDelta: 0, pitchDelta: 0 })
  const [focus, setFocus] = useState<Hotspot | null>(null)
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches)
  const [showHelp, setShowHelp] = useState(true)
  const run = useGame((s) => s.run)
  const transitionKey = useGame((s) => s.transitionKey)
  const busy = useGame((s) => !!(s.dialogue || s.says.length || s.modal || s.cards.length || s.overlay))
  const speaker = useGame((s) => (s.dialogue ? registry.dialogues[s.dialogue.id]?.nodes[s.dialogue.node]?.speaker : s.says[0]?.speaker))
  const usingItem = useGame((s) => s.usingItem)
  const setSettings = useMeta((s) => s.setSettings)
  const t = timeInfo(run.actions)
  const p = paletteFor(t.tod)

  // Khởi tạo thế giới 3D một lần.
  useEffect(() => {
    if (!canvasRef.current || !labelsRef.current) return
    let world: World
    try {
      world = new World(canvasRef.current, labelsRef.current, registry, input.current, {
        interact: (h) => useGame.getState().clickHotspot(h),
        focus: setFocus,
      })
    } catch (err) {
      console.warn('Không khởi tạo được WebGL, chuyển sang chế độ 2D.', err)
      setSettings({ view: '2d' })
      return
    }
    worldRef.current = world
    const onResize = () => world.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      world.dispose()
      worldRef.current = null
    }
  }, [setSettings])

  // Dựng lại cảnh khi cảnh / buổi / trạng thái hiển thị thay đổi.
  const scene = registry.scenes[run.sceneId]
  const visible = scene ? scene.hotspots.filter((h) => evalCondition(h.if, run)) : []
  const buildKey = JSON.stringify([run.sceneId, t.tod, t.segment, visible.map((h) => h.id), run.mazes, run.flags, Object.keys(run.solved)])
  useEffect(() => {
    const w = worldRef.current
    if (!w || !scene) return
    w.build(scene, useGame.getState().run, visible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildKey])

  // Chuyển cảnh (kể cả mỗi bước trên đường làng): người chơi về chỗ xuất phát.
  useEffect(() => {
    worldRef.current?.placePlayerAtSpawn()
  }, [transitionKey])

  useEffect(() => {
    worldRef.current?.setPaused(busy)
    if (busy) {
      input.current.moveX = 0
      input.current.moveY = 0
    }
  }, [busy])

  useEffect(() => {
    worldRef.current?.setSpeaker(speaker)
  }, [speaker])

  // Bàn phím
  useEffect(() => {
    const held = new Set<string>()
    const sync = () => {
      let x = 0
      let y = 0
      held.forEach((k) => {
        const v = MOVE_KEYS[k]
        if (v) {
          x += v[0]
          y += v[1]
        }
      })
      input.current.moveX = Math.max(-1, Math.min(1, x))
      input.current.moveY = Math.max(-1, Math.min(1, y))
    }
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return
      const s = useGame.getState()
      const blocked = !!(s.dialogue || s.says.length || s.modal || s.cards.length || s.overlay)
      if (MOVE_KEYS[e.code]) {
        if (blocked) return
        e.preventDefault()
        held.add(e.code)
        sync()
        setShowHelp(false)
      } else if ((e.code === 'KeyE' || e.code === 'KeyF') && !blocked && !e.repeat) {
        worldRef.current?.interactNearest()
      } else if (e.code === 'KeyQ') input.current.yawDelta += 0.25
      else if (e.code === 'KeyR') input.current.yawDelta -= 0.25
    }
    const up = (e: KeyboardEvent) => {
      held.delete(e.code)
      sync()
    }
    const blur = () => {
      held.clear()
      sync()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // Kéo để xoay camera, chạm/bấm để đi tới.
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') setTouch(true)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    d.moved += Math.abs(dx) + Math.abs(dy)
    d.x = e.clientX
    d.y = e.clientY
    if (d.moved > 6) {
      input.current.yawDelta -= dx * 0.006
      input.current.pitchDelta += dy * 0.004
      setShowHelp(false)
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (d && d.moved <= 6) worldRef.current?.pointerTap(e.clientX, e.clientY)
  }

  return (
    <div className={`stage3d tod-${t.tod}`}>
      <canvas
        ref={canvasRef}
        className="w3-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onContextMenu={(e) => e.preventDefault()}
      />
      <FogCanvas density={Math.min(0.45, 0.06 + t.segment * 0.035)} color={p.fog} />
      <div ref={labelsRef} className="w3-labels" aria-hidden />
      <div className="fade" key={transitionKey} style={{ background: p.fog }} />
      <div className="scene-title" key={'t' + run.sceneId}>
        {scene?.name}
      </div>

      {!busy && touch && <Joystick input={input.current} onUse={() => setShowHelp(false)} />}
      {!busy && focus && (
        <button className={`w3-action${usingItem ? ' using' : ''}`} onClick={() => worldRef.current?.interactNearest()}>
          <Icon name="hand" size={22} />
          <span>
            {!touch && <kbd>E</kbd>} {usingItem ? `Dùng lên: ${focus.label}` : `${VERB[focus.kind]}: ${focus.label}`}
          </span>
        </button>
      )}
      {!busy && showHelp && (
        <div className="w3-help" onClick={() => setShowHelp(false)}>
          {touch
            ? 'Kéo joystick để đi · Vuốt màn hình để xoay · Chạm vào người/vật để tới gần'
            : 'WASD / phím mũi tên để đi · Kéo chuột để xoay · E để tương tác · Bấm vào người/vật để tới gần'}
        </div>
      )}
    </div>
  )
}

function Joystick({ input, onUse }: { input: Input; onUse: () => void }) {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef<number | null>(null)
  const R = 48

  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    setKnob({ x: dx, y: dy })
    input.moveX = dx / R
    input.moveY = -dy / R
  }
  const release = () => {
    active.current = null
    setKnob({ x: 0, y: 0 })
    input.moveX = 0
    input.moveY = 0
  }
  useEffect(() => release, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={base}
      className="w3-joy"
      onPointerDown={(e) => {
        active.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        onUse()
        update(e)
      }}
      onPointerMove={(e) => active.current === e.pointerId && update(e)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="w3-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
