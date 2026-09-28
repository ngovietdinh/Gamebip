import * as THREE from 'three'
import { CH1_PHOTOS } from './chapters/ch1'
import { NOTE_COLORS } from './chapters/ch2'
import { surface } from './gfx'
import * as T from './textures'

/**
 * Đồ đạc dựng từ hình khối (mặt trước hướng +Z). Dùng vật liệu PBR có vân để trông thật hơn.
 * userData trên các mesh con dùng cho hoạt cảnh: float (lơ lửng), sway (đung đưa), blink (nháy).
 */

const cache = new Map<string, THREE.MeshStandardMaterial>()
export function m(color: string, opts: { emissive?: string; ei?: number; rough?: number; metal?: number; map?: THREE.Texture } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.emissive}|${opts.ei}|${opts.rough}|${opts.metal}|${opts.map?.uuid}`
  let mat = cache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: opts.metal ?? 0,
      emissive: new THREE.Color(opts.emissive ?? '#000'),
      emissiveIntensity: opts.ei ?? 1,
    })
    if (opts.map) mat.map = opts.map
    cache.set(key, mat)
  }
  return mat
}

let woodMat: THREE.MeshStandardMaterial | null = null
let darkWoodMat: THREE.MeshStandardMaterial | null = null
export function wood(dark = false): THREE.MeshStandardMaterial {
  if (dark) {
    if (!darkWoodMat) {
      darkWoodMat = surface('wood', 256, { rough: 0.55, normal: 2 }).clone()
      darkWoodMat.color = new THREE.Color('#6a5a50')
    }
    return darkWoodMat
  }
  if (!woodMat) woodMat = surface('wood', 256, { rough: 0.6, normal: 2 })
  return woodMat
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 12): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function sphere(r: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 14): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  return mesh
}

export function plane(w: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  mesh.position.set(x, y, z)
  mesh.receiveShadow = true
  return mesh
}

const texCache = new Map<string, THREE.Texture>()
function tex(key: string, make: () => THREE.Texture): THREE.Texture {
  let t = texCache.get(key)
  if (!t) {
    t = make()
    texCache.set(key, t)
  }
  return t
}
const texMat = (key: string, make: () => THREE.Texture, opts: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ map: tex(key, make), roughness: 0.8, ...opts })

function paperOn(g: THREE.Group, x: number, y: number, z: number, rotX = -Math.PI / 2) {
  const p = plane(0.24, 0.3, texMat('paper', T.paperTex, { roughness: 1 }), x, y, z)
  p.rotation.x = rotX
  g.add(p)
}

function keypadOn(g: THREE.Group, x: number, y: number, z: number) {
  g.add(plane(0.14, 0.2, texMat('keypad', T.keypadTex, { emissive: new THREE.Color('#1a3a28'), roughness: 0.5 }), x, y, z))
}

const METAL = () => m('#8a8e90', { rough: 0.35, metal: 0.7 })
const WHITE = () => m('#dcdcd4', { rough: 0.4 })

function legs4(g: THREE.Group, w: number, d: number, h: number, mat: THREE.Material, r = 0.03) {
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(cyl(r, r, h, mat, x, h / 2, z, 6))
}

type Builder = (arg?: number) => THREE.Group
const G = () => new THREE.Group()

export const PROPS: Record<string, Builder> = {
  none: G,
  scrawl: G,
  // =============================================================== CHƯƠNG 1
  nightstand: () => {
    const g = G()
    g.add(box(0.5, 0.55, 0.45, wood(), 0, 0.275, 0))
    g.add(box(0.44, 0.14, 0.02, wood(true), 0, 0.4, 0.23), box(0.06, 0.03, 0.03, METAL(), 0, 0.4, 0.25))
    g.add(cyl(0.06, 0.08, 0.08, m('#8a6a4a'), 0.14, 0.59, -0.1), cyl(0.01, 0.01, 0.25, METAL(), 0.14, 0.75, -0.1, 6))
    return g
  },
  flashlightItem: () => {
    const g = G()
    const b = cyl(0.03, 0.035, 0.22, m('#2a2a2a', { rough: 0.4, metal: 0.4 }), 0, 0, 0, 10)
    b.rotation.z = Math.PI / 2
    const head = cyl(0.045, 0.035, 0.05, m('#555', { metal: 0.6, rough: 0.3 }), 0.13, 0, 0, 10)
    head.rotation.z = Math.PI / 2
    g.add(b, head)
    return g
  },
  bed: () => {
    const g = G()
    g.add(box(1.2, 0.3, 2.1, wood(true), 0, 0.3, 0))
    g.add(box(1.1, 0.2, 2.0, m('#c8c0b0', { rough: 1 }), 0, 0.55, 0))
    const blanket = box(1.14, 0.12, 1.35, m('#6c5a7a', { rough: 1 }), 0, 0.68, 0.3)
    blanket.rotation.z = 0.02
    g.add(blanket, box(0.62, 0.14, 0.36, m('#e0d8c8', { rough: 1 }), 0, 0.74, -0.74))
    g.add(box(1.24, 1.0, 0.08, wood(true), 0, 0.6, -1.05), box(1.24, 0.55, 0.06, wood(true), 0, 0.4, 1.05))
    for (const [x, z] of [[-0.56, -1], [0.56, -1], [-0.56, 1], [0.56, 1]]) g.add(box(0.07, 0.2, 0.07, wood(true), x, 0.1, z))
    return g
  },
  wardrobe: () => {
    const g = G()
    g.add(box(1.1, 2.1, 0.6, wood(true), 0, 1.05, 0))
    g.add(box(1.14, 0.08, 0.64, wood(true), 0, 2.12, 0))
    g.add(box(0.015, 1.9, 0.02, m('#0a0806'), 0, 1.05, 0.31))
    for (const x of [-0.08, 0.08]) g.add(box(0.03, 0.16, 0.03, METAL(), x, 1.1, 0.33))
    for (let i = 0; i < 6; i++) g.add(box(0.8, 0.02, 0.01, m('#0a0806'), 0, 1.5 + i * 0.07, 0.305))
    // Cánh tủ hé mở một chút
    const crack = box(0.02, 1.85, 0.02, m('#000'), 0.005, 1.05, 0.31)
    g.add(crack)
    return g
  },
  clock: () => {
    const g = G()
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), texMat('clock', T.clockFace, { roughness: 0.5 }))
    face.position.set(0, 2.1, 0.035)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.03, 8, 32), wood(true))
    rim.position.set(0, 2.1, 0.035)
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.5 }))
    glass.position.set(0, 2.1, 0.05)
    g.add(face, rim, glass)
    return g
  },
  desk: () => {
    const g = G()
    g.add(box(1.0, 0.05, 0.55, wood(), 0, 0.75, 0))
    legs4(g, 0.9, 0.45, 0.75, wood(), 0.025)
    g.add(box(0.35, 0.3, 0.5, wood(), 0.3, 0.55, 0))
    paperOn(g, 0.1, 0.78, 0.05)
    g.add(box(0.08, 0.12, 0.08, m('#8a2a2a'), -0.35, 0.84, -0.12), box(0.2, 0.04, 0.28, m('#2c4a7a'), -0.2, 0.795, -0.05))
    return g
  },
  toybox: () => {
    const g = G()
    g.add(box(0.8, 0.5, 0.55, m('#7a3f2e'), 0, 0.25, 0))
    g.add(box(0.84, 0.08, 0.59, m('#9a5a3e'), 0, 0.54, 0))
    for (const [x, c] of [[-0.25, '#e0c040'], [0, '#3a7ad0'], [0.25, '#d04040']] as const) g.add(box(0.14, 0.14, 0.02, m(c), x, 0.3, 0.28))
    keypadOn(g, 0.3, 0.42, 0.285)
    return g
  },
  battery: () => {
    const g = G()
    g.add(cyl(0.035, 0.035, 0.12, m('#c8a030', { emissive: '#3a2a00', ei: 0.7, metal: 0.4, rough: 0.4 }), 0, 0.06, 0, 10))
    g.add(cyl(0.012, 0.012, 0.02, METAL(), 0, 0.13, 0, 6))
    return g
  },
  bandage: () => {
    const g = G()
    g.add(cyl(0.07, 0.07, 0.09, m('#eeeae0', { emissive: '#333', ei: 0.5 }), 0, 0.045, 0, 14))
    return g
  },
  pills: () => {
    const g = G()
    g.add(cyl(0.045, 0.045, 0.12, m('#d0e4f0', { emissive: '#223', ei: 0.6 }), 0, 0.06, 0, 12))
    g.add(cyl(0.05, 0.05, 0.03, m('#e04040'), 0, 0.135, 0, 12))
    return g
  },
  photo: (i = 0) => {
    const g = G()
    g.add(box(0.42, 0.5, 0.04, wood(true), 0, 1.6, 0.02))
    g.add(plane(0.34, 0.42, texMat('photo' + i, () => T.photoTex(i), { roughness: 0.6 }), 0, 1.6, 0.045))
    g.userData.year = CH1_PHOTOS[i]?.year
    return g
  },
  table: () => {
    const g = G()
    g.add(box(1.0, 0.06, 0.6, wood(), 0, 0.45, 0))
    legs4(g, 0.84, 0.48, 0.45, wood(), 0.025)
    paperOn(g, 0, 0.485, 0)
    g.add(cyl(0.05, 0.04, 0.1, WHITE(), 0.3, 0.53, -0.1), cyl(0.12, 0.12, 0.01, m('#b0a890'), -0.25, 0.485, 0.1))
    return g
  },
  sofa: () => {
    const g = G()
    const fab = m('#5a3a3a', { rough: 1 })
    g.add(box(1.8, 0.42, 0.8, fab, 0, 0.21, 0))
    g.add(box(1.8, 0.62, 0.2, m('#4a2e2e', { rough: 1 }), 0, 0.62, -0.3))
    for (const x of [-0.85, 0.85]) g.add(box(0.16, 0.56, 0.8, m('#4a2e2e', { rough: 1 }), x, 0.34, 0))
    for (const x of [-0.42, 0.42]) g.add(box(0.8, 0.12, 0.6, m('#6a4545', { rough: 1 }), x, 0.48, 0.05))
    return g
  },
  phone: () => {
    const g = G()
    g.add(box(0.4, 0.7, 0.35, wood(), 0, 0.35, 0))
    g.add(box(0.22, 0.08, 0.18, m('#20201c', { rough: 0.25 }), 0, 0.74, 0))
    const recv = cyl(0.025, 0.025, 0.24, m('#20201c', { rough: 0.25 }), 0, 0.81, 0, 8)
    recv.rotation.z = Math.PI / 2
    g.add(recv)
    return g
  },
  safe: () => {
    const g = G()
    g.add(box(0.6, 0.7, 0.55, m('#3d4247', { rough: 0.35, metal: 0.6 }), 0, 0.35, 0))
    const dial = cyl(0.08, 0.08, 0.03, METAL(), 0.12, 0.42, 0.28, 20)
    dial.rotation.x = Math.PI / 2
    g.add(dial)
    keypadOn(g, -0.14, 0.42, 0.28)
    return g
  },
  doll: () => {
    const g = G()
    const body = G()
    body.add(cyl(0.08, 0.13, 0.26, m('#7a2a3a', { rough: 1 }), 0, 0.13, 0))
    body.add(sphere(0.09, m('#e8dcd0', { rough: 0.25 }), 0, 0.34, 0))
    for (const x of [-0.03, 0.03]) body.add(sphere(0.014, m('#050505'), x, 0.355, 0.08, 8))
    body.add(sphere(0.1, m('#3a2618', { rough: 1 }), 0, 0.38, -0.02).translateY(0))
    body.name = 'dollBody'
    g.add(box(0.36, 0.02, 0.36, wood(), 0, 0.01, 0), body)
    return g
  },
  blackboard: () => {
    const g = G()
    g.add(box(3.2, 1.3, 0.05, wood(true), 0, 1.7, 0.02))
    const b = plane(3.05, 1.15, texMat('board', () => T.blackboard(false), { roughness: 0.9 }), 0, 1.7, 0.05)
    b.name = 'boardFace'
    g.add(b, box(3.2, 0.05, 0.12, wood(true), 0, 1.03, 0.06))
    return g
  },
  teacherDesk: () => {
    const g = G()
    g.add(box(1.4, 0.75, 0.7, wood(), 0, 0.375, 0))
    g.add(box(0.5, 0.15, 0.02, wood(true), 0.3, 0.55, 0.36))
    keypadOn(g, -0.3, 0.55, 0.355)
    paperOn(g, -0.2, 0.755, 0)
    return g
  },
  studentDesk: () => {
    const g = G()
    const top = m('#7b6a4a', { rough: 0.6 })
    g.add(box(0.7, 0.04, 0.45, top, 0, 0.68, 0))
    legs4(g, 0.6, 0.36, 0.68, METAL(), 0.018)
    g.add(box(0.4, 0.04, 0.4, top, 0, 0.42, 0.48), box(0.4, 0.4, 0.04, top, 0, 0.64, 0.67))
    for (const [x, z] of [[-0.17, 0.3], [0.17, 0.3], [-0.17, 0.65], [0.17, 0.65]]) g.add(cyl(0.015, 0.015, 0.42, METAL(), x, 0.21, z, 6))
    return g
  },
  chairFacingWall: () => {
    const g = G()
    const top = m('#7b6a4a', { rough: 0.6 })
    g.add(box(0.4, 0.04, 0.4, top, 0, 0.42, 0), box(0.04, 0.4, 0.4, top, 0.2, 0.62, 0))
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) g.add(cyl(0.015, 0.015, 0.42, METAL(), x, 0.21, z, 6))
    paperOn(g, 0, 0.445, 0)
    return g
  },
  locker: () => {
    const g = G()
    g.add(box(0.9, 2.0, 0.5, m('#44545c', { rough: 0.45, metal: 0.5 }), 0, 1.0, 0))
    for (let i = 0; i < 4; i++) g.add(box(0.5, 0.02, 0.01, m('#111'), 0, 1.6 + i * 0.06, 0.255))
    g.add(box(0.02, 1.9, 0.01, m('#111'), 0, 1, 0.255))
    return g
  },
  mirror: () => {
    const g = G()
    g.add(box(0.75, 0.95, 0.03, m('#8a7a5a', { metal: 0.3 }), 0, 1.6, 0.015))
    g.add(plane(0.66, 0.84, texMat('mirror', () => T.mirrorTex('2519'), { roughness: 0.08, metalness: 0.6 }), 0, 1.6, 0.035))
    g.add(box(0.8, 0.12, 0.45, WHITE(), 0, 0.85, 0.22), cyl(0.02, 0.02, 0.15, METAL(), 0, 0.98, 0.1, 6))
    g.add(cyl(0.1, 0.06, 0.7, WHITE(), 0, 0.45, 0.2))
    return g
  },
  cabinet: () => {
    const g = G()
    g.add(box(0.55, 0.65, 0.2, WHITE(), 0, 1.55, 0.1))
    g.add(box(0.02, 0.6, 0.01, m('#888'), 0, 1.55, 0.205))
    keypadOn(g, 0.18, 1.55, 0.21)
    return g
  },
  bathtub: () => {
    const g = G()
    g.add(box(1.0, 0.55, 1.9, m('#dcdcd4', { rough: 0.2 }), 0, 0.275, 0))
    const water = plane(0.84, 1.7, new THREE.MeshStandardMaterial({ color: '#030405', roughness: 0.02, metalness: 0.8 }), 0, 0.5, 0)
    water.rotation.x = -Math.PI / 2
    g.add(water)
    return g
  },
  frontDoor: () => {
    const g = G()
    g.add(box(1.3, 2.3, 0.1, wood(true), 0, 1.15, 0.05))
    for (const y of [0.6, 1.6]) g.add(box(1.0, 0.7, 0.02, m('#3a2014'), 0, y, 0.11))
    g.add(cyl(0.04, 0.04, 0.1, m('#c9a44a', { rough: 0.25, metal: 0.8 }), 0.5, 1.1, 0.14, 10).rotateX(Math.PI / 2))
    keypadOn(g, 0.5, 1.4, 0.115)
    const glow = plane(1.2, 0.03, new THREE.MeshBasicMaterial({ color: '#fff0c0' }), 0, 0.02, 0.11)
    g.add(glow)
    return g
  },
  calendar: () => {
    const g = G()
    g.add(plane(0.3, 0.4, texMat('paper', T.paperTex, { roughness: 1 }), 0, 1.5, 0.02))
    g.add(box(0.3, 0.05, 0.02, m('#a02020'), 0, 1.72, 0.02))
    return g
  },
  lamp: () => {
    const g = G()
    g.add(cyl(0.008, 0.008, 0.5, m('#222'), 0, 2.75, 0, 4))
    g.add(cyl(0.08, 0.26, 0.2, m('#6a5a3a', { rough: 0.7 }), 0, 2.45, 0, 16))
    return g
  },
  tubeLamp: () => {
    const g = G()
    g.add(box(1.2, 0.06, 0.18, m('#c8c8c0'), 0, 2.94, 0))
    return g
  },
  coatRack: () => {
    const g = G()
    g.add(cyl(0.03, 0.03, 1.8, wood(true), 0, 0.9, 0, 8), cyl(0.2, 0.25, 0.04, wood(true), 0, 0.02, 0))
    const coat = box(0.5, 0.9, 0.16, m('#2a2a30', { rough: 1 }), 0.12, 1.25, 0.08)
    coat.userData.sway = 0.02
    g.add(coat)
    return g
  },
  rug: () => {
    const g = G()
    const r = plane(2.4, 1.6, m('#6a2e2a', { rough: 1 }), 0, 0.012, 0)
    r.rotation.x = -Math.PI / 2
    const b = plane(2.1, 1.3, m('#8a5a3a', { rough: 1 }), 0, 0.014, 0)
    b.rotation.x = -Math.PI / 2
    g.add(r, b)
    return g
  },
  runner: () => {
    const g = G()
    const r = plane(1.0, 6, m('#4a2226', { rough: 1 }), 0, 0.012, 0)
    r.rotation.x = -Math.PI / 2
    g.add(r)
    return g
  },
  teddy: () => {
    const g = G()
    const fur = m('#8a6a44', { rough: 1 })
    g.add(sphere(0.14, fur, 0, 0.82, 0), sphere(0.1, fur, 0, 1.0, 0.02), sphere(0.035, fur, -0.07, 1.08, 0), sphere(0.035, fur, 0.07, 1.08, 0))
    g.add(sphere(0.012, m('#000'), -0.03, 1.02, 0.09, 6), sphere(0.012, m('#000'), 0.03, 1.02, 0.09, 6))
    g.rotation.z = 0.5
    return g
  },
  bookshelf: () => {
    const g = G()
    g.add(box(1.0, 1.8, 0.32, wood(true), 0, 0.9, 0))
    const cols = ['#7a2a2a', '#2a4a6a', '#6a6a2a', '#3a5a3a', '#5a3a6a', '#8a6a3a']
    for (let sh = 0; sh < 4; sh++) {
      g.add(box(0.92, 0.02, 0.3, wood(), 0, 0.2 + sh * 0.42, 0.02))
      let x = -0.42
      while (x < 0.4) {
        const w = 0.04 + Math.random() * 0.04
        const h = 0.24 + Math.random() * 0.1
        const b = box(w, h, 0.22, m(cols[Math.floor(Math.random() * cols.length)], { rough: 0.9 }), x + w / 2, 0.21 + sh * 0.42 + h / 2, 0.04)
        b.rotation.z = Math.random() < 0.1 ? 0.3 : 0
        g.add(b)
        x += w + 0.005
      }
    }
    return g
  },
  toys: () => {
    const g = G()
    g.add(box(0.12, 0.12, 0.12, m('#d04040'), 0, 0.06, 0), box(0.1, 0.1, 0.1, m('#3a7ad0'), 0.15, 0.05, 0.1), box(0.1, 0.1, 0.1, m('#e0c040'), 0.07, 0.17, 0.03))
    const car = box(0.22, 0.08, 0.1, m('#2a8a4a', { rough: 0.3 }), -0.3, 0.06, 0.2)
    car.rotation.y = 0.6
    g.add(car)
    return g
  },
  frame: () => {
    const g = G()
    g.add(box(0.6, 0.45, 0.03, wood(true), 0, 1.7, 0.015))
    g.add(plane(0.5, 0.35, m('#2a2a26', { rough: 0.3 }), 0, 1.7, 0.035))
    return g
  },
  deadPlant: () => {
    const g = G()
    g.add(cyl(0.16, 0.12, 0.3, m('#7a4a2a'), 0, 0.15, 0))
    for (let i = 0; i < 6; i++) {
      const st = cyl(0.008, 0.012, 0.6, m('#3a2a1a'), 0, 0.5, 0, 4)
      st.rotation.set((Math.random() - 0.5) * 0.9, 0, (Math.random() - 0.5) * 0.9)
      g.add(st)
    }
    return g
  },
  tv: () => {
    const g = G()
    g.add(box(0.9, 0.5, 0.4, wood(true), 0, 0.25, 0))
    g.add(box(0.6, 0.5, 0.45, m('#1a1a1a', { rough: 0.4 }), 0, 0.75, 0))
    const screen = plane(0.48, 0.38, new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#7a8a9a'), emissiveIntensity: 0.25, roughness: 0.1 }), 0, 0.76, 0.231)
    screen.userData.blink = true
    g.add(screen)
    return g
  },
  globe: () => {
    const g = G()
    g.add(cyl(0.1, 0.12, 0.04, wood(true), 0, 0.8, 0), cyl(0.01, 0.01, 0.3, METAL(), 0, 0.95, 0, 6), sphere(0.15, m('#2a5a8a', { rough: 0.5 }), 0, 1.1, 0))
    g.add(box(0.5, 0.78, 0.4, wood(), 0, 0.39, 0))
    return g
  },
  toilet: () => {
    const g = G()
    g.add(cyl(0.2, 0.16, 0.4, WHITE(), 0, 0.2, 0), box(0.4, 0.4, 0.18, WHITE(), 0, 0.55, -0.25), box(0.42, 0.04, 0.46, WHITE(), 0, 0.42, 0))
    return g
  },
  shoeRack: () => {
    const g = G()
    g.add(box(0.9, 0.5, 0.3, wood(), 0, 0.25, 0))
    for (const x of [-0.25, 0.1]) g.add(box(0.12, 0.08, 0.26, m(x < 0 ? '#e0e0e0' : '#6a3a2a'), x, 0.54, 0))
    return g
  },
  // =============================================================== CHƯƠNG 2
  classBoard: () => {
    const g = G()
    g.add(box(3.0, 1.2, 0.05, wood(true), 0, 1.7, 0.02))
    g.add(plane(2.85, 1.07, texMat('classBoard', T.classBoardTex, { roughness: 0.95 }), 0, 1.7, 0.05))
    g.add(box(3.0, 0.05, 0.12, wood(true), 0, 1.08, 0.06))
    return g
  },
  poster: () => {
    const g = G()
    g.add(plane(0.55, 0.72, texMat('tkb', () => T.posterTex(['Tiết 1: Tiếng Việt', 'Tiết 2: Tiếng Anh', 'Tiết 3: Toán', '', 'Sáng thứ Hai'], 'THỜI KHÓA BIỂU'), { roughness: 1 }), 0, 1.6, 0.02))
    return g
  },
  stickyNote: () => {
    const g = G()
    g.add(plane(0.15, 0.15, m('#f0e070', { rough: 1 }), 0, 1.45, 0.03))
    return g
  },
  lockerRow: () => {
    const g = G()
    for (let i = 0; i < 4; i++) {
      const x = -1.35 + i * 0.9
      g.add(box(0.86, 1.9, 0.45, m(i % 2 ? '#3f6a78' : '#46707e', { rough: 0.4, metal: 0.5 }), x, 0.95, 0))
      for (let k = 0; k < 4; k++) g.add(box(0.4, 0.015, 0.01, m('#111'), x, 1.55 + k * 0.05, 0.23))
      g.add(box(0.03, 0.12, 0.03, METAL(), x + 0.3, 1.0, 0.24))
    }
    return g
  },
  locker17: () => {
    const g = G()
    g.add(box(0.86, 1.9, 0.45, m('#6a3a3a', { rough: 0.4, metal: 0.5 }), 0, 0.95, 0))
    for (let k = 0; k < 4; k++) g.add(box(0.4, 0.015, 0.01, m('#111'), 0, 1.55 + k * 0.05, 0.23))
    g.add(plane(0.2, 0.12, texMat('n17', () => T.labelTex('17', '#e8e2cc', '#222', 128, 64), {}), 0, 1.75, 0.231))
    keypadOn(g, 0.25, 1.05, 0.231)
    // Mẩu giấy thò ra khe tủ
    const p = plane(0.1, 0.06, m('#ddd', { rough: 1 }), -0.1, 1.2, 0.232)
    p.rotation.z = 0.3
    g.add(p)
    return g
  },
  janitorCloset: () => {
    const g = G()
    g.add(box(1.0, 2.1, 0.55, m('#5a6a5a', { rough: 0.6 }), 0, 1.05, 0))
    g.add(plane(0.4, 0.12, texMat('kho_choi', () => T.labelTex('KHO CHỔI', '#e8e2cc', '#333', 256, 64, 'bold 30px Arial'), {}), 0, 1.8, 0.28))
    return g
  },
  piano: () => {
    const g = G()
    const blk = m('#141210', { rough: 0.2, metal: 0.1 })
    g.add(box(1.5, 1.2, 0.6, blk, 0, 0.6, 0))
    g.add(box(1.5, 0.08, 0.35, blk, 0, 0.75, 0.45))
    for (let i = 0; i < 14; i++) {
      const key = box(0.095, 0.03, 0.3, m('#f2efe6', { rough: 0.3 }), -0.66 + i * 0.1, 0.8, 0.45)
      g.add(key)
      const c = NOTE_COLORS[i % 7]
      g.add(box(0.04, 0.005, 0.04, m(c, { emissive: c, ei: 0.25 }), -0.66 + i * 0.1, 0.817, 0.55))
    }
    for (const i of [0, 1, 3, 4, 5, 7, 8, 10, 11, 12]) g.add(box(0.05, 0.04, 0.18, blk, -0.61 + i * 0.1, 0.83, 0.38))
    g.add(plane(0.4, 0.3, texMat('sheet', T.sheetTex, { roughness: 1 }), 0, 1.35, 0.31))
    g.children[g.children.length - 1].rotation.x = -0.2
    return g
  },
  musicStand: () => {
    const g = G()
    g.add(cyl(0.01, 0.01, 1.1, METAL(), 0, 0.55, 0, 6), box(0.45, 0.32, 0.01, METAL(), 0, 1.2, 0))
    g.children[1].rotation.x = -0.3
    paperOn(g, 0, 1.21, 0.02, -0.3)
    return g
  },
  stall: () => {
    const g = G()
    g.add(box(0.9, 1.9, 0.04, m('#5a7a88', { rough: 0.5 }), 0, 1.0, 0.02))
    g.add(plane(0.8, 0.5, texMat('stallScrawl', () => T.scrawlTex(['AN ĐỒ NGỐC', '3 ĐIỂM'], '#222'), { transparent: true, roughness: 1 }), 0, 1.4, 0.045))
    return g
  },
  stallWall: () => {
    const g = G()
    for (const x of [-0.5, 0.5]) g.add(box(0.04, 1.9, 1.2, m('#5a7a88', { rough: 0.5 }), x, 1.0, 0))
    return g
  },
  sink: () => {
    const g = G()
    g.add(box(0.55, 0.18, 0.42, WHITE(), 0, 0.85, 0), cyl(0.05, 0.04, 0.7, WHITE(), 0, 0.4, -0.05), cyl(0.015, 0.015, 0.16, METAL(), 0, 1.0, -0.15, 6))
    return g
  },
  principalDesk: () => {
    const g = G()
    g.add(box(1.7, 0.78, 0.85, wood(true), 0, 0.39, 0))
    g.add(box(0.5, 0.05, 0.35, m('#1a1a1a', { rough: 0.3 }), -0.4, 0.8, -0.1))
    g.add(plane(0.35, 0.12, texMat('ht', () => T.labelTex('HIỆU TRƯỞNG', '#c9a44a', '#221', 256, 64, 'bold 28px Arial'), {}), 0, 0.84, 0.3).rotateX(-0.6))
    g.add(cyl(0.06, 0.08, 0.2, m('#d0d0c0'), 0.6, 0.88, -0.2))
    return g
  },
  intercom: () => {
    const g = G()
    g.add(box(0.35, 0.45, 0.1, m('#e0dcd0', { rough: 0.5 }), 0, 1.9, 0.05))
    for (let i = 0; i < 6; i++) g.add(box(0.25, 0.015, 0.01, m('#222'), 0, 1.8 + i * 0.035, 0.105))
    const led = box(0.03, 0.03, 0.02, m('#300', { emissive: '#ff2010', ei: 1.5 }), 0.12, 2.08, 0.1)
    led.userData.blink = true
    g.add(led)
    return g
  },
  scarf: () => {
    const g = G()
    const s = plane(0.6, 0.12, m('#b8141a', { rough: 1 }), 0, 0.012, 0)
    s.rotation.x = -Math.PI / 2
    s.rotation.z = 0.5
    const t = plane(0.35, 0.1, m('#9a1016', { rough: 1 }), 0.2, 0.014, 0.12)
    t.rotation.x = -Math.PI / 2
    t.rotation.z = -0.9
    g.add(s, t)
    return g
  },
  keyItem: () => {
    const g = G()
    const gold = m('#c9a44a', { rough: 0.25, metal: 0.8, emissive: '#3a2a00', ei: 0.5 })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), gold)
    ring.rotation.x = Math.PI / 2
    ring.position.set(-0.05, 0.012, 0)
    g.add(ring, box(0.1, 0.015, 0.02, gold, 0.03, 0.012, 0))
    return g
  },
  gymMats: () => {
    const g = G()
    for (let i = 0; i < 4; i++) {
      const mat = box(1.2, 0.12, 0.9, m(i % 2 ? '#2a4a8a' : '#3a5a9a', { rough: 1 }), (Math.random() - 0.5) * 0.1, 0.06 + i * 0.12, 0.2)
      mat.rotation.y = (Math.random() - 0.5) * 0.2
      g.add(mat)
    }
    g.add(box(1.1, 1.3, 0.12, m('#2a4a8a', { rough: 1 }), 0, 0.65, -0.5))
    return g
  },
  gymMatsStack: () => PROPS.gymMats(),
  balls: () => {
    const g = G()
    for (let i = 0; i < 5; i++) g.add(sphere(0.12, m(i % 2 ? '#c86a2a' : '#e0e0d8', { rough: 0.6 }), (Math.random() - 0.5) * 0.8, 0.12, (Math.random() - 0.5) * 0.8))
    return g
  },
  vaultBox: () => {
    const g = G()
    for (let i = 0; i < 4; i++) g.add(box(1.1 - i * 0.08, 0.22, 0.6, wood(), 0, 0.11 + i * 0.22, 0))
    g.add(box(0.95, 0.08, 0.5, m('#e8e0d0', { rough: 1 }), 0, 0.92, 0))
    return g
  },
  gate: () => {
    const g = G()
    const iron = m('#2a2c2e', { rough: 0.5, metal: 0.7 })
    for (let i = 0; i < 9; i++) g.add(box(0.04, 2.4, 0.04, iron, -0.8 + i * 0.2, 1.2, 0.1))
    for (const y of [0.3, 1.2, 2.2]) g.add(box(1.8, 0.06, 0.05, iron, 0, y, 0.1))
    g.add(box(0.18, 0.25, 0.1, m('#8a6a2a', { metal: 0.8, rough: 0.3 }), 0, 1.2, 0.18))
    g.add(plane(1.6, 2.2, new THREE.MeshBasicMaterial({ color: '#1a2230' }), 0, 1.15, 0.02))
    return g
  },
  teacherTable: () => {
    const g = G()
    g.add(box(1.2, 0.05, 0.6, wood(), 0, 0.76, 0))
    legs4(g, 1.1, 0.5, 0.76, wood(), 0.03)
    g.add(box(0.3, 0.06, 0.22, m('#ddd'), 0.3, 0.8, 0), box(0.05, 0.3, 0.05, m('#fff', { emissive: '#222' }), -0.4, 0.93, -0.1))
    return g
  },
  flag: () => {
    const g = G()
    const f = plane(0.6, 0.4, m('#c81a1a', { rough: 1, emissive: '#200' }), 0, 2.4, 0.03)
    g.add(f, plane(0.12, 0.12, m('#f0d020', { emissive: '#330' }), 0, 2.4, 0.035))
    return g
  },
  noticeBoard: () => {
    const g = G()
    g.add(box(1.2, 0.8, 0.03, m('#8a6a4a', { rough: 1 }), 0, 1.6, 0.015))
    for (let i = 0; i < 5; i++) {
      const p = plane(0.2 + Math.random() * 0.1, 0.25, m(['#eee', '#f0e070', '#e0f0ff'][i % 3], { rough: 1 }), -0.4 + i * 0.2, 1.55 + (Math.random() - 0.5) * 0.3, 0.035)
      p.rotation.z = (Math.random() - 0.5) * 0.3
      g.add(p)
    }
    return g
  },
  bench: () => {
    const g = G()
    g.add(box(1.6, 0.05, 0.35, wood(), 0, 0.45, 0))
    legs4(g, 1.4, 0.25, 0.45, METAL(), 0.02)
    return g
  },
  chairRow: () => {
    const g = G()
    for (let i = 0; i < 4; i++) {
      const c = PROPS.chairFacingWall()
      c.children.splice(c.children.length - 1, 1)
      c.position.x = -1.2 + i * 0.8
      c.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.3
      g.add(c)
    }
    return g
  },
  trophy: () => {
    const g = G()
    g.add(box(1.0, 1.4, 0.35, wood(true), 0, 0.7, 0))
    for (let i = 0; i < 3; i++) g.add(cyl(0.06, 0.03, 0.2, m('#c9a44a', { metal: 0.9, rough: 0.2 }), -0.3 + i * 0.3, 1.5, 0))
    return g
  },
  // =============================================================== CHƯƠNG 3
  whiteboard: () => {
    const g = G()
    g.add(box(1.4, 0.9, 0.03, m('#aaa', { metal: 0.5 }), 0, 1.6, 0.015))
    g.add(plane(1.32, 0.82, texMat('wb', T.whiteboardTex, { roughness: 0.3 }), 0, 1.6, 0.035))
    return g
  },
  receptionDesk: () => {
    const g = G()
    g.add(box(2.2, 1.05, 0.7, m('#c8ccc4', { rough: 0.5 }), 0, 0.525, 0))
    g.add(box(2.3, 0.05, 0.85, wood(), 0, 1.07, 0.05))
    g.add(box(0.45, 0.32, 0.05, m('#111', { rough: 0.3 }), -0.5, 1.28, -0.15))
    paperOn(g, 0.4, 1.1, 0.1)
    g.add(cyl(0.05, 0.05, 0.02, METAL(), 0.8, 1.1, 0.2))
    return g
  },
  fileCabinet: () => {
    const g = G()
    g.add(box(0.8, 1.35, 0.55, m('#8a9090', { rough: 0.4, metal: 0.6 }), 0, 0.675, 0))
    for (let i = 0; i < 4; i++) g.add(box(0.3, 0.03, 0.03, METAL(), 0, 0.25 + i * 0.32, 0.29))
    return g
  },
  elevator: () => {
    const g = G()
    const steel = m('#9aa0a4', { rough: 0.25, metal: 0.9 })
    g.add(box(1.8, 2.5, 0.12, m('#6a6e70', { metal: 0.6, rough: 0.4 }), 0, 1.25, 0.06))
    g.add(box(0.72, 2.2, 0.04, steel, -0.37, 1.1, 0.14), box(0.72, 2.2, 0.04, steel, 0.37, 1.1, 0.14))
    const panel = plane(0.3, 0.12, texMat('floor3', () => T.labelTex('3', '#100', '#f33', 128, 64, 'bold 50px monospace'), { emissive: new THREE.Color('#400') }), 0, 2.35, 0.13)
    panel.name = 'elevatorPanel'
    g.add(panel)
    const btn = box(0.08, 0.08, 0.03, m('#333', { emissive: '#000' }), 0.95, 1.2, 0.14)
    btn.name = 'elevatorBtn'
    g.add(btn)
    return g
  },
  hospitalBed: () => {
    const g = G()
    const frame = m('#b8bcc0', { rough: 0.35, metal: 0.6 })
    g.add(box(1.0, 0.1, 2.05, frame, 0, 0.55, 0))
    g.add(box(0.95, 0.16, 1.95, m('#dfe4e6', { rough: 1 }), 0, 0.68, 0))
    const sheet = box(0.98, 0.1, 1.3, m('#c8d4d8', { rough: 1 }), 0, 0.78, 0.3)
    sheet.rotation.x = 0.02
    g.add(sheet, box(0.6, 0.12, 0.35, WHITE(), 0, 0.82, -0.75))
    g.add(box(1.02, 0.7, 0.05, frame, 0, 0.85, -1.03), box(1.02, 0.45, 0.05, frame, 0, 0.72, 1.03))
    for (const [x, z] of [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]]) g.add(cyl(0.025, 0.025, 0.5, frame, x, 0.25, z, 6), sphere(0.04, m('#222'), x, 0.04, z, 6))
    return g
  },
  fuse: () => {
    const g = G()
    g.add(cyl(0.035, 0.035, 0.14, m('#e8e4d8', { rough: 0.3, emissive: '#221', ei: 0.6 }), 0, 0.05, 0, 10).rotateZ(Math.PI / 2))
    for (const x of [-0.08, 0.08]) g.add(cyl(0.038, 0.038, 0.025, METAL(), x, 0.05, 0, 10).rotateZ(Math.PI / 2))
    return g
  },
  xrayBox: () => {
    const g = G()
    g.add(box(0.9, 0.7, 0.08, m('#ddd', { rough: 0.4 }), 0, 1.6, 0.04))
    const film = plane(0.8, 0.6, new THREE.MeshStandardMaterial({ map: tex('xray', T.xrayTex), emissive: new THREE.Color('#cfe8ff'), emissiveMap: tex('xray', T.xrayTex), emissiveIntensity: 0.8 }), 0, 1.6, 0.085)
    film.userData.blink = true
    g.add(film)
    return g
  },
  logbook: () => {
    const g = G()
    g.add(box(0.8, 0.9, 0.5, m('#c8ccc4', { rough: 0.5 }), 0, 0.45, 0))
    g.add(box(0.3, 0.03, 0.22, m('#2a3a6a'), 0, 0.915, 0))
    paperOn(g, 0.05, 0.935, 0)
    return g
  },
  fusebox: () => {
    const g = G()
    g.add(box(1.1, 1.3, 0.25, m('#6a7070', { rough: 0.4, metal: 0.6 }), 0, 1.4, 0.125))
    for (let i = 0; i < 3; i++) {
      const slot = box(0.16, 0.3, 0.05, m('#111'), -0.3 + i * 0.3, 1.45, 0.26)
      slot.name = 'slot' + i
      g.add(slot)
    }
    g.add(box(0.12, 0.35, 0.08, m('#b01818'), 0.4, 1.0, 0.28))
    g.add(plane(0.5, 0.12, texMat('danger', () => T.labelTex('⚡ NGUY HIỂM', '#f0d020', '#111', 256, 64, 'bold 30px Arial'), {}), 0, 1.9, 0.255))
    const led = box(0.04, 0.04, 0.02, m('#300', { emissive: '#ff2010', ei: 1.4 }), -0.45, 1.9, 0.26)
    led.name = 'powerLed'
    g.add(led)
    return g
  },
  card: () => {
    const g = G()
    const c = plane(0.2, 0.14, m('#e8c8d0', { rough: 1 }), 0, 0.62, 0)
    c.rotation.x = -1.2
    g.add(c)
    return g
  },
  bedsideCabinet: () => {
    const g = G()
    g.add(box(0.45, 0.62, 0.45, m('#c8ccc4', { rough: 0.5 }), 0, 0.31, 0))
    g.add(box(0.4, 0.14, 0.02, m('#aab0b0'), 0, 0.45, 0.23))
    keypadOn(g, 0.12, 0.25, 0.228)
    return g
  },
  clipboard: () => {
    const g = G()
    g.add(box(0.22, 0.3, 0.01, m('#6a4a2a'), 0, 0.95, 0))
    paperOn(g, 0, 0.95, 0.008, 0)
    return g
  },
  curtain: () => {
    const g = G()
    const c = m('#8aa8a0', { rough: 1 })
    c.side = THREE.DoubleSide
    for (let i = 0; i < 6; i++) {
      const p = plane(0.32, 2.2, c, -0.8 + i * 0.3, 1.15, Math.sin(i * 1.3) * 0.06)
      p.rotation.y = (i % 2 ? 0.3 : -0.3)
      p.userData.sway = 0.03
      g.add(p)
    }
    g.add(cyl(0.01, 0.01, 1.9, METAL(), 0, 2.3, 0, 6).rotateZ(Math.PI / 2))
    return g
  },
  ivStand: () => {
    const g = G()
    g.add(cyl(0.012, 0.012, 1.9, METAL(), 0, 0.95, 0, 6), cyl(0.2, 0.2, 0.02, METAL(), 0, 0.03, 0))
    const bag = box(0.12, 0.2, 0.04, new THREE.MeshStandardMaterial({ color: '#c8e0e8', transparent: true, opacity: 0.6, roughness: 0.2 }), 0.08, 1.75, 0)
    g.add(bag, cyl(0.004, 0.004, 1.0, m('#ccc'), 0.08, 1.15, 0, 4))
    return g
  },
  monitor: () => {
    const g = G()
    g.add(cyl(0.015, 0.015, 1.2, METAL(), 0, 0.6, 0, 6), box(0.4, 0.3, 0.2, m('#2a2e30', { rough: 0.4 }), 0, 1.3, 0))
    const scr = plane(0.34, 0.22, new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#20ff60'), emissiveIntensity: 0.6, roughness: 0.1 }), 0, 1.3, 0.101)
    scr.name = 'monitorScreen'
    scr.userData.blink = true
    g.add(scr)
    return g
  },
  flowers: () => {
    const g = G()
    g.add(cyl(0.05, 0.04, 0.16, new THREE.MeshStandardMaterial({ color: '#a8c8d0', transparent: true, opacity: 0.6, roughness: 0.05 }), 0, 0.7, 0))
    for (let i = 0; i < 5; i++) {
      const st = cyl(0.004, 0.004, 0.25, m('#3a4a2a'), 0, 0.85, 0, 4)
      st.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5)
      g.add(st, sphere(0.03, m('#6a4a3a', { rough: 1 }), (Math.random() - 0.5) * 0.12, 0.97, (Math.random() - 0.5) * 0.12, 6))
    }
    return g
  },
  wheelchair: () => {
    const g = G()
    const f = METAL()
    for (const x of [-0.3, 0.3]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), m('#222', { rough: 0.6 }))
      wheel.position.set(x, 0.3, 0)
      wheel.rotation.y = Math.PI / 2
      g.add(wheel)
    }
    g.add(box(0.5, 0.05, 0.45, m('#2a3a4a', { rough: 1 }), 0, 0.5, 0), box(0.5, 0.5, 0.05, m('#2a3a4a', { rough: 1 }), 0, 0.75, -0.22))
    g.add(cyl(0.012, 0.012, 0.9, f, -0.25, 0.7, -0.24, 6), cyl(0.012, 0.012, 0.9, f, 0.25, 0.7, -0.24, 6))
    return g
  },
  gurney: () => {
    const g = G()
    g.add(box(0.7, 0.08, 1.9, METAL(), 0, 0.8, 0), box(0.68, 0.1, 1.85, m('#d8e0e0', { rough: 1 }), 0, 0.88, 0))
    // Tấm vải trùm như có người nằm bên dưới
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.2, 6, 12), m('#e4e8e8', { rough: 1 }))
    body.rotation.x = Math.PI / 2
    body.position.set(0, 1.02, 0)
    body.scale.set(1, 1, 0.55)
    g.add(body)
    legs4(g, 0.6, 1.7, 0.8, METAL(), 0.015)
    return g
  },
  medShelf: () => {
    const g = G()
    g.add(box(1.4, 1.9, 0.35, m('#d8dcd8', { rough: 0.5 }), 0, 0.95, 0))
    for (let s = 0; s < 4; s++)
      for (let i = 0; i < 8; i++)
        g.add(cyl(0.035, 0.035, 0.12 + Math.random() * 0.08, m(['#e8e8e0', '#b85a2a', '#6a8aa8', '#eee'][(i + s) % 4], { rough: 0.3 }), -0.55 + i * 0.16, 0.35 + s * 0.45, 0.08, 8))
    return g
  },
  xrayMachine: () => {
    const g = G()
    g.add(box(0.9, 0.8, 1.8, m('#dde0e0', { rough: 0.4 }), 0, 0.4, 0))
    g.add(cyl(0.05, 0.05, 2.2, METAL(), -0.6, 1.1, -0.8, 8), box(0.5, 0.4, 0.5, m('#c8ccd0', { rough: 0.4 }), -0.3, 2.0, -0.2))
    return g
  },
  generator: () => {
    const g = G()
    g.add(box(1.2, 1.1, 0.9, m('#5a6a4a', { rough: 0.5, metal: 0.5 }), 0, 0.55, 0))
    for (let i = 0; i < 5; i++) g.add(box(1.0, 0.03, 0.02, m('#222'), 0, 0.3 + i * 0.12, 0.46))
    g.add(cyl(0.08, 0.08, 1.6, METAL(), 0.45, 1.8, -0.2, 8))
    return g
  },
  pipes: () => {
    const g = G()
    for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 1.8, m('#6a5a4a', { metal: 0.6, rough: 0.5 }), -0.5 + i * 0.25, 1.7, 0.1, 8))
    return g
  },
  exitSign: () => {
    const g = G()
    const s = plane(0.5, 0.18, new THREE.MeshStandardMaterial({ map: tex('exit', () => T.labelTex('LỐI THOÁT ▸', '#0a4a1a', '#8aff9a', 256, 80, 'bold 32px Arial')), emissive: new THREE.Color('#1a8a3a'), emissiveIntensity: 0.9 }), 0, 2.5, 0.03)
    s.userData.blink = true
    g.add(s)
    return g
  },
  // =============================================================== CHƯƠNG 4
  memoryDoor: () => {
    const g = G()
    g.add(box(1.2, 2.3, 0.08, wood(true), 0, 1.15, 0.04))
    g.add(box(1.36, 0.1, 0.12, wood(true), 0, 2.35, 0.06))
    const glow = plane(1.1, 0.04, new THREE.MeshBasicMaterial({ color: '#ffd0a0' }), 0, 0.03, 0.09)
    glow.userData.blink = true
    g.add(glow, sphere(0.045, m('#c9a44a', { metal: 0.8, rough: 0.3 }), 0.45, 1.1, 0.12, 10))
    return g
  },
  giantWardrobe: () => {
    const g = G()
    const w = wood(true)
    g.add(box(4.4, 7.5, 2.2, w, 0, 3.75, 0))
    g.add(box(0.06, 7.0, 0.05, m('#000'), 0, 3.6, 1.11))
    for (let i = 0; i < 12; i++) g.add(box(3.2, 0.06, 0.04, m('#050403'), 0, 4.8 + i * 0.18, 1.1))
    // Khe cửa hé ra, bên trong có ánh sáng ấm
    g.add(plane(0.12, 6.8, new THREE.MeshBasicMaterial({ color: '#ffb070' }), 0, 3.6, 1.115))
    for (const x of [-0.25, 0.25]) g.add(box(0.12, 0.6, 0.12, METAL(), x, 3.6, 1.16))
    return g
  },
  floatingChair: () => {
    const g = PROPS.chairFacingWall()
    g.position.y = 0
    g.children.forEach((c) => (c.userData.float = 0.15))
    const outer = G()
    outer.add(g)
    g.position.y = 1.6
    g.rotation.set(0.4, 0.3, 0.6)
    g.userData.float = 0.2
    return outer
  },
  floatingBed: () => {
    const outer = G()
    const b = PROPS.bed()
    b.position.y = 1.4
    b.rotation.set(-0.3, 0.6, 0.2)
    b.userData.float = 0.12
    outer.add(b)
    return outer
  },
  floatingDesk: () => {
    const outer = G()
    const b = PROPS.desk()
    b.position.y = 1.2
    b.rotation.set(0.2, -0.4, -0.5)
    b.userData.float = 0.18
    outer.add(b)
    return outer
  },
  floatingClock: () => {
    const outer = G()
    const c = PROPS.clock()
    c.position.set(0, 0.2, 0)
    c.rotation.set(0, 0.8, 0.3)
    c.scale.setScalar(2.5)
    c.userData.float = 0.25
    outer.add(c)
    return outer
  },
}

// =============================================================== THỰC THỂ

export interface EntityRig {
  root: THREE.Group
  head: THREE.Mesh
  armL: THREE.Group
  armR: THREE.Group
  strips: THREE.Mesh[]
}

/** Kẻ Không Mặt: cao, gầy, áo choàng rách tả tơi, ngón tay dài, khuôn mặt trơn không ngũ quan. */
export function buildEntity(): EntityRig {
  const root = new THREE.Group()
  const cloak = new THREE.MeshStandardMaterial({ color: '#0a0a0c', roughness: 1, emissive: new THREE.Color('#040406'), side: THREE.DoubleSide })
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.0, 12, 1, true), cloak)
  body.position.y = 1.05
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.75, 10), cloak)
  torso.position.y = 1.95
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), cloak)
  shoulders.scale.set(1.2, 0.45, 0.8)
  shoulders.position.y = 2.28
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.3, 8), m('#b8b2a6', { rough: 0.6 }))
  neck.position.y = 2.45
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 28, 20),
    new THREE.MeshStandardMaterial({ map: tex('faceless', T.facelessTex), roughness: 0.35, emissive: new THREE.Color('#2a2826'), emissiveIntensity: 1 }),
  )
  head.scale.set(0.85, 1.32, 0.92)
  head.position.y = 2.7
  head.rotation.y = -Math.PI / 2
  // Dải vải rách quanh vạt áo
  const strips: THREE.Mesh[] = []
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.5 + Math.random() * 0.5), cloak)
    s.position.set(Math.sin(a) * 0.42, 0.18, Math.cos(a) * 0.42)
    s.rotation.y = a
    s.userData.phase = Math.random() * 6
    strips.push(s)
    root.add(s)
  }
  const skin = m('#b8b2a6', { rough: 0.6 })
  const mkArm = (side: number) => {
    const a = new THREE.Group()
    a.position.set(side * 0.24, 2.22, 0)
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.75, 6), cloak)
    upper.position.y = -0.37
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.7, 6), skin)
    fore.position.y = -1.05
    a.add(upper, fore)
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.28, 4), skin)
      finger.position.set((f - 1.5) * 0.02, -1.52, 0.01)
      finger.rotation.x = Math.PI + (f - 1.5) * 0.08
      a.add(finger)
    }
    a.rotation.z = side * 0.1
    return a
  }
  const armL = mkArm(-1)
  const armR = mkArm(1)
  root.add(body, torso, shoulders, neck, head, armL, armR)
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return { root, head, armL, armR, strips }
}

/** Đứa trẻ không mặt: áo trắng, quần xanh, khăn quàng đỏ, mặt trơn. */
export function buildShade(): THREE.Group {
  const g = new THREE.Group()
  const shirt = m('#d8d8d0', { rough: 1 })
  const pants = m('#1a2a4a', { rough: 1 })
  g.add(cyl(0.16, 0.19, 0.45, shirt, 0, 0.95, 0, 10))
  g.add(cyl(0.07, 0.06, 0.55, pants, -0.08, 0.45, 0, 6), cyl(0.07, 0.06, 0.55, pants, 0.08, 0.45, 0, 6))
  g.add(cyl(0.05, 0.045, 0.45, shirt, -0.21, 0.95, 0, 6), cyl(0.05, 0.045, 0.45, shirt, 0.21, 0.95, 0, 6))
  const scarf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3), m('#b8141a', { rough: 1, emissive: '#200' }))
  scarf.position.set(0, 1.08, 0.14)
  scarf.rotation.x = Math.PI
  g.add(scarf, cyl(0.11, 0.11, 0.05, m('#b8141a', { rough: 1 }), 0, 1.18, 0))
  const head = sphere(0.14, new THREE.MeshStandardMaterial({ map: tex('faceless', T.facelessTex), roughness: 0.4, emissive: new THREE.Color('#1a1816') }), 0, 1.36, 0, 20)
  head.rotation.y = -Math.PI / 2
  head.name = 'shadeHead'
  g.add(head, sphere(0.145, m('#0e0c0a', { rough: 1 }), 0, 1.42, -0.03, 12))
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return g
}
