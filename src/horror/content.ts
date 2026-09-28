/**
 * Nội dung game "3:17 — Kẻ Không Mặt": vật phẩm, vật tương tác, mật mã, ghi chú, ký ức.
 * Tọa độ tính theo ô bản đồ (có thể lẻ), 1 ô = 2 mét.
 */

export type ItemId = 'pin' | 'thuoc' | 'bang' | 'key_bedroom' | 'key_class' | 'key_bath'

export interface ItemDef {
  id: ItemId
  name: string
  icon: string
  desc: string
}

export const ITEMS: Record<ItemId, ItemDef> = {
  pin: { id: 'pin', name: 'Pin', icon: '🔋', desc: 'Một cục pin cũ. Nạp thêm 40% cho đèn pin.' },
  thuoc: { id: 'thuoc', name: 'Thuốc an thần', icon: '💊', desc: 'Vỉ thuốc của mẹ. Hồi 35 tinh thần.' },
  bang: { id: 'bang', name: 'Băng gạc', icon: '🩹', desc: 'Cuộn băng gạc. Hồi 1 máu.' },
  key_bedroom: { id: 'key_bedroom', name: 'Chìa phòng ngủ', icon: '🗝️', desc: 'Chìa khóa nhỏ có móc hình ngôi sao.' },
  key_class: { id: 'key_class', name: 'Chìa lớp học', icon: '🗝️', desc: 'Chìa khóa có thẻ nhựa ghi "Lớp 5A".' },
  key_bath: { id: 'key_bath', name: 'Chìa phòng tắm', icon: '🗝️', desc: 'Chìa khóa gỉ, lạnh buốt như vừa ngâm nước.' },
}

export const INVENTORY_SLOTS = 4
export const MAX_HP = 3

export type Wall = 'n' | 's' | 'e' | 'w'

export type Interactable = {
  id: string
  /** Vị trí theo ô (tâm vật). */
  at: [number, number]
  label: string
  /** Mô hình 3D. */
  model: string
  /** Vật gắn tường: quay mặt về phía ngược với bức tường. */
  wall?: Wall
  /** Bán kính vật cản (m); không có = không chắn đường. */
  solid?: number
} & (
  | { kind: 'pickup'; item: ItemId }
  | { kind: 'flashlight' }
  | { kind: 'note'; note: string }
  | { kind: 'keypad'; puzzle: string }
  | { kind: 'hide' }
  | { kind: 'door'; door: string }
  | { kind: 'photo'; photo: number }
  | { kind: 'phone' }
  | { kind: 'mirror' }
  | { kind: 'examine'; text: string }
)

export interface Puzzle {
  id: string
  title: string
  code: string
  hint: string
  items: ItemId[]
  fragment?: number
  /** Lời nhắn khi mở được. */
  solved: string
}

export const PUZZLES: Record<string, Puzzle> = {
  toybox: {
    id: 'toybox',
    title: 'Hộp đồ chơi — khóa 3 số',
    code: '418',
    hint: 'Mật mã nằm ở nơi chỉ sáng lên trong bóng tối.',
    items: ['key_bedroom'],
    fragment: 1,
    solved: 'Nắp hộp bật mở. Bên trong là chìa khóa phòng ngủ… và một mảnh ký ức.',
  },
  safe: {
    id: 'safe',
    title: 'Két sắt — khóa 4 số',
    code: '5341',
    hint: 'Xếp những tấm ảnh theo năm, đếm những người còn ở lại.',
    items: ['key_class'],
    fragment: 2,
    solved: 'Cánh két nặng nề mở ra. Chìa khóa lớp học nằm trên một xấp ảnh bị xé.',
  },
  teacher: {
    id: 'teacher',
    title: 'Ngăn bàn cô giáo — khóa 3 số',
    code: '683',
    hint: 'Đáp án bài 1, bài 2, bài 3 trên bảng đen.',
    items: ['key_bath'],
    fragment: 3,
    solved: 'Ngăn kéo trượt ra. Chìa khóa phòng tắm lạnh ngắt nằm cạnh một bài kiểm tra cũ.',
  },
  cabinet: {
    id: 'cabinet',
    title: 'Tủ thuốc — khóa 4 số',
    code: '2519',
    hint: 'Trong gương, mọi thứ đều ngược.',
    items: ['thuoc'],
    fragment: 4,
    solved: 'Tủ thuốc mở. Một vỉ thuốc… và mảnh ký ức cuối cùng.',
  },
  front: {
    id: 'front',
    title: 'Cửa chính — khóa 4 số',
    code: '0317',
    hint: 'Cửa chỉ mở vào đúng giờ mọi thứ dừng lại.',
    items: [],
    solved: 'Ổ khóa kêu "cạch". Ngoài kia là ánh sáng.',
  },
}

