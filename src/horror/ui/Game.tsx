import { useEffect, useRef, useState } from 'react'
import { hAudio } from '../audio'
import { ITEMS } from '../content'
import { useHorror } from '../store'
import { HorrorWorld, type HorrorInput, type WorldHud } from '../World'
import { ExamineView, FrontChoice, Intro, Inventory, Journal, Keypad, MirrorView, NoteView, Pause, PhotoView } from './Panels'

const KEYS: Record<string, [number, number]> = {
  KeyW: [1, 0],
  ArrowUp: [1, 0],
  KeyS: [-1, 0],
  ArrowDown: [-1, 0],
  KeyA: [0, -1],
  ArrowLeft: [0, -1],
  KeyD: [0, 1],
  ArrowRight: [0, 1],
}

const isTouch = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<HorrorWorld | null>(null)
  const input = useRef<HorrorInput>({ forward: 0, right: 0, sprint: false, lookDX: 0, lookDY: 0 })
  const [hud, setHud] = useState<WorldHud>({ bpm: 70, prompt: null, confront: -1, danger: 0, hiding: false })
  const [scare, setScare] = useState<null | 'catch' | 'mirror' | 'faint' | 'flash'>(null)
  const [touch] = useState(isTouch)
  const [locked, setLocked] = useState(false)
  const modal = useHorror((s) => s.modal)
  const quality = useHorror((s) => s.settings.quality)
  const reduce = useHorror((s) => s.settings.reduceScares)

  useEffect(() => {
    if (!canvasRef.current) return
    hAudio.unlock()
    hAudio.setActive(true)
    hAudio.reduce = useHorror.getState().settings.reduceScares
    hAudio.setVolume(useHorror.getState().settings.volume)
    let w: HorrorWorld
    try {
      w = new HorrorWorld(
        canvasRef.current,
        input.current,
        {
          hud: setHud,
          scare: (k) => {
            setScare(k)
            window.setTimeout(() => setScare(null), k === 'catch' ? 1400 : k === 'faint' ? 1700 : k === 'mirror' ? 850 : 250)
          },
        },
        quality,
      )
    } catch (e) {
      console.error(e)
      useHorror.getState().say('Trình duyệt không hỗ trợ WebGL — không thể dựng thế giới 3D.')
      return
    }
    worldRef.current = w
    ;(window as unknown as { __horror?: unknown }).__horror = { world: w, store: useHorror }
    const onResize = () => w.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      w.dispose()
      worldRef.current = null
      hAudio.setActive(false)
    }
  }, [quality])

  // Khi mở bảng: nhả chuột; mất khóa chuột giữa lúc chơi: tạm dừng.
  useEffect(() => {
    if (modal && document.pointerLockElement) document.exitPointerLock()
    input.current.forward = 0
    input.current.right = 0
  }, [modal])
  useEffect(() => {
    const onLock = () => {
      const isLocked = document.pointerLockElement === canvasRef.current
      setLocked(isLocked)
      const s = useHorror.getState()
      if (!isLocked && !s.modal && s.screen === 'play' && !touch) s.openModal({ type: 'pause' })
    }
    document.addEventListener('pointerlockchange', onLock)
    return () => document.removeEventListener('pointerlockchange', onLock)
  }, [touch])

  // Bàn phím
  useEffect(() => {
    const held = new Set<string>()
    const sync = () => {
      let f = 0
      let r = 0
      held.forEach((k) => {
        const v = KEYS[k]
        if (v) {
          f += v[0]
          r += v[1]
        }
      })
      input.current.forward = Math.max(-1, Math.min(1, f))
      input.current.right = Math.max(-1, Math.min(1, r))
      input.current.sprint = held.has('ShiftLeft') || held.has('ShiftRight')
    }
    const down = (e: KeyboardEvent) => {
      const s = useHorror.getState()
      if (s.screen !== 'play') return
      if (s.modal) {
        if ((e.code === 'Tab' && s.modal.type === 'inventory') || (e.code === 'KeyJ' && s.modal.type === 'journal')) {
          e.preventDefault()
          s.openModal(null)
        }
        return
      }
      if (KEYS[e.code] || e.code.startsWith('Shift')) {
        held.add(e.code)
        sync()
        if (KEYS[e.code]) e.preventDefault()
        return
      }
      if (e.repeat) return
      if (e.code === 'KeyE') worldRef.current?.interact()
      else if (e.code === 'KeyF') {
        s.toggleLight()
        hAudio.click()
      } else if (e.code === 'Tab' || e.code === 'KeyI') {
        e.preventDefault()
        s.openModal({ type: 'inventory' })
      } else if (e.code === 'KeyJ') s.openModal({ type: 'journal' })
      else if (/^Digit[1-4]$/.test(e.code)) s.useSlot(Number(e.code.slice(5)) - 1)
      else if (e.code === 'Escape') s.openModal({ type: 'pause' })
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

  // Chuột (khóa con trỏ) và vuốt nhìn trên cảm ứng
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    hAudio.unlock()
    if (e.pointerType === 'mouse') {
      if (!document.pointerLockElement && !useHorror.getState().modal) canvasRef.current?.requestPointerLock?.()
      return
    }
    look.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      if (document.pointerLockElement) {
        input.current.lookDX += e.movementX
        input.current.lookDY += e.movementY
      }
      return
    }
    const l = look.current
    if (!l || l.id !== e.pointerId) return
    input.current.lookDX += (e.clientX - l.x) * 1.6
    input.current.lookDY += (e.clientY - l.y) * 1.6
    l.x = e.clientX
    l.y = e.clientY
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (look.current?.id === e.pointerId) look.current = null
  }

  return (
    <div className="hz-game">
      <canvas
        ref={canvasRef}
        className="hz-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <Effects danger={hud.danger} />
      {hud.hiding && <div className="hz-slats" />}
      <Hud hud={hud} touch={touch} />
      {!modal && !touch && !locked && <div className="hz-clickhint">Bấm vào màn hình để điều khiển bằng chuột</div>}
      {touch && !modal && <TouchControls input={input.current} onInteract={() => worldRef.current?.interact()} />}
      {hud.prompt && !modal && (
        <button className="hz-prompt" onClick={() => worldRef.current?.interact()}>
          {!touch && <kbd>E</kbd>} {hud.prompt}
        </button>
      )}
      {hud.confront >= 0 && (
        <div className="hz-confront">
          <span>Soi đèn thẳng vào nó — đừng chớp mắt</span>
          <div className="bar">
            <i style={{ width: `${Math.min(100, hud.confront * 100)}%` }} />
          </div>
        </div>
      )}
      {scare && <Scare kind={scare} reduce={reduce} />}
      <Modal touch={touch} />
    </div>
  )
}

