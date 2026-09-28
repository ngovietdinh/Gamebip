import type { ReactElement } from 'react'
import type { Palette } from './palette'
import { Bamboo, BambooGrove, DinhRoof, FogBand, Ground, Lantern, Mountains, rng, Sky, Stall, Stars, Terraces } from './shapes'

type Bg = (p: Palette) => ReactElement

const Market: Bg = (p) => (
  <>
    <Sky p={p} id="market" />
    <Stars p={p} />
    <Mountains p={p} id="market" seed={2} base={470} />
    <Terraces p={p} y={500} rows={3} seed={4} />
    <FogBand id="market" y={470} h={160} />
    <Ground p={p} y={640} />
    <Stall p={p} x={60} y={450} w={300} cloth="#5a6b9a" />
    <Stall p={p} x={1240} y={460} w={300} cloth="#9a5a5a" />
    <Stall p={p} x={560} y={400} w={200} cloth={p.accent} />
    <g opacity="0.45">
      <Stall p={p} x={860} y={380} w={180} />
      <Stall p={p} x={380} y={390} w={150} />
    </g>
    {[200, 480, 1100, 1400].map((x) => (
      <Lantern key={x} p={p} x={x} y={390} />
    ))}
    <path d="M-20 900 Q800 760 1620 900 Z" fill={p.groundDark} opacity="0.6" />
    <FogBand id="market" y={720} h={200} opacity={0.6} />
  </>
)

const TeaStall: Bg = (p) => (
  <>
    <Sky p={p} id="tea" />
    <Stars p={p} />
    <Mountains p={p} id="tea" seed={6} base={420} layers={2} />
    <Ground p={p} y={600} />
    {/* Mái lá của quán nước */}
    <path d="M200 260 L800 180 L1400 260 L1360 300 L240 300 Z" fill={p.roof} />
    <path d="M240 300 L1360 300" stroke={p.accent} strokeWidth="4" opacity="0.5" />
    <rect x="260" y="300" width="14" height="420" fill={p.wood} />
    <rect x="1326" y="300" width="14" height="420" fill={p.wood} />
    {/* Chõng tre */}
    <rect x="420" y="620" width="760" height="22" fill={p.wood} />
    <rect x="440" y="642" width="10" height="80" fill={p.wood} />
    <rect x="1150" y="642" width="10" height="80" fill={p.wood} />
    {/* Ấm, chén, lọ kẹo lạc */}
    <ellipse cx="560" cy="600" rx="50" ry="36" fill={p.figure} opacity="0.8" />
    <path d="M605 590 q30 -10 40 -30" stroke={p.figure} strokeWidth="8" fill="none" opacity="0.8" />
    {[680, 720, 760].map((x) => (
      <rect key={x} x={x} y="598" width="26" height="22" rx="4" fill={p.light} opacity="0.7" />
    ))}
    <rect x="1000" y="560" width="50" height="60" rx="8" fill={p.accent} opacity="0.5" />
    <path d="M560 560 q-10 -40 10 -70 q15 -20 0 -50" stroke={p.fog} strokeWidth="6" fill="none" opacity="0.5" />
    <FogBand id="tea" y={700} h={220} opacity={0.6} />
  </>
)

const BuffaloField: Bg = (p) => (
  <>
    <Sky p={p} id="buffalo" />
    <Stars p={p} />
    <Mountains p={p} id="buffalo" seed={9} base={400} />
    <Terraces p={p} y={430} rows={9} seed={11} />
    <FogBand id="buffalo" y={420} h={200} />
    <path d="M-20 900 Q600 700 1620 800 L1620 920 L-20 920 Z" fill={p.ground} />
    <rect x="1300" y="560" width="10" height="200" fill={p.wood} />
    <path d="M1250 600 q55 -90 110 0 z" fill={p.leaf} />
  </>
)

const VillageRoad: Bg = (p) => (
  <>
    <Sky p={p} id="road" />
    <Stars p={p} />
    <Mountains p={p} id="road" seed={17} base={420} layers={2} />
    <FogBand id="road" y={360} h={220} />
    <Ground p={p} y={560} />
    {/* Con đường chia hai ngả */}
    <path d="M700 900 L760 560 L840 560 L900 900 Z" fill={p.groundDark} opacity="0.5" />
    <path d="M760 560 Q700 520 400 520 L380 560 Q700 580 760 600 Z" fill={p.groundDark} opacity="0.4" />
    <path d="M840 560 Q900 520 1200 520 L1220 560 Q900 580 840 600 Z" fill={p.groundDark} opacity="0.4" />
    <FogBand id="road" y={700} h={240} opacity={0.7} />
  </>
)

