import { useMeta } from '../engine/meta'
import type { EndingId } from '../engine/types'
import { registry } from '../game'
import { Icon } from './icons'

const ENDING_ORDER: EndingId[] = ['good', 'neutral', 'loop', 'hidden']

export function AchievementsPanel({ highlight = [] }: { highlight?: string[] }) {
  const unlocked = useMeta((s) => s.achievements)
  const endings = useMeta((s) => s.endingsSeen)
  return (
    <div className="achievements">
      <ul className="ach-list">
        {registry.content.achievements.map((a) => {
          const on = unlocked.includes(a.id)
          return (
            <li key={a.id} className={`ach${on ? ' on' : ''}${highlight.includes(a.id) ? ' new' : ''}`}>
              <Icon name={on ? 'trophy' : 'lock'} size={26} />
              <div>
                <strong>{a.name}</strong>
                <span>{a.description}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <h4 className="endings-title">
        Kết thúc đã mở: {endings.length}/{ENDING_ORDER.length}
      </h4>
      <ul className="ending-list">
        {ENDING_ORDER.map((id) => {
          const e = registry.content.endings[id]
          const on = endings.includes(id)
          return (
            <li key={id} className={on ? 'on' : ''}>
              <span className="ending-kicker">{e.kicker}</span>
              <span>{on ? e.title : '???'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
