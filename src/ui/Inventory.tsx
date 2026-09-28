import { useState } from 'react'
import { VillageMap } from '../art/VillageMap'
import { segmentOf } from '../engine/time'
import { registry, useGame } from '../game'
import { Icon } from './icons'
import { Modal } from './Modal'

export function Inventory() {
  const run = useGame((s) => s.run)
  const close = useGame((s) => s.closeModal)
  const selectItem = useGame((s) => s.selectItem)
  const viewItem = useGame((s) => s.viewItem)
  const [sel, setSel] = useState<string | null>(run.inventory[0] ?? null)
  const [viewing, setViewing] = useState(false)
  const item = sel ? registry.items[sel] : null
  const stamp = item?.driftFrom ? run.flags[item.driftFrom] : undefined
  const drift = stamp === undefined ? 0 : segmentOf(run.actions) - Number(stamp)

  return (
    <Modal title="Túi đồ" onClose={close} wide>
      {run.inventory.length === 0 ? (
        <p className="empty">Túi đồ trống trơn. Chỉ có cuốn sổ tay trong túi áo.</p>
      ) : (
        <div className="inventory">
          <div className="inv-grid">
            {run.inventory.map((id) => {
              const it = registry.items[id]
              return (
                <button
                  key={id}
                  className={`inv-slot${sel === id ? ' on' : ''}`}
                  onClick={() => {
                    setSel(id)
                    setViewing(false)
                  }}
                >
                  <Icon name={it?.icon ?? 'bag'} size={32} />
                  <span>{it?.name ?? id}</span>
                </button>
              )
            })}
          </div>
          {item && (
            <div className="inv-detail">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="row">
                {item.view && (
                  <button
                    className="btn"
                    onClick={() => {
                      setViewing(true)
                      viewItem(item.id)
                    }}
                  >
                    Xem
                  </button>
                )}
                <button className="btn primary" onClick={() => selectItem(item.id)}>
                  <Icon name="hand" size={18} /> Dùng lên…
                </button>
              </div>
              {viewing && item.view === 'map' && (
                <div className="map-view">
                  <VillageMap drift={drift} />
                  <p className="hint">Mực trên giấy dường như khẽ trôi mỗi khi bạn không nhìn.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
