// Kiểu dữ liệu dùng chung cho toàn bộ engine.
// Mọi nội dung game (cảnh, hội thoại, câu đố…) đều được mô tả bằng các kiểu này,
// vì vậy thêm khu vực mới chỉ cần thêm dữ liệu, không phải sửa engine.

export type TimeOfDay = 'sang' | 'chieu' | 'toi'
export type FlagValue = boolean | number | string

export type SoundId =
  | 'click'
  | 'bell'
  | 'drum'
  | 'drum3'
  | 'success'
  | 'fail'
  | 'page'
  | 'whoosh'
  | 'glitch'

export type FallacyId =
  | 'authority'
  | 'pressure'
  | 'pattern'
  | 'intuition'
  | 'timeContext'
  | 'tool'

// ---------------------------------------------------------------- Điều kiện
export type Condition =
  | { t: 'flag'; key: string; eq?: FlagValue }
  | { t: 'notFlag'; key: string }
  | { t: 'flagAtLeast'; key: string; n: number }
  | { t: 'item'; id: string }
  | { t: 'noItem'; id: string }
  | { t: 'clue'; id: string }
  | { t: 'tod'; in: TimeOfDay[] }
  | { t: 'day'; min?: number; max?: number }
  | { t: 'loop'; min?: number; max?: number }
  | { t: 'sanity'; min?: number; max?: number }
  | { t: 'solved'; id: string }
  | { t: 'mazeBaseline'; id: string }
  /** Số buổi trôi qua kể từ lúc 'stamp' flag key >= n. */
  | { t: 'since'; key: string; n: number }
  | { t: 'all'; of: Condition[] }
  | { t: 'any'; of: Condition[] }
  | { t: 'not'; c: Condition }

// ---------------------------------------------------------------- Hiệu ứng
export type Effect =
  | { t: 'dialogue'; id: string }
  | { t: 'goto'; scene: string; free?: boolean }
  | { t: 'clue'; id: string }
  | { t: 'flag'; key: string; value?: FlagValue }
  | { t: 'incFlag'; key: string; by?: number }
  | { t: 'item'; id: string }
  | { t: 'removeItem'; id: string }
  | { t: 'time'; n: number }
  | { t: 'nextSegment' }
  | { t: 'sanity'; n: number }
  | { t: 'puzzle'; id: string }
  | { t: 'puzzleSeq'; id: string }
  | { t: 'verdict'; id: string; preset?: Record<string, string> }
  | { t: 'sound'; id: SoundId }
  | { t: 'achievement'; id: string }
  | {
      t: 'mistake'
      fallacy: FallacyId
      explain: string
      missed: string
      sanity?: number
      /** Không hiện thẻ ngay, chỉ ghi lại và hiện sau (dùng cho màn Game Over giả). */
      deferred?: boolean
    }
  | { t: 'say'; speaker?: string; text: string }
  | { t: 'overlay'; id: string }
  | { t: 'closeOverlay' }
  | { t: 'toast'; text: string }
  | { t: 'card'; title: string; body: string; kicker?: string; speaker?: string }
  | { t: 'maze'; id: string; action: 'enter' | 'advance' | 'left' | 'right' }
  /** Ghi lại buổi hiện tại vào flag (dùng để đo số buổi đã trôi qua). */
  | { t: 'stamp'; key: string }
  | { t: 'markEnding'; id: EndingId }
  | { t: 'if'; c: Condition; then: Effect[]; else?: Effect[] }
  | { t: 'once'; key: string; then: Effect[] }

// ---------------------------------------------------------------- Nhân vật
export interface Character {
  id: string
  name: string
  /** Khóa sprite SVG trong src/art. */
  sprite: string
  /** Ảnh thay thế (đặt trong public/assets/characters). Nếu có, dùng ảnh thay cho SVG. */
  image?: string
  /** Màu tên trong hộp thoại. */
  color?: string
  /** Nhân vật có thể bị buộc tội ở màn phán xử cuối. */
  suspect?: boolean
}

// ---------------------------------------------------------------- Cảnh
export interface Hotspot {
  id: string
  label: string
  kind: 'character' | 'object' | 'exit'
  /** Tọa độ và kích thước tính theo % khung cảnh. */
  x: number
  y: number
  w: number
  h: number
  /** Nhân vật được vẽ ở hotspot (dùng sprite của nhân vật). */
  character?: string
  /** Hoặc một sprite đồ vật. */
  sprite?: string
  /** Lật ngang sprite. */
  flip?: boolean
  if?: Condition
  onClick: Effect[]
  /** Dùng vật phẩm lên hotspot: itemId -> hiệu ứng. */
  useItem?: Record<string, Effect[]>
}

export interface Decor {
  sprite: string
  x: number
  y: number
  w: number
  h: number
  flip?: boolean
  if?: Condition
  /** Tham số tùy ý truyền cho sprite. */
  props?: Record<string, string | number | boolean>
}

export interface Scene {
  id: string
  area: string
  name: string
  /** Khóa nền SVG trong src/art/backgrounds. */
  art: string
  /** Ảnh nền thay thế trong public/assets/backgrounds. */
  image?: string
  /** Lời dẫn mỗi lần vào cảnh (tùy chọn). */
  intro?: string
  hotspots: Hotspot[]
  decor?: Decor[]
  /** Chạy mỗi lần vào cảnh (sau khi chuyển cảnh xong). */
  onEnter?: Effect[]
}

