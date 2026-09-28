# Làng Sương Mù

Game phiêu lưu giải đố viết bằng **React + Vite + TypeScript**, quản lý state bằng **Zustand**, có hai chế độ hình ảnh:

- **3D (mặc định):** góc nhìn thứ ba, bạn tự điều khiển lữ khách đi lại trong làng, tới gần người và vật để nói chuyện, xem xét, đi qua các cổng sáng để sang cảnh khác. Dựng bằng three.js từ hình khối cơ bản.
- **2D:** point-and-click kiểu visual novel, cảnh vẽ bằng SVG.

Đổi chế độ trong **Cài đặt → Chế độ hình ảnh**. Máy không hỗ trợ WebGL sẽ tự chuyển sang 2D. Không dùng game engine hay asset ngoài: sương mù chạy trên canvas, âm thanh tổng hợp bằng Web Audio API.

> Bạn là một lữ khách tỉnh dậy giữa chợ phiên của một ngôi làng vùng núi phía Bắc. Một Người lạ đội nón nói: *"Sương sẽ tan sau 3 ngày. Ai còn kẹt trong làng lúc đó sẽ ở lại mãi mãi."* Bạn phải đi qua 4 khu vực để tìm đường ra. Mỗi khu dạy một kỹ năng tư duy: **quan sát, logic, ngôn ngữ, nghi ngờ nguồn tin**.

## Chạy game

```bash
npm install
npm run dev        # mở http://localhost:5173
```

```bash
npm run build      # kiểm tra kiểu + build tĩnh vào dist/ (dùng đường dẫn tương đối, đặt ở thư mục con nào cũng chạy)
npm run preview    # xem thử bản build
npm test           # chạy toàn bộ unit test (Vitest)
```

Game hỗ trợ màn hình dọc trên điện thoại (từ 375px) và desktop.

### Điều khiển (chế độ 3D)

| Thao tác | Máy tính | Điện thoại |
| --- | --- | --- |
| Đi lại | `W A S D` hoặc phím mũi tên | Joystick ảo góc trái dưới |
| Xoay camera | Kéo chuột (hoặc `Q` / `R`) | Vuốt trên màn hình |
| Tương tác với người/vật gần nhất | `E` (hoặc `F`), hoặc nút vàng góc phải | Nút vàng góc phải |
| Tự đi tới rồi tương tác | Bấm vào người/vật | Chạm vào người/vật |
| Đi tới một điểm | Bấm xuống đất | Chạm xuống đất |
| Sang cảnh khác | Bước vào cổng sáng có mũi tên | như máy tính |

Cổng "quay lui" nằm sau lưng lúc bạn vừa vào cảnh, xoay camera lại để thấy.

Trong hội thoại: `Space`/`Enter` để đọc tiếp, phím số `1–9` để chọn câu trả lời, `Esc` để đóng bảng.

### Chế độ debug

Thêm `?debug=1` vào URL (ví dụ `http://localhost:5173/?debug=1`). Nút **DBG** mở bảng gỡ lỗi với các chức năng:

- nhảy tới bất kỳ cảnh nào, đặt thời gian (Ngày 1 Sáng → Ngày 4), chỉnh điểm Tỉnh táo;
- xem toàn bộ flag, túi đồ, manh mối và các câu đố đã giải;
- xem phía nào vừa đổi trên đường làng, nhận mọi vật phẩm hoặc bằng chứng, mở phán xử cuối, mở màn Game Over giả, tăng số lần chơi.

Ở chế độ debug, store cũng được gắn vào `window.__game` để thao tác từ console.

## Cấu trúc thư mục

