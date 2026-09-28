import { useEffect, type ReactNode } from 'react'
import { Icon } from './icons'

export function Modal({ title, onClose, children, wide, className }: { title: ReactNode; onClose?: () => void; children: ReactNode; wide?: boolean; className?: string }) {
  useEffect(() => {
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''}${className ? ' ' + className : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Đóng">
              <Icon name="close" />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
