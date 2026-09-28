import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_FRAGMENTS, CHAPTERS, findNote, findPuzzle, getChapter, nextChapter } from '../horror/chapters'
import { CH1_CEILING, CH1_CLOCK, CH1_MIRROR, ch1BlackboardCode, ch1FragmentCode, ch1PhotoCode, mirrorDisplay } from '../horror/chapters/ch1'
import { REPORT, SHEET, TIMETABLE } from '../horror/chapters/ch2'
import { GRANDMA, SHIFTS } from '../horror/chapters/ch3'
import { ITEMS } from '../horror/items'
import { CELL, cellCenter, Level, toCell } from '../horror/level'
import { Entity, ENTITY, heartRate, playerNoise, Shade, stepMeters } from '../horror/sim'
import { addItem, carryOver, freshProgress, useHorror } from '../horror/store'
import type { ChapterDef } from '../horror/types'

const levelOf = (c: ChapterDef) => new Level(c.map, c.doors, c.rooms)
const allOpen = (c: ChapterDef) => Object.fromEntries(Object.keys(c.doors).map((k) => [k, true]))
const startCell = (c: ChapterDef) => toCell(c.start.x * CELL, c.start.z * CELL)
const cellOf = (at: [number, number]): [number, number] => [Math.floor(at[0]), Math.floor(at[1])]

describe.each(CHAPTERS.map((c) => [c.id, c] as const))('Bản đồ %s', (_id, ch) => {
  const L = levelOf(ch)
  const open = allOpen(ch)

  it('các hàng cùng độ dài, viền ngoài kín (trừ lối ra)', () => {
    for (const row of ch.map) expect(row.length).toBe(L.W)
    const edge = (c: string) => c === '#' || (/[0-9]/.test(c) && !ch.doors[c])
    for (let z = 0; z < L.H; z++) {
      expect(edge(L.charAt(0, z))).toBe(true)
      expect(edge(L.charAt(L.W - 1, z))).toBe(true)
    }
    for (let x = 0; x < L.W; x++) {
      expect(edge(L.charAt(x, 0))).toBe(true)
      expect(edge(L.charAt(x, L.H - 1))).toBe(true)
    }
  })

  it('mọi ký tự trên bản đồ đều được định nghĩa', () => {
    for (const row of ch.map) for (const c of row) expect(c === '#' || !!ch.rooms[c] || /[0-9]/.test(c), `${ch.id}:${c}`).toBe(true)
  })

  it('điểm xuất phát nằm trong một phòng', () => {
    const [sx, sz] = startCell(ch)
    expect(L.roomAt(sx, sz)).not.toBeNull()
  })

  it('mở hết cửa thì đi tới được mọi phòng', () => {
    const [sx, sz] = startCell(ch)
    for (const r of Object.keys(ch.rooms)) {
      let target: [number, number] | null = null
      for (let z = 0; z < L.H && !target; z++) for (let x = 0; x < L.W && !target; x++) if (L.charAt(x, z) === r) target = [x, z]
      expect(target, r).not.toBeNull()
      expect(L.findPath([sx, sz], target!, open), `${ch.id} → ${r}`).not.toBeNull()
    }
  })

  it('vật tương tác, đèn, điểm tuần tra và bóng học sinh nằm đúng chỗ', () => {
    const [sx, sz] = startCell(ch)
    for (const it of ch.interactables) {
      const [cx, cz] = cellOf(it.at)
      const c = L.charAt(cx, cz)
      if (it.kind === 'door') expect(ch.doors[c], it.id).toBeDefined()
      else if (it.kind === 'exit') {
        expect(/[0-9]/.test(c) && !ch.doors[c], it.id).toBe(true)
        // Có ô sàn kề lối ra mà người chơi tới được.
        const near = [
          [cx - 1, cz],
          [cx + 1, cz],
          [cx, cz - 1],
          [cx, cz + 1],
        ].filter(([x, z]) => L.walkable(x, z, open) && L.findPath([sx, sz], [x, z], open))
        expect(near.length, it.id).toBeGreaterThan(0)
      } else {
        expect(L.walkable(cx, cz, open), `${ch.id}:${it.id}`).toBe(true)
        expect(L.findPath([sx, sz], [cx, cz], open), `${ch.id}:${it.id}`).not.toBeNull()
      }
    }
    for (const l of ch.lamps) expect(L.walkable(...cellOf(l.at), open), l.id).toBe(true)
    for (const p of ch.patrol) expect(L.walkable(p[0], p[1], open), String(p)).toBe(true)
    for (const s of ch.shades ?? []) expect(L.walkable(...cellOf(s), open), String(s)).toBe(true)
  })

  it('mọi ghi chú, câu đố, mảnh ký ức được tham chiếu đều tồn tại', () => {
    for (const it of ch.interactables) {
      if (it.kind === 'note') expect(findNote(it.note), it.id).toBeDefined()
      if (it.kind === 'keypad' || it.kind === 'piano') expect(findPuzzle(it.puzzle), it.id).toBeDefined()
      if (it.kind === 'pickup') expect(ITEMS[it.item], it.id).toBeDefined()
      if (it.kind === 'memory') expect(ch.fragments.some((f) => f.id === it.fragment), it.id).toBe(true)
    }
    for (const p of Object.values(ch.puzzles)) {
      for (const item of p.items) expect(ITEMS[item], p.id).toBeDefined()
      if (p.fragment) expect(ch.fragments.some((f) => f.id === p.fragment), p.id).toBe(true)
    }
    for (const d of Object.values(ch.doors)) if (d.key) expect(ITEMS[d.key]).toBeDefined()
  })
})

