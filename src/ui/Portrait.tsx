import { CharacterSvg } from '../art/characters'
import { assetUrl } from '../art/assets'
import type { Palette } from '../art/palette'
import { registry } from '../game'

export function Portrait({ speaker, p }: { speaker?: string; p: Palette }) {
  const c = speaker ? registry.characters[speaker] : undefined
  if (!c || c.sprite === 'none') return null
  return (
    <div className="portrait" style={{ background: `linear-gradient(180deg, ${p.skyBottom}, ${p.fog})` }}>
      {c.image ? <img src={assetUrl(c.image)} alt={c.name} /> : <CharacterSvg sprite={c.sprite} p={p} className="portrait-svg" />}
    </div>
  )
}
