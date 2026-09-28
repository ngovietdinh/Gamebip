import type { Condition, Dialogue } from '../../engine/types'
import { all, any, clue, flag, FIRST_LOOP, hasFlag, HURRY, LATER_LOOP, noFlag, when } from '../common/helpers'

/**
 * Bà lão nói ngược vào buổi Tối ở lần chơi đầu; từ lần chơi thứ 2 trở đi,
 * bà nói ngược vào buổi Sáng.
 */
export const BA_LIES: Condition = any(
  all(FIRST_LOOP, { t: 'tod', in: ['toi'] }),
  all(LATER_LOOP, { t: 'tod', in: ['sang'] }),
)

export const dialogues: Dialogue[] = [
  {
    id: 'a1_intro',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        text: 'Bạn mở mắt. Tiếng người mua kẻ bán rì rầm quanh bạn, nhưng khuôn mặt ai cũng nhòe trong sương. Bạn không nhớ mình đã đến đây bằng cách nào.',
        variants: [
          {
            if: LATER_LOOP,
            text: 'Bạn mở mắt. Lại là chợ phiên này. Lại là sương. Trong túi áo, cuốn sổ tay vẫn còn nguyên những dòng chữ của chính bạn.',
          },
        ],
        next: 'n2',
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Chào lữ khách. Tôi là người dẫn đường của làng này.',
        next: 'n3',
      },
      n3: {
        speaker: 'nguoi_la',
        text: 'Nghe cho kỹ: sương sẽ tan sau 3 ngày. Ai còn kẹt trong làng lúc đó sẽ ở lại mãi mãi.',
        effects: [clue('a1_han_chot')],
        next: 'n4',
      },
      n4: {
        speaker: 'nguoi_la',
        text: 'Lối ra là cổng tre, đi nhanh kẻo sương tan.',
        effects: [clue('ev_cong_tre'), ...HURRY],
        choices: [
          { text: 'Anh là ai? Sao lại giúp tôi?', next: 'n5' },
          { text: 'Cảm ơn. Tôi sẽ tự xem xét.', next: 'n6' },
          { text: 'Lần trước anh cũng nói y hệt như vậy.', if: LATER_LOOP, next: 'n7' },
        ],
      },
      n5: {
        speaker: 'nguoi_la',
        text: 'Tôi á? Người dẫn đường thì dẫn đường thôi. Cứ tin tôi là được.',
        next: 'n8',
      },
      n6: {
        speaker: 'nguoi_la',
        text: 'Xem xét gì cho mất thời gian. Nhưng thôi, cậu cứ đi một vòng chợ cho biết.',
        next: 'n8',
      },
      n7: {
        speaker: 'nguoi_la',
        text: 'Lần trước? Cậu nói gì lạ vậy. Chắc sương làm cậu mê man rồi.',
        next: 'n8',
      },
      n8: {
        text: 'Hắn kéo vành nón xuống thấp. Bạn không nhìn thấy mặt hắn. Từ đây có thể đi tới hàng nước chè, bãi trâu, hoặc con đường làng dẫn ra ngã ba.',
      },
    },
  },
  {
    id: 'a1_stranger',
    start: 's1',
    nodes: {
      s1: {
        speaker: 'nguoi_la',
        text: 'Còn đứng đây làm gì? Cổng tre ấy. Đi theo đường làng là tới ngã ba.',
        effects: [...HURRY],
        choices: [
          { text: 'Sao anh chắc lối ra là cổng tre?', next: 's2' },
          { text: 'Đường làng đi thế nào?', next: 's3' },
          { text: 'Anh có mặt mũi thế nào, sao cứ che nón?', next: 's4' },
          { text: 'Thôi, để tôi đi.' },
        ],
      },
      s2: {
        speaker: 'nguoi_la',
        text: 'Vì tôi là người dẫn đường. Người dẫn đường nói thì đúng thôi.',
        effects: [clue('a1_tu_nhan')],
      },
      s3: {
        speaker: 'nguoi_la',
        text: 'Cứ đi thẳng, đừng nhìn ngó hai bên cho mất công.',
        effects: [clue('a1_dung_nhin')],
      },
      s4: {
        speaker: 'nguoi_la',
        text: 'Mặt mũi thì có gì mà xem. Sương thế này, nhìn mặt nhau cũng chẳng rõ.',
      },
    },
  },
  {
    id: 'a1_ba_lao',
    start: [{ if: noFlag('a1_met_ba'), node: 'intro' }, { node: 'menu' }],
    nodes: {
      intro: {
        speaker: 'ba_lao',
        text: 'Ngồi xuống đây uống bát nước chè xanh cho ấm bụng, cháu.',
        effects: [flag('a1_met_ba')],
        next: 'warn',
      },
      warn: {
        speaker: 'ba_lao',
        text: 'Nói trước để cháu biết: già rồi, trời tối là lú lẫn, nói gì cũng ngược cả.',
        variants: [{ if: LATER_LOOP, text: 'Nói trước để cháu biết: già rồi, sáng sớm chưa tỉnh ngủ, nói gì cũng ngược cả.' }],
        effects: [when(LATER_LOOP, [clue('a1_ba_nguoc_sang')], [clue('a1_ba_nguoc_toi')])],
        next: 'menu',
      },
      menu: {
        speaker: 'ba_lao',
        text: 'Cháu muốn hỏi gì già?',
        choices: [
          { text: 'Bà ơi, lối ra khỏi làng ở đâu ạ?', next: 'exit' },
          { text: 'Bà có biết người đội nón rộng vành kia không?', next: 'stranger' },
          { text: 'Bây giờ là buổi nào rồi hả bà?', next: 'time' },
          { text: 'Bà nhắc lại giúp cháu, lúc nào bà hay lú lẫn?', next: 'warn' },
          { text: 'Cháu đi đây ạ.', next: 'bye' },
        ],
      },
      exit: {
        speaker: 'ba_lao',
        text: 'Lối ra à? Lối ra là dốc đá.',
        variants: [{ if: BA_LIES, text: 'Lối ra à? Lối ra là cổng tre.' }],
        effects: [when(BA_LIES, [clue('a1_ba_cong_tre')], [clue('a1_ba_doc_da')])],
        next: 'menu',
      },
      stranger: {
        speaker: 'ba_lao',
        text: 'Cái người đội nón ấy à? Già ở đây sáu mươi năm, chưa thấy mặt hắn bao giờ. Hắn cứ dắt khách đi quanh quanh.',
        variants: [{ if: BA_LIES, text: 'Người đội nón à? Người tốt đấy, cứ theo hắn là ra.' }],
        effects: [when(BA_LIES, [clue('a1_ba_nguoi_la_nguoc')], [clue('a1_ba_nguoi_la')])],
        next: 'menu',
      },
      time: {
        speaker: 'ba_lao',
        text: 'Trời đang thế nào thì là thế ấy, cháu ạ.',
        variants: [
          { if: all(BA_LIES, { t: 'tod', in: ['toi'] }), text: 'Sáng bạch ra rồi còn gì, cháu.' },
          { if: all(BA_LIES, { t: 'tod', in: ['sang'] }), text: 'Tối mịt rồi đấy, cháu. Lên đèn rồi kìa.' },
          { if: { t: 'tod', in: ['sang'] }, text: 'Buổi sáng, cháu ạ. Sương còn dày lắm.' },
          { if: { t: 'tod', in: ['chieu'] }, text: 'Xế chiều rồi, cháu ạ. Nắng đã ngả sang tây.' },
          { if: { t: 'tod', in: ['toi'] }, text: 'Tối rồi, cháu ạ.' },
        ],
        next: 'menu',
      },
      bye: {
        speaker: 'ba_lao',
        text: 'Ừ, đi đâu thì đi, nhớ hỏi già lúc già tỉnh táo nhé.',
      },
    },
  },
  {
    id: 'a1_cau_be',
    start: [
      { if: hasFlag('a1_boy_done'), node: 'again' },
      { if: noFlag('a1_met_boy'), node: 'intro' },
      { node: 'ask' },
    ],
    nodes: {
      intro: {
        speaker: 'cau_be',
        text: 'Anh là người lạ à? Em chẳng tin người lạ đâu. Muốn biết bí mật đường làng thì phải trả lời đúng cả ba câu đố của em!',
        effects: [flag('a1_met_boy')],
        next: 'ask',
      },
      ask: {
        speaker: 'cau_be',
        text: 'Sẵn sàng chưa?',
        choices: [{ text: 'Đố đi!', effects: [{ t: 'puzzleSeq', id: 'a1_boy' }] }, { text: 'Để lúc khác nhé.' }],
      },
      again: {
        speaker: 'cau_be',
        text: 'Em nói rồi mà: đường làng bị ma dắt. Mỗi lần đi qua, thứ gì thay đổi thì đi theo phía đó.',
      },
    },
  },
  {
    id: 'a1_boy_secret',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'cau_be',
        text: 'Giỏi đấy! Em kể cho nghe nhé: đường làng bị ma dắt. Mỗi lần đi qua, thứ gì thay đổi thì đi theo phía đó.',
        effects: [clue('a1_bi_mat')],
        next: 'n2',
      },
      n2: {
        speaker: 'cau_be',
        text: 'Còn người đội nón á? Hắn toàn bảo người ta cứ đi thẳng, đừng nhìn ngó. Đi thẳng là lạc đấy!',
        effects: [clue('a1_be_nguoi_la')],
      },
    },
  },
  {
    id: 'a1_stranger_road',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Nhìn ngó làm gì cho mất thời gian. Cứ đi thẳng. Cổng tre đang đợi.',
        effects: [...HURRY],
      },
    },
  },
  {
    id: 'a1_stranger_nga_ba',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Cổng tre kìa! Còn chần chừ gì nữa? Sương sắp tan rồi!',
      },
    },
  },
]
