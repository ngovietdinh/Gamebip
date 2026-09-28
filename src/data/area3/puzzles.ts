import type { Puzzle, PuzzleSeq } from '../../engine/types'
import { clue, flag, LATER_LOOP, say } from '../common/helpers'

const again = [{ t: 'sanity' as const, n: -1 }, say('Chưa đúng. Nghĩ chậm lại.', 'thay_do')]

export const puzzles: Puzzle[] = [
  {
    id: 'a3_a',
    area: 'a3',
    speaker: 'thay_do',
    title: 'Câu đố của thầy đồ',
    prompt: 'Cái gì của anh mà người khác dùng nhiều hơn anh?',
    kind: 'text',
    answers: ['tên', 'cái tên', 'tên anh', 'tên của anh', 'tên gọi', 'tên của mình', 'tên mình', 'tên riêng', 'cái tên của anh', 'họ tên'],
    hint: { text: 'Người khác gọi anh bằng gì?', cost: 5 },
    firstTryBonus: 3,
    onSolve: [say('Phải. Cái tên là của anh, nhưng người đời gọi nó nhiều hơn anh.', 'thay_do')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn nghĩ ngay tới đồ vật cầm nắm được. Nhưng câu đố hỏi thứ "của anh" mà người khác "dùng" — dùng để gọi anh.',
        missed: 'Người khác gọi tên bạn nhiều hơn chính bạn.',
        sanity: 3,
      },
    ],
    wrongRepeat: again,
  },
  {
    id: 'a3_b',
    area: 'a3',
    speaker: 'thay_do',
    title: 'Câu đố của thầy đồ',
    prompt: 'Cái gì càng lấy đi càng to ra?',
    kind: 'text',
    answers: ['lỗ', 'cái lỗ', 'hố', 'cái hố', 'lỗ hổng', 'cái lỗ hổng', 'hố đất', 'cái hố đất', 'hang', 'cái hang', 'hầm', 'cái hầm'],
    hint: { text: 'Cứ đào đất đi mãi thì cái chỗ ấy thế nào?', cost: 5 },
    firstTryBonus: 3,
    onSolve: [say('Đúng. Cái hố càng đào đất đi càng rộng.', 'thay_do')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn nghĩ "lấy đi" thì phải nhỏ lại. Có một thứ ngược đời: càng lấy đất đi, nó càng to.',
        missed: 'Cái hố, cái lỗ: càng đào càng rộng.',
        sanity: 3,
      },
    ],
    wrongRepeat: again,
  },
  {
    id: 'a3_c',
    area: 'a3',
    speaker: 'thay_do',
    title: 'Câu đố của thầy đồ',
    prompt: 'Lối ra khỏi rừng nằm ở chỗ CÁ ĐUỐI. Vậy lối ra ở đâu?',
    kind: 'text',
    answers: [
      'cuối đá',
      'cuối tảng đá',
      'cuối tảng đá lớn',
      'cuối hòn đá',
      'phía cuối tảng đá',
      'sau tảng đá',
      'sau tảng đá lớn',
      'phía sau tảng đá',
      'phía sau tảng đá lớn',
      'phía sau cuối tảng đá',
      'đằng sau tảng đá',
      'sau hòn đá',
      'phía sau hòn đá',
      'ở cuối đá',
      'ở cuối tảng đá',
      'ở sau tảng đá',
    ],
    hint: { text: 'Người xưa hay nói lái để giấu ý.', cost: 5 },
    firstTryBonus: 3,
    onSolve: [clue('a3_ca_duoi')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn đi tìm một con cá đuối thật. Nhưng giữa rừng trúc làm gì có cá — đây là lối nói lái của người xưa.',
        missed: 'Nói lái "cá đuối" → "cuối đá". Trong rừng có một tảng đá lớn.',
        sanity: 3,
      },
    ],
    wrongRepeat: again,
  },
]

export const puzzleSeqs: PuzzleSeq[] = [
  {
    id: 'a3',
    puzzles: ['a3_a', 'a3_b', 'a3_c'],
    alt: { if: LATER_LOOP, puzzles: ['a3_b', 'a3_a', 'a3_c'] },
    onComplete: [flag('a3_riddles_done'), clue('a3_ca_duoi'), { t: 'dialogue', id: 'a3_final' }],
  },
]
