import type { TimeOfDay } from '../engine/types'

export interface Palette {
  tod: TimeOfDay
  skyTop: string
  skyBottom: string
  far: string
  mid: string
  near: string
  ground: string
  groundDark: string
  fog: string
  figure: string
  rim: string
  accent: string
  light: string
  wood: string
  roof: string
  water: string
  leaf: string
}

/** Sáng vàng nhạt, chiều cam, tối xanh tím — mọi cảnh dùng chung bảng màu theo buổi. */
export const PALETTES: Record<TimeOfDay, Palette> = {
  sang: {
    tod: 'sang',
    skyTop: '#efe6c6',
    skyBottom: '#dfe4dc',
    far: '#bcc6c5',
    mid: '#95a4a6',
    near: '#6b7c80',
    ground: '#7f8c79',
    groundDark: '#5b6858',
    fog: '#eef1ea',
    figure: '#2a3237',
    rim: '#f6f1dc',
    accent: '#c29a4f',
    light: '#fff5d2',
    wood: '#6d5a45',
    roof: '#4d4540',
    water: '#a9bcbf',
    leaf: '#6f8a62',
  },
  chieu: {
    tod: 'chieu',
    skyTop: '#efae72',
    skyBottom: '#f1d6b2',
    far: '#caa593',
    mid: '#a0847e',
    near: '#6f5c5e',
    ground: '#8b7459',
    groundDark: '#634f40',
    fog: '#f6e1c9',
    figure: '#2b2122',
    rim: '#ffd9ae',
    accent: '#d67f36',
    light: '#ffe0b0',
    wood: '#6a4b35',
    roof: '#4a3530',
    water: '#c4a896',
    leaf: '#7d7a4c',
  },
  toi: {
    tod: 'toi',
    skyTop: '#1c1e44',
    skyBottom: '#4a4478',
    far: '#4b4d7c',
    mid: '#393b66',
    near: '#2a2b4d',
    ground: '#2e3250',
    groundDark: '#1f2238',
    fog: '#7f84b6',
    figure: '#0e0f20',
    rim: '#aab3f0',
    accent: '#9aa7e6',
    light: '#d3d8ff',
    wood: '#3a3552',
    roof: '#1f1d33',
    water: '#454a80',
    leaf: '#35425a',
  },
}

export function paletteFor(tod: TimeOfDay): Palette {
  return PALETTES[tod]
}
