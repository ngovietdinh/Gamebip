import type { AreaDef } from '../../engine/types'
import { characters } from './characters'
import { clues } from './clues'
import { dialogues } from './dialogues'
import { items } from './items'
import { puzzles, verdicts } from './puzzles'
import { scenes } from './scenes'

export const area2: AreaDef = {
  id: 'a2',
  name: 'Đình làng',
  skill: 'Logic',
  order: 2,
  characters,
  scenes,
  dialogues,
  puzzles,
  verdicts,
  clues,
  items,
}
