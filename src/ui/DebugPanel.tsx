import { useState } from 'react'
import { DEADLINE_SEGMENT, segmentOf, timeLabel, actionsForSegment } from '../engine/time'
import { registry, useGame } from '../game'

/** Bảng gỡ lỗi — bật bằng ?debug=1 trên URL. */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const run = useGame((s) => s.run)
  const screen = useGame((s) => s.screen)
  const goto = useGame((s) => s.debugGoto)
  const setSeg = useGame((s) => s.debugSetSegment)
  const patch = useGame((s) => s.debugPatch)
  const exec = useGame((s) => s.exec)
  const newGame = useGame((s) => s.newGame)
  const [scene, setScene] = useState(run.sceneId)

  if (!open) {
    return (
      <button className="debug-toggle" onClick={() => setOpen(true)} title="Chế độ gỡ lỗi">
        DBG
      </button>
    )
  }
  const maze = run.mazes['duong_lang']
  return (
    <aside className="debug">
      <div className="debug-head">
        <strong>Gỡ lỗi</strong>
        <button onClick={() => setOpen(false)}>×</button>
      </div>
      <p>
        Màn: {screen} · Cảnh: <code>{run.sceneId}</code> · {timeLabel(run.actions)} ({run.actions} hành động) · Lần {run.loop}
      </p>
      {screen === 'title' && <button onClick={newGame}>Bắt đầu chơi</button>}
      <label>
        Nhảy cảnh
        <div className="row">
          <select value={scene} onChange={(e) => setScene(e.target.value)}>
            {registry.areas.map((a) => (
              <optgroup key={a.id} label={a.name}>
                {a.scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={() => goto(scene)}>Đi</button>
        </div>
      </label>
      <label>
        Đặt thời gian
        <select value={segmentOf(run.actions)} onChange={(e) => setSeg(Number(e.target.value))}>
          {Array.from({ length: DEADLINE_SEGMENT + 1 }, (_, i) => (
            <option key={i} value={i}>
              {timeLabel(actionsForSegment(i))}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tỉnh táo: {run.sanity}
        <input type="range" min={0} max={100} value={run.sanity} onChange={(e) => patch({ sanity: Number(e.target.value) })} />
      </label>
      <div className="row wrap">
        <button onClick={() => exec(Object.keys(registry.items).map((id) => ({ t: 'item' as const, id })))}>Nhận mọi vật phẩm</button>
        <button onClick={() => exec(Object.values(registry.clues).filter((c) => c.evidence).map((c) => ({ t: 'clue' as const, id: c.id })))}>
          Nhận mọi bằng chứng
        </button>
        <button onClick={() => exec([{ t: 'verdict', id: 'v_final' }])}>Mở phán xử cuối</button>
        <button onClick={() => exec([{ t: 'overlay', id: 'fakeGameOver' }])}>Game Over giả</button>
        <button onClick={() => patch({ loop: run.loop + 1 })}>Lần chơi +1</button>
      </div>
      {maze && (
        <p>
          Đường làng: tiến {maze.progress}/3 · sai {maze.fails} · phía đổi: <b>{maze.changed ?? '—'}</b> ({maze.changedDetail ?? '—'})
        </p>
      )}
      <details open>
        <summary>Flag ({Object.keys(run.flags).length})</summary>
        <pre>{JSON.stringify(run.flags, null, 1)}</pre>
      </details>
      <details>
        <summary>Túi đồ & manh mối</summary>
        <pre>{JSON.stringify({ inventory: run.inventory, clues: run.clues.map((c) => c.id), solved: run.solved }, null, 1)}</pre>
      </details>
    </aside>
  )
}