function Modal({ touch }: { touch: boolean }) {
  const modal = useHorror((s) => s.modal)
  if (!modal) return null
  switch (modal.type) {
    case 'keypad':
      return <Keypad puzzle={modal.puzzle} />
    case 'note':
      return <NoteView note={modal.note} />
    case 'photo':
      return <PhotoView photo={modal.photo} />
    case 'examine':
      return <ExamineView title={modal.title} text={modal.text} />
    case 'mirror':
      return <MirrorView />
    case 'inventory':
      return <Inventory />
    case 'journal':
      return <Journal />
    case 'pause':
      return <Pause />
    case 'frontChoice':
      return <FrontChoice />
    case 'intro':
      return <Intro touch={touch} />
  }
}

function Hud({ hud, touch }: { hud: WorldHud; touch: boolean }) {
  const hp = useHorror((s) => s.hp)
  const battery = useHorror((s) => Math.round(s.battery))
  const sanity = useHorror((s) => Math.round(s.sanity))
  const stamina = useHorror((s) => Math.round(s.stamina))
  const exhausted = useHorror((s) => s.exhausted)
  const lightOn = useHorror((s) => s.lightOn)
  const hasLight = useHorror((s) => s.hasFlashlight)
  const inv = useHorror((s) => s.inventory)
  const frags = useHorror((s) => s.fragments.length)
  const msgs = useHorror((s) => s.messages)
  const open = useHorror((s) => s.openModal)
  const use = useHorror((s) => s.useSlot)
  return (
    <>
      <div className="hz-hud">
        <div className="hz-hearts" aria-label={`Máu ${hp}/3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < hp ? 'on' : ''}>
              ♥
            </span>
          ))}
        </div>
        <div className="hz-meter" title="Tinh thần">
          <span className="lb">Tinh thần</span>
          <div className="bar sanity">
            <i style={{ width: `${sanity}%` }} />
          </div>
          <span className="v">{sanity}</span>
        </div>
        {hasLight && (
          <div className={`hz-meter${battery < 15 ? ' low' : ''}`} title="Pin đèn">
            <span className="lb">🔦 {lightOn ? 'Bật' : 'Tắt'}</span>
            <div className="bar battery">
              <i style={{ width: `${battery}%` }} />
            </div>
            <span className="v">{battery}%</span>
          </div>
        )}
        <div className="hz-bpm" style={{ animationDuration: `${60 / hud.bpm}s` }}>
          ❤ <span>{hud.bpm}</span> bpm
        </div>
        <div className="hz-frags">Ký ức {frags}/4</div>
      </div>
      {touch && (
        <div className="hz-topbtns">
          <button onClick={() => open({ type: 'journal' })} aria-label="Nhật ký">
            📓
          </button>
          <button onClick={() => open({ type: 'pause' })} aria-label="Tạm dừng">
            ⏸
          </button>
        </div>
      )}
      <div className="hz-msgs">
        {msgs.map((m) => (
          <div key={m.id} className="hz-msg">
            {m.text}
          </div>
        ))}
      </div>
      <div className="hz-crosshair" />
      {(stamina < 99 || exhausted) && (
        <div className={`hz-stamina${exhausted ? ' ex' : ''}`}>
          <i style={{ width: `${stamina}%` }} />
        </div>
      )}
      <div className="hz-quick">
        {inv.map((it, i) => (
          <button key={i} className="hz-slot" onClick={() => (it ? use(i) : open({ type: 'inventory' }))} title={it ? ITEMS[it].name : 'Trống'}>
            <span className="n">{i + 1}</span>
            {it && <span className="ic">{ITEMS[it].icon}</span>}
          </button>
        ))}
        {touch && (
          <button className="hz-slot" onClick={() => open({ type: 'inventory' })} aria-label="Túi đồ">
            🎒
          </button>
        )}
      </div>
    </>
  )
}

function Effects({ danger }: { danger: number }) {
  const sanity = useHorror((s) => Math.round(s.sanity))
  const hp = useHorror((s) => s.hp)
  const low = Math.max(0, (60 - sanity) / 60)
  return (
    <>
      <div className="hz-vignette" style={{ opacity: 0.55 + low * 0.45 }} />
      <div className="hz-danger" style={{ opacity: danger * 0.55 + (hp === 1 ? 0.15 : 0) }} />
      <div className="hz-grain" style={{ opacity: 0.08 + low * 0.25 }} />
      {sanity < 35 && <div className="hz-warp" style={{ opacity: (35 - sanity) / 35 }} />}
    </>
  )
}

function Scare({ kind, reduce }: { kind: 'catch' | 'mirror' | 'faint' | 'flash'; reduce: boolean }) {
  if (kind === 'faint') return <div className="hz-faint" />
  if (kind === 'flash') return <div className="hz-flash" />
  if (reduce) return <div className="hz-redflash" />
  return (
    <div className={`hz-scare ${kind}`}>
      <svg viewBox="0 0 200 260" className="hz-face" aria-hidden>
        <defs>
          <radialGradient id="fc" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#f2eee6" />
            <stop offset="0.7" stopColor="#bdb6a8" />
            <stop offset="1" stopColor="#5a554c" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="130" rx="78" ry="112" fill="url(#fc)" />
        {/* Những chỗ lõm nơi đáng lẽ là mắt, mũi, miệng */}
        <ellipse cx="68" cy="112" rx="18" ry="9" fill="#8c867a" opacity="0.5" />
        <ellipse cx="132" cy="112" rx="18" ry="9" fill="#8c867a" opacity="0.5" />
        <path d="M70 185 Q100 200 130 185" stroke="#7a7468" strokeWidth="5" fill="none" opacity="0.45" />
      </svg>
    </div>
  )
}

function TouchControls({ input, onInteract }: { input: HorrorInput; onInteract: () => void }) {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [run, setRun] = useState(false)
  const active = useRef<number | null>(null)
  const toggleLight = useHorror((s) => s.toggleLight)
  const R = 50
  const upd = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    setKnob({ x: dx, y: dy })
    input.forward = -dy / R
    input.right = dx / R
  }
  const release = () => {
    active.current = null
    setKnob({ x: 0, y: 0 })
    input.forward = 0
    input.right = 0
  }
  useEffect(() => {
    input.sprint = run
  }, [run, input])
  useEffect(() => release, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div
        ref={base}
        className="hz-joy"
        onPointerDown={(e) => {
          e.stopPropagation()
          active.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          upd(e)
        }}
        onPointerMove={(e) => active.current === e.pointerId && upd(e)}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="hz-tbtns">
        <button onClick={() => (toggleLight(), hAudio.click())} aria-label="Đèn pin">
          🔦
        </button>
        <button className={run ? 'on' : ''} onClick={() => setRun(!run)} aria-label="Chạy">
          🏃
        </button>
        <button className="act" onClick={onInteract} aria-label="Tương tác">
          ✋
        </button>
      </div>
    </>
  )
}

