import type { ChapterDef, ChapterId, Fragment } from '../types'
import { ch1 } from './ch1'
import { ch2 } from './ch2'
import { ch3 } from './ch3'
import { ch4 } from './ch4'

export const CHAPTERS: ChapterDef[] = [ch1, ch2, ch3, ch4]

export function getChapter(id: ChapterId): ChapterDef {
  return CHAPTERS.find((c) => c.id === id) ?? ch1
}

export function nextChapter(id: ChapterId): ChapterDef | null {
  const i = CHAPTERS.findIndex((c) => c.id === id)
  return CHAPTERS[i + 1] ?? null
}

/** Mọi mảnh ký ức trong game (10 mảnh). */
export const ALL_FRAGMENTS: Fragment[] = CHAPTERS.flatMap((c) => c.fragments)

export function fragmentById(id: string): Fragment | undefined {
  return ALL_FRAGMENTS.find((f) => f.id === id)
}

/** Tra câu đố theo id trong mọi chương. */
export function findPuzzle(id: string) {
  for (const c of CHAPTERS) if (c.puzzles[id]) return c.puzzles[id]
  return undefined
}

export function findNote(id: string) {
  for (const c of CHAPTERS) if (c.notes[id]) return c.notes[id]
  return undefined
}

/** Lời kể lại ở chương cuối, mỗi cánh cửa ký ức. */
export const MEMORY_DOORS: Record<string, { title: string; text: string }> = {
  mem1: {
    title: 'Cánh cửa phòng ngủ cũ',
    text: 'Sau cánh cửa là tiếng bố mẹ cãi nhau, rồi tiếng cửa nhà đóng sầm. Một đứa trẻ trùm chăn đếm sao. "Không phải lỗi của con," một giọng nói vang lên. Là giọng của chính bạn, bây giờ.',
  },
  mem2: {
    title: 'Cánh cửa kho thể dục',
    text: 'Tiếng cười của lũ trẻ vọng lại, xa dần. Trong bóng tối, một cái bóng không mặt ngồi xuống cạnh đứa trẻ bị nhốt. Nó không làm hại ai. Nó chỉ ngồi đó, cho tới khi trời sáng.',
  },
  mem3: {
    title: 'Cánh cửa phòng 306',
    text: 'Tít… tít… tít… Rồi một tiếng tít kéo dài. Bà nằm quay mặt ra cửa, như đang chờ ai. "Sợ thì cứ sợ, nhưng đừng trốn mãi nhé con."',
  },
}

export type { ChapterDef, ChapterId }
