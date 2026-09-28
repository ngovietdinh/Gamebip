import { useEffect, useState } from 'react'
import { hAudio } from '../audio'
import { FRAGMENTS } from '../content'
import { ACHIEVEMENTS, useHorror } from '../store'
import { Game } from './Game'
import { AchievementsList, Panel, SettingsForm } from './Panels'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m} phút ${String(s).padStart(2, '0')} giây`
}

function Title() {
  const newGame = useHorror((s) => s.newGame)
  const cont = useHorror((s) => s.continueGame)
  const hasCp = useHorror((s) => !!s.checkpoint)
  const [panel, setPanel] = useState<null | 'settings' | 'ach'>(null)
  return (
    <div className="hz-title">
      <div className="hz-title-bg" />
      <div className="hz-title-inner">
        <h1 className="hz-logo">
          <span>3:17</span>
          <small>Kẻ Không Mặt</small>
        </h1>
        <p className="hz-tag">Có những nỗi sợ ta đã quên. Nhưng chúng không quên ta.</p>
        <nav className="hz-menu">
          <button
            className="hz-btn primary big"
            onClick={() => {
              hAudio.unlock()
              newGame()
            }}
          >
            Chơi mới
          </button>
          <button
            className="hz-btn big"
            disabled={!hasCp}
            onClick={() => {
              hAudio.unlock()
              cont()
            }}
          >
            Tiếp tục từ điểm lưu
          </button>
          <button className="hz-btn big" onClick={() => setPanel('ach')}>
            Thành tựu
          </button>
          <button className="hz-btn big" onClick={() => setPanel('settings')}>
            Cài đặt
          </button>
        </nav>
        <p className="hz-warn">
          ⚠ Kinh dị tâm lý · âm thanh đột ngột · hình ảnh chớp nháy. Khuyến nghị 13+. Nên đeo tai nghe và chơi trong phòng tối.
          <br />
          Có tùy chọn <b>Giảm hù dọa</b> trong Cài đặt.
        </p>
        <a className="hz-back" href="../">
          ← Về game Làng Sương Mù
        </a>
      </div>
      {panel === 'settings' && (
        <Panel title="Cài đặt" onClose={() => setPanel(null)}>
          <SettingsForm />
        </Panel>
      )}
      {panel === 'ach' && (
        <Panel title="Thành tựu" onClose={() => setPanel(null)}>
          <AchievementsList />
        </Panel>
      )}
    </div>
  )
}

function GameOver() {
  const retry = useHorror((s) => s.retry)
  const toTitle = useHorror((s) => s.toTitle)
  return (
    <div className="hz-end over">
      <div className="hz-end-card">
        <div className="kicker">Kết thúc</div>
        <h1>Mãi trong giấc mơ</h1>
        <p>Bạn không còn phân biệt được đâu là mơ, đâu là thật. Căn nhà khép lại quanh bạn như một cái tủ quần áo tối om.</p>
        <p>Đồng hồ vẫn chỉ 3 giờ 17 phút.</p>
        <div className="hz-row">
          <button className="hz-btn primary big" onClick={retry}>
            Thử lại từ điểm lưu
          </button>
          <button className="hz-btn" onClick={toTitle}>
            Màn hình chính
          </button>
        </div>
      </div>
    </div>
  )
}

function Ending() {
  const ending = useHorror((s) => s.ending)
  const stats = useHorror((s) => s.stats)
  const frags = useHorror((s) => s.fragments.length)
  const sanity = useHorror((s) => Math.round(s.sanity))
  const got = useHorror((s) => s.achievements)
  const newGame = useHorror((s) => s.newGame)
  const toTitle = useHorror((s) => s.toTitle)
  const trueEnd = ending === 'true'
  return (
    <div className={`hz-end ${trueEnd ? 'true' : 'escape'}`}>
      <div className="hz-end-card">
        <div className="kicker">{trueEnd ? 'Kết thật — Đối mặt' : 'Kết thúc — Tỉnh giấc'}</div>
        <h1>{trueEnd ? 'Đứa trẻ trong tủ' : 'Ba giờ mười tám'}</h1>
        {trueEnd ? (
          <>
            <p>Bạn giữ chặt ánh đèn. Kẻ Không Mặt lùi lại từng bước, co rúm, nhỏ dần… cho tới khi chỉ còn một đứa trẻ ngồi thu lu trong góc tủ quần áo, hai tay bịt tai.</p>
            <p>Đứa trẻ ấy là bạn. Của năm ấy. Của đêm ấy.</p>
            <p>Bạn ngồi xuống cạnh nó. "Không phải lỗi của mình đâu." Lần đầu tiên sau nhiều năm, bóng tối chỉ là bóng tối.</p>
            <p>Bạn tỉnh dậy. Đồng hồ nhảy sang 3 giờ 18 phút. Rồi 3 giờ 19. Thời gian lại trôi.</p>
          </>
        ) : (
          <>
            <p>Cánh cửa bật mở. Ánh sáng trắng xóa. Bạn ngồi bật dậy trên giường, mồ hôi ướt đẫm lưng áo.</p>
            <p>Đồng hồ điện thoại: 3 giờ 18 phút. Chỉ là một giấc mơ.</p>
            {frags < FRAGMENTS.length ? (
              <p>Nhưng bạn vẫn không nhớ vì sao mình sợ bóng tối đến thế. Đêm mai, nó sẽ quay lại.</p>
            ) : (
              <p>Bạn đã nhớ ra tất cả, nhưng lại chọn bỏ chạy. Trong góc phòng tối, cánh tủ quần áo khẽ kẽo kẹt…</p>
            )}
          </>
        )}
        <dl className="hz-stats">
          <dt>Thời gian</dt>
          <dd>{fmt(stats.seconds)}</dd>
          <dt>Mảnh ký ức</dt>
          <dd>{frags}/4</dd>
          <dt>Bị bắt</dt>
          <dd>{stats.caught} lần</dd>
          <dt>Nhập sai mật mã</dt>
          <dd>{stats.wrongCodes} lần</dd>
          <dt>Tinh thần cuối</dt>
          <dd>{sanity}</dd>
        </dl>
        {!trueEnd && <p className="hz-sub">Còn một kết thúc khác, dành cho người dám quay lại.</p>}
        <h3>Thành tựu</h3>
        <ul className="hz-ach">
          {Object.entries(ACHIEVEMENTS).map(([id, a]) => (
            <li key={id} className={got.includes(id) ? 'on' : ''}>
              <strong>{got.includes(id) ? '★' : '☆'} {a.name}</strong>
              <span>{a.desc}</span>
            </li>
          ))}
        </ul>
        <div className="hz-row">
          <button className="hz-btn primary big" onClick={newGame}>
            Chơi lại
          </button>
          <button className="hz-btn" onClick={toTitle}>
            Màn hình chính
          </button>
        </div>
      </div>
    </div>
  )
}

export function HorrorApp() {
  const screen = useHorror((s) => s.screen)
  useEffect(() => {
    const unlock = () => hAudio.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])
  useEffect(() => {
    hAudio.setActive(screen === 'play')
  }, [screen])
  return (
    <div className="hz-app">
      {screen === 'title' && <Title />}
      {screen === 'play' && <Game />}
      {screen === 'gameover' && <GameOver />}
      {screen === 'ending' && <Ending />}
    </div>
  )
}
