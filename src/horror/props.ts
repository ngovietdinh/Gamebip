import * as THREE from 'three'
import { PHOTOS } from './content'
import * as T from './textures'

/** Đồ đạc low-poly dựng từ hình khối. Mặt trước hướng về +Z. */

const cache = new Map<string, THREE.MeshStandardMaterial>()
export function m(color: string, opts: { emissive?: string; ei?: number; rough?: number; map?: THREE.Texture } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.emissive}|${opts.ei}|${opts.rough}|${opts.map?.uuid}`
  let mat = cache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: 0,
      emissive: new THREE.Color(opts.emissive ?? '#000'),
      emissiveIntensity: opts.ei ?? 1,
    })
    if (opts.map) mat.map = opts.map
    cache.set(key, mat)
  }
  return mat
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function plane(w: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  mesh.position.set(x, y, z)
  return mesh
}

const WOOD = '#5a4330'
const DARKWOOD = '#3a2a1e'

const texCache = new Map<string, THREE.Texture>()
function tex(key: string, make: () => THREE.Texture): THREE.Texture {
  let t = texCache.get(key)
  if (!t) {
    t = make()
    texCache.set(key, t)
  }
  return t
}

function paperOn(g: THREE.Group, x: number, y: number, z: number, rotX = -Math.PI / 2) {
  const p = plane(0.24, 0.3, new THREE.MeshStandardMaterial({ map: tex('paper', T.paperTex), roughness: 1 }), x, y, z)
  p.rotation.x = rotX
  g.add(p)
}

function keypadOn(g: THREE.Group, x: number, y: number, z: number) {
  const k = plane(0.14, 0.2, new THREE.MeshStandardMaterial({ map: tex('keypad', T.keypadTex), emissive: new THREE.Color('#1a3a28'), roughness: 0.5 }), x, y, z)
  g.add(k)
}

type Builder = (arg?: number) => THREE.Group

export const PROPS: Record<string, Builder> = {
  none: () => new THREE.Group(),
  nightstand: () => {
    const g = new THREE.Group()
    g.add(box(0.5, 0.55, 0.45, m(WOOD), 0, 0.275, 0))
    g.add(box(0.4, 0.12, 0.02, m(DARKWOOD), 0, 0.4, 0.23))
    return g
  },
  flashlightItem: () => {
    const g = new THREE.Group()
    const b = cyl(0.03, 0.035, 0.22, m('#333', { rough: 0.4 }), 0, 0, 0, 8)
    b.rotation.z = Math.PI / 2
    const head = cyl(0.045, 0.035, 0.05, m('#555'), 0.13, 0, 0, 8)
    head.rotation.z = Math.PI / 2
    g.add(b, head)
    return g
  },
  bed: () => {
    const g = new THREE.Group()
    g.add(box(1.2, 0.35, 2.1, m(DARKWOOD), 0, 0.35, 0))
    g.add(box(1.1, 0.18, 2.0, m('#b9b2a3'), 0, 0.6, 0))
    g.add(box(1.12, 0.14, 1.3, m('#6c5a7a'), 0, 0.72, 0.3))
    g.add(box(0.6, 0.14, 0.35, m('#ddd6c8'), 0, 0.76, -0.75))
    g.add(box(1.2, 0.9, 0.08, m(DARKWOOD), 0, 0.6, -1.05))
    for (const [x, z] of [[-0.55, -1], [0.55, -1], [-0.55, 1], [0.55, 1]]) g.add(box(0.08, 0.2, 0.08, m(DARKWOOD), x, 0.1, z))
    return g
  },
  wardrobe: () => {
    const g = new THREE.Group()
    g.add(box(1.1, 2.1, 0.6, m(DARKWOOD), 0, 1.05, 0))
    g.add(box(0.02, 1.9, 0.02, m('#111'), 0, 1.05, 0.31))
    for (const x of [-0.08, 0.08]) g.add(box(0.03, 0.14, 0.03, m('#a98'), x, 1.1, 0.33))
    // Khe thông gió
    for (let i = 0; i < 5; i++) g.add(box(0.8, 0.02, 0.01, m('#0a0806'), 0, 1.5 + i * 0.07, 0.305))
    return g
  },
  clock: () => {
    const g = new THREE.Group()
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshStandardMaterial({ map: tex('clock', T.clockFace), roughness: 0.6 }))
    face.position.set(0, 2.1, 0.03)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 6, 24), m(DARKWOOD))
    rim.position.set(0, 2.1, 0.03)
    g.add(face, rim)
    return g
  },
  desk: () => {
    const g = new THREE.Group()
    g.add(box(1.0, 0.05, 0.55, m(WOOD), 0, 0.75, 0))
    for (const [x, z] of [[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]]) g.add(box(0.05, 0.75, 0.05, m(WOOD), x, 0.375, z))
    paperOn(g, 0.1, 0.78, 0.05)
    g.add(box(0.08, 0.1, 0.08, m('#8a2a2a'), -0.3, 0.83, -0.1))
    return g
  },
  toybox: () => {
    const g = new THREE.Group()
    g.add(box(0.8, 0.5, 0.55, m('#7a3f2e'), 0, 0.25, 0))
    g.add(box(0.84, 0.08, 0.59, m('#9a5a3e'), 0, 0.54, 0))
    g.add(box(0.2, 0.2, 0.02, m('#e0c040'), -0.2, 0.3, 0.28))
    keypadOn(g, 0.2, 0.3, 0.285)
    return g
  },
  scrawl: () => new THREE.Group(),
  battery: () => {
    const g = new THREE.Group()
    g.add(cyl(0.035, 0.035, 0.12, m('#c8a030', { emissive: '#3a2a00', ei: 0.6 }), 0, 0.06, 0, 8))
    g.add(cyl(0.012, 0.012, 0.02, m('#ccc'), 0, 0.13, 0, 6))
    return g
  },
  bandage: () => {
    const g = new THREE.Group()
    const r = cyl(0.07, 0.07, 0.09, m('#eeeae0', { emissive: '#333', ei: 0.4 }), 0, 0.045, 0, 12)
    g.add(r)
    return g
  },
  pills: () => {
    const g = new THREE.Group()
    g.add(cyl(0.045, 0.045, 0.12, m('#d0e4f0', { emissive: '#223', ei: 0.5 }), 0, 0.06, 0, 10))
    g.add(cyl(0.05, 0.05, 0.03, m('#e04040'), 0, 0.135, 0, 10))
    return g
  },
  photo: (i = 0) => {
    const g = new THREE.Group()
    const frame = box(0.42, 0.5, 0.04, m(DARKWOOD), 0, 1.6, 0.02)
    const pic = plane(0.34, 0.42, new THREE.MeshStandardMaterial({ map: tex('photo' + i, () => T.photoTex(i)), roughness: 0.7 }), 0, 1.6, 0.045)
    g.add(frame, pic)
    g.userData.year = PHOTOS[i]?.year
    return g
  },
  table: () => {
    const g = new THREE.Group()
    g.add(box(1.0, 0.06, 0.6, m(WOOD), 0, 0.45, 0))
    for (const [x, z] of [[-0.42, -0.24], [0.42, -0.24], [-0.42, 0.24], [0.42, 0.24]]) g.add(box(0.05, 0.45, 0.05, m(WOOD), x, 0.225, z))
    paperOn(g, 0, 0.485, 0)
    g.add(cyl(0.05, 0.04, 0.1, m('#ddd'), 0.3, 0.53, -0.1))
    return g
  },
  sofa: () => {
    const g = new THREE.Group()
    g.add(box(1.8, 0.42, 0.8, m('#5a3a3a'), 0, 0.21, 0))
    g.add(box(1.8, 0.6, 0.2, m('#4a2e2e'), 0, 0.6, -0.3))
    for (const x of [-0.85, 0.85]) g.add(box(0.15, 0.55, 0.8, m('#4a2e2e'), x, 0.35, 0))
    return g
  },
  phone: () => {
    const g = new THREE.Group()
    g.add(box(0.4, 0.7, 0.35, m(WOOD), 0, 0.35, 0))
    g.add(box(0.22, 0.08, 0.18, m('#20201c', { rough: 0.3 }), 0, 0.74, 0))
    const recv = cyl(0.025, 0.025, 0.24, m('#20201c'), 0, 0.81, 0, 8)
    recv.rotation.z = Math.PI / 2
    g.add(recv)
    return g
  },
  safe: () => {
    const g = new THREE.Group()
    g.add(box(0.6, 0.7, 0.55, m('#3d4247', { rough: 0.4 }), 0, 0.35, 0))
    const dial = cyl(0.08, 0.08, 0.03, m('#999'), 0.12, 0.42, 0.28, 16)
    dial.rotation.x = Math.PI / 2
    g.add(dial)
    keypadOn(g, -0.14, 0.42, 0.28)
    return g
  },
  doll: () => {
    const g = new THREE.Group()
    const body = new THREE.Group()
    body.add(cyl(0.08, 0.12, 0.25, m('#7a2a3a'), 0, 0.12, 0))
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), m('#e8dcd0', { rough: 0.3 }))
    head.position.y = 0.33
    const eyes = new THREE.Group()
    for (const x of [-0.03, 0.03]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), m('#050505'))
      e.position.set(x, 0.345, 0.08)
      eyes.add(e)
    }
    body.add(head, eyes)
    body.name = 'dollBody'
    g.add(box(0.35, 0.02, 0.35, m(WOOD), 0, 0.005, 0), body)
    return g
  },
  blackboard: () => {
    const g = new THREE.Group()
    g.add(box(3.2, 1.3, 0.05, m('#3a2a1e'), 0, 1.7, 0.02))
    const b = plane(3.05, 1.15, new THREE.MeshStandardMaterial({ map: tex('board', () => T.blackboard(false)), roughness: 0.9 }), 0, 1.7, 0.05)
    b.name = 'boardFace'
    g.add(b, box(3.2, 0.05, 0.12, m('#3a2a1e'), 0, 1.03, 0.06))
    return g
  },
  teacherDesk: () => {
    const g = new THREE.Group()
    g.add(box(1.4, 0.75, 0.7, m(WOOD), 0, 0.375, 0))
    g.add(box(0.5, 0.15, 0.02, m(DARKWOOD), 0.3, 0.55, 0.36))
    keypadOn(g, -0.3, 0.55, 0.355)
    paperOn(g, -0.2, 0.755, 0)
    return g
  },
  studentDesk: () => {
    const g = new THREE.Group()
    g.add(box(0.7, 0.04, 0.45, m('#6b5a40'), 0, 0.68, 0))
    for (const [x, z] of [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]]) g.add(box(0.04, 0.68, 0.04, m('#555'), x, 0.34, z))
    g.add(box(0.4, 0.04, 0.4, m('#6b5a40'), 0, 0.42, 0.45), box(0.4, 0.4, 0.04, m('#6b5a40'), 0, 0.62, 0.64))
    return g
  },
  chairFacingWall: () => {
    const g = new THREE.Group()
    g.add(box(0.4, 0.04, 0.4, m('#6b5a40'), 0, 0.42, 0), box(0.04, 0.4, 0.4, m('#6b5a40'), 0.2, 0.62, 0))
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) g.add(box(0.03, 0.42, 0.03, m('#555'), x, 0.21, z))
    paperOn(g, 0, 0.445, 0)
    return g
  },
  locker: () => {
    const g = new THREE.Group()
    g.add(box(0.9, 2.0, 0.5, m('#44545c', { rough: 0.5 }), 0, 1.0, 0))
    for (let i = 0; i < 4; i++) g.add(box(0.5, 0.02, 0.01, m('#111'), 0, 1.6 + i * 0.06, 0.255))
    g.add(box(0.02, 1.9, 0.01, m('#111'), 0, 1, 0.255))
    return g
  },
  mirror: () => {
    const g = new THREE.Group()
    g.add(box(0.75, 0.95, 0.03, m('#8a7a5a'), 0, 1.6, 0.015))
    g.add(plane(0.66, 0.84, new THREE.MeshStandardMaterial({ map: tex('mirror', T.mirrorTex), roughness: 0.15, metalness: 0.4 }), 0, 1.6, 0.035))
    g.add(box(0.8, 0.12, 0.45, m('#ddd', { rough: 0.3 }), 0, 0.85, 0.22))
    return g
  },
  cabinet: () => {
    const g = new THREE.Group()
    g.add(box(0.55, 0.65, 0.2, m('#cfcfc8', { rough: 0.4 }), 0, 1.55, 0.1))
    g.add(box(0.02, 0.6, 0.01, m('#888'), 0, 1.55, 0.205))
    keypadOn(g, 0.18, 1.55, 0.21)
    return g
  },
  bathtub: () => {
    const g = new THREE.Group()
    g.add(box(1.0, 0.55, 1.9, m('#dcdcd4', { rough: 0.3 }), 0, 0.275, 0))
    g.add(plane(0.84, 1.7, new THREE.MeshStandardMaterial({ color: '#050708', roughness: 0.05, metalness: 0.6 }), 0, 0.5, 0))
    g.children[1].rotation.x = -Math.PI / 2
    return g
  },
  frontDoor: () => {
    const g = new THREE.Group()
    g.add(box(1.3, 2.3, 0.1, m('#4a2a1a'), 0, 1.15, 0.05))
    for (const y of [0.6, 1.6]) g.add(box(1.0, 0.7, 0.02, m('#3a2014'), 0, y, 0.11))
    g.add(cyl(0.04, 0.04, 0.1, m('#c9a44a', { rough: 0.3 }), 0.5, 1.1, 0.14, 8).rotateX(Math.PI / 2))
    keypadOn(g, 0.5, 1.4, 0.115)
    // Ánh sáng lọt qua khe cửa
    const glow = plane(1.2, 0.03, new THREE.MeshBasicMaterial({ color: '#fff0c0' }), 0, 0.02, 0.11)
    glow.name = 'doorGlow'
    g.add(glow)
    return g
  },
  calendar: () => {
    const g = new THREE.Group()
    g.add(plane(0.3, 0.4, new THREE.MeshStandardMaterial({ map: tex('paper', T.paperTex), roughness: 1 }), 0, 1.5, 0.02))
    g.add(box(0.3, 0.05, 0.02, m('#a02020'), 0, 1.72, 0.02))
    return g
  },
  lamp: () => {
    const g = new THREE.Group()
    g.add(cyl(0.01, 0.01, 0.5, m('#222'), 0, 2.75, 0, 4))
    const shade = cyl(0.08, 0.25, 0.2, m('#6a5a3a'), 0, 2.45, 0, 12)
    g.add(shade)
    return g
  },
  coatRack: () => {
    const g = new THREE.Group()
    g.add(cyl(0.03, 0.03, 1.8, m(DARKWOOD), 0, 0.9, 0, 6), cyl(0.2, 0.25, 0.04, m(DARKWOOD), 0, 0.02, 0))
    g.add(box(0.5, 0.8, 0.15, m('#2a2a30'), 0.12, 1.3, 0.08))
    return g
  },
}

/** Kẻ Không Mặt: cao, gầy, tay dài, khuôn mặt trắng nhợt không có ngũ quan. */
export function buildEntity(): { root: THREE.Group; head: THREE.Mesh; armL: THREE.Group; armR: THREE.Group } {
  const root = new THREE.Group()
  const cloak = new THREE.MeshStandardMaterial({ color: '#0b0b0e', roughness: 1, emissive: new THREE.Color('#050508') })
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.0, 9, 1, true), cloak)
  body.position.y = 1.0
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.7, 8), cloak)
  torso.position.y = 1.95
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 6), cloak)
  neck.position.y = 2.38
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 18, 14),
    new THREE.MeshStandardMaterial({ color: '#d9d4c9', roughness: 0.35, emissive: new THREE.Color('#2a2826'), emissiveIntensity: 1 }),
  )
  head.scale.set(0.85, 1.3, 0.9)
  head.position.y = 2.64
  const mkArm = (s: number) => {
    const a = new THREE.Group()
    a.position.set(s * 0.22, 2.2, 0)
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 1.3, 5), cloak)
    upper.position.y = -0.65
    const hand = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 5), new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: 0.6 }))
    hand.position.y = -1.45
    hand.rotation.x = Math.PI
    a.add(upper, hand)
    a.rotation.z = s * 0.12
    return a
  }
  const armL = mkArm(-1)
  const armR = mkArm(1)
  root.add(body, torso, neck, head, armL, armR)
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true
  })
  return { root, head, armL, armR }
}
