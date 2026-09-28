import * as THREE from 'three'
import type { Palette } from '../art/palette'
import type { Registry } from '../engine/registry'
import type { RunState } from '../engine/state'

/**
 * Mô hình 3D low-poly dựng hoàn toàn từ hình khối cơ bản — không cần file ngoài.
 * Mỗi sprite 2D (khóa trong dữ liệu cảnh) có một bản 3D tương ứng ở đây.
 */

const matCache = new Map<string, THREE.MeshStandardMaterial>()
export function mat(color: string, opts: { emissive?: string; opacity?: number; rough?: number } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${opts.emissive ?? ''}|${opts.opacity ?? 1}|${opts.rough ?? 0.9}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.9,
      metalness: 0,
      flatShading: true,
      emissive: new THREE.Color(opts.emissive ?? '#000000'),
      emissiveIntensity: opts.emissive ? 1 : 0,
      transparent: opts.opacity !== undefined && opts.opacity < 1,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.opacity === undefined || opts.opacity >= 1,
    })
    matCache.set(key, m)
  }
  return m
}

export function mesh(geo: THREE.BufferGeometry, color: string | THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color)
  m.position.set(x, y, z)
  return m
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (rt: number, rb: number, h: number, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg)
const cone = (r: number, h: number, seg = 10) => new THREE.ConeGeometry(r, h, seg)
const sphere = (r: number, seg = 10) => new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2))

/** Bóng tròn dưới chân (rẻ hơn shadow map, chạy mượt trên điện thoại). */
export function blobShadow(r: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22, depthWrite: false }))
  m.rotation.x = -Math.PI / 2
  m.position.y = 0.02
  return m
}

// ------------------------------------------------------------------ nhân vật

const SKIN = '#c9a07e'
const STRAW = '#d2bb82'

function nonLa(r: number, h: number): THREE.Mesh {
  return mesh(cone(r, h, 16), STRAW)
}

function khanMoQua(): THREE.Group {
  const g = new THREE.Group()
  const wrap = mesh(sphere(0.22, 10), '#1c1a1d', 0, 0.02, 0)
  wrap.scale.set(1.05, 0.8, 1.05)
  const peak = mesh(cone(0.09, 0.22, 6), '#1c1a1d', 0, 0.18, 0.08)
  peak.rotation.x = 0.5
  g.add(wrap, peak)
  return g
}

function khanXep(band: string): THREE.Group {
  const g = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.07, 6, 14), mat('#1b1b1f'))
  ring.rotation.x = Math.PI / 2
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 4, 14), mat(band))
  stripe.rotation.x = Math.PI / 2
  stripe.position.y = 0.04
  g.add(ring, stripe, mesh(cyl(0.16, 0.18, 0.1), '#1b1b1f', 0, 0.02, 0))
  return g
}

interface Figure {
  root: THREE.Group
  /** Nhóm nhún nhảy khi nói. */
  bob: THREE.Group
  legs?: [THREE.Object3D, THREE.Object3D]
  arms?: [THREE.Object3D, THREE.Object3D]
  height: number
}

function robeFigure(robe: string, opts: { scale?: number; hunch?: number; head?: string; robeLen?: number } = {}): Figure {
  const root = new THREE.Group()
  const bob = new THREE.Group()
  root.add(bob)
  const s = opts.scale ?? 1
  const len = opts.robeLen ?? 1.25
  const body = mesh(cyl(0.22, 0.46, len, 10), robe, 0, len / 2, 0)
  bob.add(body)
  const shoulders = mesh(sphere(0.26, 10), robe, 0, len, 0)
  shoulders.scale.set(1.1, 0.55, 0.9)
  bob.add(shoulders)
  const headY = len + 0.28
  const head = mesh(sphere(0.19, 12), opts.head ?? SKIN, 0, headY, 0.02)
  bob.add(head)
  const armL = new THREE.Group()
  armL.position.set(-0.3, len - 0.05, 0)
  armL.add(mesh(cyl(0.07, 0.09, 0.62, 6), robe, 0, -0.3, 0))
  const armR = new THREE.Group()
  armR.position.set(0.3, len - 0.05, 0)
  armR.add(mesh(cyl(0.07, 0.09, 0.62, 6), robe, 0, -0.3, 0))
  bob.add(armL, armR)
  if (opts.hunch) {
    bob.rotation.x = opts.hunch
  }
  root.scale.setScalar(s)
  root.add(blobShadow(0.55))
  return { root, bob, arms: [armL, armR], height: (headY + 0.3) * s }
}

