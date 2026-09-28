import { beforeEach, describe, expect, it } from 'vitest'
import {
  blackboardCode,
  CEILING_CODE,
  CLOCK_TIME,
  fragmentCode,
  INTERACTABLES,
  LAMPS,
  MIRROR_TEXT,
  mirrorDisplay,
  PATROL,
  photoCode,
  PLAYER_START,
  PUZZLES,
} from '../horror/content'
import { CELL, cellCenter, charAt, collide, DOORS, findPath, H, lineOfSight, roomAt, toCell, W, walkable } from '../horror/level'
import { Entity, ENTITY, heartRate, playerNoise, stepMeters } from '../horror/sim'
import { addItem, freshProgress, useHorror } from '../horror/store'

const ALL_OPEN = { '1': true, '2': true, '3': true, '4': true }
const START_OPEN = { '2': true }

describe('Bản đồ căn nhà', () => {
  it('các hàng cùng độ dài và viền ngoài kín', () => {
    for (let z = 0; z < H; z++) {
      expect(charAt(0, z)).toBe('#')
      expect(['#', '5']).toContain(charAt(W - 1, z))
    }
    for (let x = 0; x < W; x++) {
      expect(charAt(x, 0)).toBe('#')
      expect(charAt(x, H - 1)).toBe('#')
    }
  })

  it('lúc đầu chỉ ở được trong phòng ngủ (cửa khóa)', () => {
    const [sx, sz] = toCell(PLAYER_START.x * CELL, PLAYER_START.z * CELL)
    expect(roomAt(sx, sz)).toBe('b')
    expect(findPath([sx, sz], [7, 1], START_OPEN)).toBeNull()
  })

  it('mở hết cửa thì đi tới được mọi phòng và cửa chính', () => {
    const [sx, sz] = toCell(PLAYER_START.x * CELL, PLAYER_START.z * CELL)
    for (const [room, cell] of [
      ['h', [12, 1]],
      ['l', [3, 7]],
      ['c', [12, 5]],
      ['t', [20, 2]],
      ['e', [22, 7]],
    ] as const) {
      expect(findPath([sx, sz], [cell[0], cell[1]], ALL_OPEN), room).not.toBeNull()
    }
  })

  it('thứ tự mở khóa không bị kẹt: mỗi chìa nằm trong vùng đã tới được', () => {
    // Chìa phòng ngủ trong phòng ngủ; chìa lớp học ở phòng khách (mở sẵn); chìa phòng tắm trong lớp học.
    const where = (id: string) => INTERACTABLES.find((i) => i.id === id)!.at
    const reach = (open: Record<string, boolean>, at: [number, number]) =>
      findPath(toCell(PLAYER_START.x * CELL, PLAYER_START.z * CELL), [Math.floor(at[0]), Math.floor(at[1])], open) !== null
    expect(reach(START_OPEN, where('hop_do_choi'))).toBe(true)
    expect(reach({ ...START_OPEN, '1': true }, where('ket_sat'))).toBe(true)
    expect(reach({ ...START_OPEN, '1': true }, where('ban_co'))).toBe(false)
    expect(reach({ ...START_OPEN, '1': true, '3': true }, where('ban_co'))).toBe(true)
    expect(reach({ ...START_OPEN, '1': true, '3': true }, where('tu_thuoc'))).toBe(false)
    expect(reach({ ...START_OPEN, '1': true, '3': true, '4': true }, where('tu_thuoc'))).toBe(true)
    // Cửa chính: đứng ở ô sảnh ngay cạnh cửa.
    expect(reach({ ...START_OPEN, '1': true }, [22, 7])).toBe(true)
  })

  it('mọi vật tương tác, đèn và điểm tuần tra nằm trong ô đi được (hoặc sát tường)', () => {
    for (const it of INTERACTABLES) {
      const [cx, cz] = [Math.floor(it.at[0]), Math.floor(it.at[1])]
      if (it.kind === 'door') expect(DOORS[charAt(cx, cz)], it.id).toBeDefined()
      else if (it.id === 'cua_chinh') expect(charAt(cx, cz)).toBe('5')
      else expect(walkable(cx, cz, ALL_OPEN), it.id).toBe(true)
    }
    for (const l of LAMPS) expect(walkable(Math.floor(l.at[0]), Math.floor(l.at[1]), ALL_OPEN), l.id).toBe(true)
    for (const p of PATROL) expect(walkable(p[0], p[1], ALL_OPEN) || !!DOORS[charAt(p[0], p[1])], String(p)).toBe(true)
  })

  it('va chạm: không đi xuyên tường, không đi qua cửa khóa', () => {
    const c = cellCenter(1, 1)
    const p = collide(c.x - 1.2, c.z, 0.3, START_OPEN)
    expect(p.x).toBeGreaterThanOrEqual(CELL + 0.3 - 1e-6)
    const door = cellCenter(6, 3)
    const q = collide(door.x - 0.2, door.z, 0.3, START_OPEN)
    expect(q.x).toBeLessThanOrEqual(6 * CELL - 0.3 + 1e-6)
  })

  it('tầm nhìn bị tường chắn', () => {
    const a = cellCenter(7, 1)
    const b = cellCenter(7, 9)
    expect(lineOfSight(a.x, a.z, b.x, b.z, ALL_OPEN)).toBe(true)
    const c = cellCenter(12, 1)
    const d = cellCenter(12, 9)
    expect(lineOfSight(c.x, c.z, d.x, d.z, ALL_OPEN)).toBe(false)
  })
})