describe('Tiến trình không bị kẹt', () => {
  const reachFrom = (ch: ChapterDef, open: Record<string, boolean>, id: string) => {
    const L = levelOf(ch)
    const it = ch.interactables.find((i) => i.id === id)!
    return L.findPath(startCell(ch), cellOf(it.at), open) !== null
  }

  it('chương 1: chìa nào cũng nằm trong vùng đã tới được', () => {
    const c = getChapter('ch1')
    expect(reachFrom(c, {}, 'hop_do_choi')).toBe(true)
    expect(reachFrom(c, {}, 'ket_sat')).toBe(false)
    expect(reachFrom(c, { '1': true }, 'ket_sat')).toBe(true)
    expect(reachFrom(c, { '1': true }, 'ban_co')).toBe(false)
    expect(reachFrom(c, { '1': true, '3': true }, 'ban_co')).toBe(true)
    expect(reachFrom(c, { '1': true, '3': true }, 'tu_thuoc')).toBe(false)
    expect(reachFrom(c, { '1': true, '3': true, '4': true }, 'tu_thuoc')).toBe(true)
  })

  it('chương 2: tủ 17 → phòng hiệu trưởng → kho thể dục', () => {
    const c = getChapter('ch2')
    expect(reachFrom(c, {}, 'tu_17')).toBe(true)
    expect(reachFrom(c, {}, 'piano')).toBe(true)
    expect(reachFrom(c, {}, 'ban_ht')).toBe(false)
    expect(reachFrom(c, { '3': true }, 'ban_ht')).toBe(true)
    expect(reachFrom(c, { '3': true }, 'chia_cong')).toBe(false)
    expect(reachFrom(c, { '3': true, '4': true }, 'chia_cong')).toBe(true)
    expect(c.puzzles.tu17.items).toContain('key_ht')
    expect(c.interactables.find((i) => i.id === 'ban_ht')).toMatchObject({ item: 'key_kho' })
  })

  it('chương 3: đủ 3 cầu chì, mỗi cái đều lấy được', () => {
    const c = getChapter('ch3')
    const fuses = [
      ...c.interactables.filter((i) => i.kind === 'pickup' && i.item === 'cau_chi'),
      ...Object.values(c.puzzles).filter((p) => p.items.includes('cau_chi')),
    ]
    expect(fuses.length).toBe(3)
    expect(reachFrom(c, {}, 'chia_303')).toBe(true)
    expect(reachFrom(c, {}, 'bang_trang')).toBe(true)
    expect(reachFrom(c, {}, 'ngan_ba')).toBe(true)
    expect(reachFrom(c, {}, 'cau_chi_1')).toBe(false)
    expect(reachFrom(c, { '4': true }, 'cau_chi_1')).toBe(true)
    expect(reachFrom(c, { '3': true }, 'cau_chi_2')).toBe(true)
    expect(reachFrom(c, {}, 'tu_dien')).toBe(true)
  })

  it('có đủ 10 mảnh ký ức, id không trùng', () => {
    expect(ALL_FRAGMENTS.length).toBe(10)
    expect(new Set(ALL_FRAGMENTS.map((f) => f.id)).size).toBe(10)
  })

  it('thứ tự chương 1 → 2 → 3 → 4', () => {
    expect(nextChapter('ch1')?.id).toBe('ch2')
    expect(nextChapter('ch3')?.id).toBe('ch4')
    expect(nextChapter('ch4')).toBeNull()
  })
})