type CharBuilder = (accent: string) => Figure

const CHARACTERS: Record<string, CharBuilder> = {
  stranger: () => {
    const f = robeFigure('#1a1f24', { robeLen: 1.45, head: '#050607' })
    const brim = mesh(cyl(0.95, 0.95, 0.04, 24), '#2a2c2a', 0, 1.78, 0)
    const top = mesh(cone(0.85, 0.34, 24), '#2a2c2a', 0, 1.97, 0)
    f.bob.add(brim, top)
    // Làn sương quấn quanh chân
    const mist = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.16, 6, 20), mat('#e9eef0', { opacity: 0.35 }))
    mist.rotation.x = Math.PI / 2
    mist.position.y = 0.12
    f.root.add(mist)
    f.height = 2.2
    return f
  },
  baLao: (accent) => {
    const f = robeFigure('#4e3b2e', { hunch: 0.28, robeLen: 1.05 })
    const k = khanMoQua()
    k.position.set(0, 1.35, 0.02)
    f.bob.add(k, mesh(box(0.5, 0.05, 0.02), accent, 0, 0.7, 0.36))
    const cane = mesh(cyl(0.025, 0.025, 1.1, 5), '#6d5a45', 0.45, 0.55, 0.25)
    cane.rotation.z = -0.1
    f.root.add(cane)
    return f
  },
  cauBe: (accent) => {
    const f = robeFigure('#3f5a7a', { scale: 0.72, robeLen: 1.0 })
    const hat = nonLa(0.36, 0.3)
    hat.position.y = 1.5
    f.bob.add(hat, mesh(box(0.5, 0.05, 0.02), accent, 0, 0.5, 0.3))
    const stick = mesh(cyl(0.02, 0.02, 1.4, 5), '#6d5a45', 0.42, 0.9, 0.1)
    stick.rotation.z = -0.35
    f.root.add(stick)
    return f
  },
  elder1: (accent) => elder(accent, 'fan'),
  elder2: (accent) => elder(accent, 'cane'),
  elder3: (accent) => elder(accent, 'pipe'),
  elder4: (accent) => elder(accent, 'book'),
  ongTu: (accent) => {
    const f = elder(accent, 'none')
    const stick = mesh(cyl(0.03, 0.03, 0.8, 5), '#6d5a45', 0.42, 1.05, 0.2)
    stick.rotation.z = -0.8
    f.bob.add(stick, mesh(sphere(0.07), '#b8322a', 0.72, 1.35, 0.2))
    return f
  },
  thayDo: (accent) => {
    const f = elder(accent, 'none', 0.34)
    f.bob.add(mesh(cyl(0.06, 0.06, 0.45, 8), '#efe6cf', -0.38, 0.95, 0.25))
    const brush = mesh(cyl(0.015, 0.02, 0.4, 5), '#3a2a1c', 0.4, 1.0, 0.25)
    brush.rotation.z = 0.5
    f.bob.add(brush)
    return f
  },
  laiDo: (accent) => {
    const f = robeFigure('#5a4a38', { robeLen: 1.2 })
    const hat = nonLa(0.5, 0.36)
    hat.position.y = 1.72
    f.bob.add(hat, mesh(box(0.55, 0.06, 0.02), accent, 0, 0.8, 0.4))
    const pole = mesh(cyl(0.035, 0.035, 3.6, 6), '#6d5a45', 0.5, 1.4, 0.2)
    pole.rotation.z = 0.25
    f.root.add(pole)
    return f
  },
  coHang: (accent) => {
    const f = robeFigure('#6b4b52', { robeLen: 1.2 })
    const k = khanMoQua()
    k.position.set(0, 1.5, 0.02)
    f.bob.add(k)
    const pole = mesh(cyl(0.03, 0.03, 1.7, 5), '#6d5a45', 0, 1.25, 0.05)
    pole.rotation.z = Math.PI / 2
    f.bob.add(pole, mesh(cyl(0.2, 0.15, 0.2, 8), '#8a7040', -0.8, 0.75, 0.05), mesh(cyl(0.2, 0.15, 0.2, 8), '#8a7040', 0.8, 0.75, 0.05))
    f.bob.add(mesh(box(0.4, 0.05, 0.02), accent, 0, 0.75, 0.38))
    return f
  },
}

