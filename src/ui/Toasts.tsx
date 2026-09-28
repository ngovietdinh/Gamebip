import { useEffect } from 'react'
import { useGame } from '../game'

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const dismiss = useGame((s) => s.dismissToast)
  useEffect(() => {
    if (!toasts.length) return
    const t = window.setTimeout(() => dismiss(toasts[0].id), 2600)
    return () => window.clearTimeout(t)
  }, [toasts, dismiss])
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" onClick={() => dismiss(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
