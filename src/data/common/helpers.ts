import type { Condition, Effect } from '../../engine/types'

/** Một câu thoại ngắn không cần cây hội thoại. */
export const say = (text: string, speaker?: string): Effect => ({ t: 'say', text, speaker })

export const clue = (id: string): Effect => ({ t: 'clue', id })
export const flag = (key: string, value?: boolean | number | string): Effect => ({ t: 'flag', key, value })
export const goto = (scene: string, free = false): Effect => ({ t: 'goto', scene, free })
export const when = (c: Condition, then: Effect[], otherwise?: Effect[]): Effect => ({ t: 'if', c, then, else: otherwise })

export const hasFlag = (key: string): Condition => ({ t: 'flag', key })
export const noFlag = (key: string): Condition => ({ t: 'notFlag', key })
export const all = (...of: Condition[]): Condition => ({ t: 'all', of })
export const any = (...of: Condition[]): Condition => ({ t: 'any', of })
export const not = (c: Condition): Condition => ({ t: 'not', c })

export const FIRST_LOOP: Condition = { t: 'loop', max: 1 }
export const LATER_LOOP: Condition = { t: 'loop', min: 2 }

/**
 * Người lạ giục vội. Mỗi lần giục được đếm lại; tới lần thứ 3,
 * sổ tay tự ghi bằng chứng "hắn luôn giục vội".
 */
export const HURRY: Effect[] = [
  { t: 'incFlag', key: 'hurry' },
  when({ t: 'flagAtLeast', key: 'hurry', n: 3 }, [clue('ev_giuc_voi')]),
]
