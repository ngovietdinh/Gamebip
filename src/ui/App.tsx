import { useEffect } from 'react'
import { synth } from '../audio/synth'
import { useMeta } from '../engine/meta'
import { timeInfo } from '../engine/time'
import { useGame } from '../game'
import { Cards } from './Cards'
import { DebugPanel } from './DebugPanel'
import { EndingScreen } from './EndingScreen'
import { GameScreen } from './GameScreen'
import { TitleScreen } from './TitleScreen'
import { Toasts } from './Toasts'

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
// Ở chế độ debug, mở store ra console để kiểm thử nhanh: window.__game.getState()
if (DEBUG) (window as unknown as { __game: typeof useGame }).__game = useGame

export function App() {
  const screen = useGame((s) => s.screen)
  const fontSize = useMeta((s) => s.settings.fontSize)
  const segment = useGame((s) => timeInfo(s.run.actions).segment)

  // Âm thanh mặc định bật sau lần tương tác đầu tiên.
  useEffect(() => {
    const unlock = () => synth.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    synth.setFog(screen === 'game' ? 0.3 + segment * 0.08 : 0.4)
  }, [segment, screen])

  return (
    <div className={`app font-${fontSize}`}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'ending' && <EndingScreen />}
      <Cards />
      <Toasts />
      {DEBUG && <DebugPanel />}
    </div>
  )
}
