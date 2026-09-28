import type { ClueDef } from '../../engine/types'

export const clues: ClueDef[] = [
  { id: 'a1_han_chot', area: 'a1', kind: 'testimony', source: 'nguoi_la', text: 'Sương sẽ tan sau 3 ngày. Ai còn kẹt trong làng lúc đó sẽ ở lại mãi mãi.' },
  { id: 'ev_cong_tre', area: 'a1', kind: 'testimony', source: 'nguoi_la', text: 'Lối ra là cổng tre, đi nhanh kẻo sương tan.', evidence: true },
  { id: 'a1_tu_nhan', area: 'a1', kind: 'testimony', source: 'nguoi_la', text: 'Hỏi vì sao chắc chắn là cổng tre, hắn đáp: "Vì tôi là người dẫn đường. Người dẫn đường nói thì đúng thôi."' },
  { id: 'a1_dung_nhin', area: 'a1', kind: 'testimony', source: 'nguoi_la', text: 'Đường làng à? Cứ đi thẳng, đừng nhìn ngó hai bên cho mất công.' },
  { id: 'a1_ba_nguoc_toi', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Già rồi, trời tối là lú lẫn, nói gì cũng ngược cả.' },
  { id: 'a1_ba_nguoc_sang', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Già rồi, sáng sớm chưa tỉnh ngủ, nói gì cũng ngược cả.' },
  { id: 'a1_ba_doc_da', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Lối ra à? Lối ra là dốc đá.' },
  { id: 'a1_ba_cong_tre', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Lối ra à? Lối ra là cổng tre.' },
  { id: 'a1_ba_nguoi_la', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Người đội nón ấy à? Sáu mươi năm ở đây chưa thấy mặt hắn bao giờ. Hắn cứ dắt khách đi quanh quanh.' },
  { id: 'a1_ba_nguoi_la_nguoc', area: 'a1', kind: 'testimony', source: 'ba_lao', text: 'Người đội nón à? Người tốt đấy, cứ theo hắn là ra.' },
  { id: 'a1_bi_mat', area: 'a1', kind: 'testimony', source: 'cau_be', text: 'Đường làng bị ma dắt. Mỗi lần đi qua, thứ gì thay đổi thì đi theo phía đó.' },
  { id: 'a1_be_nguoi_la', area: 'a1', kind: 'testimony', source: 'cau_be', text: 'Người đội nón toàn bảo người ta cứ đi thẳng, đừng nhìn ngó. Đi thẳng là lạc đấy!' },
  { id: 'a1_trau', area: 'a1', kind: 'observation', text: 'Con trâu có bốn cái chân và một cái đuôi phe phẩy đuổi ruồi.' },
  { id: 'ev_moi_canh', area: 'a1', kind: 'observation', text: 'Người lạ đội nón đứng giữa mọi đoạn của đường làng vòng lặp, dù bạn đi nhanh đến đâu.', evidence: true },
]
