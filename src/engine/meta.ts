import { create } from 'zustand'
import { synth } from '../audio/synth'
import { readJSON, writeJSON } from './save'
import type { EndingId } from './types'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type FontSize = 'small' | 'medium' | 'large'
export type ViewMode = '3d' | '2d'

export interface Settings {
  volume: number
  muted: boolean
  textSpeed: TextSpeed
  fontSize: FontSize
  /** 3D: tự điều khiển nhân vật; 2D: bấm chọn kiểu point-and-click. */
  view: ViewMode
}

export const TEXT_SPEED_MS: Record<TextSpeed, number> = { slow: 45, normal: 26, fast: 12, instant: 0 }

const DEFAULT_SETTINGS: Settings = { volume: 0.7, muted: false, textSpeed: 'normal', fontSize: 'medium', view: '3d' }

interface MetaState {
  settings: Settings
  achievements: string[]
  endingsSeen: EndingId[]
  setSettings: (p: Partial<Settings>) => void
  unlockAchievement: (id: string) => boolean
  markEnding: (id: EndingId) => void
  resetProgress: () => void
}

/** Dữ liệu ngoài lượt chơi: cài đặt, thành tựu, các kết thúc đã thấy. */
export const useMeta = create<MetaState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>('settings', {}) },
  achievements: readJSON<string[]>('achievements', []),
  endingsSeen: readJSON<EndingId[]>('endings', []),
  setSettings: (p) => {
    const settings = { ...get().settings, ...p }
    set({ settings })
    writeJSON('settings', settings)
    synth.setVolume(settings.volume)
    synth.setMuted(settings.muted)
  },
  unlockAchievement: (id) => {
    if (get().achievements.includes(id)) return false
    const achievements = [...get().achievements, id]
    set({ achievements })
    writeJSON('achievements', achievements)
    return true
  },
  markEnding: (id) => {
    if (get().endingsSeen.includes(id)) return
    const endingsSeen = [...get().endingsSeen, id]
    set({ endingsSeen })
    writeJSON('endings', endingsSeen)
  },
  resetProgress: () => {
    set({ achievements: [], endingsSeen: [] })
    writeJSON('achievements', [])
    writeJSON('endings', [])
  },
}))

synth.setVolume(useMeta.getState().settings.volume)
synth.setMuted(useMeta.getState().settings.muted)