const Crossroads: Bg = (p) => (
  <>
    <Sky p={p} id="cross" />
    <Stars p={p} />
    <Mountains p={p} id="cross" seed={23} base={430} />
    <Terraces p={p} y={560} rows={4} seed={8} />
    <FogBand id="cross" y={420} h={200} />
    <Ground p={p} y={720} />
    <path d="M800 920 L780 720 L820 720 Z" fill={p.groundDark} opacity="0.5" />
    <FogBand id="cross" y={740} h={200} opacity={0.5} />
  </>
)

const DinhYard: Bg = (p) => (
  <>
    <Sky p={p} id="yard" />
    <Stars p={p} />
    <Mountains p={p} id="yard" seed={31} base={380} layers={2} />
    <FogBand id="yard" y={300} h={200} />
    {/* Đình làng */}
    <rect x="360" y="400" width="880" height="260" fill={p.wood} opacity="0.85" />
    {[420, 560, 700, 900, 1040, 1180].map((x) => (
      <rect key={x} x={x} y="400" width="22" height="260" fill={p.roof} />
    ))}
    <rect x="740" y="470" width="120" height="190" fill={p.figure} opacity="0.55" />
    <DinhRoof p={p} x={330} y={270} w={940} h={150} />
    <DinhRoof p={p} x={430} y={190} w={740} h={110} />
    {/* Sân gạch */}
    <path d="M-20 660 L1620 660 L1620 920 L-20 920 Z" fill={p.ground} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1="-20" y1={680 + i * 30} x2="1620" y2={680 + i * 30} stroke={p.groundDark} strokeOpacity="0.3" />
    ))}
    <FogBand id="yard" y={720} h={220} opacity={0.5} />
  </>
)

const DinhHall: Bg = (p) => (
  <>
    <rect x="-20" y="-20" width="1640" height="940" fill={p.roof} />
    <rect x="-20" y="-20" width="1640" height="940" fill={p.light} opacity={p.tod === 'toi' ? 0.05 : 0.12} />
    {/* Cột lim và kèo */}
    {[80, 330, 1270, 1520].map((x) => (
      <rect key={x} x={x} y="-20" width="46" height="820" fill={p.wood} />
    ))}
    <path d="M-20 120 L1620 120" stroke={p.wood} strokeWidth="30" />
    <path d="M-20 60 Q800 -40 1620 60" stroke={p.wood} strokeWidth="18" fill="none" />
    {/* Hoành phi */}
    <rect x="600" y="40" width="400" height="70" rx="6" fill={p.accent} opacity="0.7" />
    <text x="800" y="88" textAnchor="middle" fontFamily="Lora, serif" fontSize="38" fill={p.roof}>
      Đình Làng
    </text>
    {/* Chiếu và nền */}
    <rect x="-20" y="700" width="1640" height="220" fill={p.groundDark} />
    <rect x="80" y="700" width="1440" height="60" fill="#8e3b30" opacity="0.55" />
    <rect x="80" y="704" width="1440" height="6" fill={p.accent} opacity="0.5" />
    {/* Đèn dầu */}
    <circle cx="200" cy="420" r="80" fill={p.light} opacity="0.12" />
    <circle cx="1400" cy="420" r="80" fill={p.light} opacity="0.12" />
  </>
)

const Sanctuary: Bg = (p) => (
  <>
    <rect x="-20" y="-20" width="1640" height="940" fill="#1a1618" />
    <rect x="-20" y="-20" width="1640" height="940" fill={p.roof} opacity="0.5" />
    {/* Tia sáng lọt qua khe ván */}
    <path d="M700 -20 L760 -20 L900 900 L760 900 Z" fill={p.light} opacity="0.12" />
    <path d="M880 -20 L900 -20 L1000 900 L950 900 Z" fill={p.light} opacity="0.08" />
    {/* Ban thờ */}
    <rect x="520" y="300" width="560" height="40" fill={p.accent} opacity="0.5" />
    <rect x="560" y="340" width="480" height="200" fill={p.wood} opacity="0.7" />
    <circle cx="800" cy="260" r="40" fill={p.accent} opacity="0.4" />
    {[680, 920].map((x) => (
      <g key={x}>
        <rect x={x - 4} y="240" width="8" height="60" fill={p.accent} opacity="0.6" />
        <circle cx={x} cy="232" r="10" fill="#ffcf7a" opacity="0.7" />
      </g>
    ))}
    <path d="M790 250 q-10 -60 10 -120 q12 -40 -5 -80" stroke={p.fog} strokeWidth="3" fill="none" opacity="0.3" />
    <rect x="-20" y="720" width="1640" height="200" fill="#0f0c0d" />
  </>
)

