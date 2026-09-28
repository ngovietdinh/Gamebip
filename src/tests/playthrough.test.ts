import { beforeEach, describe, expect, it } from 'vitest'
import { evalCondition } from '../engine/conditions'
import { buildRegistry } from '../engine/registry'
import { createGameStore } from '../engine/store'
import { timeInfo } from '../engine/time'
import { content } from '../data'

/** Mô phỏng một người chơi thật: bấm hotspot, đọc thoại, chọn đáp án. */
function harness() {
  const reg = buildRegistry(content)
  const store = createGameStore(reg)
  const g = () => store.getState()

  const visible = () => reg.scenes[g().run.sceneId].hotspots.filter((h) => evalCondition(h.if, g().run))

  const click = (id: string) => {
    settle()
    const h = visible().find((x) => x.id === id)
    if (!h) throw new Error(`Không thấy hotspot "${id}" ở cảnh ${g().run.sceneId}. Có: ${visible().map((x) => x.id).join(', ')}`)
    g().clickHotspot(h)
  }

  const choices = () => {
    const n = g().currentNode()
    return (n?.choices ?? []).filter((c) => evalCondition(c.if, g().run))
  }

  /** Đọc hết thoại/thẻ cho tới khi gặp lựa chọn hoặc hết. */
  const settle = () => {
    for (let i = 0; i < 200; i++) {
      const s = g()
      if (s.cards.length) {
        s.dismissCard()
        continue
      }
      if (s.dialogue) {
        if (choices().length) return
        s.advance()
        continue
      }
      if (s.says.length) {
        s.advance()
        continue
      }
      return
    }
    throw new Error('Kẹt trong vòng lặp hội thoại')
  }

  const pick = (prefix: string) => {
    for (let i = 0; i < 50 && !choices().length; i++) {
      const s = g()
      if (s.cards.length) s.dismissCard()
      else if (s.dialogue) s.advance()
      else if (s.says.length) s.advance()
      else break
    }
    const cs = choices()
    const idx = cs.findIndex((c) => c.text.startsWith(prefix))
    if (idx < 0) throw new Error(`Không có lựa chọn "${prefix}". Có: ${cs.map((c) => c.text).join(' | ')}`)
    g().choose(idx)
  }

  const answer = (a: string) => {
    if (!g().modal) settle()
    const m = g().modal
    if (!m || m.type !== 'puzzle') throw new Error('Không có câu đố đang mở: ' + JSON.stringify(m))
    return g().submitPuzzle(a)
  }

  const walkMaze = () => {
    click('di_tiep')
    for (let i = 0; i < 3; i++) {
      const side = g().run.mazes.duong_lang.changed
      click(side === 'left' ? 're_trai' : 're_phai')
    }
  }

  return { store, reg, g, click, settle, pick, answer, walkMaze }
}

type H = ReturnType<typeof harness>

function playArea1(h: H) {
  const { g, click, pick, answer, walkMaze, settle } = h
  g().newGame()
  pick('Cảm ơn')
  settle()
  click('hang_nuoc')
  click('ba_lao')
  pick('Bà ơi, lối ra')
  pick('Cháu đi đây')
  settle()
  click('ve_cho')
  click('bai_trau')
  click('cau_be')
  pick('Đố đi')
  for (const a of g().run.loop >= 2 ? ['tất cả các tháng', '0', '4'] : ['4', '0', 'tất cả các tháng']) {
    expect(answer(a)).toBe(true)
  }
  settle()
  click('ve_cho')
  click('duong_lang')
  walkMaze()
  settle()
  expect(g().run.sceneId).toBe('nga_ba')
  click('doc_da')
  expect(g().modal).toMatchObject({ type: 'verdict', id: 'v_a1', preset: { exit: 'doc_da' } })
  expect(g().submitVerdict({ exit: 'doc_da' }, [])).toBe(true)
}