```
src/
  engine/            Engine: không chứa nội dung game
    types.ts         Kiểu dữ liệu: Scene, Hotspot, Dialogue, Puzzle, Verdict, Effect, Condition…
    store.ts         Store Zustand: chạy hiệu ứng, hội thoại, thời gian, câu đố, phán xử, kết thúc
    conditions.ts    Đánh giá điều kiện (flag / thời gian / vật phẩm / manh mối / lần chơi…)
    time.ts          Hệ thống thời gian: 4 hành động = 1 buổi, Ngày 1 Sáng → Ngày 3 Tối → "Ngày 4"
    puzzle.ts        Kiểm tra đáp án và chuỗi câu đố
    normalize.ts     Chuẩn hóa đáp án (bỏ dấu, chữ thường, bỏ dấu câu)
    logic.ts         Bộ giải "đúng một người nói dối"
    maze.ts          Cơ chế "đường làng bị ma dắt" (tìm chi tiết thay đổi)
    endings.ts       Điều kiện các kết thúc
    save.ts          Lưu/tải 3 ô + ô tự động lưu (localStorage)
    meta.ts          Cài đặt, thành tựu, các kết thúc đã mở (lưu ngoài lượt chơi)
    registry.ts      Gom dữ liệu các khu vực thành bảng tra cứu
  data/              Nội dung game
    common/          Nhân vật chung, lỗi tư duy, thành tựu, kết thúc, hàm tiện ích
    area1/ … area4/  Mỗi khu vực: scenes.ts, characters.ts, dialogues.ts, puzzles.ts, clues.ts, index.ts
    index.ts         Danh sách khu vực + các sự kiện toàn cục (hạn chót, New Game+, lớp phủ)
  ui/                Component giao diện (màn tiêu đề, sân khấu, HUD, hộp thoại, sổ tay, túi đồ, câu đố…)
  art/               SVG (chế độ 2D): nền cảnh, nhân vật, đồ vật, bản đồ làng, sương mù canvas
  three/             Chế độ 3D: thế giới (World.ts), mô hình low-poly (models.ts),
                     môi trường từng cảnh (environment.ts), quy đổi tọa độ % → 3D (layout.ts)
  audio/             Âm thanh tổng hợp (gió, chuông, trống đình, tiếng click…)
  tests/             Unit test
public/assets/       Chỗ để ảnh vẽ tay thay thế SVG sau này (xem public/assets/README.md)
```

## Hệ thống engine

| Hệ thống | Mô tả |
| --- | --- |
| Cảnh | Mỗi cảnh có nền (`art`), hotspot (tọa độ tính theo %), đồ trang trí, hiệu ứng khi vào cảnh. Hotspot và trang trí có thể ẩn/hiện theo điều kiện. |
| Hội thoại | Cây hội thoại gồm các nút có người nói, câu thoại (có biến thể theo điều kiện), hiệu ứng và lựa chọn. Chữ chạy từng ký tự, bấm để hiện hết. |
| Hiệu ứng | Ngôn ngữ hành động chung cho toàn game: `goto`, `dialogue`, `clue`, `flag`, `item`, `sanity`, `time`, `puzzle`, `verdict`, `mistake`, `say`, `if`, `once`… |
| Thời gian | Mỗi lần chuyển cảnh hoặc nói chuyện hết một nhánh là 1 hành động; 4 hành động là 1 buổi. Nền cảnh đổi màu theo buổi (sáng vàng nhạt, chiều cam, tối xanh tím). Sương dày dần. |
| Sổ tay | Tự ghi lời khai (ai nói, lúc nào, lần chơi thứ mấy) và quan sát, chia tab theo khu vực. Đánh dấu "nghi ngờ" được từng dòng. Tab **Bài học** lưu các lỗi tư duy đã mắc. |
| Túi đồ | Xem chi tiết vật phẩm, bấm **Dùng lên…** rồi chạm vào hotspot để dùng. |
| Câu đố | Nhập đáp án (không phân biệt dấu và chữ hoa, chấp nhận nhiều đáp án) hoặc chọn phương án. Có gợi ý (tốn điểm hoặc miễn phí sau vài lần sai). |
| Phán xử | Chọn đáp án dựa trên sổ tay. Sai thì hiện thẻ **"Bạn đã giả định gì?"**, trừ Tỉnh táo và cho làm lại (không reset khu vực). |
| Tỉnh táo | 0–100, bắt đầu 50. Tăng khi giải đúng ngay lần đầu, giảm khi bị lừa. Ảnh hưởng tới kết thúc. |
| Lưu/tải | 3 ô lưu + tự động lưu mỗi lần chuyển cảnh. |

## Thêm nội dung (không cần sửa engine)

### Thêm cảnh

Thêm một phần tử vào `scenes.ts` của khu vực:

```ts
{
  id: 'gieng_lang',
  area: 'a1',
  name: 'Giếng làng',
  art: 'market',                 // khóa nền SVG trong src/art/backgrounds.tsx
  // image: 'assets/backgrounds/gieng.jpg',  // hoặc dùng ảnh vẽ tay
  onEnter: [{ t: 'once', key: 'gieng_intro', then: [say('Nước giếng trong vắt.')] }],
  hotspots: [
    { id: 'ba_lao', label: 'Bà lão', kind: 'character', character: 'ba_lao',
      x: 40, y: 30, w: 14, h: 42, onClick: [{ t: 'dialogue', id: 'a1_ba_lao' }] },
    { id: 'gau_nuoc', label: 'Gàu nước', kind: 'object', sprite: 'teaPot',
      x: 60, y: 50, w: 12, h: 14,
      if: { t: 'tod', in: ['sang'] },                 // chỉ hiện buổi sáng
      onClick: [say('Gàu nước lạnh buốt.'), { t: 'clue', id: 'a1_gieng' }] },
    { id: 've_cho', label: 'Về chợ', kind: 'exit', sprite: 'exitDown',
      x: 42, y: 78, w: 16, h: 10, onClick: [goto('cho_giua')] },
  ],
}
```

