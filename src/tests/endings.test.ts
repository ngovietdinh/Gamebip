import { describe, expect, it } from 'vitest'
import { determineEnding, GOOD_SANITY_THRESHOLD, reachesHiddenEnding } from '../engine/endings'
import { DEADLINE_SEGMENT } from '../engine/time'
import { registry } from '../game'

const valid = Object.values(registry.clues)
  .filter((c) => c.evidence)
  .map((c) => c.id)
const base = { culprit: 'nguoi_la', validEvidence: valid }

describe('Điều kiện các kết thúc', () => {
  it('có đủ 5 bằng chứng theo thiết kế + bằng chứng đặc biệt "Hạn chót là giả"', () => {
    expect(valid.sort()).toEqual(['ev_ban_do', 'ev_cong_tre', 'ev_giuc_voi', 'ev_han_chot', 'ev_moi_canh', 'ev_trong_16'].sort())
  })

  it('KẾT TỐT: đúng người, ≥ 2 bằng chứng đúng, Tỉnh táo ≥ 60', () => {
    const r = determineEnding({ ...base, accused: 'nguoi_la', evidence: ['ev_cong_tre', 'ev_trong_16'], sanity: 60 })
    expect(r.ending).toBe('good')
    expect(r.validCount).toBe(2)
  })

  it('KẾT TRUNG: đúng người nhưng Tỉnh táo < 60', () => {
    const r = determineEnding({ ...base, accused: 'nguoi_la', evidence: ['ev_cong_tre', 'ev_trong_16', 'ev_giuc_voi'], sanity: GOOD_SANITY_THRESHOLD - 1 })
    expect(r.ending).toBe('neutral')
  })

  it('KẾT TRUNG: đúng người nhưng bằng chứng yếu', () => {
    // chỉ 1 bằng chứng hợp lệ
    expect(determineEnding({ ...base, accused: 'nguoi_la', evidence: ['ev_cong_tre', 'a1_trau'], sanity: 90 }).ending).toBe('neutral')
    // bằng chứng sai nhiều bằng bằng chứng đúng
    expect(
      determineEnding({ ...base, accused: 'nguoi_la', evidence: ['ev_cong_tre', 'ev_trong_16', 'a1_trau', 'a1_ba_cong_tre'], sanity: 90 }).ending,
    ).toBe('neutral')
    // chọn trùng không được tính hai lần
    expect(determineEnding({ ...base, accused: 'nguoi_la', evidence: ['ev_cong_tre', 'ev_cong_tre'], sanity: 90 }).ending).toBe('neutral')
  })

  it('KẾT VÒNG LẶP: buộc tội sai người, bất kể bằng chứng và Tỉnh táo', () => {
    for (const who of ['ba_lao', 'cau_be', 'thay_do', 'lai_do']) {
      expect(determineEnding({ ...base, accused: who, evidence: valid, sanity: 100 }).ending).toBe('loop')
    }
  })

  it('KẾT ẨN: chỉ khi qua hạn chót mà game chưa kết thúc', () => {
    expect(reachesHiddenEnding(DEADLINE_SEGMENT, DEADLINE_SEGMENT, false)).toBe(true)
    expect(reachesHiddenEnding(DEADLINE_SEGMENT - 1, DEADLINE_SEGMENT, false)).toBe(false)
    expect(reachesHiddenEnding(DEADLINE_SEGMENT, DEADLINE_SEGMENT, true)).toBe(false)
  })

  it('người bị buộc tội đúng trong dữ liệu là Người lạ đội nón', () => {
    expect(registry.verdicts.v_final.solution.suspect).toBe('nguoi_la')
    const suspects = registry.verdicts.v_final.questions[0].options!.map((o) => o.id)
    expect(suspects).toHaveLength(5)
  })
})