/** Bốn tấm ảnh gia đình trên tường phòng khách, theo thứ tự treo từ trái sang phải. */
export const PHOTOS: { year: number; people: number }[] = [
  { year: 2007, people: 4 },
  { year: 1998, people: 5 },
  { year: 2012, people: 1 },
  { year: 2003, people: 3 },
]

/** Ba bài trên bảng đen lớp học. */
export const BLACKBOARD = ['Bài 1:  2 + 2 × 2 = ?', 'Bài 2:  1, 1, 2, 3, 5, ?', 'Bài 3:  Một nửa của 2, cộng 2 = ?']
export const BLACKBOARD_SCARY = ['EM LẠI ĐIỂM KÉM À?', 'MẸ SẼ BIẾT.', 'MẸ SẼ ĐI.']

/** Mã trên gương phòng tắm (được vẽ ngược). */
export const MIRROR_TEXT = '2519'
/** Mã sao dạ quang trên trần phòng ngủ — chỉ thấy khi tắt đèn. */
export const CEILING_CODE = '418'
/** Giờ trên chiếc đồng hồ đứng im. */
export const CLOCK_TIME = '3:17'

export interface Note {
  id: string
  title: string
  body: string
}

export const NOTES: Record<string, Note> = {
  n_sao: {
    id: 'n_sao',
    title: 'Mảnh giấy trên bàn học',
    body: 'Mẹ dán sao dạ quang lên trần nhà.\n"Tắt đèn đi con, sao mới sáng."\nMình không dám tắt đèn.',
  },
  n_hanh_lang: {
    id: 'n_hanh_lang',
    title: 'Chữ nguệch ngoạc trên tường',
    body: 'NÓ NGHE ĐƯỢC TIẾNG CHÂN CHẠY.\nĐi chậm thì nó không nghe thấy.\nNếu nó thấy mày — chạy, rồi trốn vào tủ.\nĐừng để nó thấy lúc mày chui vào.',
  },
  n_anh: {
    id: 'n_anh',
    title: 'Mẩu giấy trên bàn nước',
    body: 'Năm nào cũng chụp một tấm.\nNăm nào cũng thiếu một người.\nXếp theo năm, đếm những người còn ở lại.',
  },
  n_bai_kiem_tra: {
    id: 'n_bai_kiem_tra',
    title: 'Bài kiểm tra Toán — 3 điểm',
    body: 'Lời phê: "Em phải chép lại đáp án đúng của 3 bài trên bảng."\nPhía dưới, chữ bút chì run run:\n"Mã ngăn bàn cô = bài 1, bài 2, bài 3. Đừng để mẹ thấy bài này."',
  },
  n_guong: {
    id: 'n_guong',
    title: 'Dòng chữ trên gạch men',
    body: 'Trong gương, mọi thứ đều ngược.\nKể cả con số.',
  },
  n_cua: {
    id: 'n_cua',
    title: 'Tờ lịch cạnh cửa',
    body: 'Tờ lịch dừng ở một đêm tháng Bảy.\nAi đó viết đè bằng bút đỏ:\n"Cửa chỉ mở vào đúng giờ mọi thứ dừng lại."',
  },
}

export interface Fragment {
  id: number
  digit: string
  text: string
}

/** Bốn mảnh ký ức — ghép theo thứ tự thành mật mã cửa chính. */
export const FRAGMENTS: Fragment[] = [
  { id: 1, digit: '0', text: 'Đêm đó bố mẹ lại cãi nhau. Mình trùm chăn kín đầu, đếm sao dạ quang trên trần để không phải nghe.' },
  { id: 2, digit: '3', text: 'Ảnh gia đình mỗi năm lại thiếu một người. Không ai giải thích. Mình tưởng đó là lỗi của mình.' },
  { id: 3, digit: '1', text: 'Bài kiểm tra 3 điểm. Mình giấu nó dưới gầm ghế, sợ mẹ thấy, sợ mẹ cũng bỏ đi như mọi người.' },
  { id: 4, digit: '7', text: '3 giờ 17 phút sáng. Cửa nhà đóng sầm. Mình trốn trong tủ quần áo tới sáng. Từ đêm ấy, bóng tối có một khuôn mặt — một khuôn mặt không có mặt.' },
]

