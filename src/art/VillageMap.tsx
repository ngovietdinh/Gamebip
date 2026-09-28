/**
 * Tấm bản đồ làng. `drift` = số buổi đã trôi qua kể từ khi nhận bản đồ.
 * Mỗi buổi, một chi tiết tự lệch đi:
 *  1. Bến đò dịch sang phía xuôi dòng.
 *  2. Thêm một con đường không có thật.
 *  3. Cây đa đầu làng đổi chỗ.
 *  4. Mũi tên dòng chảy bị vẽ ngược.
 *  5. Thêm một bến đò thứ hai giả.
 */
export function VillageMap({ drift }: { drift: number }) {
  const d = Math.max(0, drift)
  const ink = '#3a2a1c'
  const paper = '#eadfc2'
  const ferryX = d >= 1 ? 170 : 520
  return (
    <svg viewBox="0 0 640 480" className="village-map" role="img" aria-label="Bản đồ làng">
      <defs>
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>
      <rect x="6" y="6" width="628" height="468" rx="10" fill={paper} stroke={ink} strokeWidth="3" />
      <g filter="url(#rough)" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round">
        {/* Sông phía trên, chảy từ phải sang trái */}
        <path d="M20 90 Q200 60 320 90 T620 80" strokeWidth="3" />
        <path d="M20 130 Q200 100 320 130 T620 120" strokeWidth="3" />
        {d >= 4 ? (
          <path d="M280 110 l40 0 m-10 -8 l10 8 l-10 8" strokeWidth="2" />
        ) : (
          <path d="M320 110 l-40 0 m10 -8 l-10 8 l10 8" strokeWidth="2" />
        )}
        {/* Rừng trúc */}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${60 + (i % 3) * 30} ${190 + Math.floor(i / 3) * 26} l0 -22`} strokeWidth="3" />
        ))}
        {/* Đình */}
        <path d="M290 250 q40 -30 80 0 M300 250 l0 30 l60 0 l0 -30" />
        {/* Chợ */}
        <path d="M290 400 l20 -20 l20 20 M330 400 l20 -20 l20 20 M280 400 l100 0" />
        {/* Đường thật */}
        <path d="M330 390 L330 285" strokeDasharray="6 6" />
        <path d="M300 265 Q200 240 150 230" strokeDasharray="6 6" />
        <path d={`M130 180 Q${(130 + ferryX) / 2} 150 ${ferryX} 150`} strokeDasharray="6 6" />
        {d >= 2 && <path d="M360 265 Q470 220 560 150" strokeDasharray="6 6" />}
        {/* Bến đò */}
        <path d={`M${ferryX - 22} 150 q22 14 44 0`} strokeWidth="3" />
        <path d={`M${ferryX} 150 l0 -18`} />
        {d >= 5 && (
          <>
            <path d="M400 150 q22 14 44 0" strokeWidth="3" />
            <path d="M422 150 l0 -18" />
          </>
        )}
        {/* Cây đa */}
        <circle cx={d >= 3 ? 470 : 420} cy={d >= 3 ? 360 : 320} r="16" />
        <path d={`M${d >= 3 ? 470 : 420} ${d >= 3 ? 376 : 336} l0 16`} />
        {/* Quán lá */}
        <path d="M100 150 l20 -14 l20 14 z" />
      </g>
      <g fontFamily="Lora, serif" fontSize="17" fill={ink}>
        <text x="300" y="430">Chợ phiên</text>
        <text x="305" y="300">Đình</text>
        <text x="40" y="275">Rừng trúc</text>
        <text x={ferryX - 30} y="176">Bến đò</text>
        {d >= 5 && <text x="395" y="176">Bến đò</text>}
        <text x="84" y="128" fontSize="14">Quán lá</text>
        <text x={d >= 3 ? 492 : 442} y={d >= 3 ? 366 : 326} fontSize="14">
          Cây đa
        </text>
        <text x="500" y="60" fontSize="14" fontStyle="italic">Sông</text>
        {d >= 2 && (
          <text x="470" y="230" fontSize="14">
            Lối tắt
          </text>
        )}
      </g>
      <g fontFamily="Be Vietnam Pro, sans-serif" fontSize="13" fill={ink} opacity="0.7">
        <text x="600" y="460" textAnchor="end">Bắc ↑</text>
      </g>
    </svg>
  )
}
