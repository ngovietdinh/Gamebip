import { cellCenter, findPath, lineOfSight, toCell } from './level'

// ================================================================== Chỉ số sinh tồn

export interface Meters {
  battery: number
  sanity: number
  stamina: number
  /** Kiệt sức: phải hồi tới 25 mới chạy lại được. */
  exhausted: boolean
}

export interface MeterEnv {
  dt: number
  lightOn: boolean
  /** Đang đứng trong vùng đèn nhà sáng. */
  inLit: boolean
  hidden: boolean
  sprinting: boolean
  moving: boolean
  /** Khoảng cách tới Kẻ Không Mặt (Infinity nếu nó chưa xuất hiện). */
  entityDist: number
  entityVisible: boolean
}

export const RATES = {
  batteryDrain: 1.1,
  darkDrain: 1.4,
  dimDrain: 0.15,
  litRegen: 2,
  hiddenRegen: 0.6,
  fearPerMeter: 0.6,
  sprintDrain: 24,
  staminaRegen: 15,
}

export function stepMeters(m: Meters, e: MeterEnv): Meters & { lightOn: boolean } {
  const dt = e.dt
  let battery = m.battery
  let lightOn = e.lightOn
  if (lightOn) {
    battery = Math.max(0, battery - RATES.batteryDrain * dt)
    if (battery <= 0) lightOn = false
  }

  let sanity = m.sanity
  if (e.inLit) sanity += RATES.litRegen * dt
  else if (e.hidden) sanity += RATES.hiddenRegen * dt
  else if (!lightOn) sanity -= RATES.darkDrain * dt
  else sanity -= RATES.dimDrain * dt
  if (e.entityVisible && e.entityDist < 10) sanity -= (10 - e.entityDist) * RATES.fearPerMeter * dt
  sanity = Math.max(0, Math.min(100, sanity))

  let stamina = m.stamina
  let exhausted = m.exhausted
  if (e.sprinting && e.moving && !exhausted) {
    stamina -= RATES.sprintDrain * dt
    if (stamina <= 0) {
      stamina = 0
      exhausted = true
    }
  } else {
    stamina = Math.min(100, stamina + RATES.staminaRegen * dt)
    if (exhausted && stamina >= 25) exhausted = false
  }
  return { battery, sanity, stamina, exhausted, lightOn }
}

/** Nhịp tim (bpm) theo tinh thần và khoảng cách tới Kẻ Không Mặt. */
export function heartRate(sanity: number, entityDist: number): number {
  const fear = Math.max(0, 14 - entityDist) * 6
  return Math.round(Math.min(190, 68 + (100 - sanity) * 0.5 + fear))
}

// ================================================================== Kẻ Không Mặt

export type EntityState = 'dormant' | 'patrol' | 'investigate' | 'chase' | 'search' | 'confront'

export interface PlayerSense {
  x: number
  z: number
  lightOn: boolean
  hidden: boolean
  /** Tiếng ồn người chơi tạo ra (bán kính, m). */
  noise: number
}

export interface EntityEvent {
  caught?: boolean
  /** Vừa phát hiện người chơi (để phát âm thanh hù). */
  spotted?: boolean
  /** Bước chân (để phát âm thanh). */
  step?: boolean
}

export const ENTITY = {
  patrolSpeed: 1.5,
  investigateSpeed: 2.3,
  chaseSpeed: 3.7,
  confrontSpeed: 0.8,
  sightLit: 13,
  sightDark: 5.5,
  catchDist: 1.0,
  loseAfter: 3.2,
  searchTime: 6,
}

type Rng = () => number

/**
 * Bộ não Kẻ Không Mặt: tuần tra → nghe tiếng động thì tới xem → thấy thì rượt → mất dấu thì lùng sục.
 * Thuần logic (không phụ thuộc three.js) để kiểm thử được.
 */
export class Entity {
  x = 0
  z = 0
  yaw = 0
  state: EntityState = 'dormant'
  private path: [number, number][] = []
  private repath = 0
  private patrolIdx = 0
  private lastSeen: { x: number; z: number } | null = null
  private sinceSeen = 0
  private searchLeft = 0
  private stepAcc = 0
  /** Nó đã thấy người chơi chui vào chỗ trốn. */
  sawHide = false

  constructor(
    private patrol: [number, number][],
    private open: () => Record<string, boolean>,
    private rng: Rng = Math.random,
  ) {}

  place(x: number, z: number, state: EntityState = 'patrol'): void {
    this.x = x
    this.z = z
    this.state = state
    this.path = []
    this.lastSeen = null
    this.sawHide = false
  }

  /** Đặt ở điểm tuần tra xa người chơi nhất (sau khi bắt được người chơi). */
  placeFar(px: number, pz: number): void {
    let best = this.patrol[0]
    let bestD = -1
    for (const p of this.patrol) {
      const c = cellCenter(p[0], p[1])
      const d = Math.hypot(c.x - px, c.z - pz)
      if (d > bestD) {
        bestD = d
        best = p
      }
    }
    const c = cellCenter(best[0], best[1])
    this.place(c.x, c.z, 'patrol')
    this.patrolIdx = this.patrol.indexOf(best)
  }

  canSee(p: PlayerSense): boolean {
    if (p.hidden) return false
    const d = Math.hypot(p.x - this.x, p.z - this.z)
    let range = p.lightOn ? ENTITY.sightLit : ENTITY.sightDark
    // Phía sau lưng nó nhìn kém hơn.
    const toP = Math.atan2(p.x - this.x, p.z - this.z)
    let diff = Math.abs(toP - this.yaw) % (Math.PI * 2)
    if (diff > Math.PI) diff = Math.PI * 2 - diff
    if (diff > Math.PI * 0.6) range *= 0.45
    return d < range && lineOfSight(this.x, this.z, p.x, p.z, this.open())
  }

