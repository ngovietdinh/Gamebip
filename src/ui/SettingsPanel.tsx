import { synth } from '../audio/synth'
import { useMeta, type FontSize, type TextSpeed, type ViewMode } from '../engine/meta'

const SPEEDS: [TextSpeed, string][] = [
  ['slow', 'Chậm'],
  ['normal', 'Vừa'],
  ['fast', 'Nhanh'],
  ['instant', 'Tức thì'],
]
const VIEWS: [ViewMode, string][] = [
  ['3d', '3D — tự điều khiển'],
  ['2d', '2D — bấm chọn'],
]
const SIZES: [FontSize, string][] = [
  ['small', 'Nhỏ'],
  ['medium', 'Vừa'],
  ['large', 'Lớn'],
]

export function SettingsPanel() {
  const settings = useMeta((s) => s.settings)
  const set = useMeta((s) => s.setSettings)
  return (
    <div className="settings">
      <div className="setting">
        <span>Chế độ hình ảnh</span>
        <div className="seg">
          {VIEWS.map(([k, l]) => (
            <button key={k} className={settings.view === k ? 'on' : ''} onClick={() => set({ view: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <label htmlFor="vol">Âm lượng</label>
        <div className="row">
          <input
            id="vol"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => {
              synth.unlock()
              set({ volume: Number(e.target.value) })
            }}
            onPointerUp={() => synth.play('bell')}
          />
          <span className="val">{Math.round(settings.volume * 100)}%</span>
        </div>
      </div>
      <div className="setting">
        <span>Âm thanh</span>
        <div className="seg">
          <button className={!settings.muted ? 'on' : ''} onClick={() => (synth.unlock(), set({ muted: false }))}>
            Bật
          </button>
          <button className={settings.muted ? 'on' : ''} onClick={() => set({ muted: true })}>
            Tắt
          </button>
        </div>
      </div>
      <div className="setting">
        <span>Tốc độ chữ</span>
        <div className="seg">
          {SPEEDS.map(([k, l]) => (
            <button key={k} className={settings.textSpeed === k ? 'on' : ''} onClick={() => set({ textSpeed: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <span>Cỡ chữ</span>
        <div className="seg">
          {SIZES.map(([k, l]) => (
            <button key={k} className={settings.fontSize === k ? 'on' : ''} onClick={() => set({ fontSize: k })}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
