import { synth } from '../audio/synth'
import { useMeta } from '../engine/meta'
import { ACTIONS_PER_SEGMENT, TOD_LABEL } from '../engine/time'
import { useGame } from '../game'
import { Icon } from './icons'
import { usePalette } from './useView'

export function HUD() {
  const sanity = useGame((s) => s.run.sanity)
  const loop = useGame((s) => s.run.loop)
  const clueCount = useGame((s) => s.run.clues.length)
  const itemCount = useGame((s) => s.run.inventory.length)
  const openModal = useGame((s) => s.openModal)
  const muted = useMeta((s) => s.settings.muted)
  const setSettings = useMeta((s) => s.setSettings)
  const { t } = usePalette()
  const urgent = !t.pastDeadline && t.day === 3 && t.tod === 'toi'

  return (
    <header className="hud">
      <div className={`hud-time${urgent ? ' urgent' : ''}${t.pastDeadline ? ' day4' : ''}`} title="Thời gian trong làng">
        <span className={`tod-dot tod-${t.tod}`} />
        <span className="hud-time-label">{t.pastDeadline ? 'Ngày 4' : `Ngày ${t.day} · ${TOD_LABEL[t.tod]}`}</span>
        {!t.pastDeadline && (
          <span className="hud-ticks" aria-label={`Đã dùng ${t.actionsInSegment}/${ACTIONS_PER_SEGMENT} hành động của buổi`}>
            {Array.from({ length: ACTIONS_PER_SEGMENT }, (_, i) => (
              <i key={i} className={i < t.actionsInSegment ? 'on' : ''} />
            ))}
          </span>
        )}
      </div>
      <div className="hud-sanity" title="Điểm Tỉnh táo">
        <Icon name="brain" size={18} />
        <div className="sanity-bar">
          <div className="sanity-fill" style={{ width: `${sanity}%` }} />
        </div>
        <span className="sanity-num">{sanity}</span>
      </div>
      {loop > 1 && <div className="hud-loop">Lần thứ {loop}</div>}
      <nav className="hud-buttons">
        <button className="hud-btn" onClick={() => openModal({ type: 'notebook' })} aria-label="Sổ tay">
          <Icon name="notebook" />
          <span className="hud-btn-label">Sổ tay</span>
          {clueCount > 0 && <span className="badge">{clueCount}</span>}
        </button>
        <button className="hud-btn" onClick={() => openModal({ type: 'inventory' })} aria-label="Túi đồ">
          <Icon name="bag" />
          <span className="hud-btn-label">Túi đồ</span>
          {itemCount > 0 && <span className="badge">{itemCount}</span>}
        </button>
        <button
          className="hud-btn"
          onClick={() => {
            setSettings({ muted: !muted })
            synth.unlock()
          }}
          aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}
        >
          <Icon name={muted ? 'mute' : 'sound'} />
        </button>
        <button className="hud-btn" onClick={() => openModal({ type: 'menu' })} aria-label="Cài đặt">
          <Icon name="gear" />
          <span className="hud-btn-label">Cài đặt</span>
        </button>
      </nav>
    </header>
  )
}
