import { create } from 'zustand'
import { FRAGMENTS, INTERACTABLES, INVENTORY_SLOTS, ITEMS, MAX_HP, NOTES, PLAYER_START, PUZZLES, type ItemId } from './content'
import { DOORS } from './level'

export type Screen = 'title' | 'play' | 'gameover' | 'ending'
export type Ending = 'escape' | 'true'

export type Modal =
  | { type: 'keypad'; puzzle: string }
  | { type: 'note'; note: string }
  | { type: 'photo'; photo: number }
  | { type: 'examine'; title: string; text: string }
  | { type: 'mirror' }
  | { type: 'inventory' }
  | { type: 'journal' }
  | { type: 'pause' }
  | { type: 'frontChoice' }
  | { type: 'intro' }

export interface Progress {
  hp: number
  sanity: number
  battery: number
  hasFlashlight: boolean
  inventory: (ItemId | null)[]
  flags: Record<string, boolean>
  fragments: number[]
  notes: string[]
  open: Record<string, boolean>
  solved: string[]
}

export interface Checkpoint {
  progress: Progress
  x: number
  z: number
  yaw: number
}

export interface Stats {
  caught: number
  wrongCodes: number
  seconds: number
}

export interface HorrorSettings {
  volume: number
  sensitivity: number
  /** Giảm hù dọa: không chớp mặt, không hét to. */
  reduceScares: boolean
  quality: 'low' | 'high'
}

interface Msg {
  id: number
  text: string
}

export interface HorrorState extends Progress {
  screen: Screen
  stamina: number
  exhausted: boolean
  lightOn: boolean
  hidden: string | null
  modal: Modal | null
  messages: Msg[]
  checkpoint: Checkpoint | null
  ending: Ending | null
  stats: Stats
  settings: HorrorSettings
  /** Tăng mỗi lần người chơi cần dịch chuyển về điểm lưu (để World phản ứng). */
  respawnKey: number
  /** Chuỗi đối mặt cuối game đang diễn ra. */
  confronting: boolean
  achievements: string[]

  newGame: () => void
  continueGame: () => boolean
  toTitle: () => void
  say: (text: string) => void
  openModal: (m: Modal | null) => void
  interact: (id: string) => void
  submitCode: (puzzle: string, code: string) => boolean
  useSlot: (slot: number) => void
  dropSlot: (slot: number) => void
  toggleLight: () => void
  setHidden: (id: string | null) => void
  setMeters: (m: { sanity: number; battery: number; stamina: number; exhausted: boolean; lightOn: boolean }) => void
  saveCheckpoint: (x: number, z: number, yaw: number) => void
  caught: () => void
  retry: () => void
  finish: (e: Ending) => void
  startConfront: () => void
  setFlag: (k: string, v?: boolean) => void
  setSettings: (s: Partial<HorrorSettings>) => void
  tickTime: (dt: number) => void
}

const KEY = 'ba-gio-muoi-bay:'
const load = <T,>(k: string, fb: T): T => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY + k) : null
    return raw ? { ...fb, ...JSON.parse(raw) } : fb
  } catch {
    return fb
  }
}
const loadArr = (k: string): string[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY + k) : null
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const save = (k: string, v: unknown) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY + k, JSON.stringify(v))
  } catch {
    /* bộ nhớ bị chặn: bỏ qua */
  }
}

export function freshProgress(): Progress {
  return {
    hp: MAX_HP,
    sanity: 80,
    battery: 55,
    hasFlashlight: false,
    inventory: Array(INVENTORY_SLOTS).fill(null),
    flags: {},
    fragments: [],
    notes: [],
    open: { '2': true },
    solved: [],
  }
}

function snapshot(s: HorrorState): Progress {
  return {
    hp: s.hp,
    sanity: s.sanity,
    battery: s.battery,
    hasFlashlight: s.hasFlashlight,
    inventory: [...s.inventory],
    flags: { ...s.flags },
    fragments: [...s.fragments],
    notes: [...s.notes],
    open: { ...s.open },
    solved: [...s.solved],
  }
}

/** Thêm vật phẩm vào ô trống đầu tiên; trả về false nếu túi đầy. */
export function addItem(inv: (ItemId | null)[], item: ItemId): (ItemId | null)[] | null {
  const i = inv.indexOf(null)
  if (i < 0) return null
  const next = [...inv]
  next[i] = item
  return next
}