export const INTERACTABLES: Interactable[] = [
  // ---------------------------------------------------------------- Phòng ngủ
  { id: 'den_pin', kind: 'flashlight', at: [1.3, 3.3], label: 'Đèn pin', model: 'nightstand', solid: 0.45 },
  { id: 'giuong', kind: 'hide', at: [2.6, 1.4], label: 'Trốn dưới gầm giường', model: 'bed', solid: 1.1 },
  { id: 'tu_quan_ao', kind: 'hide', at: [1.25, 1.2], label: 'Tủ quần áo', model: 'wardrobe', wall: 'n' },
  { id: 'dong_ho', kind: 'examine', at: [4, 1.05], label: 'Đồng hồ treo tường', model: 'clock', wall: 'n', text: 'Chiếc đồng hồ đứng im ở 3 giờ 17 phút. Kim giây không nhúc nhích.' },
  { id: 'ban_hoc', kind: 'note', at: [5.5, 1.4], label: 'Mảnh giấy trên bàn học', model: 'desk', note: 'n_sao', solid: 0.6 },
  { id: 'hop_do_choi', kind: 'keypad', at: [5.3, 4.4], label: 'Hộp đồ chơi (khóa số)', model: 'toybox', puzzle: 'toybox', solid: 0.5 },
  { id: 'cua_1', kind: 'door', at: [6.5, 3.5], label: 'Cửa phòng ngủ', model: 'none', door: '1' },

  // ---------------------------------------------------------------- Hành lang
  { id: 'chu_tuong', kind: 'note', at: [7.05, 6.5], label: 'Chữ viết trên tường', model: 'scrawl', wall: 'w', note: 'n_hanh_lang' },
  { id: 'pin_1', kind: 'pickup', at: [12.5, 1.5], label: 'Pin', model: 'battery', item: 'pin' },
  { id: 'bang_1', kind: 'pickup', at: [7.5, 8.5], label: 'Băng gạc', model: 'bandage', item: 'bang' },
  { id: 'thuoc_1', kind: 'pickup', at: [13.5, 9.5], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
  { id: 'tu_hl_1', kind: 'hide', at: [10.5, 9.72], label: 'Tủ âm tường', model: 'wardrobe', wall: 's' },
  { id: 'tu_hl_2', kind: 'hide', at: [17.72, 4.5], label: 'Tủ âm tường', model: 'wardrobe', wall: 'e' },
  { id: 'cua_3', kind: 'door', at: [8.5, 5.5], label: 'Cửa lớp học', model: 'none', door: '3' },
  { id: 'cua_4', kind: 'door', at: [18.5, 3.5], label: 'Cửa phòng tắm', model: 'none', door: '4' },

  // ---------------------------------------------------------------- Phòng khách
  { id: 'anh_1', kind: 'photo', at: [1.05, 6.5], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 0 },
  { id: 'anh_2', kind: 'photo', at: [1.05, 7.3], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 1 },
  { id: 'anh_3', kind: 'photo', at: [1.05, 8.1], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 2 },
  { id: 'anh_4', kind: 'photo', at: [1.05, 8.9], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 3 },
  { id: 'ban_nuoc', kind: 'note', at: [3.5, 8], label: 'Mẩu giấy trên bàn nước', model: 'table', note: 'n_anh', solid: 0.6 },
  { id: 'sofa', kind: 'examine', at: [4, 9.55], label: 'Ghế sofa', model: 'sofa', wall: 's', solid: 0.8, text: 'Chiếc sofa lõm một chỗ, như có ai vừa ngồi dậy. Nệm vẫn còn ấm.' },
  { id: 'dien_thoai', kind: 'phone', at: [5.5, 9.5], label: 'Điện thoại bàn', model: 'phone' },
  { id: 'ket_sat', kind: 'keypad', at: [1.4, 9.55], label: 'Két sắt (khóa số)', model: 'safe', wall: 's', puzzle: 'safe', solid: 0.5 },
  { id: 'tu_pk', kind: 'hide', at: [5.72, 6.5], label: 'Tủ đứng', model: 'wardrobe', wall: 'e' },
  { id: 'bup_be', kind: 'examine', at: [2.5, 6.3], label: 'Búp bê', model: 'doll', text: 'Con búp bê bằng sứ. Mình chắc chắn lúc nãy nó quay mặt vào tường.' },

  // ---------------------------------------------------------------- Lớp học
  { id: 'bang_den', kind: 'examine', at: [12, 3.05], label: 'Bảng đen', model: 'blackboard', wall: 'n', text: 'Bài 1: 2 + 2 × 2 = ?\nBài 2: 1, 1, 2, 3, 5, ?\nBài 3: Một nửa của 2, cộng 2 = ?' },
  { id: 'ban_co', kind: 'keypad', at: [14.3, 3.9], label: 'Ngăn bàn cô giáo (khóa số)', model: 'teacherDesk', puzzle: 'teacher', solid: 0.7 },
  { id: 'ghe_phat', kind: 'note', at: [9.4, 7.5], label: 'Chiếc ghế quay mặt vào tường', model: 'chairFacingWall', note: 'n_bai_kiem_tra' },
  { id: 'pin_2', kind: 'pickup', at: [15.4, 5.5], label: 'Pin', model: 'battery', item: 'pin' },
  { id: 'tu_locker', kind: 'hide', at: [15.72, 7.4], label: 'Tủ đồ học sinh', model: 'locker', wall: 'e' },

  // ---------------------------------------------------------------- Phòng tắm
  { id: 'guong', kind: 'mirror', at: [22.95, 2.5], label: 'Tấm gương', model: 'mirror', wall: 'e' },
  { id: 'tu_thuoc', kind: 'keypad', at: [22.95, 3.7], label: 'Tủ thuốc (khóa số)', model: 'cabinet', wall: 'e', puzzle: 'cabinet' },
  { id: 'gach_men', kind: 'note', at: [19.05, 1.6], label: 'Dòng chữ trên gạch men', model: 'scrawl', wall: 'w', note: 'n_guong' },
  { id: 'bon_tam', kind: 'examine', at: [20.3, 1.5], label: 'Bồn tắm', model: 'bathtub', solid: 0.8, text: 'Bồn tắm đầy nước đen, lặng như mặt gương. Mình không dám nhìn xuống đáy.' },
  { id: 'bang_2', kind: 'pickup', at: [19.6, 4.4], label: 'Băng gạc', model: 'bandage', item: 'bang' },

  // ---------------------------------------------------------------- Sảnh cửa chính
  { id: 'cua_chinh', kind: 'keypad', at: [23, 7.5], label: 'Cửa chính (khóa số)', model: 'frontDoor', wall: 'e', puzzle: 'front' },
  { id: 'to_lich', kind: 'note', at: [22.95, 6.5], label: 'Tờ lịch cạnh cửa', model: 'calendar', wall: 'e', note: 'n_cua' },
  { id: 'pin_3', kind: 'pickup', at: [20.5, 9.5], label: 'Pin', model: 'battery', item: 'pin' },
  { id: 'thuoc_2', kind: 'pickup', at: [19.5, 6.5], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
  { id: 'tu_sanh', kind: 'hide', at: [22.72, 9.4], label: 'Tủ treo áo khoác', model: 'wardrobe', wall: 'e' },
]

/** Đèn trong nhà: vùng sáng hồi tinh thần. Đèn chập chờn khi Kẻ Không Mặt tới gần. */
export const LAMPS: { id: string; at: [number, number]; color: string; radius: number }[] = [
  { id: 'den_ngu', at: [1.5, 4.5], color: '#ffb46a', radius: 3.2 },
  { id: 'den_hl_1', at: [7.5, 1.5], color: '#ffe0a0', radius: 3.5 },
  { id: 'den_hl_2', at: [17.5, 9.5], color: '#ffe0a0', radius: 3.5 },
  { id: 'den_pk', at: [3.5, 8], color: '#ffb46a', radius: 3.5 },
  { id: 'den_lh', at: [12, 6.5], color: '#cfe8ff', radius: 4 },
  { id: 'den_sanh', at: [20.5, 7.5], color: '#ffd29a', radius: 3.5 },
]

/** Điểm tuần tra của Kẻ Không Mặt (ô). */
export const PATROL: [number, number][] = [
  [7, 1],
  [12, 1],
  [17, 1],
  [17, 5],
  [17, 9],
  [12, 9],
  [7, 9],
  [7, 5],
  [3, 7],
  [12, 5],
  [20, 7],
  [20, 2],
]

export const PLAYER_START = { x: 3.5, z: 3.2, yaw: Math.PI / 2 }

/** Mật mã cửa chính ghép từ bốn mảnh ký ức. */
export function fragmentCode(): string {
  return FRAGMENTS.map((f) => f.digit).join('')
}

/** Mật mã két sắt suy ra từ các tấm ảnh (dùng cho kiểm thử tính công bằng). */
export function photoCode(): string {
  return [...PHOTOS].sort((a, b) => a.year - b.year).map((p) => p.people).join('')
}

/** Đáp án bảng đen (dùng cho kiểm thử). */
export function blackboardCode(): string {
  const b1 = 2 + 2 * 2
  const fib = [1, 1, 2, 3, 5]
  const b2 = fib[3] + fib[4]
  const b3 = 2 / 2 + 2
  return `${b1}${b2}${b3}`
}

/** Mã gương: chữ trong gương là chữ lật ngang, đọc từ phải sang trái. */
export function mirrorDisplay(): string {
  return Array.from(MIRROR_TEXT).reverse().join('')
}
