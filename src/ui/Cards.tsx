import { useEffect } from 'react'
import { registry, useGame } from '../game'
import { Portrait } from './Portrait'
import { usePalette } from './useView'

/** Thẻ "Bạn đã giả định gì?" và các thẻ thông báo cốt truyện. */
export function Cards() {
  const card = useGame((s) => s.cards[0])
  const loop = useGame((s) => s.run.loop)
  const dismiss = useGame((s) => s.dismissCard)
  const { p } = usePalette()

  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, dismiss])

  if (!card) return null
  const fill = (s: string) => s.replace(/\{loop\}/g, String(loop))

  if (card.kind === 'mistake') {
    const f = registry.fallacies[card.fallacy]
    return (
      <div className="card-backdrop">
        <article className="card mistake-card" key={card.explain}>
          <div className="card-kicker">Bạn đã giả định gì?</div>
          <h2 className="card-title">{f.name}</h2>
          <p className="fallacy-short">{f.short}</p>
          {card.explain.split('\n\n').map((para, i) => (
            <p key={i} className={i > 0 ? 'method' : ''}>
              {para}
            </p>
          ))}
          <div className="missed">
            <span>Manh mối đã bỏ lỡ</span>
            <p>{card.missed}</p>
          </div>
          <div className="card-foot">
            <span className="penalty">−{card.sanity} Tỉnh táo</span>
            <button className="btn primary" onClick={dismiss} autoFocus>
              Đã hiểu
            </button>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="card-backdrop">
      <article className="card info-card" key={card.title}>
        {card.kicker && <div className="card-kicker">{card.kicker}</div>}
        <h2 className="card-title">{fill(card.title)}</h2>
        {card.speaker && <Portrait speaker={card.speaker} p={p} />}
        {fill(card.body)
          .split('\n\n')
          .map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        <div className="card-foot">
          <span />
          <button className="btn primary" onClick={dismiss} autoFocus>
            Tiếp tục
          </button>
        </div>
      </article>
    </div>
  )
}
