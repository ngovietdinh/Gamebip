import type { Dialogue } from '../../engine/types'
import { clue, flag, hasFlag, HURRY, noFlag } from '../common/helpers'
import { FOLLOW_STRANGER } from './scenes'

export const dialogues: Dialogue[] = [
  {
    id: 'a4_stranger_arrive',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Còn ít thời gian lắm, đi theo tôi.',
        variants: [{ if: hasFlag('deadline_passed'), text: 'Cậu… cậu vẫn còn ở đây. Không sao, không sao. Còn ít thời gian lắm, đi theo tôi.' }],
        effects: [...HURRY],
        next: 'n2',
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Bản đồ trong túi cậu chỉ rõ rồi đấy: bến đò ở xuôi dòng. Đi!',
        effects: [clue('a4_nguoi_la_cuoi')],
      },
    },
  },
  {
    id: 'a4_stranger',
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Sao còn đứng đó? Đi theo tôi, nhanh lên!',
        variants: [{ if: hasFlag('deadline_passed'), text: 'Ngày thứ tư rồi mà… sao sương chưa… Thôi, đi theo tôi, nhanh lên!' }],
        effects: [...HURRY],
        choices: [
          { text: 'Được, tôi đi theo anh.', effects: FOLLOW_STRANGER },
          { text: 'Sao lúc nào anh cũng giục tôi?', next: 'n2' },
          { text: 'Nếu hạn chót có thật, sao anh cứ phải giục?', if: hasFlag('deadline_passed'), next: 'n4' },
          { text: 'Anh cứ đi trước đi.', next: 'n3' },
        ],
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Vì thời gian không chờ ai cả! Nghĩ nhiều thì sương tan mất.',
        effects: [...HURRY],
      },
      n3: {
        speaker: 'nguoi_la',
        text: 'Cậu… cậu sẽ hối hận khi sương tan.',
      },
      n4: {
        speaker: 'nguoi_la',
        text: '…',
        next: 'n5',
      },
      n5: {
        text: 'Hắn không trả lời. Vành nón khẽ run lên như lá gặp gió.',
      },
    },
  },
  {
    id: 'a4_stranger_dock',
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Đừng nghe lão lái đò! Lão hỏi lắt léo để giữ chân cậu đấy. Lên chiếc đò phía dưới kia với tôi, còn kịp!',
        effects: [...HURRY],
        choices: [
          { text: 'Được, đi thôi.', effects: FOLLOW_STRANGER },
          { text: 'Không. Tôi sẽ trả lời câu hỏi của ông ấy.', next: 'n2' },
        ],
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Tùy cậu. Nhưng nhớ cho kỹ ai là người đã dẫn đường cho cậu suốt mấy ngày nay.',
      },
    },
  },
  {
    id: 'a4_co_hang',
    start: [{ if: noFlag('a4_met_hang'), node: 'intro' }, { node: 'menu' }],
    nodes: {
      intro: {
        speaker: 'co_hang',
        text: 'Khách vào nghỉ chân, uống bát nước vối cho ấm? Lâu lắm mới thấy người tỉnh táo đi qua đây.',
        effects: [flag('a4_met_hang')],
        next: 'menu',
      },
      menu: {
        speaker: 'co_hang',
        text: 'Khách muốn hỏi gì?',
        choices: [
          { text: 'Chị có biết người đội nón rộng vành không?', next: 'stranger' },
          { text: 'Bến đò ở đâu hả chị?', next: 'dock' },
          { text: 'Hắn có gì lạ không?', next: 'odd' },
          { text: 'Cảm ơn chị.' },
        ],
      },
      stranger: {
        speaker: 'co_hang',
        text: 'Người đội nón ấy à? Ngày nào hắn cũng dắt một người lạ đi quanh làng. Chưa thấy ai ra được.',
        effects: [clue('a4_co_hang_1')],
        next: 'menu',
      },
      dock: {
        speaker: 'co_hang',
        text: 'Bến đò xưa nay vẫn ở chỗ cũ, phía ngược dòng. Chưa dời đi bao giờ. Ai bảo khách ở xuôi dòng thế?',
        effects: [clue('a4_co_hang_2')],
        next: 'menu',
      },
      odd: {
        speaker: 'co_hang',
        text: 'Lạ chứ. Hắn chẳng bao giờ ăn uống gì, đi trên bùn cũng chẳng để lại dấu chân. Mặt thì chưa ai thấy.',
        effects: [clue('a4_co_hang_3')],
        next: 'menu',
      },
    },
  },
  {
    id: 'a4_lai_do',
    start: [{ if: noFlag('a4_met_do'), node: 'intro' }, { node: 'ask' }],
    nodes: {
      intro: {
        speaker: 'lai_do',
        text: 'Tới được đây là khách đã biết nghe lời nước chảy. Tôi là lái đò.',
        effects: [flag('a4_met_do')],
        next: 'ask',
      },
      ask: {
        speaker: 'lai_do',
        text: 'Tôi chỉ chở ai trả lời được một câu thôi: Ai đã dẫn cậu đi vòng suốt từ đầu tới giờ?',
        effects: [clue('a4_cau_hoi')],
        choices: [
          { text: 'Tôi trả lời được. (Mở phán xử cuối)', effects: [{ t: 'verdict', id: 'v_final' }] },
          { text: 'Để tôi xem lại sổ tay đã.', next: 'wait' },
        ],
      },
      wait: {
        speaker: 'lai_do',
        text: 'Cứ nghĩ cho kỹ. Sông không chảy ngược, không vội được đâu. Nhớ: phải có bằng chứng, ít nhất là hai.',
      },
    },
  },
]