function elder(accent: string, prop: 'fan' | 'cane' | 'pipe' | 'book' | 'none', beard = 0.2): Figure {
  const f = robeFigure('#22252b', { robeLen: 1.3 })
  const k = khanXep(accent)
  k.position.set(0, 1.7, 0.02)
  const b = mesh(cone(0.09, beard, 6), '#e8e4da', 0, 1.42 - beard / 2 + 0.06, 0.16)
  b.rotation.x = Math.PI
  f.bob.add(k, b, mesh(box(0.6, 0.05, 0.02), accent, 0, 0.8, 0.38))
  if (prop === 'fan') {
    const fan = mesh(cyl(0.25, 0.25, 0.02, 10, ), accent, 0.42, 1.1, 0.3)
    fan.rotation.x = Math.PI / 2
    f.bob.add(fan)
  }
  if (prop === 'cane') f.root.add(mesh(cyl(0.03, 0.03, 1.2, 5), '#6d5a45', 0.45, 0.6, 0.2))
  if (prop === 'pipe') f.bob.add(mesh(cyl(0.02, 0.02, 0.4, 5), '#6d5a45', 0.15, 1.5, 0.3))
  if (prop === 'book') f.bob.add(mesh(box(0.25, 0.32, 0.06), '#efe6cf', -0.38, 0.95, 0.25))
  return f
}

export function buildCharacter(sprite: string, accent = '#c29a4f'): Figure {
  const b = CHARACTERS[sprite] ?? CHARACTERS.stranger
  return b(accent)
}

/** Nhân vật người chơi: lữ khách mang tay nải, có tay chân đung đưa khi đi. */
export function buildPlayer(): Figure {
  const root = new THREE.Group()
  const bob = new THREE.Group()
  root.add(bob)
  const legL = new THREE.Group()
  legL.position.set(-0.13, 0.78, 0)
  legL.add(mesh(cyl(0.08, 0.07, 0.78, 6), '#2f3a44', 0, -0.39, 0))
  const legR = new THREE.Group()
  legR.position.set(0.13, 0.78, 0)
  legR.add(mesh(cyl(0.08, 0.07, 0.78, 6), '#2f3a44', 0, -0.39, 0))
  const torso = mesh(cyl(0.22, 0.26, 0.7, 10), '#7a8c6a', 0, 1.12, 0)
  const head = mesh(sphere(0.18, 12), SKIN, 0, 1.64, 0)
  const scarf = mesh(cyl(0.2, 0.22, 0.1, 10), '#b8563d', 0, 1.46, 0)
  const pack = mesh(box(0.42, 0.5, 0.22), '#8a6d48', 0, 1.15, -0.26)
  const hat = nonLa(0.42, 0.3)
  hat.position.y = 1.86
  const armL = new THREE.Group()
  armL.position.set(-0.3, 1.42, 0)
  armL.add(mesh(cyl(0.06, 0.06, 0.62, 6), '#7a8c6a', 0, -0.3, 0))
  const armR = new THREE.Group()
  armR.position.set(0.3, 1.42, 0)
  armR.add(mesh(cyl(0.06, 0.06, 0.62, 6), '#7a8c6a', 0, -0.3, 0))
  bob.add(legL, legR, torso, head, scarf, pack, hat, armL, armR)
  root.add(blobShadow(0.45))
  return { root, bob, legs: [legL, legR], arms: [armL, armR], height: 2.1 }
}

// ------------------------------------------------------------------ đồ vật

export interface ObjCtx {
  p: Palette
  run: RunState
  reg: Registry
  props: Record<string, string | number | boolean>
  flip?: boolean
}

function bamboo(h: number, r: number, color: string): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(cyl(r, r * 1.1, h, 6), color, 0, h / 2, 0))
  for (let y = 0.8; y < h; y += 0.9) g.add(mesh(cyl(r * 1.15, r * 1.15, 0.05, 6), '#3c4a38', 0, y, 0))
  const leaf = mesh(cone(0.5, 0.9, 5), '#5e7a52', 0, h + 0.2, 0)
  leaf.rotation.z = 0.4
  g.add(leaf)
  return g
}