describe('Mật mã công bằng: đáp án suy ra được từ manh mối', () => {
  const P = (id: string) => findPuzzle(id)!.code
  it('hộp đồ chơi = số sao dạ quang trên trần', () => expect(P('toybox')).toBe(CH1_CEILING))
  it('két sắt = số người trong ảnh xếp theo năm', () => expect(P('safe')).toBe(ch1PhotoCode()))
  it('ngăn bàn học = đáp án 3 bài trên bảng', () => expect(P('teacher')).toBe(ch1BlackboardCode()))
  it('tủ thuốc = chữ trong gương đọc ngược lại', () => {
    expect(P('cabinet')).toBe(CH1_MIRROR)
    expect(mirrorDisplay(mirrorDisplay(CH1_MIRROR))).toBe(P('cabinet'))
  })
  it('cửa chính = 4 mảnh ký ức = giờ trên chiếc đồng hồ đứng im', () => {
    expect(P('front')).toBe(ch1FragmentCode())
    expect(P('front')).toBe('0' + CH1_CLOCK.replace(':', ''))
  })
  it('tủ 17 = điểm học bạ theo thứ tự thời khóa biểu', () => {
    const key: Record<string, number> = { 'Tiếng Việt': REPORT.van, 'Tiếng Anh': REPORT.anh, Toán: REPORT.toan }
    const code = TIMETABLE.map((t) => key[t.split(': ')[1]]).join('')
    expect(P('tu17')).toBe(code)
  })
  it('đàn piano = bản nhạc màu (Đô=1 … Si=7)', () => {
    expect(P('piano')).toBe(SHEET.map((n) => n + 1).join(''))
    expect(findPuzzle('piano')!.kind).toBe('notes')
  })
  it('phòng y tá = giờ bắt đầu ca đêm; ngăn tủ của bà = ngày trước, tháng sau', () => {
    expect(P('yta')).toBe(SHIFTS.find((s) => s.name === 'Ca đêm')!.start.replace(':', ''))
    expect(P('ngan_ba')).toBe('1205')
    expect(GRANDMA.day).toBe(12)
    expect(GRANDMA.month).toBe(5)
  })
})

describe('Chỉ số sinh tồn', () => {
  const base = { battery: 50, sanity: 50, stamina: 100, exhausted: false }
  const env = { dt: 1, lightOn: true, inLit: false, hidden: false, sprinting: false, moving: false, entityDist: Infinity, entityVisible: false }

  it('đèn pin tốn pin, hết pin thì tự tắt', () => {
    expect(stepMeters(base, env).battery).toBeLessThan(50)
    const r = stepMeters({ ...base, battery: 0.5 }, env)
    expect(r.battery).toBe(0)
    expect(r.lightOn).toBe(false)
  })

  it('tối thì tụt tinh thần nhanh, gần đèn thì hồi, trốn thì hồi chậm', () => {
    const dark = stepMeters(base, { ...env, lightOn: false }).sanity
    const dim = stepMeters(base, env).sanity
    const lit = stepMeters(base, { ...env, inLit: true }).sanity
    const hid = stepMeters(base, { ...env, lightOn: false, hidden: true }).sanity
    expect(dark).toBeLessThan(dim)
    expect(dim).toBeLessThan(50)
    expect(lit).toBeGreaterThan(50)
    expect(hid).toBeGreaterThan(50)
  })

  it('nhìn thấy Kẻ Không Mặt ở gần làm tụt tinh thần mạnh', () => {
    const far = stepMeters(base, { ...env, entityDist: 12, entityVisible: true }).sanity
    const near = stepMeters(base, { ...env, entityDist: 2, entityVisible: true }).sanity
    expect(near).toBeLessThan(far)
  })

  it('chạy tốn thể lực; kiệt sức phải hồi mới chạy lại được', () => {
    const r = stepMeters({ ...base, stamina: 10 }, { ...env, sprinting: true, moving: true })
    expect(r.stamina).toBe(0)
    expect(r.exhausted).toBe(true)
    const r2 = stepMeters(r, env)
    expect(r2.exhausted).toBe(true)
    expect(stepMeters(r2, env).exhausted).toBe(false)
  })

  it('nhịp tim tăng khi sợ và khi nó tới gần', () => {
    expect(heartRate(100, Infinity)).toBeLessThan(heartRate(20, Infinity))
    expect(heartRate(80, 2)).toBeGreaterThan(heartRate(80, 20))
    expect(heartRate(0, 0)).toBeLessThanOrEqual(190)
  })

  it('chạy gây tiếng động lớn hơn đi bộ', () => {
    expect(playerNoise(false, false)).toBe(0)
    expect(playerNoise(true, true)).toBeGreaterThan(playerNoise(true, false))
  })
})

