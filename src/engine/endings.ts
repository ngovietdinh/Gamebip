import type { EndingId } from './types'

export const GOOD_SANITY_THRESHOLD = 60
export const MIN_EVIDENCE = 2

export interface FinalVerdictInput {
  accused: string
  culprit: string
  /** Các manh mối người chơi chọn làm bằng chứng. */
  evidence: string[]
  /** Các manh mối là bằng chứng hợp lệ. */
  validEvidence: string[]
  sanity: number
}

export interface FinalVerdictResult {
  ending: Exclude<EndingId, 'hidden'>
  validCount: number
  invalidCount: number
  strongEvidence: boolean
}

/**
 * Quy tắc kết thúc:
 * - Buộc tội sai người -> Kết vòng lặp.
 * - Đúng người, bằng chứng mạnh (>= 2 bằng chứng hợp lệ và nhiều hơn số bằng chứng sai)
 *   và Tỉnh táo >= 60 -> Kết tốt.
 * - Đúng người nhưng bằng chứng yếu hoặc Tỉnh táo < 60 -> Kết trung.
 */
export function determineEnding(input: FinalVerdictInput): FinalVerdictResult {
  const valid = new Set(input.validEvidence)
  const unique = Array.from(new Set(input.evidence))
  const validCount = unique.filter((e) => valid.has(e)).length
  const invalidCount = unique.length - validCount
  const strongEvidence = validCount >= MIN_EVIDENCE && validCount > invalidCount
  if (input.accused !== input.culprit) {
    return { ending: 'loop', validCount, invalidCount, strongEvidence }
  }
  if (strongEvidence && input.sanity >= GOOD_SANITY_THRESHOLD) {
    return { ending: 'good', validCount, invalidCount, strongEvidence }
  }
  return { ending: 'neutral', validCount, invalidCount, strongEvidence }
}

/** Kết ẩn: đi qua hết Ngày 3 Tối mà vẫn còn trong làng. */
export function reachesHiddenEnding(segment: number, deadlineSegment: number, gameEnded: boolean): boolean {
  return !gameEnded && segment >= deadlineSegment
}
