import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { synth } from '../audio/synth'
import { evalCondition } from './conditions'
import { determineEnding, type FinalVerdictResult } from './endings'
import { applyRandomChange, initialMazeState, pickSide } from './maze'
import { useMeta } from './meta'
import { checkPuzzle, nextInSeq, seqOrder } from './puzzle'
import type { Registry } from './registry'
import { loadRun, saveRun, type SlotId } from './save'
import { clampSanity, freshRun, loopRun, type RunState, type Stamp } from './state'
import {
  actionsForSegment,
  actionsToNextSegment,
  crossedDeadline,
  segmentOf,
  timeInfo,
  timeLabel,
  TOD_LABEL,
} from './time'
import type { Dialogue, DialogueNode, Effect, FallacyId, Hotspot, Verdict } from './types'

export type Screen = 'title' | 'game' | 'ending'

export type Modal =
  | { type: 'puzzle'; id: string }
  | { type: 'verdict'; id: string; preset?: Record<string, string> }
  | { type: 'notebook' }
  | { type: 'inventory' }
  | { type: 'menu'; tab?: 'settings' | 'save' | 'load' }

export type Card =
  | { kind: 'mistake'; fallacy: FallacyId; explain: string; missed: string; sanity: number }
  | { kind: 'info'; title: string; body: string; kicker?: string; speaker?: string }

export interface SayLine {
  speaker?: string
  text: string
}

export interface Toast {
  id: number
  text: string
}

export interface FinalOutcome extends FinalVerdictResult {
  accused: string
  evidence: string[]
}

export interface GameStore {
  reg: Registry
  run: RunState
  screen: Screen
  dialogue: { id: string; node: string } | null
  says: SayLine[]
  modal: Modal | null
  overlay: string | null
  cards: Card[]
  deferred: Card[]
  toasts: Toast[]
  usingItem: string | null
  transitionKey: number
  activeSeq: string | null
  /** Hiệu ứng mở câu đố/phán xử chờ tới khi người chơi đọc xong lời thoại. */
  pending: Effect[]
  final: FinalOutcome | null

  // --- vòng đời
  newGame: () => void
  startLoop: () => void
  loadSlot: (slot: SlotId) => boolean
  saveSlot: (slot: SlotId) => boolean
  toTitle: () => void

  // --- tương tác
  exec: (effects: Effect[] | undefined) => void
  clickHotspot: (h: Hotspot) => void
  advance: () => void
  choose: (index: number) => void
  nodeText: (node: DialogueNode) => string
  currentNode: () => DialogueNode | null
  openModal: (m: Modal) => void
  closeModal: () => void
  dismissCard: () => void
  dismissToast: (id: number) => void
  selectItem: (id: string | null) => void
  viewItem: (id: string) => void
  toggleSuspicious: (clueId: string) => void
  overlayHook: (overlay: string, hook: string) => void

  // --- câu đố & phán xử
  submitPuzzle: (answer: string) => boolean
  buyHint: () => void
  submitVerdict: (answers: Record<string, string>, evidence: string[]) => boolean

  // --- gỡ lỗi
  debugGoto: (scene: string) => void
  debugSetSegment: (segment: number) => void
  debugPatch: (p: Partial<RunState>) => void
}

let toastSeq = 1

export function stampOf(run: RunState): Stamp {
  const t = timeInfo(run.actions)
  return { day: t.day, tod: t.pastDeadline ? 'Ngày 4' : TOD_LABEL[t.tod], label: timeLabel(run.actions), loop: run.loop }
}

