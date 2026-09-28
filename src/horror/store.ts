import { create } from 'zustand'
import { ALL_FRAGMENTS, CHAPTERS, findPuzzle, fragmentById, getChapter, nextChapter } from './chapters'
import { INVENTORY_SLOTS, ITEMS, MAX_HP } from './items'
import { CELL } from './level'
import type { ChapterId } from './types'

export type Screen = 'title' | 'chapter' | 'play' | 'gameover' | 'ending'
export type Ending = 'true' | 'awake'

export type Modal =
  | { type: 'keypad'; puzzle: string }
  | { type: 'piano'; puzzle: string }
  | { type: 'note'; note: string }
  | { type: 'photo'; photo: number }
  | { type: 'examine'; title: string; text: string }
  | { type: 'memory'; fragment: string }
  | { type: 'mirror'; text: string }
  | { type: 'inventory' }
  | { type: 'journal' }
  | { type: 'pause' }

export interface Progress {
  chapter: ChapterId
  hp: number
  sanity: number
  battery: number
  hasFlashlight: boolean
  inventory: (string | null)[]
  flags: Record<string, boolean>
  fragments: string[]
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
  respawnKey: number
  achievements: string[]
  /** Chương đã mở khóa (chọn chương ở màn hình chính). */
  unlocked: ChapterId[]
  /** Chương vừa xong (hiện lời kết trên thẻ chuyển chương). */
  justFinished: ChapterId | null

  newGame: () => void
  startChapter: (id: ChapterId) => void
  enterChapter: () => void
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
  completeChapter: () => void
  finish: () => void
  setFlag: (k: string, v?: boolean) => void
  gainFragment: (id: string, show?: boolean) => void
  setOpen: (door: string, open: boolean) => void
  removeItems: (item: string, count: number) => number
  setSettings: (s: Partial<HorrorSettings>) => void
  tickTime: (dt: number) => void
  unlock: (id: string) => void
}

const KEY = 'ba-gio-muoi-bay:v2:'
function load<T>(k: string, fb: T): T {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY + k) : null
    if (!raw) return fb
    const v = JSON.parse(raw)
    return v && typeof v === 'object' && !Array.isArray(v) && fb && typeof fb === 'object' && !Array.isArray(fb) ? { ...fb, ...v } : (v ?? fb)
  } catch {
    return fb
  }
}
function save(k: string, v: unknown) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY + k, JSON.stringify(v))
  } catch {
    /* bộ nhớ bị chặn */
  }
}

export function freshProgress(chapter: ChapterId = 'ch1'): Progress {
  return {
    chapter,
    hp: MAX_HP,
    sanity: 80,
    battery: 55,
    hasFlashlight: chapter !== 'ch1',
    inventory: Array(INVENTORY_SLOTS).fill(null),
    flags: {},
    fragments: [],
    notes: [],
    open: {},
    solved: [],
  }
}

