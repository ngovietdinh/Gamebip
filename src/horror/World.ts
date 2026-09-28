import * as THREE from 'three'
import { hAudio } from './audio'
import { FRAGMENTS, INTERACTABLES, LAMPS, PATROL, type Interactable, type Wall } from './content'
import { CELL, charAt, collide, doorCells, H, isDoor, lineOfSight, roomAt, toCell, W, WALL_H, type RoomId } from './level'
import { buildEntity, box, m, plane, PROPS } from './props'
import { Entity, heartRate, playerNoise, stepMeters } from './sim'
import { useHorror } from './store'
import * as T from './textures'

export interface HorrorInput {
  forward: number
  right: number
  sprint: boolean
  lookDX: number
  lookDY: number
}

export interface WorldHud {
  bpm: number
  prompt: string | null
  confront: number
  danger: number
  hiding: boolean
}

export interface WorldCallbacks {
  hud: (h: WorldHud) => void
  /** Cảnh hù: 'catch' (bị bắt), 'mirror', 'faint' (ngất vì mất tinh thần), 'flash' (ảo giác). */
  scare: (kind: 'catch' | 'mirror' | 'faint' | 'flash') => void
}

const EYE = 1.6
const RADIUS = 0.3
const WALK = 2.7
const SPRINT = 4.9
const REACH = 2.2

const ROT: Record<Wall, number> = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 }

interface Lamp {
  light: THREE.PointLight
  bulb: THREE.Mesh
  x: number
  z: number
  radius: number
  base: number
  broken: boolean
  flicker: number
}

