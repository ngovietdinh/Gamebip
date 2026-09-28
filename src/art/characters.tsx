import type { ReactElement } from 'react'
import type { Palette } from './palette'

/**
 * Silhouette nhân vật, viewBox 0 0 100 220, chân chạm đáy khung.
 * Mỗi nhân vật có chi tiết nhận diện riêng (nón, khăn, áo…).
 */
type CharArt = (p: Palette) => ReactElement

const rim = (p: Palette) => ({ stroke: p.rim, strokeOpacity: 0.35, strokeWidth: 1.2 })

const Stranger: CharArt = (p) => (
  <g>
    {/* Sương quấn quanh chân */}
    <ellipse cx="50" cy="214" rx="46" ry="6" fill={p.fog} opacity="0.6" />
    {/* Áo choàng dài */}
    <path d="M32 68 Q50 58 68 68 L84 214 Q50 220 16 214 Z" fill={p.figure} {...rim(p)} />
    <path d="M50 70 L50 212" stroke={p.rim} strokeOpacity="0.12" strokeWidth="2" />
    {/* Tay giấu trong áo */}
    <path d="M30 80 Q20 130 30 160" stroke={p.figure} strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M70 80 Q80 130 70 160" stroke={p.figure} strokeWidth="10" fill="none" strokeLinecap="round" />
    {/* Cổ, bóng tối dưới vành nón — không thấy mặt */}
    <rect x="42" y="50" width="16" height="22" fill={p.figure} />
    {/* Nón tre rộng vành che mặt */}
    <path d="M18 50 Q50 18 82 50 Z" fill={p.figure} {...rim(p)} />
    <ellipse cx="50" cy="52" rx="49" ry="9" fill={p.figure} {...rim(p)} />
    <path d="M6 54 Q50 64 94 54" stroke={p.rim} strokeOpacity="0.25" fill="none" />
    <path d="M30 40 L70 40 M24 46 L76 46" stroke={p.rim} strokeOpacity="0.15" />
  </g>
)

const BaLao: CharArt = (p) => (
  <g>
    {/* Lưng còng, áo tứ thân */}
    <path d="M36 92 Q54 76 70 96 L78 214 L26 214 Q24 150 36 92 Z" fill={p.figure} {...rim(p)} />
    <path d="M40 120 L64 120" stroke={p.accent} strokeOpacity="0.5" strokeWidth="3" />
    {/* Gậy */}
    <path d="M78 130 L86 214" stroke={p.wood} strokeWidth="4" strokeLinecap="round" />
    <path d="M68 110 Q78 120 80 132" stroke={p.figure} strokeWidth="8" fill="none" strokeLinecap="round" />
    {/* Đầu cúi */}
    <circle cx="60" cy="78" r="13" fill={p.figure} />
    {/* Khăn mỏ quạ: nhọn phía trước đỉnh đầu */}
    <path d="M44 80 Q46 58 62 60 Q72 60 76 50 Q76 66 74 78 Q60 72 44 80 Z" fill={p.figure} {...rim(p)} />
    <path d="M74 50 L78 44" stroke={p.figure} strokeWidth="4" strokeLinecap="round" />
  </g>
)

const CauBe: CharArt = (p) => (
  <g>
    {/* Dáng nhỏ */}
    <path d="M38 132 Q50 124 62 132 L64 178 L36 178 Z" fill={p.figure} {...rim(p)} />
    <rect x="38" y="176" width="9" height="38" fill={p.figure} />
    <rect x="53" y="176" width="9" height="38" fill={p.figure} />
    <circle cx="50" cy="120" r="11" fill={p.figure} />
    {/* Nón lá nhỏ */}
    <path d="M30 118 L50 94 L70 118 Z" fill={p.figure} {...rim(p)} />
    <path d="M36 112 L64 112" stroke={p.rim} strokeOpacity="0.2" />
    {/* Roi chăn trâu */}
    <path d="M62 140 Q76 150 72 170" stroke={p.figure} strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M74 166 Q94 110 86 90" stroke={p.wood} strokeWidth="3" fill="none" />
  </g>
)

function elder(p: Palette, variant: 1 | 2 | 3 | 4) {
  const band = ['#8a6a2c', '#4f6b3c', '#7a3b35', '#3e4f72'][variant - 1]
  return (
    <g>
      {/* Áo the dài */}
      <path d="M34 82 Q50 72 66 82 L76 214 L24 214 Z" fill={p.figure} {...rim(p)} />
      <path d="M50 84 L50 212" stroke={p.rim} strokeOpacity="0.12" />
      <path d="M36 150 L64 150" stroke={band} strokeWidth="3" opacity="0.7" />
      <circle cx="50" cy="62" r="13" fill={p.figure} />
      {/* Khăn xếp */}
      <ellipse cx="50" cy="52" rx="16" ry="8" fill={p.figure} {...rim(p)} />
      <path d="M35 52 Q50 44 65 52" stroke={band} strokeWidth="2.5" fill="none" />
      {/* Râu */}
      <path d={variant === 4 ? 'M44 72 Q50 104 56 72 Z' : 'M45 72 Q50 88 55 72 Z'} fill={p.rim} opacity="0.55" />
      {variant === 1 && <path d="M66 100 L84 88 L86 108 Z" fill={band} opacity="0.8" />}
      {variant === 2 && <path d="M70 110 L76 214" stroke={p.wood} strokeWidth="4" strokeLinecap="round" />}
      {variant === 3 && <path d="M60 74 L80 80 L80 86" stroke={p.wood} strokeWidth="3" fill="none" />}
      {variant === 4 && <rect x="24" y="118" width="14" height="30" fill={p.light} opacity="0.4" />}
    </g>
  )
}

