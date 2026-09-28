/**
 * Chuẩn hóa đáp án: bỏ dấu tiếng Việt, chữ thường, bỏ dấu câu, gộp khoảng trắng.
 * "Cuối Đá!" -> "cuoi da", "Tất cả các tháng" -> "tat ca cac thang".
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Kiểm tra đáp án nhập với danh sách đáp án chấp nhận (đã/ chưa chuẩn hóa đều được). */
export function matchesAnswer(input: string, accepted: string[]): boolean {
  const n = normalizeAnswer(input)
  if (!n) return false
  return accepted.some((a) => normalizeAnswer(a) === n)
}
