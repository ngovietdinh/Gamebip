import type {
  AchievementDef,
  AreaDef,
  Character,
  ClueDef,
  Dialogue,
  Effect,
  EndingDef,
  EndingId,
  FallacyDef,
  FallacyId,
  ItemDef,
  Maze,
  Puzzle,
  PuzzleSeq,
  Scene,
  Verdict,
} from './types'

/** Toàn bộ nội dung game, do thư mục src/data cung cấp. */
export interface GameContent {
  title: string
  startScene: string
  areas: AreaDef[]
  characters: Character[]
  items: ItemDef[]
  clues: ClueDef[]
  fallacies: FallacyDef[]
  achievements: AchievementDef[]
  endings: Record<EndingId, EndingDef>
  /** Hiệu ứng khi bắt đầu một lượt chơi mới (lần 1). */
  onNewGame: Effect[]
  /** Hiệu ứng khi tỉnh dậy ở lần chơi thứ 2 trở đi. */
  onLoopStart: Effect[]
  /** Hiệu ứng khi hạn chót giả trôi qua (sang "Ngày 4"). */
  onDeadline: Effect[]
  /** Hiệu ứng khi đổi buổi. */
  onSegment?: Effect[]
  /** Chạy ngay trước khi hiện màn kết thúc (kết tốt/trung/vòng lặp). */
  onEnding?: Effect[]
  /** Hiệu ứng gắn với các lớp phủ đặc biệt của UI: overlays[id][hook]. */
  overlays: Record<string, Record<string, Effect[]>>
}

export interface Registry {
  content: GameContent
  scenes: Record<string, Scene>
  dialogues: Record<string, Dialogue>
  puzzles: Record<string, Puzzle>
  seqs: Record<string, PuzzleSeq>
  verdicts: Record<string, Verdict>
  clues: Record<string, ClueDef>
  characters: Record<string, Character>
  items: Record<string, ItemDef>
  mazes: Record<string, Maze>
  fallacies: Record<FallacyId, FallacyDef>
  achievements: Record<string, AchievementDef>
  areas: AreaDef[]
  areaById: Record<string, AreaDef>
}

function index<T extends { id: string }>(list: T[], kind: string): Record<string, T> {
  const out: Record<string, T> = {}
  for (const x of list) {
    if (out[x.id]) throw new Error(`Trùng id ${kind}: ${x.id}`)
    out[x.id] = x
  }
  return out
}

export function buildRegistry(content: GameContent): Registry {
  const areas = [...content.areas].sort((a, b) => a.order - b.order)
  const all = <K extends keyof AreaDef>(k: K) => areas.flatMap((a) => (a[k] as unknown as { id: string }[]) ?? [])
  return {
    content,
    areas,
    areaById: index(areas, 'khu vực'),
    scenes: index(all('scenes') as Scene[], 'cảnh'),
    dialogues: index(all('dialogues') as Dialogue[], 'hội thoại'),
    puzzles: index(all('puzzles') as Puzzle[], 'câu đố'),
    seqs: index(all('puzzleSeqs') as PuzzleSeq[], 'chuỗi câu đố'),
    verdicts: index(all('verdicts') as Verdict[], 'phán xử'),
    clues: index([...content.clues, ...(all('clues') as ClueDef[])], 'manh mối'),
    characters: index([...content.characters, ...(all('characters') as Character[])], 'nhân vật'),
    items: index([...content.items, ...(all('items') as ItemDef[])], 'vật phẩm'),
    mazes: index(all('mazes') as Maze[], 'mê lộ'),
    fallacies: index(content.fallacies, 'lỗi tư duy') as Record<FallacyId, FallacyDef>,
    achievements: index(content.achievements, 'thành tựu'),
  }
}

/** Duyệt mọi hiệu ứng lồng nhau (dùng cho kiểm tra dữ liệu). */
export function walkEffects(effects: Effect[] | undefined, fn: (e: Effect) => void): void {
  if (!effects) return
  for (const e of effects) {
    fn(e)
    if (e.t === 'if') {
      walkEffects(e.then, fn)
      walkEffects(e.else, fn)
    } else if (e.t === 'once') {
      walkEffects(e.then, fn)
    }
  }
}
