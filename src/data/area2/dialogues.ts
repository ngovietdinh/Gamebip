import type { Dialogue } from '../../engine/types'
import { clue, flag, hasFlag, HURRY, noFlag } from '../common/helpers'

/** Mỗi cụ bô lão nói một câu; sau khi đã trao chìa khóa thì nói câu khác. */
function elder(id: string, speaker: string, clueId: string, greet: string, statement: string, after: string): Dialogue {
  return {
    id,
    start: [{ if: hasFlag('a2_key'), node: 'after' }, { node: 'greet' }],
    nodes: {
      greet: { speaker, text: greet, next: 'statement' },
      statement: {
        speaker,
        text: statement,
        effects: [clue(clueId)],
        choices: [
          { text: 'Cụ nói lại một lần nữa được không ạ?', next: 'statement' },
          { text: 'Cháu cảm ơn cụ.' },
        ],
      },
      after: { speaker, text: after },
    },
  }
}

export const dialogues: Dialogue[] = [
  {
    id: 'a2_stranger_drum',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Trống đình đấy. Mồng một đánh hai tiếng, mồng hai bốn tiếng, mồng ba tám tiếng.',
        next: 'n2',
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Hôm nay chắc chắn 16. Quy luật rõ như ban ngày.',
        effects: [clue('ev_trong_16')],
        choices: [
          { text: 'Nhưng tôi vừa nghe có ba tiếng.', next: 'n3' },
          { text: 'Ừ… chắc là vậy.', next: 'n4' },
        ],
      },
      n3: {
        speaker: 'nguoi_la',
        text: 'Chắc cậu nghe nhầm. Sương làm méo tiếng. Đừng mất thời gian đếm trống, vào gian giữa mà tìm chìa khóa đi.',
        effects: [clue('a2_nghe_nham'), ...HURRY],
      },
      n4: {
        speaker: 'nguoi_la',
        text: 'Đấy. Cứ tin tôi là được. Giờ vào gian giữa hỏi các cụ, nhanh lên.',
        effects: [...HURRY],
      },
    },
  },
  {
    id: 'a2_stranger',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        speaker: 'nguoi_la',
        text: 'Vào gian giữa mà hỏi các cụ. Nhanh lên, thời gian không chờ ai.',
        effects: [...HURRY],
      },
    },
  },
  {
    id: 'a2_ong_tu',
    start: [{ if: noFlag('a2_met_tu'), node: 'intro' }, { node: 'menu' }],
    nodes: {
      intro: {
        speaker: 'ong_tu',
        text: 'Chào khách. Tôi là ông từ trông đình. Khách leo dốc đá lên được đây là giỏi rồi.',
        effects: [flag('a2_met_tu')],
        next: 'menu',
      },
      menu: {
        speaker: 'ong_tu',
        text: 'Khách cần gì?',
        choices: [
          { text: 'Làm sao để đi tiếp ra khỏi làng ạ?', next: 'way' },
          { text: 'Chìa khóa hậu cung ở đâu ạ?', next: 'key' },
          { text: 'Lệ đánh trống đình thế nào ạ?', next: 'drum' },
          { text: 'Ông hỏi con câu gì cũng được.', if: noFlag('a2_drum_done'), next: 'quiz' },
          { text: 'Con xin phép.' },
        ],
      },
      way: {
        speaker: 'ong_tu',
        text: 'Lối đi tiếp nằm sau hậu cung. Mà hậu cung thì khóa, chìa khóa lại do các cụ trong gian giữa giữ.',
        next: 'menu',
      },
      key: {
        speaker: 'ong_tu',
        text: 'Ở chỗ một trong bốn cụ trong gian giữa. Nói trước để khách biết: các cụ hay thử lòng khách lắm — đúng một cụ sẽ nói dối.',
        effects: [clue('a2_mot_nguoi')],
        next: 'menu',
      },
      drum: {
        speaker: 'ong_tu',
        text: 'Mồng một đánh hai, mồng hai đánh bốn, mồng ba đánh tám. Hôm nay mồng bốn. Có ghi cả trên tấm bảng kia.',
        effects: [clue('a2_trong_lich')],
        next: 'menu',
      },
      quiz: {
        speaker: 'ong_tu',
        text: 'Thế thì tôi hỏi thật nhé.',
        choices: [{ text: 'Vâng, ông hỏi đi.', effects: [{ t: 'puzzle', id: 'a2_drum' }] }, { text: 'Để lát nữa ạ.' }],
      },
    },
  },
  elder(
    'a2_giap',
    'cu_giap',
    'a2_giap',
    'Khách hỏi chìa khóa hậu cung à? Già này biết đấy.',
    'Cụ Ất giữ chìa khóa.',
    'Hà hà, chìa khóa đã trao cho khách rồi. Khách tinh ý đấy.',
  ),
  elder(
    'a2_at',
    'cu_at',
    'a2_at',
    'Chìa khóa ấy à? Khách đừng nhìn tôi.',
    'Tôi không giữ chìa khóa.',
    'Tôi đã bảo tôi không giữ mà.',
  ),
  elder(
    'a2_binh',
    'cu_binh',
    'a2_binh',
    'Khách muốn biết ai giữ chìa ư? Tôi chỉ nói được thế này thôi.',
    'Tôi và cụ Đinh đều không giữ.',
    'Khách đi đường cẩn thận. Qua đình là tới rừng trúc đấy.',
  ),
  elder(
    'a2_dinh',
    'cu_dinh',
    'a2_dinh',
    'Hừm. Có người trong chúng tôi đang trêu khách đấy.',
    'Cụ Giáp nói dối.',
    'Thấy chưa, tôi nói có sai đâu.',
  ),
  {
    id: 'a2_stranger_map',
    free: true,
    start: 'n1',
    nodes: {
      n1: {
        text: 'Người lạ đội nón đã đứng ở góc hậu cung từ lúc nào. Bạn không nghe thấy tiếng chân hắn.',
        next: 'n2',
      },
      n2: {
        speaker: 'nguoi_la',
        text: 'Tấm bản đồ đấy à? Tốt lắm! Có bản đồ rồi thì cứ theo bản đồ mà đi, khỏi phải hỏi ai.',
        effects: [flag('a2_map_hint'), clue('a2_goi_y_ban_do')],
        next: 'n3',
      },
      n3: {
        speaker: 'nguoi_la',
        text: 'Cửa sau hậu cung dẫn vào rừng trúc. Đi nhanh lên. Mở bản đồ trong Túi đồ mà xem.',
        effects: [...HURRY],
      },
    },
  },
]
