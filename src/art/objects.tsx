import type { ReactElement } from 'react'
import type { Registry } from '../engine/registry'
import type { RunState } from '../engine/state'
import type { Palette } from './palette'
import { Bamboo } from './shapes'

export interface SpriteCtx {
  p: Palette
  props: Record<string, string | number | boolean>
  run: RunState
  reg: Registry
}

interface SpriteDef {
  viewBox: string
  /** Mặc định giữ tỉ lệ và đặt đáy khung. */
  align?: string
  render: (c: SpriteCtx) => ReactElement
}

const arrow = (rot: number): SpriteDef => ({
  viewBox: '0 0 100 100',
  align: 'xMidYMid meet',
  render: ({ p }) => (
    <g transform={`rotate(${rot} 50 50)`} className="exit-arrow">
      <circle cx="50" cy="50" r="34" fill={p.fog} opacity="0.18" />
      <path d="M38 26 L64 50 L38 74" fill="none" stroke={p.light} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M38 26 L64 50 L38 74" fill="none" stroke={p.figure} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
    </g>
  ),
})

const CLOTH = ['#b8412f', '#f0ede6', '#34487e']

/** Một bên đường làng: cây gạo có con quạ, dãy bậc đá, cây nêu treo vải. */
const roadSide: SpriteDef = {
  viewBox: '0 0 400 500',
  align: 'xMidYMax meet',
  render: ({ p, props, run, reg }) => {
    const side = (props.side as 'left' | 'right') ?? 'left'
    const maze = reg.mazes['duong_lang']
    const st = run.mazes['duong_lang']?.sides[side] ?? { crow: 0, steps: 0, cloth: 0 }
    const stepCount = Number(maze?.details.find((d) => d.key === 'steps')?.values[st.steps] ?? 8)
    const crowUpper = st.crow === 0
    const flip = side === 'right'
    return (
      <g transform={flip ? 'translate(400 0) scale(-1 1)' : undefined}>
        {/* Cây gạo */}
        <path d="M70 500 L80 180 L100 180 L110 500 Z" fill={p.wood} />
        <path d="M90 220 Q150 180 210 190" stroke={p.wood} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M88 330 Q150 300 200 318" stroke={p.wood} strokeWidth="10" fill="none" strokeLinecap="round" />
        <ellipse cx="80" cy="170" rx="70" ry="44" fill={p.leaf} opacity="0.85" />
        <circle cx="45" cy="160" r="7" fill="#b34b3a" />
        <circle cx="110" cy="150" r="7" fill="#b34b3a" />
        {/* Con quạ */}
        <g transform={crowUpper ? 'translate(186 158)' : 'translate(176 286)'}>
          <path d="M0 26 Q4 4 22 2 Q34 0 38 10 L48 12 L38 16 Q34 30 18 32 L4 38 Z" fill="#111" />
          <circle cx="28" cy="9" r="2" fill={p.light} />
        </g>
        {/* Bậc đá */}
        {Array.from({ length: stepCount }, (_, i) => (
          <rect key={i} x={170 + i * 4} y={480 - i * 20} width={120 - i * 8} height="16" rx="3" fill={p.mid} stroke={p.groundDark} strokeOpacity="0.4" />
        ))}
        {/* Cây nêu */}
        <rect x="330" y="140" width="8" height="360" fill={p.wood} />
        <path d="M334 150 q-30 20 -18 60" stroke={p.leaf} strokeWidth="6" fill="none" />
        <path d="M338 170 L378 180 L372 250 L340 240 Z" fill={CLOTH[st.cloth] ?? CLOTH[0]} stroke={p.figure} strokeOpacity="0.3" />
      </g>
    )
  },
}

const bambooPath: SpriteDef = {
  // Lối trúc: bóng trúc luôn đổ sang TRÁI (khi lật sprite thì đổ sang phải).
  viewBox: '0 0 400 420',
  align: 'xMidYMax meet',
  render: ({ p }) => (
    <g>
      <ellipse cx="190" cy="400" rx="210" ry="34" fill={p.ground} opacity="0.95" />
      <path d="M140 420 L180 110 L220 110 L260 420 Z" fill={p.groundDark} opacity="0.55" />
      {[
        [70, 392, 330],
        [118, 384, 280],
        [300, 384, 300],
        [352, 396, 340],
      ].map(([x, y, h]) => (
        <g key={x}>
          {/* Bóng đổ dài, đậm về bên trái */}
          <path d={`M${x - 10} ${y} L${x + 10} ${y + 4} L${x - 180} ${y + 40} L${x - 230} ${y + 16} Z`} fill="#050608" opacity="0.6" />
          <Bamboo p={p} x={x} y={y} h={h} w={22} color={p.near} />
        </g>
      ))}
    </g>
  ),
}

