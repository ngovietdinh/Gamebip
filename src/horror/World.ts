import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { hAudio } from './audio'
import { ceilingMaterial, dustMotes, flashlightBeam, floorMaterial, makePost, wallMaterial, type Post } from './gfx'
import { CELL, cellCenter, Level, toCell, WALL_H } from './level'
import { buildEntity, buildShade, box, m, plane, PROPS, type EntityRig } from './props'
import { CHAPTER_SCRIPTS } from './scripts'
import { Entity, heartRate, playerNoise, Shade, stepMeters } from './sim'
import { useHorror } from './store'
import * as T from './textures'
import type { ChapterDef, Interactable, Wall } from './types'

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

export type ScareKind = 'catch' | 'mirror' | 'faint' | 'flash' | 'shade'

export interface WorldCallbacks {
  hud: (h: WorldHud) => void
  scare: (kind: ScareKind) => void
}

const EYE = 1.6
const RADIUS = 0.3
const WALK = 2.7
const SPRINT = 4.9
const REACH = 2.2
export const ROT: Record<Wall, number> = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 }

export interface LampRt {
  light: THREE.PointLight
  bulb: THREE.Mesh
  x: number
  z: number
  radius: number
  base: number
  broken: boolean
  flicker: number
  needsPower: boolean
}

export interface ShadeRt {
  sim: Shade
  mesh: THREE.Group
}

