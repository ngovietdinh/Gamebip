import { content } from './data'
import { buildRegistry } from './engine/registry'
import { createGameStore } from './engine/store'

export const registry = buildRegistry(content)
export const useGame = createGameStore(registry)