function portal(p: Palette, dir: 'left' | 'right' | 'up' | 'down'): THREE.Group {
  const g = new THREE.Group()
  const glow = p.tod === 'toi' ? '#ffe3a0' : '#fff2c8'
  // Cổng phía sau lưng chỉ là vòng sáng thấp, để không che tầm nhìn camera.
  const low = dir === 'down'
  const column = mesh(cyl(1.0, 1.0, low ? 0.6 : 3.2, 20), mat(glow, { emissive: '#d9b86c', opacity: 0.18 }), 0, low ? 0.3 : 1.6, 0)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 6, 32), mat('#d9b86c', { emissive: '#d9b86c' }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.05
  const arrow = mesh(cone(0.28, 0.6, 4), mat('#f4d88a', { emissive: '#caa050' }), 0, low ? 0.6 : 1.6, 0)
  const rot: Record<string, [number, number]> = { left: [0, Math.PI / 2], right: [0, -Math.PI / 2], up: [-Math.PI / 2, 0], down: [Math.PI / 2, 0] }
  const [rx, rz] = rot[dir]
  arrow.rotation.set(rx, 0, rz)
  arrow.userData.spin = true
  g.add(column, ring, arrow)
  return g
}

function stall(p: Palette, cloth: string[], w = 3, d = 2): THREE.Group {
  const g = new THREE.Group()
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(mesh(cyl(0.06, 0.06, 2.2, 5), p.wood, x, 1.1, z))
  const roof = mesh(cone(Math.hypot(w, d) * 0.62, 0.9, 4), p.roof, 0, 2.6, 0)
  roof.rotation.y = Math.PI / 4
  roof.scale.set(w / Math.hypot(w, d) * 1.4, 1, d / Math.hypot(w, d) * 1.4)
  g.add(roof, mesh(box(w, 0.12, d * 0.8), p.wood, 0, 0.9, 0))
  cloth.forEach((c, i) => {
    const m = mesh(box(0.45, 1.1, 0.03), c, -w / 2 + 0.4 + i * (w - 0.8) / Math.max(1, cloth.length - 1), 1.55, d / 2 - 0.05)
    g.add(m)
  })
  return g
}

type ObjBuilder = (c: ObjCtx) => THREE.Group