export function createGameStore(reg: Registry): UseBoundStore<StoreApi<GameStore>> {
  return create<GameStore>((set, get) => {
    const patchRun = (fn: (r: RunState) => Partial<RunState>) => set((s) => ({ run: { ...s.run, ...fn(s.run) } }))
    const toast = (text: string) => {
      const id = toastSeq++
      set((s) => {
        // Gộp các thông báo trùng liên tiếp: "📓 Sổ tay: đã ghi thêm ×3".
        const last = s.toasts[s.toasts.length - 1]
        const base = (t: string) => t.replace(/ ×\d+$/, '')
        if (last && base(last.text) === text) {
          const n = Number(last.text.match(/ ×(\d+)$/)?.[1] ?? 1) + 1
          return { toasts: [...s.toasts.slice(0, -1), { id, text: `${text} ×${n}` }] }
        }
        return { toasts: [...s.toasts.slice(-2), { id, text }] }
      })
    }
    const areaOfScene = () => reg.scenes[get().run.sceneId]?.area ?? ''

    const autosave = () => {
      const r = get().run
      if (r.ending) return
      saveRun('auto', r, reg.scenes[r.sceneId]?.name ?? '')
    }

    const addActions = (n: number) => {
      if (n <= 0) return
      const before = get().run.actions
      const after = before + n
      patchRun(() => ({ actions: after }))
      if (segmentOf(after) !== segmentOf(before)) {
        toast('⏳ ' + timeLabel(after))
        synth.play('bell')
        exec(reg.content.onSegment)
      }
      if (crossedDeadline(before, after) && !get().run.ending) {
        exec(reg.content.onDeadline)
      }
    }

    const enterScene = (sceneId: string) => {
      if (!reg.scenes[sceneId]) {
        console.warn('Không tìm thấy cảnh', sceneId)
        return
      }
      patchRun(() => ({ sceneId }))
      set((s) => ({ transitionKey: s.transitionKey + 1, usingItem: null }))
      autosave()
      exec(reg.scenes[sceneId].onEnter)
    }

    const startDialogue = (id: string) => {
      const d = reg.dialogues[id]
      if (!d) {
        console.warn('Không tìm thấy hội thoại', id)
        return
      }
      const start = resolveStart(d, get().run)
      if (!start) return
      enterNode(d, start)
    }

    const enterNode = (d: Dialogue, nodeId: string) => {
      const node = d.nodes[nodeId]
      if (!node) {
        console.warn('Không tìm thấy nút hội thoại', d.id, nodeId)
        endDialogue()
        return
      }
      set({ dialogue: { id: d.id, node: nodeId } })
      exec(node.effects)
    }

    const endDialogue = () => {
      const cur = get().dialogue
      set({ dialogue: null })
      if (cur && !reg.dialogues[cur.id]?.free) addActions(1)
    }

    const unlock = (id: string) => {
      const def = reg.achievements[id]
      if (!def || get().run.achievements.includes(id)) return
      patchRun((r) => ({ achievements: [...r.achievements, id] }))
      useMeta.getState().unlockAchievement(id)
      toast('🏆 Thành tựu: ' + def.name)
      synth.play('success')
    }

    const openPuzzle = (id: string) => {
      if (!reg.puzzles[id]) return
      set({ modal: { type: 'puzzle', id } })
    }

    const openSeq = (seqId: string) => {
      const seq = reg.seqs[seqId]
      if (!seq) return
      const order = seqOrder(seq, !!seq.alt && evalCondition(seq.alt.if, get().run))
      const next = nextInSeq(order, get().run.solved)
      if (next) {
        set({ activeSeq: seqId })
        openPuzzle(next)
      } else {
        set({ activeSeq: null })
        exec(seq.onComplete)
      }
    }

    const exec = (effects: Effect[] | undefined) => {
      if (!effects) return
      for (const e of effects) runEffect(e)
    }

    const runEffect = (e: Effect) => {
      const run = get().run
      // Câu đố/phán xử không mở chồng lên lời thoại đang chờ đọc.
      if ((e.t === 'puzzle' || e.t === 'puzzleSeq' || e.t === 'verdict') && (get().says.length || get().dialogue)) {
        set((s) => ({ pending: [...s.pending, e] }))
        return
      }
      switch (e.t) {
        case 'dialogue':
          startDialogue(e.id)
          break
        case 'goto':
          if (!e.free) addActions(1)
          synth.play('whoosh')
          enterScene(e.scene)
          break
        case 'clue': {
          if (!reg.clues[e.id]) {
            console.warn('Không tìm thấy manh mối', e.id)
            break
          }
          if (run.clues.some((c) => c.id === e.id)) break
          patchRun((r) => ({ clues: [...r.clues, { id: e.id, at: stampOf(r), suspicious: false }] }))
          toast('📓 Sổ tay: đã ghi thêm')
          synth.play('page')
          break
        }
        case 'flag':
          patchRun((r) => ({ flags: { ...r.flags, [e.key]: e.value === undefined ? true : e.value } }))
          break
        case 'incFlag':
          patchRun((r) => ({ flags: { ...r.flags, [e.key]: Number(r.flags[e.key] ?? 0) + (e.by ?? 1) } }))
          break
        case 'item':
          if (run.inventory.includes(e.id)) break
          patchRun((r) => ({ inventory: [...r.inventory, e.id] }))
          toast('🎒 Nhận được: ' + (reg.items[e.id]?.name ?? e.id))
          break
        case 'removeItem':
          patchRun((r) => ({ inventory: r.inventory.filter((x) => x !== e.id) }))
          break
        case 'time':
          addActions(e.n)
          break
        case 'nextSegment':
          if (timeInfo(run.actions).pastDeadline) break
          addActions(actionsToNextSegment(run.actions))
          break
        case 'stamp':
          patchRun((r) => ({ flags: { ...r.flags, [e.key]: segmentOf(r.actions) } }))
          break
        case 'sanity':
          patchRun((r) => ({ sanity: clampSanity(r.sanity + e.n) }))
          if (e.n !== 0) toast((e.n > 0 ? '🧠 Tỉnh táo +' : '🌫 Tỉnh táo ') + e.n)
          break
        case 'puzzle':
          openPuzzle(e.id)
          break
        case 'puzzleSeq':
          openSeq(e.id)
          break
        case 'verdict':
          set({ modal: { type: 'verdict', id: e.id, preset: e.preset } })
          break
        case 'sound':
          synth.play(e.id)
          break
        case 'achievement':
          unlock(e.id)
          break
        case 'mistake': {
          const penalty = e.sanity ?? 5
          patchRun((r) => ({
            sanity: clampSanity(r.sanity - penalty),
            mistakes: [...r.mistakes, { fallacy: e.fallacy, explain: e.explain, missed: e.missed, at: stampOf(r), area: areaOfScene() }],
          }))
          const card: Card = { kind: 'mistake', fallacy: e.fallacy, explain: e.explain, missed: e.missed, sanity: penalty }
          if (e.deferred) set((s) => ({ deferred: [...s.deferred, card] }))
          else {
            synth.play('fail')
            set((s) => ({ cards: [...s.cards, card] }))
          }
          break
        }
        case 'say':
          set((s) => ({ says: [...s.says, { speaker: e.speaker, text: e.text }] }))
          break
        case 'overlay':
          set({ overlay: e.id, modal: null })
          break
        case 'closeOverlay':
          set((s) => ({ overlay: null, cards: [...s.cards, ...s.deferred], deferred: [] }))
          break
        case 'toast':
          toast(e.text)
          break
        case 'card':
          set((s) => ({ cards: [...s.cards, { kind: 'info', title: e.title, body: e.body, kicker: e.kicker, speaker: e.speaker }] }))
          break
        case 'maze':
          runMaze(e.id, e.action)
          break
        case 'markEnding':
          useMeta.getState().markEnding(e.id)
          break
        case 'if':
          exec(evalCondition(e.c, get().run) ? e.then : e.else)
          break
        case 'once': {
          const k = 'once:' + e.key
          if (run.flags[k]) break
          patchRun((r) => ({ flags: { ...r.flags, [k]: true } }))
          exec(e.then)
          break
        }
      }
    }

    const runMaze = (id: string, action: 'enter' | 'advance' | 'left' | 'right') => {
      const maze = reg.mazes[id]
      if (!maze) return
      const cur = get().run.mazes[id] ?? initialMazeState(maze)
      const store = (m: typeof cur) =>
        patchRun((r) => ({
          mazes: { ...r.mazes, [id]: m },
          flags: { ...r.flags, [`maze:${id}:fails`]: m.fails, [`maze:${id}:progress`]: m.progress },
        }))
      if (action === 'enter') {
        store({ ...cur, progress: 0, changed: null, changedDetail: null, solved: false })
        return
      }
      if (action === 'advance') {
        store(applyRandomChange(maze, { ...cur, progress: 0 }))
        synth.play('whoosh')
        set((s) => ({ transitionKey: s.transitionKey + 1 }))
        return
      }
      const { state, result } = pickSide(maze, cur, action)
      store(state)
      if (result === 'ignored') return
      set((s) => ({ transitionKey: s.transitionKey + 1 }))
      if (result === 'progress') {
        synth.play('whoosh')
        exec(maze.onStep)
      } else if (result === 'solved') {
        synth.play('success')
        exec(maze.onSuccess)
      } else {
        exec(state.fails === 1 ? maze.onFirstFail : maze.onFail)
      }
    }

    const flushPending = () => {
      const s = get()
      if (s.pending.length && !s.says.length && !s.dialogue && !s.modal) {
        const fx = s.pending
        set({ pending: [] })
        exec(fx)
      }
    }

    const verdictWrong = (v: Verdict, answers: Record<string, string>) => {
      for (const q of v.questions) {
        if (q.kind !== 'single') continue
        const chosen = answers[q.id]
        if (chosen === v.solution[q.id]) continue
        const opt = q.options?.find((o) => o.id === chosen)
        const entry = opt?.wrong?.find((w) => evalCondition(w.ifc, get().run))
        const explain = (entry?.explain ?? 'Kết luận này không khớp với các manh mối.') + (v.method ? '\n\n' + v.method : '')
        runEffect({
          t: 'mistake',
          fallacy: entry?.fallacy ?? 'intuition',
          explain,
          missed: entry?.missed ?? 'Hãy đọc lại sổ tay.',
          sanity: v.sanityPenalty,
        })
        return
      }
    }

    return {
      reg,
      run: freshRun(reg.content.startScene),
      screen: 'title',
      dialogue: null,
      says: [],
      modal: null,
      overlay: null,
      cards: [],
      deferred: [],
      toasts: [],
      usingItem: null,
      transitionKey: 0,
      activeSeq: null,
      pending: [],
      final: null,

      newGame: () => {
        set({
          run: freshRun(reg.content.startScene),
          screen: 'game',
          dialogue: null,
          says: [],
          modal: null,
          overlay: null,
          cards: [],
          deferred: [],
          usingItem: null,
          activeSeq: null,
          pending: [],
          final: null,
        })
        exec(reg.content.onNewGame)
        enterScene(reg.content.startScene)
      },

      startLoop: () => {
        const prev = get().run
        set({
          run: loopRun(prev, reg.content.startScene),
          screen: 'game',
          dialogue: null,
          says: [],
          modal: null,
          overlay: null,
          cards: [],
          deferred: [],
          usingItem: null,
          activeSeq: null,
          pending: [],
          final: null,
        })
        exec(reg.content.onLoopStart)
        enterScene(reg.content.startScene)
      },

      loadSlot: (slot) => {
        const run = loadRun(slot)
        if (!run || !reg.scenes[run.sceneId]) return false
        set({
          run,
          screen: run.ending ? 'title' : 'game',
          dialogue: null,
          says: [],
          modal: null,
          overlay: null,
          cards: [],
          deferred: [],
          usingItem: null,
          activeSeq: null,
          pending: [],
          final: null,
          transitionKey: get().transitionKey + 1,
        })
        return !run.ending
      },

      saveSlot: (slot) => {
        const r = get().run
        const ok = saveRun(slot, r, reg.scenes[r.sceneId]?.name ?? '')
        toast(ok ? '💾 Đã lưu vào ô ' + slot : '⚠️ Không lưu được (trình duyệt chặn bộ nhớ)')
        return ok
      },

      toTitle: () => {
        autosave()
        set({ screen: 'title', dialogue: null, says: [], modal: null, overlay: null, cards: [], deferred: [], pending: [] })
      },

      exec,

      clickHotspot: (h) => {
        const s = get()
        if (s.dialogue || s.says.length || s.cards.length || s.modal) return
        synth.play('click')
        if (s.usingItem) {
          const item = s.usingItem
          set({ usingItem: null })
          const fx = h.useItem?.[item]
          if (fx) exec(fx)
          else runEffect({ t: 'say', text: `${reg.items[item]?.name ?? 'Vật này'} không dùng được ở đây.` })
          return
        }
        exec(h.onClick)
      },

      advance: () => {
        const s = get()
        if (s.dialogue) {
          const d = reg.dialogues[s.dialogue.id]
          const node = d?.nodes[s.dialogue.node]
          if (!node) return endDialogue()
          const choices = (node.choices ?? []).filter((c) => evalCondition(c.if, s.run))
          if (choices.length) return
          if (node.next) enterNode(d, node.next)
          else endDialogue()
          flushPending()
          return
        }
        if (s.says.length) set({ says: s.says.slice(1) })
        flushPending()
      },

      choose: (index) => {
        const s = get()
        if (!s.dialogue) return
        const d = reg.dialogues[s.dialogue.id]
        const node = d?.nodes[s.dialogue.node]
        if (!node) return
        const choices = (node.choices ?? []).filter((c) => evalCondition(c.if, s.run))
        const c = choices[index]
        if (!c) return
        synth.play('click')
        if (c.next) {
          exec(c.effects)
          // Hiệu ứng có thể đã mở hội thoại khác; chỉ đi tiếp nếu vẫn ở hội thoại này.
          if (get().dialogue?.id === d.id) enterNode(d, c.next)
        } else {
          endDialogue()
          exec(c.effects)
        }
        flushPending()
      },

      nodeText: (node) => {
        const run = get().run
        const v = node.variants?.find((x) => evalCondition(x.if, run))
        return v ? v.text : node.text
      },

      currentNode: () => {
        const d = get().dialogue
        if (!d) return null
        return reg.dialogues[d.id]?.nodes[d.node] ?? null
      },

      openModal: (m) => {
        synth.play('click')
        set({ modal: m })
      },

      closeModal: () => set({ modal: null, activeSeq: null }),

      dismissCard: () => set((s) => ({ cards: s.cards.slice(1) })),

      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      selectItem: (id) => set({ usingItem: id, modal: null }),

      viewItem: (id) => exec(reg.items[id]?.onView),

      toggleSuspicious: (clueId) =>
        patchRun((r) => ({ clues: r.clues.map((c) => (c.id === clueId ? { ...c, suspicious: !c.suspicious } : c)) })),

      overlayHook: (overlay, hook) => exec(reg.content.overlays[overlay]?.[hook]),

      submitPuzzle: (answer) => {
        const m = get().modal
        if (!m || m.type !== 'puzzle') return false
        const p = reg.puzzles[m.id]
        const attempts = (get().run.attempts[p.id] ?? 0) + 1
        patchRun((r) => ({ attempts: { ...r.attempts, [p.id]: attempts } }))
        if (checkPuzzle(p, answer)) {
          const firstTry = attempts === 1 && !get().run.hints[p.id]
          patchRun((r) => ({ solved: { ...r.solved, [p.id]: { firstTry } } }))
          synth.play('success')
          if (firstTry && p.firstTryBonus) runEffect({ t: 'sanity', n: p.firstTryBonus })
          const seq = get().activeSeq
          set({ modal: null })
          exec(p.onSolve)
          // Câu tiếp theo sẽ mở sau khi người chơi đọc xong lời nhận xét.
          if (seq && reg.seqs[seq]?.puzzles.includes(p.id) && !get().modal) runEffect({ t: 'puzzleSeq', id: seq })
          return true
        }
        exec(attempts > 1 && p.wrongRepeat ? p.wrongRepeat : p.onWrong)
        return false
      },

      buyHint: () => {
        const m = get().modal
        if (!m || m.type !== 'puzzle') return
        const p = reg.puzzles[m.id]
        if (!p.hint || get().run.hints[p.id]) return
        patchRun((r) => ({ hints: { ...r.hints, [p.id]: 1 }, flags: { ...r.flags, ['hint:' + p.area]: true } }))
        if (p.hint.cost) runEffect({ t: 'sanity', n: -p.hint.cost })
      },

      submitVerdict: (answers, evidence) => {
        const m = get().modal
        if (!m || m.type !== 'verdict') return false
        const v = reg.verdicts[m.id]
        const attempts = (get().run.attempts[v.id] ?? 0) + 1
        patchRun((r) => ({ attempts: { ...r.attempts, [v.id]: attempts } }))
        const allRight = v.questions.every((q) => q.kind !== 'single' || answers[q.id] === v.solution[q.id])

        if (v.final) {
          const suspectQ = v.questions.find((q) => q.kind === 'single')!
          const accused = answers[suspectQ.id]
          if (!allRight) verdictWrong(v, answers)
          else if (attempts === 1) runEffect({ t: 'sanity', n: v.firstTryBonus })
          const validEvidence = Object.values(reg.clues).filter((c) => c.evidence).map((c) => c.id)
          const result = determineEnding({
            accused,
            culprit: v.solution[suspectQ.id],
            evidence,
            validEvidence,
            sanity: get().run.sanity,
          })
          patchRun(() => ({ ending: result.ending }))
          if (allRight) patchRun((r) => ({ solved: { ...r.solved, [v.id]: { firstTry: attempts === 1 } } }))
          exec(reg.content.onEnding)
          useMeta.getState().markEnding(result.ending)
          set({ modal: null, final: { ...result, accused, evidence }, screen: 'ending', dialogue: null, says: [] })
          return allRight
        }

        if (!allRight) {
          verdictWrong(v, answers)
          return false
        }
        synth.play('success')
        patchRun((r) => ({ solved: { ...r.solved, [v.id]: { firstTry: attempts === 1 } } }))
        if (attempts === 1) {
          runEffect({ t: 'sanity', n: v.firstTryBonus })
          if (v.firstTryAchievement) unlock(v.firstTryAchievement)
        }
        set({ modal: null })
        exec(v.onSuccess)
        return true
      },

      debugGoto: (scene) => {
        set({ dialogue: null, says: [], modal: null, overlay: null, screen: 'game', pending: [] })
        enterScene(scene)
      },
      debugSetSegment: (segment) => {
        const target = actionsForSegment(segment)
        const cur = get().run.actions
        if (target > cur) addActions(target - cur)
        else patchRun(() => ({ actions: target }))
      },
      debugPatch: (p) => patchRun(() => p),
    }
  })
}

function resolveStart(d: Dialogue, run: RunState): string | null {
  if (typeof d.start === 'string') return d.start
  for (const s of d.start) if (evalCondition(s.if, run)) return s.node
  return null
}
