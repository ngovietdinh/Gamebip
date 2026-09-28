import type { Maze } from './types'

export type Side = 'left' | 'right'
export type SideState = Record<string, number>

export interface MazeState {
  id: string
  progress: number
  /** Chỉ số giá trị hiện tại của từng chi tiết ở hai phía. */
  sides: Record<Side, SideState>
  /** Phía vừa có chi tiết thay đổi; null = đang ở đầu đường (chưa có thay đổi). */
  changed: Side | null
  changedDetail: string | null
  fails: number
  solved: boolean
}

export type Rng = () => number

export function initialMazeState(maze: Maze): MazeState {
  const base: SideState = {}
  for (const d of maze.details) base[d.key] = 0
  return {
    id: maze.id,
    progress: 0,
    sides: { left: { ...base }, right: { ...base } },
    changed: null,
    changedDetail: null,
    fails: 0,
    solved: false,
  }
}

/** Thay đổi ngẫu nhiên một chi tiết ở một phía. */
export function applyRandomChange(maze: Maze, s: MazeState, rng: Rng = Math.random): MazeState {
  const side: Side = rng() < 0.5 ? 'left' : 'right'
  const detail = maze.details[Math.floor(rng() * maze.details.length) % maze.details.length]
  const cur = s.sides[side][detail.key]
  const n = detail.values.length
  const step = 1 + Math.floor(rng() * (n - 1))
  const next = (cur + step) % n
  return {
    ...s,
    sides: { ...s.sides, [side]: { ...s.sides[side], [detail.key]: next } },
    changed: side,
    changedDetail: detail.key,
  }
}

export type PickResult = 'progress' | 'solved' | 'fail' | 'ignored'

/** Người chơi chọn một phía. */
export function pickSide(maze: Maze, s: MazeState, side: Side, rng: Rng = Math.random): { state: MazeState; result: PickResult } {
  if (s.changed === null || s.solved) return { state: s, result: 'ignored' }
  if (side === s.changed) {
    const progress = s.progress + 1
    if (progress >= maze.steps) {
      return { state: { ...s, progress, solved: true, changed: null, changedDetail: null }, result: 'solved' }
    }
    return { state: applyRandomChange(maze, { ...s, progress }, rng), result: 'progress' }
  }
  return {
    state: { ...s, progress: 0, changed: null, changedDetail: null, fails: s.fails + 1 },
    result: 'fail',
  }
}
