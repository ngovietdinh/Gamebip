import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Floor, WallStyle } from './types'

/* =====================================================================
 * Vật liệu PBR dựng từ canvas: màu + bản đồ pháp tuyến (normal map) suy ra
 * từ bản đồ độ cao, để tường/sàn có vân nổi thật dưới ánh đèn pin.
 * ===================================================================== */

type Draw = (ctx: CanvasRenderingContext2D, size: number, height: CanvasRenderingContext2D, rnd: () => number) => void

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!]
}

/** Pháp tuyến từ bản đồ độ cao (lọc Sobel). */
function normalFromHeight(src: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const size = src.width
  const hd = src.getContext('2d')!.getImageData(0, 0, size, size).data
  const [out, ctx] = makeCanvas(size)
  const img = ctx.createImageData(size, size)
  const h = (x: number, y: number) => hd[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1)) * strength
      const dy = (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1)) * strength
      const nz = 1
      const len = Math.hypot(dx, dy, nz)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (nz / len) * 0.5 * 255 + 127
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return out
}

function noiseFill(ctx: CanvasRenderingContext2D, size: number, rnd: () => number, count: number, alpha: number, color = '0,0,0', maxR = 40) {
  for (let i = 0; i < count; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 4 + rnd() * maxR
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${color},${alpha * rnd()})`)
    g.addColorStop(1, `rgba(${color},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

function speckle(ctx: CanvasRenderingContext2D, size: number, rnd: () => number, n: number, light = 255, a = 0.08) {
  for (let i = 0; i < n; i++) {
    const v = rnd() > 0.5 ? light : 0
    ctx.fillStyle = `rgba(${v},${v},${v},${a * rnd()})`
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2)
  }
}

const DRAW: Record<string, Draw> = {
  wallpaper: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#76695a'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    // Hoa văn damask dập nổi
    for (let x = 0; x < S; x += S / 8) {
      for (let y = 0; y < S; y += S / 6) {
        const ox = (Math.floor(y / (S / 6)) % 2) * (S / 16)
        for (const c of [ctx, h]) {
          c.save()
          c.translate(x + ox + S / 16, y + S / 12)
          c.fillStyle = c === ctx ? 'rgba(40,30,20,0.28)' : '#9a9a9a'
          c.beginPath()
          c.ellipse(0, 0, S / 40, S / 22, 0, 0, Math.PI * 2)
          c.fill()
          c.beginPath()
          c.ellipse(0, S / 20, S / 60, S / 50, 0, 0, Math.PI * 2)
          c.fill()
          c.restore()
        }
      }
    }
    for (let x = 0; x < S; x += S / 16) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fillRect(x, 0, 1, S)
    }
    noiseFill(ctx, S, rnd, 26, 0.45, '40,28,14', S / 6)
    // Vệt ẩm chảy dọc
    for (let i = 0; i < 8; i++) {
      const x = rnd() * S
      const g = ctx.createLinearGradient(0, 0, 0, S)
      g.addColorStop(0, 'rgba(50,35,20,0)')
      g.addColorStop(0.4 + rnd() * 0.4, 'rgba(50,35,20,0.28)')
      g.addColorStop(1, 'rgba(50,35,20,0)')
      ctx.fillStyle = g
      ctx.fillRect(x, 0, 3 + rnd() * 10, S)
    }
    // Giấy dán tường bong mép
    h.fillStyle = '#707070'
    for (let i = 0; i < 4; i++) h.fillRect(rnd() * S, rnd() * S, S / 10, 2)
  },
  plaster: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#b3aca0'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    noiseFill(h, S, rnd, 200, 0.3, '255,255,255', 12)
    noiseFill(h, S, rnd, 200, 0.3, '0,0,0', 12)
    noiseFill(ctx, S, rnd, 30, 0.35, '70,60,45', S / 5)
    speckle(ctx, S, rnd, 1500, 255, 0.1)
    // Vết nứt
    for (let i = 0; i < 5; i++) {
      let x = rnd() * S
      let y = rnd() * S
      ctx.strokeStyle = 'rgba(40,30,20,0.5)'
      h.strokeStyle = '#303030'
      ctx.beginPath()
      h.beginPath()
      ctx.moveTo(x, y)
      h.moveTo(x, y)
      for (let k = 0; k < 8; k++) {
        x += (rnd() - 0.5) * 30
        y += rnd() * 20
        ctx.lineTo(x, y)
        h.lineTo(x, y)
      }
      ctx.stroke()
      h.stroke()
    }
  },
  tile: (ctx, S, h, rnd) => {
    const n = 8
    const t = S / n
    ctx.fillStyle = '#6a6e6a'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#303030'
    h.fillRect(0, 0, S, S)
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 200 + rnd() * 30
        ctx.fillStyle = `rgb(${v},${v + 3},${v})`
        ctx.fillRect(x * t + 2, y * t + 2, t - 4, t - 4)
        h.fillStyle = '#b0b0b0'
        h.fillRect(x * t + 2, y * t + 2, t - 4, t - 4)
      }
    noiseFill(ctx, S, rnd, 20, 0.35, '90,70,40', S / 6)
    speckle(ctx, S, rnd, 400, 0, 0.15)
  },
  hospital: (ctx, S, h, rnd) => {
    // Nửa dưới sơn xanh bạc hà, nửa trên tường trắng ngả vàng.
    ctx.fillStyle = '#c9c9bd'
    ctx.fillRect(0, 0, S, S)
    ctx.fillStyle = '#7f9f93'
    ctx.fillRect(0, S * 0.58, S, S * 0.42)
    ctx.fillStyle = '#5a6e66'
    ctx.fillRect(0, S * 0.56, S, S * 0.025)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    h.fillStyle = '#b0b0b0'
    h.fillRect(0, S * 0.555, S, S * 0.03)
    noiseFill(h, S, rnd, 120, 0.15, '0,0,0', 10)
    noiseFill(ctx, S, rnd, 22, 0.35, '80,70,50', S / 5)
    speckle(ctx, S, rnd, 900, 0, 0.12)
  },
  school: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#d8d0b0'
    ctx.fillRect(0, 0, S, S)
    ctx.fillStyle = '#4f7a6a'
    ctx.fillRect(0, S * 0.6, S, S * 0.4)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    noiseFill(h, S, rnd, 150, 0.2, '0,0,0', 8)
    noiseFill(ctx, S, rnd, 30, 0.35, '90,80,50', S / 5)
    // Vết giày, vết tay học sinh
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(20,20,20,${0.08 + rnd() * 0.1})`
      ctx.fillRect(rnd() * S, S * 0.75 + rnd() * S * 0.25, 10 + rnd() * 20, 3 + rnd() * 5)
    }
    speckle(ctx, S, rnd, 900, 0, 0.1)
  },
  brick: (ctx, S, h, rnd) => {
    const rows = 12
    const bh = S / rows
    const bw = S / 4
    ctx.fillStyle = '#5e5850'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#303030'
    h.fillRect(0, 0, S, S)
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (bw / 2)
      for (let x = -bw; x < S + bw; x += bw) {
        const v = 110 + rnd() * 50
        ctx.fillStyle = `rgb(${v},${v * 0.55},${v * 0.42})`
        ctx.fillRect(x + off + 2, r * bh + 2, bw - 4, bh - 4)
        h.fillStyle = `rgb(${170 + rnd() * 40},${170},${170})`
        h.fillRect(x + off + 2, r * bh + 2, bw - 4, bh - 4)
      }
    }
    noiseFill(ctx, S, rnd, 25, 0.4, '20,15,10', S / 5)
  },
  void: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#16121e'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    // Gân như mạch máu, như rễ cây
    for (let i = 0; i < 14; i++) {
      let x = rnd() * S
      let y = rnd() * S
      ctx.strokeStyle = `rgba(${120 + rnd() * 80},40,90,0.35)`
      h.strokeStyle = '#c0c0c0'
      ctx.lineWidth = h.lineWidth = 1 + rnd() * 3
      ctx.beginPath()
      h.beginPath()
      ctx.moveTo(x, y)
      h.moveTo(x, y)
      for (let k = 0; k < 10; k++) {
        x += (rnd() - 0.5) * 60
        y += (rnd() - 0.5) * 60
        ctx.lineTo(x, y)
        h.lineTo(x, y)
      }
      ctx.stroke()
      h.stroke()
    }
  },
  // ---------------------------------------------------------------- sàn
  wood: (ctx, S, h, rnd) => {
    const planks = 8
    const ph = S / planks
    for (let i = 0; i < planks; i++) {
      const v = 72 + rnd() * 30
      ctx.fillStyle = `rgb(${v},${v * 0.68},${v * 0.44})`
      ctx.fillRect(0, i * ph, S, ph)
      h.fillStyle = '#909090'
      h.fillRect(0, i * ph, S, ph)
      for (let k = 0; k < 10; k++) {
        ctx.strokeStyle = `rgba(30,18,8,${0.1 + rnd() * 0.15})`
        ctx.beginPath()
        const y0 = i * ph + rnd() * ph
        ctx.moveTo(0, y0)
        ctx.bezierCurveTo(S * 0.3, y0 + (rnd() - 0.5) * 8, S * 0.6, y0 + (rnd() - 0.5) * 8, S, y0)
        ctx.stroke()
      }
      // Rãnh giữa các tấm ván
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, i * ph, S, 2)
      h.fillStyle = '#202020'
      h.fillRect(0, i * ph, S, 2)
      const cut = rnd() * S
      ctx.fillRect(cut, i * ph, 2, ph)
      h.fillRect(cut, i * ph, 2, ph)
    }
    noiseFill(ctx, S, rnd, 16, 0.3, '0,0,0', S / 6)
  },
  tileFloor: (ctx, S, h, rnd) => {
    const n = 4
    const t = S / n
    h.fillStyle = '#303030'
    h.fillRect(0, 0, S, S)
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 150 + rnd() * 25
        ctx.fillStyle = (x + y) % 2 ? `rgb(${v},${v},${v * 0.96})` : `rgb(${v * 0.32},${v * 0.36},${v * 0.38})`
        ctx.fillRect(x * t, y * t, t, t)
        h.fillStyle = '#a8a8a8'
        h.fillRect(x * t + 2, y * t + 2, t - 4, t - 4)
      }
    ctx.strokeStyle = 'rgba(20,20,20,0.7)'
    ctx.lineWidth = 3
    for (let i = 0; i <= S; i += t) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, S)
      ctx.moveTo(0, i)
      ctx.lineTo(S, i)
      ctx.stroke()
    }
    noiseFill(ctx, S, rnd, 16, 0.3, '60,40,20', S / 6)
  },
  lino: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#56645e'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    speckle(ctx, S, rnd, 3000, 255, 0.12)
    noiseFill(ctx, S, rnd, 14, 0.3, '20,20,20', S / 5)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fillRect(0, S / 2 - 1, S, 2)
  },
  concrete: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#6a6863'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    noiseFill(ctx, S, rnd, 60, 0.3, '30,30,30', S / 8)
    noiseFill(h, S, rnd, 160, 0.25, '0,0,0', 10)
    speckle(ctx, S, rnd, 2500, 255, 0.1)
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = 'rgba(20,20,20,0.5)'
      ctx.beginPath()
      let x = rnd() * S
      let y = 0
      ctx.moveTo(x, y)
      while (y < S) {
        x += (rnd() - 0.5) * 20
        y += 10
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  },
  carpet: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#5a1e1c'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    speckle(h, S, rnd, 5000, 255, 0.4)
    speckle(ctx, S, rnd, 5000, 0, 0.2)
    ctx.strokeStyle = 'rgba(200,160,80,0.35)'
    ctx.lineWidth = 6
    ctx.strokeRect(S * 0.1, S * 0.1, S * 0.8, S * 0.8)
    noiseFill(ctx, S, rnd, 10, 0.3, '0,0,0', S / 5)
  },
  voidFloor: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#0a0810'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    ctx.strokeStyle = 'rgba(140,90,200,0.12)'
    for (let i = 0; i < 30; i++) {
      ctx.beginPath()
      ctx.arc(rnd() * S, rnd() * S, 10 + rnd() * 60, 0, Math.PI * 2)
      ctx.stroke()
    }
  },
  ceilingPlaster: (ctx, S, h, rnd) => {
    ctx.fillStyle = '#5a554c'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#808080'
    h.fillRect(0, 0, S, S)
    noiseFill(ctx, S, rnd, 20, 0.5, '40,30,15', S / 4)
    noiseFill(h, S, rnd, 100, 0.2, '0,0,0', 10)
  },
  ceilingTile: (ctx, S, h, rnd) => {
    const n = 4
    const t = S / n
    ctx.fillStyle = '#3a3a36'
    ctx.fillRect(0, 0, S, S)
    h.fillStyle = '#202020'
    h.fillRect(0, 0, S, S)
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 150 + rnd() * 20
        ctx.fillStyle = `rgb(${v},${v},${v * 0.94})`
        ctx.fillRect(x * t + 3, y * t + 3, t - 6, t - 6)
        h.fillStyle = '#a0a0a0'
        h.fillRect(x * t + 3, y * t + 3, t - 6, t - 6)
        speckle(ctx, S, rnd, 60, 0, 0.3)
      }
    noiseFill(ctx, S, rnd, 10, 0.5, '100,80,40', S / 5)
  },
}

const cache = new Map<string, THREE.MeshStandardMaterial>()

export function surface(kind: string, size = 512, opts: { rough?: number; normal?: number; repeat?: number; emissive?: string } = {}): THREE.MeshStandardMaterial {
  const key = `${kind}|${size}|${JSON.stringify(opts)}`
  const hit = cache.get(key)
  if (hit) return hit
  const [c, ctx] = makeCanvas(size)
  const [hc, hctx] = makeCanvas(size)
  DRAW[kind](ctx, size, hctx, rng(kind.length * 977 + 13))
  const map = new THREE.CanvasTexture(c)
  map.colorSpace = THREE.SRGBColorSpace
  const normalMap = new THREE.CanvasTexture(normalFromHeight(hc, opts.normal ?? 2))
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    if (opts.repeat) t.repeat.set(opts.repeat, opts.repeat)
  }
  const m = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(1, 1),
    roughness: opts.rough ?? 0.85,
    metalness: 0,
    emissive: new THREE.Color(opts.emissive ?? '#000'),
  })
  cache.set(key, m)
  return m
}

export function wallMaterial(style: WallStyle, size: number) {
  switch (style) {
    case 'wallpaper':
      return surface('wallpaper', size, { rough: 0.92, normal: 3 })
    case 'plaster':
      return surface('plaster', size, { rough: 0.95, normal: 2 })
    case 'tile':
      return surface('tile', size, { rough: 0.25, normal: 4 })
    case 'hospital':
      return surface('hospital', size, { rough: 0.6, normal: 2 })
    case 'school':
      return surface('school', size, { rough: 0.8, normal: 2 })
    case 'brick':
      return surface('brick', size, { rough: 0.95, normal: 5 })
    case 'void':
      return surface('void', size, { rough: 0.4, normal: 3, emissive: '#0c0612' })
  }
}

export function floorMaterial(floor: Floor, size: number) {
  switch (floor) {
    case 'wood':
      return surface('wood', size, { rough: 0.55, normal: 3 })
    case 'tile':
      return surface('tileFloor', size, { rough: 0.3, normal: 3 })
    case 'lino':
      return surface('lino', size, { rough: 0.5, normal: 1 })
    case 'concrete':
      return surface('concrete', size, { rough: 0.95, normal: 2 })
    case 'carpet':
      return surface('carpet', size, { rough: 1, normal: 4 })
    case 'void':
      return surface('voidFloor', size, { rough: 0.15, normal: 1 })
  }
}

export function ceilingMaterial(tiles: boolean, size: number) {
  return tiles ? surface('ceilingTile', size, { rough: 0.95, normal: 3 }) : surface('ceilingPlaster', size, { rough: 1, normal: 2 })
}

/* =====================================================================
 * Hậu kỳ: bloom cho bóng đèn, rồi một shader "phim kinh dị":
 * nhiễu hạt, tối viền, quang sai màu và giảm màu khi mất tinh thần.
 * ===================================================================== */

const HorrorShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    fear: { value: 0 },
    danger: { value: 0 },
    hurt: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float fear;
    uniform float danger;
    uniform float hurt;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time * 61.7) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float d = length(c);
      // Méo hình nhẹ khi hoảng loạn
      uv += c * d * d * (0.03 + fear * 0.08) * sin(time * 1.3);
      float ab = 0.0015 + fear * 0.006 + danger * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ab).b;
      // Chỉnh màu: vùng tối ngả xanh lạnh
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.9, 1.0, 1.12), smoothstep(0.35, 0.0, lum) * 0.6);
      col = mix(col, vec3(lum), fear * 0.55);
      // Tối viền
      float vig = smoothstep(0.85, 0.25 - danger * 0.1, d);
      col *= mix(0.35, 1.0, vig);
      // Viền đỏ khi nguy hiểm / bị thương
      col = mix(col, vec3(0.45, 0.0, 0.0), (1.0 - vig) * (danger * 0.6 + hurt * 0.5));
      // Nhiễu hạt
      float n = hash(uv * 800.0) - 0.5;
      col += n * (0.045 + fear * 0.08);
      // Vạch nhiễu ngang thỉnh thoảng
      float line = step(0.996 - fear * 0.01, hash(vec2(floor(uv.y * 240.0), floor(time * 12.0))));
      col += line * 0.08 * fear;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export interface Post {
  composer: EffectComposer
  horror: ShaderPass
  bloom: UnrealBloomPass
  setSize: (w: number, h: number) => void
}

export function makePost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): Post {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.82)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const horror = new ShaderPass(HorrorShader)
  composer.addPass(horror)
  return {
    composer,
    horror,
    bloom,
    setSize: (w, h) => {
      composer.setSize(w, h)
      horror.uniforms.resolution.value.set(w, h)
    },
  }
}

/* =====================================================================
 * Tia sáng đèn pin có bụi bay lơ lửng.
 * ===================================================================== */

export function flashlightBeam(): THREE.Mesh {
  const len = 7
  const geo = new THREE.ConeGeometry(2.1, len, 28, 1, true)
  geo.translate(0, -len / 2, 0)
  geo.rotateX(Math.PI / 2)
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { intensity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying float vLen;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vLen = -position.z / ${len.toFixed(1)};
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float intensity;
      varying float vLen;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float edge = pow(abs(dot(vN, vView)), 1.6);
        float fall = pow(1.0 - clamp(vLen, 0.0, 1.0), 2.2);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * edge * fall * 0.075 * intensity, 1.0);
      }
    `,
  })
  const m = new THREE.Mesh(geo, mat)
  m.renderOrder = 10
  m.frustumCulled = false
  return m
}

export function dustMotes(count = 260): THREE.Points {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 6
    pos[i * 3 + 1] = (Math.random() - 0.5) * 3
    pos[i * 3 + 2] = -Math.random() * 7
    seed[i] = Math.random() * 100
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, intensity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float time;
      varying float vA;
      void main() {
        vec3 p = position;
        p.x += sin(time * 0.3 + seed) * 0.3;
        p.y += sin(time * 0.2 + seed * 1.7) * 0.25;
        p.z = -mod(-p.z + time * 0.05 * (0.5 + fract(seed)), 7.0);
        // Chỉ thấy bụi nằm trong nón sáng
        float ang = length(p.xy) / max(0.1, -p.z);
        vA = smoothstep(0.32, 0.18, ang) * smoothstep(7.0, 1.0, -p.z) * smoothstep(0.2, 0.8, -p.z);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.5 + fract(seed * 3.1) * 2.5) * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float intensity;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * (1.0 - d * 2.0) * vA * 0.6 * intensity, 1.0);
      }
    `,
  })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  pts.renderOrder = 11
  return pts
}