Rồi thêm một lối đi tới cảnh mới từ cảnh cũ (`onClick: [goto('gieng_lang')]`). Test `data.test.ts` sẽ báo lỗi nếu cảnh không đi tới được hoặc tham chiếu sai.

### Thêm nhân vật

Thêm vào `characters.ts`: `{ id, name, sprite, color, suspect? }`. `sprite` là khóa trong `src/art/characters.tsx` (có thể dùng lại sprite có sẵn), hoặc khai báo `image` để dùng ảnh. `suspect: true` chỉ để ghi chú; danh sách nghi phạm ở phán xử cuối nằm trong `area4/puzzles.ts`.

### Thêm hội thoại

```ts
{
  id: 'a1_ong_lai',
  start: [{ if: noFlag('met_lai'), node: 'chao' }, { node: 'hoi' }],   // nhánh cuối không có điều kiện
  nodes: {
    chao: { speaker: 'lai_do', text: 'Chào khách.', effects: [flag('met_lai')], next: 'hoi' },
    hoi: {
      speaker: 'lai_do',
      text: 'Khách hỏi gì?',
      variants: [{ if: { t: 'tod', in: ['toi'] }, text: 'Tối rồi, hỏi nhanh.' }],
      choices: [
        { text: 'Đường ra ở đâu?', effects: [clue('a1_duong_ra')], next: 'hoi' },
        { text: 'Đố tôi đi.', effects: [{ t: 'puzzle', id: 'a1_do_moi' }] },   // không có next: kết thúc hội thoại
        { text: 'Tạm biệt.' },
      ],
    },
  },
}
```

Kết thúc một nhánh hội thoại tính là 1 hành động, trừ khi đặt `free: true`.

### Thêm câu đố

```ts
{
  id: 'a1_do_moi', area: 'a1', speaker: 'lai_do', title: 'Câu đố',
  prompt: 'Cái gì đi thì nằm, đứng cũng nằm, mà nằm cũng nằm?',
  kind: 'text',
  answers: ['bàn chân', 'cái bàn chân'],     // tự bỏ dấu, chữ thường khi so sánh
  hint: { text: 'Nó ở dưới cùng cơ thể.', cost: 5 },
  firstTryBonus: 3,
  onSolve: [say('Giỏi!', 'lai_do')],
  onWrong: [{ t: 'mistake', fallacy: 'intuition', explain: '…', missed: '…', sanity: 3 }],
}
```

Muốn đố nhiều câu liên tiếp thì dùng `puzzleSeqs` (có thể đặt thứ tự khác cho lần chơi sau qua `alt`). Câu hỏi chọn phương án thì dùng `kind: 'choice'`, `options` và `correctOption`.

### Thêm manh mối

Thêm vào `clues.ts`: `{ id, area, kind: 'testimony' | 'observation', source?, text, evidence? }`. Đặt `evidence: true` nếu manh mối là bằng chứng hợp lệ ở phán xử cuối.

### Thêm khu vực

1. Tạo thư mục `src/data/area5/` với `scenes.ts`, `characters.ts`, `dialogues.ts`, `puzzles.ts`, `clues.ts` và `index.ts` xuất một `AreaDef` (`order: 5`).
2. Thêm vào mảng `areas` trong `src/data/index.ts`.
3. Nối một lối đi từ khu cũ sang cảnh đầu của khu mới.

Tab sổ tay, bảng debug và test toàn vẹn dữ liệu tự nhận khu vực mới.

## Unit test

`npm test` chạy:

- `elders.test.ts`: duyệt cả 16 trường hợp (4 người nói dối × 4 người giữ chìa), chứng minh câu đố bô lão có **nghiệm duy nhất**;
- `normalize.test.ts`: chuẩn hóa đáp án (NFC/NFD, dấu, hoa thường, dấu câu) và đáp án từng câu đố;
- `time.test.ts`: hệ thống thời gian, chuyển buổi, hạn chót "Ngày 4";
- `endings.test.ts`: điều kiện 4 kết thúc;
- `data.test.ts`: toàn vẹn dữ liệu (mọi cảnh đi tới được, không tham chiếu hỏng, không kẹt hội thoại);
- `playthrough.test.ts`: mô phỏng người chơi đi hết 4 khu và tới từng kết thúc, gồm cả lần chơi thứ 2 (New Game+);
- `layout3d.test.ts`: bố cục 3D của từng cảnh (vật nằm trong sân chơi, người chơi không bị kẹt khi xuất hiện).

### 3D dùng chung dữ liệu với 2D

