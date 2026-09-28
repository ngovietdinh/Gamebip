import { useEffect, useRef } from 'react'

/** Tạo một ô nhiễu (value noise) lặp liền mạch, dùng làm hoa văn sương. */
function makeNoiseTile(size: number, color: string, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const octave = (cells: number) => {
    const g = Array.from({ length: cells * cells }, () => rand())
    return (x: number, y: number) => {
      const fx = (x / size) * cells
      const fy = (y / size) * cells
      const x0 = Math.floor(fx) % cells
      const y0 = Math.floor(fy) % cells
      const x1 = (x0 + 1) % cells
      const y1 = (y0 + 1) % cells
      const tx = fx - Math.floor(fx)
      const ty = fy - Math.floor(fy)
      const sx = tx * tx * (3 - 2 * tx)
      const sy = ty * ty * (3 - 2 * ty)
      const a = g[y0 * cells + x0]
      const b = g[y0 * cells + x1]
      const cc = g[y1 * cells + x0]
      const d = g[y1 * cells + x1]
      return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy
    }
  }
  const o1 = octave(4)
  const o2 = octave(8)
  const o3 = octave(16)
  const rgb = color.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = o1(x, y) * 0.55 + o2(x, y) * 0.3 + o3(x, y) * 0.15
      const a = Math.max(0, Math.min(1, (v - 0.35) * 1.8))
      const i = (y * size + x) * 4
      img.data[i] = rgb[0]
      img.data[i + 1] = rgb[1]
      img.data[i + 2] = rgb[2]
      img.data[i + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

/**
 * Sương mù động: vài lớp nhiễu trôi chậm với tốc độ khác nhau.
 * `density` 0..1 — sương dày dần theo thời gian trong game.
 */
export function FogCanvas({ density, color = '#e8ecec' }: { density: number; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const densityRef = useRef(density)
  densityRef.current = density

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const tile = makeNoiseTile(128, color.replace('#', ''), 7)
    const tile2 = makeNoiseTile(128, color.replace('#', ''), 31)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    let t = 0
    let shown = densityRef.current

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      // Độ phân giải thấp — sương vốn mờ, đỡ tốn tài nguyên.
      canvas.width = Math.max(1, Math.round(r.width / 3))
      canvas.height = Math.max(1, Math.round(r.height / 3))
    }
    resize()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    ro?.observe(canvas)

    const layers = [
      { img: tile, scale: 3.2, vx: 6, vy: 0.6, alpha: 0.55 },
      { img: tile2, scale: 2.1, vx: -9, vy: 1.2, alpha: 0.45 },
      { img: tile, scale: 1.3, vx: 14, vy: -0.8, alpha: 0.35 },
    ]

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!reduce) t += dt
      shown += (densityRef.current - shown) * Math.min(1, dt * 0.8)
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      for (const L of layers) {
        const pat = ctx.createPattern(L.img, 'repeat')
        if (!pat) continue
        const size = 128 * L.scale
        const ox = ((t * L.vx) % size + size) % size
        const oy = ((t * L.vy) % size + size) % size
        ctx.save()
        ctx.globalAlpha = L.alpha * shown
        ctx.translate(-ox, -oy)
        ctx.scale(L.scale, L.scale)
        ctx.fillStyle = pat
        ctx.fillRect(0, 0, (w + size * 2) / L.scale, (h + size * 2) / L.scale)
        ctx.restore()
      }
      // Sương đọng dày ở chân cảnh.
      const g = ctx.createLinearGradient(0, h * 0.55, 0, h)
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(1, color + Math.round(Math.min(1, shown * 0.9) * 200).toString(16).padStart(2, '0'))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [color])

  return <canvas ref={ref} className="fog-canvas" aria-hidden />
}
