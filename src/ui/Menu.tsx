import { useState } from 'react'
import { useGame } from '../game'
import { Modal } from './Modal'
import { SaveLoad } from './SaveLoad'
import { SettingsPanel } from './SettingsPanel'

export function Menu({ initial }: { initial?: 'settings' | 'save' | 'load' }) {
  const close = useGame((s) => s.closeModal)
  const newGame = useGame((s) => s.newGame)
  const toTitle = useGame((s) => s.toTitle)
  const [tab, setTab] = useState(initial ?? 'settings')
  const [confirm, setConfirm] = useState(false)
  return (
    <Modal title="Cài đặt" onClose={close}>
      <div className="tabs">
        <button className={`tab${tab === 'settings' ? ' on' : ''}`} onClick={() => setTab('settings')}>
          Tùy chỉnh
        </button>
        <button className={`tab${tab === 'save' ? ' on' : ''}`} onClick={() => setTab('save')}>
          Lưu
        </button>
        <button className={`tab${tab === 'load' ? ' on' : ''}`} onClick={() => setTab('load')}>
          Tải
        </button>
      </div>
      {tab === 'settings' && <SettingsPanel />}
      {tab === 'save' && <SaveLoad mode="save" />}
      {tab === 'load' && <SaveLoad mode="load" onLoaded={close} />}
      <div className="menu-actions">
        {confirm ? (
          <>
            <span>Bắt đầu lại từ đầu? Ô tự động lưu sẽ bị thay thế, các ô 1–3 vẫn giữ nguyên.</span>
            <div className="row">
              <button className="btn primary" onClick={() => newGame()}>
                Chơi mới
              </button>
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                Thôi
              </button>
            </div>
          </>
        ) : (
          <div className="row">
            <button className="btn" onClick={() => setConfirm(true)}>
              Chơi mới
            </button>
            <button className="btn ghost" onClick={toTitle}>
              Về màn hình chính
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
