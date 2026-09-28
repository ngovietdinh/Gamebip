/** Kiểu dữ liệu chung cho mọi chương của "3:17 — Kẻ Không Mặt". */

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4'
export type Wall = 'n' | 's' | 'e' | 'w'

export type ItemKind = 'battery' | 'pills' | 'bandage' | 'key' | 'fuse'

export interface ItemDef {
  id: string
  name: string
  icon: string
  desc: string
  kind: ItemKind
}

export type Interactable = {
  id: string
  /** Vị trí theo ô (tâm vật), 1 ô = 2 m. */
  at: [number, number]
  label: string
  /** Mô hình 3D (khóa trong props.ts). */
  model: string
  /** Vật gắn tường: mặt trước quay ngược phía bức tường. */
  wall?: Wall
  /** Góc xoay tự do (radian), dùng khi không gắn tường. */
  rot?: number
  /** Bán kính vật cản (m). */
  solid?: number
  /** Chỉ hiện/tương tác khi có cờ này. */
  requires?: string
} & (
  | { kind: 'pickup'; item: string; flag?: string }
  | { kind: 'flashlight' }
  | { kind: 'note'; note: string }
  | { kind: 'keypad'; puzzle: string }
  | { kind: 'piano'; puzzle: string }
  | { kind: 'hide' }
  | { kind: 'door'; door: string }
  | { kind: 'photo'; photo: number }
  | { kind: 'mirror'; text: string }
  | { kind: 'examine'; text: string }
  /** Vật gợi ký ức: chạm vào là nhận mảnh ký ức. */
  | { kind: 'memory'; fragment: string }
  /** Sự kiện riêng của chương (điện thoại, loa, tủ điện…) — xử lý trong scripts.ts. */
  | { kind: 'event'; event: string }
  /** Lối ra của chương. */
  | { kind: 'exit'; key?: string; puzzle?: string; needFlag?: string; lockedText?: string }
)

export interface Puzzle {
  id: string
  title: string
  code: string
  hint: string
  /** 'digits': bàn phím số; 'notes': đàn piano (mã là dãy nốt 1–7). */
  kind?: 'digits' | 'notes'
  items: string[]
  fragment?: string
  /** Mở một cánh cửa khi giải được. */
  opens?: string
  flags?: string[]
  /** Giải xong là qua chương. */
  exit?: boolean
  solved: string
}

export interface Note {
  id: string
  title: string
  body: string
}

export interface Fragment {
  id: string
  chapter: ChapterId
  /** Chữ số (chương 1 dùng để ghép mật mã cửa chính). */
  digit?: string
  title: string
  text: string
}

export interface DoorDef {
  name: string
  key?: string
  /** Cửa khóa số: mở bằng câu đố này. */
  puzzle?: string
}

export type Floor = 'wood' | 'tile' | 'lino' | 'concrete' | 'carpet' | 'void'
export type WallStyle = 'wallpaper' | 'plaster' | 'tile' | 'hospital' | 'brick' | 'school' | 'void'

export interface RoomDef {
  name: string
  floor: Floor
  wall: WallStyle
  tint: string
}

export interface Lamp {
  id: string
  at: [number, number]
  color: string
  radius: number
  /** Cần có điện (cờ power) mới sáng. */
  needsPower?: boolean
}

export interface DecorDef {
  model: string
  at: [number, number]
  rot?: number
  wall?: Wall
  solid?: number
  scale?: number
}

export interface WindowDef {
  at: [number, number]
  wall: Wall
}

export interface EntityDef {
  /** Có Kẻ Không Mặt trong chương không, và khi nào nó bắt đầu đi săn. */
  mode: 'none' | 'patrol'
  /** Hoạt động ngay khi có cờ này (không có = hoạt động từ đầu). */
  activateFlag?: string
  spawn?: [number, number]
  speed?: number
  sight?: number
  /** Cờ làm nó nhanh và tinh hơn (ví dụ: khi có điện trở lại). */
  enrageFlag?: string
}

export interface ChapterDef {
  id: ChapterId
  index: number
  title: string
  subtitle: string
  /** Lời dẫn đầu chương. */
  intro: string[]
  /** Lời kết chương. */
  outro: string[]
  objective: string
  map: string[]
  rooms: Record<string, RoomDef>
  doors: Record<string, DoorDef>
  start: { x: number; z: number; yaw: number }
  interactables: Interactable[]
  puzzles: Record<string, Puzzle>
  notes: Record<string, Note>
  fragments: Fragment[]
  lamps: Lamp[]
  patrol: [number, number][]
  entity: EntityDef
  decor?: DecorDef[]
  windows?: WindowDef[]
  /** Những đứa trẻ không mặt (chỉ di chuyển khi không bị nhìn). */
  shades?: [number, number][]
  /** Chương mất điện: đèn cần cờ này mới sáng. */
  powerFlag?: string
  /** Ảnh gia đình (chương 1). */
  photos?: { year: number; people: number }[]
  /** Chương cuối: trận đối mặt. */
  finale?: boolean
  fog: number
  ambient: string
  /** Tiếng nền đặc trưng. */
  mood: 'house' | 'school' | 'hospital' | 'void'
}
