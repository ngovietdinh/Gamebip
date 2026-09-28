import type { GameContent } from '../engine/registry'
import { area1 } from './area1'
import { area2 } from './area2'
import { area3 } from './area3'
import { area4 } from './area4'
import { ACHIEVEMENTS, COMMON_CHARACTERS, COMMON_CLUES, COMMON_ITEMS, ENDINGS, FALLACIES } from './common/content'
import { all, clue, flag, goto, noFlag, say, when } from './common/helpers'

/**
 * Toàn bộ nội dung game. Muốn thêm khu vực mới: tạo thư mục src/data/areaN
 * (scenes.ts, characters.ts, dialogues.ts, puzzles.ts, clues.ts, index.ts) rồi thêm vào mảng `areas`.
 */
export const content: GameContent = {
  title: 'Làng Sương Mù',
  startScene: 'cho_giua',
  areas: [area1, area2, area3, area4],
  characters: COMMON_CHARACTERS,
  items: COMMON_ITEMS,
  clues: COMMON_CLUES,
  fallacies: FALLACIES,
  achievements: ACHIEVEMENTS,
  endings: ENDINGS,
  onNewGame: [],
  onLoopStart: [
    {
      t: 'card',
      kicker: 'Kết vòng lặp',
      title: 'Lần thứ {loop}…',
      body: 'Chợ phiên. Ngày 1. Buổi sáng. Mọi thứ y như cũ — hay gần như y như cũ. Cuốn sổ tay vẫn còn nguyên những gì bạn đã ghi. Lần này, hãy để ý xem điều gì đã khác.',
    },
  ],
  onSegment: [
    when(all({ t: 'day', min: 3 }, { t: 'tod', in: ['toi'] }), [
      {
        t: 'once',
        key: 'last_night',
        then: [say('Sương đặc quánh lại. Ở đâu đó rất gần, Người lạ thì thầm: "Đêm cuối rồi đấy… đi nhanh lên."', 'nguoi_la')],
      },
    ]),
  ],
  onDeadline: [
    flag('deadline_passed'),
    clue('ev_han_chot'),
    { t: 'sanity', n: 20 },
    { t: 'achievement', id: 'khong_voi' },
    { t: 'markEnding', id: 'hidden' },
    {
      t: 'card',
      kicker: 'Kết ẩn',
      title: 'Ngày thứ tư',
      speaker: 'nguoi_la',
      body: ENDINGS.hidden.paragraphs.join('\n\n') + '\n\nSổ tay đã ghi một bằng chứng đặc biệt: "Hạn chót là giả". Bạn có thể tiếp tục hành trình.',
    },
  ],
  onEnding: [when({ t: 'sanity', min: 100 }, [{ t: 'achievement', id: 'tinh_tao_tuyet_doi' }])],
  overlays: {
    fakeGameOver: {
      restart: [
        {
          t: 'once',
          key: 'a3_fake_restart',
          then: [
            {
              t: 'mistake',
              fallacy: 'authority',
              deferred: true,
              explain:
                'Bạn tin ngay dòng chữ GAME OVER chỉ vì nó trông như thông báo chính thức của trò chơi. Màn hình cũng chỉ là một nguồn tin — và nguồn tin có thể nói dối.',
              missed: 'Thầy đồ đã dặn: "Khi thấy chữ kết thúc, hãy nhìn vào chữ tròn như cửa."',
              sanity: 3,
            },
          ],
        },
        { t: 'incFlag', key: 'a3_restart_count' },
      ],
      escape: [
        { t: 'closeOverlay' },
        { t: 'sound', id: 'bell' },
        flag('a3_done'),
        { t: 'achievement', id: 'chu_tron' },
        { t: 'sanity', n: 10 },
        when(noFlag('hint:a3'), [{ t: 'achievement', id: 'khong_goi_y' }, { t: 'sanity', n: 5 }]),
        say('Bạn đã nhìn kỹ. Rừng trúc mở ra.'),
        say('Bạn bước qua khe sáng tròn như cánh cửa. Sau lưng, rừng trúc khép lại. Trời đã sang buổi khác từ lúc nào không hay.'),
        { t: 'nextSegment' },
        goto('bo_song', true),
      ],
    },
  },
}
