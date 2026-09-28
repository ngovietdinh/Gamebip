import type { RunState } from './state'
import { timeInfo } from './time'
import type { Condition } from './types'

export function evalCondition(c: Condition | undefined, s: RunState): boolean {
  if (!c) return true
  switch (c.t) {
    case 'flag': {
      const v = s.flags[c.key]
      return c.eq === undefined ? !!v : v === c.eq
    }
    case 'notFlag':
      return !s.flags[c.key]
    case 'flagAtLeast':
      return Number(s.flags[c.key] ?? 0) >= c.n
    case 'item':
      return s.inventory.includes(c.id)
    case 'noItem':
      return !s.inventory.includes(c.id)
    case 'clue':
      return s.clues.some((e) => e.id === c.id)
    case 'tod': {
      return c.in.includes(timeInfo(s.actions).tod)
    }
    case 'day': {
      const d = timeInfo(s.actions).day
      return (c.min === undefined || d >= c.min) && (c.max === undefined || d <= c.max)
    }
    case 'loop':
      return (c.min === undefined || s.loop >= c.min) && (c.max === undefined || s.loop <= c.max)
    case 'sanity':
      return (c.min === undefined || s.sanity >= c.min) && (c.max === undefined || s.sanity <= c.max)
    case 'solved':
      return !!s.solved[c.id]
    case 'mazeBaseline': {
      const m = s.mazes[c.id]
      return !m || m.changed === null
    }
    case 'since': {
      const v = s.flags[c.key]
      if (v === undefined) return false
      return timeInfo(s.actions).segment - Number(v) >= c.n
    }
    case 'all':
      return c.of.every((x) => evalCondition(x, s))
    case 'any':
      return c.of.some((x) => evalCondition(x, s))
    case 'not':
      return !evalCondition(c.c, s)
  }
}
