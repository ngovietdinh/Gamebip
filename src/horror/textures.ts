import * as THREE from 'three'
import { BLACKBOARD, BLACKBOARD_SCARY, CEILING_CODE, mirrorDisplay, PHOTOS } from './content'

/** Texture vẽ bằng canvas — không có file ảnh ngoài. */
function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  t.anisotropy = 4
  return t
}

function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

export function wallpaper(): THREE.CanvasTexture {
  return canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = '#6d6252'
    ctx.fillRect(0, 0, 256, 256)
    // Hoa văn giấy dán tường cũ
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'
    ctx.lineWidth = 3
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath()
      for (let y = 0; y <= 256; y += 8) ctx.lineTo(x + Math.sin(y / 16) * 6, y)
      ctx.stroke()
    }
    const r = rand(3)
    // Vết ố, vết ẩm mốc
    for (let i = 0; i < 18; i++) {
      const g = ctx.createRadialGradient(r() * 256, r() * 256, 1, r() * 256, r() * 256, 30 + r() * 40)
      g.addColorStop(0, 'rgba(30,22,12,0.35)')
      g.addColorStop(1, 'rgba(30,22,12,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 256, 256)
    }
    ctx.fillStyle = 'rgba(20,15,10,0.5)'
    ctx.fillRect(0, 236, 256, 20)
  })
}

export function woodFloor(): THREE.CanvasTexture {
  return canvasTex(256, 256, (ctx) => {
    const r = rand(9)
    for (let i = 0; i < 8; i++) {
      const v = 70 + r() * 30
      ctx.fillStyle = `rgb(${v},${v * 0.7},${v * 0.45})`
      ctx.fillRect(0, i * 32, 256, 32)
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, i * 32, 256, 2)
      ctx.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32)
      for (let k = 0; k < 6; k++) {
        ctx.strokeStyle = 'rgba(30,20,10,0.25)'
        ctx.beginPath()
        ctx.moveTo(0, i * 32 + 6 + k * 4)
        ctx.bezierCurveTo(80, i * 32 + r() * 30, 170, i * 32 + r() * 30, 256, i * 32 + 6 + k * 4)
        ctx.stroke()
      }
    }
  })
}

export function tileFloor(): THREE.CanvasTexture {
  return canvasTex(256, 256, (ctx) => {
    const r = rand(5)
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const v = 150 + r() * 30
        ctx.fillStyle = (x + y) % 2 ? `rgb(${v},${v},${v * 0.95})` : `rgb(${v * 0.35},${v * 0.38},${v * 0.4})`
        ctx.fillRect(x * 64, y * 64, 64, 64)
      }
    ctx.strokeStyle = 'rgba(20,20,20,0.6)'
    ctx.lineWidth = 3
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 256)
      ctx.moveTo(0, i)
      ctx.lineTo(256, i)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(40,20,10,0.25)'
    for (let i = 0; i < 12; i++) ctx.fillRect(r() * 256, r() * 256, 20 + r() * 40, 3 + r() * 6)
  })
}

