import type { MazeState } from './maze'
import type { EndingId, FallacyId, FlagValue } from './types'

export interface Stamp {
  day: number
  tod: string
  label: string
  loop: number
}

export interface ClueEntry {
  id: string
  at: Stamp
  suspicious: boolean
}

export interface MistakeEntry {
  fallacy: FallacyId
  explain: string
  missed: string
  at: Stamp
  area: string
}

/** Toàn bộ trạng thái một lượt chơi — đây là thứ được lưu/tải. */
export interface RunState {
  version: number
  sceneId: string
  actions: number
  flags: Record<string, FlagValue>
  inventory: string[]
  clues: ClueEntry[]
  sanity: number
  mistakes: MistakeEntry[]
  loop: number
  solved: Record<string, { firstTry: boolean }>
  attempts: Record<string, number>
  hints: Record<string, number>
  mazes: Record<string, MazeState>
  achievements: string[]
  ending: EndingId | null
  startedAt: number
}

export const SAVE_VERSION = 1
export const START_SANITY = 50

export function clampSanity(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function freshRun(startScene: string): RunState {
  return {
    version: SAVE_VERSION,
    sceneId: startScene,
    actions: 0,
    flags: {},
    inventory: [],
    clues: [],
    sanity: START_SANITY,
    mistakes: [],
    loop: 1,
    solved: {},
    attempts: {},
    hints: {},
    mazes: {},
    achievements: [],
    ending: null,
    startedAt: Date.now(),
  }
}

/**
 * New Game+ (Kết vòng lặp): giữ sổ tay, bộ đếm lần chơi và lịch sử lỗi tư duy,
 * còn lại quay về Ngày 1.
 */
export function loopRun(prev: RunState, startScene: string): RunState {
  const r = freshRun(startScene)
  r.loop = prev.loop + 1
  r.clues = prev.clues.map((c) => ({ ...c }))
  r.mistakes = prev.mistakes.map((m) => ({ ...m }))
  r.achievements = [...prev.achievements]
  return r
}
