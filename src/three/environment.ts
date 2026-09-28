import * as THREE from 'three'
import type { Palette } from '../art/palette'
import { rng } from '../art/shapes'
import { blobShadow, mat, mesh, textTexture } from './models'

/**
 * Môi trường 3D cho từng khóa nền (`Scene.art`): trời, núi xếp lớp mờ dần trong sương,
 * mặt đất và các khối trang trí quanh rìa sân chơi (không chắn đường đi).
 */
export interface Environment {
  group: THREE.Group
  indoor: boolean
  /** Các mesh nước có texture trôi theo dòng chảy. */
  water: THREE.Texture[]
}

function skyDome(p: Palette): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, p.skyTop)
  g.addColorStop(0.55, p.skyBottom)
  g.addColorStop(1, p.fog)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const m = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }))
  m.renderOrder = -10
  return m
}

function mountains(p: Palette, seed: number): THREE.Group {
  const g = new THREE.Group()
  const r = rng(seed)
  const rings: [number, string, number][] = [
    [120, p.far, 26],
    [85, p.mid, 20],
    [60, p.near, 14],
  ]
  for (const [radius, color, count] of rings) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.2
      const h = 14 + r() * (radius / 3)
      const m = new THREE.Mesh(new THREE.ConeGeometry(h * 0.9, h, 5), mat(color))
      m.position.set(Math.cos(a) * radius, h / 2 - 2, Math.sin(a) * radius)
      m.rotation.y = r() * Math.PI
      g.add(m)
    }
  }
  return g
}

function ground(color: string, size = 400): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(color))
  m.rotation.x = -Math.PI / 2
  return m
}

function waterTexture(p: Palette): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = p.water
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = p.light
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 2
  const r = rng(5)
  for (let i = 0; i < 14; i++) {
    const x = r() * 128
    const y = r() * 128
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 18, y)
    ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Rừng trúc: dùng InstancedMesh để vẽ hàng trăm cây mà vẫn nhẹ. */
function bambooForest(p: Palette, seed: number, count: number, inner: number, outer: number, color?: string): THREE.Group {
  const g = new THREE.Group()
  const r = rng(seed)
  const stalks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.17, 1, 6), mat(color ?? p.leaf), count)
  const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.2, 5), mat('#55704a'), count)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  let n = 0
  while (n < count) {
    const x = (r() * 2 - 1) * outer
    const z = (r() * 2 - 1) * outer - 4
    // Chừa trống sân chơi ở giữa.
    if (Math.abs(x) < inner && z > -inner - 2 && z < inner) continue
    const h = 6 + r() * 7
    m4.compose(new THREE.Vector3(x, h / 2, z), q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.08, 0, (r() - 0.5) * 0.08)), new THREE.Vector3(1, h, 1))
    stalks.setMatrixAt(n, m4)
    m4.compose(new THREE.Vector3(x, h + 0.6, z), q.setFromEuler(new THREE.Euler(0, r() * 3, 0)), new THREE.Vector3(1, 1, 1))
    leaves.setMatrixAt(n, m4)
    n++
  }
  g.add(stalks, leaves)
  return g
}

function stallRow(p: Palette, z: number, xs: number[], colors: string[]): THREE.Group {
  const g = new THREE.Group()
  xs.forEach((x, i) => {
    const s = new THREE.Group()
    for (const [dx, dz] of [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]]) s.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 5), p.wood, dx, 1.2, dz))
    const roof = mesh(new THREE.ConeGeometry(2.5, 1, 4), p.roof, 0, 2.8, 0)
    roof.rotation.y = Math.PI / 4
    s.add(roof, mesh(new THREE.BoxGeometry(3.2, 0.12, 1.6), p.wood, 0, 0.9, 0), mesh(new THREE.BoxGeometry(2.6, 0.5, 1.2), colors[i % colors.length], 0, 1.2, 0))
    s.position.set(x, 0, z + (i % 2) * 1.5)
    g.add(s)
  })
  return g
}

function lantern(x: number, y: number, z: number, night: boolean): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), mat('#e0a24a', { emissive: night ? '#ff9a3a' : '#5a3a10' }), x, y, z))
  if (night) {
    const l = new THREE.PointLight('#ffb060', 6, 10, 1.6)
    l.position.set(x, y, z)
    g.add(l)
  }
  return g
}

