import type { Dialogue } from '../../engine/types'
import { clue, flag, hasFlag, HURRY, noFlag } from '../common/helpers'

export const dialogues: Dialogue[] = [
  {
    id: 'a3_stranger_edge',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        text: 'Rừng trúc cao vút, lá xào xạc trong sương. Bên trái bìa rừng có một túp lều tranh khói bay lững lờ.',
        next: 'n2',
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Rừng này đi thẳng là ra. Nhanh chân lên, sắp hết thời gian rồi.',
        effects: [clue('a3_nguoi_la_rung'), ...HURRY],
        choices: [
          { text: 'Còn cái lều kia là của ai?', next: 'n3' },
          { text: 'Được rồi.' },
        ],
      },
      n3: {
        speaker: 'nguoi_la',
        text: 'Lều ông đồ gàn. Toàn đố với đoán, mất thời gian lắm. Đừng ghé.',
        effects: [...HURRY],
      },
    },
  },
  {
    id: 'a3_thay_do',
    start: [
      { if: hasFlag('a3_riddles_done'), node: 'done' },
      { if: noFlag('a3_met'), node: 'intro' },
      { node: 'ask' },
    ],
    nodes: {
      intro: {
        speaker: 'thay_do',
        text: 'Khách lạc vào rừng trúc à? Rừng này không có lối cho kẻ vội.',
        effects: [flag('a3_met')],
        next: 'intro2',
      },
      intro2: {
        speaker: 'thay_do',
        text: 'Muốn ta chỉ lối ra thì giải cho ta ba câu đố. Cần gợi ý thì cứ xin — nhưng mỗi lần xin là một lần đầu óc mụ đi đấy.',
        next: 'ask',
      },
      ask: {
        speaker: 'thay_do',
        text: 'Nào, khách tính sao?',
        choices: [
          { text: 'Xin thầy ra đề.', effects: [{ t: 'puzzleSeq', id: 'a3' }] },
          { text: 'Thầy có lời khuyên gì về rừng trúc không?', next: 'advice' },
          { text: 'Người đội nón bảo thầy là ông đồ gàn.', next: 'gan' },
          { text: 'Để con suy nghĩ đã.' },
        ],
      },
      gan: {
        speaker: 'thay_do',
        text: 'Hắn bảo vậy à? Kẻ nào sợ người khác nghĩ chậm, kẻ ấy có điều muốn giấu.',
        next: 'ask',
      },
      advice: {
        speaker: 'thay_do',
        text: 'Rừng trúc đầy ảo ảnh. Nhớ lấy: bóng bao giờ cũng quay lưng về phía mặt trời. Lối nào có bóng trúc đổ về phía mặt trời thì đó là ảo ảnh.',
        effects: [clue('a3_bong')],
        next: 'advice2',
      },
      advice2: {
        speaker: 'thay_do',
        text: 'Mà mặt trời thì đâu có đứng yên. Sáng mọc đằng đông, chiều ngả về tây. Đêm có trăng, trăng cũng mọc đằng đông.',
        effects: [clue('a3_mat_troi')],
        next: 'back',
      },
      back: {
        speaker: 'thay_do',
        text: 'Còn gì nữa không?',
        choices: [
          { text: 'Xin thầy ra đề.', if: noFlag('a3_riddles_done'), effects: [{ t: 'puzzleSeq', id: 'a3' }] },
          { text: 'Thầy nhắc lại chỗ lối ra?', if: hasFlag('a3_riddles_done'), next: 'done' },
          { text: 'Con đi đây.' },
        ],
      },
      done: {
        speaker: 'thay_do',
        text: 'Lối ra nằm ở chỗ cá đuối — khách đã hiểu rồi: cuối đá. Và nhớ lời ta dặn: khi thấy chữ kết thúc, hãy nhìn vào chữ tròn như cửa.',
        choices: [
          { text: 'Thầy nhắc lại chuyện bóng trúc?', next: 'advice' },
          { text: 'Con cảm ơn thầy.' },
        ],
      },
    },
  },
  {
    id: 'a3_final',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'thay_do',
        text: 'Giỏi. Người xưa hay nói lái để giấu ý — và khách đã nhìn ra: cá đuối là cuối đá. Lối ra nằm phía sau tảng đá lớn.',
        effects: [clue('a3_cuoi_da')],
        next: 'n2',
      },
      n2: {
        speaker: 'thay_do',
        text: 'Ta dặn thêm một câu, nhớ cho kỹ: khi thấy chữ kết thúc, hãy nhìn vào chữ tròn như cửa.',
        effects: [clue('a3_chu_tron')],
        next: 'n3',
      },
      n3: {
        speaker: 'thay_do',
        text: 'Còn tới được tảng đá hay không thì tùy khách nhìn bóng trúc. Bóng bao giờ cũng quay lưng về phía mặt trời.',
        effects: [clue('a3_bong')],
      },
    },
  },
]
