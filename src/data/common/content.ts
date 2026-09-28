import type { AchievementDef, Character, ClueDef, EndingDef, EndingId, FallacyDef, ItemDef } from '../../engine/types'

export const COMMON_CHARACTERS: Character[] = [
  { id: 'nguoi_la', name: 'Người lạ đội nón', sprite: 'stranger', color: '#b7c3cc', suspect: true },
  { id: 'player', name: 'Bạn', sprite: 'none', color: '#e9d9a6' },
]

export const FALLACIES: FallacyDef[] = [
  { id: 'authority', name: 'Tin nguồn có thẩm quyền', short: 'Tin một lời nói chỉ vì người nói có vẻ có thẩm quyền.' },
  { id: 'pressure', name: 'Vội vàng dưới áp lực', short: 'Để áp lực thời gian quyết định thay cho suy nghĩ.' },
  { id: 'pattern', name: 'Bám quy luật bỏ qua thực tế', short: 'Tin vào quy luật đoán trước hơn là điều tận mắt thấy, tận tai nghe.' },
  { id: 'intuition', name: 'Phản xạ trực giác', short: 'Trả lời theo phản xạ đầu tiên mà không kiểm tra lại.' },
  { id: 'timeContext', name: 'Bỏ qua ngữ cảnh thời gian', short: 'Quên rằng lời nói và dấu hiệu thay đổi theo thời điểm.' },
  { id: 'tool', name: 'Tin công cụ tuyệt đối', short: 'Tin bản đồ, dụng cụ hay màn hình hơn cả thực tế trước mắt.' },
]

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'mat_cu_voi', name: 'Mắt cú vọ', description: 'Qua vòng lặp đường làng không sai lần nào.' },
  { id: 'khong_noi_doi', name: 'Không nói dối được tôi', description: 'Giải đúng câu đố bô lão ngay lần đầu.' },
  { id: 'chu_tron', name: 'Chữ tròn như cửa', description: 'Thoát khỏi màn Game Over giả.' },
  { id: 'khong_voi', name: 'Không vội', description: 'Đạt kết ẩn: ở lại qua hạn chót mà chẳng có gì xảy ra.' },
  { id: 'khong_goi_y', name: 'Không cần gợi ý', description: 'Qua Rừng trúc mà không xin gợi ý nào.' },
  { id: 'tinh_tao_tuyet_doi', name: 'Tỉnh táo tuyệt đối', description: 'Kết thúc trò chơi với 100 điểm Tỉnh táo.' },
]

export const COMMON_ITEMS: ItemDef[] = []

export const COMMON_CLUES: ClueDef[] = [
  {
    id: 'ev_han_chot',
    area: 'a4',
    kind: 'observation',
    text: 'Hạn chót là giả: Ngày 3 Tối đã qua, trời sang Ngày 4, sương vẫn còn và chẳng có gì xảy ra. Người lạ bối rối khi thấy bạn vẫn ở đây.',
    evidence: true,
  },
  {
    id: 'ev_giuc_voi',
    area: 'a4',
    kind: 'observation',
    text: 'Người lạ đội nón lúc nào cũng giục vội: "đi nhanh", "đừng mất thời gian", "còn ít thời gian lắm".',
    evidence: true,
  },
]

export const ENDINGS: Record<EndingId, EndingDef> = {
  good: {
    id: 'good',
    kicker: 'Kết tốt',
    title: 'Sương tan',
    paragraphs: [
      'Bạn chỉ thẳng vào vành nón rộng. "Chính anh. Anh chỉ tôi đi cổng tre, anh đoán trống mười sáu tiếng, anh đứng ở mọi khúc quanh của con đường vòng, và lúc nào anh cũng giục tôi vội."',
      'Người lạ đứng im. Rồi vành nón rũ xuống như tàu lá khô. Dưới nón không có khuôn mặt nào cả — chỉ có một làn sương mỏng, xoáy nhẹ, rồi tan thành gió.',
      'Sương trên sông dạt ra hai bên như tấm màn được kéo. Ông lái đò gật đầu, chống sào. "Lên đi. Lâu lắm rồi mới có người nhìn ra hắn."',
      'Con đò đưa bạn qua sông. Bờ bên kia là nắng.',
    ],
  },
  neutral: {
    id: 'neutral',
    kicker: 'Kết trung',
    title: 'Làng vẫn còn đó',
    paragraphs: [
      'Bạn gọi đúng tên kẻ đã dẫn mình đi vòng. Ông lái đò ngập ngừng một lúc lâu, rồi cũng cho bạn lên đò.',
      'Nhưng lý lẽ của bạn còn mỏng, hoặc đầu óc bạn còn mù mờ như sương. Người lạ không tan biến. Hắn chỉ đứng trên bến, kéo vành nón, mỉm cười.',
      'Giữa sông, bạn quay đầu nhìn lại. Làng vẫn còn đó, mái đình cong vút trong sương, tiếng chợ phiên văng vẳng.',
      'Có lẽ bạn sẽ quay lại.',
    ],
  },
  loop: {
    id: 'loop',
    kicker: 'Kết vòng lặp',
    title: 'Lần thứ hai…',
    paragraphs: [
      'Ông lái đò lắc đầu. "Không phải người đó." Ông quay mũi đò vào bờ.',
      'Người lạ đội nón đặt tay lên vai bạn, giọng dịu dàng: "Thôi, về chợ nghỉ đã. Mai tính tiếp."',
      'Sương dâng lên, ướt và lạnh. Bạn nhắm mắt lại…',
      '…và mở mắt giữa chợ phiên. Ngày 1. Buổi sáng. Cuốn sổ tay vẫn nằm trong túi áo, chữ vẫn còn nguyên.',
    ],
  },
  hidden: {
    id: 'hidden',
    kicker: 'Kết ẩn',
    title: 'Ngày thứ tư',
    paragraphs: [
      'Ngày 3 Tối trôi qua. Rồi trời hửng sáng. Sương vẫn còn đó, dày như cũ.',
      'Không có gì xảy ra cả.',
      'Người lạ đội nón đứng sững trước mặt bạn, vành nón run run: "Sao… cậu vẫn còn ở đây?"',
      'Hạn chót chưa bao giờ có thật. Đồng hồ ba ngày chỉ là cái roi để bạn chạy cho nhanh — và chạy nhanh thì không kịp nhìn.',
    ],
  },
}
