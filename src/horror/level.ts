import type { DoorDef, RoomDef } from './types'

/**
 * Bản đồ một chương, mỗi ô 2 mét.
 *  #  tường   ·   chữ cái: ô sàn thuộc phòng (định nghĩa trong chapter.rooms)
 *  chữ số có trong chapter.doors: cửa (có thể khóa)   ·   chữ số khác: lối ra (chỉ tương tác)
 */
export const CELL = 2
export const WALL_H = 3

export class Level {
  readonly W: number
  readonly H: number

  constructor(
    readonly map: string[],
    readonly doors: Record<string, DoorDef>,
    readonly rooms: Record<string, RoomDef>,
  ) {
    this.W = map[0].length
    this.H = map.length
  }

  charAt(cx: number, cz: number): string {
    if (cz < 0 || cz >= this.H || cx < 0 || cx >= this.W) return '#'
    return this.map[cz][cx] ?? '#'
  }

  isDoor(ch: string): boolean {
    return !!this.doors[ch]
  }

  /** Ô sàn thuộc phòng nào (null = tường/cửa/lối ra). */
  roomAt(cx: number, cz: number): string | null {
    const ch = this.charAt(cx, cz)
    return this.rooms[ch] ? ch : null
  }

  /** Cửa bị khóa khi có chìa hoặc mã; cửa không khóa luôn mở. */
  doorLocked(ch: string): boolean {
    const d = this.doors[ch]
    return !!d && !!(d.key || d.puzzle)
  }

  walkable(cx: number, cz: number, open: Record<string, boolean>): boolean {
    const ch = this.charAt(cx, cz)
    if (this.rooms[ch]) return true
    if (this.doors[ch]) return !this.doorLocked(ch) || !!open[ch]
    return false
  }

  doorCells(): { ch: string; cx: number; cz: number }[] {
    const out: { ch: string; cx: number; cz: number }[] = []
    for (let z = 0; z < this.H; z++) for (let x = 0; x < this.W; x++) if (this.doors[this.map[z][x]]) out.push({ ch: this.map[z][x], cx: x, cz: z })
    return out
  }

  /** Đẩy hình tròn (người chơi / thực thể) ra khỏi các ô không đi được. */
  collide(x: number, z: number, r: number, open: Record<string, boolean>): { x: number; z: number } {
    let nx = x
    let nz = z
    let [cx, cz] = toCell(nx, nz)
    if (!this.walkable(cx, cz, open)) {
      let best: [number, number] | null = null
      let bestD = Infinity
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const tx = cx + dx
        const tz = cz + dz
        if (!this.walkable(tx, tz, open)) continue
        const px = Math.max(tx * CELL + r, Math.min(nx, tx * CELL + CELL - r))
        const pz = Math.max(tz * CELL + r, Math.min(nz, tz * CELL + CELL - r))
        const d = Math.hypot(px - nx, pz - nz)
        if (d < bestD) {
          bestD = d
          best = [px, pz]
        }
      }
      if (best) {
        nx = best[0]
        nz = best[1]
        ;[cx, cz] = toCell(nx, nz)
      }
    }
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = cx + dx
        const tz = cz + dz
        if (this.walkable(tx, tz, open)) continue
        const minX = tx * CELL
        const minZ = tz * CELL
        const px = Math.max(minX, Math.min(nx, minX + CELL))
        const pz = Math.max(minZ, Math.min(nz, minZ + CELL))
        const ddx = nx - px
        const ddz = nz - pz
        const d2 = ddx * ddx + ddz * ddz
        if (d2 < r * r) {
          const d = Math.sqrt(d2)
          if (d > 1e-6) {
            nx = px + (ddx / d) * r
            nz = pz + (ddz / d) * r
          }
        }
      }
    }
    return { x: nx, z: nz }
  }

  lineOfSight(ax: number, az: number, bx: number, bz: number, open: Record<string, boolean>): boolean {
    const dist = Math.hypot(bx - ax, bz - az)
    const steps = Math.ceil(dist / 0.25)
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const [cx, cz] = toCell(ax + (bx - ax) * t, az + (bz - az) * t)
      if (!this.walkable(cx, cz, open)) return false
    }
    return true
  }

  /** A* trên lưới; `ghost` = đi xuyên được mọi cửa (thực thể trong mơ). */
  findPath(from: [number, number], to: [number, number], open: Record<string, boolean>, ghost = false): [number, number][] | null {
    const W = this.W
    const pass = (x: number, z: number) => (ghost && this.isDoor(this.charAt(x, z))) || this.walkable(x, z, open)
    if (!pass(to[0], to[1])) return null
    const key = (x: number, z: number) => z * W + x
    const g = new Map<number, number>()
    const came = new Map<number, number>()
    const openSet: [number, number, number][] = [[from[0], from[1], 0]]
    g.set(key(...from), 0)
    const h = (x: number, z: number) => Math.abs(x - to[0]) + Math.abs(z - to[1])
    const closed = new Set<number>()
    while (openSet.length) {
      let bi = 0
      for (let i = 1; i < openSet.length; i++) if (openSet[i][2] < openSet[bi][2]) bi = i
      const [x, z] = openSet.splice(bi, 1)[0]
      const k = key(x, z)
      if (closed.has(k)) continue
      closed.add(k)
      if (x === to[0] && z === to[1]) {
        const path: [number, number][] = [[x, z]]
        let c = k
        while (came.has(c)) {
          c = came.get(c)!
          path.unshift([c % W, Math.floor(c / W)])
        }
        return path
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx
        const nz = z + dz
        if (!pass(nx, nz)) continue
        const nk = key(nx, nz)
        const ng = (g.get(k) ?? 0) + 1
        if (ng < (g.get(nk) ?? Infinity)) {
          g.set(nk, ng)
          came.set(nk, k)
          openSet.push([nx, nz, ng + h(nx, nz)])
        }
      }
    }
    return null
  }
}

export function toCell(x: number, z: number): [number, number] {
  return [Math.floor(x / CELL), Math.floor(z / CELL)]
}

export function cellCenter(cx: number, cz: number): { x: number; z: number } {
  return { x: cx * CELL + CELL / 2, z: cz * CELL + CELL / 2 }
}