describe('Kẻ Không Mặt (chương 1)', () => {
  const ch = getChapter('ch1')
  const L = levelOf(ch)
  const ALL = allOpen(ch)
  const open = () => ALL
  const at = (cx: number, cz: number) => cellCenter(cx, cz)

  it('thấy người chơi trong tầm thì rượt đuổi và bắt được', () => {
    const e = new Entity(L, ch.patrol, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 5)
    const ev = e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })
    expect(ev.spotted).toBe(true)
    expect(e.state).toBe('chase')
    let caught = false
    for (let i = 0; i < 200 && !caught; i++) caught = !!e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 }).caught
    expect(caught).toBe(true)
  })

  it('tắt đèn thì khó bị phát hiện hơn', () => {
    const e = new Entity(L, ch.patrol, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 5)
    expect(e.canSee({ x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })).toBe(true)
    expect(e.canSee({ x: p.x, z: p.z, lightOn: false, hidden: false, noise: 0 })).toBe(false)
  })

  it('hệ số tầm nhìn (nổi giận) làm nó thấy xa hơn', () => {
    const e = new Entity(L, ch.patrol, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 5)
    expect(e.canSee({ x: p.x, z: p.z, lightOn: false, hidden: false, noise: 0 })).toBe(false)
    e.sightMul = 1.6
    expect(e.canSee({ x: p.x, z: p.z, lightOn: false, hidden: false, noise: 0 })).toBe(true)
  })

  it('trốn kịp thì nó mất dấu và bỏ đi', () => {
    const e = new Entity(L, ch.patrol, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 7)
    e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })
    expect(e.state).toBe('chase')
    let caught = false
    for (let i = 0; i < 400 && !caught; i++) caught = !!e.step(0.05, { x: p.x, z: p.z, lightOn: false, hidden: true, noise: 0 }).caught
    expect(caught).toBe(false)
    expect(['search', 'patrol']).toContain(e.state)
  })

  it('đi xuyên được cửa khóa (nó là ác mộng) nhưng không xuyên tường', () => {
    expect(L.findPath([7, 3], [5, 3], {}, true)).not.toBeNull()
    expect(L.findPath([7, 3], [5, 3], {}, false)).toBeNull()
  })

  it('sau khi bắt được người chơi thì dịch chuyển ra xa', () => {
    const e = new Entity(L, ch.patrol, open)
    const p = at(7, 1)
    e.placeFar(p.x, p.z)
    expect(Math.hypot(e.x - p.x, e.z - p.z)).toBeGreaterThan(15)
    expect(ENTITY.chaseSpeed).toBeGreaterThan(2.7)
    expect(ENTITY.chaseSpeed).toBeLessThan(4.9)
  })

  it('chương không có điểm tuần tra: placeFar không lỗi', () => {
    const c4 = getChapter('ch4')
    const e = new Entity(levelOf(c4), c4.patrol, () => ({}))
    e.placeFar(10, 10)
    expect(e.state).toBe('dormant')
  })
})

