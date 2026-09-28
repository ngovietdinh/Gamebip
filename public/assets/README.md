# Thư mục tài nguyên (assets)

Hiện toàn bộ hình ảnh trong game được vẽ bằng SVG (`src/art`) và âm thanh được tổng hợp bằng Web Audio API (`src/audio`).
Thư mục này có sẵn để sau này thay bằng ảnh vẽ tay **mà không phải sửa engine**:

| Thư mục        | Dùng cho                         | Cách khai báo trong dữ liệu                             |
| -------------- | -------------------------------- | ------------------------------------------------------- |
| `backgrounds/` | Ảnh nền cảnh (khuyên 1600×900)   | `Scene.image: 'assets/backgrounds/market.jpg'`          |
| `characters/`  | Ảnh nhân vật nền trong suốt (PNG) | `Character.image: 'assets/characters/ba_lao.png'`       |
| `sprites/`     | Ảnh đồ vật                        | (dự phòng — hiện đồ vật dùng SVG trong `src/art/objects.tsx`) |
| `audio/`       | Âm thanh                          | (dự phòng — hiện dùng âm thanh tổng hợp)                 |

Khi `image` được khai báo, `Stage` và `Portrait` tự dùng ảnh thay cho SVG. Tọa độ hotspot vẫn tính theo % khung cảnh nên không cần đổi.