function playArea2(h: H) {
  const { g, click, pick, answer, settle } = h
  expect(g().run.sceneId).toBe('dinh_san')
  pick('Nhưng tôi vừa nghe')
  settle()
  click('ong_tu')
  pick('Ông hỏi con')
  pick('Vâng')
  expect(answer('3')).toBe(true)
  settle()
  click('gian_giua')
  for (const e of ['cu_giap', 'cu_at', 'cu_binh', 'cu_dinh']) {
    click(e)
    pick('Cháu cảm ơn')
    settle()
  }
  click('cua_hau_cung')
  settle()
  expect(g().submitVerdict({ liar: 'giap', holder: 'giap' }, [])).toBe(true)
  settle()
  expect(g().run.inventory).toContain('chia_khoa_dong')
  g().selectItem('chia_khoa_dong')
  click('cua_hau_cung')
  settle()
  expect(g().run.sceneId).toBe('hau_cung')
  click('hom_go')
  settle()
  expect(g().run.inventory).toContain('ban_do')
  click('cua_sau')
}

function playArea3(h: H) {
  const { g, click, pick, answer, settle } = h
  expect(g().run.sceneId).toBe('bia_rung')
  pick('Được rồi')
  settle()
  click('leu')
  click('thay_do')
  pick('Thầy có lời khuyên')
  pick('Xin thầy ra đề')
  const order = g().run.loop >= 2 ? ['cái hố', 'tên', 'cuối đá'] : ['tên', 'cái hố', 'cuối đá']
  for (const a of order) expect(answer(a)).toBe(true)
  settle()
  click('ra_bia')
  click('vao_rung')
  settle()
  const tod = timeInfo(g().run.actions).tod
  click(tod === 'chieu' ? 'loi_phai' : 'loi_trai')
  settle()
  expect(g().run.sceneId).toBe('tang_da')
  click('cuoi_da')
  expect(g().overlay).toBe('fakeGameOver')
  g().overlayHook('fakeGameOver', 'escape')
  expect(g().overlay).toBeNull()
  expect(g().run.sceneId).toBe('bo_song')
}

function reachFerry(h: H) {
  const { g, click, settle } = h
  settle()
  click('nguoc_dong')
  settle()
  expect(g().run.sceneId).toBe('ben_do')
  click('lai_do')
  h.pick('Tôi trả lời được')
  expect(g().modal).toMatchObject({ type: 'verdict', id: 'v_final' })
}

