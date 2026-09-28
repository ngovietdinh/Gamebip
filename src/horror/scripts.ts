import * as THREE from 'three'
import { hAudio } from './audio'
import { FINALE_PHASES } from './chapters/ch4'
import { MEMORY_DOORS } from './chapters'
import { CELL, cellCenter, WALL_H } from './level'
import { plane } from './props'
import { playerNoise } from './sim'
import { useHorror } from './store'
import * as T from './textures'
import type { ChapterId } from './types'
import type { HorrorWorld } from './World'

/**
 * Kịch bản riêng từng chương: cảnh hù, sự kiện đặc biệt, trận đối mặt cuối.
 * World gọi các hàm này; mọi trạng thái tạm lưu trong `w.script`.
 */
export interface ChapterScript {
  build?: (w: HorrorWorld) => void
  update?: (w: HorrorWorld, dt: number, now: number, paused: boolean) => void
  event?: (w: HorrorWorld, id: string) => void
  respawn?: (w: HorrorWorld) => void
}

const num = (w: HorrorWorld, k: string, fb = 0) => (typeof w.script[k] === 'number' ? (w.script[k] as number) : fb)

function dropSanity(amount: number) {
  const s = useHorror.getState()
  useHorror.setState({ sanity: Math.max(0, Math.min(100, s.sanity - amount)) })
}

// ============================================================ CHƯƠNG 1 — CĂN NHÀ
const ch1: ChapterScript = {
  build(w) {
    // Trần sao dạ quang phòng ngủ: chỉ hiện rõ khi tắt đèn pin.
    w.glow = plane(5, 2.5, new THREE.MeshBasicMaterial({ map: T.ceilingGlow(), transparent: true, opacity: 0.05, depthWrite: false, fog: false }))
    w.glow.rotation.x = Math.PI / 2
    w.glow.position.set(3 * CELL, WALL_H - 0.02, 2.6 * CELL)
    w.scene.add(w.glow)
    w.boardFace = (w.props.get('bang_den')?.getObjectByName('boardFace') as THREE.Mesh) ?? null
    w.boardNormal = T.blackboard(false)
    w.boardScary = T.blackboard(true)
  },

  respawn(w) {
    w.script.introT = -1
    w.script.boardLook = 0
  },

  update(w, dt, now, paused) {
    const s = useHorror.getState()

    // Lần đầu bước ra hành lang sau khi mở hộp đồ chơi: nó đứng ở cuối hành lang.
    if (!s.flags.intro_hall && s.solved.includes('toybox') && w.room === 'h' && !paused) {
      s.setFlag('intro_hall')
      w.script.introT = 0
      w.entity.place(7.5 * CELL, 8.5 * CELL, 'dormant')
      w.showEntity(true)
      hAudio.stinger()
      if (w.lamps[1]) w.lamps[1].flicker = 1.5
      w.say('Có thứ gì đó đứng ở cuối hành lang…')
    }
    const introT = num(w, 'introT', -1)
    if (introT >= 0) {
      w.script.introT = introT + dt
      if (introT + dt > 2.6) {
        w.script.introT = -1
        hAudio.lampBurst()
        w.showEntity(false)
        w.entity.place(17.5 * CELL, 1.5 * CELL, 'patrol')
        w.setFlag('entity_active')
        setTimeout(() => w.showEntity(true), 6000)
      }
    }

    // Điện thoại reo trong phòng khách
    hAudio.ring(w.room === 'l' && !s.flags.phone_answered && !paused)

    // Búp bê quay mặt theo bạn khi bạn không nhìn nó
    const dollRoot = w.props.get('bup_be')
    const doll = dollRoot?.getObjectByName('dollBody')
    if (dollRoot && doll && w.room === 'l' && !w.looksAt(dollRoot.position.x, dollRoot.position.z, 0.2, 0.3)) {
      doll.rotation.y = Math.atan2(w.x - dollRoot.position.x, w.z - dollRoot.position.z) - dollRoot.rotation.y
    }

    // Bảng đen đổi chữ sau khi đọc bài kiểm tra
    const board = w.props.get('bang_den')
    if (board && w.room === 'c' && s.notes.includes('n_bai_kiem_tra') && !s.flags.board_scare && !paused) {
      if (w.looksAt(board.position.x, board.position.z, 0.9, 1.7)) w.script.boardLook = num(w, 'boardLook') + dt
      if (num(w, 'boardLook') > 0.5) {
        s.setFlag('board_scare')
        w.script.boardScaryUntil = now + 2600
        hAudio.stinger()
        dropSanity(8)
      }
    }
    if (w.boardFace && w.boardNormal && w.boardScary) {
      const mat = w.boardFace.material as THREE.MeshStandardMaterial
      const want = now < num(w, 'boardScaryUntil') ? w.boardScary : w.boardNormal
      if (mat.map !== want) {
        mat.map = want
        mat.needsUpdate = true
      }
    }

    // Gương: xem xong thì bóng nó lướt qua sau lưng
    if (s.flags.mirror_seen && !s.flags.mirror_scare && !s.modal) {
      s.setFlag('mirror_scare')
      w.cb.scare('mirror')
      hAudio.stinger()
      w.scareUntil = now + 900
    }
  },

  event(w, id) {
    if (id !== 'phone') return
    const s = useHorror.getState()
    hAudio.ring(false)
    if (s.flags.phone_answered) {
      w.say('Đầu dây bên kia chỉ còn tiếng tút tút kéo dài.')
      return
    }
    hAudio.staticNoise(1.2, 0.12)
    useHorror.setState({
      flags: { ...s.flags, phone_answered: true },
      sanity: Math.max(0, s.sanity - 6),
      modal: {
        type: 'examine',
        title: 'Điện thoại bàn',
        text: 'Tiếng thở rè rè qua ống nghe…\n"Con ở đâu? Mẹ về rồi đây. Mở cửa cho mẹ đi con."\nTín hiệu tắt. Cửa nhà vẫn đóng im lìm — và mẹ thì chưa bao giờ gọi về nhà cả.',
      },
    })
  },
}