const ForestEdge: Bg = (p) => (
  <>
    <Sky p={p} id="edge" />
    <Stars p={p} />
    <Mountains p={p} id="edge" seed={41} base={380} layers={2} />
    <BambooGrove p={p} seed={7} count={26} y={700} minH={380} maxH={640} opacity={0.35} color={p.far} />
    <FogBand id="edge" y={340} h={260} />
    <BambooGrove p={p} seed={8} count={16} y={740} minH={420} maxH={720} opacity={0.7} color={p.mid} />
    <Ground p={p} y={680} />
    <FogBand id="edge" y={640} h={200} opacity={0.7} />
  </>
)

const ScholarHut: Bg = (p) => (
  <>
    <rect x="-20" y="-20" width="1640" height="940" fill={p.wood} />
    <rect x="-20" y="-20" width="1640" height="940" fill={p.fog} opacity={p.tod === 'toi' ? 0.08 : 0.2} />
    {/* Vách nứa */}
    {Array.from({ length: 40 }, (_, i) => (
      <line key={i} x1={i * 42} y1="-20" x2={i * 42} y2="700" stroke={p.groundDark} strokeOpacity="0.35" strokeWidth="3" />
    ))}
    {/* Cửa sổ tròn nhìn ra rừng trúc */}
    <circle cx="1180" cy="300" r="150" fill={p.skyBottom} />
    <g clipPath="url(#hutwin)">
      <BambooGrove p={p} seed={12} count={30} y={460} minH={200} maxH={380} color={p.mid} />
    </g>
    <defs>
      <clipPath id="hutwin">
        <circle cx="1180" cy="300" r="150" />
      </clipPath>
    </defs>
    <circle cx="1180" cy="300" r="150" fill="none" stroke={p.roof} strokeWidth="18" />
    {/* Án thư, nghiên mực */}
    <rect x="300" y="620" width="1000" height="40" fill={p.roof} />
    <rect x="340" y="660" width="20" height="120" fill={p.roof} />
    <rect x="1240" y="660" width="20" height="120" fill={p.roof} />
    <rect x="1000" y="596" width="90" height="24" rx="6" fill={p.figure} />
    <rect x="600" y="600" width="260" height="20" fill={p.light} opacity="0.7" />
    <rect x="-20" y="780" width="1640" height="140" fill={p.groundDark} />
  </>
)

const TwinPath: Bg = (p) => (
  <>
    <Sky p={p} id="twin" />
    <Stars p={p} />
    <BambooGrove p={p} seed={15} count={22} y={640} minH={300} maxH={560} opacity={0.35} color={p.far} />
    <FogBand id="twin" y={300} h={280} />
    <Ground p={p} y={600} />
    <BambooGrove p={p} seed={16} count={6} y={900} minH={700} maxH={900} opacity={0.9} color={p.near} />
    <FogBand id="twin" y={720} h={200} opacity={0.5} />
  </>
)

const BigRock: Bg = (p) => (
  <>
    <Sky p={p} id="rock" />
    <Stars p={p} />
    <BambooGrove p={p} seed={21} count={24} y={660} minH={300} maxH={600} opacity={0.4} color={p.mid} />
    <FogBand id="rock" y={320} h={280} />
    <Ground p={p} y={650} />
    <Bamboo p={p} x={60} y={900} h={880} w={26} color={p.near} />
    <Bamboo p={p} x={1540} y={900} h={880} w={26} color={p.near} />
    <FogBand id="rock" y={700} h={220} opacity={0.6} />
  </>
)