Chế độ 3D không cần dữ liệu riêng. Tọa độ % của hotspot được quy đổi tự động: `x` thành trục ngang, đáy hotspot (`y + h`) thành độ sâu. Hotspot lối đi có sprite `exitLeft`/`exitRight`/`exitUp`/`exitDown` trở thành cổng sáng ở rìa trái/phải/xa/sau lưng. Muốn có mô hình 3D riêng cho một sprite mới, thêm hàm dựng vào `OBJECTS` (đồ vật) hoặc `CHARACTERS` (nhân vật) trong `src/three/models.ts`, và môi trường cho khóa nền mới trong `src/three/environment.ts`. Nếu chưa thêm, game vẫn chạy với mô hình mặc định.

---

## ⚠️ SPOILER: Sơ đồ lối chơi và đáp án

<details>
<summary>Bấm để xem toàn bộ lời giải</summary>

### Sự thật

Người lạ đội nón chính là **hồn làng**. Hắn giữ chân lữ khách bằng cách chỉ đường sai và dùng áp lực thời gian để bạn vội vàng. Đồng hồ 3 ngày là **giả**: hết giờ cũng không có gì xảy ra. Sương chỉ tan khi bạn vạch trần hắn.

### Sơ đồ

```
KHU 1: CHỢ PHIÊN (Quan sát)
  Giữa chợ ─┬─ Hàng nước chè (Bà lão)
            ├─ Bãi trâu (Cậu bé chăn trâu, 3 câu đố)
            └─ Đường làng (vòng lặp ×3) ──► Ngã ba lối ra ──[DỐC ĐÁ]──►
KHU 2: ĐÌNH LÀNG (Logic)
  Sân đình (trống 3 tiếng, Ông từ) ─ Gian giữa (4 bô lão) ─[chìa khóa]─ Hậu cung (bản đồ) ──►
KHU 3: RỪNG TRÚC (Ngôn ngữ)
  Bìa rừng ─┬─ Lều thầy đồ (3 câu đố)
            └─ Lối trúc đôi ─[đúng bóng]─ Tảng đá lớn ─[cuối đá]─ GAME OVER giả ─[chữ O]──►
KHU 4: BẾN ĐÒ (Nghi ngờ nguồn tin)
  Bờ sông ─┬─ Xuôi dòng (theo bản đồ) ──► lạc về Quán lá
           ├─ Quán lá (Cô hàng quán)
           └─ Ngược dòng ──► Bến đò (Ông lái đò) ──► PHÁN XỬ CUỐI
```

### Khu 1: Chợ phiên

- **Bà lão bán nước chè** nói thật vào buổi Sáng và Chiều, nói ngược vào buổi Tối. Bà đã báo trước: *"Già rồi, trời tối là lú lẫn, nói gì cũng ngược cả."* Hỏi lúc tỉnh táo, bà nói lối ra là **dốc đá**. Có thể ngồi uống chè ở quán để chờ sang buổi sau.
- **Cậu bé chăn trâu**: (a) **4** chân: gọi đuôi là chân thì đuôi vẫn là đuôi; (b) **0** con: tiếng súng làm chim bay hết; (c) **tất cả các tháng**. Bí mật: *"Mỗi lần đi qua, thứ gì thay đổi thì đi theo phía đó."*
- **Đường làng**: bấm "Đi tiếp", nhớ kỹ hai bên đường (con quạ đậu cành trên hay dưới, số bậc đá 8 hay 7, màu vải cây nêu). Mỗi đoạn có đúng một chi tiết đổi ở một phía; đi về **phía có chi tiết đổi**. Đúng 3 lần liên tiếp thì tới Ngã ba; sai thì quay lại đầu đường.
- **Phán xử: DỐC ĐÁ.** Cổng tre là lời của Người lạ (và của bà lão lúc nói ngược).

### Khu 2: Đình làng

- Vừa bước vào sân đình, trống đánh **3 tiếng**. Người lạ nói theo quy luật 2 → 4 → 8 → *"hôm nay chắc chắn 16"*. Ông từ hỏi hôm nay trống đánh mấy tiếng: **3** (tin tai mình, không tin quy luật).
- **Bốn cụ bô lão** (đúng một người nói dối):
  - Cụ Giáp: "Cụ Ất giữ chìa khóa." Cụ Ất: "Tôi không giữ chìa khóa."
  - Cụ Bính: "Tôi và cụ Đinh đều không giữ." Cụ Đinh: "Cụ Giáp nói dối."
  - Giả sử cụ Ất nói dối thì cụ Đinh nói thật, nên cụ Giáp cũng nói dối: hai người nói dối, loại.
  - Giả sử cụ Bính hoặc cụ Đinh nói dối thì cụ Giáp nói thật, nên cụ Ất giữ chìa. Nhưng cụ Ất (nói thật) bảo không giữ: mâu thuẫn, loại.
  - **Cụ Giáp nói dối, và cụ Giáp giữ chìa khóa.**
