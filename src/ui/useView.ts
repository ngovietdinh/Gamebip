import { useEffect, useState } from 'react'
import { paletteFor } from '../art/palette'
import { timeInfo } from '../engine/time'
import { useGame } from '../game'

/** Bảng màu và thông tin thời gian hiện tại. */
export function usePalette() {
  const actions = useGame((s) => s.run.actions)
  const t = timeInfo(actions)
  return { p: paletteFor(t.tod), t }
}

export function usePortrait(): boolean {
  const q = () => typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  const [portrait, setPortrait] = useState(q)
  useEffect(() => {
    const on = () => setPortrait(q())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return portrait
}