// ============================================================ CHƯƠNG 2 — TRƯỜNG HỌC
const ch2: ChapterScript = {
  update(w, _dt, _now, paused) {
    const s = useHorror.getState()
    // Bẫy kho thể dục: cửa đóng sầm, nó xuất hiện ngoài hành lang.
    if (w.room === 'g' && !s.flags.c2_kho_trap && !paused) {
      s.setOpen('4', false)
      s.setFlag('c2_kho_trap')
      hAudio.stinger()
      hAudio.giggle(0.8)
      const sp = w.chapter.entity.spawn ?? [24, 5]
      const c = cellCenter(sp[0], sp[1])
      w.entity.place(c.x, c.z, 'patrol')
      w.showEntity(true)
      w.say('RẦM! Cửa kho đóng sập sau lưng. Tiếng cười khúc khích… rồi tiếng bước chân nặng nề ngoài hành lang.')
    }
    // Lấy được chìa cổng: cửa kho bật mở.
    if (s.flags.c2_kho_trap && s.flags['taken:chia_cong'] && !s.flags.c2_reopen) {
      s.setOpen('4', true)
      s.setFlag('c2_reopen')
      w.say('Cánh cửa kho kẽo kẹt hé mở. Cổng trường ở cuối hành lang phía đông — đi nhẹ thôi.')
    }
  },

  event(_w, id) {
    if (id !== 'loa') return
    const s = useHorror.getState()
    hAudio.staticNoise(1.4, 0.16)
    if (!s.flags.loa_heard) {
      s.setFlag('loa_heard')
      dropSanity(5)
      setTimeout(() => hAudio.giggle(0.6), 1200)
    }
    s.openModal({
      type: 'examine',
      title: 'Loa phát thanh',
      text: '(rè rè…) "Thông báo: học sinh Nguyễn Văn An, lớp 5A, đến phòng hiệu trưởng ngay. Em đã trốn đủ lâu rồi."\n(rè rè…) "Các em nhớ: khi đi qua hành lang, luôn nhìn về phía các bạn. Các bạn chỉ đi khi không ai nhìn."\nTiếng nhạc chuông ra chơi méo mó vang lên rồi tắt.',
    })
  },
}