describe('Chơi xuyên suốt 4 khu vực', () => {
  let h: H
  beforeEach(() => {
    h = harness()
  })

  it('KẾT TỐT: không mắc lỗi nào, đạt 100 Tỉnh táo', () => {
    playArea1(h)
    expect(h.g().run.achievements).toContain('mat_cu_voi')
    playArea2(h)
    expect(h.g().run.achievements).toContain('khong_noi_doi')
    playArea3(h)
    expect(h.g().run.achievements).toEqual(expect.arrayContaining(['chu_tron', 'khong_goi_y']))
    reachFerry(h)
    const ev = h.g().run.clues.filter((c) => h.reg.clues[c.id].evidence).map((c) => c.id)
    expect(ev).toEqual(expect.arrayContaining(['ev_cong_tre', 'ev_trong_16', 'ev_moi_canh', 'ev_giuc_voi']))
    h.g().submitVerdict({ suspect: 'nguoi_la' }, ['ev_cong_tre', 'ev_trong_16', 'ev_moi_canh'])
    expect(h.g().screen).toBe('ending')
    expect(h.g().final?.ending).toBe('good')
    expect(h.g().run.sanity).toBe(100)
    expect(h.g().run.achievements).toContain('tinh_tao_tuyet_doi')
    expect(h.g().run.mistakes).toHaveLength(0)
  })

  it('KẾT TRUNG: đúng người nhưng bằng chứng yếu', () => {
    playArea1(h)
    playArea2(h)
    playArea3(h)
    reachFerry(h)
    h.g().submitVerdict({ suspect: 'nguoi_la' }, ['ev_cong_tre', 'a1_trau'])
    expect(h.g().final?.ending).toBe('neutral')
  })

  it('KẾT TRUNG: đúng người, bằng chứng đủ nhưng Tỉnh táo < 60', () => {
    playArea1(h)
    playArea2(h)
    playArea3(h)
    reachFerry(h)
    h.g().debugPatch({ sanity: 30 })
    h.g().submitVerdict({ suspect: 'nguoi_la' }, ['ev_cong_tre', 'ev_trong_16'])
    expect(h.g().final?.ending).toBe('neutral')
  })

  it('KẾT VÒNG LẶP: buộc tội sai → New Game+ giữ sổ tay, bà lão nói ngược buổi sáng', () => {
    playArea1(h)
    playArea2(h)
    playArea3(h)
    reachFerry(h)
    const cluesBefore = h.g().run.clues.length
    h.g().submitVerdict({ suspect: 'ba_lao' }, ['ev_cong_tre', 'ev_trong_16'])
    expect(h.g().final?.ending).toBe('loop')
    expect(h.g().cards[0]).toMatchObject({ kind: 'mistake', fallacy: 'timeContext' })
    h.g().startLoop()
    const r = h.g().run
    expect(r.loop).toBe(2)
    expect(r.sceneId).toBe('cho_giua')
    expect(r.actions).toBe(0)
    expect(r.clues.length).toBe(cluesBefore)
    expect(r.inventory).toHaveLength(0)
    expect(h.g().cards[0]).toMatchObject({ kind: 'info', title: 'Lần thứ {loop}…' })
    // Buổi sáng lần 2: bà lão nói ngược.
    h.settle()
    h.pick('Lần trước anh cũng nói')
    h.settle()
    h.click('hang_nuoc')
    h.click('ba_lao')
    h.pick('Bà ơi, lối ra')
    expect(h.g().nodeText(h.g().currentNode()!)).toBe('Lối ra à? Lối ra là cổng tre.')
  })

  it('Lần chơi thứ 2 vẫn chơi hết được (thứ tự câu đố đổi)', () => {
    playArea1(h)
    playArea2(h)
    playArea3(h)
    reachFerry(h)
    h.g().submitVerdict({ suspect: 'lai_do' }, ['ev_cong_tre', 'ev_trong_16'])
    h.g().startLoop()
    // Lần 2: câu đố cậu bé và thầy đồ đổi thứ tự — playArea tự chọn theo lần chơi.
    playArea1(h)
    playArea2(h)
    playArea3(h)
    reachFerry(h)
    h.g().submitVerdict({ suspect: 'nguoi_la' }, ['ev_cong_tre', 'ev_trong_16', 'ev_moi_canh'])
    expect(h.g().final?.ending).toBe('good')
  })

  it('KẾT ẨN: để trôi qua Ngày 3 Tối → Ngày 4, không có gì xảy ra, mở bằng chứng đặc biệt', () => {
    h.g().newGame()
    h.pick('Cảm ơn')
    h.settle()
    const sanity = h.g().run.sanity
    h.click('hang_nuoc')
    // Ngồi uống chè cho tới khi hết hạn.
    for (let i = 0; i < 12 && !timeInfo(h.g().run.actions).pastDeadline; i++) {
      h.click('ghe')
    }
    const s = h.g()
    expect(timeInfo(s.run.actions).pastDeadline).toBe(true)
    expect(s.run.flags.deadline_passed).toBe(true)
    expect(s.run.clues.map((c) => c.id)).toContain('ev_han_chot')
    expect(s.run.achievements).toContain('khong_voi')
    expect(s.run.sanity).toBe(Math.min(100, sanity + 20))
    expect(s.screen).toBe('game')
    expect(s.cards.some((c) => c.kind === 'info' && c.title === 'Ngày thứ tư')).toBe(true)
    // Vẫn chơi tiếp bình thường.
    h.settle()
    h.click('ve_cho')
    expect(h.g().run.sceneId).toBe('cho_giua')
  })

  it('bị lừa thì hiện thẻ "Bạn đã giả định gì?", trừ Tỉnh táo và cho làm lại', () => {
    playArea1Partial(h)
    const before = h.g().run.sanity
    expect(h.g().submitVerdict({ exit: 'cong_tre' }, [])).toBe(false)
    expect(h.g().cards[0]).toMatchObject({ kind: 'mistake', fallacy: 'authority' })
    expect(h.g().run.sanity).toBe(before - 8)
    expect(h.g().modal).toMatchObject({ type: 'verdict' })
    h.g().dismissCard()
    expect(h.g().submitVerdict({ exit: 'doc_da' }, [])).toBe(true)
    expect(h.g().run.sceneId).toBe('dinh_san')
  })

  it('trống đình: trả lời 16 là bám quy luật', () => {
    playArea1(h)
    h.pick('Ừ')
    h.settle()
    h.click('ong_tu')
    h.pick('Ông hỏi con')
    h.pick('Vâng')
    expect(h.answer('16')).toBe(false)
    expect(h.g().cards[0]).toMatchObject({ fallacy: 'pattern' })
    h.g().dismissCard()
    expect(h.answer('3')).toBe(true)
  })

  it('đi theo bản đồ ở Bến đò thì lạc về Quán lá (Tin công cụ tuyệt đối)', () => {
    playArea1(h)
    playArea2(h)
    playArea3(h)
    h.settle()
    h.click('xuoi_dong')
    expect(h.g().cards[0]).toMatchObject({ fallacy: 'tool' })
    h.settle()
    expect(h.g().run.sceneId).toBe('quan_la')
    expect(h.g().run.clues.map((c) => c.id)).toContain('ev_ban_do')
  })

  it('bản đồ lệch dần theo từng buổi', () => {
    playArea1(h)
    playArea2(h)
    const seg0 = timeInfo(h.g().run.actions).segment
    h.g().debugPatch({ flags: { ...h.g().run.flags, a2_map_seg: seg0 } })
    h.g().viewItem('ban_do')
    expect(h.g().run.clues.map((c) => c.id)).not.toContain('a2_ban_do_lech')
    h.g().exec([{ t: 'nextSegment' }])
    expect(timeInfo(h.g().run.actions).segment).toBeGreaterThan(seg0)
    h.g().viewItem('ban_do')
    expect(h.g().run.clues.map((c) => c.id)).toEqual(expect.arrayContaining(['a2_ban_do_lech', 'ev_ban_do']))
  })

  it('màn Game Over giả: "Chơi lại" không thoát được, chỉ chữ O mới mở đường', () => {
    playArea1(h)
    playArea2(h)
    h.settle()
    h.pick('Được rồi')
    h.settle()
    h.click('leu')
    h.click('thay_do')
    h.pick('Xin thầy ra đề')
    h.answer('tên')
    h.settle()
    expect(h.g().modal).toMatchObject({ type: 'puzzle', id: 'a3_b' })
    h.g().buyHint()
    h.answer('cái hố')
    h.answer('cuối đá')
    h.settle()
    h.g().debugGoto('tang_da')
    h.settle()
    h.click('cuoi_da')
    h.g().overlayHook('fakeGameOver', 'restart')
    h.g().overlayHook('fakeGameOver', 'restart')
    expect(h.g().overlay).toBe('fakeGameOver')
    expect(h.g().deferred).toHaveLength(1)
    h.g().overlayHook('fakeGameOver', 'escape')
    expect(h.g().cards.some((c) => c.kind === 'mistake' && c.fallacy === 'authority')).toBe(true)
    expect(h.g().run.achievements).toContain('chu_tron')
    expect(h.g().run.achievements).not.toContain('khong_goi_y')
  })
})

function playArea1Partial(h: H) {
  const { g, click, pick, walkMaze, settle } = h
  g().newGame()
  pick('Cảm ơn')
  settle()
  click('duong_lang')
  walkMaze()
  settle()
  click('cong_tre')
}
