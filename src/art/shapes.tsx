import type { Palette } from './palette'

/** Bộ sinh số giả ngẫu nhiên có hạt giống — để núi, trúc… luôn vẽ giống nhau. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Đường sống núi mềm mại qua 1600px. */
export function ridgePath(seed: number, baseY: number, amp: number, peaks = 7, bottom = 900): string {
  const r = rng(seed)
  const pts: [number, number][] = []
  const n = peaks * 2
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 1600
    const up = i % 2 === 1
    const y = baseY - (up ? amp * (0.55 + r() * 0.45) : amp * r() * 0.25)
    pts.push([x, y])
  }
  let d = `M-20 ${bottom} L-20 ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`
  }
  d += ` L1620 ${pts[pts.length - 1][1]} L1620 ${bottom} Z`
  return d
}

export function Sky({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id={`fogband-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.fog} stopOpacity="0" />
          <stop offset="0.5" stopColor={p.fog} stopOpacity="0.75" />
          <stop offset="1" stopColor={p.fog} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-20" y="-20" width="1640" height="940" fill={`url(#sky-${id})`} />
    </>
  )
}

export function FogBand({ id, y, h, opacity = 1 }: { id: string; y: number; h: number; opacity?: number }) {
  return <rect x="-20" y={y} width="1640" height={h} fill={`url(#fogband-${id})`} opacity={opacity} />
}

/** Núi xếp lớp, mờ dần theo chiều sâu, xen kẽ dải sương. */
export function Mountains({ p, id, seed = 1, base = 470, layers = 3 }: { p: Palette; id: string; seed?: number; base?: number; layers?: number }) {
  const colors = [p.far, p.mid, p.near]
  return (
    <g>
      {Array.from({ length: layers }, (_, i) => (
        <g key={i}>
          <path d={ridgePath(seed * 13 + i * 7, base - 150 + i * 70, 190 - i * 40, 5 + i * 2)} fill={colors[i % 3]} opacity={0.55 + i * 0.2} />
          <FogBand id={id} y={base - 170 + i * 70} h={140} opacity={0.8 - i * 0.15} />
        </g>
      ))}
    </g>
  )
}

export function Ground({ p, y = 700, color }: { p: Palette; y?: number; color?: string }) {
  return <path d={`M-20 ${y} Q400 ${y - 20} 800 ${y} T1620 ${y} L1620 920 L-20 920 Z`} fill={color ?? p.ground} />
}

/** Ruộng bậc thang: các dải cong xếp tầng. */
export function Terraces({ p, y = 560, rows = 6, seed = 3 }: { p: Palette; y?: number; rows?: number; seed?: number }) {
  const r = rng(seed)
  return (
    <g>
      {Array.from({ length: rows }, (_, i) => {
        const yy = y + i * 34
        const wob = 20 + r() * 25
        const shade = i % 2 === 0 ? p.leaf : p.ground
        return (
          <g key={i}>
            <path
              d={`M-20 ${yy} C300 ${yy - wob} 600 ${yy + wob} 900 ${yy - 5} S1400 ${yy - wob} 1620 ${yy} L1620 ${yy + 60} L-20 ${yy + 60} Z`}
              fill={shade}
              opacity={0.55 + i * 0.07}
            />
            <path
              d={`M-20 ${yy} C300 ${yy - wob} 600 ${yy + wob} 900 ${yy - 5} S1400 ${yy - wob} 1620 ${yy}`}
              fill="none"
              stroke={p.light}
              strokeOpacity="0.35"
              strokeWidth="2"
            />
          </g>
        )
      })}
    </g>
  )
}

/** Mái đình cong vút kiểu Bắc Bộ. */
export function DinhRoof({ p, x, y, w, h = 90 }: { p: Palette; x: number; y: number; w: number; h?: number }) {
  const l = x
  const r = x + w
  return (
    <g>
      <path
        d={`M${l - 40} ${y + h - 30} Q${l - 20} ${y + h} ${l + 30} ${y + h - 6} L${r - 30} ${y + h - 6} Q${r + 20} ${y + h} ${r + 40} ${y + h - 30} Q${r + 10} ${y + h - 20} ${r - 40} ${y + 10} L${l + 40} ${y + 10} Q${l - 10} ${y + h - 20} ${l - 40} ${y + h - 30} Z`}
        fill={p.roof}
      />
      <path d={`M${l + 40} ${y + 10} L${r - 40} ${y + 10}`} stroke={p.accent} strokeWidth="5" opacity="0.6" />
      <path d={`M${x + w / 2 - 30} ${y + 8} Q${x + w / 2} ${y - 20} ${x + w / 2 + 30} ${y + 8}`} fill={p.roof} />
    </g>
  )
}

/** Thân trúc thẳng đứng có đốt. */
export function Bamboo({ p, x, y, h, w = 14, lean = 0, color }: { p: Palette; x: number; y: number; h: number; w?: number; lean?: number; color?: string }) {
  const c = color ?? p.leaf
  const nodes = Math.floor(h / 70)
  return (
    <g transform={`rotate(${lean} ${x} ${y})`}>
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={c} rx={w / 3} />
      {Array.from({ length: nodes }, (_, i) => (
        <rect key={i} x={x - w / 2 - 1} y={y - (i + 1) * 70} width={w + 2} height="4" fill={p.groundDark} opacity="0.5" />
      ))}
      <path d={`M${x} ${y - h + 20} q30 -10 55 5 q-30 5 -55 -5`} fill={c} />
      <path d={`M${x} ${y - h + 60} q-30 -12 -58 4 q30 6 58 -4`} fill={c} />
    </g>
  )
}

export function BambooGrove({ p, seed = 5, count = 18, y = 900, minH = 500, maxH = 900, opacity = 1, color }: { p: Palette; seed?: number; count?: number; y?: number; minH?: number; maxH?: number; opacity?: number; color?: string }) {
  const r = rng(seed)
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i / count) * 1600 + r() * 60
        return <Bamboo key={i} p={p} x={x} y={y} h={minH + r() * (maxH - minH)} w={10 + r() * 10} lean={(r() - 0.5) * 6} color={color} />
      })}
    </g>
  )
}

export function Lantern({ p, x, y }: { p: Palette; x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y - 30} x2={x} y2={y} stroke={p.figure} strokeWidth="2" />
      <ellipse cx={x} cy={y + 18} rx="14" ry="20" fill={p.accent} opacity="0.85" />
      <ellipse cx={x} cy={y + 18} rx="22" ry="28" fill={p.light} opacity={p.tod === 'toi' ? 0.25 : 0.08} />
    </g>
  )
}

export function Stall({ p, x, y, w = 260, cloth }: { p: Palette; x: number; y: number; w?: number; cloth?: string }) {
  return (
    <g>
      <path d={`M${x - 20} ${y} L${x + w / 2} ${y - 60} L${x + w + 20} ${y} Z`} fill={p.roof} opacity="0.9" />
      <rect x={x} y={y} width="8" height="150" fill={p.wood} />
      <rect x={x + w - 8} y={y} width="8" height="150" fill={p.wood} />
      <rect x={x - 5} y={y + 100} width={w + 10} height="16" fill={p.wood} />
      <rect x={x + 20} y={y + 70} width={w - 40} height="30" fill={cloth ?? p.accent} opacity="0.7" />
    </g>
  )
}

export function Stars({ p }: { p: Palette }) {
  if (p.tod !== 'toi') return null
  const r = rng(99)
  return (
    <g>
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={r() * 1600} cy={r() * 300} r={r() * 1.8 + 0.4} fill={p.light} opacity={0.3 + r() * 0.5} />
      ))}
    </g>
  )
}
