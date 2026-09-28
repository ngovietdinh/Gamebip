/**
 * Bộ giải câu đố "đúng một người nói dối, một người giữ vật".
 * Mỗi lời khai là một mệnh đề phụ thuộc vào (người nói dối, người giữ chìa).
 */
export interface World {
  liar: string
  holder: string
}

export interface Statement {
  speaker: string
  /** Mệnh đề được nói ra, đánh giá trong một thế giới giả định. */
  claim: (w: World) => boolean
}

/** Duyệt mọi trường hợp, trả về các thế giới nhất quán. */
export function solveOneLiar(people: string[], statements: Statement[]): World[] {
  const out: World[] = []
  for (const liar of people) {
    for (const holder of people) {
      const w = { liar, holder }
      const consistent = statements.every((s) => {
        const truth = s.claim(w)
        return s.speaker === liar ? !truth : truth
      })
      if (consistent) out.push(w)
    }
  }
  return out
}

/** Giải thích vì sao giả định "X nói dối" dẫn tới mâu thuẫn (dùng cho màn giải thích). */
export function contradictionFor(people: string[], statements: Statement[], liar: string): string | null {
  for (const holder of people) {
    const w = { liar, holder }
    const ok = statements.every((s) => (s.speaker === liar ? !s.claim(w) : s.claim(w)))
    if (ok) return null
  }
  return `Không có người giữ chìa nào khiến chỉ riêng ${liar} nói dối.`
}
