import type { Decor, Hotspot } from '../engine/types'

/**
 * Quy đổi tọa độ % của hotspot (dùng cho màn 2D) sang vị trí trong thế giới 3D.
 * Nhờ vậy dữ liệu cảnh chỉ khai báo một lần mà chạy được cả 2D lẫn 3D.
 *  - x (trái → phải) ↦ trục X
 *  - đáy hotspot (y + h, xa → gần) ↦ trục Z (âm = xa, dương = gần người chơi)
 */
export const WORLD = {
  halfX: 13,
  minZ: -13,
  maxZ: 11,
  /** Chỗ người chơi xuất hiện khi vào cảnh, nhìn về phía -Z. */
  spawn: { x: 0, z: 3.5 },
  /** Khoảng cách tối đa để tương tác (cộng thêm bán kính vật). */
  reach: 2.4,
}

const X_SCALE = 0.26

export function mapX(percentCenter: number): number {
  return (percentCenter - 50) * X_SCALE
}

/** Đáy hotspot 30% ↦ z = -11 (xa), 90% ↦ z = 5 (gần). */
export function mapZ(bottomPercent: number): number {
  const t = (bottomPercent - 30) / 60
  return -11 + Math.max(-0.1, Math.min(1, t)) * 16
}

export interface Placement {
  x: number
  z: number
  /** Bán kính va chạm/tương tác. */
  radius: number
  /** Cổng đi lại: tự kích hoạt khi bước vào. */
  portal: boolean
  /** Có chặn đường đi không. */
  solid: boolean
}

export function isPortal(h: Pick<Hotspot, 'kind' | 'sprite'>): boolean {
  return h.kind === 'exit' && !!h.sprite?.startsWith('exit')
}

export function placeHotspot(h: Hotspot): Placement {
  const cx = h.x + h.w / 2
  const bottom = h.y + h.h
  if (isPortal(h)) {
    switch (h.sprite) {
      case 'exitLeft':
        return { x: -WORLD.halfX + 1, z: clampZ(mapZ(bottom)), radius: 1.3, portal: true, solid: false }
      case 'exitRight':
        return { x: WORLD.halfX - 1, z: clampZ(mapZ(bottom)), radius: 1.3, portal: true, solid: false }
      case 'exitUp':
        return { x: mapX(cx), z: WORLD.minZ + 1.5, radius: 1.3, portal: true, solid: false }
      default:
        // Lối quay lui nằm sau lưng người chơi (xoay camera lại để thấy).
        return { x: mapX(cx), z: WORLD.maxZ - 1.5, radius: 1.3, portal: true, solid: false }
    }
  }
  const widthUnits = h.w * X_SCALE
  const radius = h.kind === 'character' ? 0.55 : Math.max(0.6, Math.min(2.4, widthUnits * 0.32))
  return { x: mapX(cx), z: mapZ(bottom), radius, portal: false, solid: true }
}

export function placeDecor(d: Decor): { x: number; z: number } {
  return { x: mapX(d.x + d.w / 2), z: mapZ(d.y + d.h) }
}

function clampZ(z: number): number {
  return Math.max(WORLD.minZ + 2, Math.min(WORLD.maxZ - 3, z))
}

/** Giữ người chơi trong sân chơi và đẩy ra khỏi các vật cản hình tròn. */
export function resolveMove(
  x: number,
  z: number,
  obstacles: { x: number; z: number; radius: number }[],
  playerRadius = 0.4,
): { x: number; z: number } {
  let nx = Math.max(-WORLD.halfX, Math.min(WORLD.halfX, x))
  let nz = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, z))
  for (const o of obstacles) {
    const dx = nx - o.x
    const dz = nz - o.z
    const min = o.radius + playerRadius
    const d2 = dx * dx + dz * dz
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.0001
      nx = o.x + (dx / d) * min
      nz = o.z + (dz / d) * min
    }
  }
  return { x: nx, z: nz }
}

/** Hotspot gần nhất trong tầm với (bỏ qua cổng, cổng tự kích hoạt). */
export function nearestInReach<T extends { id: string; place: Placement }>(px: number, pz: number, list: T[]): T | null {
  let best: T | null = null
  let bestD = Infinity
  for (const it of list) {
    const d = Math.hypot(px - it.place.x, pz - it.place.z) - it.place.radius
    if (d <= WORLD.reach && d < bestD) {
      best = it
      bestD = d
    }
  }
  return best
}