/** Mái đình cong: thân mái hình thang, hai đầu đao vểnh lên. */
function dinhRoof(p: Palette, w: number, d: number): THREE.Group {
  const g = new THREE.Group()
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2 - 1.2, 0)
  shape.quadraticCurveTo(-w / 2 - 0.4, 0.2, -w / 2 + 0.6, 0.5)
  shape.lineTo(-w / 4, 2.4)
  shape.lineTo(w / 4, 2.4)
  shape.lineTo(w / 2 - 0.6, 0.5)
  shape.quadraticCurveTo(w / 2 + 0.4, 0.2, w / 2 + 1.2, 0)
  shape.lineTo(w / 2 + 1.4, 0.7)
  shape.quadraticCurveTo(w / 2, 0.6, w / 2 - 0.8, 0.7)
  shape.lineTo(-w / 2 + 0.8, 0.7)
  shape.quadraticCurveTo(-w / 2, 0.6, -w / 2 - 1.4, 0.7)
  shape.closePath()
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }), mat(p.roof))
  roof.position.z = -d / 2
  g.add(roof, mesh(new THREE.BoxGeometry(w / 2, 0.2, d + 0.2), p.accent, 0, 2.45, 0))
  return g
}

function dinhBuilding(p: Palette): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(16, 0.5, 7), '#8d8577', 0, 0.25, 0))
  for (let i = 0; i < 7; i++) g.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 8), p.wood, -7.5 + i * 2.5, 2.5, 3))
  g.add(mesh(new THREE.BoxGeometry(15, 3.6, 0.3), p.wood, 0, 2.3, -3))
  const r1 = dinhRoof(p, 17, 8)
  r1.position.y = 4.3
  const r2 = dinhRoof(p, 12, 6)
  r2.scale.set(1, 0.8, 1)
  r2.position.y = 6.4
  g.add(r1, r2)
  return g
}

function walls(p: Palette, color: string, back = -10, half = 20, h = 7): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(half * 2, h, 0.4), color, 0, h / 2, back))
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.4, h, 34), color, s * half, h / 2, back + 17))
  for (let x = -half + 3; x < half; x += 6) g.add(mesh(new THREE.CylinderGeometry(0.35, 0.35, h, 8), p.wood, x, h / 2, back + 0.6))
  return g
}

