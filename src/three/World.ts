import * as THREE from 'three'
import { paletteFor, type Palette } from '../art/palette'
import type { Registry } from '../engine/registry'
import type { RunState } from '../engine/state'
import { timeInfo } from '../engine/time'
import type { Hotspot, Scene } from '../engine/types'
import { buildEnvironment } from './environment'
import { isPortal, nearestInReach, placeDecor, placeHotspot, resolveMove, WORLD, type Placement } from './layout'
import { buildCharacter, buildObject, buildPlayer, mesh } from './models'
import { evalCondition } from '../engine/conditions'

export interface Input {
  /** Trục di chuyển từ bàn phím/joystick, -1..1. */
  moveX: number
  moveY: number
  /** Xoay camera cộng dồn (radian). */
  yawDelta: number
  pitchDelta: number
}

interface Entry {
  id: string
  hotspot: Hotspot
  place: Placement
  root: THREE.Object3D
  bob?: THREE.Group
  labelY: number
  label: HTMLDivElement
}

export interface WorldCallbacks {
  interact: (h: Hotspot) => void
  /** Hotspot đang trong tầm với (để hiện nút "Tương tác"). */
  focus: (h: Hotspot | null) => void
}

const VERB: Record<Hotspot['kind'], string> = { character: 'Nói chuyện', object: 'Xem', exit: 'Đi' }

/**
 * Thế giới 3D góc nhìn thứ ba. Dựng lại mỗi khi cảnh/buổi/trạng thái hiển thị đổi,
 * còn người chơi, camera và vòng lặp khung hình thì sống suốt phiên.
 */
