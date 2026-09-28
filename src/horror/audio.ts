/**
 * Âm thanh kinh dị tổng hợp bằng Web Audio API — không dùng file âm thanh.
 * Gồm: nền u ám, nhịp tim, bước chân, tiếng thì thầm, tiếng rít khi bị phát hiện, tiếng hét khi bị bắt.
 */
class HorrorAudio {
  ctx: AudioContext | null = null
  private master: GainNode | null = null
  private droneGain: GainNode | null = null
  private whisperGain: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private heartTimer = 0
  private bpm = 70
  private heartVol = 0.3
  private ringing: number | null = null
  private monitoring: number | null = null
  private mood = ''
  private moodGain: GainNode | null = null
  private moodNodes: AudioScheduledSourceNode[] = []
  volume = 0.8
  reduce = false

  unlock(): void {
    if (typeof window === 'undefined') return
    try {
      if (!this.ctx) {
        const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!C) return
        this.ctx = new C()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.volume
        this.master.connect(this.ctx.destination)
        this.noiseBuf = this.makeNoise(3)
        this.startDrone()
        this.startWhisper()
        this.scheduleHeart()
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      this.ctx = null
    }
  }

  setVolume(v: number): void {
    this.volume = v
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1)
  }

  /** Tắt/mở toàn bộ âm thanh khi rời màn chơi. */
  setActive(on: boolean): void {
    if (!this.ctx) return
    if (on) void this.ctx.resume()
    else void this.ctx.suspend()
  }

  private makeNoise(sec: number): AudioBuffer | null {
    if (!this.ctx) return null
    const len = Math.floor(this.ctx.sampleRate * sec)
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return b
  }

  private noiseSrc(loop = false): AudioBufferSourceNode | null {
    if (!this.ctx || !this.noiseBuf) return null
    const s = this.ctx.createBufferSource()
    s.buffer = this.noiseBuf
    s.loop = loop
    return s
  }

  private startDrone(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    this.droneGain = ctx.createGain()
    this.droneGain.gain.value = 0.16
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    lp.connect(this.droneGain)
    this.droneGain.connect(this.master)
    // Hai nốt trầm lệch nhịp tạo cảm giác bất an.
    for (const [f, detune] of [
      [55, 0],
      [58.3, 7],
      [82.4, -5],
    ]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = f
      o.detune.value = detune
      const g = ctx.createGain()
      g.gain.value = 0.18
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + Math.random() * 0.08
      const lg = ctx.createGain()
      lg.gain.value = 0.12
      lfo.connect(lg)
      lg.connect(g.gain)
      o.connect(g)
      g.connect(lp)
      o.start()
      lfo.start()
    }
    const n = this.noiseSrc(true)
    if (n) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 180
      bp.Q.value = 0.5
      const g = ctx.createGain()
      g.gain.value = 0.25
      n.connect(bp)
      bp.connect(g)
      g.connect(lp)
      n.start()
    }
  }

  /** Tiếng thì thầm: nhiễu lọc qua các dải "nguyên âm", to dần khi tinh thần thấp. */
  private startWhisper(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const n = this.noiseSrc(true)
    if (!n) return
    this.whisperGain = ctx.createGain()
    this.whisperGain.gain.value = 0
    const pan = ctx.createStereoPanner()
    const panLfo = ctx.createOscillator()
    panLfo.frequency.value = 0.13
    panLfo.connect(pan.pan)
    for (const f of [700, 1200, 2400]) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f
      bp.Q.value = 9
      const flfo = ctx.createOscillator()
      flfo.frequency.value = 2 + Math.random() * 3
      const fg = ctx.createGain()
      fg.gain.value = f * 0.25
      flfo.connect(fg)
      fg.connect(bp.frequency)
      flfo.start()
      n.connect(bp)
      bp.connect(this.whisperGain)
    }
    const trem = ctx.createOscillator()
    trem.frequency.value = 4.5
    const tg = ctx.createGain()
    tg.gain.value = 0.5
    trem.connect(tg)
    tg.connect(this.whisperGain.gain)
    trem.start()
    this.whisperGain.connect(pan)
    pan.connect(this.master)
    n.start()
    panLfo.start()
  }

  /** Cập nhật theo trạng thái: nhịp tim, độ to tiếng thì thầm và nền. */
  update(bpm: number, sanity: number, danger: number, mood = 'house'): void {
    if (mood !== this.mood) this.setMood(mood)
    this.bpm = bpm
    this.heartVol = 0.15 + Math.min(1, danger + (100 - sanity) / 150) * 0.55
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.whisperGain?.gain.setTargetAtTime(sanity < 45 ? ((45 - sanity) / 45) * 0.9 : 0, t, 0.8)
    this.droneGain?.gain.setTargetAtTime(0.12 + danger * 0.2, t, 0.5)
  }

 /** Âm nền riêng mỗi chương: gió rít (nhà), gió lùa hành lang (trường), điện rì (bệnh viện), âm trầm vọng (giấc mơ). */
  private setMood(mood: string): void {
    this.mood = mood
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    for (const n of this.moodNodes) {
      try {
        n.stop()
      } catch {
        /* đã dừng */
      }
    }
    this.moodNodes = []
    this.moodGain?.disconnect()
    this.moodGain = ctx.createGain()
    this.moodGain.gain.value = 0
    this.moodGain.gain.setTargetAtTime(1, ctx.currentTime, 2)
    this.moodGain.connect(this.master)
    const out = this.moodGain
    const osc = (f: number, type: OscillatorType, vol: number) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = vol
      o.connect(g)
      g.connect(out)
      o.start()
      this.moodNodes.push(o)
      return { o, g }
    }
    const wind = (freq: number, q: number, vol: number, lfoRate: number) => {
      const n = this.noiseSrc(true)
      if (!n) return
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = freq
      bp.Q.value = q
      const lfo = ctx.createOscillator()
      lfo.frequency.value = lfoRate
      const lg = ctx.createGain()
      lg.gain.value = freq * 0.4
      lfo.connect(lg)
      lg.connect(bp.frequency)
      const g = ctx.createGain()
      g.gain.value = vol
      n.connect(bp)
      bp.connect(g)
      g.connect(out)
      n.start()
      lfo.start()
      this.moodNodes.push(n, lfo)
    }
    if (mood === 'house') wind(500, 3, 0.05, 0.07)
    else if (mood === 'school') {
      wind(900, 6, 0.04, 0.11)
      osc(1760, 'sine', 0.004)
    } else if (mood === 'hospital') {
      osc(50, 'sawtooth', 0.02)
      osc(100, 'square', 0.006)
      wind(3000, 1, 0.01, 0.05)
    } else if (mood === 'void') {
      const a = osc(36.7, 'sine', 0.12)
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.08
      const lg = ctx.createGain()
      lg.gain.value = 0.08
      lfo.connect(lg)
      lg.connect(a.g.gain)
      lfo.start()
      this.moodNodes.push(lfo)
      osc(73.6, 'triangle', 0.03)
      wind(250, 2, 0.05, 0.03)
    }
  }

  private scheduleHeart = (): void => {
    const beat = () => {
      if (this.ctx && this.ctx.state === 'running') {
        this.thump(0, this.heartVol)
        this.thump(0.14, this.heartVol * 0.7)
      }
      this.heartTimer = window.setTimeout(beat, 60000 / Math.max(40, this.bpm))
    }
    window.clearTimeout(this.heartTimer)
    beat()
  }

  private thump(when: number, vol: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + when
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(62, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.16)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    o.connect(g)
    g.connect(this.master)
    o.start(t)
    o.stop(t + 0.25)
  }

  private burst(opts: { freq: number; q?: number; dur: number; vol: number; pan?: number; type?: BiquadFilterType; sweepTo?: number }): void {
    if (!this.ctx || !this.master) return
    const n = this.noiseSrc()
    if (!n) return
    const t = this.ctx.currentTime
    const f = this.ctx.createBiquadFilter()
    f.type = opts.type ?? 'bandpass'
    f.frequency.setValueAtTime(opts.freq, t)
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + opts.dur)
    f.Q.value = opts.q ?? 1
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.vol), t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
    const p = this.ctx.createStereoPanner()
    p.pan.value = opts.pan ?? 0
    n.connect(f)
    f.connect(g)
    g.connect(p)
    p.connect(this.master)
    n.start(t)
    n.stop(t + opts.dur + 0.05)
  }

  private tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', when = 0, glide?: number): void {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + when
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(this.master)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  footstep(run: boolean, mood = 'house'): void {
    const hard = mood === 'hospital' || mood === 'school'
    const base = mood === 'void' ? 260 : hard ? 900 : 420
    this.burst({ freq: run ? base * 1.3 : base, q: hard ? 1.6 : 0.8, dur: hard ? 0.07 : 0.09, vol: (run ? 0.22 : 0.1) * (mood === 'void' ? 0.6 : 1), type: hard ? 'bandpass' : 'lowpass' })
  }

  /** Một nốt đàn piano (0 = Đô … 6 = Si), hơi lạc điệu cho rợn. */
  note(i: number): void {
    const f = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9][i] ?? 261.6
    this.tone(f, 1.2, 0.12, 'triangle')
    this.tone(f * 2.01, 0.8, 0.03, 'sine')
  }

  /** Tiếng khúc khích trẻ con (bóng học sinh vừa cử động). */
  giggle(vol = 0.5): void {
    if (vol < 0.03) return
    const v = (this.reduce ? 0.5 : 1) * vol * 0.07
    const base = 700 + Math.random() * 200
    for (let i = 0; i < 5; i++) this.tone(base + (i % 2) * 120 - i * 25, 0.09, v, 'triangle', i * 0.11, base * 0.9)
  }

  /** Máy đo nhịp tim bệnh viện: tít… tít… */
  monitor(on: boolean): void {
    if (!on) {
      if (this.monitoring) window.clearInterval(this.monitoring)
      this.monitoring = null
      return
    }
    if (this.monitoring) return
    const b = () => this.tone(988, 0.12, 0.05, 'sine')
    b()
    this.monitoring = window.setInterval(b, 1100)
  }

  /** Bước chân nặng nề của Kẻ Không Mặt, `vol` và `pan` theo vị trí. */
  entityStep(vol: number, pan: number): void {
    if (vol < 0.02) return
    this.tone(48, 0.35, vol * 0.8, 'sine', 0, 30)
    this.burst({ freq: 200, q: 0.7, dur: 0.18, vol: vol * 0.5, pan, type: 'lowpass' })
  }

  /** Tiếng rít chói tai khi bị phát hiện. */
  stinger(): void {
    const v = this.reduce ? 0.12 : 0.28
    ;[233, 247, 370, 392].forEach((f, i) => this.tone(f, 1.6, v / 2, 'sawtooth', i * 0.02))
    this.burst({ freq: 3000, q: 2, dur: 1.2, vol: v, sweepTo: 600 })
  }

  /** Tiếng hét khi bị bắt. */
  scream(): void {
    const v = this.reduce ? 0.15 : 0.45
    this.tone(880, 0.9, v * 0.6, 'sawtooth', 0, 220)
    this.tone(930, 0.9, v * 0.5, 'square', 0, 180)
    this.burst({ freq: 2500, q: 0.6, dur: 1.1, vol: v, sweepTo: 400 })
  }

  staticNoise(dur = 0.4, vol = 0.18): void {
    this.burst({ freq: 4000, q: 0.3, dur, vol, type: 'highpass' })
  }

  click(): void {
    this.tone(1400, 0.04, 0.08, 'square')
  }

  beep(): void {
    this.tone(1200, 0.08, 0.08, 'sine')
  }

  error(): void {
    this.tone(160, 0.35, 0.18, 'square')
  }

  unlockSound(): void {
    this.tone(600, 0.1, 0.12, 'triangle')
    this.tone(900, 0.2, 0.12, 'triangle', 0.1)
    this.burst({ freq: 1500, q: 4, dur: 0.12, vol: 0.1 })
  }

  creak(): void {
    this.tone(180, 1.1, 0.06, 'sawtooth', 0, 120)
    this.tone(260, 0.8, 0.04, 'sawtooth', 0.2, 310)
  }

  lampBurst(pan = 0): void {
    this.burst({ freq: 5000, q: 1, dur: 0.25, vol: 0.3, pan, type: 'highpass' })
    this.tone(90, 0.3, 0.1, 'square')
  }

  pickup(): void {
    this.tone(700, 0.08, 0.08, 'triangle')
    this.tone(1050, 0.12, 0.06, 'triangle', 0.06)
  }

  ring(on: boolean): void {
    if (!on) {
      if (this.ringing) window.clearInterval(this.ringing)
      this.ringing = null
      return
    }
    if (this.ringing) return
    const r = () => {
      for (let i = 0; i < 8; i++) this.tone(i % 2 ? 480 : 440, 0.12, 0.06, 'square', i * 0.12)
    }
    r()
    this.ringing = window.setInterval(r, 3000)
  }

  /** Tiếng trẻ con nức nở (đoạn cuối). */
  sob(): void {
    for (let i = 0; i < 4; i++) this.tone(520 - i * 30, 0.35, 0.05, 'triangle', i * 0.45, 380)
  }
}

export const hAudio = new HorrorAudio()