export function buildEnvironment(art: string, p: Palette): Environment {
  const g = new THREE.Group()
  const water: THREE.Texture[] = []
  const night = p.tod === 'toi'
  const indoor = art === 'dinhHall' || art === 'sanctuary' || art === 'scholarHut'
  if (!indoor) {
    g.add(skyDome(p), mountains(p, art.length * 7 + 3))
  }

  const addRiver = (x: number, z: number, w: number, d: number, flowX: boolean) => {
    const t = waterTexture(p)
    t.repeat.set(w / 6, d / 6)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0.1, color: '#ffffff' }))
    m.rotation.x = -Math.PI / 2
    m.position.set(x, 0.03, z)
    t.userData.flowX = flowX
    water.push(t)
    g.add(m)
  }

  switch (art) {
    case 'market': {
      g.add(ground(p.ground))
      g.add(stallRow(p, -21, [-16, -9, -2, 5, 12, 19], ['#5a6b9a', '#9a5a5a', p.accent, '#3f6b52']))
      g.add(stallRow(p, 17, [-18, -10, 10, 18], ['#9a5a5a', '#5a6b9a']))
      for (const x of [-12, -4, 4, 12]) g.add(lantern(x, 3, -18, night))
      for (const s of [-1, 1]) g.add(stallRow(p, 0, [s * 23], ['#6b5a3a']))
      break
    }
    case 'teaStall': {
      g.add(ground(p.ground))
      const roof = mesh(new THREE.BoxGeometry(14, 0.3, 5), p.roof, 0, 4.6, -5)
      roof.rotation.x = 0.12
      g.add(roof)
      for (const [x, z] of [[-6.8, -7.3], [6.8, -7.3], [-6.8, -2.8], [6.8, -2.8]]) g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.6, 6), p.wood, x, 2.3, z))
      g.add(mesh(new THREE.BoxGeometry(5, 0.9, 1), p.wood, -1, 0.45, -4.5), lantern(0, 4.1, -2.8, night))
      g.add(bambooForest(p, 3, 40, 26, 40, p.mid))
      break
    }
    case 'buffaloField':
    case 'crossroads': {
      g.add(ground(p.leaf))
      const r = rng(art.length)
      for (let i = 0; i < 7; i++) {
        const t = mesh(new THREE.BoxGeometry(80, 0.6 + i * 0.6, 6), i % 2 ? p.leaf : '#8aa06a', 0, (0.6 + i * 0.6) / 2, -22 - i * 6)
        t.rotation.y = (r() - 0.5) * 0.08
        g.add(t)
      }
      if (art === 'buffaloField') g.add(mesh(new THREE.ConeGeometry(1.4, 1.2, 8), STRAWISH, 14, 3.2, -8), mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 5), p.wood, 14, 1.5, -8))
      break
    }
    case 'villageRoad': {
      g.add(ground(p.ground))
      g.add(mesh(new THREE.BoxGeometry(4, 0.03, 40), '#8d7b5c', 0, 0.02, -4))
      g.add(bambooForest(p, 17, 90, 22, 45, p.mid))
      break
    }
    case 'dinhYard': {
      g.add(ground(p.ground))
      g.add(mesh(new THREE.BoxGeometry(40, 0.04, 30), '#a09080', 0, 0.02, -2))
      const d = dinhBuilding(p)
      d.position.z = -22
      g.add(d)
      for (const x of [-10, 10]) g.add(lantern(x, 2.4, -16, night))
      break
    }
    case 'dinhHall': {
      g.add(ground(p.groundDark))
      g.add(mesh(new THREE.BoxGeometry(34, 0.05, 6), '#8e3b30', 0, 0.03, 1))
      g.add(walls(p, '#4a3a30', -9))
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.2), new THREE.MeshBasicMaterial({ map: textTexture(['Đình Làng'], 512, 100, '#c29a4f', '#3a2618') }))
      plaque.position.set(0, 5.6, -8.7)
      g.add(plaque)
      for (const x of [-15, 15]) g.add(lantern(x, 4.5, -8, true))
      break
    }
    case 'sanctuary': {
      g.add(ground('#1a1414'))
      g.add(walls(p, '#2a2020', -8))
      g.add(mesh(new THREE.BoxGeometry(6, 1.6, 1.6), p.wood, 0, 0.8, -6.5), mesh(new THREE.BoxGeometry(6.4, 0.2, 1.8), p.accent, 0, 1.7, -6.5))
      for (const x of [-2, 2]) g.add(lantern(x, 2.2, -6.5, true))
      const beam = new THREE.Mesh(new THREE.ConeGeometry(3, 12, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }))
      beam.position.set(0, 6, -1)
      g.add(beam)
      break
    }
    case 'scholarHut': {
      g.add(ground(p.wood))
      g.add(walls(p, '#6a5a44', -8))
      const win = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshBasicMaterial({ color: p.skyBottom }))
      win.position.set(9, 4, -7.7)
      const frame = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.2, 6, 24), mat(p.roof))
      frame.position.copy(win.position)
      g.add(win, frame, mesh(new THREE.BoxGeometry(8, 0.2, 2), p.roof, 0, 0.9, -4), lantern(-6, 3.5, -6, true))
      break
    }
    case 'forestEdge':
      g.add(ground(p.ground), bambooForest(p, 41, 220, 20, 50, p.leaf))
      break
    case 'twinPath':
      g.add(ground(p.ground), bambooForest(p, 15, 220, 20, 50, p.mid))
      break
    case 'bigRock':
      g.add(ground(p.ground), bambooForest(p, 21, 200, 20, 50, p.mid))
      break
    case 'riverbank': {
      g.add(ground(p.ground))
      addRiver(0, -18, 200, 16, true)
      g.add(bambooForest(p, 51, 30, 40, 50, p.leaf))
      for (let i = 0; i < 30; i++) {
        const reed = mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.4, 4), p.leaf, -20 + i * 1.4, 0.7, -9.5 + (i % 3) * 0.3)
        reed.rotation.z = (i % 5 - 2) * 0.1
        g.add(reed)
      }
      break
    }
    case 'leafHouse': {
      g.add(ground(p.ground))
      const roof = mesh(new THREE.ConeGeometry(12, 3, 8), p.leaf, 0, 5.5, -8)
      roof.scale.z = 0.5
      g.add(roof, lantern(0, 3.8, -6, night))
      for (const x of [-9, 9]) g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 6), p.wood, x, 2.25, -6))
      addRiver(0, -30, 200, 12, true)
      break
    }
    case 'ferry': {
      g.add(ground(p.ground))
      addRiver(0, -22, 200, 30, true)
      addRiver(22, 0, 30, 40, false)
      for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(1.2, 0.15, 6), p.wood, 9 + i * 1.25, 0.2, 3))
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.7, 7, 8), p.wood, -16, 3.5, -8), mesh(new THREE.SphereGeometry(3.4, 9, 7), p.leaf, -16, 7.5, -8))
      g.add(blobShadow(3).translateX(-16).translateZ(-8))
      break
    }
    default:
      g.add(ground(p.ground))
  }
  return { group: g, indoor, water }
}

const STRAWISH = '#b8a47a'