export const ACHIEVEMENTS: Record<string, { name: string; desc: string }> = {
  doi_mat: { name: 'Đối mặt', desc: 'Nhìn thẳng vào Kẻ Không Mặt và thấy được sự thật.' },
  vo_hinh: { name: 'Vô hình', desc: 'Thoát khỏi giấc mơ mà không bị bắt lần nào.' },
  doc_gio: { name: 'Người đọc giờ', desc: 'Mở cửa chính trước khi tìm đủ bốn mảnh ký ức.' },
  vung_vang: { name: 'Vững vàng', desc: 'Kết thúc với tinh thần trên 60.' },
}

let msgId = 1

export const useHorror = create<HorrorState>((set, get) => {
  const say = (text: string) => {
    const id = msgId++
    set((s) => ({ messages: [...s.messages.slice(-2), { id, text }] }))
    setTimeout(() => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })), 4200)
  }

  const unlockAch = (id: string) => {
    if (get().achievements.includes(id)) return
    const achievements = [...get().achievements, id]
    set({ achievements })
    save('achievements', achievements)
  }

  /** Nhận đồ từ một chỗ đã mở khóa; đồ không vừa túi thì để lại đó (flag left:puzzle:item). */
  const gain = (items: ItemId[], puzzle: string) => {
    let inv = get().inventory
    const flags = { ...get().flags }
    for (const it of items) {
      const next = addItem(inv, it)
      if (next) {
        inv = next
        delete flags[`left:${puzzle}:${it}`]
      } else {
        flags[`left:${puzzle}:${it}`] = true
        say(`Túi đầy — ${ITEMS[it].name} vẫn nằm trong đó. Dùng bớt đồ rồi quay lại lấy.`)
      }
    }
    set({ inventory: inv, flags })
  }

  const base = {
    ...freshProgress(),
    screen: 'title' as Screen,
    stamina: 100,
    exhausted: false,
    lightOn: false,
    hidden: null,
    modal: null,
    messages: [],
    checkpoint: load<Checkpoint | null>('checkpoint', null),
    ending: null,
    stats: { caught: 0, wrongCodes: 0, seconds: 0 },
    settings: load<HorrorSettings>('settings', { volume: 0.8, sensitivity: 1, reduceScares: false, quality: 'high' }),
    respawnKey: 0,
    confronting: false,
    achievements: loadArr('achievements'),
  }

  return {
    ...base,

    newGame: () => {
      const progress = freshProgress()
      const cp: Checkpoint = { progress, x: PLAYER_START.x * 2, z: PLAYER_START.z * 2, yaw: PLAYER_START.yaw }
      set({
        ...progress,
        screen: 'play',
        stamina: 100,
        exhausted: false,
        lightOn: false,
        hidden: null,
        modal: { type: 'intro' },
        ending: null,
        checkpoint: cp,
        stats: { caught: 0, wrongCodes: 0, seconds: 0 },
        respawnKey: get().respawnKey + 1,
        confronting: false,
      })
      save('checkpoint', cp)
    },

    continueGame: () => {
      const cp = get().checkpoint
      if (!cp) return false
      set({
        ...cp.progress,
        screen: 'play',
        stamina: 100,
        exhausted: false,
        lightOn: false,
        hidden: null,
        modal: null,
        ending: null,
        respawnKey: get().respawnKey + 1,
        confronting: false,
      })
      return true
    },

    toTitle: () => set({ screen: 'title', modal: null, hidden: null, confronting: false }),

    say,

    openModal: (m) => set({ modal: m }),

    setFlag: (k, v = true) => set((s) => ({ flags: { ...s.flags, [k]: v } })),

    interact: (id) => {
      const it = INTERACTABLES.find((x) => x.id === id)
      if (!it) return
      const s = get()
      switch (it.kind) {
        case 'flashlight':
          if (s.hasFlashlight) {
            set({ modal: { type: 'examine', title: 'Tủ đầu giường', text: 'Ngăn kéo trống rỗng. Chỉ còn mùi dầu gió của mẹ.' } })
            return
          }
          set({ hasFlashlight: true, lightOn: true })
          say('Đã nhặt đèn pin. Bấm F để bật/tắt — pin sẽ hết dần.')
          return
        case 'pickup': {
          if (s.flags['taken:' + it.id]) return
          const next = addItem(s.inventory, it.item)
          if (!next) {
            say('Túi đầy rồi (4 ô). Dùng hoặc bỏ bớt đồ trước đã.')
            return
          }
          set({ inventory: next, flags: { ...s.flags, ['taken:' + it.id]: true } })
          say(`Nhặt được: ${ITEMS[it.item].name}`)
          return
        }
        case 'note':
          set({ modal: { type: 'note', note: it.note }, notes: s.notes.includes(it.note) ? s.notes : [...s.notes, it.note] })
          return
        case 'keypad':
          if (s.solved.includes(it.puzzle) && it.puzzle !== 'front') {
            const left = PUZZLES[it.puzzle].items.filter((x) => s.flags[`left:${it.puzzle}:${x}`])
            if (left.length) gain(left, it.puzzle)
            else say('Đã mở rồi. Bên trong trống rỗng.')
            return
          }
          set({ modal: { type: 'keypad', puzzle: it.puzzle } })
          return
        case 'photo':
          set({ modal: { type: 'photo', photo: it.photo } })
          return
        case 'mirror':
          set({ modal: { type: 'mirror' }, flags: { ...s.flags, mirror_seen: true } })
          return
        case 'examine':
          set({ modal: { type: 'examine', title: it.label, text: it.text } })
          return
        case 'phone':
          if (s.flags.phone_answered) {
            say('Đầu dây bên kia chỉ còn tiếng tút tút kéo dài.')
            return
          }
          set({
            flags: { ...s.flags, phone_answered: true },
            sanity: Math.max(0, s.sanity - 6),
            modal: {
              type: 'examine',
              title: 'Điện thoại bàn',
              text: 'Tiếng thở dài rè rè qua ống nghe…\n"Con ở đâu? Mẹ về rồi đây. Mở cửa cho mẹ đi con."\nTín hiệu tắt. Cửa nhà vẫn đóng im lìm.',
            },
          })
          return
        case 'door': {
          const d = DOORS[it.door]
          if (s.open[it.door]) return
          const slot = d.key ? s.inventory.indexOf(d.key as ItemId) : -1
          if (slot >= 0) {
            const inv = [...s.inventory]
            inv[slot] = null
            set({ inventory: inv, open: { ...s.open, [it.door]: true } })
            say(`Đã mở khóa ${d.name.toLowerCase()}.`)
          } else say(`${d.name} bị khóa. Cần ${d.key ? ITEMS[d.key as ItemId].name.toLowerCase() : 'chìa khóa'}.`)
          return
        }
        case 'hide':
          // World xử lý trốn/ra khỏi chỗ trốn (cần vị trí camera).
          return
      }
    },

    submitCode: (puzzle, code) => {
      const p = PUZZLES[puzzle]
      if (code !== p.code) {
        set((s) => ({ stats: { ...s.stats, wrongCodes: s.stats.wrongCodes + 1 }, sanity: Math.max(0, s.sanity - 3) }))
        return false
      }
      const s = get()
      if (puzzle === 'front') {
        set({ modal: s.fragments.length >= FRAGMENTS.length ? { type: 'frontChoice' } : null })
        if (s.fragments.length < FRAGMENTS.length) {
          unlockAch('doc_gio')
          get().finish('escape')
        }
        return true
      }
      set({ solved: [...s.solved, puzzle], modal: null })
      gain(p.items, puzzle)
      if (p.fragment && !get().fragments.includes(p.fragment)) {
        set((st) => ({ fragments: [...st.fragments, p.fragment!].sort() }))
        const f = FRAGMENTS[p.fragment - 1]
        say(`Mảnh ký ức ${f.id}/4 — số "${f.digit}". Xem trong Nhật ký (J).`)
        if (get().fragments.length === FRAGMENTS.length) {
          setTimeout(() => say('Có tiếng trẻ con khóc… từ tủ quần áo trong phòng ngủ.'), 2500)
        }
      }
      say(p.solved)
      return true
    },

    useSlot: (slot) => {
      const s = get()
      const item = s.inventory[slot]
      if (!item) return
      const consume = () => {
        const inv = [...s.inventory]
        inv[slot] = null
        return inv
      }
      if (item === 'pin') {
        if (!s.hasFlashlight) return say('Chưa có đèn pin để lắp.')
        if (s.battery >= 99) return say('Đèn pin đang đầy pin.')
        set({ inventory: consume(), battery: Math.min(100, s.battery + 40) })
        say('Đã thay pin. Đèn sáng hơn hẳn.')
      } else if (item === 'thuoc') {
        set({ inventory: consume(), sanity: Math.min(100, s.sanity + 35) })
        say('Vị đắng lan trong miệng. Tiếng thì thầm lặng dần.')
      } else if (item === 'bang') {
        if (s.hp >= MAX_HP) return say('Chưa cần băng bó.')
        set({ inventory: consume(), hp: Math.min(MAX_HP, s.hp + 1) })
        say('Băng vết thương lại. Đỡ đau hơn.')
      } else {
        say('Chìa khóa tự dùng khi bạn mở đúng cánh cửa.')
      }
    },

    dropSlot: (slot) => {
      const s = get()
      const item = s.inventory[slot]
      if (!item) return
      if (item.startsWith('key_')) return say('Không thể vứt chìa khóa — nó còn cần để thoát ra.')
      const inv = [...s.inventory]
      inv[slot] = null
      set({ inventory: inv })
      say(`Đã bỏ ${ITEMS[item].name}.`)
    },

    toggleLight: () => {
      const s = get()
      if (!s.hasFlashlight) return
      if (!s.lightOn && s.battery <= 0) return say('Đèn pin hết pin. Tìm pin trong nhà.')
      set({ lightOn: !s.lightOn })
    },

    setHidden: (id) => set({ hidden: id }),

    setMeters: (m) => set(m),

    saveCheckpoint: (x, z, yaw) => {
      const s = get()
      const progress = snapshot(s)
      // Điểm lưu luôn cho người chơi một chút hy vọng.
      progress.battery = Math.max(progress.battery, s.hasFlashlight ? 30 : progress.battery)
      progress.sanity = Math.max(progress.sanity, 50)
      const cp = { progress, x, z, yaw }
      set({ checkpoint: cp })
      save('checkpoint', cp)
    },

    caught: () => {
      const s = get()
      const hp = s.hp - 1
      set((st) => ({ stats: { ...st.stats, caught: st.stats.caught + 1 }, hidden: null, confronting: false }))
      if (hp <= 0) {
        set({ hp: 0, screen: 'gameover', modal: null })
        return
      }
      set({ hp, sanity: Math.max(s.sanity, 45), respawnKey: s.respawnKey + 1, modal: null })
      say('Bạn giật mình tỉnh lại. Tim đập thình thịch. Nó vẫn còn ở đâu đó…')
    },

    retry: () => {
      const cp = get().checkpoint
      if (!cp) return get().newGame()
      set({
        ...cp.progress,
        hp: MAX_HP,
        screen: 'play',
        modal: null,
        hidden: null,
        lightOn: false,
        stamina: 100,
        exhausted: false,
        respawnKey: get().respawnKey + 1,
        confronting: false,
      })
    },

    finish: (e) => {
      const s = get()
      if (e === 'true') unlockAch('doi_mat')
      if (s.stats.caught === 0) unlockAch('vo_hinh')
      if (s.sanity > 60) unlockAch('vung_vang')
      set({ screen: 'ending', ending: e, modal: null, confronting: false, hidden: null })
      // Kết thúc rồi thì xóa điểm lưu (chơi lại từ đầu).
      set({ checkpoint: null })
      save('checkpoint', null)
    },

    startConfront: () => set({ confronting: true, modal: null, hidden: null }),

    setSettings: (p) => {
      const settings = { ...get().settings, ...p }
      set({ settings })
      save('settings', settings)
    },

    tickTime: (dt) => set((s) => ({ stats: { ...s.stats, seconds: s.stats.seconds + dt } })),
  }
})

/** Danh sách ghi chú đã đọc (cho Nhật ký). */
export function readNotes(ids: string[]) {
  return ids.map((id) => NOTES[id]).filter(Boolean)
}
