import type { ChapterDef } from '../types'

/**
 * CHƯƠNG 4 — LÕI GIẤC MƠ (Bên trong tủ quần áo)
 * Đi qua hành lang ký ức, rồi đối mặt với Kẻ Không Mặt: giữ đèn soi thẳng vào nó qua ba lần xuất hiện.
 */
export const FINALE_PHASES = [2.5, 3.2, 4.2]

export const ch4: ChapterDef = {
  id: 'ch4',
  index: 4,
  title: 'Lõi giấc mơ',
  subtitle: 'Nỗi sợ chính mình',
  intro: [
    'Hành lang này lót gỗ giống hệt nhà cũ. Hai bên tường là những cánh cửa bạn đã từng đi qua: cửa phòng ngủ, cửa kho thể dục, cửa phòng 306.',
    'Cuối hành lang là một căn phòng tròn, tối đen, ở giữa đặt chiếc tủ quần áo năm nào — to như một ngôi nhà.',
    'Bạn nghe tiếng một đứa trẻ khóc. Và tiếng bước chân nặng nề, chậm rãi, quanh quẩn trong bóng tối.',
  ],
  outro: [],
  objective: 'Đi qua hành lang ký ức. Trong căn phòng tròn: đừng chạy — giữ đèn soi thẳng vào Kẻ Không Mặt mỗi lần nó xuất hiện.',
  map: [
    '################',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaa#',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '#######hh#######',
    '################',
  ],
  rooms: {
    a: { name: 'Bên trong tủ quần áo', floor: 'void', wall: 'void', tint: '#6a6280' },
    h: { name: 'Hành lang ký ức', floor: 'wood', wall: 'wallpaper', tint: '#8a7e96' },
  },
  doors: {},
  start: { x: 8, z: 16.3, yaw: 0 },
  puzzles: {},
  notes: {},
  fragments: [],
  interactables: [
    { id: 'cua_nho_1', kind: 'event', at: [7.03, 14.5], label: 'Cánh cửa phòng ngủ cũ', model: 'memoryDoor', wall: 'w', event: 'mem1' },
    { id: 'cua_nho_2', kind: 'event', at: [8.97, 12.5], label: 'Cánh cửa kho thể dục', model: 'memoryDoor', wall: 'e', event: 'mem2' },
    { id: 'cua_nho_3', kind: 'event', at: [7.03, 10.5], label: 'Cánh cửa phòng 306', model: 'memoryDoor', wall: 'w', event: 'mem3' },
    { id: 'pin_1', kind: 'pickup', at: [8.6, 15.2], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'pin_2', kind: 'pickup', at: [7.4, 11.4], label: 'Pin', model: 'battery', item: 'pin' },
    { id: 'thuoc', kind: 'pickup', at: [8.6, 9.6], label: 'Thuốc an thần', model: 'pills', item: 'thuoc' },
  ],
  decor: [
    { model: 'giantWardrobe', at: [8, 2.2], solid: 2.2 },
    { model: 'floatingChair', at: [3, 3] },
    { model: 'floatingBed', at: [12.5, 3.5] },
    { model: 'floatingDesk', at: [3.5, 7] },
    { model: 'floatingClock', at: [12, 7] },
    { model: 'runner', at: [8, 13], rot: 0 },
  ],
  lamps: [
    { id: 'l_hl', at: [8, 13], color: '#9fa8ff', radius: 3 },
    { id: 'l_hl2', at: [8, 10], color: '#ffb080', radius: 2.5 },
  ],
  patrol: [],
  entity: { mode: 'none' },
  finale: true,
  fog: 0.055,
  ambient: '#120e1c',
  mood: 'void',
}
