import type { ItemDef } from '../../engine/types'
import { clue, hasFlag, when } from '../common/helpers'

export const items: ItemDef[] = [
  {
    id: 'chia_khoa_dong',
    name: 'Chìa khóa đồng',
    icon: 'key',
    description: 'Chiếc chìa khóa đồng nặng trịch, cán chạm hình rồng đã mòn. Cụ Giáp trao cho bạn sau khi bạn nhìn ra cụ nói dối.',
  },
  {
    id: 'ban_do',
    name: 'Tấm bản đồ làng',
    icon: 'map',
    view: 'map',
    driftFrom: 'a2_map_seg',
    description: 'Bản đồ làng vẽ trên giấy dó, lấy từ hòm gỗ trong hậu cung. Mực trên giấy hình như… không đứng yên.',
    onView: [
      when({ t: 'since', key: 'a2_map_seg', n: 1 }, [
        clue('a2_ban_do_lech'),
        when(hasFlag('a2_map_hint'), [clue('ev_ban_do')]),
      ]),
    ],
  },
]
