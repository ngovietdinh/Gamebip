import type { Statement } from '../../engine/logic'

/** Bốn cụ bô lão và lời khai của họ dưới dạng mệnh đề (dùng cho bộ giải và unit test). */
export const ELDER_PEOPLE = ['giap', 'at', 'binh', 'dinh']

export const ELDER_STATEMENTS: Statement[] = [
  // Cụ Giáp: "Cụ Ất giữ chìa khóa."
  { speaker: 'giap', claim: (w) => w.holder === 'at' },
  // Cụ Ất: "Tôi không giữ chìa khóa."
  { speaker: 'at', claim: (w) => w.holder !== 'at' },
  // Cụ Bính: "Tôi và cụ Đinh đều không giữ."
  { speaker: 'binh', claim: (w) => w.holder !== 'binh' && w.holder !== 'dinh' },
  // Cụ Đinh: "Cụ Giáp nói dối."
  { speaker: 'dinh', claim: (w) => w.liar === 'giap' },
]
