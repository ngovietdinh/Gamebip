import { useEffect, useState } from 'react'
import { synth } from '../audio/synth'
import { useGame } from '../game'

const WORD = 'GAME OVER'
/** Chữ tròn như cửa: chữ O — chữ tròn thứ hai sau chữ G. */
const DOOR_INDEX = WORD.indexOf('O')

/**
 * Màn "GAME OVER" giả. Nút "Chơi lại từ đầu" chỉ là cái bẫy;
 * lối thoát thật là bấm vào chữ O đang nhấp nháy rất nhẹ.
 */
export function FakeGameOver() {
  const hook = useGame((s) => s.overlayHook)
  const [restarts, setRestarts] = useState(0)
  const [taunt, setTaunt] = useState(false)
  const [opening, setOpening] = useState(false)
  const [nudge, setNudge] = useState(-1)

  useEffect(() => {
    if (!taunt) return
    const t = window.setTimeout(() => setTaunt(false), 2400)
    return () => window.clearTimeout(t)
  }, [taunt])

  const escape = () => {
    if (opening) return
    setOpening(true)
    synth.play('bell')
    window.setTimeout(() => hook('fakeGameOver', 'escape'), 1400)
  }

  return (
    <div className={`fake-go${opening ? ' opening' : ''}`} role="dialog" aria-label="Game Over">
      {taunt ? (
        <div className="fake-taunt">Thật sao? Bỏ cuộc dễ vậy à?</div>
      ) : opening ? (
        <div className="fake-open">Bạn đã nhìn kỹ. Rừng trúc mở ra.</div>
      ) : (
        <>
          <h1 className="fake-title" aria-label="GAME OVER">
            {Array.from(WORD).map((ch, i) =>
              ch === ' ' ? (
                <span key={i} className="sp" />
              ) : i === DOOR_INDEX ? (
                <button key={i} className="fake-letter door" onClick={escape} aria-label="O">
                  {ch}
                </button>
              ) : (
                <span
                  key={i}
                  className={`fake-letter${nudge === i ? ' nudge' : ''}`}
                  onClick={() => {
                    setNudge(i)
                    synth.play('glitch')
                    window.setTimeout(() => setNudge(-1), 400)
                  }}
                >
                  {ch}
                </span>
              ),
            )}
          </h1>
          <p className="fake-sub">Bạn đã lạc mãi trong rừng trúc.</p>
          <button
            className="fake-restart"
            onClick={() => {
              hook('fakeGameOver', 'restart')
              setRestarts((n) => n + 1)
              synth.play('fail')
              setTaunt(true)
            }}
          >
            Chơi lại từ đầu
          </button>
          {restarts >= 3 && <p className="fake-whisper">…có ai đó từng dặn bạn nhìn vào chữ tròn như cửa thì phải.</p>}
        </>
      )}
    </div>
  )
}