const Riverbank: Bg = (p) => (
  <>
    <Sky p={p} id="river" />
    <Stars p={p} />
    <Mountains p={p} id="river" seed={51} base={380} layers={2} />
    <FogBand id="river" y={320} h={220} />
    {/* Dòng sông, nước chảy từ phải sang trái */}
    <path d="M-20 470 Q800 440 1620 470 L1620 640 Q800 610 -20 640 Z" fill={p.water} />
    {Array.from({ length: 10 }, (_, i) => {
      const r = rng(i + 3)
      const x = 100 + i * 150 + r() * 40
      const y = 500 + r() * 110
      return (
        <g key={i} opacity="0.6">
          <path d={`M${x} ${y} l-40 0`} stroke={p.light} strokeWidth="3" strokeLinecap="round" />
          <path d={`M${x - 46} ${y} l10 -6 m-10 6 l10 6`} stroke={p.light} strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      )
    })}
    <ellipse cx="400" cy="560" rx="14" ry="6" fill={p.leaf} />
    <ellipse cx="1100" cy="520" rx="14" ry="6" fill={p.leaf} />
    <Ground p={p} y={640} />
    <path d="M-20 660 Q400 640 800 660 T1620 660" stroke={p.groundDark} strokeWidth="6" fill="none" opacity="0.5" />
    {/* Lau sậy */}
    {Array.from({ length: 30 }, (_, i) => (
      <path key={i} d={`M${i * 55} 700 q${(i % 3) * 6 - 6} -50 ${(i % 5) * 4 - 8} -90`} stroke={p.leaf} strokeWidth="4" fill="none" />
    ))}
    <FogBand id="river" y={560} h={240} opacity={0.6} />
  </>
)

const LeafHouse: Bg = (p) => (
  <>
    <Sky p={p} id="leaf" />
    <Stars p={p} />
    <Mountains p={p} id="leaf" seed={61} base={360} layers={2} />
    <Ground p={p} y={620} />
    {/* Quán lá */}
    <path d="M180 320 Q800 180 1420 320 L1380 360 L220 360 Z" fill={p.leaf} />
    <path d="M220 360 Q800 250 1380 360" stroke={p.groundDark} strokeWidth="6" fill="none" opacity="0.4" />
    <rect x="260" y="360" width="16" height="360" fill={p.wood} />
    <rect x="1324" y="360" width="16" height="360" fill={p.wood} />
    <rect x="500" y="640" width="600" height="20" fill={p.wood} />
    <rect x="520" y="660" width="10" height="70" fill={p.wood} />
    <rect x="1070" y="660" width="10" height="70" fill={p.wood} />
    <Lantern p={p} x={800} y={380} />
    <FogBand id="leaf" y={680} h={240} opacity={0.6} />
  </>
)

const Ferry: Bg = (p) => (
  <>
    <Sky p={p} id="ferry" />
    <Stars p={p} />
    <Mountains p={p} id="ferry" seed={71} base={360} layers={3} />
    <FogBand id="ferry" y={300} h={240} />
    <path d="M-20 520 Q800 490 1620 520 L1620 920 L-20 920 Z" fill={p.water} />
    {Array.from({ length: 8 }, (_, i) => (
      <path key={i} d={`M${100 + i * 200} ${600 + (i % 3) * 60} q30 -8 60 0`} stroke={p.light} strokeWidth="3" fill="none" opacity="0.4" />
    ))}
    {/* Bến tre */}
    <path d="M-20 700 L700 640 L700 670 L-20 740 Z" fill={p.wood} />
    {[80, 240, 400, 560].map((x) => (
      <rect key={x} x={x} y={640} width="12" height="200" fill={p.wood} />
    ))}
    {/* Cây gạo đầu bến */}
    <rect x="1380" y="260" width="40" height="300" fill={p.wood} />
    <path d="M1260 300 Q1400 120 1540 300 Q1400 260 1260 300 Z" fill={p.leaf} />
    <circle cx="1330" cy="270" r="10" fill="#b34b3a" />
    <circle cx="1470" cy="250" r="10" fill="#b34b3a" />
    <FogBand id="ferry" y={620} h={260} opacity={0.5} />
  </>
)

export const BACKGROUNDS: Record<string, Bg> = {
  market: Market,
  teaStall: TeaStall,
  buffaloField: BuffaloField,
  villageRoad: VillageRoad,
  crossroads: Crossroads,
  dinhYard: DinhYard,
  dinhHall: DinhHall,
  sanctuary: Sanctuary,
  forestEdge: ForestEdge,
  scholarHut: ScholarHut,
  twinPath: TwinPath,
  bigRock: BigRock,
  riverbank: Riverbank,
  leafHouse: LeafHouse,
  ferry: Ferry,
}

export function Background({ art, p }: { art: string; p: Palette }) {
  const B = BACKGROUNDS[art] ?? Market
  return (
    <svg className="bg-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      {B(p)}
    </svg>
  )
}
