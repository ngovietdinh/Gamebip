import { useState } from 'react'
import { Background } from '../art/backgrounds'
import { FogCanvas } from '../art/FogCanvas'
import { paletteFor } from '../art/palette'
import { useMeta } from '../engine/meta'
import { SLOT_IDS, slotMeta } from '../engine/save'
import { useGame } from '../game'
import { AchievementsPanel } from './AchievementsPanel'
import { Modal } from './Modal'
import { SaveLoad } from './SaveLoad'
import { SettingsPanel } from './SettingsPanel'

type Panel = null | 'load' | 'achievements' | 'settings' | 'confirmNew'

export function TitleScreen() {
  const newGame = useGame((s) => s.newGame)
  const [panel, setPanel] = useState<Panel>(null)
  const endings = useMeta((s) => s.endingsSeen.length)
  const hasSave = SLOT_IDS.some((s) => slotMeta(s))
  const p = paletteFor('sang')

  return (
    <div className="title-screen">
      <div className="title-bg">
        <Background art="market" p={p} />
        <FogCanvas density={0.75} color={p.fog} />
      </div>
      <div className="title-inner">
        <h1 className="logo">
          <span className="logo-top">Làng</span>
          <span className="logo-main">Sương Mù</span>
        </h1>
        <p className="tagline">Sương sẽ tan sau 3 ngày. Ai còn kẹt trong làng lúc đó sẽ ở lại mãi mãi.</p>
        <nav className="title-menu">
          <button className="btn primary big" onClick={() => (slotMeta('auto') ? setPanel('confirmNew') : newGame())}>
            Chơi mới
          </button>
          <button className="btn big" disabled={!hasSave} onClick={() => setPanel('load')}>
            Tiếp tục
          </button>
          <button className="btn big" onClick={() => setPanel('achievements')}>
            Thành tựu
          </button>
          <button className="btn big" onClick={() => setPanel('settings')}>
            Cài đặt
          </button>
        </nav>
        <p className="title-foot">
          Kết thúc đã mở: {endings}/4 · Chạm để chơi, nên đeo tai nghe
        </p>
      </div>

      {panel === 'load' && (
        <Modal title="Tiếp tục" onClose={() => setPanel(null)}>
          <SaveLoad mode="load" onLoaded={() => setPanel(null)} />
        </Modal>
      )}
      {panel === 'achievements' && (
        <Modal title="Thành tựu" onClose={() => setPanel(null)}>
          <AchievementsPanel />
        </Modal>
      )}
      {panel === 'settings' && (
        <Modal title="Cài đặt" onClose={() => setPanel(null)}>
          <SettingsPanel />
        </Modal>
      )}
      {panel === 'confirmNew' && (
        <Modal title="Chơi mới?" onClose={() => setPanel(null)}>
          <p>Bắt đầu lại từ đầu sẽ ghi đè ô tự động lưu. Các ô lưu 1–3 vẫn được giữ nguyên.</p>
          <div className="row">
            <button className="btn primary" onClick={newGame}>
              Chơi mới
            </button>
            <button className="btn ghost" onClick={() => setPanel(null)}>
              Thôi
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
