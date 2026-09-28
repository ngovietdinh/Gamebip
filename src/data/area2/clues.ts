import type { ClueDef } from '../../engine/types'

export const clues: ClueDef[] = [
  { id: 'a2_trong_3', area: 'a2', kind: 'observation', text: 'Tận tai nghe: hôm nay trống đình đánh đúng 3 tiếng. Tùng… Tùng… Tùng.' },
  { id: 'a2_trong_lich', area: 'a2', kind: 'observation', text: 'Sổ trống đình: Mồng một đánh 2 tiếng. Mồng hai đánh 4 tiếng. Mồng ba đánh 8 tiếng. Hôm nay là mồng bốn.' },
  { id: 'ev_trong_16', area: 'a2', kind: 'testimony', source: 'nguoi_la', text: '2, 4, 8… Hôm nay trống đình chắc chắn đánh 16 tiếng. Quy luật rõ như ban ngày.', evidence: true },
  { id: 'a2_nghe_nham', area: 'a2', kind: 'testimony', source: 'nguoi_la', text: 'Chắc cậu nghe nhầm. Sương làm méo tiếng. Đừng mất thời gian đếm trống.' },
  { id: 'a2_mot_nguoi', area: 'a2', kind: 'testimony', source: 'ong_tu', text: 'Chìa khóa hậu cung đang ở chỗ một trong bốn cụ. Bốn cụ hay thử lòng khách: đúng một cụ sẽ nói dối.' },
  { id: 'a2_giap', area: 'a2', kind: 'testimony', source: 'cu_giap', text: 'Cụ Ất giữ chìa khóa.' },
  { id: 'a2_at', area: 'a2', kind: 'testimony', source: 'cu_at', text: 'Tôi không giữ chìa khóa.' },
  { id: 'a2_binh', area: 'a2', kind: 'testimony', source: 'cu_binh', text: 'Tôi và cụ Đinh đều không giữ.' },
  { id: 'a2_dinh', area: 'a2', kind: 'testimony', source: 'cu_dinh', text: 'Cụ Giáp nói dối.' },
  { id: 'a2_ban_do', area: 'a2', kind: 'observation', text: 'Tấm bản đồ làng trong hòm gỗ ở hậu cung. Lúc mới nhận: bến đò vẽ ở phía ngược dòng sông, chỉ có ba con đường.' },
  { id: 'a2_goi_y_ban_do', area: 'a2', kind: 'testimony', source: 'nguoi_la', text: 'Có bản đồ rồi thì cứ theo bản đồ mà đi, khỏi phải hỏi ai.' },
  { id: 'a2_ban_do_lech', area: 'a2', kind: 'observation', text: 'Tấm bản đồ không còn giống lúc mới nhận. Mỗi buổi trôi qua, trên đó lại có một chi tiết bị lệch.' },
  {
    id: 'ev_ban_do',
    area: 'a2',
    kind: 'observation',
    text: 'Bản đồ làng lệch dần theo từng buổi, kể từ khi Người lạ đưa gợi ý "cứ theo bản đồ mà đi".',
    evidence: true,
  },
]