  private goTo(tx: number, tz: number): void {
    const path = findPath(toCell(this.x, this.z), toCell(tx, tz), this.open(), true)
    this.path = path ? path.slice(1) : []
  }

  private move(speed: number, dt: number, finalTarget?: { x: number; z: number }): boolean {
    let target: { x: number; z: number } | undefined
    if (this.path.length) target = cellCenter(this.path[0][0], this.path[0][1])
    else if (finalTarget) target = finalTarget
    if (!target) return true
    const dx = target.x - this.x
    const dz = target.z - this.z
    const d = Math.hypot(dx, dz)
    const stepLen = speed * dt
    if (d <= stepLen) {
      this.x = target.x
      this.z = target.z
      if (this.path.length) this.path.shift()
    } else {
      this.x += (dx / d) * stepLen
      this.z += (dz / d) * stepLen
    }
    if (d > 0.01) {
      const want = Math.atan2(dx, dz)
      let diff = want - this.yaw
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.yaw += diff * Math.min(1, dt * 8)
    }
    this.stepAcc += stepLen
    return this.path.length === 0 && (!finalTarget || Math.hypot(finalTarget.x - this.x, finalTarget.z - this.z) < 0.2)
  }

  step(dt: number, p: PlayerSense): EntityEvent {
    const ev: EntityEvent = {}
    if (this.state === 'dormant') return ev
    const dist = Math.hypot(p.x - this.x, p.z - this.z)

    if (this.state === 'confront') {
      // Đối mặt cuối game: tiến thẳng về phía người chơi, chậm rãi.
      this.goTo(p.x, p.z)
      this.move(ENTITY.confrontSpeed, dt, { x: p.x, z: p.z })
      if (dist < ENTITY.catchDist + 0.2) ev.caught = true
      return this.stepSound(ev)
    }

    const sees = this.canSee(p)
    if (sees) {
      if (this.state !== 'chase') ev.spotted = true
      this.state = 'chase'
      this.lastSeen = { x: p.x, z: p.z }
      this.sinceSeen = 0
    } else if (this.state === 'chase') {
      this.sinceSeen += dt
      // Nếu người chơi vừa chui vào chỗ trốn ngay trước mắt nó.
      if (p.hidden && dist < 6 && this.sinceSeen < 0.6) this.sawHide = true
      if (this.sinceSeen > ENTITY.loseAfter && !this.sawHide) {
        this.state = 'search'
        this.searchLeft = ENTITY.searchTime
        this.path = []
      }
    } else if (p.noise > 0 && dist < p.noise && (this.state === 'patrol' || this.state === 'search' || this.state === 'investigate')) {
      if (this.state !== 'investigate' || this.repath <= 0) {
        this.state = 'investigate'
        this.lastSeen = { x: p.x, z: p.z }
        this.goTo(p.x, p.z)
        this.repath = 1
      }
    }
    this.repath -= dt

    switch (this.state) {
      case 'chase': {
        const tgt = this.sawHide ? { x: p.x, z: p.z } : this.lastSeen!
        if (this.repath <= 0) {
          this.goTo(tgt.x, tgt.z)
          this.repath = 0.35
        }
        const arrived = this.move(ENTITY.chaseSpeed, dt, tgt)
        if (!p.hidden && dist < ENTITY.catchDist) ev.caught = true
        if (p.hidden && this.sawHide && dist < 1.4) ev.caught = true
        if (arrived && !sees && !this.sawHide) {
          this.state = 'search'
          this.searchLeft = ENTITY.searchTime
        }
        break
      }
      case 'investigate': {
        const arrived = this.move(ENTITY.investigateSpeed, dt, this.lastSeen ?? undefined)
        if (arrived) {
          this.state = 'search'
          this.searchLeft = ENTITY.searchTime * 0.6
          this.path = []
        }
        break
      }
      case 'search': {
        this.searchLeft -= dt
        if (!this.path.length && this.lastSeen) {
          // Lảng vảng quanh chỗ cuối cùng thấy người chơi.
          const [cx, cz] = toCell(this.lastSeen.x, this.lastSeen.z)
          const tx = cx + Math.round((this.rng() - 0.5) * 6)
          const tz = cz + Math.round((this.rng() - 0.5) * 6)
          const c = cellCenter(tx, tz)
          this.goTo(c.x, c.z)
        }
        this.move(ENTITY.patrolSpeed * 1.2, dt)
        if (this.searchLeft <= 0) {
          this.state = 'patrol'
          this.path = []
          this.sawHide = false
        }
        break
      }
      case 'patrol': {
        if (!this.path.length) {
          this.patrolIdx = (this.patrolIdx + 1 + Math.floor(this.rng() * 2)) % this.patrol.length
          const c = cellCenter(...this.patrol[this.patrolIdx])
          this.goTo(c.x, c.z)
        }
        this.move(ENTITY.patrolSpeed, dt)
        break
      }
    }
    return this.stepSound(ev)
  }

  private stepSound(ev: EntityEvent): EntityEvent {
    if (this.stepAcc > 1.1) {
      this.stepAcc = 0
      ev.step = true
    }
    return ev
  }
}

/** Tiếng ồn người chơi tạo ra khi di chuyển. */
export function playerNoise(moving: boolean, sprinting: boolean): number {
  if (!moving) return 0
  return sprinting ? 11 : 3.5
}
