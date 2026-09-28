import { useState } from 'react'
import { deleteSlot, SLOT_IDS, slotMeta, type SlotId } from '../engine/save'
import { useGame } from '../game'

function fmt(ts: number) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SaveLoad({ mode, onLoaded }: { mode: 'save' | 'load'; onLoaded?: () => void }) {
  const saveSlot = useGame((s) => s.saveSlot)
  const loadSlot = useGame((s) => s.loadSlot)
  const [, bump] = useState(0)
  const [msg, setMsg] = useState('')
  const slots = SLOT_IDS.filter((s) => mode === 'load' || s !== 'auto')

  return (
    <div className="slots">
      {slots.map((id: SlotId) => {
        const m = slotMeta(id)
        return (
          <div key={id} className="slot">
            <div className="slot-info">
              <strong>{id === 'auto' ? 'Tự động lưu' : `Ô ${id}`}</strong>
              {m ? (
                <span>
                  {m.sceneName} · {m.timeLabel} · Tỉnh táo {m.sanity}
                  {m.loop > 1 ? ` · Lần ${m.loop}` : ''} · <em>{fmt(m.savedAt)}</em>
                </span>
              ) : (
                <span className="muted">Trống</span>
              )}
            </div>
            <div className="row">
              {mode === 'save' ? (
                <button
                  className="btn primary"
                  onClick={() => {
                    saveSlot(id)
                    bump((x) => x + 1)
                  }}
                >
                  Lưu
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={!m}
                  onClick={() => {
                    if (loadSlot(id)) onLoaded?.()
                    else setMsg('Không tải được bản lưu này.')
                  }}
                >
                  Tải
                </button>
              )}
              {m && id !== 'auto' && (
                <button
                  className="btn ghost"
                  onClick={() => {
                    deleteSlot(id)
                    bump((x) => x + 1)
                  }}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        )
      })}
      {msg && <p className="error">{msg}</p>}
    </div>
  )
}
