import { SAVE_VERSION, type RunState } from './state'
import { timeLabel } from './time'

const PREFIX = 'lang-suong-mu:'
export const SLOT_IDS = ['auto', '1', '2', '3'] as const
export type SlotId = (typeof SLOT_IDS)[number]

export interface SlotMeta {
  slot: SlotId
  savedAt: number
  sceneName: string
  timeLabel: string
  loop: number
  sanity: number
}

interface SlotData {
  meta: SlotMeta
  run: RunState
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  const st = storage()
  if (!st) return fallback
  try {
    const raw = st.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  const st = storage()
  if (!st) return false
  try {
    st.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  const st = storage()
  try {
    st?.removeItem(PREFIX + key)
  } catch {
    /* bỏ qua */
  }
}

export function saveRun(slot: SlotId, run: RunState, sceneName: string): boolean {
  const data: SlotData = {
    meta: {
      slot,
      savedAt: Date.now(),
      sceneName,
      timeLabel: timeLabel(run.actions),
      loop: run.loop,
      sanity: run.sanity,
    },
    run,
  }
  return writeJSON('slot-' + slot, data)
}

export function loadRun(slot: SlotId): RunState | null {
  const data = readJSON<SlotData | null>('slot-' + slot, null)
  if (!data || !data.run || data.run.version !== SAVE_VERSION) return null
  return data.run
}

export function slotMeta(slot: SlotId): SlotMeta | null {
  const data = readJSON<SlotData | null>('slot-' + slot, null)
  if (!data || !data.run || data.run.version !== SAVE_VERSION) return null
  return data.meta
}

export function deleteSlot(slot: SlotId): void {
  removeKey('slot-' + slot)
}
