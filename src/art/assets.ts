/**
 * Ảnh thay thế cho SVG. Đặt file vào public/assets/... rồi khai báo `image`
 * trong dữ liệu cảnh (Scene.image) hoặc nhân vật (Character.image), ví dụ:
 *   image: 'assets/backgrounds/market.jpg'
 * Engine sẽ tự dùng ảnh thay cho SVG — không cần sửa code.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env?.BASE_URL ?? './'
  return base.replace(/\/?$/, '/') + path.replace(/^\//, '')
}
