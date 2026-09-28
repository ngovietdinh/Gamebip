import type { Verdict } from '../../engine/types'

export const verdicts: Verdict[] = [
  {
    id: 'v_final',
    area: 'a4',
    final: true,
    title: 'Phán xử cuối: Kẻ dẫn đi vòng',
    intro: 'Ông lái đò nhìn bạn, chờ đợi. "Ai đã dẫn cậu đi vòng suốt từ đầu tới giờ?" Hãy chọn một người, rồi chọn ít nhất hai bằng chứng trong sổ tay.',
    questions: [
      {
        id: 'suspect',
        prompt: 'Ai đã dẫn bạn đi vòng?',
        kind: 'single',
        options: [
          { id: 'nguoi_la', label: 'Người lạ đội nón' },
          {
            id: 'ba_lao',
            label: 'Bà lão bán nước chè',
            wrong: [
              {
                fallacy: 'timeContext',
                explain: 'Bà lão chỉ nói ngược vào đúng buổi bà đã báo trước. Bà không dẫn bạn đi đâu cả — chính bạn quên mất ngữ cảnh thời gian.',
                missed: 'Bà lão đã nói trước giờ nào bà lú lẫn. Lúc tỉnh táo, bà chỉ đúng: dốc đá.',
              },
            ],
          },
          {
            id: 'cau_be',
            label: 'Cậu bé chăn trâu',
            wrong: [
              {
                fallacy: 'intuition',
                explain: 'Cậu bé đố mẹo, nhưng bí mật cậu kể là thật: nhờ nó bạn mới thoát khỏi đường làng. Đố mẹo không phải là dẫn đi vòng.',
                missed: 'Chính Người lạ mới bảo bạn "cứ đi thẳng, đừng nhìn ngó".',
              },
            ],
          },
          {
            id: 'thay_do',
            label: 'Ông thầy đồ',
            wrong: [
              {
                fallacy: 'intuition',
                explain: 'Thầy đồ ra đề khó, nhưng mọi lời thầy dặn đều đúng: cuối đá, bóng trúc, chữ tròn như cửa. Người nói khó hiểu chưa chắc là người nói dối.',
                missed: 'Người lạ gọi thầy là "ông đồ gàn" và bảo bạn đừng ghé — vì sao hắn sợ bạn nghe thầy?',
              },
            ],
          },
          {
            id: 'lai_do',
            label: 'Ông lái đò',
            wrong: [
              {
                fallacy: 'authority',
                explain: 'Ông lái đò chỉ đúng đường cho bạn: ngược dòng. Bạn nghi ông chỉ vì Người lạ bảo "đừng nghe lão" — lại một lần nữa tin lời kẻ tự nhận là người dẫn đường.',
                missed: 'Lời lái đò "đi ngược dòng" đã đưa bạn tới bến đò thật.',
              },
            ],
          },
        ],
      },
      { id: 'evidence', prompt: 'Chọn bằng chứng từ sổ tay (ít nhất 2):', kind: 'evidence', min: 2 },
    ],
    solution: { suspect: 'nguoi_la' },
    sanityPenalty: 10,
    firstTryBonus: 10,
    onSuccess: [],
  },
]