- Nhận **Chìa khóa đồng**, vào Túi đồ, bấm **Dùng lên…** rồi chạm cửa hậu cung. Mở hòm gỗ lấy **Tấm bản đồ làng**. Người lạ khuyên "cứ theo bản đồ mà đi".
- Bản đồ **lệch thêm một chi tiết mỗi buổi**: bến đò dịch sang xuôi dòng, thêm "lối tắt" không có thật, cây đa đổi chỗ, mũi tên dòng chảy bị vẽ ngược, thêm một bến đò giả.

### Khu 3: Rừng trúc

- **Thầy đồ** (mỗi lần xin gợi ý −5 Tỉnh táo): (a) **tên** / cái tên; (b) **cái hố** / cái lỗ; (c) "Lối ra nằm ở chỗ CÁ ĐUỐI": nói lái thành **CUỐI ĐÁ**, tức phía sau tảng đá lớn. Thầy dặn thêm: *"Khi thấy chữ kết thúc, hãy nhìn vào chữ tròn như cửa."*
- **Lối trúc đôi**: bóng luôn quay lưng về phía nguồn sáng. Buổi **sáng** (mặt trời ở đông, bên phải) và **tối** (trăng mọc đằng đông) thì đi **lối bên trái** (bóng đổ về tây). Buổi **chiều** (mặt trời ở tây) thì đi **lối bên phải**. Đi sai sẽ bị đưa về bìa rừng.
- **Tảng đá lớn** → "Vòng ra cuối tảng đá" → màn **GAME OVER** giả. Nút "Chơi lại từ đầu" chỉ hiện *"Thật sao? Bỏ cuộc dễ vậy à?"* rồi quay lại. Lối thoát thật là bấm vào **chữ O** trong "GAME OVER". Đây là chữ tròn thứ hai sau chữ G, và nó nhấp nháy rất nhẹ.

### Khu 4: Bến đò

- Ông lái đò hát vọng qua sông: *"đi ngược dòng nước"*. Nước chảy từ phải sang trái, nên **ngược dòng là sang phải**.
- Đi xuôi dòng theo bản đồ hoặc đi theo Người lạ thì bị lạc về Quán lá (lỗi *Tin công cụ tuyệt đối* / *Vội vàng dưới áp lực*).
- **Phán xử cuối**: kẻ dẫn đi vòng là **Người lạ đội nón**. Bằng chứng hợp lệ (tự ghi vào sổ tay khi gặp):

  | Mã | Bằng chứng | Có khi |
  | --- | --- | --- |
  | `ev_cong_tre` | Hắn chỉ lối cổng tre (sai) | Ngay đầu game |
  | `ev_trong_16` | Hắn đoán trống đánh 16 tiếng (sai) | Vào sân đình |
  | `ev_moi_canh` | Hắn đứng ở mọi đoạn của đường làng vòng lặp | Đi đúng ít nhất 1 đoạn đường làng |
  | `ev_giuc_voi` | Hắn luôn giục vội | Sau lần giục thứ 3 |
  | `ev_ban_do` | Bản đồ lệch từ khi hắn gợi ý dùng bản đồ | Xem bản đồ sau ≥ 1 buổi, hoặc đi theo bản đồ ở Bến đò |
  | `ev_han_chot` | Hạn chót là giả | Kết ẩn (qua Ngày 3 Tối) |

### Kết thúc

| Kết thúc | Điều kiện |
| --- | --- |
| **Kết tốt: Sương tan** | Buộc tội Người lạ, chọn ≥ 2 bằng chứng hợp lệ (số bằng chứng hợp lệ nhiều hơn số bằng chứng sai) và Tỉnh táo ≥ 60. |
| **Kết trung: Làng vẫn còn đó** | Buộc tội đúng nhưng Tỉnh táo < 60 hoặc bằng chứng yếu. |
| **Kết vòng lặp: Lần thứ hai…** | Buộc tội sai người. Tỉnh dậy giữa chợ phiên Ngày 1 (New Game+): giữ nguyên sổ tay, nhưng bà lão nói ngược vào **buổi Sáng**, câu đố của cậu bé đảo thứ tự (c → b → a), câu đố thầy đồ đổi thứ tự (b → a → c). |
| **Kết ẩn: Ngày thứ tư** | Để thời gian trôi qua Ngày 3 Tối khi vẫn còn trong làng. Không có gì xảy ra; đồng hồ hiện "Ngày 4"; Người lạ bối rối: *"Sao… cậu vẫn còn ở đây?"* Mở khóa bằng chứng đặc biệt "Hạn chót là giả", +20 Tỉnh táo, rồi chơi tiếp bình thường. |

