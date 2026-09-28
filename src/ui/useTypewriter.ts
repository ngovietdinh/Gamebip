import { useEffect, useRef, useState } from 'react'
import { TEXT_SPEED_MS, useMeta } from '../engine/meta'

/** Chữ chạy từng ký tự; `skip()` hiện hết ngay. */
export function useTypewriter(text: string, key: string | number) {
  const speed = useMeta((s) => TEXT_SPEED_MS[s.settings.textSpeed])
  const [count, setCount] = useState(speed === 0 ? text.length : 0)
  const timer = useRef<number | null>(null)
  const chars = Array.from(text)

  useEffect(() => {
    if (speed === 0) {
      setCount(chars.length)
      return
    }
    setCount(0)
    timer.current = window.setInterval(() => {
      setCount((c) => {
        if (c + 1 >= chars.length) {
          if (timer.current) window.clearInterval(timer.current)
          return chars.length
        }
        return c + 1
      })
    }, speed)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, key, speed])

  const done = count >= chars.length
  const skip = () => {
    if (timer.current) window.clearInterval(timer.current)
    setCount(chars.length)
  }
  return { shown: chars.slice(0, count).join(''), done, skip }
}
