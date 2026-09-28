import type { ItemDef } from './types'

export const ITEMS: Record<string, ItemDef> = {
  pin: { id: 'pin', kind: 'battery', name: 'Pin', icon: '🔋', desc: 'Một cục pin cũ. Nạp thêm 40% cho đèn pin.' },
  thuoc: { id: 'thuoc', kind: 'pills', name: 'Thuốc an thần', icon: '💊', desc: 'Vỉ thuốc an thần. Hồi 35 tinh thần.' },
  bang: { id: 'bang', kind: 'bandage', name: 'Băng gạc', icon: '🩹', desc: 'Cuộn băng gạc. Hồi 1 máu.' },
  // Chương 1
  key_bedroom: { id: 'key_bedroom', kind: 'key', name: 'Chìa phòng ngủ', icon: '🗝️', desc: 'Chìa khóa nhỏ có móc hình ngôi sao.' },
  key_class: { id: 'key_class', kind: 'key', name: 'Chìa góc học tập', icon: '🗝️', desc: 'Chìa khóa có thẻ nhựa ghi "Góc học tập của con".' },
  key_bath: { id: 'key_bath', kind: 'key', name: 'Chìa phòng tắm', icon: '🗝️', desc: 'Chìa khóa gỉ, lạnh buốt như vừa ngâm nước.' },
  // Chương 2
  key_ht: { id: 'key_ht', kind: 'key', name: 'Chìa phòng hiệu trưởng', icon: '🗝️', desc: 'Chìa đồng có thẻ gỗ khắc chữ "HT".' },
  key_kho: { id: 'key_kho', kind: 'key', name: 'Chìa kho thể dục', icon: '🗝️', desc: 'Chìa khóa móp méo. Mùi cao su và bụi.' },
  key_cong: { id: 'key_cong', kind: 'key', name: 'Chìa cổng trường', icon: '🗝️', desc: 'Chìa khóa to, nặng. Cổng trường chưa bao giờ khóa vào ban ngày.' },
  // Chương 3
  key_303: { id: 'key_303', kind: 'key', name: 'Chìa phòng 303', icon: '🗝️', desc: 'Thẻ nhựa: "Phòng chụp X-quang — 303".' },
  cau_chi: { id: 'cau_chi', kind: 'fuse', name: 'Cầu chì', icon: '🔌', desc: 'Cầu chì sứ loại lớn. Tủ điện phòng máy cần 3 cái.' },
}

export const INVENTORY_SLOTS = 4
export const MAX_HP = 3