export class World {
  readonly renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400)
  private content = new THREE.Group()
  private player = buildPlayer()
  private entries: Entry[] = []
  private water: THREE.Texture[] = []
  private hemi = new THREE.HemisphereLight('#ffffff', '#445', 1.2)
  private sunLight = new THREE.DirectionalLight('#ffffff', 1.4)
  private raf = 0
  private last = 0
  private yaw = 0
  private pitch = 0.32
  private walkPhase = 0
  private insidePortal: string | null = null
  private autoTarget: { x: number; z: number; id?: string } | null = null
  private focusId: string | null = null
  private paused = false
  private speaker: string | undefined
  private raycaster = new THREE.Raycaster()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private disposed = false

  constructor(
    private canvas: HTMLCanvasElement,
    private labels: HTMLDivElement,
    private reg: Registry,
    private input: Input,
    private cb: WorldCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.sunLight.position.set(20, 30, 10)
    this.scene.add(this.hemi, this.sunLight, this.content, this.player.root)
    this.placePlayerAtSpawn()
    this.resize()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.clearContent()
    this.renderer.dispose()
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // Màn hình dọc: mở rộng góc nhìn để thấy đủ hai bên.
    this.camera.fov = w < h ? 78 : 55
    this.camera.updateProjectionMatrix()
  }

  setPaused(p: boolean): void {
    this.paused = p
    if (p) this.autoTarget = null
  }

  setSpeaker(id: string | undefined): void {
    this.speaker = id
  }

  placePlayerAtSpawn(): void {
    this.player.root.position.set(WORLD.spawn.x, 0, WORLD.spawn.z)
    this.player.root.rotation.y = Math.PI
    this.yaw = 0
    this.autoTarget = null
    this.insidePortal = null
  }

  /** Dựng lại toàn bộ cảnh 3D. */
  build(scene: Scene, run: RunState, visible: Hotspot[]): void {
    this.clearContent()
    const t = timeInfo(run.actions)
    const p = paletteFor(t.tod)
    const env = buildEnvironment(scene.art, p)
    this.content.add(env.group)
    this.water = env.water
    this.applyLighting(p, env.indoor, t.segment, t.pastDeadline)

    // Đồ trang trí: mặt trời/mặt trăng đặt trên trời theo hướng, các vật khác đặt trên mặt đất.
    for (const d of scene.decor ?? []) {
      if (!evalCondition(d.if, run)) continue
      if (d.sprite === 'sun' || d.sprite === 'moon') {
        const west = d.x + d.w / 2 < 50
        const color = d.sprite === 'moon' ? '#eef0ff' : d.props?.evening ? '#ff9a4a' : '#ffe68a'
        const orb = mesh(new THREE.SphereGeometry(5, 20, 14), new THREE.MeshBasicMaterial({ color, fog: false }))
        orb.position.set(west ? -90 : 90, 38, -70)
        const halo = mesh(new THREE.SphereGeometry(9, 20, 14), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, fog: false, depthWrite: false }))
        halo.position.copy(orb.position)
        this.content.add(orb, halo)
        continue
      }
      if (d.sprite === 'compass') {
        this.content.add(this.compassSign())
        continue
      }
      const pos = placeDecor(d)
      const obj = buildObject(d.sprite, { p, run, reg: this.reg, props: d.props ?? {}, flip: d.flip })
      if (d.sprite === 'roadSide') {
        // Hai bên đường làng đặt gần nhau, ngay trước mặt, để dễ so sánh từng chi tiết.
        obj.position.set(Math.sign(pos.x) * 3.3, 0, -2.5)
      } else obj.position.set(pos.x, 0, Math.min(pos.z, 2))
      this.content.add(obj)
    }

    for (const h of visible) {
      const place = placeHotspot(h)
      let root: THREE.Object3D
      let bob: THREE.Group | undefined
      let labelY = 2.4
      if (h.character) {
        const ch = this.reg.characters[h.character]
        const fig = buildCharacter(ch?.sprite ?? 'stranger', ch?.color)
        root = fig.root
        bob = fig.bob
        labelY = fig.height + 0.35
        // Quay mặt về phía người chơi lúc xuất hiện.
        root.rotation.y = Math.atan2(WORLD.spawn.x - place.x, WORLD.spawn.z - place.z)
      } else {
        root = buildObject(h.sprite ?? '', { p, run, reg: this.reg, props: {}, flip: h.flip })
        const box = new THREE.Box3().setFromObject(root)
        labelY = Math.min(6, box.max.y) + 0.4
        if (isPortal(h)) labelY = h.sprite === 'exitDown' ? 1.4 : 3.6
      }
      root.position.set(place.x, 0, place.z)
      root.traverse((o) => (o.userData.hotspot = h.id))
      this.content.add(root)
      const label = document.createElement('div')
      label.className = `w3-label w3-${h.kind}`
      label.textContent = h.label
      this.labels.appendChild(label)
      this.entries.push({ id: h.id, hotspot: h, place, root, bob, labelY, label })
    }
    this.focusId = null
    this.cb.focus(null)
  }

  private compassSign(): THREE.Group {
    const g = new THREE.Group()
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), '#6d5a45', 0, 1.2, 0))
    const mk = (text: string, dir: number) => {
      const c = document.createElement('canvas')
      c.width = 256
      c.height = 64
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#e9dfc4'
      ctx.fillRect(0, 0, 256, 64)
      ctx.fillStyle = '#2a2016'
      ctx.font = '600 36px Be Vietnam Pro, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(text, 128, 46)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }))
      board.position.set(dir * 0.8, 2.1 - (dir > 0 ? 0 : 0.5), 0)
      return board
    }
    g.add(mk('Đông →', 1), mk('← Tây', -1))
    g.position.set(0, 0, -1)
    return g
  }

  private applyLighting(p: Palette, indoor: boolean, segment: number, day4: boolean): void {
    const night = p.tod === 'toi'
    this.hemi.color.set(p.light)
    this.hemi.groundColor.set(p.groundDark)
    this.hemi.intensity = indoor ? 0.95 : night ? 1.05 : 1.25
    this.sunLight.color.set(p.tod === 'chieu' ? '#ffc38a' : night ? '#9aa6e6' : '#fff4d6')
    this.sunLight.intensity = indoor ? 0.5 : night ? 0.5 : 1.3
    // Buổi chiều nắng từ phía tây, sáng/tối từ phía đông.
    this.sunLight.position.set(p.tod === 'chieu' ? -30 : 30, 25, 5)
    const fogColor = new THREE.Color(indoor ? (night ? '#1a1826' : '#2a2320') : p.fog)
    this.scene.background = fogColor
    // Sương dày dần theo thời gian trong game.
    const far = indoor ? 60 : Math.max(38, 110 - segment * 8 - (day4 ? 10 : 0))
    this.scene.fog = new THREE.Fog(fogColor, indoor ? 12 : 10, far)
  }

  private clearContent(): void {
    for (const e of this.entries) e.label.remove()
    this.entries = []
    this.content.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const material = m.material as THREE.Material | THREE.Material[] | undefined
      // Vật liệu dùng chung được cache trong models.ts nên chỉ giải phóng texture riêng.
      if (material && !Array.isArray(material) && (material as THREE.MeshBasicMaterial).map) {
        ;(material as THREE.MeshBasicMaterial).map?.dispose()
        material.dispose()
      }
    })
    this.content.clear()
    this.water = []
  }

  /** Bấm/chạm vào màn hình: nhắm vào vật thì tự đi tới và tương tác, bấm đất thì đi tới đó. */
  pointerTap(clientX: number, clientY: number): void {
    if (this.paused) return
    const r = this.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.entries.map((e) => e.root), true)
    const hit = hits.find((h) => h.object.userData.hotspot)
    let picked = hit ? this.entries.find((x) => x.id === hit.object.userData.hotspot) : undefined
    if (!picked) {
      // Chạm hụt một chút vẫn chọn được: lấy vật gần điểm chạm nhất trên màn hình (kể cả nhãn tên).
      const v = new THREE.Vector3()
      let best = 56
      for (const e of this.entries) {
        for (const y of [0.4, e.labelY / 2, e.labelY]) {
          v.set(e.place.x, y, e.place.z).project(this.camera)
          if (v.z >= 1) continue
          const sx = ((v.x + 1) / 2) * r.width + r.left
          const sy = ((1 - v.y) / 2) * r.height + r.top
          const d = Math.hypot(sx - clientX, sy - clientY)
          if (d < best) {
            best = d
            picked = e
          }
        }
      }
    }
    if (picked) {
      this.autoTarget = { x: picked.place.x, z: picked.place.z, id: picked.id }
      return
    }
    const pt = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.groundPlane, pt)) this.autoTarget = { x: pt.x, z: pt.z }
  }

  /** Tương tác với vật trong tầm (phím E / nút trên màn hình). */
  interactNearest(): void {
    if (this.paused) return
    const e = this.entries.find((x) => x.id === this.focusId)
    if (e) this.cb.interact(e.hotspot)
  }

  /** Vị trí người chơi (dùng cho kiểm thử). */
  get playerPos(): { x: number; z: number } {
    return { x: this.player.root.position.x, z: this.player.root.position.z }
  }

  private frame = (now: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.frame)
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.update(dt, now / 1000)
    this.renderer.render(this.scene, this.camera)
    this.updateLabels()
  }

  private update(dt: number, t: number): void {
    const pr = this.player.root
    // Camera
    this.yaw += this.input.yawDelta
    this.pitch = Math.max(0.08, Math.min(1.1, this.pitch + this.input.pitchDelta))
    this.input.yawDelta = 0
    this.input.pitchDelta = 0

    let mx = this.paused ? 0 : this.input.moveX
    let my = this.paused ? 0 : this.input.moveY
    if (mx !== 0 || my !== 0) this.autoTarget = null
    let moving = false
    let dirX = 0
    let dirZ = 0
    if (mx !== 0 || my !== 0) {
      const len = Math.min(1, Math.hypot(mx, my))
      const a = Math.atan2(-mx, my)
      // Tiến = hướng camera nhìn (-Z khi yaw = 0).
      dirX = Math.sin(this.yaw + a) * -1 * len
      dirZ = Math.cos(this.yaw + a) * -1 * len
      moving = true
    } else if (this.autoTarget && !this.paused) {
      const dx = this.autoTarget.x - pr.position.x
      const dz = this.autoTarget.z - pr.position.z
      const d = Math.hypot(dx, dz)
      const target = this.autoTarget.id ? this.entries.find((e) => e.id === this.autoTarget!.id) : undefined
      const stop = target ? target.place.radius + (target.place.portal ? 0 : 1.2) : 0.2
      if (d <= stop) {
        this.autoTarget = null
        if (target && !target.place.portal) this.cb.interact(target.hotspot)
      } else {
        dirX = dx / d
        dirZ = dz / d
        moving = true
        // Camera từ từ xoay theo hướng đi.
        const desired = Math.atan2(-dirX, -dirZ)
        this.yaw += angleDiff(desired, this.yaw) * Math.min(1, dt * 1.5)
      }
    }
    mx = my = 0

    if (moving) {
      const speed = 5.2
      const obstacles = this.entries.filter((e) => e.place.solid).map((e) => e.place)
      const next = resolveMove(pr.position.x + dirX * speed * dt, pr.position.z + dirZ * speed * dt, obstacles)
      pr.position.x = next.x
      pr.position.z = next.z
      const face = Math.atan2(dirX, dirZ)
      pr.rotation.y += angleDiff(face, pr.rotation.y) * Math.min(1, dt * 12)
      this.walkPhase += dt * 9
    } else {
      this.walkPhase *= 0.85
    }
    const swing = Math.sin(this.walkPhase) * (moving ? 0.6 : 0)
    if (this.player.legs) {
      this.player.legs[0].rotation.x = swing
      this.player.legs[1].rotation.x = -swing
    }
    if (this.player.arms) {
      this.player.arms[0].rotation.x = -swing * 0.8
      this.player.arms[1].rotation.x = swing * 0.8
    }
    this.player.bob.position.y = moving ? Math.abs(Math.sin(this.walkPhase)) * 0.06 : 0

    // Cổng: tự kích hoạt khi bước vào (chỉ khi vừa bước vào).
    if (!this.paused) {
      let inside: Entry | null = null
      for (const e of this.entries) {
        if (!e.place.portal) continue
        if (Math.hypot(pr.position.x - e.place.x, pr.position.z - e.place.z) < e.place.radius) inside = e
      }
      if (inside && this.insidePortal !== inside.id) {
        this.insidePortal = inside.id
        this.cb.interact(inside.hotspot)
      } else if (!inside) this.insidePortal = null

      const near = nearestInReach(pr.position.x, pr.position.z, this.entries)
      const id = near?.id ?? null
      if (id !== this.focusId) {
        this.focusId = id
        this.cb.focus(near?.hotspot ?? null)
      }
    }

    // Hoạt cảnh: nhân vật đang nói thì nhún, nhân vật khác thở nhẹ.
    for (const e of this.entries) {
      if (e.bob) {
        const talking = e.hotspot.character === this.speaker
        e.bob.position.y = talking ? Math.abs(Math.sin(t * 9)) * 0.08 : Math.sin(t * 2 + e.place.x) * 0.012
        if (talking) {
          // Quay về phía người chơi khi nói chuyện.
          const face = Math.atan2(pr.position.x - e.place.x, pr.position.z - e.place.z)
          e.root.rotation.y += angleDiff(face, e.root.rotation.y) * Math.min(1, dt * 6)
        }
      }
      e.root.traverse((o) => {
        if (o.userData.spin) o.rotation.y += dt * 2
        if (o.userData.float) o.position.y = 1.1 + Math.sin(t * 2) * 0.1
        if (o.userData.sway) o.rotation.x = Math.sin(t * 3) * 0.3
      })
    }
    for (const w of this.water) {
      if (w.userData.flowX) w.offset.x += dt * 0.08
      else w.offset.y += dt * 0.08
    }

    // Camera góc nhìn thứ ba bám theo sau lưng.
    const dist = 6
    const target = new THREE.Vector3(pr.position.x, 1.3, pr.position.z)
    const camPos = new THREE.Vector3(
      target.x + Math.sin(this.yaw) * dist * Math.cos(this.pitch),
      target.y + Math.sin(this.pitch) * dist + 0.6,
      target.z + Math.cos(this.yaw) * dist * Math.cos(this.pitch),
    )
    this.camera.position.lerp(camPos, Math.min(1, dt * 8))
    this.camera.lookAt(target)
  }

  private updateLabels(): void {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const pr = this.player.root.position
    const v = new THREE.Vector3()
    for (const e of this.entries) {
      v.set(e.place.x, e.labelY, e.place.z).project(this.camera)
      const dist = Math.hypot(pr.x - e.place.x, pr.z - e.place.z)
      const onScreen = v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1
      const show = onScreen && dist < 26 && !this.paused
      e.label.style.display = show ? 'block' : 'none'
      if (!show) continue
      e.label.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`
      const focus = e.id === this.focusId
      e.label.classList.toggle('focus', focus)
      e.label.textContent = focus ? `${VERB[e.hotspot.kind]}: ${e.hotspot.label}` : e.hotspot.label
      e.label.style.opacity = String(Math.max(0.35, 1 - dist / 30))
    }
  }
}

function angleDiff(a: number, b: number): number {
  let d = a - b
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

