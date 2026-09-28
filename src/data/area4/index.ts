import type { AreaDef } from '../../engine/types'
import { characters } from './characters'
import { clues } from './clues'
import { dialogues } from './dialogues'
import { verdicts } from './puzzles'
import { scenes } from './scenes'

export const area4: AreaDef = {
  id: 'a4',
  name: 'Bến đò',
  skill: 'Nghi ngờ nguồn tin',
  order: 4,
  characters,
  scenes,
  dialogues,
  puzzles: [],
  verdicts,
  clues,
}