const OBJECTS: Record<string, ObjBuilder> = {
  exitLeft: ({ p }) => portal(p, 'left'),
  exitRight: ({ p }) => portal(p, 'right'),
  exitUp: ({ p }) => portal(p, 'up'),
  exitDown: ({ p }) => portal(p, 'down'),
  clothStall: ({ p }) => stall(p, ['#34487e', '#8b3a3a', '#caa04a', '#3f6b52', '#5a4a7a'], 3.6, 2),
  teaBench: ({ p }) => {
    const g = new THREE.Group()
    g.add(mesh(box(2.6, 0.1, 0.8), p.wood, 0, 0.5, 0))
    for (const x of [-1.1, 1.1]) g.add(mesh(box(0.1, 0.5, 0.7), p.wood, x, 0.25, 0))
    g.add(mesh(sphere(0.25), '#2d2a28', -0.5, 0.7, 0), mesh(cyl(0.08, 0.06, 0.12), '#efe6cf', 0.2, 0.62, 0.1), mesh(cyl(0.08, 0.06, 0.12), '#efe6cf', 0.45, 0.62, -0.1))
    return g
  },
  buffalo: () => {
    const g = new THREE.Group()
    const dark = '#2b2d30'
    const body = mesh(sphere(0.9, 10), dark, 0, 1.25, 0)
    body.scale.set(1.6, 0.85, 0.9)
    g.add(body)
    for (const [x, z] of [[-0.9, -0.4], [-0.9, 0.4], [0.9, -0.4], [0.9, 0.4]]) g.add(mesh(cyl(0.14, 0.12, 0.9, 6), dark, x, 0.45, z))
    const head = mesh(box(0.7, 0.55, 0.5), dark, -1.7, 1.45, 0)
    g.add(head)
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 5, 10, Math.PI), mat('#d8cfb8'))
      horn.position.set(-1.8, 1.8, s * 0.3)
      horn.rotation.set(0, s * 0.3, s > 0 ? 0.3 : -0.3)
      g.add(horn)
    }
    const tail = mesh(cyl(0.03, 0.03, 0.9, 4), dark, 1.5, 1.0, 0)
    tail.rotation.z = 0.3
    tail.userData.sway = true
    g.add(tail, blobShadow(1.6))
    g.rotation.y = 0.4
    return g
  },
  bambooGate: ({ p }) => {
    const g = new THREE.Group()
    for (const x of [-1.5, 1.5]) g.add(bamboo(3.8, 0.16, p.leaf).translateX(x))
    g.add(mesh(cyl(0.1, 0.1, 3.6, 6), p.leaf, 0, 3.4, 0).rotateZ(Math.PI / 2))
    g.add(mesh(cyl(0.08, 0.08, 3.4, 6), p.leaf, 0, 3.0, 0).rotateZ(Math.PI / 2))
    for (let i = 0; i < 8; i++) g.add(mesh(cyl(0.06, 0.06, 2.0, 5), p.leaf, -1.1 + i * 0.32, 1.0, 0))
    return g
  },
  fieldPath: ({ p }) => {
    const g = new THREE.Group()
    for (let i = 0; i < 5; i++) g.add(mesh(box(4.5 - i * 0.3, 0.3, 1.1), i % 2 ? p.leaf : '#8aa06a', 0, 0.15 + i * 0.3, -i * 1.0))
    g.add(mesh(box(0.5, 0.05, 5), '#b8a47a', 0, 0.9, -2))
    return g
  },
  stoneSlope: ({ p }) => {
    const g = new THREE.Group()
    for (let i = 0; i < 9; i++) g.add(mesh(box(2.4 - i * 0.1, 0.4, 0.8), i % 2 ? p.mid : p.near, 0, 0.2 + i * 0.4, -i * 0.7))
    g.add(mesh(sphere(0.5), p.leaf, -1.4, 0.4, 0.2), mesh(sphere(0.35), p.leaf, 1.3, 2.2, -3))
    return g
  },
  drum: () => {
    const g = new THREE.Group()
    const d = mesh(cyl(0.75, 0.75, 1.2, 16), '#7a3b2a', 0, 1.6, 0)
    d.rotation.x = Math.PI / 2
    const skin = mesh(cyl(0.72, 0.72, 0.02, 16), '#d8c9a3', 0, 1.6, 0.61)
    skin.rotation.x = Math.PI / 2
    g.add(d, skin)
    for (const x of [-0.7, 0.7]) g.add(mesh(box(0.1, 1.2, 0.1), '#5a3a22', x, 0.6, 0))
    g.add(mesh(box(1.6, 0.1, 0.3), '#5a3a22', 0, 1.0, 0))
    return g
  },
  noticeBoard: ({ p }) => {
    const g = new THREE.Group()
    g.add(mesh(box(0.12, 1.8, 0.12), p.wood, 0, 0.9, 0))
    const tex = textTexture(['Lệ trống đình', 'Mồng một: 2', 'Mồng hai: 4', 'Mồng ba: 8', 'Hôm nay: ?'], 256, 320)
    g.add(mesh(box(1.1, 1.3, 0.06), p.wood, 0, 1.8, 0))
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: tex })).translateY(1.8).translateZ(0.04))
    return g
  },
  sanctuaryDoor: ({ p, run }) => {
    const g = new THREE.Group()
    const open = !!run.flags['a2_unlocked']
    g.add(mesh(box(3.2, 0.3, 0.4), p.accent, 0, 3.6, 0))
    for (const x of [-1.5, 1.5]) g.add(mesh(box(0.25, 3.6, 0.4), p.wood, x, 1.8, 0))
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group()
      hinge.position.set(s * 1.35, 0, 0)
      hinge.add(mesh(box(1.35, 3.3, 0.12), '#6e2b22', -s * 0.675, 1.65, 0))
      hinge.rotation.y = open ? s * 1.3 : 0
      g.add(hinge)
    }
    if (!open) g.add(mesh(box(0.3, 0.4, 0.1), '#c9a44a', 0, 1.7, 0.1))
    g.add(mesh(box(3, 3.3, 0.05), '#110c0c', 0, 1.65, -0.1))
    return g
  },
  chest: ({ run }) => {
    const g = new THREE.Group()
    g.add(mesh(box(1.6, 0.8, 0.9), '#8a2f22', 0, 0.4, 0))
    const lid = new THREE.Group()
    lid.position.set(0, 0.8, -0.45)
    lid.add(mesh(box(1.65, 0.2, 0.95), '#a33c2c', 0, 0.1, 0.45))
    if (run.flags['a2_took_map']) lid.rotation.x = -1.2
    g.add(lid, mesh(box(0.2, 0.25, 0.05), '#c9a44a', 0, 0.6, 0.47))
    return g
  },
  hut: ({ p }) => {
    const g = new THREE.Group()
    g.add(mesh(box(3.4, 2.2, 2.8), p.wood, 0, 1.1, 0))
    const roof = mesh(cone(2.9, 1.6, 4), '#8a7a4a', 0, 3.0, 0)
    roof.rotation.y = Math.PI / 4
    g.add(roof, mesh(box(0.9, 1.6, 0.05), '#1d1812', 0, 0.8, 1.41))
    g.add(mesh(box(0.6, 0.6, 0.05), mat('#ffd98a', { emissive: '#a07830' }), 1.0, 1.4, 1.41))
    return g
  },
  scroll: () => {
    const g = new THREE.Group()
    const tex = textTexture(['Chữ tròn', 'như cửa,', 'mở ra', 'lối về.', 'Bóng quay', 'lưng lại,', 'nắng ở', 'phía kia.'], 160, 420, '#b33a2a', '#141010')
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.2), new THREE.MeshBasicMaterial({ map: tex })).translateY(2.0))
    g.add(mesh(cyl(0.05, 0.05, 1, 6), '#5a3a22', 0, 3.1, 0.02).rotateZ(Math.PI / 2))
    return g
  },
  eye: () => {
    const g = new THREE.Group()
    g.add(mesh(cyl(0.3, 0.4, 0.8, 8), '#7d8588', 0, 0.4, 0))
    const orb = mesh(sphere(0.25, 12), mat('#fff5d2', { emissive: '#e8d38a' }), 0, 1.1, 0)
    orb.userData.float = true
    g.add(orb)
    return g
  },
  rock: ({ p, run }) => {
    const g = new THREE.Group()
    const r = mesh(new THREE.DodecahedronGeometry(2.3, 1), p.near, 0, 1.6, -0.6)
    r.scale.set(1.3, 0.9, 1.0)
    g.add(r, mesh(sphere(1.2, 8), p.leaf, -1.8, 0.8, 1.6), mesh(sphere(0.8, 8), p.leaf, 2.2, 3.2, 0.6))
    if (run.solved['a3_c']) {
      const crack = mesh(box(0.15, 2.8, 0.3), mat('#fff6d0', { emissive: '#ffe08a' }), 2.7, 1.3, -1.2)
      crack.userData.float = false
      g.add(crack)
    }
    return g
  },
  leafHut: ({ p }) => {
    const g = new THREE.Group()
    for (const [x, z] of [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]]) g.add(mesh(cyl(0.07, 0.07, 2.2, 5), p.wood, x, 1.1, z))
    const roof = mesh(cone(2.6, 1.3, 6), p.leaf, 0, 2.8, 0)
    g.add(roof, mesh(box(2, 0.1, 0.8), p.wood, 0, 0.8, 0), mesh(sphere(0.18), mat('#ffcf7a', { emissive: '#c08030' }), 0, 2.1, 0.9))
    return g
  },
  teaPot: () => {
    const g = new THREE.Group()
    g.add(mesh(cyl(0.35, 0.35, 0.6, 8), '#6d5a45', 0, 0.3, 0), mesh(sphere(0.22), '#2d2a28', 0, 0.8, 0))
    const spout = mesh(cyl(0.03, 0.05, 0.3, 5), '#2d2a28', 0.25, 0.85, 0)
    spout.rotation.z = -0.9
    g.add(spout)
    return g
  },
  boat: ({ p }) => {
    const g = new THREE.Group()
    const hull = mesh(cyl(0.9, 0.9, 5, 12, ), p.wood, 0, 0.35, 0)
    hull.rotation.z = Math.PI / 2
    hull.scale.set(1, 1, 0.55)
    g.add(hull)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12, 1, true, 0, Math.PI), mat(p.roof))
    roof.rotation.z = Math.PI / 2
    roof.rotation.y = Math.PI / 2
    roof.position.y = 0.9
    g.add(roof, blobShadow(1.4))
    g.userData.rock = true
    return g
  },
  bambooPath: ({ p, flip }) => {
    // Bóng trúc luôn đổ về phía -X (trái); lật (flip) thì đổ về +X.
    const g = new THREE.Group()
    const s = flip ? -1 : 1
    const path = mesh(box(1.6, 0.04, 7), '#8d7b5c', 0, 0.02, -2)
    g.add(path)
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.45, depthWrite: false })
    for (const [x, z, h] of [[-1.4, 0.5, 6], [1.4, -0.5, 5.5], [-1.5, -2.5, 6.5], [1.5, -3.5, 6]]) {
      g.add(bamboo(h, 0.14, p.near).translateX(x).translateZ(z))
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.9, 0.35), shadowMat)
      sh.rotation.x = -Math.PI / 2
      sh.position.set(x - s * (h * 0.45), 0.03, z)
      g.add(sh)
    }
    return g
  },
}

