import { describe, expect, it } from 'vitest'
import { registry } from '../game'
import { isPortal, mapX, mapZ, nearestInReach, placeHotspot, resolveMove, WORLD } from '../three/layout'

describe('Bố cục thế giới 3D', () => {
  it('quy đổi tọa độ % sang thế giới giữ đúng thứ tự trái/phải, xa/gần', () => {
    expect(mapX(0)).toBeLessThan(mapX(50))
    expect(mapX(50)).toBe(0)
    expect(mapX(100)).toBeGreaterThan(0)
    expect(mapZ(30)).toBeLessThan(mapZ(90))
  })

  for (const scene of Object.values(registry.scenes)) {
    it(`cảnh "${scene.name}": mọi hotspot nằm trong sân chơi, không kẹt người chơi khi xuất hiện`, () => {
      for (const h of scene.hotspots) {
        const p = placeHotspot(h)
        expect(Math.abs(p.x), h.id).toBeLessThanOrEqual(WORLD.halfX)
        expect(p.z, h.id).toBeGreaterThanOrEqual(WORLD.minZ)
        expect(p.z, h.id).toBeLessThanOrEqual(WORLD.maxZ)
        const d = Math.hypot(p.x - WORLD.spawn.x, p.z - WORLD.spawn.z)
        // Không xuất hiện bên trong vật cản hay đứng sẵn trong một cổng.
        expect(d, h.id).toBeGreaterThan(p.radius + 0.4)
      }
      // Cổng quay lui không nằm trong tầm với ngay lúc xuất hiện (tránh bấm nhầm).
      const portals = scene.hotspots.filter((h) => isPortal(h) && h.sprite === 'exitDown').map((h) => ({ id: h.id, place: placeHotspot(h) }))
      expect(nearestInReach(WORLD.spawn.x, WORLD.spawn.z, portals)).toBeNull()
    })
  }

  it('va chạm đẩy người chơi ra khỏi vật cản và giữ trong biên', () => {
    const r = resolveMove(0.1, 0, [{ x: 0, z: 0, radius: 1 }])
    expect(Math.hypot(r.x, r.z)).toBeCloseTo(1.4, 5)
    const b = resolveMove(999, -999, [])
    expect(b).toEqual({ x: WORLD.halfX, z: WORLD.minZ })
  })

  it('tìm vật gần nhất trong tầm với', () => {
    const list = [
      { id: 'xa', place: { x: 10, z: 0, radius: 0.5, portal: false, solid: true } },
      { id: 'gan', place: { x: 1.5, z: 0, radius: 0.5, portal: false, solid: true } },
    ]
    expect(nearestInReach(0, 0, list)?.id).toBe('gan')
    expect(nearestInReach(-20, 0, list)).toBeNull()
  })
})
