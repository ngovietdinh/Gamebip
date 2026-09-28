import { useEffect } from 'react'
import { evalCondition } from '../engine/conditions'
import { registry, useGame } from '../game'
import { Portrait } from './Portrait'
import { useTypewriter } from './useTypewriter'
import { usePalette } from './useView'

export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue)
  const says = useGame((s) => s.says)
  const run = useGame((s) => s.run)
  const advance = useGame((s) => s.advance)
  const choose = useGame((s) => s.choose)
  const nodeText = useGame((s) => s.nodeText)
  const blocked = useGame((s) => !!(s.modal || s.cards.length || s.overlay))
  const { p } = usePalette()

  let speaker: string | undefined
  let text = ''
  let key = ''
  let choices: { text: string }[] = []
  if (dialogue) {
    const node = registry.dialogues[dialogue.id]?.nodes[dialogue.node]
    if (node) {
      speaker = node.speaker
      text = nodeText(node)
      key = dialogue.id + ':' + dialogue.node
      choices = (node.choices ?? []).filter((c) => evalCondition(c.if, run))
    }
  } else if (says.length) {
    speaker = says[0].speaker
    text = says[0].text
    key = 'say:' + says.length + ':' + text
  }

  const { shown, done, skip } = useTypewriter(text, key)
  const active = !!text

  useEffect(() => {
    if (!active || blocked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!done) skip()
        else if (!choices.length) advance()
      } else if (done && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1
        if (choices[i]) choose(i)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!active) return null
  const ch = speaker ? registry.characters[speaker] : undefined

  return (
    <div className={`dialogue${blocked ? ' dimmed' : ''}`} role="dialog" aria-live="polite">
      <div
        className="dialogue-box"
        onClick={() => {
          if (!done) skip()
          else if (!choices.length) advance()
        }}
      >
        <Portrait speaker={speaker} p={p} />
        <div className="dialogue-body">
          {ch && (
            <div className="dialogue-name" style={{ color: ch.color }}>
              {ch.name}
            </div>
          )}
          <p className={`dialogue-text${ch ? '' : ' narration'}`}>
            {shown}
            {!done && <span className="caret">▍</span>}
          </p>
          {done && !choices.length && <div className="dialogue-next">Chạm để tiếp ▸</div>}
        </div>
      </div>
      {done && choices.length > 0 && (
        <div className="choices">
          {choices.map((c, i) => (
            <button key={i} className="choice" onClick={() => choose(i)}>
              <span className="choice-num">{i + 1}</span>
              {c.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
