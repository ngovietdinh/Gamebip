import type { ChapterDef } from '../types'

/**
 * CHƯƠNG 2 — TRƯỜNG HỌC BAN ĐÊM
 * Nỗi sợ: bị phán xét, bị bắt nạt, thất bại.
 * Cơ chế mới: những đứa trẻ không mặt chỉ di chuyển khi bạn không nhìn chúng.
 */

/** Thứ tự nốt trên đàn: Đô=1 … Si=7, mỗi nốt một màu dán trên phím. */
export const NOTE_NAMES = ['Đô', 'Rê', 'Mi', 'Pha', 'Son', 'La', 'Si']
export const NOTE_COLORS = ['#d9352b', '#ee8a2a', '#f2d23c', '#4caf50', '#2f7fe0', '#16b3a6', '#8e44ad']
export const NOTE_COLOR_NAMES = ['đỏ', 'cam', 'vàng', 'xanh lá', 'xanh dương', 'xanh ngọc', 'tím']
/** Bản nhạc trên giá: chuỗi màu (chỉ số nốt 0–6). */
export const SHEET = [0, 0, 4, 4, 5, 5, 4]

export const TIMETABLE = ['Tiết 1: Tiếng Việt', 'Tiết 2: Tiếng Anh', 'Tiết 3: Toán']
export const REPORT = { toan: 3, van: 7, anh: 5 }

