import type { AreaDef } from '../../engine/types'
import { characters } from './characters'
import { clues } from './clues'
import { dialogues } from './dialogues'
import { mazes, puzzles, puzzleSeqs, verdicts } from './puzzles'
import { scenes } from './scenes'

export const area1: AreaDef = {
  id: 'a1',
  name: 'Chợ phiên',
  skill: 'Quan sát',
  order: 1,
  characters,
  scenes,
  dialogues,
  puzzles,
  puzzleSeqs,
  verdicts,
  clues,
  mazes,
}