// ---------------------------------------------------------------- Hội thoại
export interface Choice {
  text: string
  if?: Condition
  effects?: Effect[]
  next?: string
}

export interface TextVariant {
  if: Condition
  text: string
}

export interface DialogueNode {
  speaker?: string
  text: string
  variants?: TextVariant[]
  effects?: Effect[]
  choices?: Choice[]
  next?: string
}

export interface Dialogue {
  id: string
  /** Nút bắt đầu; có thể chọn theo điều kiện (dòng đầu tiên thỏa mãn). */
  start: string | { if?: Condition; node: string }[]
  nodes: Record<string, DialogueNode>
  /** Không tính là một hành động khi kết thúc. */
  free?: boolean
}

// ---------------------------------------------------------------- Câu đố
export interface PuzzleOption {
  id: string
  label: string
}

export interface Puzzle {
  id: string
  area: string
  speaker?: string
  title: string
  prompt: string
  kind: 'text' | 'choice'
  /** Với kind = text: danh sách đáp án chấp nhận (sẽ được chuẩn hóa). */
  answers?: string[]
  /** Với kind = choice. */
  options?: PuzzleOption[]
  correctOption?: string
  hint?: { text: string; cost: number }
  /** Tự hiện gợi ý miễn phí sau N lần sai. */
  freeHintAfter?: number
  onSolve: Effect[]
  /** Thưởng Tỉnh táo khi đúng ngay lần đầu. */
  firstTryBonus?: number
  onWrong: Effect[]
  /** Chỉ hiện thẻ lỗi tư duy ở lần sai đầu tiên, các lần sau chỉ trừ điểm. */
  wrongRepeat?: Effect[]
}

export interface PuzzleSeq {
  id: string
  puzzles: string[]
  /** Thứ tự khác cho những lần chơi lại (New Game+). */
  alt?: { if: Condition; puzzles: string[] }
  onComplete: Effect[]
}

// ---------------------------------------------------------------- Phán xử
export interface VerdictOption {
  id: string
  label: string
  /** Giải thích lỗi tư duy khi chọn sai phương án này. */
  wrong?: { fallacy: FallacyId; explain: string; missed: string; ifc?: Condition }[]
}

export interface VerdictQuestion {
  id: string
  prompt: string
  /** 'single': chọn một; 'evidence': chọn nhiều manh mối từ sổ tay. */
  kind: 'single' | 'evidence'
  options?: VerdictOption[]
  /** Số manh mối tối thiểu cần chọn (kind = evidence). */
  min?: number
}

export interface Verdict {
  id: string
  area: string
  title: string
  intro: string
  questions: VerdictQuestion[]
  /** Đáp án đúng cho các câu 'single'. */
  solution: Record<string, string>
  /** Giải thích chung khi sai (phương pháp). */
  method?: string
  sanityPenalty: number
  firstTryBonus: number
  firstTryAchievement?: string
  onSuccess: Effect[]
  /** Phán xử cuối game: dùng bảng kết thúc thay cho đúng/sai thông thường. */
  final?: boolean
}

// ---------------------------------------------------------------- Mê lộ (đường làng)
export interface MazeDetail {
  key: string
  name: string
  values: (string | number)[]
}

export interface Maze {
  id: string
  steps: number
  details: MazeDetail[]
  onSuccess: Effect[]
  /** Khi đi sai: lần đầu. */
  onFirstFail: Effect[]
  /** Khi đi sai: các lần sau. */
  onFail: Effect[]
  /** Hiệu ứng mỗi bước đúng. */
  onStep?: Effect[]
}

// ---------------------------------------------------------------- Sổ tay, vật phẩm
export interface ClueDef {
  id: string
  area: string
  kind: 'testimony' | 'observation'
  /** Người nói (id nhân vật) với lời khai. */
  source?: string
  text: string
  /** Là bằng chứng hợp lệ chống lại kẻ dẫn đi vòng. */
  evidence?: boolean
}

export interface ItemDef {
  id: string
  name: string
  icon: string
  description: string
  /** Hiển thị đặc biệt khi xem chi tiết (ví dụ: 'map'). */
  view?: string
  /** Với view = 'map': flag lưu buổi nhận vật phẩm, dùng để tính độ lệch. */
  driftFrom?: string
  /** Hiệu ứng mỗi lần xem chi tiết. */
  onView?: Effect[]
}

export interface AreaDef {
  id: string
  name: string
  skill: string
  order: number
  characters: Character[]
  scenes: Scene[]
  dialogues: Dialogue[]
  puzzles: Puzzle[]
  puzzleSeqs?: PuzzleSeq[]
  verdicts: Verdict[]
  clues: ClueDef[]
  items?: ItemDef[]
  mazes?: Maze[]
}

export interface FallacyDef {
  id: FallacyId
  name: string
  short: string
}

export interface AchievementDef {
  id: string
  name: string
  description: string
}

export type EndingId = 'good' | 'neutral' | 'loop' | 'hidden'

export interface EndingDef {
  id: EndingId
  title: string
  kicker: string
  paragraphs: string[]
}