function snapshot(s: Progress): Progress {
  return {
    chapter: s.chapter,
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

export function addItem(inv: (string | null)[], item: string): (string | null)[] | null {
  const i = inv.indexOf(null)
  if (i < 0) return null
  const next = [...inv]
  next[i] = item
  return next
}

/** Tiến trình khi bước sang chương mới: bỏ chìa và cầu chì, hồi máu, giữ đồ tiêu hao và ký ức. */
export function carryOver(p: Progress, to: ChapterId): Progress {
  const inv = p.inventory.map((it) => (it && (ITEMS[it]?.kind === 'key' || ITEMS[it]?.kind === 'fuse') ? null : it))
  return {
    ...snapshot(p),
    chapter: to,
    hp: MAX_HP,
    sanity: Math.max(p.sanity, 70),
    battery: Math.max(p.battery, 60),
    hasFlashlight: true,
    inventory: inv,
    open: {},
    // Cờ gắn với vật trong chương (taken:, left:, wrong:…) không mang sang: id vật có thể trùng giữa các chương.
    flags: Object.fromEntries(Object.entries(p.flags).filter(([k]) => k.startsWith('caught:'))),
  }
}

export function startPoint(chapter: ChapterId) {
  const c = getChapter(chapter)
  return { x: c.start.x * CELL, z: c.start.z * CELL, yaw: c.start.yaw }
}

export const ACHIEVEMENTS: Record<string, { name: string; desc: string }> = {
  doi_mat: { name: 'Đối mặt', desc: 'Đạt kết thật: nhìn thẳng vào Kẻ Không Mặt khi đã nhớ lại tất cả.' },
  vo_hinh: { name: 'Vô hình', desc: 'Phá đảo mà không bị bắt lần nào.' },
  doc_gio: { name: 'Người đọc giờ', desc: 'Mở cửa chính căn nhà trước khi tìm đủ bốn mảnh ký ức của chương 1.' },
  vung_vang: { name: 'Vững vàng', desc: 'Phá đảo với tinh thần trên 60.' },
  giai_dieu: { name: 'Giai điệu của cô', desc: 'Đánh đúng bài hát trên cây đàn ngay lần đầu.' },
  thap_sang: { name: 'Thắp sáng', desc: 'Khôi phục điện bệnh viện mà không bị bắt trong chương 3.' },
}

let msgId = 1

export const useHorror = create<HorrorState>((set, get) => {
  const say = (text: string) => {
    const id = msgId++
    set((s) => ({ messages: [...s.messages.slice(-2), { id, text }] }))
    if (typeof setTimeout !== 'undefined') setTimeout(() => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })), 4600)
  }

  const unlock = (id: string) => {
    if (get().achievements.includes(id)) return
    const achievements = [...get().achievements, id]
    set({ achievements })
    save('achievements', achievements)
    say(`★ Thành tựu: ${ACHIEVEMENTS[id]?.name ?? id}`)
  }

  const chapterDef = () => getChapter(get().chapter)

  /** Nhận đồ; đồ không vừa túi thì để lại chỗ cũ (flag left:puzzle:item). */
  const gain = (items: string[], source: string) => {
    let inv = get().inventory
    const flags = { ...get().flags }
    for (const it of items) {
      const next = addItem(inv, it)
      if (next) {
        inv = next
        delete flags[`left:${source}:${it}`]
      } else {
        flags[`left:${source}:${it}`] = true
        say(`Túi đầy — ${ITEMS[it].name} vẫn nằm lại đó. Dùng bớt đồ rồi quay lại lấy.`)
      }
    }
    set({ inventory: inv, flags })
  }

  const gainFragment = (id: string, show = false) => {
    if (get().fragments.includes(id)) return
    const f = fragmentById(id)
    if (!f) return
    set((s) => ({ fragments: [...s.fragments, id] }))
    say(`Mảnh ký ức mới: "${f.title}" (${get().fragments.length}/${ALL_FRAGMENTS.length}). Xem trong Nhật ký (J).`)
    if (show) set({ modal: { type: 'memory', fragment: id } })
  }

  const beginChapter = (progress: Progress) => {
    const pt = startPoint(progress.chapter)
    const cp: Checkpoint = { progress, ...pt }
    const unlocked = get().unlocked.includes(progress.chapter) ? get().unlocked : [...get().unlocked, progress.chapter]
    const starts = load<Record<string, Progress>>('chapterStarts', {})
    starts[progress.chapter] = progress
    save('chapterStarts', starts)
    save('unlocked', unlocked)
    save('checkpoint', cp)
    set({
      ...progress,
      unlocked,
      checkpoint: cp,
      screen: 'chapter',
      stamina: 100,
      exhausted: false,
      lightOn: progress.hasFlashlight,
      hidden: null,
      modal: null,
      ending: null,
    })
  }

  return {
    ...freshProgress(),
    screen: 'title',
    stamina: 100,
    exhausted: false,
    lightOn: false,
    hidden: null,
    modal: null,
    messages: [],
    checkpoint: load<Checkpoint | null>('checkpoint', null),
    ending: null,
    stats: { caught: 0, wrongCodes: 0, seconds: 0 },
    settings: load<HorrorSettings>('settings', {
      volume: 0.8,
      sensitivity: 1,
      reduceScares: false,
      quality: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 'low' : 'high',
    }),
    respawnKey: 0,
    achievements: load<string[]>('achievements', []),
    unlocked: load<ChapterId[]>('unlocked', ['ch1']),
    justFinished: null,

    newGame: () => {
      set({ stats: { caught: 0, wrongCodes: 0, seconds: 0 }, justFinished: null })
      beginChapter(freshProgress('ch1'))
    },

    startChapter: (id) => {
      const starts = load<Record<string, Progress>>('chapterStarts', {})
      set({ stats: { caught: 0, wrongCodes: 0, seconds: 0 }, justFinished: null })
      beginChapter(starts[id] ?? freshProgress(id))
    },

    /** Rời thẻ chuyển chương, vào chơi. */
    enterChapter: () => set((s) => ({ screen: 'play', respawnKey: s.respawnKey + 1, justFinished: null })),

    continueGame: () => {
      const cp = get().checkpoint
      if (!cp || !cp.progress?.chapter) return false
      set({
        ...cp.progress,
        screen: 'play',
        stamina: 100,
        exhausted: false,
        lightOn: cp.progress.hasFlashlight,
        hidden: null,
        modal: null,
        ending: null,
        respawnKey: get().respawnKey + 1,
      })
      return true
    },

    toTitle: () => set({ screen: 'title', modal: null, hidden: null }),

    say,
    unlock,
    gainFragment,

    openModal: (m) => set({ modal: m }),

    setFlag: (k, v = true) => set((s) => ({ flags: { ...s.flags, [k]: v } })),

    setOpen: (door, open) => set((s) => ({ open: { ...s.open, [door]: open } })),

    removeItems: (item, count) => {
      let n = 0
      const inv = get().inventory.map((x) => {
        if (x === item && n < count) {
          n++
          return null
        }
        return x
      })
      set({ inventory: inv })
      return n
    },

    interact: (id) => {
      const ch = chapterDef()
      const it = ch.interactables.find((x) => x.id === id)
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
          set({ inventory: next, flags: { ...s.flags, ['taken:' + it.id]: true, ...(it.flag ? { [it.flag]: true } : {}) } })
          say(`Nhặt được: ${ITEMS[it.item].name}`)
          return
        }
        case 'memory':
          if (s.fragments.includes(it.fragment)) {
            set({ modal: { type: 'memory', fragment: it.fragment } })
            return
          }
          gainFragment(it.fragment, true)
          return
        case 'note':
          set({ modal: { type: 'note', note: it.note }, notes: s.notes.includes(it.note) ? s.notes : [...s.notes, it.note] })
          return
        case 'keypad':
          if (s.solved.includes(it.puzzle)) {
            const p = findPuzzle(it.puzzle)!
            const left = p.items.filter((x) => s.flags[`left:${it.puzzle}:${x}`])
            if (left.length) gain(left, it.puzzle)
            else say('Đã mở rồi. Bên trong trống rỗng.')
            return
          }
          set({ modal: { type: 'keypad', puzzle: it.puzzle } })
          return
        case 'piano':
          if (s.solved.includes(it.puzzle)) {
            const left = findPuzzle(it.puzzle)!.items.filter((x) => s.flags[`left:${it.puzzle}:${x}`])
            if (left.length) gain(left, it.puzzle)
            else set({ modal: { type: 'piano', puzzle: it.puzzle } })
            return
          }
          set({ modal: { type: 'piano', puzzle: it.puzzle } })
          return
        case 'photo':
          set({ modal: { type: 'photo', photo: it.photo } })
          return
        case 'mirror':
          set({ modal: { type: 'mirror', text: it.text }, flags: { ...s.flags, mirror_seen: true } })
          return
        case 'examine':
          set({ modal: { type: 'examine', title: it.label, text: it.text } })
          return
        case 'door': {
          const d = ch.doors[it.door]
          if (!d || s.open[it.door]) return
          if (d.puzzle) {
            set({ modal: { type: 'keypad', puzzle: d.puzzle } })
            return
          }
          const slot = d.key ? s.inventory.indexOf(d.key) : -1
          if (slot >= 0) {
            const inv = [...s.inventory]
            inv[slot] = null
            set({ inventory: inv, open: { ...s.open, [it.door]: true } })
            say(`Đã mở khóa ${d.name.toLowerCase()}.`)
          } else say(`${d.name} bị khóa. Cần ${d.key ? ITEMS[d.key].name.toLowerCase() : 'chìa khóa'}.`)
          return
        }
        case 'exit': {
          if (it.needFlag && !s.flags[it.needFlag]) {
            say(it.lockedText ?? 'Chưa đi được.')
            return
          }
          if (it.puzzle) {
            set({ modal: { type: 'keypad', puzzle: it.puzzle } })
            return
          }
          if (it.key) {
            const slot = s.inventory.indexOf(it.key)
            if (slot < 0) {
              say(it.lockedText ?? `Cần ${ITEMS[it.key].name.toLowerCase()}.`)
              return
            }
          }
          get().completeChapter()
          return
        }
        case 'hide':
        case 'event':
          // World xử lý (cần vị trí camera / kịch bản của chương).
          return
      }
    },

    submitCode: (puzzleId, code) => {
      const p = findPuzzle(puzzleId)
      if (!p) return false
      if (code !== p.code) {
        set((s) => ({ stats: { ...s.stats, wrongCodes: s.stats.wrongCodes + 1 }, sanity: Math.max(0, s.sanity - 3), flags: { ...s.flags, ['wrong:' + puzzleId]: true } }))
        return false
      }
      const s = get()
      set({ solved: s.solved.includes(puzzleId) ? s.solved : [...s.solved, puzzleId], modal: null })
      if (p.kind === 'notes' && !s.flags['wrong:' + puzzleId]) unlock('giai_dieu')
      if (p.opens) set((st) => ({ open: { ...st.open, [p.opens!]: true } }))
      if (p.flags) set((st) => ({ flags: { ...st.flags, ...Object.fromEntries(p.flags!.map((f) => [f, true])) } }))
      gain(p.items, puzzleId)
      say(p.solved)
      if (p.fragment) gainFragment(p.fragment)
      if (p.exit) {
        if (puzzleId === 'front' && get().fragments.filter((f) => f.startsWith('c1-')).length < 4) unlock('doc_gio')
        get().completeChapter()
      }
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
      const kind = ITEMS[item]?.kind
      if (kind === 'battery') {
        if (!s.hasFlashlight) return say('Chưa có đèn pin để lắp.')
        if (s.battery >= 99) return say('Đèn pin đang đầy pin.')
        set({ inventory: consume(), battery: Math.min(100, s.battery + 40) })
        say('Đã thay pin. Đèn sáng hơn hẳn.')
      } else if (kind === 'pills') {
        set({ inventory: consume(), sanity: Math.min(100, s.sanity + 35) })
        say('Vị đắng lan trong miệng. Tiếng thì thầm lặng dần.')
      } else if (kind === 'bandage') {
        if (s.hp >= MAX_HP) return say('Chưa cần băng bó.')
        set({ inventory: consume(), hp: Math.min(MAX_HP, s.hp + 1) })
        say('Băng vết thương lại. Đỡ đau hơn.')
      } else if (kind === 'fuse') {
        say('Cầu chì — mang tới tủ điện ở phòng máy.')
      } else {
        say('Chìa khóa tự dùng khi bạn mở đúng cánh cửa.')
      }
    },

    dropSlot: (slot) => {
      const s = get()
      const item = s.inventory[slot]
      if (!item) return
      const kind = ITEMS[item]?.kind
      if (kind === 'key' || kind === 'fuse') return say('Không thể vứt thứ này — bạn còn cần nó để thoát ra.')
      const inv = [...s.inventory]
      inv[slot] = null
      set({ inventory: inv })
      say(`Đã bỏ ${ITEMS[item].name}.`)
    },

    toggleLight: () => {
      const s = get()
      if (!s.hasFlashlight) return
      if (!s.lightOn && s.battery <= 0) return say('Đèn pin hết pin. Tìm pin quanh đây.')
      set({ lightOn: !s.lightOn })
    },

    setHidden: (id) => set({ hidden: id }),

    setMeters: (m) => set(m),

    saveCheckpoint: (x, z, yaw) => {
      const s = get()
      const progress = snapshot(s)
      progress.battery = Math.max(progress.battery, s.hasFlashlight ? 30 : progress.battery)
      progress.sanity = Math.max(progress.sanity, 50)
      const cp = { progress, x, z, yaw }
      set({ checkpoint: cp })
      save('checkpoint', cp)
    },

    caught: () => {
      const s = get()
      const hp = s.hp - 1
      set((st) => ({ stats: { ...st.stats, caught: st.stats.caught + 1 }, hidden: null, flags: { ...st.flags, ['caught:' + st.chapter]: true } }))
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
        lightOn: cp.progress.hasFlashlight,
        stamina: 100,
        exhausted: false,
        respawnKey: get().respawnKey + 1,
      })
    },

    completeChapter: () => {
      const s = get()
      const next = nextChapter(s.chapter)
      if (!next) {
        get().finish()
        return
      }
      set({ justFinished: s.chapter })
      beginChapter(carryOver(snapshot(s), next.id))
    },

    finish: () => {
      const s = get()
      const complete = ALL_FRAGMENTS.every((f) => s.fragments.includes(f.id))
      const e: Ending = complete ? 'true' : 'awake'
      if (e === 'true') unlock('doi_mat')
      if (s.stats.caught === 0) unlock('vo_hinh')
      if (s.sanity > 60) unlock('vung_vang')
      set({ screen: 'ending', ending: e, modal: null, hidden: null, checkpoint: null })
      save('checkpoint', null)
    },

    setSettings: (p) => {
      const settings = { ...get().settings, ...p }
      set({ settings })
      save('settings', settings)
    },

    tickTime: (dt) => set((s) => ({ stats: { ...s.stats, seconds: s.stats.seconds + dt } })),
  }
})

export function chapterCount() {
  return CHAPTERS.length
}