export function linoFloor(): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#4c5a55'
    ctx.fillRect(0, 0, 128, 128)
    const r = rand(11)
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},255,0.05)`
      ctx.fillRect(r() * 128, r() * 128, 2, 2)
    }
  })
}

export function ceiling(): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#4a463f'
    ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.strokeRect(0, 0, 128, 128)
  })
}

/** Sao dạ quang + mật mã trên trần phòng ngủ: chỉ hiện rõ khi tắt đèn. */
export function ceilingGlow(): THREE.CanvasTexture {
  return canvasTex(512, 256, (ctx) => {
    ctx.clearRect(0, 0, 512, 256)
    const r = rand(21)
    ctx.fillStyle = '#b8ffb0'
    const star = (x: number, y: number, s: number) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        const rr = i % 2 ? s * 0.45 : s
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
      }
      ctx.fill()
    }
    for (let i = 0; i < 26; i++) star(r() * 512, r() * 256, 4 + r() * 6)
    ctx.shadowColor = '#b8ffb0'
    ctx.shadowBlur = 18
    ctx.font = 'bold 110px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(CEILING_CODE.split('').join('  '), 256, 170)
  })
}

export function clockFace(): THREE.CanvasTexture {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = '#e8e0cc'
    ctx.beginPath()
    ctx.arc(64, 64, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.font = 'bold 14px Georgia'
    ctx.textAlign = 'center'
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2
      ctx.fillText(String(i), 64 + Math.cos(a) * 48, 69 + Math.sin(a) * 48)
    }
    const hand = (ang: number, len: number, w: number) => {
      ctx.lineWidth = w
      ctx.strokeStyle = '#111'
      ctx.beginPath()
      ctx.moveTo(64, 64)
      ctx.lineTo(64 + Math.cos(ang - Math.PI / 2) * len, 64 + Math.sin(ang - Math.PI / 2) * len)
      ctx.stroke()
    }
    // 3 giờ 17 phút
    hand(((3 + 17 / 60) / 12) * Math.PI * 2, 28, 5)
    hand((17 / 60) * Math.PI * 2, 42, 3)
  })
}

export function blackboard(scary = false): THREE.CanvasTexture {
  return canvasTex(1024, 384, (ctx) => {
    ctx.fillStyle = '#1e2b24'
    ctx.fillRect(0, 0, 1024, 384)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * 1024, Math.random() * 384, 120, 30)
    ctx.fillStyle = scary ? '#ff6b6b' : '#f2f2e8'
    ctx.font = scary ? 'bold 70px Georgia, serif' : '52px Georgia, serif'
    const lines = scary ? BLACKBOARD_SCARY : BLACKBOARD
    lines.forEach((l, i) => ctx.fillText(l, 50, 100 + i * (scary ? 100 : 105)))
  })
}

export function photoTex(i: number): THREE.CanvasTexture {
  const p = PHOTOS[i]
  return canvasTex(200, 240, (ctx) => {
    ctx.fillStyle = '#d9cfb8'
    ctx.fillRect(0, 0, 200, 240)
    ctx.fillStyle = '#8b8574'
    ctx.fillRect(12, 12, 176, 170)
    ctx.fillStyle = '#2a2621'
    for (let k = 0; k < p.people; k++) {
      const x = p.people === 1 ? 100 : 36 + k * (128 / (p.people - 1))
      const h = k === p.people - 1 && p.people > 2 ? 60 : 90
      ctx.beginPath()
      ctx.arc(x, 182 - h - 14, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - 15, 182 - h, 30, h)
    }
    // Những khuôn mặt bị cào xước
    ctx.strokeStyle = 'rgba(240,240,230,0.6)'
    ctx.lineWidth = 2
    for (let k = 0; k < 6; k++) {
      ctx.beginPath()
      ctx.moveTo(20 + Math.random() * 160, 30 + Math.random() * 40)
      ctx.lineTo(20 + Math.random() * 160, 30 + Math.random() * 40)
      ctx.stroke()
    }
    ctx.fillStyle = '#3a2a1c'
    ctx.font = 'bold 30px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText(String(p.year), 100, 222)
  })
}

/** Chữ trên gương: lật ngang (như chữ viết lên gương nhìn từ trong phòng). */
export function mirrorTex(): THREE.CanvasTexture {
  return canvasTex(256, 320, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 256, 320)
    g.addColorStop(0, '#6f7d86')
    g.addColorStop(1, '#2a3036')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 320)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(20, 0, 30, 320)
    ctx.save()
    ctx.translate(256, 0)
    ctx.scale(-1, 1)
    ctx.fillStyle = 'rgba(160,20,20,0.85)'
    ctx.font = 'bold 72px Georgia'
    ctx.textAlign = 'center'
    ctx.fillText(mirrorDisplay(), 128, 150)
    ctx.font = 'bold 22px Georgia'
    ctx.fillText('ĐỪNG NHÌN SAU LƯNG', 128, 230)
    ctx.restore()
  })
}

export function scrawlTex(lines: string[], color = '#8a1c14'): THREE.CanvasTexture {
  return canvasTex(512, 256, (ctx) => {
    ctx.clearRect(0, 0, 512, 256)
    ctx.fillStyle = color
    ctx.font = 'bold 44px "Comic Sans MS", cursive'
    lines.forEach((l, i) => {
      ctx.save()
      ctx.translate(20, 70 + i * 60)
      ctx.rotate((Math.random() - 0.5) * 0.06)
      ctx.fillText(l, 0, 0)
      ctx.restore()
    })
  })
}

export function paperTex(): THREE.CanvasTexture {
  return canvasTex(64, 80, (ctx) => {
    ctx.fillStyle = '#e8e2d0'
    ctx.fillRect(0, 0, 64, 80)
    ctx.fillStyle = '#556'
    for (let i = 0; i < 8; i++) ctx.fillRect(6, 10 + i * 8, 40 + Math.random() * 12, 2)
  })
}

export function keypadTex(): THREE.CanvasTexture {
  return canvasTex(64, 96, (ctx) => {
    ctx.fillStyle = '#222'
    ctx.fillRect(0, 0, 64, 96)
    ctx.fillStyle = '#5a8'
    ctx.fillRect(8, 8, 48, 14)
    ctx.fillStyle = '#999'
    for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) ctx.fillRect(8 + x * 17, 30 + y * 16, 13, 12)
  })
}
