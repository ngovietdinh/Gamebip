import { lazy, Suspense } from 'react'
import { useMeta } from '../engine/meta'
import { registry, useGame } from '../game'
import { DialogueBox } from './DialogueBox'
import { FakeGameOver } from './FakeGameOver'
import { HUD } from './HUD'
import { Inventory } from './Inventory'
import { Menu } from './Menu'
import { Notebook } from './Notebook'
import { PuzzleModal } from './PuzzleModal'
import { Stage } from './Stage'
import { VerdictModal } from './VerdictModal'

const Stage3D = lazy(() => import('../three/Stage3D'))

export function GameScreen() {
  const view = useMeta((s) => s.settings.view)
  const modal = useGame((s) => s.modal)
  const overlay = useGame((s) => s.overlay)
  const usingItem = useGame((s) => s.usingItem)
  const selectItem = useGame((s) => s.selectItem)

  return (
    <div className="game">
      {view === '3d' ? (
        <Suspense fallback={<div className="stage-loading">Đang dựng làng…</div>}>
          <Stage3D />
        </Suspense>
      ) : (
        <Stage />
      )}
      <HUD />
      {usingItem && (
        <div className="using-banner">
          Đang cầm <strong>{registry.items[usingItem]?.name}</strong> — chạm vào nơi muốn dùng
          <button className="btn ghost small" onClick={() => selectItem(null)}>
            Hủy
          </button>
        </div>
      )}
      <DialogueBox />
      {modal?.type === 'notebook' && <Notebook />}
      {modal?.type === 'inventory' && <Inventory />}
      {modal?.type === 'menu' && <Menu initial={modal.tab} />}
      {modal?.type === 'puzzle' && <PuzzleModal id={modal.id} />}
      {modal?.type === 'verdict' && <VerdictModal id={modal.id} preset={modal.preset} />}
      {overlay === 'fakeGameOver' && <FakeGameOver />}
    </div>
  )
}

