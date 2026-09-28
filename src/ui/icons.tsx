/** Biểu tượng SVG nhỏ dùng trong giao diện (không dùng thư viện ngoài). */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, JSX.Element> = {
    notebook: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" {...P} />
        <path d="M9 3v18M12 8h4M12 12h4" {...P} />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l-1 12H6L5 8z" {...P} />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" {...P} />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" {...P} />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...P} />
      </>
    ),
    sound: (
      <>
        <path d="M4 9h4l5-4v14l-5-4H4z" {...P} />
        <path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" {...P} />
      </>
    ),
    mute: (
      <>
        <path d="M4 9h4l5-4v14l-5-4H4z" {...P} />
        <path d="M17 9l5 6M22 9l-5 6" {...P} />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="12" r="4" {...P} />
        <path d="M12 12h9M18 12v3M21 12v2" {...P} />
      </>
    ),
    map: (
      <>
        <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" {...P} />
        <path d="M9 4v14M15 6v14" {...P} />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V4M5 4h11l-2 4 2 4H5" {...P} />
      </>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" {...P} />,
    brain: (
      <>
        <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z" {...P} />
        <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1" {...P} />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" {...P} />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" {...P} />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" {...P} />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" {...P} />
      </>
    ),
    hand: <path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-2L8 14" {...P} />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="icon">
      {paths[name] ?? null}
    </svg>
  )
}
