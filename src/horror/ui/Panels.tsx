import { useEffect, useState } from 'react'
import { hAudio } from '../audio'
import { FRAGMENTS, ITEMS, NOTES, PHOTOS, PUZZLES } from '../content'
import { ACHIEVEMENTS, readNotes, useHorror } from '../store'

export function Panel({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  useEffect(() => {
    if (!onClose) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="hz-backdrop" onClick={onClose}>
      <div className={`hz-panel${wide ? ' wide' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="hz-panel-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="hz-x" onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          )}
        </div>
        <div className="hz-panel-body">{children}</div>
      </div>
    </div>
  )
}

const close = () => useHorror.getState().openModal(null)

export function Keypad({ puzzle }: { puzzle: string }) {
  const p = PUZZLES[puzzle]
  const submit = useHorror((s) => s.submitCode)
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(0)
  const [shake, setShake] = useState(0)

  const press = (d: string) => {
    hAudio.beep()
    setCode((c) => (c.length < p.code.length ? c + d : c))
  }
  const enter = () => {
    if (code.length !== p.code.length) return
    if (submit(puzzle, code)) {
      hAudio.unlockSound()
    } else {
      hAudio.error()
      setWrong((w) => w + 1)
      setShake((s) => s + 1)
      setCode('')
    }
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') setCode((c) => c.slice(0, -1))
      else if (e.key === 'Enter') enter()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  return (
    <Panel title={p.title} onClose={close}>
      <div className={`hz-keypad${shake ? ' shake' : ''}`} key={shake}>
        <div className="hz-display" aria-live="polite">
          {Array.from({ length: p.code.length }, (_, i) => (
            <span key={i}>{code[i] ?? '_'}</span>
          ))}
        </div>
        <div className="hz-keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button onClick={() => setCode((c) => c.slice(0, -1))} aria-label="Xóa">
            ⌫
          </button>
          <button onClick={() => press('0')}>0</button>
          <button className="ok" onClick={enter} disabled={code.length !== p.code.length}>
            OK
          </button>
        </div>
        {wrong > 0 && <p className="hz-wrong">Sai mã. Có thứ gì đó cười khúc khích sau lưng bạn. (−3 tinh thần)</p>}
        {wrong > 0 && <p className="hz-hint">Gợi ý: {p.hint}</p>}
      </div>
    </Panel>
  )
}

export function NoteView({ note }: { note: string }) {
  const n = NOTES[note]
  return (
    <Panel title={n.title} onClose={close}>
      <div className="hz-paper">
        {n.body.split('\n').map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <p className="hz-sub">Đã chép vào Nhật ký (J).</p>
    </Panel>
  )
}

export function PhotoView({ photo }: { photo: number }) {
  const p = PHOTOS[photo]
  return (
    <Panel title="Ảnh gia đình" onClose={close}>
      <div className="hz-photo">
        <div className="hz-photo-img">
          {Array.from({ length: p.people }, (_, i) => (
            <span key={i} className="hz-person" style={{ height: i === p.people - 1 && p.people > 2 ? '55%' : '80%' }} />
          ))}
        </div>
        <div className="hz-photo-year">{p.year}</div>
      </div>
      <p className="hz-sub">
        Trong ảnh có {p.people} người. Mặt ai cũng bị cào xước, chỉ còn nhìn được dáng. Mặt sau ghi năm {p.year}.
      </p>
    </Panel>
  )
}

export function ExamineView({ title, text }: { title: string; text: string }) {
  return (
    <Panel title={title} onClose={close}>
      <div className="hz-examine">
        {text.split('\n').map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </Panel>
  )
}

export function MirrorView() {
  return (
    <Panel title="Tấm gương" onClose={close}>
      <div className="hz-mirror">
        <div className="hz-mirror-glass">
          <span className="hz-mirror-text">2519</span>
          <span className="hz-mirror-small">ĐỪNG NHÌN SAU LƯNG</span>
        </div>
      </div>
      <p className="hz-sub">Những con số viết bằng thứ gì đó đỏ sẫm, từ phía bên kia tấm gương.</p>
    </Panel>
  )
}

export function Inventory() {
  const inv = useHorror((s) => s.inventory)
  const use = useHorror((s) => s.useSlot)
  const drop = useHorror((s) => s.dropSlot)
  const [sel, setSel] = useState(() => Math.max(0, inv.findIndex((x) => x)))
  const item = inv[sel] ? ITEMS[inv[sel]!] : null
  return (
    <Panel title="Túi đồ (4 ô)" onClose={close}>
      <div className="hz-inv">
        {inv.map((it, i) => (
          <button key={i} className={`hz-slot big${sel === i ? ' on' : ''}`} onClick={() => setSel(i)}>
            <span className="n">{i + 1}</span>
            {it ? <span className="ic">{ITEMS[it].icon}</span> : <span className="empty">trống</span>}
            {it && <span className="nm">{ITEMS[it].name}</span>}
          </button>
        ))}
      </div>
      {item ? (
        <div className="hz-inv-detail">
          <h3>{item.name}</h3>
          <p>{item.desc}</p>
          <div className="hz-row">
            <button className="hz-btn primary" onClick={() => use(sel)}>
              Dùng
            </button>
            <button className="hz-btn" onClick={() => drop(sel)}>
              Bỏ lại
            </button>
          </div>
        </div>
      ) : (
        <p className="hz-sub">Ô trống. Túi chỉ chứa được 4 món — hãy cân nhắc mang gì theo.</p>
      )}
      <p className="hz-sub">Phím tắt: nhấn 1–4 để dùng nhanh.</p>
    </Panel>
  )
}

export function Journal() {
  const fragments = useHorror((s) => s.fragments)
  const notes = useHorror((s) => s.notes)
  const [tab, setTab] = useState<'mem' | 'notes'>('mem')
  return (
    <Panel title="Nhật ký" onClose={close} wide>
      <div className="hz-tabs">
        <button className={tab === 'mem' ? 'on' : ''} onClick={() => setTab('mem')}>
          Mảnh ký ức {fragments.length}/4
        </button>
        <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>
          Ghi chú {notes.length}
        </button>
      </div>
      {tab === 'mem' ? (
        <div className="hz-list">
          {FRAGMENTS.map((f) =>
            fragments.includes(f.id) ? (
              <div key={f.id} className="hz-frag">
                <div className="hz-frag-digit">{f.digit}</div>
                <div>
                  <strong>Mảnh {f.id}</strong>
                  <p>{f.text}</p>
                </div>
              </div>
            ) : (
              <div key={f.id} className="hz-frag locked">
                <div className="hz-frag-digit">?</div>
                <div>
                  <strong>Mảnh {f.id}</strong>
                  <p>Một khoảng trống trong trí nhớ.</p>
                </div>
              </div>
            ),
          )}
          <p className="hz-sub">Các con số ghép theo thứ tự mảnh 1 → 4.</p>
        </div>
      ) : (
        <div className="hz-list">
          {notes.length === 0 && <p className="hz-sub">Chưa đọc được gì.</p>}
          {readNotes(notes).map((n) => (
            <div key={n.id} className="hz-note">
              <strong>{n.title}</strong>
              {n.body.split('\n').map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

export function SettingsForm() {
  const st = useHorror((s) => s.settings)
  const set = useHorror((s) => s.setSettings)
  return (
    <div className="hz-settings">
      <label>
        Âm lượng: {Math.round(st.volume * 100)}%
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={st.volume}
          onChange={(e) => {
            set({ volume: Number(e.target.value) })
            hAudio.setVolume(Number(e.target.value))
          }}
        />
      </label>
      <label>
        Độ nhạy chuột/vuốt: {st.sensitivity.toFixed(1)}
        <input type="range" min={0.3} max={2.5} step={0.1} value={st.sensitivity} onChange={(e) => set({ sensitivity: Number(e.target.value) })} />
      </label>
      <label className="hz-check">
        <input
          type="checkbox"
          checked={st.reduceScares}
          onChange={(e) => {
            set({ reduceScares: e.target.checked })
            hAudio.reduce = e.target.checked
          }}
        />
        Giảm hù dọa (không chớp mặt, tiếng hét nhỏ)
      </label>
      <label>
        Chất lượng đồ họa
        <select value={st.quality} onChange={(e) => set({ quality: e.target.value as 'low' | 'high' })}>
          <option value="high">Cao (có bóng đổ)</option>
          <option value="low">Thấp (máy yếu, điện thoại)</option>
        </select>
      </label>
      <p className="hz-sub">Đổi chất lượng sẽ áp dụng khi bắt đầu lại màn chơi.</p>
    </div>
  )
}

export function Pause() {
  const toTitle = useHorror((s) => s.toTitle)
  return (
    <Panel title="Tạm dừng" onClose={close}>
      <div className="hz-controls">
        <p>
          <b>WASD</b> đi · <b>Chuột</b> nhìn · <b>Shift</b> chạy (gây tiếng động) · <b>F</b> đèn pin · <b>E</b> tương tác / trốn
        </p>
        <p>
          <b>Tab</b> túi đồ · <b>J</b> nhật ký · <b>1–4</b> dùng nhanh · <b>Esc</b> tạm dừng
        </p>
      </div>
      <SettingsForm />
      <div className="hz-row">
        <button className="hz-btn primary" onClick={close}>
          Tiếp tục
        </button>
        <button className="hz-btn" onClick={toTitle}>
          Về màn hình chính
        </button>
      </div>
    </Panel>
  )
}

export function FrontChoice() {
  const finish = useHorror((s) => s.finish)
  const say = useHorror((s) => s.say)
  return (
    <Panel title="Cửa chính đã mở">
      <div className="hz-examine">
        <p>Ánh sáng ban mai tràn qua khe cửa. Chỉ cần bước ra là tỉnh giấc.</p>
        <p>Nhưng phía sau lưng, từ phòng ngủ, vọng lại tiếng một đứa trẻ đang khóc trong tủ quần áo.</p>
      </div>
      <div className="hz-row">
        <button className="hz-btn primary" onClick={() => finish('escape')}>
          Bước ra ngoài
        </button>
        <button
          className="hz-btn"
          onClick={() => {
            close()
            say('Bạn quay lưng lại với cánh cửa. Tủ quần áo trong phòng ngủ…')
          }}
        >
          Quay lại, đối mặt với nó
        </button>
      </div>
    </Panel>
  )
}

export function Intro({ touch }: { touch: boolean }) {
  return (
    <Panel title="3 giờ 17 phút sáng">
      <div className="hz-examine">
        <p>Bạn mở mắt trong căn phòng ngủ hồi bé. Mọi thứ y như cũ — chỉ là tối hơn, lạnh hơn, và cửa đã bị khóa từ bên ngoài.</p>
        <p>Có thứ gì đó đang đi lại trong nhà. Nó không có mặt. Nó nghe được tiếng chân chạy.</p>
        <p>
          <b>Mục tiêu:</b> tìm đèn pin, giải mật mã để mở từng căn phòng, gom 4 mảnh ký ức và thoát ra bằng cửa chính.
        </p>
      </div>
      <div className="hz-controls">
        {touch ? (
          <>
            <p>Joystick trái: đi · Vuốt nửa phải: nhìn · Nút 🔦 đèn pin · ✋ tương tác/trốn · 🏃 chạy</p>
            <p>🎒 túi đồ · 📓 nhật ký</p>
          </>
        ) : (
          <>
            <p>
              <b>WASD</b> đi · <b>Chuột</b> nhìn · <b>Shift</b> chạy · <b>F</b> đèn pin · <b>E</b> tương tác / trốn
            </p>
            <p>
              <b>Tab</b> túi đồ · <b>J</b> nhật ký · <b>1–4</b> dùng nhanh · <b>Esc</b> tạm dừng
            </p>
          </>
        )}
        <p className="hz-sub">
          Đèn pin hết pin dần. Ở trong bóng tối lâu hoặc nhìn thấy nó sẽ làm tụt tinh thần. Đứng gần đèn trong nhà để bình tĩnh lại.
        </p>
      </div>
      <button className="hz-btn primary big" onClick={close}>
        Bắt đầu
      </button>
    </Panel>
  )
}

export function AchievementsList() {
  const got = useHorror((s) => s.achievements)
  return (
    <ul className="hz-ach">
      {Object.entries(ACHIEVEMENTS).map(([id, a]) => (
        <li key={id} className={got.includes(id) ? 'on' : ''}>
          <strong>{got.includes(id) ? '★' : '☆'} {a.name}</strong>
          <span>{a.desc}</span>
        </li>
      ))}
    </ul>
  )
}