Đi thẳng tới đích không mắc lỗi nào mất khoảng 26 hành động (tới Ngày 3 Sáng). Người chơi khám phá kỹ sẽ dễ vượt quá hạn chót và gặp kết ẩn.

### Thành tựu

| Thành tựu | Cách đạt |
| --- | --- |
| Mắt cú vọ | Qua đường làng mà không đi sai lần nào. |
| Không nói dối được tôi | Giải câu đố bô lão đúng ngay lần đầu. |
| Chữ tròn như cửa | Thoát màn Game Over giả. |
| Không vội | Đạt kết ẩn. |
| Không cần gợi ý | Qua Rừng trúc mà không xin gợi ý nào. |
| Tỉnh táo tuyệt đối | Kết thúc với 100 Tỉnh táo (đi thẳng không sai lần nào là đạt). |

### Các lỗi tư duy (thẻ "Bạn đã giả định gì?")

| Lỗi | Gặp khi |
| --- | --- |
| Tin nguồn có thẩm quyền | Chọn cổng tre vì tin "người dẫn đường"; tin màn GAME OVER; buộc tội ông lái đò |
| Vội vàng dưới áp lực | Đi theo Người lạ ở Bến đò |
| Bám quy luật bỏ qua thực tế | Trả lời trống đình đánh 16 tiếng |
| Phản xạ trực giác | Trả lời sai câu đố mẹo, đi sai đường làng, giải sai câu đố bô lão, chọn lối ruộng |
| Bỏ qua ngữ cảnh thời gian | Tin lời bà lão lúc bà nói ngược; chọn sai lối trúc; buộc tội bà lão |
| Tin công cụ tuyệt đối | Đi xuôi dòng theo bản đồ |

</details>

---

# 3:17 — Kẻ Không Mặt (game kinh dị sinh tồn)

Game thứ hai trong repo, chơi tại đường dẫn `/acmong/` (khi chạy `npm run dev`: `http://localhost:5173/acmong/`). Đây là game kinh dị tâm lý kết hợp sinh tồn, **góc nhìn thứ nhất 3D**, gồm **4 chương**.

An, 17 tuổi, đêm nào cũng choàng tỉnh lúc 3 giờ 17 phút sáng. Đêm nay An tỉnh dậy bên trong chính cơn ác mộng. Mỗi chương là một nỗi sợ bị chôn vùi, và **Kẻ Không Mặt** luôn đi theo sau lưng. Gom đủ **10 mảnh ký ức** để nhớ lại toàn bộ sự thật.

| Chương | Nơi | Nỗi sợ | Cơ chế riêng |
| --- | --- | --- | --- |
| 1 | Căn nhà cũ | Bóng tối, bị bỏ rơi | Mật mã chỉ hiện khi tắt đèn, gương, điện thoại reo, búp bê quay đầu |
| 2 | Trường tiểu học ban đêm | Bị phán xét, bắt nạt | **Bóng học sinh không mặt**: chỉ di chuyển khi bạn không nhìn chúng. Đàn piano dán nhãn màu. Bẫy kho thể dục |
| 3 | Bệnh viện mất điện | Mất người thân | Tìm **3 cầu chì** (chiếm chỗ trong túi 4 ô) để khôi phục điện. Có điện thì nó nổi giận: nhanh hơn, nhìn xa hơn |
| 4 | Lõi giấc mơ | Chính mình | Hành lang ký ức, rồi trận đối mặt: giữ đèn soi thẳng vào nó qua 3 lần xuất hiện |

Có yếu tố kinh dị tâm lý, âm thanh đột ngột và hình ảnh chớp nháy, khuyến nghị 13+. Không có máu me. Muốn nhẹ hơn thì bật **Cài đặt → Giảm hù dọa**.

Mỗi chương xong sẽ tự lưu. Màn hình chính cho **chọn lại chương** đã mở khóa.

## Đồ họa

- Vật liệu PBR vẽ bằng canvas, có **normal map** (vân gỗ, vữa, gạch men, gạch bệnh viện, thảm…).
- Tường, sàn, trần dùng `InstancedMesh`. Có len chân tường và phào trần.
- Chất lượng **Cao** (mặc định trên máy tính) bật:
  - bóng đổ từ đèn pin;
  - hậu kỳ: bloom, nhiễu hạt phim, quang sai màu, viền tối;
  - méo hình khi hoảng loạn, nhòe đỏ khi bị thương.
- Tia sáng đèn pin có **bụi lơ lửng**, cửa sổ ánh trăng, đèn tuýp chập chờn.
- Chất lượng **Thấp** (mặc định trên điện thoại) tắt các hiệu ứng nặng.