// ============================================================ CHƯƠNG 3 — BỆNH VIỆN
const FUSES = ['fuse1', 'fuse2', 'fuse3']

const ch3: ChapterScript = {
  update(w, _dt, _now, paused) {
    const s = useHorror.getState()
    const power = !!s.flags.power_on
    // Tiếng máy đo nhịp tim trong phòng 306
    const mon = cellCenter(17, 8)
    hAudio.monitor(!paused && Math.hypot(w.x - mon.x, w.z - mon.z) < 9)
    // Tủ điện: cầu chì đã lắp, đèn báo
    const box = w.props.get('tu_dien')
    if (box) {
      FUSES.forEach((f, i) => {
        const slot = box.getObjectByName('slot' + i) as THREE.Mesh | undefined
        if (slot) (slot.material as THREE.MeshStandardMaterial).color.set(s.flags[f] ? '#d8b040' : '#111')
      })
      const led = box.getObjectByName('powerLed') as THREE.Mesh | undefined
      if (led) (led.material as THREE.MeshStandardMaterial).emissive.set(power ? '#20ff40' : '#ff2010')
    }
    const lift = w.props.get('thang_may')?.getObjectByName('elevatorPanel') as THREE.Mesh | undefined
    if (lift) (lift.material as THREE.MeshStandardMaterial).emissiveIntensity = power ? 2.2 : 0.15
  },

  event(w, id) {
    if (id !== 'generator') return
    const s = useHorror.getState()
    if (s.flags.power_on) {
      w.say('Máy phát đang chạy ầm ầm. Thang máy ở cuối hành lang đã có điện.')
      return
    }
    const carried = s.inventory.filter((x) => x === 'cau_chi').length
    const placed = FUSES.filter((f) => s.flags[f]).length
    if (!carried) {
      w.say(`Tủ điện còn trống ${3 - placed} ổ cầu chì. Tìm cầu chì quanh tầng này.`)
      return
    }
    const n = Math.min(carried, 3 - placed)
    s.removeItems('cau_chi', n)
    for (let i = placed; i < placed + n; i++) s.setFlag(FUSES[i])
    hAudio.unlockSound()
    if (placed + n < 3) {
      w.say(`Đã lắp ${n} cầu chì (${placed + n}/3). Còn thiếu ${3 - placed - n}.`)
      return
    }
    s.setFlag('power_on')
    hAudio.lampBurst()
    setTimeout(() => hAudio.stinger(), 500)
    w.say('Cần gạt kéo xuống. Đèn cả tầng bật sáng chói — và từ đâu đó vang lên một tiếng gầm. Nó biết bạn ở đây.')
    if (!s.flags['caught:ch3']) s.unlock('thap_sang')
    s.gainFragment('c3-3', true)
  },
}

// ============================================================ CHƯƠNG 4 — LÕI GIẤC MƠ
/** Điểm xuất hiện của nó trong căn phòng tròn (ô). */
const ARENA_SPOTS: [number, number][] = [
  [2, 2],
  [13, 2],
  [2, 7],
  [13, 7],
  [7, 1],
  [4, 5],
  [11, 5],
]

function finaleSpawn(w: HorrorWorld) {
  let best = ARENA_SPOTS[0]
  let bestScore = -Infinity
  for (const sp of ARENA_SPOTS) {
    const c = cellCenter(sp[0], sp[1])
    const d = Math.hypot(c.x - w.x, c.z - w.z)
    const score = (d > 7 && d < 18 ? 10 : 0) + Math.random() * 6
    if (score > bestScore) {
      bestScore = score
      best = sp
    }
  }
  const c = cellCenter(best[0], best[1])
  w.entity.place(c.x, c.z, 'confront')
  w.showEntity(true)
  hAudio.lampBurst(Math.max(-1, Math.min(1, (c.x - w.x) / 8)))
}

