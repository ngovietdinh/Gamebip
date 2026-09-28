import type { AreaDef } from '../../engine/types'
import { characters } from './characters'
import { clues } from './clues'
import { dialogues } from './dialogues'
import { puzzles, puzzleSeqs } from './puzzles'
import { scenes } from './scenes'

export const area3: AreaDef = {
  id: 'a3',
  name: 'Rừng trúc',
  skill: 'Ngôn ngữ',
  order: 3,
  characters,
  scenes,
  dialogues,
  puzzles,
  puzzleSeqs,
  verdicts: [],
  clues,
}