export const ch2: ChapterDef = {
  id: 'ch2',
  index: 2,
  title: 'Trường học',
  subtitle: 'Nỗi sợ bị phán xét',
  intro: [
    'Trường Tiểu học Hoa Sen. Bạn đứng giữa lớp 5A, nơi bạn từng ngồi bàn cuối, cạnh cửa sổ.',
    'Trên bảng có ai đó viết bằng phấn: "CHÀO MỪNG AN QUAY LẠI". Ngoài hành lang, những bóng học sinh mặc áo trắng, quàng khăn đỏ, đứng im như tượng. Chúng không có mặt.',
    'Chúng không nhúc nhích khi bạn nhìn. Nhưng mỗi lần bạn quay lưng…',
  ],
  outro: [
    'Cổng trường kẽo kẹt mở ra. Phía bên kia không phải con đường về nhà, mà là một hành lang dài lát gạch trắng, nồng mùi thuốc sát trùng.',
    'Một tấm biển xanh treo lệch: "BỆNH VIỆN ĐA KHOA — TẦNG 3". Đèn vụt tắt.',
  ],
  objective: 'Mở tủ đồ số 17, vào phòng hiệu trưởng, tìm chìa kho thể dục — rồi lấy chìa cổng trường để thoát.',
  map: [
    '##########################',
    '#sssss#mmmmm#www#ooooo####',
    '#sssss#mmmmm#www#ooooo####',
    '#sssss#mmmmm#www#ooooo####',
    '###1#####2####6####3######',
    '#hhhhhhhhhhhhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhhhhhhhhhhhh9',
    '############4#############',
    '#########ggggggg##########',
    '#########ggggggg##########',
    '#########ggggggg##########',
    '##########################',
  ],
  rooms: {
    s: { name: 'Lớp 5A', floor: 'lino', wall: 'school', tint: '#c8d0b8' },
    m: { name: 'Phòng nhạc', floor: 'wood', wall: 'plaster', tint: '#c0a8a0' },
    w: { name: 'Nhà vệ sinh', floor: 'tile', wall: 'tile', tint: '#a8b8b0' },
    o: { name: 'Phòng hiệu trưởng', floor: 'carpet', wall: 'wallpaper', tint: '#9a8a70' },
    h: { name: 'Hành lang trường', floor: 'tile', wall: 'school', tint: '#b8c0a8' },
    g: { name: 'Kho dụng cụ thể dục', floor: 'concrete', wall: 'brick', tint: '#a09080' },
  },
  doors: {
    '1': { name: 'Cửa lớp 5A' },
    '2': { name: 'Cửa phòng nhạc' },
    '6': { name: 'Cửa nhà vệ sinh' },
    '3': { name: 'Cửa phòng hiệu trưởng', key: 'key_ht' },
    '4': { name: 'Cửa kho thể dục', key: 'key_kho' },
  },
  start: { x: 3.5, z: 3.6, yaw: 0 },
  puzzles: {
    tu17: {
      id: 'tu17',
      title: 'Tủ đồ số 17 — khóa 3 số',
      code: '753',
      hint: 'Điểm các môn trong học bạ, xếp theo thứ tự các tiết sáng thứ Hai.',
      items: ['key_ht'],
      fragment: 'c2-2',
      solved: 'Cánh tủ bật ra. Hàng chục mẩu giấy vo tròn rơi lả tả… và chìa khóa phòng hiệu trưởng.',
    },
    piano: {
      id: 'piano',
      kind: 'notes',
      title: 'Cây đàn piano cũ',
      code: SHEET.map((n) => n + 1).join(''),
      hint: 'Mỗi phím có một nhãn màu. Bản nhạc trên giá cũng được viết bằng màu.',
      items: ['pin'],
      fragment: 'c2-1',
      solved: 'Giai điệu quen thuộc vang lên trong căn phòng trống. Nắp đàn bật mở, bên trong có một cục pin và một mảnh ký ức.',
    },
  },
  notes: {
    n_tkb: {
      id: 'n_tkb',
      title: 'Thời khóa biểu — Sáng thứ Hai',
      body: TIMETABLE.join('\n'),
    },
    n_hoc_ba: {
      id: 'n_hoc_ba',
      title: 'Học bạ của An',
      body: `Toán: ${REPORT.toan}\nTiếng Việt: ${REPORT.van}\nTiếng Anh: ${REPORT.anh}\nNhận xét của giáo viên: "Em cần cố gắng nhiều hơn nữa."`,
    },
    n_tu: {
      id: 'n_tu',
      title: 'Mẩu giấy dán trên tủ đồ',
      body: 'Tủ 17 — của An.\nMã tủ: điểm các môn, theo đúng thứ tự các tiết sáng thứ Hai.\n(Đừng quên nữa nhé, đồ ngốc.)',
    },
    n_bong: {
      id: 'n_bong',
      title: 'Chữ phấn trên tường hành lang',
      body: 'CHÚNG CHỈ ĐI KHI MÀY KHÔNG NHÌN.\nSOI ĐÈN VÀO CHÚNG. ĐỪNG QUAY LƯNG.\nĐi lùi cũng được.',
    },
    n_nhac: {
      id: 'n_nhac',
      title: 'Tờ giấy kẹp trên giá nhạc',
      body: '"Bài cô dạy lớp mình hôm cuối cùng.\nCô dán màu lên phím cho các con dễ nhớ.\nAi đánh lại được, cô sẽ để quà trong đàn."',
    },
    n_ve_sinh: {
      id: 'n_ve_sinh',
      title: 'Chữ viết trên cửa buồng vệ sinh',
      body: 'AN ĐỒ NGỐC 3 ĐIỂM.\nBỐ MẸ MÀY BỎ MÀY RỒI.\n(Bên dưới, nét chữ nhỏ hơn, run run: "không phải đâu")',
    },
  },
  fragments: [
    { id: 'c2-1', chapter: 'ch2', title: 'Bài hát của cô', text: 'Cô giáo âm nhạc là người duy nhất từng khen mình: "An hát hay lắm." Hôm cô chuyển trường, mình trốn trong nhà vệ sinh, không dám nói lời tạm biệt.' },
    { id: 'c2-2', chapter: 'ch2', title: 'Tủ số 17', text: 'Trong tủ có mười bảy mẩu giấy bọn nó nhét vào: "đồ ngốc", "bố mẹ mày bỏ mày rồi". Mình chưa bao giờ kể với ai. Mình nghĩ chúng nói đúng.' },
    {
      id: 'c2-3',
      chapter: 'ch2',
      title: 'Kho thể dục',
      text: 'Năm lớp 5, bọn nó khóa mình trong kho thể dục đến tối. Không ai đến tìm. Mình ngồi giữa đống đệm cũ, đếm nhịp tim, và lần đầu tiên thấy cái bóng không có mặt đứng ở góc phòng — nhìn mình, không nói gì.',
    },
  ],
  interactables: [
    // Lớp 5A
    { id: 'bang_lop', kind: 'examine', at: [3, 1.05], label: 'Bảng đen', model: 'classBoard', wall: 'n', text: 'Nét phấn run rẩy: "CHÀO MỪNG AN QUAY LẠI LỚP 5A".\nBên dưới là mười bảy vạch đếm, như ai đó đang đếm ngày.' },
    { id: 'tkb', kind: 'note', at: [1.05, 2.4], label: 'Thời khóa biểu', model: 'poster', wall: 'w', note: 'n_tkb' },
    { id: 'ban_an', kind: 'note', at: [4.3, 3.2], label: 'Bàn cuối — chỗ của An', model: 'studentDesk', note: 'n_hoc_ba', solid: 0.5 },
    { id: 'tu_lop', kind: 'hide', at: [5.72, 1.6], label: 'Tủ đựng đồ của lớp', model: 'wardrobe', wall: 'e' },
    // Hành lang
    { id: 'phan_tuong', kind: 'note', at: [6.5, 5.05], label: 'Chữ phấn trên tường', model: 'scrawl', wall: 'n', note: 'n_bong' },
    { id: 'giay_tu', kind: 'note', at: [15.4, 6.95], label: 'Mẩu giấy dán trên tủ', model: 'stickyNote', wall: 's', note: 'n_tu' },
    { id: 'tu_17', kind: 'keypad', at: [16.5, 6.72], label: 'Tủ đồ số 17 (khóa số)', model: 'locker17', wall: 's', puzzle: 'tu17' },
    { id: 'tu_ve_sinh_1', kind: 'hide', at: [8.5, 6.72], label: 'Kho chổi', model: 'janitorCloset', wall: 's' },
    { id: 'tu_ve_sinh_2', kind: 'hide', at: [22.5, 5.28], label: 'Tủ âm tường', model: 'wardrobe', wall: 'n' },
    { id: 'pin_h', kind: 'pickup', at: [23.6, 5.6], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'cua_3', kind: 'door', at: [19.5, 4.5], label: 'Cửa phòng hiệu trưởng', model: 'none', door: '3' },
    { id: 'cua_4', kind: 'door', at: [12.5, 7.5], label: 'Cửa kho thể dục', model: 'none', door: '4' },
    // Phòng nhạc
    { id: 'piano', kind: 'piano', at: [9, 1.15], label: 'Cây đàn piano', model: 'piano', wall: 'n', puzzle: 'piano', solid: 0.6 },
    { id: 'gia_nhac', kind: 'note', at: [10.8, 2], label: 'Tờ giấy trên giá nhạc', model: 'musicStand', note: 'n_nhac' },
    // Nhà vệ sinh
    { id: 'cua_buong', kind: 'note', at: [15.95, 2.2], label: 'Cửa buồng vệ sinh', model: 'stall', wall: 'e', note: 'n_ve_sinh' },
    { id: 'thuoc_w', kind: 'pickup', at: [13.6, 1.5], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
    // Phòng hiệu trưởng
    { id: 'ban_ht', kind: 'pickup', at: [19.5, 2.1], label: 'Ngăn bàn hiệu trưởng', model: 'principalDesk', item: 'key_kho', solid: 0.8 },
    { id: 'loa', kind: 'event', at: [17.05, 1.8], label: 'Loa phát thanh', model: 'intercom', wall: 'w', event: 'loa' },
    { id: 'bang_ht', kind: 'pickup', at: [21.3, 3.4], label: 'Băng gạc', model: 'bandage', item: 'bang' },
    { id: 'tu_ht', kind: 'hide', at: [21.72, 1.8], label: 'Tủ hồ sơ', model: 'wardrobe', wall: 'e' },
    // Kho thể dục
    { id: 'khan_quang', kind: 'memory', at: [11.5, 9.4], label: 'Chiếc khăn quàng đỏ bị giẫm nát', model: 'scarf', fragment: 'c2-3' },
    { id: 'chia_cong', kind: 'pickup', at: [14.6, 10.3], label: 'Chìa cổng trường', model: 'keyItem', item: 'key_cong' },
    { id: 'dem', kind: 'hide', at: [9.7, 10.2], label: 'Trốn sau đống đệm', model: 'gymMats' },
    { id: 'pin_g', kind: 'pickup', at: [15.4, 8.5], label: 'Pin', model: 'battery', item: 'pin' },
    // Cổng
    { id: 'cong', kind: 'exit', at: [25, 6.5], label: 'Cổng trường', model: 'gate', wall: 'e', key: 'key_cong', lockedText: 'Cổng trường khóa bằng một ổ khóa to. Cần chìa cổng trường.' },
  ],
  decor: [
    { model: 'studentDesk', at: [1.9, 2.1] },
    { model: 'studentDesk', at: [3.3, 2.1] },
    { model: 'studentDesk', at: [1.9, 3.2] },
    { model: 'studentDesk', at: [3.0, 3.2] },
    { model: 'teacherTable', at: [3, 1.5], solid: 0.5 },
    { model: 'flag', at: [5.4, 1.1], wall: 'n' },
    { model: 'lockerRow', at: [18.5, 6.75], wall: 's' },
    { model: 'lockerRow', at: [13.8, 6.75], wall: 's' },
    { model: 'noticeBoard', at: [4.5, 5.05], wall: 'n' },
    { model: 'noticeBoard', at: [11, 5.05], wall: 'n' },
    { model: 'bench', at: [20, 6.6], wall: 's' },
    { model: 'chairRow', at: [8.5, 2.6] },
    { model: 'sink', at: [13.2, 3.7], rot: Math.PI },
    { model: 'sink', at: [14.4, 3.7], rot: Math.PI },
    { model: 'stallWall', at: [15.5, 1.2] },
    { model: 'bookshelf', at: [18, 1.05], wall: 'n', solid: 0.4 },
    { model: 'trophy', at: [20.8, 1.1], wall: 'n' },
    { model: 'gymMatsStack', at: [13.5, 10.2] },
    { model: 'balls', at: [10.6, 8.6] },
    { model: 'vaultBox', at: [12.8, 8.7], solid: 0.5 },
  ],
  windows: [
    { at: [1.02, 1.6], wall: 'w' },
    { at: [11, 1.02], wall: 'n' },
    { at: [19.5, 1.02], wall: 'n' },
  ],
  lamps: [
    { id: 'l_lop', at: [3, 2], color: '#d8e8ff', radius: 3.2 },
    { id: 'l_h1', at: [4, 5.5], color: '#e0f0ff', radius: 3.5 },
    { id: 'l_h2', at: [12, 6], color: '#e0f0ff', radius: 3.5 },
    { id: 'l_h3', at: [20, 5.5], color: '#e0f0ff', radius: 3.5 },
    { id: 'l_nhac', at: [9.5, 2.2], color: '#ffc080', radius: 3 },
    { id: 'l_ht', at: [19.5, 2.4], color: '#ffc890', radius: 3 },
  ],
  shades: [
    [5.5, 6.2],
    [10.5, 5.4],
    [17.5, 6.3],
    [22.5, 5.5],
  ],
  patrol: [
    [2, 5],
    [8, 6],
    [13, 5],
    [19, 6],
    [24, 5],
    [12, 9],
    [9, 2],
    [19, 2],
  ],
  entity: { mode: 'patrol', activateFlag: 'c2_kho_trap', spawn: [24, 5], speed: 1.05 },
  fog: 0.06,
  ambient: '#1a2028',
  mood: 'school',
}