const OngTu: CharArt = (p) => (
  <g>
    <path d="M34 84 Q50 74 66 84 L74 214 L26 214 Z" fill={p.figure} {...rim(p)} />
    <circle cx="50" cy="64" r="13" fill={p.figure} />
    <ellipse cx="50" cy="54" rx="15" ry="7" fill={p.figure} {...rim(p)} />
    {/* Dùi trống */}
    <path d="M66 110 L90 76" stroke={p.wood} strokeWidth="5" strokeLinecap="round" />
    <circle cx="91" cy="74" r="5" fill={p.accent} />
  </g>
)

const ThayDo: CharArt = (p) => (
  <g>
    <path d="M32 82 Q50 72 68 82 L78 214 L22 214 Z" fill={p.figure} {...rim(p)} />
    <path d="M50 84 L50 212" stroke={p.rim} strokeOpacity="0.15" />
    <circle cx="50" cy="62" r="13" fill={p.figure} />
    <ellipse cx="50" cy="51" rx="17" ry="8" fill={p.figure} {...rim(p)} />
    {/* Râu dài */}
    <path d="M44 72 Q50 112 56 72 Z" fill={p.rim} opacity="0.6" />
    {/* Cuộn giấy và bút lông */}
    <rect x="14" y="120" width="26" height="10" rx="4" fill={p.light} opacity="0.8" />
    <path d="M70 100 L86 132" stroke={p.wood} strokeWidth="3" />
    <path d="M86 132 l3 8" stroke={p.figure} strokeWidth="4" strokeLinecap="round" />
  </g>
)

const LaiDo: CharArt = (p) => (
  <g>
    <path d="M36 88 Q50 78 64 88 L70 176 L30 176 Z" fill={p.figure} {...rim(p)} />
    <rect x="34" y="174" width="12" height="40" fill={p.figure} />
    <rect x="54" y="174" width="12" height="40" fill={p.figure} />
    <circle cx="50" cy="70" r="12" fill={p.figure} />
    {/* Nón lá */}
    <path d="M24 70 L50 36 L76 70 Z" fill={p.figure} {...rim(p)} />
    <path d="M32 62 L68 62 M38 54 L62 54" stroke={p.rim} strokeOpacity="0.2" />
    {/* Sào chống đò */}
    <path d="M20 20 L84 214" stroke={p.wood} strokeWidth="4" strokeLinecap="round" />
    <path d="M36 100 Q28 110 30 120" stroke={p.figure} strokeWidth="8" fill="none" strokeLinecap="round" />
  </g>
)

const CoHang: CharArt = (p) => (
  <g>
    <path d="M36 86 Q50 76 64 86 L74 214 L26 214 Z" fill={p.figure} {...rim(p)} />
    <path d="M42 96 L50 120 L58 96" fill={p.accent} opacity="0.45" />
    <circle cx="50" cy="68" r="12" fill={p.figure} />
    {/* Khăn mỏ quạ */}
    <path d="M36 70 Q36 52 52 50 Q60 48 62 38 Q66 54 64 70 Q50 64 36 70 Z" fill={p.figure} {...rim(p)} />
    {/* Quang gánh */}
    <path d="M10 108 L90 100" stroke={p.wood} strokeWidth="4" strokeLinecap="round" />
    <path d="M14 108 L10 150 M86 100 L90 144" stroke={p.rim} strokeOpacity="0.3" />
    <ellipse cx="10" cy="156" rx="10" ry="6" fill={p.wood} />
    <ellipse cx="90" cy="150" rx="10" ry="6" fill={p.wood} />
  </g>
)

export const CHARACTER_ART: Record<string, CharArt> = {
  stranger: Stranger,
  baLao: BaLao,
  cauBe: CauBe,
  elder1: (p) => elder(p, 1),
  elder2: (p) => elder(p, 2),
  elder3: (p) => elder(p, 3),
  elder4: (p) => elder(p, 4),
  ongTu: OngTu,
  thayDo: ThayDo,
  laiDo: LaiDo,
  coHang: CoHang,
}

export function CharacterSvg({ sprite, p, className }: { sprite: string; p: Palette; className?: string }) {
  const A = CHARACTER_ART[sprite]
  if (!A) return null
  return (
    <svg className={className} viewBox="0 0 100 220" preserveAspectRatio="xMidYMax meet" aria-hidden>
      {A(p)}
    </svg>
  )
}