export const OBJECTS: Record<string, SpriteDef> = {
  exitLeft: arrow(180),
  exitRight: arrow(0),
  exitUp: arrow(-90),
  exitDown: arrow(90),
  roadSide,
  bambooPath,
  clothStall: {
    viewBox: '0 0 300 260',
    render: ({ p }) => (
      <g>
        <path d="M10 60 L150 10 L290 60 Z" fill={p.roof} />
        <rect x="30" y="60" width="8" height="200" fill={p.wood} />
        <rect x="262" y="60" width="8" height="200" fill={p.wood} />
        <rect x="36" y="80" width="10" height="2" fill={p.figure} />
        {['#34487e', '#8b3a3a', '#caa04a', '#3f6b52', '#5a4a7a'].map((c, i) => (
          <path key={c} d={`M${50 + i * 44} 64 L${86 + i * 44} 64 L${82 + i * 44} ${170 + (i % 2) * 20} L${54 + i * 44} ${176 + (i % 2) * 20} Z`} fill={c} opacity="0.85" />
        ))}
        <rect x="20" y="210" width="260" height="14" fill={p.wood} />
      </g>
    ),
  },
  teaBench: {
    viewBox: '0 0 300 150',
    render: ({ p }) => (
      <g>
        <rect x="10" y="80" width="280" height="16" rx="4" fill={p.wood} />
        <rect x="24" y="96" width="10" height="54" fill={p.wood} />
        <rect x="266" y="96" width="10" height="54" fill={p.wood} />
        <ellipse cx="120" cy="66" rx="30" ry="18" fill={p.figure} opacity="0.85" />
        <rect x="170" y="58" width="18" height="20" rx="3" fill={p.light} opacity="0.8" />
        <path d="M120 44 q-8 -20 6 -40" stroke={p.fog} strokeWidth="4" fill="none" opacity="0.6" />
      </g>
    ),
  },
  buffalo: {
    viewBox: '0 0 300 200',
    render: ({ p }) => (
      <g fill={p.figure}>
        <ellipse cx="150" cy="100" rx="96" ry="46" />
        <rect x="80" y="120" width="16" height="72" rx="6" />
        <rect x="110" y="126" width="16" height="66" rx="6" />
        <rect x="178" y="126" width="16" height="66" rx="6" />
        <rect x="206" y="120" width="16" height="72" rx="6" />
        <path d="M60 90 Q30 80 20 110 Q30 132 58 120 Z" />
        <path d="M34 90 Q0 70 10 44 Q24 70 44 84 Z" stroke={p.rim} strokeOpacity="0.3" />
        <path d="M48 86 Q70 58 60 36 Q52 60 36 80 Z" stroke={p.rim} strokeOpacity="0.3" />
        <path d="M244 90 Q270 110 262 160" stroke={p.figure} strokeWidth="5" fill="none" className="tail" />
        <circle cx="28" cy="104" r="3" fill={p.light} />
      </g>
    ),
  },
  bambooGate: {
    viewBox: '0 0 240 320',
    render: ({ p }) => (
      <g>
        <path d="M0 320 L60 150 L180 150 L240 320 Z" fill={p.groundDark} opacity="0.3" />
        <Bamboo p={p} x={40} y={320} h={300} w={18} color={p.leaf} />
        <Bamboo p={p} x={200} y={320} h={300} w={18} color={p.leaf} />
        <rect x="30" y="30" width="180" height="16" rx="6" fill={p.leaf} />
        <rect x="30" y="60" width="180" height="10" rx="5" fill={p.leaf} opacity="0.8" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={58 + i * 20} y="120" width="10" height="200" rx="4" fill={p.leaf} opacity="0.75" />
        ))}
      </g>
    ),
  },
  fieldPath: {
    viewBox: '0 0 300 200',
    render: ({ p }) => (
      <g>
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M0 ${40 + i * 34} Q150 ${20 + i * 34} 300 ${40 + i * 34} L300 ${70 + i * 34} Q150 ${50 + i * 34} 0 ${70 + i * 34} Z`} fill={i % 2 ? p.leaf : p.ground} opacity="0.85" />
        ))}
        <path d="M150 200 Q140 120 160 30" stroke={p.light} strokeWidth="8" fill="none" opacity="0.4" strokeDasharray="10 8" />
      </g>
    ),
  },
  stoneSlope: {
    viewBox: '0 0 260 320',
    render: ({ p }) => (
      <g>
        <path d="M0 320 L120 40 L200 30 L260 320 Z" fill={p.mid} />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={70 + i * 8} y={290 - i * 30} width={120 - i * 6} height="16" rx="6" fill={p.near} opacity="0.8" />
        ))}
        <circle cx="60" cy="280" r="20" fill={p.leaf} opacity="0.7" />
        <circle cx="210" cy="140" r="14" fill={p.leaf} opacity="0.6" />
      </g>
    ),
  },
  drum: {
    viewBox: '0 0 200 240',
    render: ({ p }) => (
      <g>
        <rect x="40" y="170" width="10" height="70" fill={p.wood} />
        <rect x="150" y="170" width="10" height="70" fill={p.wood} />
        <path d="M30 60 Q100 40 170 60 L170 170 Q100 190 30 170 Z" fill="#7a3b2a" />
        <ellipse cx="100" cy="60" rx="70" ry="18" fill="#d8c9a3" />
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={36 + i * 14.5} cy={62 + Math.sin(i) * 2} r="2.5" fill={p.accent} />
        ))}
        <path d="M150 30 L190 10" stroke={p.wood} strokeWidth="6" strokeLinecap="round" />
      </g>
    ),
  },
  noticeBoard: {
    viewBox: '0 0 120 220',
    render: ({ p }) => (
      <g>
        <rect x="10" y="10" width="100" height="160" rx="4" fill={p.wood} />
        <rect x="18" y="18" width="84" height="144" fill="#e9dfc4" opacity="0.9" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="28" y={34 + i * 30} width="40" height="5" fill="#333" opacity="0.6" />
            <text x="82" y={42 + i * 30} fontSize="16" fontFamily="Lora, serif" fill="#7a2a1a">
              {['2', '4', '8', '?'][i]}
            </text>
          </g>
        ))}
        <rect x="56" y="170" width="8" height="50" fill={p.wood} />
      </g>
    ),
  },
  sanctuaryDoor: {
    viewBox: '0 0 200 300',
    render: ({ p, run }) => {
      const open = !!run.flags['a2_unlocked']
      return (
        <g>
          <rect x="10" y="20" width="180" height="280" fill={p.accent} opacity="0.5" />
          <rect x="20" y="30" width="160" height="270" fill={open ? '#120d0d' : '#6e2b22'} />
          {!open && (
            <>
              <line x1="100" y1="30" x2="100" y2="300" stroke="#3a1712" strokeWidth="4" />
              {[70, 140, 210].map((y) => (
                <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="#3a1712" strokeWidth="2" opacity="0.6" />
              ))}
              <rect x="88" y="160" width="24" height="30" rx="4" fill="#c9a44a" />
              <circle cx="100" cy="172" r="4" fill="#3a1712" />
            </>
          )}
          <path d="M0 20 Q100 -10 200 20" stroke={p.roof} strokeWidth="14" fill="none" />
        </g>
      )
    },
  },
  chest: {
    viewBox: '0 0 240 170',
    render: ({ p, run }) => (
      <g>
        <rect x="20" y="60" width="200" height="100" rx="6" fill="#8a2f22" />
        <path d={run.flags['a2_took_map'] ? 'M20 60 L50 10 L250 10 L220 60 Z' : 'M16 60 Q120 20 224 60 Z'} fill="#a33c2c" />
        <rect x="110" y="70" width="20" height="26" rx="3" fill="#c9a44a" />
        <rect x="20" y="100" width="200" height="6" fill={p.accent} opacity="0.6" />
      </g>
    ),
  },
  hut: {
    viewBox: '0 0 300 260',
    render: ({ p }) => (
      <g>
        <path d="M10 110 L150 10 L290 110 Z" fill="#8a7a4a" />
        <path d="M10 110 L150 10 L290 110" stroke={p.groundDark} strokeWidth="4" fill="none" opacity="0.5" />
        <rect x="40" y="110" width="220" height="150" fill={p.wood} />
        <rect x="120" y="160" width="60" height="100" fill={p.figure} opacity="0.8" />
        <rect x="200" y="140" width="36" height="36" fill={p.light} opacity={p.tod === 'toi' ? 0.7 : 0.3} />
        <path d="M230 30 q10 -20 0 -30" stroke={p.fog} strokeWidth="6" fill="none" opacity="0.5" />
      </g>
    ),
  },
  scroll: {
    viewBox: '0 0 80 320',
    render: ({ p }) => (
      <g>
        <rect x="6" y="4" width="68" height="10" rx="4" fill={p.wood} />
        <rect x="12" y="14" width="56" height="290" fill="#b33a2a" />
        {Array.from({ length: 6 }, (_, i) => (
          <text key={i} x="40" y={52 + i * 44} textAnchor="middle" fontSize="28" fill="#1a1a1a" fontFamily="serif">
            {['字', '圓', '如', '門', '影', '光'][i]}
          </text>
        ))}
        <rect x="6" y="304" width="68" height="10" rx="4" fill={p.wood} />
      </g>
    ),
  },
  sun: {
    viewBox: '0 0 100 100',
    align: 'xMidYMid meet',
    render: ({ props }) => (
      <g>
        <circle cx="50" cy="50" r="46" fill={props.evening ? '#ffb070' : '#fff1b8'} opacity="0.35" />
        <circle cx="50" cy="50" r="28" fill={props.evening ? '#ff9a4a' : '#ffe68a'} />
      </g>
    ),
  },
  moon: {
    viewBox: '0 0 100 100',
    align: 'xMidYMid meet',
    render: () => (
      <g>
        <circle cx="50" cy="50" r="44" fill="#d9ddff" opacity="0.2" />
        <circle cx="50" cy="50" r="24" fill="#eef0ff" />
        <circle cx="60" cy="44" r="20" fill="#2a2b50" opacity="0.35" />
      </g>
    ),
  },
  compass: {
    viewBox: '0 0 260 100',
    align: 'xMinYMid meet',
    render: ({ p }) => (
      <g>
        <rect x="4" y="20" width="252" height="60" rx="10" fill={p.figure} opacity="0.55" />
        <text x="24" y="58" fontSize="22" fill={p.light} fontFamily="Be Vietnam Pro, sans-serif">
          ← Tây
        </text>
        <text x="236" y="58" fontSize="22" fill={p.light} fontFamily="Be Vietnam Pro, sans-serif" textAnchor="end">
          Đông →
        </text>
      </g>
    ),
  },
  eye: {
    viewBox: '0 0 100 100',
    align: 'xMidYMid meet',
    render: ({ p }) => (
      <g>
        <circle cx="50" cy="50" r="36" fill={p.fog} opacity="0.25" />
        <path d="M18 50 Q50 20 82 50 Q50 80 18 50 Z" fill="none" stroke={p.light} strokeWidth="5" />
        <circle cx="50" cy="50" r="10" fill={p.light} />
      </g>
    ),
  },
  rock: {
    viewBox: '0 0 400 320',
    render: ({ p, run }) => (
      <g>
        <path d="M20 320 Q0 200 60 120 Q120 20 230 30 Q340 40 380 150 Q410 260 380 320 Z" fill={p.near} />
        <path d="M60 120 Q120 60 220 70" stroke={p.light} strokeOpacity="0.2" strokeWidth="6" fill="none" />
        <path d="M40 260 Q120 230 180 280" stroke={p.leaf} strokeWidth="18" fill="none" opacity="0.6" />
        <path d="M250 60 Q300 90 330 150" stroke={p.leaf} strokeWidth="14" fill="none" opacity="0.5" />
        {run.solved['a3_c'] && <path d="M360 170 L372 320 L352 320 Z" fill={p.light} opacity="0.45" className="glint" />}
      </g>
    ),
  },
  leafHut: {
    viewBox: '0 0 260 220',
    render: ({ p }) => (
      <g>
        <path d="M10 90 Q130 0 250 90 Z" fill={p.leaf} />
        <rect x="40" y="90" width="10" height="130" fill={p.wood} />
        <rect x="210" y="90" width="10" height="130" fill={p.wood} />
        <rect x="80" y="160" width="100" height="10" fill={p.wood} />
        <circle cx="130" cy="110" r="10" fill={p.accent} opacity="0.8" />
      </g>
    ),
  },
  teaPot: {
    viewBox: '0 0 120 100',
    render: ({ p }) => (
      <g>
        <ellipse cx="50" cy="60" rx="36" ry="28" fill={p.figure} opacity="0.85" />
        <path d="M84 56 Q104 44 108 26" stroke={p.figure} strokeWidth="7" fill="none" opacity="0.85" />
        <rect x="42" y="26" width="16" height="10" rx="4" fill={p.figure} />
        <path d="M50 20 q-6 -10 4 -18" stroke={p.fog} strokeWidth="3" fill="none" opacity="0.6" />
      </g>
    ),
  },
  boat: {
    viewBox: '0 0 400 140',
    render: ({ p }) => (
      <g>
        <path d="M10 60 Q200 130 390 60 Q300 90 200 92 Q100 90 10 60 Z" fill={p.wood} />
        <path d="M120 60 Q200 10 280 60 Z" fill={p.roof} />
        <path d="M300 20 L220 110" stroke={p.wood} strokeWidth="5" strokeLinecap="round" />
        <path d="M30 110 Q200 140 370 110" stroke={p.light} strokeOpacity="0.3" strokeWidth="3" fill="none" />
      </g>
    ),
  },
}

export function ObjectSvg({ sprite, ctx, className }: { sprite: string; ctx: SpriteCtx; className?: string }) {
  const def = OBJECTS[sprite]
  if (!def) return null
  return (
    <svg className={className} viewBox={def.viewBox} preserveAspectRatio={def.align ?? 'xMidYMax meet'} aria-hidden>
      {def.render(ctx)}
    </svg>
  )
}
