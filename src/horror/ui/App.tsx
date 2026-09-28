import { useEffect, useState } from 'react'
import { hAudio } from '../audio'
import { ALL_FRAGMENTS, CHAPTERS, getChapter } from '../chapters'
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
  const cpChapter = useHorror((s) => s.checkpoint?.progress?.chapter)
  const unlocked = useHorror((s) => s.unlocked)
  const startChapter = useHorror((s) => s.startChapter)
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
            Tiếp tục{cpChapter ? ` — Chương ${getChapter(cpChapter).index}` : ' từ điểm lưu'}
          </button>
          {unlocked.length > 1 && (
            <>
              <p className="hz-sub">Chọn chương</p>
              <div className="hz-chapters">
                {CHAPTERS.filter((c) => unlocked.includes(c.id)).map((c) => (
                  <button
                    key={c.id}
                    className="hz-btn"
                    onClick={() => {
                      hAudio.unlock()
                      startChapter(c.id)
                    }}
                  >
                    {c.index}. {c.title}
                  </button>
                ))}
              </div>
            </>
          )}
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
        <p>Bạn không còn phân biệt được đâu là mơ, đâu là thật. Bóng tối khép lại quanh bạn như một cái tủ quần áo tối om.</p>
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
            <p>Đứa trẻ ấy là An. Đứa trẻ đêm bố mẹ bỏ đi, đứa trẻ bị nhốt trong kho thể dục, đứa trẻ đứng ngoài cửa phòng 306 mà không dám bước vào.</p>
            <p>Kẻ Không Mặt chưa bao giờ muốn làm hại ai. Nó là tất cả những gì An không dám nhìn thẳng — nên nó không có mặt.</p>
            <p>Bạn ngồi xuống cạnh đứa trẻ. "Không phải lỗi của mình đâu. Bà không giận. Mình không cần trốn nữa." Lần đầu tiên sau nhiều năm, bóng tối chỉ là bóng tối.</p>
            <p>Bạn tỉnh dậy. Đồng hồ nhảy sang 3 giờ 18 phút. Rồi 3 giờ 19. Thời gian lại trôi. Sáng mai, bạn sẽ ra thăm mộ bà.</p>
          </>
        ) : (
          <>
            <p>Cái bóng vỡ tan thành sương. Ánh sáng trắng xóa. Bạn ngồi bật dậy trên giường ký túc xá, mồ hôi ướt đẫm lưng áo.</p>
            <p>Đồng hồ điện thoại: 3 giờ 18 phút. Chỉ là một giấc mơ.</p>
            <p>Kẻ Không Mặt đã tan biến — nhưng vẫn còn những mảnh ký ức bạn chưa nhặt lại ({frags}/{ALL_FRAGMENTS.length}). Bạn không nhớ nổi vì sao mình sợ bóng tối đến thế.</p>
            <p>Trong góc phòng tối, cánh tủ quần áo khẽ kẽo kẹt… Đêm mai, nó sẽ quay lại.</p>
          </>
        )}
        <dl className="hz-stats">
          <dt>Thời gian</dt>
          <dd>{fmt(stats.seconds)}</dd>
          <dt>Mảnh ký ức</dt>
          <dd>
            {frags}/{ALL_FRAGMENTS.length}
          </dd>
          <dt>Bị bắt</dt>
          <dd>{stats.caught} lần</dd>
          <dt>Nhập sai mật mã</dt>
          <dd>{stats.wrongCodes} lần</dd>
          <dt>Tinh thần cuối</dt>
          <dd>{sanity}</dd>
        </dl>
        {!trueEnd && <p className="hz-sub">Còn một kết thúc khác — dành cho người nhặt lại đủ {ALL_FRAGMENTS.length} mảnh ký ức qua bốn chương.</p>}
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

const isTouch = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches

/** Thẻ chuyển chương: lời kết chương trước, lời mở chương mới, mục tiêu. */
function ChapterCard() {
  const chapter = useHorror((s) => s.chapter)
  const justFinished = useHorror((s) => s.justFinished)
  const enter = useHorror((s) => s.enterChapter)
  const c = getChapter(chapter)
  const prev = justFinished ? getChapter(justFinished) : null
  const touch = isTouch()
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter') enter()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [enter])
  return (
    <div className="hz-chapter">
      <div className="hz-chapter-card" key={chapter}>
        {prev && prev.outro.length > 0 && (
          <div className="story outro">
            {prev.outro.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        )}
        <div className="no">CHƯƠNG {c.index} / {CHAPTERS.length}</div>
        <h1>{c.title}</h1>
        <div className="sub">{c.subtitle}</div>
        <div className="story">
          {c.intro.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <div className="goal">
          <b>Mục tiêu:</b> {c.objective}
        </div>
        {c.index === 1 && (
          <div className="hz-controls">
            {touch ? (
              <p>Joystick trái: đi · Vuốt nửa phải: nhìn · 🔦 đèn pin · ✋ tương tác/trốn · 🏃 chạy · 🎒 túi đồ · 📓 nhật ký</p>
            ) : (
              <>
                <p>
                  <b>WASD</b> đi · <b>Chuột</b> nhìn · <b>Shift</b> chạy · <b>F</b> đèn pin · <b>E</b> tương tác / trốn
                </p>
                <p>
                  <b>Tab</b> túi đồ · <b>J</b> nhật ký & mục tiêu · <b>1–4</b> dùng nhanh · <b>Esc</b> tạm dừng
                </p>
              </>
            )}
            <p className="hz-sub">Đèn pin hết pin dần. Ở trong bóng tối lâu hoặc nhìn thấy nó sẽ làm tụt tinh thần. Đứng gần đèn để bình tĩnh lại.</p>
          </div>
        )}
        <button
          className="hz-btn primary big"
          onClick={() => {
            hAudio.unlock()
            enter()
          }}
        >
          Bước vào
        </button>
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
      {screen === 'chapter' && <ChapterCard />}
      {screen === 'play' && <Game />}
      {screen === 'gameover' && <GameOver />}
      {screen === 'ending' && <Ending />}
    </div>
  )
}
