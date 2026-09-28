import { useState } from 'react'
import type { ClueEntry } from '../engine/state'
import { registry, useGame } from '../game'
import { Icon } from './icons'
import { Modal } from './Modal'

export function ClueLine({ entry, onToggle, selectable, selected, onSelect }: { entry: ClueEntry; onToggle?: () => void; selectable?: boolean; selected?: boolean; onSelect?: () => void }) {
  const def = registry.clues[entry.id]
  if (!def) return null
  const src = def.source ? registry.characters[def.source] : undefined
  const body = (
    <>
      <div className="clue-meta">
        <span className={`clue-kind ${def.kind}`}>{def.kind === 'testimony' ? 'Lời khai' : 'Quan sát'}</span>
        {src && <span className="clue-src" style={{ color: src.color }}>{src.name}</span>}
        <span className="clue-when">
          {entry.at.label}
          {entry.at.loop > 1 ? ` · lần ${entry.at.loop}` : ''}
        </span>
      </div>
      <div className="clue-text">{def.kind === 'testimony' ? `“${def.text}”` : def.text}</div>
    </>
  )
  if (selectable) {
    return (
      <label className={`clue selectable${selected ? ' selected' : ''}${entry.suspicious ? ' suspicious' : ''}`}>
        <input type="checkbox" checked={!!selected} onChange={onSelect} />
        <div className="clue-main">{body}</div>
      </label>
    )
  }
  return (
    <div className={`clue${entry.suspicious ? ' suspicious' : ''}`}>
      <div className="clue-main">{body}</div>
      {onToggle && (
        <button className={`suspect-btn${entry.suspicious ? ' on' : ''}`} onClick={onToggle} title="Đánh dấu nghi ngờ">
          <Icon name="flag" size={18} />
          <span>{entry.suspicious ? 'Nghi ngờ' : 'Đánh dấu'}</span>
        </button>
      )}
    </div>
  )
}

export function Notebook() {
  const run = useGame((s) => s.run)
  const close = useGame((s) => s.closeModal)
  const toggle = useGame((s) => s.toggleSuspicious)
  const curArea = registry.scenes[run.sceneId]?.area ?? registry.areas[0].id
  const [tab, setTab] = useState<string>(curArea)
  const [onlySus, setOnlySus] = useState(false)

  const entries = run.clues.filter((c) => registry.clues[c.id]?.area === tab && (!onlySus || c.suspicious))

  return (
    <Modal title="Sổ tay manh mối" onClose={close} wide>
      <div className="tabs" role="tablist">
        {registry.areas.map((a) => {
          const n = run.clues.filter((c) => registry.clues[c.id]?.area === a.id).length
          return (
            <button key={a.id} className={`tab${tab === a.id ? ' on' : ''}`} onClick={() => setTab(a.id)} role="tab">
              {a.name}
              {n > 0 && <span className="tab-n">{n}</span>}
            </button>
          )
        })}
        <button className={`tab${tab === 'mistakes' ? ' on' : ''}`} onClick={() => setTab('mistakes')} role="tab">
          Bài học
          {run.mistakes.length > 0 && <span className="tab-n">{run.mistakes.length}</span>}
        </button>
      </div>
      {tab === 'mistakes' ? (
        <div className="clue-list">
          {run.mistakes.length === 0 && <p className="empty">Bạn chưa bị lừa lần nào. Giữ vững nhé.</p>}
          {run.mistakes.map((m, i) => (
            <div key={i} className="clue mistake-line">
              <div className="clue-main">
                <div className="clue-meta">
                  <span className="clue-kind mistake">{registry.fallacies[m.fallacy].name}</span>
                  <span className="clue-when">
                    {m.at.label}
                    {m.at.loop > 1 ? ` · lần ${m.at.loop}` : ''}
                  </span>
                </div>
                <div className="clue-text">{m.explain.split('\n\n')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="notebook-tools">
            <span className="area-skill">Kỹ năng: {registry.areaById[tab]?.skill}</span>
            <label className="check">
              <input type="checkbox" checked={onlySus} onChange={(e) => setOnlySus(e.target.checked)} /> Chỉ dòng nghi ngờ
            </label>
          </div>
          <div className="clue-list">
            {entries.length === 0 && <p className="empty">Chưa có ghi chép nào ở khu vực này.</p>}
            {entries.map((e) => (
              <ClueLine key={e.id} entry={e} onToggle={() => toggle(e.id)} />
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
