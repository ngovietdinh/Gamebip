import type { CSSProperties } from 'react'
import { assetUrl } from '../art/assets'
import { Background } from '../art/backgrounds'
import { CharacterSvg } from '../art/characters'
import { FogCanvas } from '../art/FogCanvas'
import { ObjectSvg } from '../art/objects'
import { evalCondition } from '../engine/conditions'
import type { Hotspot } from '../engine/types'
import { registry, useGame } from '../game'
import { usePalette, usePortrait } from './useView'

function place(x: number, y: number, w: number, h: number, widen: number): CSSProperties {
  const ww = Math.min(100, w * widen)
  const cx = x + w / 2
  const left = Math.max(0, Math.min(100 - ww, cx - ww / 2))
  return { left: `${left}%`, top: `${y}%`, width: `${ww}%`, height: `${h}%` }
}

const ORDER: Record<Hotspot['kind'], number> = { object: 0, character: 1, exit: 2 }

export function Stage() {
  const run = useGame((s) => s.run)
  const clickHotspot = useGame((s) => s.clickHotspot)
  const transitionKey = useGame((s) => s.transitionKey)
  const usingItem = useGame((s) => s.usingItem)
  const speaker = useGame((s) => {
    if (s.dialogue) return registry.dialogues[s.dialogue.id]?.nodes[s.dialogue.node]?.speaker
    return s.says[0]?.speaker
  })
  const busy = useGame((s) => !!(s.dialogue || s.says.length || s.modal || s.cards.length))
  const { p, t } = usePalette()
  const portrait = usePortrait()
  const scene = registry.scenes[run.sceneId]
  if (!scene) return null
  const ctx = { p, run, reg: registry, props: {} }
  const fogDensity = Math.min(1, 0.35 + t.segment * 0.06)

  const renderHotspot = (h: Hotspot) => {
    const widen = portrait ? (h.kind === 'character' ? 1.6 : h.kind === 'exit' && h.sprite?.startsWith('exit') ? 1.3 : 1.35) : 1
    const ch = h.character ? registry.characters[h.character] : undefined
    const talking = !!h.character && h.character === speaker
    return (
      <button
        key={h.id}
        className={`hotspot hs-${h.kind}${talking ? ' talking' : ''}${usingItem ? ' using' : ''}`}
        style={place(h.x, h.y, h.w, h.h, widen)}
        onClick={() => clickHotspot(h)}
        disabled={busy}
        aria-label={h.label}
      >
        <span className={`hs-art${h.flip ? ' flip' : ''}`}>
          {ch ? (
            ch.image ? (
              <img src={assetUrl(ch.image)} alt="" />
            ) : (
              <CharacterSvg sprite={ch.sprite} p={p} className="hs-svg" />
            )
          ) : h.sprite ? (
            <ObjectSvg sprite={h.sprite} ctx={ctx} className="hs-svg" />
          ) : null}
        </span>
        <span className="hs-label">{h.label}</span>
      </button>
    )
  }

  return (
    <div className={`stage tod-${t.tod}${t.pastDeadline ? ' day4' : ''}`}>
      <div className="stage-bg">
        {scene.image ? <img className="bg-img" src={assetUrl(scene.image)} alt="" /> : <Background art={scene.art} p={p} />}
      </div>
      {(scene.decor ?? [])
        .filter((d) => evalCondition(d.if, run))
        .map((d, i) => (
          <div key={i} className={`decor${d.flip ? ' flip' : ''}`} style={place(d.x, d.y, d.w, d.h, 1)}>
            <ObjectSvg sprite={d.sprite} ctx={{ ...ctx, props: d.props ?? {} }} className="hs-svg" />
          </div>
        ))}
      <FogCanvas density={fogDensity} color={p.fog} />
      <div className="hotspots">
        {scene.hotspots
          .filter((h) => evalCondition(h.if, run))
          // Vẽ đồ vật trước, rồi nhân vật, lối đi sau cùng để luôn bấm được.
          .sort((a, b) => ORDER[a.kind] - ORDER[b.kind])
          .map(renderHotspot)}
      </div>
      <div className="stage-tint" />
      <div className="fade" key={transitionKey} style={{ background: p.fog }} />
      <div className="scene-title" key={'t' + run.sceneId}>
        {scene.name}
      </div>
    </div>
  )
}
