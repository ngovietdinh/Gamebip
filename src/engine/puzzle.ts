import { matchesAnswer } from './normalize'
import type { Puzzle, PuzzleSeq } from './types'

export function checkPuzzle(p: Puzzle, answer: string): boolean {
  if (p.kind === 'choice') return answer === p.correctOption
  return matchesAnswer(answer, p.answers ?? [])
}

/** Câu đố kế tiếp chưa giải trong một chuỗi (null nếu đã giải hết). */
export function nextInSeq(order: string[], solved: Record<string, unknown>): string | null {
  for (const id of order) if (!solved[id]) return id
  return null
}

export function seqOrder(seq: PuzzleSeq, useAlt: boolean): string[] {
  return useAlt && seq.alt ? seq.alt.puzzles : seq.puzzles
}