## Cơ chế sinh tồn

| Chỉ số | Hoạt động |
| --- | --- |
| **Đèn pin** | Hết pin dần (~90 giây một cục pin đầy). Nhặt **Pin** để nạp +40%. Pin yếu thì đèn chập chờn. Có mật mã **chỉ hiện ra khi tắt đèn**. |
| **Tinh thần** | Tụt nhanh trong bóng tối, tụt mạnh khi nhìn thấy Kẻ Không Mặt ở gần. Hồi khi đứng dưới đèn, khi trốn, hoặc uống **Thuốc an thần** (+35). Tinh thần thấp gây méo hình, tiếng thì thầm, ảo giác. Về 0 thì ngất (mất 1 máu). |
| **Nhịp tim** | Tăng theo nỗi sợ và khoảng cách tới thực thể. Có tiếng tim đập thật. |
| **Máu** | 3 máu, hồi đầy khi sang chương mới. Bị bắt mất 1 máu và tỉnh lại ở điểm lưu. **Băng gạc** hồi 1 máu. Hết máu thì màn thua, được thử lại từ điểm lưu. |
| **Thể lực** | Chạy (Shift) tốn thể lực. Kiệt sức phải hồi tới 25% mới chạy lại được. |
| **Túi đồ** | Chỉ **4 ô**. Chìa khóa và cầu chì cũng chiếm chỗ. Đồ nhận được khi túi đầy thì nằm lại, quay lại lấy sau. Pin, thuốc, băng gạc được mang sang chương sau; chìa và cầu chì thì không. |

**Kẻ Không Mặt**
- Tuần tra, đi xuyên được cửa khóa (nó là ác mộng) nhưng không xuyên tường.
- **Nghe thấy tiếng chạy**; đi bộ thì gần như im lặng.
- Bật đèn thì bị nhìn thấy từ xa, tắt đèn chỉ bị thấy ở khoảng cách rất gần.
- Khi bị rượt: chạy rồi **trốn vào tủ / gầm giường**. Nếu nó thấy bạn chui vào, nó sẽ lôi bạn ra.

## Điều khiển

| | Máy tính | Điện thoại |
| --- | --- | --- |
| Đi | `W A S D` / mũi tên | Joystick trái |
| Nhìn | Chuột (bấm vào màn hình để khóa chuột) | Vuốt màn hình |
| Chạy | `Shift` | Nút 🏃 (bật/tắt) |
| Đèn pin | `F` | Nút 🔦 |
| Tương tác / trốn / ra khỏi chỗ trốn | `E` | Nút ✋ hoặc chạm vào dòng gợi ý |
| Túi đồ · Nhật ký (mục tiêu, ký ức, ghi chú) · Tạm dừng | `Tab` · `J` · `Esc` | 🎒 · 📓 · ⏸ |
| Dùng nhanh ô đồ | `1`–`4` | Chạm ô đồ |

## Mã nguồn

```
src/horror/
  types.ts      Kiểu dữ liệu chương: bản đồ, phòng, cửa, vật tương tác, câu đố, mảnh ký ức…
  items.ts      Vật phẩm (pin, thuốc, băng gạc, chìa khóa, cầu chì)
  chapters/     Nội dung 4 chương (ch1–ch4) + index (danh sách chương, tra câu đố/ghi chú)
  level.ts      Lớp Level: bản đồ ASCII (1 ô = 2 m), va chạm, tầm nhìn, tìm đường A*
  sim.ts        Chỉ số sinh tồn + bộ não Kẻ Không Mặt + bóng học sinh (thuần logic)
  store.ts      Zustand: tiến trình, chuyển chương, điểm lưu (localStorage), kết thúc, thành tựu
  World.ts      Thế giới three.js dựng từ dữ liệu chương: đèn pin, đèn, cửa, thực thể, HUD
  scripts.ts    Kịch bản riêng từng chương (cảnh hù, máy phát điện, trận đối mặt cuối)
  gfx.ts        Vật liệu có normal map, hậu kỳ (bloom/nhiễu/quang sai), tia sáng và bụi đèn pin
  props.ts      Đồ đạc chi tiết, mô hình Kẻ Không Mặt và bóng học sinh
  textures.ts   Texture vẽ bằng canvas (bảng đen, ảnh, gương, phim X-quang, bản nhạc…)
  audio.ts      Âm thanh tổng hợp: nền riêng mỗi chương, tim đập, bước chân theo nền nhà, thì thầm, tiếng cười trẻ con, máy đo nhịp tim, đàn piano
  ui/           Giao diện React: HUD, thẻ chuyển chương, bàn phím mật mã, đàn piano, nhật ký, túi đồ
acmong/index.html   Trang vào game
```