export class HorrorWorld {
  readonly renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60)
  private flashlight: THREE.SpotLight
  private eyeLight = new THREE.PointLight('#8890b0', 0.35, 4, 2)
  private torch = new THREE.Group()
  private lamps: Lamp[] = []
  private props = new Map<string, THREE.Object3D>()
  private doors = new Map<string, THREE.Object3D>()
  private solids: { x: number; z: number; r: number }[] = []
  private entity: Entity
  private entityMesh = buildEntity()
  private shadowFigure = buildEntity()
  private glow!: THREE.Mesh
  private boardFace: THREE.Mesh | null = null
  private boardNormal = T.blackboard(false)
  private boardScary = T.blackboard(true)
  private raf = 0
  private last = 0
  private x = 0
  private z = 0
  private yaw = 0
  private pitch = 0
  private bob = 0
  private stepAcc = 0
  private hideReturn: { x: number; z: number; yaw: number } | null = null
  private focus: Interactable | null = null
  private hudTimer = 0
  private scareUntil = 0
  private visited = new Set<RoomId>()
  private lastSolved = 0
  private lastRespawn = -1
  private lastOpen = ''
  private confrontProgress = 0
  private introT = -1
  private boardLook = 0
  private boardScaryUntil = 0
  private hallucinateT = 3
  private disposed = false
  private unsub: () => void

  constructor(
    private canvas: HTMLCanvasElement,
    private input: HorrorInput,
    private cb: WorldCallbacks,
    quality: 'low' | 'high',
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = quality === 'high'
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15

    this.scene.background = new THREE.Color('#020203')
    this.scene.fog = new THREE.FogExp2('#020203', 0.075)
    this.scene.add(new THREE.AmbientLight('#1a1c26', 0.55))

    // Đèn pin gắn theo camera.
    this.flashlight = new THREE.SpotLight('#fff1d6', 26, 20, 0.5, 0.45, 1.6)
    this.flashlight.castShadow = quality === 'high'
    this.flashlight.shadow.mapSize.set(512, 512)
    this.flashlight.shadow.camera.near = 0.2
    this.flashlight.position.set(0.18, -0.2, 0)
    this.flashlight.target.position.set(0, 0, -5)
    this.camera.add(this.flashlight, this.flashlight.target, this.eyeLight)
    // Mô hình đèn pin cầm tay ở góc dưới phải.
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 10), new THREE.MeshBasicMaterial({ color: '#16171a' }))
    body.rotation.x = Math.PI / 2
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.06, 10), new THREE.MeshBasicMaterial({ color: '#2a2b2e' }))
    head.rotation.x = Math.PI / 2
    head.position.z = -0.13
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff7d8' }))
    lens.scale.z = 0.3
    lens.position.z = -0.16
    lens.name = 'lens'
    this.torch.add(body, head, lens)
    this.torch.scale.setScalar(0.8)
    this.torch.position.set(0.2, -0.2, -0.5)
    this.torch.rotation.set(0.06, 0.12, 0)
    this.camera.add(this.torch)
    this.scene.add(this.camera)

    this.buildLevel()
    this.entity = new Entity(PATROL, () => useHorror.getState().open)
    this.entityMesh.root.visible = false
    this.shadowFigure.root.visible = false
    this.scene.add(this.entityMesh.root, this.shadowFigure.root)

    this.resize()
    this.respawn()
    this.unsub = useHorror.subscribe((s, prev) => {
      if (s.confronting && !prev.confronting) this.beginConfront()
    })
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  dispose(): void {
    this.disposed = true
    this.unsub()
    cancelAnimationFrame(this.raf)
    hAudio.ring(false)
    this.renderer.dispose()
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = w < h ? 80 : 72
    this.camera.updateProjectionMatrix()
  }

  // ------------------------------------------------------------------ dựng nhà

  private buildLevel(): void {
    const wallMat = new THREE.MeshStandardMaterial({ map: T.wallpaper(), roughness: 0.95 })
    const floorMats: Record<string, THREE.MeshStandardMaterial> = {
      wood: new THREE.MeshStandardMaterial({ map: T.woodFloor(), roughness: 0.8 }),
      tile: new THREE.MeshStandardMaterial({ map: T.tileFloor(), roughness: 0.4 }),
      lino: new THREE.MeshStandardMaterial({ map: T.linoFloor(), roughness: 0.7 }),
    }
    const floorKind = (ch: string) => (ch === 't' || ch === 'e' ? 'tile' : ch === 'c' ? 'lino' : 'wood')
    const tint: Record<string, string> = { b: '#9a8fa8', h: '#8a8070', l: '#a08a78', c: '#8fa098', t: '#9aa4a8', e: '#9a8a7a' }

    // Tường: chỉ dựng các ô tường giáp sàn.
    const wallCells: [number, number, string][] = []
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        const ch = charAt(x, z)
        if (ch !== '#' && ch !== '5') continue
        let near: string | null = null
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const r = roomAt(x + dx, z + dz)
          if (r) near = r
        }
        if (near) wallCells.push([x, z, near])
      }
    const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL, WALL_H, CELL), wallMat, wallCells.length)
    const mat4 = new THREE.Matrix4()
    const col = new THREE.Color()
    wallCells.forEach(([x, z, r], i) => {
      mat4.makeTranslation(x * CELL + CELL / 2, WALL_H / 2, z * CELL + CELL / 2)
      walls.setMatrixAt(i, mat4)
      walls.setColorAt(i, col.set(tint[r]))
    })
    walls.receiveShadow = true
    walls.castShadow = true
    this.scene.add(walls)

    // Sàn và trần
    const floorCells: Record<string, [number, number, string][]> = { wood: [], tile: [], lino: [] }
    for (let z = 0; z < H; z++)
      for (let x = 0; x < W; x++) {
        const ch = charAt(x, z)
        if (ch === '#' || ch === '5') continue
        const room = isDoor(ch) ? 'h' : ch
        floorCells[floorKind(room)].push([x, z, room])
      }
    const floorGeo = new THREE.PlaneGeometry(CELL, CELL)
    floorGeo.rotateX(-Math.PI / 2)
    const ceilGeo = new THREE.PlaneGeometry(CELL, CELL)
    ceilGeo.rotateX(Math.PI / 2)
    const all: [number, number][] = []
    for (const [kind, cells] of Object.entries(floorCells)) {
      const inst = new THREE.InstancedMesh(floorGeo, floorMats[kind], cells.length)
      cells.forEach(([x, z, r], i) => {
        mat4.makeTranslation(x * CELL + CELL / 2, 0, z * CELL + CELL / 2)
        inst.setMatrixAt(i, mat4)
        inst.setColorAt(i, col.set(tint[r] ?? '#888'))
        all.push([x, z])
      })
      inst.receiveShadow = true
      this.scene.add(inst)
    }
    const ceil = new THREE.InstancedMesh(ceilGeo, new THREE.MeshStandardMaterial({ map: T.ceiling(), roughness: 1 }), all.length)
    all.forEach(([x, z], i) => {
      mat4.makeTranslation(x * CELL + CELL / 2, WALL_H, z * CELL + CELL / 2)
      ceil.setMatrixAt(i, mat4)
    })
    this.scene.add(ceil)

    // Cửa phòng: khung + cánh cửa có bản lề.
    for (const d of doorCells()) {
      if (d.ch === '5') continue
      const cx = d.cx * CELL + CELL / 2
      const cz = d.cz * CELL + CELL / 2
      // Hướng đi qua cửa: dọc trục X hay Z
      const alongX = roomAt(d.cx - 1, d.cz) !== null || isDoor(charAt(d.cx - 1, d.cz))
      const g = new THREE.Group()
      g.position.set(cx, 0, cz)
      g.rotation.y = alongX ? Math.PI / 2 : 0
      // Hai trụ và thanh ngang (chừa lối rộng 1,2 m)
      const frameMat = m('#2e2218')
      g.add(box(0.4, WALL_H, 0.3, wallMat, -0.8, WALL_H / 2, 0), box(0.4, WALL_H, 0.3, wallMat, 0.8, WALL_H / 2, 0))
      g.add(box(1.2, WALL_H - 2.2, 0.3, wallMat, 0, 2.2 + (WALL_H - 2.2) / 2, 0))
      g.add(box(0.06, 2.2, 0.34, frameMat, -0.6, 1.1, 0), box(0.06, 2.2, 0.34, frameMat, 0.6, 1.1, 0))
      const hinge = new THREE.Group()
      hinge.position.set(-0.58, 0, 0)
      const leaf = box(1.14, 2.15, 0.06, m(d.ch === '3' ? '#5a4632' : '#4a3424'), 0.57, 1.08, 0)
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), m('#b89a50', { rough: 0.3 }))
      knob.position.set(1.0, 1.05, 0.06)
      hinge.add(leaf, knob)
      g.add(hinge)
      g.userData.hinge = hinge
      this.scene.add(g)
      this.doors.set(d.ch, g)
    }

    // Vật tương tác
    for (const it of INTERACTABLES) {
      let obj: THREE.Object3D
      if (it.model === 'photo') obj = PROPS.photo(it.kind === 'photo' ? it.photo : 0)
      else if (it.model === 'scrawl') obj = this.scrawl(it)
      else obj = (PROPS[it.model] ?? PROPS.none)()
      obj.position.set(it.at[0] * CELL, 0, it.at[1] * CELL)
      if (it.wall) obj.rotation.y = ROT[it.wall]
      if (it.kind === 'flashlight') {
        const fl = PROPS.flashlightItem()
        fl.position.y = 0.6
        fl.name = 'flashItem'
        obj.add(fl)
      }
      this.scene.add(obj)
      this.props.set(it.id, obj)
      if (it.solid) this.solids.push({ x: it.at[0] * CELL, z: it.at[1] * CELL, r: it.solid })
    }

    // Đồ trang trí: bàn học sinh, đèn, giá áo.
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const d = PROPS.studentDesk()
        const x = (10.3 + c * 1.9) * CELL
        const z = (4.6 + r * 1.35) * CELL
        d.position.set(x, 0, z)
        this.scene.add(d)
        this.solids.push({ x, z: z + 0.2, r: 0.55 })
      }
    const rack = PROPS.coatRack()
    rack.position.set(19.4 * CELL, 0, 9.5 * CELL)
    this.scene.add(rack)

    // Trần sao dạ quang phòng ngủ
    const glowTex = T.ceilingGlow()
    this.glow = plane(5, 2.5, new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.05, depthWrite: false, fog: false }))
    this.glow.rotation.x = Math.PI / 2
    this.glow.position.set(3 * CELL, WALL_H - 0.02, 2.6 * CELL)
    this.scene.add(this.glow)

    // Đèn trong nhà
    for (const l of LAMPS) {
      const x = l.at[0] * CELL
      const z = l.at[1] * CELL
      const shade = PROPS.lamp()
      shade.position.set(x, 0, z)
      this.scene.add(shade)
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: l.color }))
      bulb.position.set(x, 2.35, z)
      const light = new THREE.PointLight(l.color, 5, l.radius * 2.4, 1.8)
      light.position.set(x, 2.3, z)
      this.scene.add(bulb, light)
      this.lamps.push({ light, bulb, x, z, radius: l.radius, base: 5, broken: false, flicker: 0 })
    }

    const board = this.props.get('bang_den')
    this.boardFace = (board?.getObjectByName('boardFace') as THREE.Mesh) ?? null
    this.syncDoors()
  }

  private scrawl(it: Interactable): THREE.Object3D {
    const g = new THREE.Group()
    const lines = it.id === 'chu_tuong' ? ['NÓ NGHE ĐƯỢC', 'TIẾNG CHÂN CHẠY', 'ĐI CHẬM. TRỐN VÀO TỦ.'] : ['TRONG GƯƠNG', 'MỌI THỨ ĐỀU NGƯỢC']
    const p = plane(1.7, 0.85, new THREE.MeshStandardMaterial({ map: T.scrawlTex(lines), transparent: true, roughness: 1 }), 0, 1.7, 0.02)
    g.add(p)
    return g
  }

  private syncDoors(): void {
    const open = useHorror.getState().open
    const key = JSON.stringify(open)
    if (key === this.lastOpen) return
    const wasOpen = this.lastOpen ? (JSON.parse(this.lastOpen) as Record<string, boolean>) : {}
    this.lastOpen = key
    for (const [ch, g] of this.doors) {
      const hinge = g.userData.hinge as THREE.Group
      hinge.userData.target = open[ch] ? -1.45 : 0
      if (open[ch] && !wasOpen[ch] && this.last) hAudio.creak()
      if (!this.last) hinge.rotation.y = hinge.userData.target
    }
  }

  // ------------------------------------------------------------------ điều khiển

  /** Nhấn E / nút tương tác. */
  interact(): void {
    const s = useHorror.getState()
    if (s.modal || s.screen !== 'play' || performance.now() < this.scareUntil) return
    if (s.hidden) {
      this.leaveHide()
      return
    }
    const it = this.focus
    if (!it) return
    hAudio.click()
    if (it.kind === 'hide') {
      if (it.id === 'tu_quan_ao' && s.fragments.length >= FRAGMENTS.length && !s.confronting) {
        hAudio.sob()
        useHorror.getState().startConfront()
        return
      }
      this.enterHide(it)
      return
    }
    if (it.kind === 'pickup') hAudio.pickup()
    if (it.kind === 'flashlight' && !s.hasFlashlight) hAudio.pickup()
    useHorror.getState().interact(it.id)
  }

  private enterHide(it: Interactable): void {
    this.hideReturn = { x: this.x, z: this.z, yaw: this.yaw }
    const rot = it.wall ? ROT[it.wall] : 0
    const fx = Math.sin(rot)
    const fz = Math.cos(rot)
    const under = it.model === 'bed'
    this.x = it.at[0] * CELL + (under ? 0 : fx * 0.05)
    this.z = it.at[1] * CELL + (under ? 0.3 : fz * 0.05)
    this.yaw = Math.atan2(-fx, -fz)
    this.pitch = under ? -0.05 : 0
    useHorror.getState().setHidden(it.id)
    useHorror.getState().say(under ? 'Bạn chui xuống gầm giường. Nhấn E để ra.' : 'Bạn nín thở trong tủ. Nhấn E để ra.')
    hAudio.creak()
  }

  private leaveHide(): void {
    const s = useHorror.getState()
    const it = INTERACTABLES.find((i) => i.id === s.hidden)
    const rot = it?.wall ? ROT[it.wall] : 0
    if (it) {
      this.x = it.at[0] * CELL + Math.sin(rot) * 0.9
      this.z = it.at[1] * CELL + Math.cos(rot) * 0.9
      if (it.model === 'bed') {
        this.x = this.hideReturn?.x ?? this.x
        this.z = this.hideReturn?.z ?? this.z
      }
    }
    const p = collide(this.x, this.z, RADIUS, s.open)
    this.x = p.x
    this.z = p.z
    s.setHidden(null)
    hAudio.creak()
  }

  private respawn(): void {
    const s = useHorror.getState()
    const cp = s.checkpoint
    this.x = cp?.x ?? 7
    this.z = cp?.z ?? 6.4
    this.yaw = cp?.yaw ?? Math.PI / 2
    this.pitch = 0
    this.hideReturn = null
    this.confrontProgress = 0
    this.lastRespawn = s.respawnKey
    this.lastSolved = s.solved.length
    for (const r of Object.keys(s.flags)) if (r.startsWith('visited:')) this.visited.add(r.slice(8) as RoomId)
    if (s.flags.entity_active) {
      this.entity.placeFar(this.x, this.z)
      this.entityMesh.root.visible = true
    } else {
      this.entity.state = 'dormant'
      this.entityMesh.root.visible = false
    }
  }

  private beginConfront(): void {
    this.entity.place(6.5 * CELL, 3.5 * CELL, 'confront')
    this.entityMesh.root.visible = true
    this.confrontProgress = 0
    hAudio.stinger()
    useHorror.getState().say('Nó đứng ở ngưỡng cửa. Đừng chạy. Soi đèn thẳng vào nó!')
  }

  // ------------------------------------------------------------------ vòng lặp

  private frame = (now: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    this.update(dt, now)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number, now: number): void {
    const s = useHorror.getState()
    if (s.respawnKey !== this.lastRespawn) this.respawn()
    this.syncDoors()
    for (const [, g] of this.doors) {
      const h = g.userData.hinge as THREE.Group
      h.rotation.y += ((h.userData.target ?? 0) - h.rotation.y) * Math.min(1, dt * 3)
    }
    const paused = !!s.modal || s.screen !== 'play' || now < this.scareUntil
    const sens = s.settings.sensitivity

    // Nhìn quanh
    if (!paused) {
      this.yaw -= this.input.lookDX * 0.0025 * sens
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - this.input.lookDY * 0.0025 * sens))
    }
    this.input.lookDX = 0
    this.input.lookDY = 0

    // Di chuyển
    let moving = false
    const canSprint = this.input.sprint && !s.exhausted && s.stamina > 1
    if (!paused && !s.hidden) {
      const f = this.input.forward
      const r = this.input.right
      const len = Math.hypot(f, r)
      if (len > 0.05) {
        moving = true
        const speed = (canSprint ? SPRINT : WALK) * Math.min(1, len)
        const dx = (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * r) / Math.max(1, len)
        const dz = (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * r) / Math.max(1, len)
        let nx = this.x + dx * speed * dt
        let nz = this.z + dz * speed * dt
        for (const o of this.solids) {
          const ddx = nx - o.x
          const ddz = nz - o.z
          const d = Math.hypot(ddx, ddz)
          const min = o.r + RADIUS
          if (d < min && d > 1e-4) {
            nx = o.x + (ddx / d) * min
            nz = o.z + (ddz / d) * min
          }
        }
        const p = collide(nx, nz, RADIUS, s.open)
        this.x = p.x
        this.z = p.z
        this.bob += dt * (canSprint ? 11 : 7.5)
        this.stepAcc += speed * dt
        if (this.stepAcc > (canSprint ? 1.6 : 1.2)) {
          this.stepAcc = 0
          hAudio.footstep(canSprint)
        }
      }
    }
    const sprinting = moving && canSprint

    // Camera
    const bobY = moving ? Math.sin(this.bob) * (sprinting ? 0.06 : 0.035) : 0
    const hideSpot = s.hidden ? INTERACTABLES.find((i) => i.id === s.hidden) : null
    const eye = hideSpot?.model === 'bed' ? 0.3 : EYE
    this.camera.position.set(this.x, eye + bobY, this.z)
    const sanityWobble = s.sanity < 35 ? Math.sin(now / 700) * (35 - s.sanity) * 0.0008 : 0
    this.camera.rotation.set(this.pitch, this.yaw, sanityWobble, 'YXZ')
    this.torch.visible = s.hasFlashlight && !s.hidden
    this.torch.position.y = -0.2 + bobY * 0.4

    // Phòng hiện tại + điểm lưu
    const [pcx, pcz] = toCell(this.x, this.z)
    const room = roomAt(pcx, pcz)
    if (!paused && room && !this.visited.has(room) && !s.hidden) {
      this.visited.add(room)
      s.setFlag('visited:' + room)
      if (room !== 'b') useHorror.getState().saveCheckpoint(this.x, this.z, this.yaw)
    }
    if (s.solved.length !== this.lastSolved) {
      this.lastSolved = s.solved.length
      useHorror.getState().saveCheckpoint(this.x, this.z, this.yaw)
    }

    // Kịch bản: lần đầu bước ra hành lang sau khi mở hộp đồ chơi
    if (!s.flags.intro_hall && s.solved.includes('toybox') && room === 'h' && !paused) {
      s.setFlag('intro_hall')
      this.introT = 0
      this.entity.place(7.5 * CELL, 8.5 * CELL, 'dormant')
      this.entityMesh.root.visible = true
      hAudio.stinger()
      this.lamps[1].flicker = 1.5
      useHorror.getState().say('Có thứ gì đó đứng ở cuối hành lang…')
    }
    if (this.introT >= 0) {
      this.introT += dt
      if (this.introT > 2.6) {
        this.introT = -1
        hAudio.lampBurst()
        this.entityMesh.root.visible = false
        this.entity.place(17.5 * CELL, 1.5 * CELL, 'patrol')
        useHorror.getState().setFlag('entity_active')
        setTimeout(() => {
          this.entityMesh.root.visible = true
        }, 6000)
      }
    }

    // Điện thoại reo trong phòng khách
    hAudio.ring(room === 'l' && !s.flags.phone_answered && !paused)

    // Thực thể
    const active = !!s.flags.entity_active || s.confronting
    let entityDist = Infinity
    let entityVisible = false
    if (active && this.entityMesh.root.visible && !paused) {
      const ev = this.entity.step(dt, {
        x: this.x,
        z: this.z,
        lightOn: s.lightOn,
        hidden: !!s.hidden,
        noise: playerNoise(moving, sprinting),
      })
      entityDist = Math.hypot(this.entity.x - this.x, this.entity.z - this.z)
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir)
      const to = new THREE.Vector3(this.entity.x - this.x, 0, this.entity.z - this.z).normalize()
      const facing = dir.x * to.x + dir.z * to.z
      entityVisible = facing > 0.45 && lineOfSight(this.x, this.z, this.entity.x, this.entity.z, s.open)
      if (ev.spotted) {
        hAudio.stinger()
        useHorror.getState().say('NÓ THẤY BẠN! Chạy đi — rồi trốn vào tủ!')
      }
      if (ev.step) {
        const vol = Math.max(0, 1 - entityDist / 18)
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
        hAudio.entityStep(vol, Math.max(-1, Math.min(1, right.dot(to))))
      }
      if (ev.caught) this.onCaught()

      // Đối mặt: giữ đèn soi thẳng vào nó
      if (s.confronting) {
        const aimed = s.lightOn && facing > 0.95 && entityDist < 14 && entityVisible
        if (aimed) {
          this.confrontProgress += dt
          this.entity.x += to.x * dt * 1.1
          this.entity.z += to.z * dt * 1.1
          const c = collide(this.entity.x, this.entity.z, 0.3, s.open)
          this.entity.x = c.x
          this.entity.z = c.z
        }
        if (this.confrontProgress >= 6) {
          hAudio.sob()
          useHorror.getState().finish('true')
        }
      }
    } else if (this.introT >= 0) {
      entityDist = Math.hypot(this.entity.x - this.x, this.entity.z - this.z)
    }
    const em = this.entityMesh
    em.root.position.set(this.entity.x, Math.sin(now / 400) * 0.03, this.entity.z)
    em.root.rotation.y = this.entity.state === 'confront' || this.introT >= 0 ? Math.atan2(this.x - this.entity.x, this.z - this.entity.z) : this.entity.yaw
    const chasing = this.entity.state === 'chase'
    em.armL.rotation.x = chasing ? -0.9 + Math.sin(now / 90) * 0.2 : Math.sin(now / 500) * 0.1
    em.armR.rotation.x = chasing ? -0.9 + Math.cos(now / 90) * 0.2 : Math.cos(now / 500) * 0.1
    em.head.rotation.z = Math.sin(now / 260) * 0.08 + (Math.random() < 0.02 ? 0.4 : 0)

    // Đèn nhà: chập chờn khi nó tới gần
    let inLit = false
    for (const l of this.lamps) {
      const dNear = Math.hypot(this.entity.x - l.x, this.entity.z - l.z)
      let k = l.broken ? 0 : 1
      if (!l.broken && active && dNear < 6) k = Math.random() < 0.35 ? 0.05 : 0.7
      if (l.flicker > 0) {
        l.flicker -= dt
        k = Math.random() < 0.5 ? 0 : 1
      } else if (Math.random() < 0.004) l.flicker = 0.15
      l.light.intensity = l.base * k
      ;(l.bulb.material as THREE.MeshBasicMaterial).color.setScalar(k > 0.3 ? 1 : 0.15)
      if (k > 0.3 && Math.hypot(this.x - l.x, this.z - l.z) < l.radius) inLit = true
    }

    // Chỉ số sinh tồn
    if (!paused) {
      useHorror.getState().tickTime(dt)
      const next = stepMeters(
        { battery: s.battery, sanity: s.sanity, stamina: s.stamina, exhausted: s.exhausted },
        { dt, lightOn: s.lightOn, inLit, hidden: !!s.hidden, sprinting, moving, entityDist, entityVisible },
      )
      s.setMeters(next)
      if (s.lightOn && !next.lightOn) useHorror.getState().say('Đèn pin tắt ngấm. Hết pin rồi…')
      if (next.sanity <= 0 && now > this.scareUntil) {
        this.cb.scare('faint')
        this.scareUntil = now + 1800
        setTimeout(() => {
          useHorror.getState().say('Mọi thứ tối sầm… bạn ngất đi vì sợ hãi.')
          useHorror.getState().caught()
        }, 1500)
      }
    }

    // Đèn pin: chập chờn khi pin yếu hoặc nó tới gần
    const weak = s.battery < 15
    const flick = (weak && Math.random() < 0.12) || (entityDist < 5 && Math.random() < 0.25)
    const on = s.lightOn && !s.hidden && !flick
    this.flashlight.intensity = on ? (weak ? 12 : 26) : 0
    ;(this.torch.getObjectByName('lens') as THREE.Mesh).visible = on
    this.eyeLight.intensity = s.hidden ? 0.15 : 0.35

    // Trần sao dạ quang: sáng rõ khi tắt đèn
    const glowTarget = on ? 0.03 : 0.95
    const gm = this.glow.material as THREE.MeshBasicMaterial
    gm.opacity += (glowTarget - gm.opacity) * Math.min(1, dt * 1.5)

    // Đèn pin trên tủ đầu giường biến mất khi đã nhặt
    const fi = this.props.get('den_pin')?.getObjectByName('flashItem')
    if (fi) fi.visible = !s.hasFlashlight
    for (const it of INTERACTABLES) {
      if (it.kind === 'pickup') {
        const o = this.props.get(it.id)
        if (o) o.visible = !s.flags['taken:' + it.id]
      }
    }

    // Búp bê luôn quay mặt theo bạn khi bạn không nhìn nó
    const doll = this.props.get('bup_be')?.getObjectByName('dollBody')
    if (doll && room === 'l') {
      const dp = this.props.get('bup_be')!.position
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir)
      const to = new THREE.Vector3(dp.x - this.x, 0, dp.z - this.z).normalize()
      if (dir.x * to.x + dir.z * to.z < 0.2) doll.rotation.y = Math.atan2(this.x - dp.x, this.z - dp.z)
    }

    // Bảng đen đổi chữ sau khi đọc bài kiểm tra
    if (this.boardFace && room === 'c' && s.notes.includes('n_bai_kiem_tra') && !s.flags.board_scare && !paused) {
      const bp = this.props.get('bang_den')!.position
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir)
      const to = new THREE.Vector3(bp.x - this.x, 1.7 - EYE, bp.z - this.z).normalize()
      if (dir.dot(to) > 0.9) this.boardLook += dt
      if (this.boardLook > 0.5) {
        s.setFlag('board_scare')
        this.boardScaryUntil = now + 2600
        hAudio.stinger()
        useHorror.getState().setMeters({ sanity: Math.max(0, s.sanity - 8), battery: s.battery, stamina: s.stamina, exhausted: s.exhausted, lightOn: s.lightOn })
      }
    }
    if (this.boardFace) {
      const mat = this.boardFace.material as THREE.MeshStandardMaterial
      const want = now < this.boardScaryUntil ? this.boardScary : this.boardNormal
      if (mat.map !== want) {
        mat.map = want
        mat.needsUpdate = true
      }
    }

    // Gương: sau khi nhìn gương xong, bóng nó lướt qua sau lưng
    if (s.flags.mirror_seen && !s.flags.mirror_scare && !s.modal) {
      s.setFlag('mirror_scare')
      this.cb.scare('mirror')
      hAudio.stinger()
      this.scareUntil = now + 900
    }

    // Ảo giác khi tinh thần thấp
    this.hallucinateT -= dt
    if (!paused && s.sanity < 30 && this.hallucinateT <= 0) {
      this.hallucinateT = 5 + Math.random() * 6
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir)
      const d = 4 + Math.random() * 3
      const hx = this.x + dir.x * d
      const hz = this.z + dir.z * d
      const [hcx, hcz] = toCell(hx, hz)
      if (roomAt(hcx, hcz) && lineOfSight(this.x, this.z, hx, hz, s.open)) {
        this.shadowFigure.root.position.set(hx, 0, hz)
        this.shadowFigure.root.rotation.y = Math.atan2(this.x - hx, this.z - hz)
        this.shadowFigure.root.visible = true
        hAudio.staticNoise(0.3, 0.12)
        setTimeout(() => (this.shadowFigure.root.visible = false), 280)
        this.cb.scare('flash')
      }
    }

    // Âm thanh + HUD
    const danger = Math.max(0, 1 - entityDist / 14)
    const bpm = heartRate(s.sanity, entityDist)
    hAudio.update(bpm, s.sanity, danger)
    this.focus = paused || s.hidden ? null : this.findFocus()
    this.hudTimer += dt
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0
      const prompt = s.hidden
        ? 'Ra khỏi chỗ trốn'
        : this.focus
          ? this.promptFor(this.focus)
          : null
      this.cb.hud({ bpm, prompt, confront: s.confronting ? this.confrontProgress / 6 : -1, danger, hiding: !!s.hidden })
    }
  }

  private onCaught(): void {
    const s = useHorror.getState()
    if (performance.now() < this.scareUntil) return
    this.scareUntil = performance.now() + 1600
    hAudio.scream()
    this.cb.scare('catch')
    setTimeout(() => {
      useHorror.getState().caught()
      if (s.confronting) this.entityMesh.root.visible = !!useHorror.getState().flags.entity_active
    }, 1400)
  }

  private promptFor(it: Interactable): string {
    const s = useHorror.getState()
    switch (it.kind) {
      case 'hide':
        return it.id === 'tu_quan_ao' && s.fragments.length >= FRAGMENTS.length ? 'Mở tủ quần áo' : it.label
      case 'door':
        return `${it.label} (khóa)`
      case 'flashlight':
        return s.hasFlashlight ? 'Tủ đầu giường' : 'Nhặt đèn pin'
      case 'pickup':
        return `Nhặt: ${it.label}`
      default:
        return it.label
    }
  }

  private findFocus(): Interactable | null {
    const s = useHorror.getState()
    const dir = new THREE.Vector3()
    this.camera.getWorldDirection(dir)
    let best: Interactable | null = null
    let bestScore = Infinity
    for (const it of INTERACTABLES) {
      if (it.kind === 'pickup' && s.flags['taken:' + it.id]) continue
      if (it.kind === 'door' && s.open[it.door]) continue
      const px = it.at[0] * CELL
      const pz = it.at[1] * CELL
      const d = Math.hypot(px - this.x, pz - this.z)
      if (d > REACH + (it.solid ?? 0)) continue
      const to = new THREE.Vector3(px - this.x, 0, pz - this.z).normalize()
      const hdot = (dir.x * to.x + dir.z * to.z) / Math.max(0.2, Math.hypot(dir.x, dir.z))
      if (hdot < 0.72) continue
      if (!lineOfSight(this.x, this.z, px, pz, s.open) && it.kind !== 'door') continue
      const score = (1 - hdot) * 3 + d * 0.3
      if (score < bestScore) {
        bestScore = score
        best = it
      }
    }
    return best
  }

  /** Vị trí người chơi (cho kiểm thử trình duyệt). */
  debugState() {
    return { x: this.x, z: this.z, yaw: this.yaw, entity: { x: this.entity.x, z: this.entity.z, state: this.entity.state } }
  }

  debugTeleport(x: number, z: number, yaw?: number): void {
    this.x = x
    this.z = z
    if (yaw !== undefined) this.yaw = yaw
  }
}
