import { describe, expect, it } from 'vitest'
import { contradictionFor, solveOneLiar } from '../engine/logic'
import { ELDER_PEOPLE, ELDER_STATEMENTS } from '../data/area2/logic'
import { registry } from '../game'

describe('Câu đố bốn cụ bô lão', () => {
  it('duyệt mọi trường hợp (4 người nói dối × 4 người giữ chìa) và chỉ có đúng một nghiệm', () => {
    const solutions = solveOneLiar(ELDER_PEOPLE, ELDER_STATEMENTS)
    expect(solutions).toHaveLength(1)
    expect(solutions[0]).toEqual({ liar: 'giap', holder: 'giap' })
  })

  it('kiểm tra thủ công cả 16 thế giới', () => {
    let count = 0
    for (const liar of ELDER_PEOPLE) {
      for (const holder of ELDER_PEOPLE) {
        const ok = ELDER_STATEMENTS.every((s) => (s.speaker === liar ? !s.claim({ liar, holder }) : s.claim({ liar, holder })))
        if (ok) {
          count++
          expect(liar).toBe('giap')
          expect(holder).toBe('giap')
        }
      }
    }
    expect(count).toBe(1)
  })

  it('mọi giả định khác về người nói dối đều dẫn tới mâu thuẫn', () => {
    expect(contradictionFor(ELDER_PEOPLE, ELDER_STATEMENTS, 'giap')).toBeNull()
    for (const p of ['at', 'binh', 'dinh']) {
      expect(contradictionFor(ELDER_PEOPLE, ELDER_STATEMENTS, p)).not.toBeNull()
    }
  })

  it('đáp án trong dữ liệu phán xử khớp với bộ giải', () => {
    const v = registry.verdicts['v_a2']
    const [sol] = solveOneLiar(ELDER_PEOPLE, ELDER_STATEMENTS)
    expect(v.solution).toEqual({ liar: sol.liar, holder: sol.holder })
  })
})