describe('Mật mã công bằng: đáp án suy ra được từ manh mối', () => {
  it('hộp đồ chơi = số sao dạ quang trên trần', () => expect(PUZZLES.toybox.code).toBe(CEILING_CODE))
  it('két sắt = số người trong ảnh xếp theo năm', () => expect(PUZZLES.safe.code).toBe(photoCode()))
  it('ngăn bàn cô giáo = đáp án 3 bài trên bảng', () => expect(PUZZLES.teacher.code).toBe(blackboardCode()))
  it('tủ thuốc = chữ trong gương đọc ngược lại', () => {
    expect(PUZZLES.cabinet.code).toBe(MIRROR_TEXT)
    expect(Array.from(mirrorDisplay()).reverse().join('')).toBe(PUZZLES.cabinet.code)
  })
  it('cửa chính = 4 mảnh ký ức = giờ trên chiếc đồng hồ đứng im', () => {
    expect(PUZZLES.front.code).toBe(fragmentCode())
    expect(PUZZLES.front.code).toBe('0' + CLOCK_TIME.replace(':', ''))
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

  it('chạy tốn thể lực; kiệt sức phải hồi tới 25 mới chạy lại được', () => {
    let m = { ...base, stamina: 10 }
    const r = stepMeters(m, { ...env, sprinting: true, moving: true })
    expect(r.stamina).toBe(0)
    expect(r.exhausted).toBe(true)
    m = { ...r }
    const r2 = stepMeters(m, { ...env, dt: 1 })
    expect(r2.exhausted).toBe(true)
    const r3 = stepMeters(r2, { ...env, dt: 1 })
    expect(r3.exhausted).toBe(false)
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

describe('Kẻ Không Mặt', () => {
  const open = () => ALL_OPEN
  const at = (cx: number, cz: number) => cellCenter(cx, cz)

  it('thấy người chơi trong tầm thì rượt đuổi và bắt được', () => {
    const e = new Entity(PATROL, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0 // nhìn về +Z (xuống hành lang)
    const p = at(7, 5)
    const ev = e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })
    expect(ev.spotted).toBe(true)
    expect(e.state).toBe('chase')
    let caught = false
    for (let i = 0; i < 200 && !caught; i++) caught = !!e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 }).caught
    expect(caught).toBe(true)
  })

  it('tắt đèn thì khó bị phát hiện hơn', () => {
    const e = new Entity(PATROL, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 5) // cách 8 m
    expect(e.canSee({ x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })).toBe(true)
    expect(e.canSee({ x: p.x, z: p.z, lightOn: false, hidden: false, noise: 0 })).toBe(false)
  })

  it('trốn kịp (nó không thấy lúc chui vào) thì nó mất dấu và bỏ đi', () => {
    const e = new Entity(PATROL, open, () => 0.5)
    const s = at(7, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = 0
    const p = at(7, 7)
    e.step(0.05, { x: p.x, z: p.z, lightOn: true, hidden: false, noise: 0 })
    expect(e.state).toBe('chase')
    // Người chơi ở xa (> 6 m) lúc chui vào tủ.
    let caught = false
    for (let i = 0; i < 20 * 20 && !caught; i++) caught = !!e.step(0.05, { x: p.x, z: p.z, lightOn: false, hidden: true, noise: 0 }).caught
    expect(caught).toBe(false)
    expect(['search', 'patrol']).toContain(e.state)
  })

  it('nghe tiếng chạy thì tới xem', () => {
    const e = new Entity(PATROL, open, () => 0.5)
    const s = at(12, 1)
    e.place(s.x, s.z, 'patrol')
    e.yaw = Math.PI // quay lưng
    const p = at(12, 9) // bên kia tường, không thấy nhưng nghe được? quá xa: 16 m
    e.step(0.05, { x: p.x, z: p.z, lightOn: false, hidden: true, noise: 0 })
    expect(e.state).toBe('patrol')
    const q = at(17, 1)
    e.step(0.05, { x: q.x, z: q.z, lightOn: false, hidden: false, noise: 11 })
    expect(['investigate', 'chase']).toContain(e.state)
  })

  it('đi xuyên được cửa khóa (nó là ác mộng) nhưng không xuyên tường', () => {
    expect(findPath([7, 3], [5, 3], START_OPEN, true)).not.toBeNull()
    expect(findPath([7, 3], [5, 3], START_OPEN, false)).toBeNull()
  })

  it('sau khi bắt được người chơi thì dịch chuyển ra xa', () => {
    const e = new Entity(PATROL, open)
    const p = at(7, 1)
    e.placeFar(p.x, p.z)
    expect(Math.hypot(e.x - p.x, e.z - p.z)).toBeGreaterThan(15)
    expect(ENTITY.chaseSpeed).toBeGreaterThan(2.7) // nhanh hơn người đi bộ, chậm hơn người chạy
    expect(ENTITY.chaseSpeed).toBeLessThan(4.9)
  })
})

describe('Túi đồ và tiến trình', () => {
  beforeEach(() => {
    useHorror.getState().newGame()
    useHorror.getState().openModal(null)
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
    expect(s.submitCode('toybox', '418')).toBe(true)
    expect(useHorror.getState().inventory).toContain('key_bedroom')
    expect(useHorror.getState().fragments).toEqual([1])
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

  it('không vứt được chìa khóa', () => {
    useHorror.setState({ inventory: ['key_class', null, null, null] })
    useHorror.getState().dropSlot(0)
    expect(useHorror.getState().inventory[0]).toBe('key_class')
  })

  it('bị bắt mất 1 máu; hết máu thì màn thua và thử lại từ điểm lưu với đủ máu', () => {
    const st = useHorror.getState()
    st.caught()
    expect(useHorror.getState().hp).toBe(2)
    useHorror.getState().caught()
    useHorror.getState().caught()
    expect(useHorror.getState().screen).toBe('gameover')
    useHorror.getState().retry()
    expect(useHorror.getState().screen).toBe('play')
    expect(useHorror.getState().hp).toBe(3)
  })

  it('cửa chính: thiếu ký ức thì tỉnh giấc ngay; đủ 4 mảnh thì được chọn quay lại đối mặt', () => {
    expect(useHorror.getState().submitCode('front', '0317')).toBe(true)
    expect(useHorror.getState().screen).toBe('ending')
    expect(useHorror.getState().ending).toBe('escape')
    expect(useHorror.getState().achievements).toContain('doc_gio')

    useHorror.getState().newGame()
    useHorror.setState({ fragments: [1, 2, 3, 4], modal: null })
    useHorror.getState().submitCode('front', '0317')
    expect(useHorror.getState().modal).toEqual({ type: 'frontChoice' })
    useHorror.getState().startConfront()
    expect(useHorror.getState().confronting).toBe(true)
    useHorror.getState().finish('true')
    expect(useHorror.getState().ending).toBe('true')
    expect(useHorror.getState().achievements).toContain('doi_mat')
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
