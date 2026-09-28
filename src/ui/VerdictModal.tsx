import { useEffect, useState } from 'react'
import { registry, useGame } from '../game'
import { ClueLine } from './Notebook'
import { Modal } from './Modal'

export function VerdictModal({ id, preset }: { id: string; preset?: Record<string, string> }) {
  const v = registry.verdicts[id]
  const run = useGame((s) => s.run)
  const submit = useGame((s) => s.submitVerdict)
  const close = useGame((s) => s.closeModal)
  const [answers, setAnswers] = useState<Record<string, string>>(preset ?? {})
  const [evidence, setEvidence] = useState<string[]>([])
  const [showNotes, setShowNotes] = useState(!!v?.final)

  useEffect(() => setAnswers(preset ?? {}), [id, preset])
  if (!v) return null

  const evQ = v.questions.find((q) => q.kind === 'evidence')
  const ready =
    v.questions.every((q) => q.kind !== 'single' || answers[q.id]) && (!evQ || evidence.length >= (evQ.min ?? 1))
  const areaClues = run.clues.filter((c) => registry.clues[c.id]?.area === v.area)

  return (
    <Modal title={v.title} onClose={close} wide className="verdict-modal">
      <p className="verdict-intro">{v.intro}</p>
      {v.questions.map((q) =>
        q.kind === 'single' ? (
          <fieldset key={q.id} className="verdict-q">
            <legend>{q.prompt}</legend>
            <div className="options">
              {q.options?.map((o) => (
                <button key={o.id} className={`option${answers[q.id] === o.id ? ' on' : ''}`} onClick={() => setAnswers({ ...answers, [q.id]: o.id })}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <fieldset key={q.id} className="verdict-q">
            <legend>
              {q.prompt} <span className="muted">(đã chọn {evidence.length})</span>
            </legend>
            <div className="clue-list evidence-list">
              {run.clues.length === 0 && <p className="empty">Sổ tay trống.</p>}
              {registry.areas.map((a) => {
                const list = run.clues.filter((c) => registry.clues[c.id]?.area === a.id)
                if (!list.length) return null
                return (
                  <div key={a.id}>
                    <h4 className="ev-area">{a.name}</h4>
                    {list.map((c) => (
                      <ClueLine
                        key={c.id}
                        entry={c}
                        selectable
                        selected={evidence.includes(c.id)}
                        onSelect={() => setEvidence(evidence.includes(c.id) ? evidence.filter((x) => x !== c.id) : [...evidence, c.id])}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </fieldset>
        ),
      )}
      {!evQ && (
        <div className="verdict-notes">
          <button className="btn ghost small" onClick={() => setShowNotes(!showNotes)}>
            {showNotes ? 'Ẩn sổ tay' : 'Xem sổ tay khu vực này'}
          </button>
          {showNotes && (
            <div className="clue-list">
              {areaClues.length === 0 && <p className="empty">Chưa có ghi chép nào.</p>}
              {areaClues.map((c) => (
                <ClueLine key={c.id} entry={c} />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="modal-foot">
        <button className="btn ghost" onClick={close}>
          Suy nghĩ thêm
        </button>
        <button className="btn primary" disabled={!ready} onClick={() => submit(answers, evidence)}>
          {v.final ? 'Đưa ra phán quyết' : 'Quyết định'}
        </button>
      </div>
    </Modal>
  )
}
