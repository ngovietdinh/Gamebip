import type { Maze, Puzzle, PuzzleSeq, Verdict } from '../../engine/types'
import { clue, flag, goto, LATER_LOOP, say, when } from '../common/helpers'

const wrongAgain = [{ t: 'sanity' as const, n: -1 }, say('Sai rồi! Nghĩ kỹ lại đi anh.', 'cau_be')]

export const puzzles: Puzzle[] = [
  {
    id: 'a1_boy_a',
    area: 'a1',
    speaker: 'cau_be',
    title: 'Câu đố của cậu bé chăn trâu',
    prompt: 'Trâu nhà em có 4 chân. Nếu gọi đuôi nó là chân thì nó có mấy chân?',
    kind: 'text',
    answers: ['4', 'bốn', '4 chân', 'bốn chân', 'vẫn 4', 'vẫn là 4', 'vẫn bốn', 'vẫn là bốn', 'vẫn 4 chân', 'vẫn bốn chân', 'vẫn có 4 chân', 'vẫn có bốn chân'],
    hint: { text: 'Gọi cái đuôi là "chân" thì cái đuôi có mọc thành chân thật không?', cost: 0 },
    freeHintAfter: 2,
    firstTryBonus: 3,
    onSolve: [say('Đúng! Gọi tên khác đi thì cái đuôi vẫn là cái đuôi.', 'cau_be')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn cộng cả cái đuôi chỉ vì câu hỏi bảo "gọi" nó là chân. Nhưng đổi tên gọi không làm cái đuôi biến thành chân.',
        missed: 'Con trâu vẫn chỉ có bốn cái chân thật.',
        sanity: 3,
      },
    ],
    wrongRepeat: wrongAgain,
  },
  {
    id: 'a1_boy_b',
    area: 'a1',
    speaker: 'cau_be',
    title: 'Câu đố của cậu bé chăn trâu',
    prompt: 'Trên cành có 10 con chim, bắn rơi 1 con, còn mấy con trên cành?',
    kind: 'text',
    answers: ['0', 'không', 'không con', '0 con', 'không con nào', 'chẳng con nào', 'hết', 'bay hết', 'bay hết rồi', 'không còn con nào', 'không con nào cả', 'không còn con nào cả', 'không còn'],
    hint: { text: 'Tiếng súng nổ đoàng một cái thì chín con chim còn lại sẽ làm gì?', cost: 0 },
    freeHintAfter: 2,
    firstTryBonus: 3,
    onSolve: [say('Chuẩn! Súng nổ một cái là cả đàn bay sạch.', 'cau_be')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn làm phép trừ 10 − 1 theo phản xạ. Nhưng đây không phải bài toán: tiếng súng làm cả đàn chim bay mất.',
        missed: 'Chim nghe tiếng động lớn là bay đi hết.',
        sanity: 3,
      },
    ],
    wrongRepeat: wrongAgain,
  },
  {
    id: 'a1_boy_c',
    area: 'a1',
    speaker: 'cau_be',
    title: 'Câu đố của cậu bé chăn trâu',
    prompt: 'Tháng nào có 28 ngày?',
    kind: 'text',
    answers: [
      'tất cả',
      'tất cả các tháng',
      'tất cả 12 tháng',
      'cả 12 tháng',
      '12 tháng',
      'mười hai tháng',
      'cả mười hai tháng',
      'mọi tháng',
      'tháng nào cũng có',
      'tháng nào cũng có 28 ngày',
      'tháng nào cũng vậy',
      'tất cả các tháng đều có',
    ],
    hint: { text: 'Tháng Giêng có ngày 28 không? Tháng Ba thì sao?', cost: 0 },
    freeHintAfter: 2,
    firstTryBonus: 3,
    onSolve: [say('Đúng rồi! Tháng nào mà chẳng có ngày 28.', 'cau_be')],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn nghĩ ngay tới tháng Hai. Nhưng câu hỏi là tháng nào "có" 28 ngày — tháng nào cũng có ít nhất 28 ngày.',
        missed: 'Đọc kỹ câu hỏi: "có 28 ngày" chứ không phải "chỉ có 28 ngày".',
        sanity: 3,
      },
    ],
    wrongRepeat: wrongAgain,
  },
]

export const puzzleSeqs: PuzzleSeq[] = [
  {
    id: 'a1_boy',
    puzzles: ['a1_boy_a', 'a1_boy_b', 'a1_boy_c'],
    // Lần chơi thứ 2: thứ tự câu đố bị đảo.
    alt: { if: LATER_LOOP, puzzles: ['a1_boy_c', 'a1_boy_b', 'a1_boy_a'] },
    onComplete: [flag('a1_boy_done'), { t: 'dialogue', id: 'a1_boy_secret' }],
  },
]