`src/tests/horror.test.ts` kiểm tra cho **từng chương**:
- bản đồ kín, mọi ký tự được định nghĩa, mọi phòng và vật tương tác đi tới được;
- thứ tự mở khóa không bị kẹt;
- **mọi mật mã suy ra được từ manh mối**;
- chỉ số sinh tồn;
- Kẻ Không Mặt và bóng học sinh;
- túi 4 ô, chuyển chương (mang đồ sang), điểm lưu và hai kết thúc.

## ⚠️ SPOILER: Lời giải 3:17

<details>
<summary>Bấm để xem</summary>

**Chương 1 — Căn nhà**

| Nơi | Mật mã | Manh mối |
| --- | --- | --- |
| Hộp đồ chơi (phòng ngủ) | **418** | Tắt đèn pin rồi nhìn lên trần: sao dạ quang viết "4 1 8" |
| Két sắt (phòng khách) | **5341** | 4 tấm ảnh: xếp theo năm 1998 → 2003 → 2007 → 2012, đếm số người: 5, 3, 4, 1 |
| Ngăn bàn học (góc học tập) | **683** | Bảng đen: 2 + 2 × 2 = **6**; 1, 1, 2, 3, 5 → **8**; một nửa của 2 cộng 2 = **3** |
| Tủ thuốc (phòng tắm) | **2519** | Chữ trong gương viết ngược "9152", đọc lại cho xuôi |
| Cửa chính (sảnh) | **0317** | 4 mảnh ký ức cho các số 0, 3, 1, 7. Cũng là giờ trên chiếc đồng hồ đứng im (3:17) |

Sảnh luôn đi tới được: ai để ý đồng hồ có thể nhập 0317 ngay (thành tựu *Người đọc giờ*). Nhưng khi đó sẽ thiếu mảnh ký ức cho kết thật.

**Chương 2 — Trường học**

| Nơi | Mật mã | Manh mối |
| --- | --- | --- |
| Tủ đồ số 17 | **753** | Thời khóa biểu thứ Hai: Tiếng Việt, Tiếng Anh, Toán. Học bạ: Văn 7, Anh 5, Toán 3 |
| Đàn piano (phòng nhạc) | **Đỏ Đỏ Xanh dương Xanh dương Xanh ngọc Xanh ngọc Xanh dương** (Đô Đô Son Son La La Son) | Bản nhạc màu trên giá khớp với nhãn màu trên phím |

1. Tủ 17 cho chìa phòng hiệu trưởng.
2. Ngăn bàn hiệu trưởng có chìa kho thể dục.
3. Vào kho: cửa đóng sập, Kẻ Không Mặt xuất hiện ngoài hành lang.
4. Lấy chìa cổng trường thì cửa kho mở lại. Chạy ra cổng (cuối hành lang phía đông).

Bóng học sinh chỉ di chuyển khi không bị nhìn: đi lùi, soi đèn vào chúng.

**Chương 3 — Bệnh viện**

| Nơi | Mật mã | Manh mối |
| --- | --- | --- |
| Cửa phòng y tá | **2200** | Bảng trắng lịch trực: ca đêm bắt đầu 22:00 |
| Ngăn tủ đầu giường phòng 306 | **1205** | Danh sách bệnh nhân: bà sinh 12/5/1944. Thiệp: "ngày trước, tháng sau" |

Ba cầu chì nằm ở:
- phòng y tá;
- phòng 303 (chìa ở phòng 305);
- ngăn tủ của bà.

Lắp cả ba vào tủ điện phòng máy (lắp dần được, để giải phóng ô túi). Có điện thì đi thang máy.

**Chương 4 — Lõi giấc mơ**
- Ba cánh cửa ký ức hồi tinh thần.
- Trong căn phòng tròn: đứng yên, tìm Kẻ Không Mặt theo tiếng bước chân, giữ đèn pin soi thẳng vào nó.
- Nó xuất hiện 3 lần; lần sau cần soi lâu hơn lần trước.
- Mang theo pin dự phòng.

**Kết thúc**
- **Kết thật — Đứa trẻ trong tủ**: vượt qua trận cuối khi đã gom đủ 10 mảnh ký ức.
- **Tỉnh giấc**: vượt qua trận cuối nhưng thiếu mảnh ký ức.
- **Mãi trong giấc mơ**: mất hết máu (được thử lại từ điểm lưu).

**Thành tựu**
- Đối mặt.
- Vô hình: không bị bắt lần nào.
- Người đọc giờ.
- Vững vàng: kết thúc với tinh thần > 60.
- Giai điệu của cô: đánh đúng đàn ngay lần đầu.
- Thắp sáng: khôi phục điện mà không bị bắt trong chương 3.

</details>