/** Một bên đường làng (mê lộ): cây gạo có quạ, bậc đá, cây nêu treo vải. */
export function buildRoadSide(c: ObjCtx): THREE.Group {
  const side = (c.props.side as 'left' | 'right') ?? 'left'
  const st = c.run.mazes['duong_lang']?.sides[side] ?? { crow: 0, steps: 0, cloth: 0 }
  const maze = c.reg.mazes['duong_lang']
  const steps = Number(maze?.details.find((d) => d.key === 'steps')?.values[st.steps] ?? 8)
  const s = side === 'left' ? 1 : -1
  const g = new THREE.Group()
  // Cây gạo (phía ngoài), cành vươn vào giữa đường
  const tx = -s * 1.4
  g.add(mesh(cyl(0.2, 0.3, 4.2, 7), c.p.wood, tx, 2.1, -1))
  const canopy = mesh(sphere(1.3, 9), c.p.leaf, tx - s * 0.3, 4.6, -1.2)
  canopy.scale.y = 0.6
  g.add(canopy, mesh(sphere(0.14), '#b34b3a', tx + s * 0.5, 4.3, -0.4), mesh(sphere(0.14), '#b34b3a', tx - s * 0.7, 4.7, -0.5))
  const branchHi = mesh(cyl(0.06, 0.09, 1.5, 5), c.p.wood, tx + s * 0.7, 3.7, -1)
  branchHi.rotation.z = s * 1.25
  const branchLo = mesh(cyl(0.06, 0.09, 1.4, 5), c.p.wood, tx + s * 0.65, 2.4, -1)
  branchLo.rotation.z = s * 1.3
  g.add(branchHi, branchLo)
  const crow = new THREE.Group()
  crow.add(mesh(sphere(0.2, 8), '#111'), mesh(sphere(0.12, 8), '#111', s * 0.18, 0.12, 0), mesh(cone(0.05, 0.14, 4), '#444', s * 0.32, 0.12, 0).rotateZ(-s * Math.PI / 2))
  crow.position.set(tx + s * 1.2, st.crow === 0 ? 4.1 : 2.8, -1)
  g.add(crow)
  // Bậc đá
  for (let i = 0; i < steps; i++) g.add(mesh(box(1.2 - i * 0.06, 0.22, 0.42), i % 2 ? c.p.mid : c.p.near, s * 0.35, 0.11 + i * 0.22, 1.4 - i * 0.4))
  // Cây nêu (phía trong)
  const nx = s * 1.5
  g.add(mesh(cyl(0.05, 0.06, 5, 5), c.p.wood, nx, 2.5, 1.2))
  const clothColor = ['#b8412f', '#f0ede6', '#34487e'][st.cloth] ?? '#b8412f'
  g.add(mesh(box(0.05, 1.2, 0.7), clothColor, nx, 3.9, 1.6))
  return g
}

export function buildObject(sprite: string, c: ObjCtx): THREE.Group {
  if (sprite === 'roadSide') return buildRoadSide(c)
  const b = OBJECTS[sprite]
  if (b) return b(c)
  // Không có mô hình riêng: cột đá có ánh sáng nhẹ để vẫn nhận ra chỗ tương tác.
  const g = new THREE.Group()
  g.add(mesh(cyl(0.3, 0.4, 1.2, 6), '#7d8588', 0, 0.6, 0))
  return g
}

/** Chữ vẽ lên canvas làm texture (bảng lệ trống, câu đối, biển chỉ đường). */
export function textTexture(lines: string[], w: number, h: number, bg = '#e9dfc4', fg = '#2a2016'): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  const size = Math.floor(h / (lines.length + 1.2))
  ctx.font = `600 ${Math.min(size, 34)}px Lora, Georgia, serif`
  lines.forEach((l, i) => ctx.fillText(l, w / 2, size * (i + 1.1)))
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