export class HorrorWorld {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(72, 1, 0.05, 70)
  readonly level: Level
  flashlight: THREE.SpotLight
  private eyeLight = new THREE.PointLight('#8890b0', 0.35, 4, 2)
  private torch = new THREE.Group()
  private beam: THREE.Mesh
  private dust: THREE.Points
  private post: Post | null = null
  lamps: LampRt[] = []
  props = new Map<string, THREE.Object3D>()
  private doors = new Map<string, THREE.Object3D>()
  private solids: { x: number; z: number; r: number }[] = []
  private animated: THREE.Object3D[] = []
  entity: Entity
  rig: EntityRig = buildEntity()
  private phantom: EntityRig = buildEntity()
  shades: ShadeRt[] = []
  glow: THREE.Mesh | null = null
  boardFace: THREE.Mesh | null = null
  boardNormal: THREE.Texture | null = null
  boardScary: THREE.Texture | null = null
  private raf = 0
  private last = 0
  x = 0
  z = 0
  yaw = 0
  pitch = 0
  private bob = 0
  private stepAcc = 0
  private hideReturn: { x: number; z: number; yaw: number } | null = null
  private focus: Interactable | null = null
  private hudTimer = 0
  scareUntil = 0
  private visited = new Set<string>()
  private lastSolved = 0
  private lastRespawn = -1
  private lastOpen = ''
  confrontProgress = -1
  private hallucinateT = 3
  private hurt = 0
  private disposed = false
  /** Bộ nhớ riêng cho kịch bản chương. */
  script: Record<string, number | boolean | string> = {}
  entityVisible = false
  entityDist = Infinity
  room: string | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private input: HorrorInput,
    readonly cb: WorldCallbacks,
    readonly quality: 'low' | 'high',
    readonly chapter: ChapterDef,
  ) {
    this.level = new Level(chapter.map, chapter.doors, chapter.rooms)
    const high = quality === 'high'
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: high, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = high
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    const fogColor = new THREE.Color(chapter.mood === 'void' ? '#06040a' : '#020203')
    this.scene.background = fogColor
    this.scene.fog = new THREE.FogExp2(fogColor, chapter.fog)
    this.scene.add(new THREE.AmbientLight(chapter.ambient, 0.6))
    // Môi trường phản chiếu rất mờ: giúp kim loại, gạch men có ánh thật.
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    ;(this.scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.06

    this.flashlight = new THREE.SpotLight('#fff1d6', 26, 20, 0.5, 0.45, 1.6)
    this.flashlight.castShadow = high
    this.flashlight.shadow.mapSize.set(high ? 1024 : 512, high ? 1024 : 512)
    this.flashlight.shadow.camera.near = 0.2
    this.flashlight.shadow.bias = -0.0015
    this.flashlight.position.set(0.18, -0.2, 0)
    this.flashlight.target.position.set(0, 0, -5)
    this.camera.add(this.flashlight, this.flashlight.target, this.eyeLight)
    this.beam = flashlightBeam()
    this.beam.position.set(0.18, -0.2, -0.2)
    this.dust = dustMotes(high ? 320 : 120)
    this.camera.add(this.beam, this.dust)
    this.buildTorch()
    this.scene.add(this.camera)

    this.buildLevel()
    this.entity = new Entity(this.level, chapter.patrol, () => useHorror.getState().open)
    this.entity.speedMul = chapter.entity.speed ?? 1
    this.entity.sightMul = chapter.entity.sight ?? 1
    this.rig.root.visible = false
    this.phantom.root.visible = false
    this.phantom.head.material = new THREE.MeshBasicMaterial({ color: '#050505' })
    this.scene.add(this.rig.root, this.phantom.root)
    for (const [sx, sz] of chapter.shades ?? []) {
      const sim = new Shade(this.level, sx * CELL, sz * CELL)
      const mesh = buildShade()
      mesh.position.set(sim.x, 0, sim.z)
      this.scene.add(mesh)
      this.shades.push({ sim, mesh })
    }

    if (high) this.post = makePost(this.renderer, this.scene, this.camera)
    this.resize()
    this.respawn()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    hAudio.ring(false)
    hAudio.monitor(false)
    this.post?.composer.dispose()
    this.renderer.dispose()
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.post?.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.fov = w < h ? 80 : 72
    this.camera.updateProjectionMatrix()
  }

  // ------------------------------------------------------------------ tiện ích cho kịch bản
  say(t: string): void {
    useHorror.getState().say(t)
  }
  flag(k: string): boolean {
    return !!useHorror.getState().flags[k]
  }
  setFlag(k: string, v = true): void {
    useHorror.getState().setFlag(k, v)
  }
  /** Người chơi đang nhìn về phía điểm (x, z) với độ lệch cos >= minDot. */
  looksAt(x: number, z: number, minDot = 0.9, y = EYE): boolean {
    const dir = new THREE.Vector3()
    this.camera.getWorldDirection(dir)
    const to = new THREE.Vector3(x - this.x, y - EYE, z - this.z).normalize()
    return dir.dot(to) >= minDot
  }
  showEntity(v: boolean): void {
    this.rig.root.visible = v
  }
  phantomFlash(x: number, z: number, ms = 300): void {
    this.phantom.root.position.set(x, 0, z)
    this.phantom.root.rotation.y = Math.atan2(this.x - x, this.z - z)
    this.phantom.root.visible = true
    setTimeout(() => (this.phantom.root.visible = false), ms)
  }
  addSolid(x: number, z: number, r: number): void {
    this.solids.push({ x, z, r })
  }

  // ------------------------------------------------------------------ dựng cảnh

  private buildTorch(): void {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 12), m('#1a1b1e', { rough: 0.35, metal: 0.6 }))
    body.rotation.x = Math.PI / 2
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.08, 12), m('#0c0c0c', { rough: 1 }))
    grip.rotation.x = Math.PI / 2
    grip.position.z = 0.05
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.03, 0.06, 14), m('#2a2b2e', { rough: 0.3, metal: 0.8 }))
    head.rotation.x = Math.PI / 2
    head.position.z = -0.13
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), new THREE.MeshBasicMaterial({ color: '#fff7d8' }))
    lens.position.z = -0.161
    lens.rotation.y = Math.PI
    lens.name = 'lens'
    // Bàn tay cầm đèn
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), m('#b08a70', { rough: 0.7 }))
    hand.scale.set(1, 0.8, 1.6)
    hand.position.set(0.01, -0.03, 0.05)
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 10), m('#2a3440', { rough: 1 }))
    sleeve.rotation.x = Math.PI / 2 - 0.2
    sleeve.position.set(0.03, -0.07, 0.24)
    this.torch.add(body, grip, head, lens, hand, sleeve)
    this.torch.scale.setScalar(0.85)
    this.torch.position.set(0.2, -0.2, -0.45)
    this.torch.rotation.set(0.05, 0.1, 0)
    this.camera.add(this.torch)
  }

  private buildLevel(): void {
    const ch = this.chapter
    const L = this.level
    const size = this.quality === 'high' ? 512 : 256
    const mat4 = new THREE.Matrix4()
    const col = new THREE.Color()
    const roomOf = (x: number, z: number) => {
      const r = L.roomAt(x, z)
      if (r) return r
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = L.roomAt(x + dx, z + dz)
        if (n) return n
      }
      return null
    }

    // ---- Tường: mỗi phong cách một InstancedMesh
    const wallCells: Record<string, [number, number, string][]> = {}
    for (let z = 0; z < L.H; z++)
      for (let x = 0; x < L.W; x++) {
        const c = L.charAt(x, z)
        if (L.rooms[c] || L.doors[c]) continue
        let near: string | null = null
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const r = L.roomAt(x + dx, z + dz)
          if (r) {
            near = r
            break
          }
        }
        if (!near) continue
        const style = ch.rooms[near].wall
        ;(wallCells[style] ??= []).push([x, z, near])
      }
    const wallGeo = new THREE.BoxGeometry(CELL, WALL_H, CELL)
    for (const [style, cells] of Object.entries(wallCells)) {
      const inst = new THREE.InstancedMesh(wallGeo, wallMaterial(style as never, size), cells.length)
      cells.forEach(([x, z, r], i) => {
        mat4.makeTranslation(x * CELL + CELL / 2, WALL_H / 2, z * CELL + CELL / 2)
        inst.setMatrixAt(i, mat4)
        inst.setColorAt(i, col.set(ch.rooms[r].tint))
      })
      inst.castShadow = inst.receiveShadow = true
      this.scene.add(inst)
    }

    // ---- Sàn, trần
    const floorCells: Record<string, [number, number, string][]> = {}
    const ceilCells: Record<string, [number, number][]> = { tiles: [], plaster: [] }
    for (let z = 0; z < L.H; z++)
      for (let x = 0; x < L.W; x++) {
        const c = L.charAt(x, z)
        if (!L.rooms[c] && !L.doors[c]) continue
        const room = roomOf(x, z)
        if (!room) continue
        ;(floorCells[ch.rooms[room].floor] ??= []).push([x, z, room])
        const w = ch.rooms[room].wall
        if (w !== 'void') ceilCells[w === 'hospital' || w === 'school' ? 'tiles' : 'plaster'].push([x, z])
      }
    const floorGeo = new THREE.PlaneGeometry(CELL, CELL)
    floorGeo.rotateX(-Math.PI / 2)
    for (const [floor, cells] of Object.entries(floorCells)) {
      const inst = new THREE.InstancedMesh(floorGeo, floorMaterial(floor as never, size), cells.length)
      cells.forEach(([x, z, r], i) => {
        mat4.makeTranslation(x * CELL + CELL / 2, 0, z * CELL + CELL / 2)
        inst.setMatrixAt(i, mat4)
        inst.setColorAt(i, col.set(ch.rooms[r].tint).lerp(new THREE.Color('#ffffff'), 0.3))
      })
      inst.receiveShadow = true
      this.scene.add(inst)
    }
    const ceilGeo = new THREE.PlaneGeometry(CELL, CELL)
    ceilGeo.rotateX(Math.PI / 2)
    for (const [kind, cells] of Object.entries(ceilCells)) {
      if (!cells.length) continue
      const inst = new THREE.InstancedMesh(ceilGeo, ceilingMaterial(kind === 'tiles', size), cells.length)
      cells.forEach(([x, z], i) => {
        mat4.makeTranslation(x * CELL + CELL / 2, WALL_H, z * CELL + CELL / 2)
        inst.setMatrixAt(i, mat4)
      })
      inst.receiveShadow = true
      this.scene.add(inst)
    }

    // ---- Len chân tường và phào trần dọc mọi mép sàn giáp tường
    const edges: [number, number, number][] = [] // x, z, rotY
    for (let z = 0; z < L.H; z++)
      for (let x = 0; x < L.W; x++) {
        if (!L.rooms[L.charAt(x, z)]) continue
        const cx = x * CELL + CELL / 2
        const cz = z * CELL + CELL / 2
        const solid = (tx: number, tz: number) => !L.rooms[L.charAt(tx, tz)] && !L.doors[L.charAt(tx, tz)]
        if (solid(x, z - 1)) edges.push([cx, cz - CELL / 2 + 0.02, 0])
        if (solid(x, z + 1)) edges.push([cx, cz + CELL / 2 - 0.02, 0])
        if (solid(x - 1, z)) edges.push([cx - CELL / 2 + 0.02, cz, Math.PI / 2])
        if (solid(x + 1, z)) edges.push([cx + CELL / 2 - 0.02, cz, Math.PI / 2])
      }
    if (ch.mood !== 'void') {
      const trimGeo = new THREE.BoxGeometry(CELL, 0.14, 0.04)
      const crownGeo = new THREE.BoxGeometry(CELL, 0.1, 0.07)
      const trimMat = m(ch.mood === 'hospital' ? '#6a7a74' : ch.mood === 'school' ? '#3a4a40' : '#3a2a20', { rough: 0.6 })
      const base = new THREE.InstancedMesh(trimGeo, trimMat, edges.length)
      const crown = new THREE.InstancedMesh(crownGeo, m('#8a8478', { rough: 0.8 }), edges.length)
      const q = new THREE.Quaternion()
      edges.forEach(([x, z, r], i) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r)
        base.setMatrixAt(i, mat4.compose(new THREE.Vector3(x, 0.07, z), q, new THREE.Vector3(1, 1, 1)))
        crown.setMatrixAt(i, mat4.compose(new THREE.Vector3(x, WALL_H - 0.05, z), q, new THREE.Vector3(1, 1, 1)))
      })
      base.receiveShadow = true
      this.scene.add(base, crown)
    }

    // ---- Cửa phòng: khung + cánh cửa có bản lề
    for (const d of L.doorCells()) {
      const cx = d.cx * CELL + CELL / 2
      const cz = d.cz * CELL + CELL / 2
      const alongX = !!L.rooms[L.charAt(d.cx - 1, d.cz)] || !!L.rooms[L.charAt(d.cx + 1, d.cz)]
      const g = new THREE.Group()
      g.position.set(cx, 0, cz)
      g.rotation.y = alongX ? Math.PI / 2 : 0
      const near = roomOf(d.cx, d.cz)
      const wm = wallMaterial(near ? ch.rooms[near].wall : 'plaster', size)
      g.add(box(0.4, WALL_H, 0.3, wm, -0.8, WALL_H / 2, 0), box(0.4, WALL_H, 0.3, wm, 0.8, WALL_H / 2, 0))
      g.add(box(1.2, WALL_H - 2.2, 0.3, wm, 0, 2.2 + (WALL_H - 2.2) / 2, 0))
      const frameMat = m('#2e2218', { rough: 0.6 })
      g.add(box(0.07, 2.2, 0.34, frameMat, -0.6, 1.1, 0), box(0.07, 2.2, 0.34, frameMat, 0.6, 1.1, 0), box(1.27, 0.07, 0.34, frameMat, 0, 2.2, 0))
      const hinge = new THREE.Group()
      hinge.position.set(-0.57, 0, 0)
      const leafMat = ch.mood === 'hospital' ? m('#c8ccc8', { rough: 0.5 }) : ch.mood === 'school' ? m('#4a6a5a', { rough: 0.6 }) : m('#4a3424', { rough: 0.7 })
      const leaf = box(1.12, 2.15, 0.06, leafMat, 0.56, 1.08, 0)
      hinge.add(leaf)
      for (const s of [-1, 1]) hinge.add(box(0.8, 0.8, 0.01, m('#000', { rough: 1 }), 0.56, 1.45 - (s > 0 ? 0.9 : 0), s * 0.032).translateY(0))
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), m('#b89a50', { rough: 0.25, metal: 0.8 }))
      knob.position.set(1.0, 1.05, 0.06)
      hinge.add(knob)
      if (ch.mood === 'hospital') {
        const num = plane(0.3, 0.14, new THREE.MeshStandardMaterial({ map: T.labelTex(ch.doors[d.ch].name.replace('Cửa ', ''), '#1a3a5a', '#fff', 256, 96, 'bold 30px Arial') }), 0.56, 1.8, 0.035)
        hinge.add(num)
      }
      g.add(hinge)
      g.userData.hinge = hinge
      this.scene.add(g)
      this.doors.set(d.ch, g)
    }

    // ---- Cửa sổ: ánh trăng xanh, mưa chảy trên kính
    const rain = T.labelTex('', '#000', '#000', 4, 4)
    rain.dispose()
    for (const w of ch.windows ?? []) {
      const g = new THREE.Group()
      g.position.set(w.at[0] * CELL, 0, w.at[1] * CELL)
      g.rotation.y = ROT[w.wall]
      g.add(box(1.3, 1.1, 0.06, m('#2a2420', { rough: 0.7 }), 0, 1.75, 0.01))
      const glass = plane(1.16, 0.96, new THREE.MeshStandardMaterial({ color: '#0a1020', emissive: new THREE.Color('#3a5a8a'), emissiveIntensity: 0.55, roughness: 0.05, metalness: 0.3 }), 0, 1.75, 0.045)
      glass.userData.moon = true
      g.add(glass, box(0.04, 0.96, 0.05, m('#2a2420'), 0, 1.75, 0.05), box(1.16, 0.04, 0.05, m('#2a2420'), 0, 1.75, 0.05))
      g.add(box(1.4, 0.06, 0.18, m('#3a302a'), 0, 1.18, 0.08))
      if (ch.mood !== 'hospital') {
        const cm = m('#5a4038', { rough: 1 })
        cm.side = THREE.DoubleSide
        for (const s of [-1, 1]) {
          const c = plane(0.45, 1.6, cm, s * 0.75, 1.65, 0.12)
          c.userData.sway = 0.04
          g.add(c)
          this.animated.push(c)
        }
      }
      this.scene.add(g)
    }

    // ---- Vật tương tác
    for (const it of ch.interactables) {
      let obj: THREE.Object3D
      if (it.model === 'photo') obj = PROPS.photo(it.kind === 'photo' ? it.photo : 0)
      else if (it.model === 'scrawl') obj = this.scrawl(it)
      else obj = (PROPS[it.model] ?? PROPS.none)()
      obj.position.set(it.at[0] * CELL, 0, it.at[1] * CELL)
      if (it.wall) obj.rotation.y = ROT[it.wall]
      else if (it.rot) obj.rotation.y = it.rot
      if (it.kind === 'flashlight') {
        const fl = PROPS.flashlightItem()
        fl.position.y = 0.6
        fl.name = 'flashItem'
        obj.add(fl)
      }
      if (it.kind === 'pickup' || it.kind === 'memory') {
        // Vật nhặt được: ánh le lói nhẹ để dễ thấy trong bóng tối
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff4d0' }))
        glint.position.y = 0.25
        glint.userData.glint = true
        obj.add(glint)
        if (!['principalDesk'].includes(it.model)) obj.position.y = this.surfaceHeight(it.at)
      }
      this.scene.add(obj)
      this.props.set(it.id, obj)
      this.collectAnimated(obj)
      if (it.solid) this.solids.push({ x: it.at[0] * CELL, z: it.at[1] * CELL, r: it.solid })
    }

    // ---- Đồ trang trí
    for (const d of ch.decor ?? []) {
      const obj = (PROPS[d.model] ?? PROPS.none)()
      obj.position.set(d.at[0] * CELL, 0, d.at[1] * CELL)
      if (d.wall) obj.rotation.y = ROT[d.wall]
      else if (d.rot !== undefined) obj.rotation.y = d.rot
      if (d.scale) obj.scale.setScalar(d.scale)
      this.scene.add(obj)
      this.collectAnimated(obj)
      if (d.solid) this.solids.push({ x: d.at[0] * CELL, z: d.at[1] * CELL, r: d.solid })
    }

    // ---- Kịch bản dựng thêm (trần sao dạ quang, bảng đen…)
    CHAPTER_SCRIPTS[ch.id]?.build?.(this)

    // ---- Đèn trong nhà
    for (const l of ch.lamps) {
      const x = l.at[0] * CELL
      const z = l.at[1] * CELL
      const tube = ch.mood === 'hospital' || ch.mood === 'school'
      const shade = tube ? PROPS.tubeLamp() : PROPS.lamp()
      shade.position.set(x, 0, z)
      this.scene.add(shade)
      const bulb = tube
        ? new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.1), new THREE.MeshBasicMaterial({ color: l.color }))
        : new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: l.color }))
      bulb.position.set(x, tube ? 2.9 : 2.35, z)
      const light = new THREE.PointLight(l.color, 5, l.radius * 2.4, 1.8)
      light.position.set(x, tube ? 2.7 : 2.3, z)
      this.scene.add(bulb, light)
      this.lamps.push({ light, bulb, x, z, radius: l.radius, base: 5, broken: false, flicker: 0, needsPower: !!l.needsPower })
    }
    this.syncDoors()
  }

  /** Vật nhỏ đặt trên mặt bàn/giường gần đó thay vì dưới sàn. */
  private surfaceHeight(at: [number, number]): number {
    const near = [...this.chapter.interactables, ...(this.chapter.decor ?? []).map((d) => ({ ...d, id: '', kind: 'decor' }))].find(
      (o) => (o as { model: string }).model !== 'none' && Math.hypot(o.at[0] - at[0], o.at[1] - at[1]) < 0.35 && o.at !== at,
    ) as { model: string } | undefined
    if (!near) return 0
    const tops: Record<string, number> = { studentDesk: 0.7, desk: 0.78, table: 0.48, teacherDesk: 0.76, receptionDesk: 1.1, hospitalBed: 0.85, bedsideCabinet: 0.62 }
    return tops[near.model] ?? 0
  }

  private collectAnimated(obj: THREE.Object3D) {
    obj.traverse((o) => {
      if (o.userData.float || o.userData.sway || o.userData.blink || o.userData.glint) {
        o.userData.baseY = o.position.y
        o.userData.baseRX = o.rotation.x
        this.animated.push(o)
      }
    })
  }

  private scrawl(it: Interactable): THREE.Object3D {
    const g = new THREE.Group()
    const lines =
      it.id === 'chu_tuong'
        ? ['NÓ NGHE ĐƯỢC', 'TIẾNG CHÂN CHẠY', 'ĐI CHẬM. TRỐN VÀO TỦ.']
        : it.id === 'phan_tuong'
          ? ['CHÚNG CHỈ ĐI', 'KHI MÀY KHÔNG NHÌN', 'SOI ĐÈN VÀO CHÚNG']
          : ['TRONG GƯƠNG', 'MỌI THỨ ĐỀU NGƯỢC']
    const color = it.id === 'phan_tuong' ? '#e8e8e0' : '#8a1c14'
    g.add(plane(1.7, 0.85, new THREE.MeshStandardMaterial({ map: T.scrawlTex(lines, color), transparent: true, roughness: 1 }), 0, 1.7, 0.02))
    return g
  }

  private syncDoors(): void {
    const open = useHorror.getState().open
    const key = JSON.stringify(open)
    if (key === this.lastOpen) return
    const was = this.lastOpen ? (JSON.parse(this.lastOpen) as Record<string, boolean>) : {}
    this.lastOpen = key
    for (const [ch, g] of this.doors) {
      const hinge = g.userData.hinge as THREE.Group
      const isOpen = !this.level.doorLocked(ch) || !!open[ch]
      hinge.userData.target = isOpen ? -1.45 : 0
      if (isOpen !== (!this.level.doorLocked(ch) || !!was[ch]) && this.last) hAudio.creak()
      if (!this.last) hinge.rotation.y = hinge.userData.target
    }
  }

  // ------------------------------------------------------------------ điều khiển

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
      this.enterHide(it)
      return
    }
    if (it.kind === 'event') {
      CHAPTER_SCRIPTS[this.chapter.id]?.event?.(this, it.event)
      return
    }
    if (it.kind === 'pickup' || it.kind === 'memory' || (it.kind === 'flashlight' && !s.hasFlashlight)) hAudio.pickup()
    s.interact(it.id)
  }

  private enterHide(it: Interactable): void {
    this.hideReturn = { x: this.x, z: this.z, yaw: this.yaw }
    const rot = it.wall ? ROT[it.wall] : (it.rot ?? 0)
    const fx = Math.sin(rot)
    const fz = Math.cos(rot)
    const under = it.model === 'bed' || it.model === 'hospitalBed'
    this.x = it.at[0] * CELL + (under ? 0 : fx * 0.05)
    this.z = it.at[1] * CELL + (under ? 0.3 : fz * 0.05)
    this.yaw = Math.atan2(-fx, -fz)
    this.pitch = under ? -0.05 : 0
    useHorror.getState().setHidden(it.id)
    this.say(under ? 'Bạn chui xuống gầm giường. Nhấn E để ra.' : 'Bạn nín thở trốn kín. Nhấn E để ra.')
    hAudio.creak()
  }

  private leaveHide(): void {
    const s = useHorror.getState()
    const it = this.chapter.interactables.find((i) => i.id === s.hidden)
    const rot = it?.wall ? ROT[it.wall] : (it?.rot ?? 0)
    if (it) {
      this.x = it.at[0] * CELL + Math.sin(rot) * 0.9
      this.z = it.at[1] * CELL + Math.cos(rot) * 0.9
      if (it.model === 'bed' || it.model === 'hospitalBed' || !it.wall) {
        this.x = this.hideReturn?.x ?? this.x
        this.z = this.hideReturn?.z ?? this.z
      }
    }
    const p = this.level.collide(this.x, this.z, RADIUS, s.open)
    this.x = p.x
    this.z = p.z
    s.setHidden(null)
    hAudio.creak()
  }

  private respawn(): void {
    const s = useHorror.getState()
    const cp = s.checkpoint
    const onThisChapter = cp && cp.progress.chapter === this.chapter.id
    this.x = onThisChapter ? cp!.x : this.chapter.start.x * CELL
    this.z = onThisChapter ? cp!.z : this.chapter.start.z * CELL
    this.yaw = onThisChapter ? cp!.yaw : this.chapter.start.yaw
    this.pitch = 0
    this.hideReturn = null
    this.lastRespawn = s.respawnKey
    this.lastSolved = s.solved.length
    for (const k of Object.keys(s.flags)) if (k.startsWith(`visited:${this.chapter.id}:`)) this.visited.add(k.split(':')[2])
    for (const sh of this.shades) sh.sim.reset()
    const def = this.chapter.entity
    if (def.mode === 'patrol' && (!def.activateFlag || s.flags[def.activateFlag])) {
      this.entity.placeFar(this.x, this.z)
      this.showEntity(true)
    } else {
      this.entity.state = 'dormant'
      this.showEntity(false)
    }
    CHAPTER_SCRIPTS[this.chapter.id]?.respawn?.(this)
  }

  // ------------------------------------------------------------------ vòng lặp

  private frame = (now: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    this.update(dt, now)
    if (this.post) this.post.composer.render(dt)
    else this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number, now: number): void {
    const s = useHorror.getState()
    const ch = this.chapter
    if (s.respawnKey !== this.lastRespawn) this.respawn()
    this.syncDoors()
    for (const [, g] of this.doors) {
      const h = g.userData.hinge as THREE.Group
      h.rotation.y += ((h.userData.target ?? 0) - h.rotation.y) * Math.min(1, dt * 3)
    }
    const paused = !!s.modal || s.screen !== 'play' || now < this.scareUntil
    const sens = s.settings.sensitivity
    if (!paused) {
      this.yaw -= this.input.lookDX * 0.0025 * sens
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - this.input.lookDY * 0.0025 * sens))
    }
    this.input.lookDX = 0
    this.input.lookDY = 0

    // ---- Di chuyển
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
        const p = this.level.collide(nx, nz, RADIUS, s.open)
        this.x = p.x
        this.z = p.z
        this.bob += dt * (canSprint ? 11 : 7.5)
        this.stepAcc += speed * dt
        if (this.stepAcc > (canSprint ? 1.6 : 1.2)) {
          this.stepAcc = 0
          hAudio.footstep(canSprint, ch.mood)
        }
      }
    }
    const sprinting = moving && canSprint

    // ---- Camera
    const bobY = moving ? Math.sin(this.bob) * (sprinting ? 0.06 : 0.035) : 0
    const bobX = moving ? Math.cos(this.bob * 0.5) * (sprinting ? 0.04 : 0.02) : 0
    const hideSpot = s.hidden ? ch.interactables.find((i) => i.id === s.hidden) : null
    const eye = hideSpot && (hideSpot.model === 'bed' || hideSpot.model === 'hospitalBed') ? 0.3 : EYE
    this.camera.position.set(this.x + Math.cos(this.yaw) * bobX, eye + bobY, this.z - Math.sin(this.yaw) * bobX)
    const wobble = s.sanity < 35 ? Math.sin(now / 700) * (35 - s.sanity) * 0.0008 : 0
    this.camera.rotation.set(this.pitch, this.yaw, wobble + bobX * 0.3, 'YXZ')
    this.torch.visible = s.hasFlashlight && !s.hidden
    this.torch.position.y = -0.2 + bobY * 0.4

    // ---- Phòng hiện tại, điểm lưu
    const [pcx, pcz] = toCell(this.x, this.z)
    this.room = this.level.roomAt(pcx, pcz)
    if (!paused && this.room && !this.visited.has(this.room) && !s.hidden) {
      this.visited.add(this.room)
      s.setFlag(`visited:${ch.id}:${this.room}`)
      if (this.visited.size > 1) useHorror.getState().saveCheckpoint(this.x, this.z, this.yaw)
    }
    if (s.solved.length !== this.lastSolved) {
      this.lastSolved = s.solved.length
      useHorror.getState().saveCheckpoint(this.x, this.z, this.yaw)
    }

    // ---- Kịch bản chương
    CHAPTER_SCRIPTS[ch.id]?.update?.(this, dt, now, paused)

    // ---- Kẻ Không Mặt
    const def = ch.entity
    const enraged = !!(def.enrageFlag && s.flags[def.enrageFlag])
    this.entity.speedMul = (def.speed ?? 1) * (enraged ? 1.3 : 1)
    this.entity.sightMul = (def.sight ?? 1) * (enraged ? 1.35 : 1)
    const active = this.rig.root.visible && this.entity.state !== 'dormant'
    let entityDist = Infinity
    let entityVisible = false
    const dirV = new THREE.Vector3()
    this.camera.getWorldDirection(dirV)
    if (this.rig.root.visible) {
      entityDist = Math.hypot(this.entity.x - this.x, this.entity.z - this.z)
      const to = new THREE.Vector3(this.entity.x - this.x, 0, this.entity.z - this.z).normalize()
      const facing = dirV.x * to.x + dirV.z * to.z
      entityVisible = facing > 0.45 && this.level.lineOfSight(this.x, this.z, this.entity.x, this.entity.z, s.open)
    }
    if (active && !paused && this.entity.state !== 'confront') {
      const ev = this.entity.step(dt, { x: this.x, z: this.z, lightOn: s.lightOn, hidden: !!s.hidden, noise: playerNoise(moving, sprinting) })
      if (ev.spotted) {
        hAudio.stinger()
        this.say('NÓ THẤY BẠN! Chạy đi — rồi trốn!')
      }
      if (ev.step) {
        const to = new THREE.Vector3(this.entity.x - this.x, 0, this.entity.z - this.z).normalize()
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))
        hAudio.entityStep(Math.max(0, 1 - entityDist / 18), Math.max(-1, Math.min(1, right.dot(to))))
      }
      if (ev.caught) this.onCaught('catch')
    }
    this.entityDist = entityDist
    this.entityVisible = entityVisible
    this.animateEntity(now)

    // ---- Những đứa trẻ không mặt
    let shadeNear = Infinity
    for (const sh of this.shades) {
      const d = Math.hypot(sh.sim.x - this.x, sh.sim.z - this.z)
      const to = new THREE.Vector3(sh.sim.x - this.x, 0, sh.sim.z - this.z).normalize()
      const inView = (dirV.x * to.x + dirV.z * to.z) / Math.max(0.3, Math.hypot(dirV.x, dirV.z)) > 0.55
      const lit = s.lightOn || d < 3.2 || this.inLitAt(sh.sim.x, sh.sim.z)
      const seen = inView && lit && this.level.lineOfSight(this.x, this.z, sh.sim.x, sh.sim.z, s.open)
      if (!paused) {
        const wasMoving = sh.sim.moving
        const r = sh.sim.step(dt, this.x, this.z, seen, s.open, !!s.hidden)
        if (sh.sim.moving && !wasMoving && d < 10) hAudio.giggle(Math.max(0.05, 1 - d / 10))
        if (r.touched) this.onCaught('shade')
      }
      sh.mesh.position.set(sh.sim.x, 0, sh.sim.z)
      sh.mesh.rotation.y = sh.sim.yaw
      // Khi di chuyển: giật cục, đầu nghiêng
      const head = sh.mesh.getObjectByName('shadeHead')
      if (head) head.rotation.z = sh.sim.moving ? Math.sin(now / 60) * 0.25 : 0.15
      shadeNear = Math.min(shadeNear, d)
    }

    // ---- Đèn
    const power = !ch.powerFlag || !!s.flags[ch.powerFlag]
    let inLit = false
    for (const l of this.lamps) {
      const dNear = Math.hypot(this.entity.x - l.x, this.entity.z - l.z)
      let k = l.broken || (l.needsPower && !power) ? 0 : 1
      if (k && this.rig.root.visible && dNear < 6) k = Math.random() < 0.35 ? 0.05 : 0.7
      if (l.flicker > 0) {
        l.flicker -= dt
        k = Math.random() < 0.5 ? 0 : k
      } else if (k && Math.random() < 0.004) l.flicker = 0.15
      l.light.intensity = l.base * k
      ;(l.bulb.material as THREE.MeshBasicMaterial).color.setScalar(k > 0.3 ? 1 : 0.12)
      if (k > 0.3 && Math.hypot(this.x - l.x, this.z - l.z) < l.radius) inLit = true
    }

    // ---- Chỉ số sinh tồn
    if (!paused) {
      useHorror.getState().tickTime(dt)
      const next = stepMeters(
        { battery: s.battery, sanity: s.sanity, stamina: s.stamina, exhausted: s.exhausted },
        { dt, lightOn: s.lightOn, inLit, hidden: !!s.hidden, sprinting, moving, entityDist, entityVisible },
      )
      s.setMeters(next)
      if (s.lightOn && !next.lightOn) this.say('Đèn pin tắt ngấm. Hết pin rồi…')
      if (next.sanity <= 0 && now > this.scareUntil) {
        this.cb.scare('faint')
        this.scareUntil = now + 1800
        setTimeout(() => {
          this.say('Mọi thứ tối sầm… bạn ngất đi vì sợ hãi.')
          useHorror.getState().caught()
        }, 1500)
      }
    }

    // ---- Đèn pin
    const weak = s.battery < 15
    const flick = (weak && Math.random() < 0.12) || (entityDist < 5 && Math.random() < 0.25) || (shadeNear < 2.5 && Math.random() < 0.15)
    const on = s.lightOn && !s.hidden && !flick
    this.flashlight.intensity = on ? (weak ? 12 : 26) : 0
    ;(this.torch.getObjectByName('lens') as THREE.Mesh).visible = on
    ;(this.beam.material as THREE.ShaderMaterial).uniforms.intensity.value = on ? (weak ? 0.5 : 1) : 0
    ;(this.dust.material as THREE.ShaderMaterial).uniforms.intensity.value = on ? 1 : 0
    ;(this.dust.material as THREE.ShaderMaterial).uniforms.time.value = now / 1000
    this.eyeLight.intensity = s.hidden ? 0.15 : 0.35
    if (this.glow) {
      const gm = this.glow.material as THREE.MeshBasicMaterial
      gm.opacity += ((on ? 0.03 : 0.95) - gm.opacity) * Math.min(1, dt * 1.5)
    }

    // ---- Vật đã nhặt thì ẩn
    const fi = this.props.get('den_pin')?.getObjectByName('flashItem')
    if (fi) fi.visible = !s.hasFlashlight
    for (const it of ch.interactables) {
      if (it.kind === 'pickup') {
        const o = this.props.get(it.id)
        if (o && it.model !== 'principalDesk') o.visible = !s.flags['taken:' + it.id]
      }
      if (it.kind === 'memory') {
        const o = this.props.get(it.id)?.children.find((c) => c.userData.glint)
        if (o) o.visible = !s.fragments.includes(it.fragment)
      }
    }

    // ---- Hoạt cảnh đồ vật
    const t = now / 1000
    for (const o of this.animated) {
      if (o.userData.float) o.position.y = (o.userData.baseY ?? 0) + Math.sin(t * 0.8 + o.id) * o.userData.float
      if (o.userData.sway) o.rotation.x = (o.userData.baseRX ?? 0) + Math.sin(t * 1.3 + o.id) * o.userData.sway
      if (o.userData.blink) o.visible = Math.random() > 0.02
      if (o.userData.glint) o.scale.setScalar(0.6 + Math.abs(Math.sin(t * 3 + o.id)) * 0.8)
    }

    // ---- Ảo giác khi tinh thần thấp
    this.hallucinateT -= dt
    if (!paused && s.sanity < 30 && this.hallucinateT <= 0) {
      this.hallucinateT = 5 + Math.random() * 6
      const d = 4 + Math.random() * 3
      const hx = this.x + dirV.x * d
      const hz = this.z + dirV.z * d
      const [hcx, hcz] = toCell(hx, hz)
      if (this.level.roomAt(hcx, hcz) && this.level.lineOfSight(this.x, this.z, hx, hz, s.open)) {
        this.phantomFlash(hx, hz, 280)
        hAudio.staticNoise(0.3, 0.12)
        this.cb.scare('flash')
      }
    }

    // ---- Hậu kỳ, âm thanh, HUD
    const danger = Math.max(Math.max(0, 1 - entityDist / 14), Math.max(0, 1 - shadeNear / 6) * 0.7)
    this.hurt = Math.max(0, this.hurt - dt * 0.8)
    if (this.post) {
      const u = this.post.horror.uniforms
      u.time.value = t
      u.fear.value = Math.max(0, (60 - s.sanity) / 60)
      u.danger.value = danger
      u.hurt.value = this.hurt + (s.hp === 1 ? 0.25 : 0)
    }
    const bpm = heartRate(s.sanity, Math.min(entityDist, shadeNear + 4))
    hAudio.update(bpm, s.sanity, danger, ch.mood)
    this.focus = paused || s.hidden ? null : this.findFocus()
    this.hudTimer += dt
    if (this.hudTimer > 0.1) {
      this.hudTimer = 0
      const prompt = s.hidden ? 'Ra khỏi chỗ trốn' : this.focus ? this.promptFor(this.focus) : null
      this.cb.hud({ bpm, prompt, confront: this.confrontProgress, danger, hiding: !!s.hidden })
    }
  }

  inLitAt(x: number, z: number): boolean {
    return this.lamps.some((l) => l.light.intensity > 1.5 && Math.hypot(x - l.x, z - l.z) < l.radius)
  }

  private animateEntity(now: number): void {
    const r = this.rig
    r.root.position.set(this.entity.x, Math.sin(now / 400) * 0.03, this.entity.z)
    const faceP = this.entity.state === 'confront' || this.entity.state === 'dormant'
    r.root.rotation.y = faceP ? Math.atan2(this.x - this.entity.x, this.z - this.entity.z) : this.entity.yaw
    const chasing = this.entity.state === 'chase' || this.entity.state === 'confront'
    r.armL.rotation.x = chasing ? -0.9 + Math.sin(now / 90) * 0.2 : Math.sin(now / 500) * 0.1
    r.armR.rotation.x = chasing ? -0.9 + Math.cos(now / 90) * 0.2 : Math.cos(now / 500) * 0.1
    r.head.rotation.z = Math.sin(now / 260) * 0.08 + (Math.random() < 0.02 ? 0.45 : 0)
    for (const s of r.strips) s.rotation.x = Math.sin(now / 300 + s.userData.phase) * (chasing ? 0.5 : 0.2)
  }

  onCaught(kind: 'catch' | 'shade'): void {
    if (performance.now() < this.scareUntil) return
    this.scareUntil = performance.now() + 1600
    this.hurt = 1
    hAudio.scream()
    this.cb.scare(kind === 'shade' ? 'shade' : 'catch')
    setTimeout(() => useHorror.getState().caught(), 1400)
  }

  private promptFor(it: Interactable): string {
    const s = useHorror.getState()
    switch (it.kind) {
      case 'door':
        return `${it.label} (${this.chapter.doors[it.door]?.puzzle ? 'khóa số' : 'khóa'})`
      case 'flashlight':
        return s.hasFlashlight ? 'Tủ đầu giường' : 'Nhặt đèn pin'
      case 'pickup':
        return it.model === 'principalDesk' ? 'Lục ngăn bàn' : `Nhặt: ${it.label}`
      case 'memory':
        return `Chạm vào: ${it.label}`
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
    for (const it of this.chapter.interactables) {
      if (it.kind === 'pickup' && s.flags['taken:' + it.id]) continue
      if (it.kind === 'door' && (s.open[it.door] || !this.level.doorLocked(it.door))) continue
      if (it.requires && !s.flags[it.requires]) continue
      const px = it.at[0] * CELL
      const pz = it.at[1] * CELL
      const d = Math.hypot(px - this.x, pz - this.z)
      if (d > REACH + (it.solid ?? 0)) continue
      const to = new THREE.Vector3(px - this.x, 0, pz - this.z).normalize()
      const hdot = (dir.x * to.x + dir.z * to.z) / Math.max(0.2, Math.hypot(dir.x, dir.z))
      if (hdot < 0.72) continue
      if (it.kind !== 'door' && it.kind !== 'exit' && !this.level.lineOfSight(this.x, this.z, px, pz, s.open)) continue
      const score = (1 - hdot) * 3 + d * 0.3
      if (score < bestScore) {
        bestScore = score
        best = it
      }
    }
    return best
  }

  debugState() {
    return { x: this.x, z: this.z, yaw: this.yaw, room: this.room, entity: { x: this.entity.x, z: this.entity.z, state: this.entity.state, visible: this.rig.root.visible }, confront: this.confrontProgress }
  }

  debugTeleport(x: number, z: number, yaw?: number): void {
    this.x = x
    this.z = z
    if (yaw !== undefined) this.yaw = yaw
  }
}

export { cellCenter }
