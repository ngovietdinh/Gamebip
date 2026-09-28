import { describe, expect, it } from 'vitest'
import {
  ACTIONS_PER_SEGMENT,
  actionsForSegment,
  actionsToNextSegment,
  crossedDeadline,
  DEADLINE_SEGMENT,
  segmentOf,
  timeInfo,
  timeLabel,
} from '../engine/time'

describe('Hệ thống thời gian', () => {
  it('bắt đầu ở Ngày 1 Sáng', () => {
    expect(timeInfo(0)).toMatchObject({ day: 1, tod: 'sang', segment: 0, pastDeadline: false })
    expect(timeLabel(0)).toBe('Ngày 1 · Sáng')
  })

  it('4 hành động = sang buổi mới', () => {
    expect(ACTIONS_PER_SEGMENT).toBe(4)
    expect(timeInfo(3).tod).toBe('sang')
    expect(timeInfo(4).tod).toBe('chieu')
    expect(timeInfo(8).tod).toBe('toi')
    expect(timeInfo(12)).toMatchObject({ day: 2, tod: 'sang' })
  })

  it('đi qua đủ 9 buổi từ Ngày 1 Sáng tới Ngày 3 Tối', () => {
    const labels = Array.from({ length: 9 }, (_, i) => timeLabel(i * 4))
    expect(labels).toEqual([
      'Ngày 1 · Sáng',
      'Ngày 1 · Chiều',
      'Ngày 1 · Tối',
      'Ngày 2 · Sáng',
      'Ngày 2 · Chiều',
      'Ngày 2 · Tối',
      'Ngày 3 · Sáng',
      'Ngày 3 · Chiều',
      'Ngày 3 · Tối',
    ])
  })

  it('hết Ngày 3 Tối thì hiện "Ngày 4" và dừng ở đó', () => {
    expect(timeLabel(35)).toBe('Ngày 3 · Tối')
    expect(timeLabel(36)).toBe('Ngày 4')
    expect(timeInfo(36).pastDeadline).toBe(true)
    expect(segmentOf(500)).toBe(DEADLINE_SEGMENT)
    expect(timeLabel(500)).toBe('Ngày 4')
  })

  it('phát hiện thời điểm vượt hạn chót đúng một lần', () => {
    expect(crossedDeadline(35, 36)).toBe(true)
    expect(crossedDeadline(30, 40)).toBe(true)
    expect(crossedDeadline(36, 37)).toBe(false)
    expect(crossedDeadline(10, 20)).toBe(false)
  })

  it('tính số hành động tới buổi sau', () => {
    expect(actionsToNextSegment(0)).toBe(4)
    expect(actionsToNextSegment(5)).toBe(3)
    expect(actionsForSegment(2)).toBe(8)
    expect(actionsForSegment(99)).toBe(DEADLINE_SEGMENT * 4)
  })
})