export const mazes: Maze[] = [
  {
    id: 'duong_lang',
    steps: 3,
    details: [
      { key: 'crow', name: 'con quạ', values: ['cành trên', 'cành dưới'] },
      { key: 'steps', name: 'bậc thang', values: [8, 7] },
      { key: 'cloth', name: 'dải vải cây nêu', values: ['đỏ', 'trắng', 'chàm'] },
    ],
    onStep: [
      say('Bạn đi tiếp. Sương cuộn lại rồi tan ra. Con đường lại chia hai ngả, gần như y hệt. Người lạ đội nón vẫn đứng đó, giữa đường, như chưa từng rời đi.'),
      clue('ev_moi_canh'),
    ],
    onSuccess: [
      flag('a1_maze_done'),
      when({ t: 'not', c: { t: 'flagAtLeast', key: 'maze:duong_lang:fails', n: 1 } }, [
        { t: 'sanity', n: 10 },
        { t: 'achievement', id: 'mat_cu_voi' },
      ]),
      say('Sương dạt sang hai bên. Con đường thôi lặp lại. Trước mặt bạn là một ngã ba.'),
      goto('nga_ba'),
    ],
    onFirstFail: [
      {
        t: 'mistake',
        fallacy: 'intuition',
        explain: 'Bạn chọn ngả đường theo cảm giác thay vì so sánh với lần nhìn trước. Con đường này bị "ma dắt": chỉ phía có chi tiết thay đổi mới dẫn đi tiếp.',
        missed: 'Cậu bé chăn trâu biết bí mật: "Mỗi lần đi qua, thứ gì thay đổi thì đi theo phía đó." Và Người lạ thì bảo bạn đừng nhìn ngó.',
        sanity: 3,
      },
      say('Sương cuộn lại. Bạn lại đứng ở đầu đường làng.'),
    ],
    onFail: [{ t: 'sanity', n: -2 }, say('Sương cuộn lại. Bạn lại đứng ở đầu đường làng. Hãy nhớ kỹ từng chi tiết.')],
  },
]

export const verdicts: Verdict[] = [
  {
    id: 'v_a1',
    area: 'a1',
    title: 'Phán xử: Ngã ba lối ra',
    intro: 'Ba lối đường mờ trong sương. Chỉ một lối dẫn ra khỏi chợ phiên. Dựa vào sổ tay, bạn chọn lối nào?',
    questions: [
      {
        id: 'exit',
        prompt: 'Lối nào là lối ra thật?',
        kind: 'single',
        options: [
          {
            id: 'cong_tre',
            label: 'Cổng tre',
            wrong: [
              {
                ifc: { t: 'clue', id: 'a1_ba_cong_tre' },
                fallacy: 'timeContext',
                explain:
                  'Bạn tin người dẫn đường chỉ vì hắn tự nhận là người dẫn đường, hoặc hỏi bà lão đúng lúc bà lú lẫn mà quên bà đã báo trước. Câu "Lối ra là cổng tre" của bà là lời nói ngược.',
                missed: 'Bà lão đã nói trước: vào buổi bà lú lẫn, bà nói gì cũng ngược cả. Lúc tỉnh táo, bà nói: "Lối ra là dốc đá."',
              },
              {
                fallacy: 'authority',
                explain:
                  'Bạn tin người dẫn đường chỉ vì hắn tự nhận là người dẫn đường, hoặc hỏi bà lão lúc trời tối mà quên bà đã báo trước.',
                missed: 'Hỏi bà lão bán nước chè vào lúc bà tỉnh táo: "Lối ra là dốc đá."',
              },
            ],
          },
          {
            id: 'loi_ruong',
            label: 'Lối ruộng',
            wrong: [
              {
                fallacy: 'intuition',
                explain: 'Không ai nhắc tới lối ruộng cả. Bạn chọn nó vì trông nó bằng phẳng, dễ đi — một phản xạ trực giác không dựa trên manh mối nào.',
                missed: 'Lời bà lão lúc tỉnh táo: "Lối ra là dốc đá."',
              },
            ],
          },
          { id: 'doc_da', label: 'Dốc đá' },
        ],
      },
    ],
    solution: { exit: 'doc_da' },
    sanityPenalty: 8,
    firstTryBonus: 10,
    onSuccess: [
      flag('a1_done'),
      say('Bạn trèo lên dốc đá. Đá trơn rêu, nhưng mỗi bước chân đều chắc chắn. Sau lưng, sương dày đặc lại, nuốt mất tiếng chợ.'),
      say('Dốc đá à?… Thôi được. Đi thì đi.', 'nguoi_la'),
      say('Trên đỉnh dốc, một mái đình cong vút hiện ra trong sương. Tiếng trống đình vọng lại.'),
      goto('dinh_san', true),
    ],
  },
]
