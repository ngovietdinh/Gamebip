import type { Puzzle, Verdict } from '../../engine/types'
import { flag, say } from '../common/helpers'

export const puzzles: Puzzle[] = [
  {
    id: 'a2_drum',
    area: 'a2',
    speaker: 'ong_tu',
    title: 'Câu hỏi của ông từ',
    prompt: 'Khách vừa nghe trống đấy. Hôm nay trống đình đánh mấy tiếng?',
    kind: 'text',
    answers: ['3', 'ba', '3 tiếng', 'ba tiếng', 'đánh 3 tiếng', 'đánh ba tiếng', '3 tiếng trống', 'ba tiếng trống'],
    hint: { text: 'Đừng nghĩ tới lệ. Nhớ lại lúc vừa bước vào sân đình: bạn nghe thấy mấy tiếng "tùng"?', cost: 0 },
    freeHintAfter: 2,
    firstTryBonus: 5,
    onSolve: [
      flag('a2_drum_done'),
      say('Phải. Tai khách nghe sao thì là vậy. Lệ là lệ, nhưng hôm nay tôi chỉ đánh ba tiếng.', 'ong_tu'),
      say('Quy luật đoán trước, còn tai mắt thì nói điều đang xảy ra. Nhiều người vào đây cứ khăng khăng mười sáu.', 'ong_tu'),
    ],
    onWrong: [
      {
        t: 'mistake',
        fallacy: 'pattern',
        explain: 'Bạn để quy luật 2 → 4 → 8 → 16 đè lên điều chính tai mình nghe. Quy luật chỉ là dự đoán; thực tế hôm nay trống đánh 3 tiếng.',
        missed: 'Lúc bước vào sân đình, bạn đã tận tai nghe: Tùng… Tùng… Tùng. Ba tiếng.',
        sanity: 5,
      },
    ],
    wrongRepeat: [{ t: 'sanity', n: -1 }, say('Khách nghe lại trong đầu xem nào. Tùng… tùng…', 'ong_tu')],
  },
]

const liarWrong = (explain: string) => [
  {
    fallacy: 'intuition' as const,
    explain,
    missed: 'Bốn lời khai trong sổ tay, cùng lời ông từ: đúng MỘT cụ nói dối.',
  },
]

export const verdicts: Verdict[] = [
  {
    id: 'v_a2',
    area: 'a2',
    title: 'Phán xử: Bốn cụ bô lão',
    intro: 'Đúng một cụ nói dối. Một cụ đang giữ chìa khóa hậu cung. Hãy đọc lại bốn lời khai trong sổ tay.',
    questions: [
      {
        id: 'liar',
        prompt: 'Ai là người nói dối?',
        kind: 'single',
        options: [
          { id: 'giap', label: 'Cụ Giáp' },
          {
            id: 'at',
            label: 'Cụ Ất',
            wrong: liarWrong('Giả sử cụ Ất nói dối. Khi đó ba cụ còn lại nói thật — kể cả cụ Đinh, người nói "Cụ Giáp nói dối". Vậy cụ Giáp cũng nói dối: thành hai người nói dối. Mâu thuẫn!'),
          },
          {
            id: 'binh',
            label: 'Cụ Bính',
            wrong: liarWrong('Giả sử cụ Bính nói dối. Cụ Giáp nói thật → cụ Ất giữ chìa. Nhưng cụ Ất cũng nói thật rằng mình không giữ. Mâu thuẫn!'),
          },
          {
            id: 'dinh',
            label: 'Cụ Đinh',
            wrong: liarWrong('Giả sử cụ Đinh nói dối, tức cụ Giáp nói thật → cụ Ất giữ chìa. Nhưng cụ Ất (nói thật) bảo mình không giữ. Mâu thuẫn!'),
          },
        ],
      },
      {
        id: 'holder',
        prompt: 'Ai đang giữ chìa khóa hậu cung?',
        kind: 'single',
        options: [
          { id: 'giap', label: 'Cụ Giáp' },
          {
            id: 'at',
            label: 'Cụ Ất',
            wrong: liarWrong('Cụ Giáp nói dối nên câu "Cụ Ất giữ chìa khóa" là sai — cụ Ất không giữ. Chính cụ Ất (nói thật) cũng xác nhận điều đó.'),
          },
          {
            id: 'binh',
            label: 'Cụ Bính',
            wrong: liarWrong('Cụ Bính nói thật: "Tôi và cụ Đinh đều không giữ." Vậy chìa khóa không ở chỗ cụ Bính.'),
          },
          {
            id: 'dinh',
            label: 'Cụ Đinh',
            wrong: liarWrong('Cụ Bính nói thật: "Tôi và cụ Đinh đều không giữ." Vậy chìa khóa không ở chỗ cụ Đinh.'),
          },
        ],
      },
    ],
    solution: { liar: 'giap', holder: 'giap' },
    method:
      'Phương pháp: lần lượt giả định từng cụ là người nói dối, coi ba cụ còn lại nói thật, rồi xem có dẫn tới mâu thuẫn không. Chỉ giả định nào không mâu thuẫn mới là đáp án — và từ đó suy ra người giữ chìa.',
    sanityPenalty: 8,
    firstTryBonus: 10,
    firstTryAchievement: 'khong_noi_doi',
    onSuccess: [
      flag('a2_key'),
      say('Hà hà… già này thử lòng khách thôi. Chìa khóa ở chỗ già đây, cầm lấy.', 'cu_giap'),
      { t: 'item', id: 'chia_khoa_dong' },
      say('Mở Túi đồ, chọn Chìa khóa đồng rồi bấm "Dùng" lên cửa hậu cung.'),
    ],
  },
]