describe('Bóng học sinh (chương 2)', () => {
  const ch = getChapter('ch2')
  const L = levelOf(ch)
  const home = cellCenter(5, 5)
  const player = cellCenter(12, 5)

  it('đứng im khi bị nhìn', () => {
    const s = new Shade(L, home.x, home.z)
    for (let i = 0; i < 50; i++) s.step(0.05, player.x, player.z, true, {}, false)
    expect(s.x).toBe(home.x)
    expect(s.moving).toBe(false)
  })

  it('trườn tới khi bạn quay lưng, chạm vào là bị thương', () => {
    const s = new Shade(L, home.x, home.z)
    let touched = false
    for (let i = 0; i < 200 && !touched; i++) touched = s.step(0.05, player.x, player.z, false, {}, false).touched
    expect(touched).toBe(true)
    s.reset()
    expect(s.x).toBe(home.x)
  })

  it('không đuổi khi người chơi đang trốn', () => {
    const s = new Shade(L, home.x, home.z)
    s.step(0.5, player.x, player.z, false, {}, true)
    expect(s.x).toBe(home.x)
  })
})

describe('Túi đồ và tiến trình', () => {
  beforeEach(() => {
    useHorror.getState().newGame()
    useHorror.getState().enterChapter()
  })

  it('bắt đầu ở thẻ chương 1, bấm vào thì chơi', () => {
    useHorror.getState().newGame()
    expect(useHorror.getState().screen).toBe('chapter')
    expect(useHorror.getState().chapter).toBe('ch1')
    useHorror.getState().enterChapter()
    expect(useHorror.getState().screen).toBe('play')
  })

  it('túi chỉ có 4 ô', () => {
    let inv = freshProgress().inventory
    for (let i = 0; i < 4; i++) inv = addItem(inv, 'pin')!
    expect(addItem(inv, 'bang')).toBeNull()
  })

  it('giải hộp đồ chơi: nhận chìa + mảnh ký ức; mở cửa phòng ngủ thì mất chìa', () => {
    const s = useHorror.getState()
    expect(s.submitCode('toybox', '123')).toBe(false)
    expect(useHorror.getState().stats.wrongCodes).toBe(1)
    expect(s.submitCode('toybox', CH1_CEILING)).toBe(true)
    expect(useHorror.getState().inventory).toContain('key_bedroom')
    expect(useHorror.getState().fragments).toEqual(['c1-1'])
    useHorror.getState().interact('cua_1')
    expect(useHorror.getState().open['1']).toBe(true)
    expect(useHorror.getState().inventory).not.toContain('key_bedroom')
  })

  it('túi đầy thì phần thưởng nằm lại trong két, quay lại lấy được', () => {
    useHorror.setState({ inventory: ['pin', 'pin', 'thuoc', 'bang'] })
    useHorror.getState().submitCode('safe', '5341')
    expect(useHorror.getState().inventory).not.toContain('key_class')
    useHorror.getState().useSlot(2)
    useHorror.getState().interact('ket_sat')
    expect(useHorror.getState().inventory).toContain('key_class')
  })

  it('không vứt được chìa khóa hay cầu chì', () => {
    useHorror.setState({ inventory: ['key_class', 'cau_chi', null, null] })
    useHorror.getState().dropSlot(0)
    useHorror.getState().dropSlot(1)
    expect(useHorror.getState().inventory.slice(0, 2)).toEqual(['key_class', 'cau_chi'])
  })

  it('bị bắt mất 1 máu; hết máu thì thua và thử lại từ điểm lưu với đủ máu', () => {
    useHorror.getState().caught()
    expect(useHorror.getState().hp).toBe(2)
    useHorror.getState().caught()
    useHorror.getState().caught()
    expect(useHorror.getState().screen).toBe('gameover')
    useHorror.getState().retry()
    expect(useHorror.getState().screen).toBe('play')
    expect(useHorror.getState().hp).toBe(3)
  })

  it('mở cửa chính → sang chương 2: bỏ chìa, giữ pin và ký ức, hồi máu', () => {
    useHorror.setState({ inventory: ['key_bath', 'pin', null, null], hp: 1 })
    expect(useHorror.getState().submitCode('front', '0317')).toBe(true)
    const s = useHorror.getState()
    expect(s.achievements).toContain('doc_gio')
    expect(s.chapter).toBe('ch2')
    expect(s.screen).toBe('chapter')
    expect(s.justFinished).toBe('ch1')
    expect(s.inventory).toEqual([null, 'pin', null, null])
    expect(s.hp).toBe(3)
    expect(s.hasFlashlight).toBe(true)
    expect(s.unlocked).toContain('ch2')
    expect(s.checkpoint?.progress.chapter).toBe('ch2')
  })

  it('carryOver bỏ cầu chì, cửa đã mở và cờ gắn với vật của chương cũ', () => {
    const p = { ...freshProgress('ch3'), inventory: ['cau_chi', 'thuoc', 'key_303', null], open: { '3': true }, flags: { 'taken:pin_1': true, power_on: true, 'caught:ch3': true } }
    const n = carryOver(p, 'ch4')
    expect(n.inventory).toEqual([null, 'thuoc', null, null])
    expect(n.open).toEqual({})
    expect(n.chapter).toBe('ch4')
    expect(n.flags).toEqual({ 'caught:ch3': true })
  })

  it('chương 2: cổng trường cần chìa cổng', () => {
    useHorror.getState().startChapter('ch2')
    useHorror.getState().enterChapter()
    useHorror.getState().interact('cong')
    expect(useHorror.getState().chapter).toBe('ch2')
    useHorror.setState({ inventory: ['key_cong', null, null, null] })
    useHorror.getState().interact('cong')
    expect(useHorror.getState().chapter).toBe('ch3')
  })

  it('đàn piano đúng ngay lần đầu: thành tựu Giai điệu', () => {
    useHorror.getState().startChapter('ch2')
    expect(useHorror.getState().submitCode('piano', SHEET.map((n) => n + 1).join(''))).toBe(true)
    expect(useHorror.getState().fragments).toContain('c2-1')
    expect(useHorror.getState().achievements).toContain('giai_dieu')
  })

  it('chương 3: phòng y tá mở bằng mã; thang máy cần có điện', () => {
    useHorror.getState().startChapter('ch3')
    useHorror.getState().enterChapter()
    useHorror.getState().submitCode('yta', '2200')
    expect(useHorror.getState().open['4']).toBe(true)
    useHorror.getState().interact('thang_may')
    expect(useHorror.getState().chapter).toBe('ch3')
    useHorror.getState().setFlag('power_on')
    useHorror.getState().interact('thang_may')
    expect(useHorror.getState().chapter).toBe('ch4')
  })

  it('removeItems bỏ đúng số lượng', () => {
    useHorror.setState({ inventory: ['cau_chi', 'pin', 'cau_chi', 'cau_chi'] })
    expect(useHorror.getState().removeItems('cau_chi', 2)).toBe(2)
    expect(useHorror.getState().inventory.filter((x) => x === 'cau_chi').length).toBe(1)
  })

  it('kết thúc: đủ 10 mảnh = kết thật; thiếu = tỉnh giấc', () => {
    useHorror.setState({ fragments: ALL_FRAGMENTS.slice(0, 7).map((f) => f.id) })
    useHorror.getState().finish()
    expect(useHorror.getState().ending).toBe('awake')
    useHorror.getState().newGame()
    useHorror.setState({ fragments: ALL_FRAGMENTS.map((f) => f.id), sanity: 80 })
    useHorror.getState().finish()
    expect(useHorror.getState().ending).toBe('true')
    expect(useHorror.getState().achievements).toContain('doi_mat')
    expect(useHorror.getState().screen).toBe('ending')
  })

  it('thuốc hồi tinh thần, pin nạp đèn, băng gạc hồi máu', () => {
    useHorror.setState({ inventory: ['thuoc', 'pin', 'bang', null], sanity: 20, battery: 10, hasFlashlight: true, hp: 1 })
    useHorror.getState().useSlot(0)
    useHorror.getState().useSlot(1)
    useHorror.getState().useSlot(2)
    const s = useHorror.getState()
    expect(s.sanity).toBe(55)
    expect(s.battery).toBe(50)
    expect(s.hp).toBe(2)
    expect(s.inventory.every((x) => x === null)).toBe(true)
  })
})
