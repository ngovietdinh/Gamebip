import type { ChapterDef } from '../types'

/**
 * CHƯƠNG 1 — CĂN NHÀ
 * Nỗi sợ: bóng tối, bị bỏ rơi.
 */

export const CH1_PHOTOS = [
  { year: 2007, people: 4 },
  { year: 1998, people: 5 },
  { year: 2012, people: 1 },
  { year: 2003, people: 3 },
]
export const CH1_BLACKBOARD = ['Bài 1:  2 + 2 × 2 = ?', 'Bài 2:  1, 1, 2, 3, 5, ?', 'Bài 3:  Một nửa của 2, cộng 2 = ?']
export const CH1_BLACKBOARD_SCARY = ['CON LẠI ĐIỂM KÉM À?', 'MẸ SẼ BIẾT.', 'MẸ SẼ ĐI.']
export const CH1_MIRROR = '2519'
export const CH1_CEILING = '418'
export const CH1_CLOCK = '3:17'

export const ch1: ChapterDef = {
  id: 'ch1',
  index: 1,
  title: 'Căn nhà',
  subtitle: 'Nỗi sợ bóng tối',
  intro: [
    'Bạn tên là An, mười bảy tuổi. Đêm nào cũng vậy: đúng 3 giờ 17 phút sáng, bạn choàng tỉnh, tim đập thình thịch, không nhớ nổi mình vừa mơ thấy gì.',
    'Đêm nay thì khác. Bạn không tỉnh lại trong phòng mình ở ký túc xá, mà trong căn phòng ngủ hồi bé, ở ngôi nhà cũ mà cả nhà đã bán đi từ mười năm trước.',
    'Mọi thứ y nguyên, chỉ tối hơn, lạnh hơn. Cửa phòng bị khóa từ bên ngoài. Và dưới khe cửa, có một cái bóng đứng im, cao lêu nghêu, chờ đợi.',
  ],
  outro: [
    'Cửa chính bật mở. Nhưng ngoài kia không phải con phố cũ, mà là một sân trường phủ đầy lá bàng khô, dưới ánh đèn đường vàng vọt.',
    'Tiếng trống trường vang lên ba hồi, dù đã gần 4 giờ sáng. Ác mộng chưa kết thúc. Nó mới bắt đầu kể chuyện.',
  ],
  objective: 'Tìm đèn pin, mở khóa từng phòng, gom 4 mảnh ký ức và thoát ra bằng cửa chính.',
  map: [
    '########################',
    '#bbbbb#hhhhhhhhhhh#tttt#',
    '#bbbbb#h#########h#tttt#',
    '#bbbbb1h#ccccccc#h4tttt#',
    '#bbbbb#h#ccccccc#h#tttt#',
    '#######h3ccccccc#h######',
    '#lllll#h#ccccccc#h#eeee#',
    '#lllll2h#ccccccc#hheeee5',
    '#lllll#h#########h#eeee#',
    '#lllll#hhhhhhhhhhh#eeee#',
    '########################',
  ],
  rooms: {
    b: { name: 'Phòng ngủ tuổi thơ', floor: 'wood', wall: 'wallpaper', tint: '#a898b8' },
    h: { name: 'Hành lang', floor: 'wood', wall: 'wallpaper', tint: '#9a8e7c' },
    l: { name: 'Phòng khách', floor: 'wood', wall: 'wallpaper', tint: '#b09884' },
    c: { name: 'Góc học tập', floor: 'lino', wall: 'plaster', tint: '#98aca2' },
    t: { name: 'Phòng tắm', floor: 'tile', wall: 'tile', tint: '#b8c4c8' },
    e: { name: 'Sảnh cửa chính', floor: 'tile', wall: 'wallpaper', tint: '#a8988a' },
  },
  doors: {
    '1': { name: 'Cửa phòng ngủ', key: 'key_bedroom' },
    '2': { name: 'Cửa phòng khách' },
    '3': { name: 'Cửa góc học tập', key: 'key_class' },
    '4': { name: 'Cửa phòng tắm', key: 'key_bath' },
  },
  start: { x: 3.5, z: 3.2, yaw: Math.PI / 2 },
  photos: CH1_PHOTOS,
  puzzles: {
    toybox: {
      id: 'toybox',
      title: 'Hộp đồ chơi — khóa 3 số',
      code: CH1_CEILING,
      hint: 'Mật mã nằm ở nơi chỉ sáng lên trong bóng tối.',
      items: ['key_bedroom'],
      fragment: 'c1-1',
      solved: 'Nắp hộp bật mở. Bên trong là chìa khóa phòng ngủ… và một mảnh ký ức.',
    },
    safe: {
      id: 'safe',
      title: 'Két sắt — khóa 4 số',
      code: '5341',
      hint: 'Xếp những tấm ảnh theo năm, đếm những người còn ở lại.',
      items: ['key_class'],
      fragment: 'c1-2',
      solved: 'Cánh két nặng nề mở ra. Chìa khóa góc học tập nằm trên một xấp ảnh bị xé.',
    },
    teacher: {
      id: 'teacher',
      title: 'Ngăn bàn học — khóa 3 số',
      code: '683',
      hint: 'Đáp án bài 1, bài 2, bài 3 trên bảng.',
      items: ['key_bath'],
      fragment: 'c1-3',
      solved: 'Ngăn kéo trượt ra. Chìa khóa phòng tắm lạnh ngắt nằm cạnh một bài kiểm tra cũ.',
    },
    cabinet: {
      id: 'cabinet',
      title: 'Tủ thuốc — khóa 4 số',
      code: CH1_MIRROR,
      hint: 'Trong gương, mọi thứ đều ngược.',
      items: ['thuoc'],
      fragment: 'c1-4',
      solved: 'Tủ thuốc mở. Một vỉ thuốc… và mảnh ký ức cuối cùng của căn nhà.',
    },
    front: {
      id: 'front',
      title: 'Cửa chính — khóa 4 số',
      code: '0317',
      hint: 'Cửa chỉ mở vào đúng giờ mọi thứ dừng lại.',
      items: [],
      exit: true,
      solved: 'Ổ khóa kêu "cạch". Ngoài kia là…',
    },
  },
  notes: {
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
      body: 'Lời phê: "Con phải chép lại đáp án đúng của 3 bài trên bảng."\nPhía dưới, chữ bút chì run run:\n"Mã ngăn bàn = bài 1, bài 2, bài 3. Đừng để mẹ thấy bài này."',
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
  },
  fragments: [
    { id: 'c1-1', chapter: 'ch1', digit: '0', title: 'Sao dạ quang', text: 'Đêm đó bố mẹ lại cãi nhau. Mình trùm chăn kín đầu, đếm sao dạ quang trên trần để không phải nghe.' },
    { id: 'c1-2', chapter: 'ch1', digit: '3', title: 'Những tấm ảnh', text: 'Ảnh gia đình mỗi năm lại thiếu một người. Không ai giải thích. Mình tưởng đó là lỗi của mình.' },
    { id: 'c1-3', chapter: 'ch1', digit: '1', title: 'Ba điểm', text: 'Bài kiểm tra 3 điểm. Mình giấu nó dưới gầm ghế, sợ mẹ thấy, sợ mẹ cũng bỏ đi như mọi người.' },
    {
      id: 'c1-4',
      chapter: 'ch1',
      digit: '7',
      title: '3 giờ 17',
      text: '3 giờ 17 phút sáng. Cửa nhà đóng sầm. Mình trốn trong tủ quần áo tới sáng. Từ đêm ấy, bóng tối có một khuôn mặt — một khuôn mặt không có mặt.',
    },
  ],
  interactables: [
    // Phòng ngủ
    { id: 'den_pin', kind: 'flashlight', at: [1.3, 3.3], label: 'Đèn pin', model: 'nightstand', solid: 0.45 },
    { id: 'giuong', kind: 'hide', at: [2.6, 1.4], label: 'Trốn dưới gầm giường', model: 'bed', solid: 1.1 },
    { id: 'tu_quan_ao', kind: 'hide', at: [1.25, 1.2], label: 'Tủ quần áo', model: 'wardrobe', wall: 'n' },
    { id: 'dong_ho', kind: 'examine', at: [4, 1.05], label: 'Đồng hồ treo tường', model: 'clock', wall: 'n', text: 'Chiếc đồng hồ đứng im ở 3 giờ 17 phút. Kim giây không nhúc nhích. Pin vẫn còn — nó chỉ không muốn chạy nữa.' },
    { id: 'ban_hoc', kind: 'note', at: [5.5, 1.4], label: 'Mảnh giấy trên bàn học', model: 'desk', note: 'n_sao', solid: 0.6 },
    { id: 'hop_do_choi', kind: 'keypad', at: [5.3, 4.4], label: 'Hộp đồ chơi (khóa số)', model: 'toybox', puzzle: 'toybox', solid: 0.5 },
    { id: 'cua_1', kind: 'door', at: [6.5, 3.5], label: 'Cửa phòng ngủ', model: 'none', door: '1' },
    // Hành lang
    { id: 'chu_tuong', kind: 'note', at: [7.05, 6.5], label: 'Chữ viết trên tường', model: 'scrawl', wall: 'w', note: 'n_hanh_lang' },
    { id: 'pin_1', kind: 'pickup', at: [12.5, 1.5], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'bang_1', kind: 'pickup', at: [7.5, 8.5], label: 'Băng gạc', model: 'bandage', item: 'bang' },
    { id: 'thuoc_1', kind: 'pickup', at: [13.5, 9.5], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
    { id: 'tu_hl_1', kind: 'hide', at: [10.5, 9.72], label: 'Tủ âm tường', model: 'wardrobe', wall: 's' },
    { id: 'tu_hl_2', kind: 'hide', at: [17.72, 4.5], label: 'Tủ âm tường', model: 'wardrobe', wall: 'e' },
    { id: 'cua_3', kind: 'door', at: [8.5, 5.5], label: 'Cửa góc học tập', model: 'none', door: '3' },
    { id: 'cua_4', kind: 'door', at: [18.5, 3.5], label: 'Cửa phòng tắm', model: 'none', door: '4' },
    // Phòng khách
    { id: 'anh_1', kind: 'photo', at: [1.05, 6.5], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 0 },
    { id: 'anh_2', kind: 'photo', at: [1.05, 7.3], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 1 },
    { id: 'anh_3', kind: 'photo', at: [1.05, 8.1], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 2 },
    { id: 'anh_4', kind: 'photo', at: [1.05, 8.9], label: 'Ảnh gia đình', model: 'photo', wall: 'w', photo: 3 },
    { id: 'ban_nuoc', kind: 'note', at: [3.5, 8], label: 'Mẩu giấy trên bàn nước', model: 'table', note: 'n_anh', solid: 0.6 },
    { id: 'sofa', kind: 'examine', at: [4, 9.55], label: 'Ghế sofa', model: 'sofa', wall: 's', solid: 0.8, text: 'Chiếc sofa lõm một chỗ, như có ai vừa ngồi dậy. Nệm vẫn còn ấm.' },
    { id: 'dien_thoai', kind: 'event', at: [5.5, 9.5], label: 'Điện thoại bàn', model: 'phone', event: 'phone' },
    { id: 'ket_sat', kind: 'keypad', at: [1.4, 9.55], label: 'Két sắt (khóa số)', model: 'safe', wall: 's', puzzle: 'safe', solid: 0.5 },
    { id: 'tu_pk', kind: 'hide', at: [5.72, 6.5], label: 'Tủ đứng', model: 'wardrobe', wall: 'e' },
    { id: 'bup_be', kind: 'examine', at: [2.5, 6.3], label: 'Búp bê', model: 'doll', text: 'Con búp bê bằng sứ. Mình chắc chắn lúc nãy nó quay mặt vào tường.' },
    // Góc học tập
    { id: 'bang_den', kind: 'examine', at: [12, 3.05], label: 'Bảng đen', model: 'blackboard', wall: 'n', text: 'Bài 1: 2 + 2 × 2 = ?\nBài 2: 1, 1, 2, 3, 5, ?\nBài 3: Một nửa của 2, cộng 2 = ?' },
    { id: 'ban_co', kind: 'keypad', at: [14.3, 3.9], label: 'Ngăn bàn học (khóa số)', model: 'teacherDesk', puzzle: 'teacher', solid: 0.7 },
    { id: 'ghe_phat', kind: 'note', at: [9.4, 7.5], label: 'Chiếc ghế quay mặt vào tường', model: 'chairFacingWall', note: 'n_bai_kiem_tra' },
    { id: 'pin_2', kind: 'pickup', at: [15.4, 5.5], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'tu_locker', kind: 'hide', at: [15.72, 7.4], label: 'Tủ đồ', model: 'locker', wall: 'e' },
    // Phòng tắm
    { id: 'guong', kind: 'mirror', at: [22.95, 2.5], label: 'Tấm gương', model: 'mirror', wall: 'e', text: CH1_MIRROR },
    { id: 'tu_thuoc', kind: 'keypad', at: [22.95, 3.7], label: 'Tủ thuốc (khóa số)', model: 'cabinet', wall: 'e', puzzle: 'cabinet' },
    { id: 'gach_men', kind: 'note', at: [19.05, 1.6], label: 'Dòng chữ trên gạch men', model: 'scrawl', wall: 'w', note: 'n_guong' },
    { id: 'bon_tam', kind: 'examine', at: [20.3, 1.5], label: 'Bồn tắm', model: 'bathtub', solid: 0.8, text: 'Bồn tắm đầy nước đen, lặng như mặt gương. Mình không dám nhìn xuống đáy.' },
    { id: 'bang_2', kind: 'pickup', at: [19.6, 4.4], label: 'Băng gạc', model: 'bandage', item: 'bang' },
    // Sảnh
    { id: 'cua_chinh', kind: 'exit', at: [23, 7.5], label: 'Cửa chính (khóa số)', model: 'frontDoor', wall: 'e', puzzle: 'front' },
    { id: 'to_lich', kind: 'note', at: [22.95, 6.5], label: 'Tờ lịch cạnh cửa', model: 'calendar', wall: 'e', note: 'n_cua' },
    { id: 'pin_3', kind: 'pickup', at: [20.5, 9.5], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'thuoc_2', kind: 'pickup', at: [19.5, 6.5], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
    { id: 'tu_sanh', kind: 'hide', at: [22.72, 9.4], label: 'Tủ treo áo khoác', model: 'wardrobe', wall: 'e' },
  ],
  decor: [
    { model: 'rug', at: [3.2, 3.1] },
    { model: 'teddy', at: [3.0, 1.9] },
    { model: 'bookshelf', at: [1.1, 4.3], wall: 'w', solid: 0.4 },
    { model: 'toys', at: [4.6, 2.4] },
    { model: 'runner', at: [7.5, 5], rot: 0, scale: 1 },
    { model: 'runner', at: [12.5, 1.5], rot: Math.PI / 2 },
    { model: 'frame', at: [11, 1.03], wall: 'n' },
    { model: 'frame', at: [14.5, 9.97], wall: 's' },
    { model: 'deadPlant', at: [17.5, 1.4], solid: 0.3 },
    { model: 'tv', at: [5.6, 8.2], wall: 'e', solid: 0.4 },
    { model: 'rug', at: [3.5, 8] },
    { model: 'studentDesk', at: [10.3, 4.6] },
    { model: 'studentDesk', at: [12.2, 4.6] },
    { model: 'studentDesk', at: [14.1, 4.6] },
    { model: 'studentDesk', at: [10.3, 5.95] },
    { model: 'studentDesk', at: [12.2, 5.95] },
    { model: 'studentDesk', at: [14.1, 5.95] },
    { model: 'globe', at: [9.6, 3.6] },
    { model: 'toilet', at: [21.6, 4.5], rot: Math.PI, solid: 0.35 },
    { model: 'coatRack', at: [19.4, 9.5] },
    { model: 'shoeRack', at: [21, 6.1], wall: 'n', solid: 0.3 },
  ],
  windows: [
    { at: [3.3, 1.02], wall: 'n' },
    { at: [3.2, 9.98], wall: 's' },
    { at: [20.5, 1.02], wall: 'n' },
  ],
  lamps: [
    { id: 'den_ngu', at: [1.5, 4.5], color: '#ffb46a', radius: 3.2 },
    { id: 'den_hl_1', at: [7.5, 1.5], color: '#ffe0a0', radius: 3.5 },
    { id: 'den_hl_2', at: [17.5, 9.5], color: '#ffe0a0', radius: 3.5 },
    { id: 'den_pk', at: [3.5, 8], color: '#ffb46a', radius: 3.5 },
    { id: 'den_lh', at: [12, 6.5], color: '#cfe8ff', radius: 4 },
    { id: 'den_sanh', at: [20.5, 7.5], color: '#ffd29a', radius: 3.5 },
  ],
  patrol: [
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
  ],
  entity: { mode: 'patrol', activateFlag: 'entity_active' },
  fog: 0.075,
  ambient: '#1a1c26',
  mood: 'house',
}

export function ch1FragmentCode(): string {
  return ch1.fragments.map((f) => f.digit).join('')
}
export function ch1PhotoCode(): string {
  return [...CH1_PHOTOS].sort((a, b) => a.year - b.year).map((p) => p.people).join('')
}
export function ch1BlackboardCode(): string {
  const b1 = 2 + 2 * 2
  const fib = [1, 1, 2, 3, 5]
  return `${b1}${fib[3] + fib[4]}${2 / 2 + 2}`
}
export function mirrorDisplay(text: string): string {
  return Array.from(text).reverse().join('')
}