const ch4: ChapterScript = {
  respawn(w) {
    w.script.phaseWait = 2.5
    w.script.held = 0
    w.confrontProgress = -1
    w.showEntity(false)
    w.entity.state = 'dormant'
  },

  update(w, dt, now, paused) {
    const s = useHorror.getState()
    const phases = FINALE_PHASES.length
    const inArena = w.z < 9 * CELL
    if (!inArena && !s.flags.finale_started) {
      w.confrontProgress = -1
      return
    }
    if (!s.flags.finale_started) {
      s.setFlag('finale_started')
      w.script.phaseWait = 2.5
      hAudio.sob()
      w.say('Tiếng khóc vọng ra từ chiếc tủ khổng lồ. Và tiếng bước chân… Đừng chạy. Soi đèn vào nó.')
    }
    const phase = num(w, 'phase')
    w.confrontProgress = (phase + Math.min(1, num(w, 'held') / FINALE_PHASES[Math.min(phase, phases - 1)])) / phases
    if (paused || s.screen !== 'play') return

    // Tiếng nức nở chỉ hướng
    w.script.sobT = num(w, 'sobT', 3) - dt
    if (num(w, 'sobT') <= 0) {
      w.script.sobT = 4 + Math.random() * 2
      hAudio.sob()
    }

    // Giữa các lần xuất hiện: bóng tối yên lặng
    const wait = num(w, 'phaseWait')
    if (wait > 0) {
      w.script.phaseWait = wait - dt
      if (wait - dt <= 0) {
        w.script.held = 0
        finaleSpawn(w)
        if (phase === 0) w.say('Nó ở đây. Quay lại, tìm nó, và giữ đèn soi thẳng vào nó.')
      }
      return
    }
    if (!w.rig.root.visible) return

    // Soi đèn thẳng vào nó: nó khựng lại và tan dần.
    const lit = s.lightOn && s.battery > 0 && !s.hidden && w.entityVisible && w.looksAt(w.entity.x, w.entity.z, 0.95, 1.4) && w.entityDist < 16
    if (lit) {
      w.script.held = num(w, 'held') + dt
      w.rig.root.position.x += (Math.random() - 0.5) * 0.06
      if (Math.random() < dt * 3) hAudio.staticNoise(0.15, 0.08)
    } else {
      w.script.held = Math.max(0, num(w, 'held') - dt * 0.4)
      const ev = w.entity.step(dt * (w.entityVisible ? 1 : 1.6), { x: w.x, z: w.z, lightOn: s.lightOn, hidden: !!s.hidden, noise: playerNoise(false, false) })
      if (ev.step) hAudio.entityStep(Math.max(0, 1 - w.entityDist / 16), 0)
      if (ev.caught) {
        w.onCaught('catch')
        return
      }
    }
    if (num(w, 'held') >= FINALE_PHASES[phase]) {
      hAudio.scream()
      w.showEntity(false)
      w.entity.state = 'dormant'
      w.script.held = 0
      const next = phase + 1
      w.script.phase = next
      if (next >= phases) {
        w.confrontProgress = 1
        w.say('Cái bóng vỡ ra như sương. Sau lưng nó chỉ là một đứa trẻ ngồi co ro trong tủ… là bạn.')
        w.scareUntil = now + 3000
        setTimeout(() => useHorror.getState().finish(), 2600)
        return
      }
      w.script.phaseWait = 2 + Math.random() * 1.5
      w.say(next === 1 ? 'Nó tan biến… rồi tiếng bước chân lại vang lên ở phía khác.' : 'Nó yếu dần. Thêm một lần nữa thôi.')
    }
  },

  event(_w, id) {
    const door = MEMORY_DOORS[id]
    if (!door) return
    const s = useHorror.getState()
    if (!s.flags['seen:' + id]) {
      s.setFlag('seen:' + id)
      useHorror.setState({ sanity: Math.min(100, s.sanity + 15) })
    }
    hAudio.creak()
    s.openModal({ type: 'examine', title: door.title, text: door.text })
  },
}

export const CHAPTER_SCRIPTS: Partial<Record<ChapterId, ChapterScript>> = { ch1, ch2, ch3, ch4 }

