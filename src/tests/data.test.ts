import { describe, expect, it } from 'vitest'
import { walkEffects } from '../engine/registry'
import type { Condition, Effect } from '../engine/types'
import { registry } from '../game'

const allEffects: Effect[] = []
const collect = (fx?: Effect[]) => walkEffects(fx, (e) => allEffects.push(e))
for (const s of Object.values(registry.scenes)) {
  collect(s.onEnter)
  for (const h of s.hotspots) {
    collect(h.onClick)
    for (const fx of Object.values(h.useItem ?? {})) collect(fx)
  }
}
for (const d of Object.values(registry.dialogues)) {
  for (const n of Object.values(d.nodes)) {
    collect(n.effects)
    for (const c of n.choices ?? []) collect(c.effects)
  }
}
for (const p of Object.values(registry.puzzles)) {
  collect(p.onSolve)
  collect(p.onWrong)
  collect(p.wrongRepeat)
}
for (const q of Object.values(registry.seqs)) collect(q.onComplete)
for (const v of Object.values(registry.verdicts)) collect(v.onSuccess)
for (const m of Object.values(registry.mazes)) {
  collect(m.onStep)
  collect(m.onSuccess)
  collect(m.onFail)
  collect(m.onFirstFail)
}
for (const i of Object.values(registry.items)) collect(i.onView)
const c = registry.content
;[c.onNewGame, c.onLoopStart, c.onDeadline, c.onSegment, c.onEnding].forEach(collect)
for (const o of Object.values(c.overlays)) for (const fx of Object.values(o)) collect(fx)

describe('Kiểm tra tính toàn vẹn dữ liệu', () => {
  it('mọi tham chiếu trong hiệu ứng đều tồn tại', () => {
    for (const e of allEffects) {
      if (e.t === 'goto') expect(registry.scenes[e.scene], e.scene).toBeDefined()
      if (e.t === 'dialogue') expect(registry.dialogues[e.id], e.id).toBeDefined()
      if (e.t === 'clue') expect(registry.clues[e.id], e.id).toBeDefined()
      if (e.t === 'item' || e.t === 'removeItem') expect(registry.items[e.id], e.id).toBeDefined()
      if (e.t === 'puzzle') expect(registry.puzzles[e.id], e.id).toBeDefined()
      if (e.t === 'puzzleSeq') expect(registry.seqs[e.id], e.id).toBeDefined()
      if (e.t === 'verdict') expect(registry.verdicts[e.id], e.id).toBeDefined()
      if (e.t === 'achievement') expect(registry.achievements[e.id], e.id).toBeDefined()
      if (e.t === 'maze') expect(registry.mazes[e.id], e.id).toBeDefined()
      if (e.t === 'say' && e.speaker) expect(registry.characters[e.speaker], e.speaker).toBeDefined()
    }
  })

  it('mọi nút hội thoại trỏ tới nút tồn tại và người nói hợp lệ', () => {
    for (const d of Object.values(registry.dialogues)) {
      const starts = typeof d.start === 'string' ? [d.start] : d.start.map((s) => s.node)
      for (const s of starts) expect(d.nodes[s], `${d.id}.${s}`).toBeDefined()
      for (const [id, n] of Object.entries(d.nodes)) {
        if (n.next) expect(d.nodes[n.next], `${d.id}.${id} -> ${n.next}`).toBeDefined()
        for (const ch of n.choices ?? []) if (ch.next) expect(d.nodes[ch.next], `${d.id}.${id} -> ${ch.next}`).toBeDefined()
        if (n.speaker) expect(registry.characters[n.speaker], n.speaker).toBeDefined()
      }
      // Hội thoại có điều kiện bắt đầu phải có nhánh mặc định để không bị kẹt.
      if (typeof d.start !== 'string') expect(d.start[d.start.length - 1].if, d.id).toBeUndefined()
    }
  })

  it('mọi cảnh đều có ít nhất một lối đi và mọi nhân vật trong hotspot đều tồn tại', () => {
    for (const s of Object.values(registry.scenes)) {
      expect(s.hotspots.some((h) => h.kind === 'exit' || h.onClick.some((e) => e.t === 'verdict')), s.id).toBe(true)
      for (const h of s.hotspots) if (h.character) expect(registry.characters[h.character], h.character).toBeDefined()
    }
  })

  it('mọi cảnh đều đi tới được từ cảnh bắt đầu', () => {
    const seen = new Set<string>([c.startScene])
    const queue = [c.startScene]
    const scenesFrom = (fx: Effect[]) => {
      const out: string[] = []
      walkEffects(fx, (e) => e.t === 'goto' && out.push(e.scene))
      return out
    }
    while (queue.length) {
      const s = registry.scenes[queue.shift()!]
      const nexts: string[] = []
      for (const h of s.hotspots) {
        nexts.push(...scenesFrom(h.onClick))
        for (const fx of Object.values(h.useItem ?? {})) nexts.push(...scenesFrom(fx))
        for (const e of h.onClick) {
          if (e.t === 'verdict') nexts.push(...scenesFrom(registry.verdicts[e.id].onSuccess))
          if (e.t === 'overlay') for (const fx of Object.values(c.overlays[e.id] ?? {})) nexts.push(...scenesFrom(fx))
        }
      }
      for (const n of nexts) if (!seen.has(n)) (seen.add(n), queue.push(n))
    }
    expect([...seen].sort()).toEqual(Object.keys(registry.scenes).sort())
  })

  it('điều kiện chỉ tham chiếu tới dữ liệu tồn tại', () => {
    const check = (cond?: Condition) => {
      if (!cond) return
      if (cond.t === 'clue') expect(registry.clues[cond.id]).toBeDefined()
      if (cond.t === 'item' || cond.t === 'noItem') expect(registry.items[cond.id]).toBeDefined()
      if (cond.t === 'solved') expect(registry.puzzles[cond.id] ?? registry.verdicts[cond.id]).toBeDefined()
      if (cond.t === 'all' || cond.t === 'any') cond.of.forEach(check)
      if (cond.t === 'not') check(cond.c)
    }
    for (const e of allEffects) if (e.t === 'if') check(e.c)
    for (const s of Object.values(registry.scenes)) for (const h of s.hotspots) check(h.if)
  })

  it('có đúng 6 lỗi tư duy và 6 thành tựu', () => {
    expect(Object.keys(registry.fallacies)).toHaveLength(6)
    expect(Object.keys(registry.achievements)).toHaveLength(6)
  })
})
