/**
 * Bản đồ căn nhà trong giấc mơ, mỗi ô 2 mét.
 *  #  tường        b  phòng ngủ      h  hành lang     l  phòng khách
 *  c  lớp học      t  phòng tắm      e  sảnh cửa chính
 *  1–4 cửa phòng (1, 3, 4 bị khóa; 2 luôn mở)   5 cửa chính (chỉ tương tác, không đi qua)
 */
export const MAP = [
  '########################',
  '#bbbbb#hhhhhhhhhhh#tttt#',
  '#bbbbb#h#########h#tttt#',
  '#bbbbb1h#ccccccc#h4tttt#',
  '#bbbbb#h#ccccccc#h#tttt#',
  '#######h3ccccccc#h######',
  '#lllll#h#ccccccc#h#eeee#',
  '#lllll2h#ccccccc#hheeee5',
  '#lllll#h#########h#eeee#',
  '#lllll#hhhhhhhhhhh#eeee#',
  '########################',
]

export const CELL = 2
export const WALL_H = 3
export const W = MAP[0].length
export const H = MAP.length

export type RoomId = 'b' | 'h' | 'l' | 'c' | 't' | 'e'

export const ROOM_NAMES: Record<RoomId, string> = {
  b: 'Phòng ngủ tuổi thơ',
  h: 'Hành lang',
  l: 'Phòng khách',
  c: 'Lớp học',
  t: 'Phòng tắm',
  e: 'Sảnh cửa chính',
}

/** Cửa phòng và vật phẩm cần để mở. */
export const DOORS: Record<string, { key?: string; name: string }> = {
  '1': { key: 'key_bedroom', name: 'Cửa phòng ngủ' },
  '2': { name: 'Cửa phòng khách' },
  '3': { key: 'key_class', name: 'Cửa lớp học' },
  '4': { key: 'key_bath', name: 'Cửa phòng tắm' },
}

export function charAt(cx: number, cz: number): string {
  if (cz < 0 || cz >= H || cx < 0 || cx >= W) return '#'
  return MAP[cz][cx]
}

export function isDoor(ch: string): boolean {
  return ch >= '1' && ch <= '4'
}

/** Ô đi được: sàn, hoặc cửa đã mở. Cửa chính (5) không bao giờ đi qua được. */
export function walkable(cx: number, cz: number, open: Record<string, boolean>): boolean {
  const ch = charAt(cx, cz)
  if (ch === '#' || ch === '5') return false
  if (isDoor(ch)) return !DOORS[ch].key || !!open[ch]
  return true
}

export function roomAt(cx: number, cz: number): RoomId | null {
  const ch = charAt(cx, cz)
  return 'bhlcte'.includes(ch) && ch.length === 1 ? (ch as RoomId) : null
}

export function toCell(x: number, z: number): [number, number] {
  return [Math.floor(x / CELL), Math.floor(z / CELL)]
}

export function cellCenter(cx: number, cz: number): { x: number; z: number } {
  return { x: cx * CELL + CELL / 2, z: cz * CELL + CELL / 2 }
}

export function doorCells(): { ch: string; cx: number; cz: number }[] {
  const out: { ch: string; cx: number; cz: number }[] = []
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) if (isDoor(MAP[z][x]) || MAP[z][x] === '5') out.push({ ch: MAP[z][x], cx: x, cz: z })
  return out
}

/** Đẩy một hình tròn (người chơi/thực thể) ra khỏi các ô không đi được. */
export function collide(x: number, z: number, r: number, open: Record<string, boolean>): { x: number; z: number } {
  let nx = x
  let nz = z
  let [cx, cz] = toCell(nx, nz)
  if (!walkable(cx, cz, open)) {
    // Tâm đã lọt vào ô cản: kéo về ô đi được gần nhất bên cạnh.
    let best: [number, number] | null = null
    let bestD = Infinity
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const tx = cx + dx
      const tz = cz + dz
      if (!walkable(tx, tz, open)) continue
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
      if (walkable(tx, tz, open)) continue
      // Điểm gần nhất trên ô cản
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

/** Nhìn thấy nhau: không có tường (hay cửa đóng) nào chắn giữa hai điểm. */
export function lineOfSight(ax: number, az: number, bx: number, bz: number, open: Record<string, boolean>): boolean {
  const dist = Math.hypot(bx - ax, bz - az)
  const steps = Math.ceil(dist / 0.25)
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const [cx, cz] = toCell(ax + (bx - ax) * t, az + (bz - az) * t)
    if (!walkable(cx, cz, open)) return false
  }
  return true
}

/**
 * Tìm đường A* trên lưới. `ghost` = đi xuyên được mọi cửa phòng
 * (thực thể trong mơ không bị khóa cửa cản lại).
 */
export function findPath(
  from: [number, number],
  to: [number, number],
  open: Record<string, boolean>,
  ghost = false,
): [number, number][] | null {
  const pass = (x: number, z: number) => {
    const ch = charAt(x, z)
    if (ghost && isDoor(ch)) return true
    return walkable(x, z, open)
  }
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
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
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
