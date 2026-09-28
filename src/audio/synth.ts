import type { SoundId } from '../engine/types'

/**
 * Âm thanh tổng hợp hoàn toàn bằng Web Audio API — không có file âm thanh ngoài.
 * Âm thanh chỉ được khởi tạo sau lần tương tác đầu tiên của người chơi.
 */
class Synth {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private windGain: GainNode | null = null
  private windStarted = false
  private volume = 0.7
  private muted = false
  private fog = 0.5

  get ready(): boolean {
    return !!this.ctx
  }

  /** Gọi trong một sự kiện người dùng (click/touch). */
  unlock(): void {
    if (typeof window === 'undefined') return
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return
        this.ctx = new Ctor()
        this.master = this.ctx.createGain()
        this.master.connect(this.ctx.destination)
        this.applyVolume()
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      this.startWind()
    } catch {
      this.ctx = null
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    this.applyVolume()
  }

  setMuted(m: boolean): void {
    this.muted = m
    this.applyVolume()
  }

  /** Mật độ sương 0..1 — gió mạnh dần theo thời gian. */
  setFog(f: number): void {
    this.fog = Math.max(0, Math.min(1, f))
    if (this.windGain && this.ctx) {
      this.windGain.gain.setTargetAtTime(0.05 + this.fog * 0.09, this.ctx.currentTime, 1.5)
    }
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return
    const v = this.muted ? 0 : this.volume
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  private noiseBuffer(seconds: number): AudioBuffer | null {
    if (!this.ctx) return null
    const len = Math.floor(this.ctx.sampleRate * seconds)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    // Nhiễu hồng đơn giản cho tiếng gió êm hơn.
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99765 * b0 + w * 0.099046
      b1 = 0.963 * b1 + w * 0.2965164
      b2 = 0.57 * b2 + w * 1.0526913
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18
    }
    return buf
  }

  private startWind(): void {
    if (!this.ctx || !this.master || this.windStarted) return
    const buf = this.noiseBuffer(4)
    if (!buf) return
    this.windStarted = true
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 420
    filter.Q.value = 0.7
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 240
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    this.windGain = this.ctx.createGain()
    this.windGain.gain.value = 0
    src.connect(filter)
    filter.connect(this.windGain)
    this.windGain.connect(this.master)
    src.start()
    lfo.start()
    this.setFog(this.fog)
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, glideTo?: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  private bell(when = 0): void {
    // Chuông chùa: vài họa âm không điều hòa, tắt dần chậm.
    const base = 196
    ;[1, 2.76, 5.4, 8.93].forEach((m, i) => this.tone(base * m, 3.2 - i * 0.6, 'sine', 0.12 / (i + 1), when))
  }

  private drumHit(when = 0): void {
    if (!this.ctx || !this.master) return
    this.tone(95, 0.9, 'sine', 0.6, when, 48)
    const buf = this.noiseBuffer(0.25)
    if (!buf) return
    const t = this.ctx.currentTime + when
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 600
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    src.connect(f)
    f.connect(g)
    g.connect(this.master)
    src.start(t)
  }

  play(id: SoundId): void {
    if (!this.ctx || this.muted) return
    switch (id) {
      case 'click':
        this.tone(880, 0.06, 'triangle', 0.05)
        break
      case 'page':
        this.tone(1320, 0.05, 'sine', 0.035)
        this.tone(1760, 0.07, 'sine', 0.025, 0.05)
        break
      case 'bell':
        this.bell()
        break
      case 'drum':
        this.drumHit()
        break
      case 'drum3':
        this.drumHit(0)
        this.drumHit(1.1)
        this.drumHit(2.2)
        break
      case 'success':
        ;[523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.09, i * 0.09))
        break
      case 'fail':
        this.tone(220, 0.45, 'triangle', 0.1, 0, 150)
        break
      case 'whoosh': {
        const buf = this.noiseBuffer(1.2)
        if (!buf || !this.master) break
        const t = this.ctx.currentTime
        const src = this.ctx.createBufferSource()
        src.buffer = buf
        const f = this.ctx.createBiquadFilter()
        f.type = 'bandpass'
        f.frequency.setValueAtTime(300, t)
        f.frequency.exponentialRampToValueAtTime(1400, t + 1)
        const g = this.ctx.createGain()
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.4)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
        src.connect(f)
        f.connect(g)
        g.connect(this.master)
        src.start(t)
        break
      }
      case 'glitch':
        this.tone(110, 0.3, 'square', 0.05, 0, 55)
        this.tone(1760, 0.08, 'square', 0.03, 0.15)
        break
    }
  }
}

export const synth = new Synth()
