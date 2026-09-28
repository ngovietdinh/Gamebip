import type { TimeOfDay } from './types'

/** Số hành động để sang một buổi mới. */
export const ACTIONS_PER_SEGMENT = 4
/** Ngày 1 Sáng = 0 … Ngày 3 Tối = 8. */
export const LAST_SEGMENT = 8
/** Buổi "Ngày 4" — hạn chót giả đã qua. */
export const DEADLINE_SEGMENT = LAST_SEGMENT + 1

const TODS: TimeOfDay[] = ['sang', 'chieu', 'toi']
export const TOD_LABEL: Record<TimeOfDay, string> = { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối' }

export interface TimeInfo {
  segment: number
  day: number
  tod: TimeOfDay
  /** Số hành động đã dùng trong buổi hiện tại (0–3). */
  actionsInSegment: number
  pastDeadline: boolean
}

export function segmentOf(actions: number): number {
  const s = Math.floor(Math.max(0, actions) / ACTIONS_PER_SEGMENT)
  return Math.min(s, DEADLINE_SEGMENT)
}

export function timeInfo(actions: number): TimeInfo {
  const segment = segmentOf(actions)
  if (segment >= DEADLINE_SEGMENT) {
    return { segment, day: 4, tod: 'sang', actionsInSegment: 0, pastDeadline: true }
  }
  return {
    segment,
    day: Math.floor(segment / 3) + 1,
    tod: TODS[segment % 3],
    actionsInSegment: Math.max(0, actions) % ACTIONS_PER_SEGMENT,
    pastDeadline: false,
  }
}

export function timeLabel(actions: number): string {
  const t = timeInfo(actions)
  if (t.pastDeadline) return 'Ngày 4'
  return `Ngày ${t.day} · ${TOD_LABEL[t.tod]}`
}

/** Số hành động tới đầu buổi kế tiếp. */
export function actionsToNextSegment(actions: number): number {
  return ACTIONS_PER_SEGMENT - (Math.max(0, actions) % ACTIONS_PER_SEGMENT)
}

/** Số hành động tương ứng với đầu một buổi. */
export function actionsForSegment(segment: number): number {
  return Math.max(0, Math.min(segment, DEADLINE_SEGMENT)) * ACTIONS_PER_SEGMENT
}

/** Có vừa vượt qua hạn chót (sang "Ngày 4") hay không. */
export function crossedDeadline(before: number, after: number): boolean {
  return segmentOf(before) < DEADLINE_SEGMENT && segmentOf(after) >= DEADLINE_SEGMENT
}
