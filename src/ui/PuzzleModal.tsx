import { useEffect, useRef, useState } from 'react'
import { registry, useGame } from '../game'
import { Modal } from './Modal'
import { Portrait } from './Portrait'
import { usePalette } from './useView'

export function PuzzleModal({ id }: { id: string }) {
  const p = registry.puzzles[id]
  const run = useGame((s) => s.run)
  const submit = useGame((s) => s.submitPuzzle)
  const buyHint = useGame((s) => s.buyHint)
  const close = useGame((s) => s.closeModal)
  const hasCard = useGame((s) => s.cards.length > 0)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  const [shake, setShake] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const { p: pal } = usePalette()

  useEffect(() => {
    setValue('')
    setFeedback('')
    input.current?.focus()
  }, [id])

  useEffect(() => {
    if (!hasCard) input.current?.focus()
  }, [hasCard])

  if (!p) return null
  const attempts = run.attempts[p.id] ?? 0
  const hintShown = !!run.hints[p.id] || (p.freeHintAfter !== undefined && attempts >= p.freeHintAfter)
  const speaker = p.speaker ? registry.characters[p.speaker] : undefined

  const doSubmit = (answer: string) => {
    if (!answer.trim()) return
    const ok = submit(answer)
    if (!ok) {
      setFeedback('Chưa đúng. Nghĩ lại xem…')
      setShake((x) => x + 1)
      setValue('')
    }
  }

  return (
    <Modal title={p.title} onClose={close} className="puzzle-modal">
      <div className="puzzle-head">
        <Portrait speaker={p.speaker} p={pal} />
        <div>
          {speaker && (
            <div className="dialogue-name" style={{ color: speaker.color }}>
              {speaker.name}
            </div>
          )}
          <p className="puzzle-prompt">{p.prompt}</p>
        </div>
      </div>
      {p.kind === 'text' ? (
        <form
          className={`puzzle-form${shake ? ' shake' : ''}`}
          key={shake}
          onSubmit={(e) => {
            e.preventDefault()
            doSubmit(value)
          }}
        >
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập câu trả lời…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          <button className="btn primary" type="submit" disabled={!value.trim()}>
            Trả lời
          </button>
        </form>
      ) : (
        <div className="options">
          {p.options?.map((o) => (
            <button key={o.id} className="option" onClick={() => doSubmit(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {feedback && <p className="feedback">{feedback}</p>}
      {p.hint && (
        <div className="hint-box">
          {hintShown ? (
            <p>
              <strong>Gợi ý:</strong> {p.hint.text}
            </p>
          ) : (
            <button className="btn ghost" onClick={buyHint}>
              Xin gợi ý{p.hint.cost ? ` (−${p.hint.cost} Tỉnh táo)` : ''}
            </button>
          )}
        </div>
      )}
      <div className="modal-foot">
        <span className="muted">Không phân biệt dấu và chữ hoa. Có thể đóng lại và quay lại sau.</span>
        <button className="btn ghost" onClick={close}>
          Để sau
        </button>
      </div>
    </Modal>
  )
}
