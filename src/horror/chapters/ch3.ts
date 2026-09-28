import type { ChapterDef } from '../types'

/**
 * CHƯƠNG 3 — BỆNH VIỆN MẤT ĐIỆN
 * Nỗi sợ: mất mát, không kịp nói lời tạm biệt.
 * Cơ chế mới: mất điện toàn tầng — tìm 3 cầu chì (chiếm chỗ trong túi 4 ô!) để khôi phục điện
 * và gọi thang máy. Có điện trở lại thì Kẻ Không Mặt biết bạn ở đâu.
 */

export const GRANDMA = { name: 'Trần Thị Lan', day: 12, month: 5, year: 1944, room: 306 }
export const SHIFTS = [
  { name: 'Ca sáng', start: '06:00' },
  { name: 'Ca chiều', start: '14:00' },
  { name: 'Ca đêm', start: '22:00' },
]

export const ch3: ChapterDef = {
  id: 'ch3',
  index: 3,
  title: 'Bệnh viện',
  subtitle: 'Nỗi sợ mất mát',
  intro: [
    'Tầng 3, khoa Nội. Bạn nhớ nơi này. Mùa đông năm bạn mười hai tuổi, bà ngoại nằm ở đây suốt ba tuần.',
    'Bà là người đã nuôi bạn sau khi bố mẹ chia tay. Bà là người duy nhất chưa bao giờ bỏ đi.',
    'Cả tầng mất điện. Thang máy đứng im. Phía cuối hành lang, máy đo nhịp tim ở phòng 306 vẫn kêu tít… tít… dù không còn ai nằm đó.',
  ],
  outro: [
    'Cửa thang máy khép lại. Con số trên bảng nhảy loạn: 3… 2… 1… 0… rồi -1, -2, -17.',
    'Khi cửa mở ra lần nữa, trước mặt bạn là một hành lang lót gỗ, dẫn tới một cánh tủ quần áo khổng lồ. Bạn biết mình đang ở đâu. Bạn đang ở nơi mọi chuyện bắt đầu.',
  ],
  objective: 'Tìm 3 cầu chì (phòng y tá, phòng 303, phòng 306), lắp vào tủ điện ở phòng máy, rồi đi thang máy.',
  map: [
    '##########################',
    '#aaaa#bbbb#cccc#nnnn#gggg#',
    '#aaaa#bbbb#cccc#nnnn#gggg#',
    '##1####2####3####4####5###',
    '#hhhhhhhhhhhhhhhhhhhhhhhh#',
    '#hhhhhhhhhhhhhhhhhhhhhhhh9',
    '#rrrr##6####7####8########',
    '#rrrr#dddd#eeee#ffff######',
    '#rrrr#dddd#eeee#ffff######',
    '#rrrr#dddd#eeee#ffff######',
    '##########################',
  ],
  rooms: {
    a: { name: 'Phòng 301', floor: 'lino', wall: 'hospital', tint: '#b8c8c4' },
    b: { name: 'Phòng 302', floor: 'lino', wall: 'hospital', tint: '#b8c8c4' },
    c: { name: 'Phòng 303 — X-quang', floor: 'lino', wall: 'hospital', tint: '#a8b8c8' },
    n: { name: 'Phòng y tá', floor: 'lino', wall: 'hospital', tint: '#c0c8b8' },
    g: { name: 'Phòng máy', floor: 'concrete', wall: 'brick', tint: '#8a8a88' },
    h: { name: 'Hành lang tầng 3', floor: 'tile', wall: 'hospital', tint: '#c4ccc8' },
    r: { name: 'Sảnh tiếp đón', floor: 'tile', wall: 'hospital', tint: '#c8ccc0' },
    d: { name: 'Phòng 304', floor: 'lino', wall: 'hospital', tint: '#b8c8c4' },
    e: { name: 'Phòng 305', floor: 'lino', wall: 'hospital', tint: '#b8c8c4' },
    f: { name: 'Phòng 306', floor: 'lino', wall: 'hospital', tint: '#c8c0b8' },
  },
  doors: {
    '1': { name: 'Cửa phòng 301' },
    '2': { name: 'Cửa phòng 302' },
    '3': { name: 'Cửa phòng 303', key: 'key_303' },
    '4': { name: 'Cửa phòng y tá', puzzle: 'yta' },
    '5': { name: 'Cửa phòng máy' },
    '6': { name: 'Cửa phòng 304' },
    '7': { name: 'Cửa phòng 305' },
    '8': { name: 'Cửa phòng 306' },
  },
  start: { x: 2.5, z: 8.4, yaw: 0 },
  powerFlag: 'power_on',
  puzzles: {
    yta: {
      id: 'yta',
      title: 'Cửa phòng y tá — khóa 4 số',
      code: SHIFTS[2].start.replace(':', ''),
      hint: 'Mã phòng y tá là giờ bắt đầu ca đêm, viết đủ 4 số.',
      items: [],
      opens: '4',
      solved: 'Đèn xanh trên ổ khóa nháy lên. Cửa phòng y tá mở hé.',
    },
    ngan_ba: {
      id: 'ngan_ba',
      title: 'Ngăn tủ đầu giường — khóa 4 số',
      code: `${String(GRANDMA.day).padStart(2, '0')}${String(GRANDMA.month).padStart(2, '0')}`,
      hint: 'Bà luôn dùng ngày và tháng sinh của mình làm mật mã: ngày trước, tháng sau.',
      items: ['cau_chi'],
      fragment: 'c3-2',
      solved: 'Ngăn kéo trượt ra. Một cầu chì, một chiếc kính lão… và một bức thư viết tay.',
    },
  },
  notes: {
    n_lich: {
      id: 'n_lich',
      title: 'Bảng trắng ở quầy tiếp đón',
      body: `LỊCH TRỰC\n${SHIFTS.map((s) => `${s.name}: bắt đầu ${s.start}`).join('\n')}\n\nLưu ý: mã cửa phòng y tá = giờ bắt đầu ca đêm (4 số).`,
    },
    n_benh_nhan: {
      id: 'n_benh_nhan',
      title: 'Danh sách bệnh nhân khoa Nội',
      body: `P.301 — (trống)\nP.304 — Lê Văn Sáu\nP.305 — (trống)\nP.${GRANDMA.room} — ${GRANDMA.name}, sinh ngày ${GRANDMA.day}/${GRANDMA.month}/${GRANDMA.year}\nGhi chú: người nhà bệnh nhân P.306 — cháu An, chưa đến thăm.`,
    },
    n_thiep: {
      id: 'n_thiep',
      title: 'Tấm thiệp trên tủ đầu giường',
      body: '"Mừng bà tròn 80 tuổi!"\nNét chữ trẻ con, nguệch ngoạc — của chính bạn, năm lên bảy.\nMặt sau, bà ghi: "Mật mã của bà: ngày trước, tháng sau."',
    },
    n_bac_si: {
      id: 'n_bac_si',
      title: 'Bệnh án treo cuối giường',
      body: 'Bệnh nhân tỉnh táo, ăn kém.\nHỏi cháu nhiều lần trong ngày.\nĐề nghị gia đình sắp xếp cho cháu vào thăm sớm.',
    },
    n_may: {
      id: 'n_may',
      title: 'Bảng hướng dẫn trên tủ điện',
      body: 'MẤT ĐIỆN: lắp đủ 3 cầu chì dự phòng vào tủ điện chính rồi gạt cầu dao.\nCầu chì dự phòng cất ở: phòng y tá, phòng X-quang, và… (dòng cuối bị nhòe nước).',
    },
  },
  fragments: [
    { id: 'c3-1', chapter: 'ch3', title: 'Ba lần đứng ngoài cửa', text: 'Cô y tá kể: tuần cuối, ngày nào bà cũng hỏi "Thằng An đến chưa?". Mình đã đứng ngoài hành lang này ba lần, rồi quay về. Mình sợ nhìn thấy bà yếu đi.' },
    { id: 'c3-2', chapter: 'ch3', title: 'Thư của bà', text: '"An ơi, bà không giận đâu. Sợ thì cứ sợ, nhưng đừng trốn mãi trong tủ nhé con. Bóng tối không ăn thịt ai cả. Nó chỉ chờ con quay lại nhìn nó thôi."' },
    { id: 'c3-3', chapter: 'ch3', title: 'Cầu thang', text: 'Đêm bà mất, điện bệnh viện chập chờn. Mình ngồi một mình ở chiếu nghỉ cầu thang, và cái bóng không mặt ngồi ngay bậc trên. Nó chẳng làm gì cả. Nó chỉ… ở đó, như thể đang canh cho mình.' },
  ],
  interactables: [
    // Sảnh tiếp đón
    { id: 'bang_trang', kind: 'note', at: [1.05, 7.5], label: 'Bảng trắng lịch trực', model: 'whiteboard', wall: 'w', note: 'n_lich' },
    { id: 'quay', kind: 'note', at: [2.8, 6.8], label: 'Danh sách bệnh nhân trên quầy', model: 'receptionDesk', note: 'n_benh_nhan', solid: 0.8 },
    { id: 'gam_quay', kind: 'hide', at: [1.4, 9.5], label: 'Nấp sau tủ hồ sơ', model: 'fileCabinet', rot: Math.PI },
    { id: 'pin_r', kind: 'pickup', at: [4.4, 9.5], label: 'Pin', model: 'battery', item: 'pin' },
    // Hành lang
    { id: 'pin_h', kind: 'pickup', at: [15, 4.4], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'cua_yta', kind: 'door', at: [17.5, 3.5], label: 'Cửa phòng y tá (khóa số)', model: 'none', door: '4' },
    { id: 'cua_303', kind: 'door', at: [12.5, 3.5], label: 'Cửa phòng 303', model: 'none', door: '3' },
    { id: 'thang_may', kind: 'exit', at: [25, 5.5], label: 'Thang máy', model: 'elevator', wall: 'e', needFlag: 'power_on', lockedText: 'Thang máy tối om, nút bấm không sáng. Cả tầng đang mất điện.' },
    // 301
    { id: 'giuong_301', kind: 'hide', at: [2.6, 1.6], label: 'Trốn dưới gầm giường bệnh', model: 'hospitalBed', solid: 0.9 },
    { id: 'bang_301', kind: 'pickup', at: [4.3, 2.4], label: 'Băng gạc', model: 'bandage', item: 'bang' },
    // 302
    { id: 'tu_302', kind: 'hide', at: [9.72, 1.5], label: 'Tủ quần áo bệnh nhân', model: 'wardrobe', wall: 'e' },
    { id: 'pin_302', kind: 'pickup', at: [6.6, 2.3], label: 'Pin', model: 'battery', item: 'pin' },
    // 303 X-quang
    { id: 'cau_chi_2', kind: 'pickup', at: [13.8, 1.6], label: 'Cầu chì', model: 'fuse', item: 'cau_chi' },
    { id: 'phim_xq', kind: 'examine', at: [11.05, 1.6], label: 'Hộp đèn đọc phim X-quang', model: 'xrayBox', wall: 'w', text: 'Tấm phim chụp lồng ngực của một người già. Góc phim ghi: "Trần Thị Lan — 80 tuổi". Hai lá phổi mờ đục như sương.' },
    // Phòng y tá
    { id: 'cau_chi_1', kind: 'pickup', at: [18.8, 2.3], label: 'Cầu chì', model: 'fuse', item: 'cau_chi' },
    { id: 'so_yta', kind: 'memory', at: [16.6, 1.5], label: 'Sổ giao ca của y tá', model: 'logbook', fragment: 'c3-1' },
    { id: 'tu_yta', kind: 'hide', at: [19.72, 1.4], label: 'Tủ thuốc lớn', model: 'wardrobe', wall: 'e' },
    // Phòng máy
    { id: 'tu_dien', kind: 'event', at: [22.5, 1.05], label: 'Tủ điện chính', model: 'fusebox', wall: 'n', event: 'generator' },
    { id: 'huong_dan', kind: 'note', at: [24.95, 2.2], label: 'Bảng hướng dẫn', model: 'poster', wall: 'e', note: 'n_may' },
    // 304
    { id: 'thuoc_304', kind: 'pickup', at: [7, 8.6], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
    { id: 'giuong_304', kind: 'hide', at: [8.4, 8.4], label: 'Trốn dưới gầm giường bệnh', model: 'hospitalBed', solid: 0.9 },
    // 305
    { id: 'chia_303', kind: 'pickup', at: [12.4, 9.3], label: 'Chìa phòng 303', model: 'keyItem', item: 'key_303' },
    { id: 'tu_305', kind: 'hide', at: [14.72, 8.4], label: 'Tủ quần áo bệnh nhân', model: 'wardrobe', wall: 'e' },
    // 306 — phòng của bà
    { id: 'thiep', kind: 'note', at: [18.3, 9.2], label: 'Tấm thiệp mừng thọ', model: 'card', note: 'n_thiep' },
    { id: 'ngan_ba', kind: 'keypad', at: [19.35, 8.4], label: 'Ngăn tủ đầu giường (khóa số)', model: 'bedsideCabinet', puzzle: 'ngan_ba', solid: 0.35 },
    { id: 'benh_an', kind: 'note', at: [16.7, 8.2], label: 'Bệnh án cuối giường', model: 'clipboard', note: 'n_bac_si' },
  ],
  decor: [
    { model: 'hospitalBed', at: [12.5, 8.2], solid: 0.9 },
    { model: 'hospitalBed', at: [17.6, 8.4], solid: 0.9 },
    { model: 'hospitalBed', at: [7.8, 1.6], solid: 0.9 },
    { model: 'curtain', at: [4, 1.4] },
    { model: 'curtain', at: [11.2, 8.9] },
    { model: 'ivStand', at: [3.8, 1.8] },
    { model: 'ivStand', at: [18.5, 7.6] },
    { model: 'monitor', at: [16.4, 7.5] },
    { model: 'flowers', at: [19.4, 8.25] },
    { model: 'wheelchair', at: [9.5, 5.3], rot: 1.2 },
    { model: 'chairRow', at: [3.5, 4.5], rot: Math.PI / 2 },
    { model: 'gurney', at: [21.5, 4.6], rot: Math.PI / 2 },
    { model: 'medShelf', at: [17.5, 1.05], wall: 'n' },
    { model: 'xrayMachine', at: [12.8, 1.6], solid: 0.6 },
    { model: 'generator', at: [23.5, 2.3], solid: 0.7 },
    { model: 'pipes', at: [21.2, 1.05], wall: 'n' },
    { model: 'exitSign', at: [24.95, 4.4], wall: 'e' },
    { model: 'noticeBoard', at: [9, 4.03], wall: 'n' },
  ],
  windows: [
    { at: [8, 9.98], wall: 's' },
    { at: [13, 9.98], wall: 's' },
    { at: [18, 9.98], wall: 's' },
    { at: [3, 1.02], wall: 'n' },
  ],
  lamps: [
    { id: 'l_h1', at: [4, 4.5], color: '#e8fff4', radius: 3.5, needsPower: true },
    { id: 'l_h2', at: [12, 4.5], color: '#e8fff4', radius: 3.5, needsPower: true },
    { id: 'l_h3', at: [20, 4.5], color: '#e8fff4', radius: 3.5, needsPower: true },
    { id: 'l_r', at: [2.5, 7.8], color: '#f0f8ff', radius: 3.2, needsPower: true },
    { id: 'l_306', at: [17.5, 8.2], color: '#fff0d8', radius: 3, needsPower: true },
    { id: 'l_khan', at: [24.3, 4.8], color: '#ff2a1a', radius: 2.4 },
  ],
  patrol: [
    [2, 4],
    [8, 5],
    [13, 4],
    [19, 5],
    [23, 4],
    [7, 8],
    [12, 8],
    [17, 8],
    [2, 1],
    [8, 1],
    [22, 2],
  ],
  entity: { mode: 'patrol', spawn: [23, 5], speed: 0.9, enrageFlag: 'power_on' },
  fog: 0.07,
  ambient: '#161c22',
  mood: 'hospital',
}
