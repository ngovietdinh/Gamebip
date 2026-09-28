import { describe, expect, it } from 'vitest'
import { matchesAnswer, normalizeAnswer } from '../engine/normalize'
import { checkPuzzle } from '../engine/puzzle'
import { registry } from '../game'

describe('Chuẩn hóa đáp án', () => {
  it('bỏ dấu, chữ thường, gộp khoảng trắng, bỏ dấu câu', () => {
    expect(normalizeAnswer('  Cuối   Đá! ')).toBe('cuoi da')
    expect(normalizeAnswer('Tất cả các tháng.')).toBe('tat ca cac thang')
    expect(normalizeAnswer('ĐƯỜNG')).toBe('duong')
    expect(normalizeAnswer('Cái Hố?')).toBe('cai ho')
  })

  it('xử lý cả chữ tổ hợp (NFD) lẫn chữ dựng sẵn (NFC)', () => {
    const nfd = 'bốn'.normalize('NFD')
    expect(normalizeAnswer(nfd)).toBe('bon')
    expect(normalizeAnswer('bốn'.normalize('NFC'))).toBe('bon')
  })

  it('chấp nhận nhiều đáp án đúng', () => {
    expect(matchesAnswer('cuoi da', ['cuối đá', 'sau tảng đá'])).toBe(true)
    expect(matchesAnswer('Sau tảng đá', ['cuối đá', 'sau tảng đá'])).toBe(true)
    expect(matchesAnswer('cá đuối', ['cuối đá', 'sau tảng đá'])).toBe(false)
    expect(matchesAnswer('   ', ['cuối đá'])).toBe(false)
  })

  it('đáp án các câu đố trong game', () => {
    const p = registry.puzzles
    expect(checkPuzzle(p.a1_boy_a, '4')).toBe(true)
    expect(checkPuzzle(p.a1_boy_a, 'Bốn chân')).toBe(true)
    expect(checkPuzzle(p.a1_boy_a, '5')).toBe(false)
    expect(checkPuzzle(p.a1_boy_b, '0')).toBe(true)
    expect(checkPuzzle(p.a1_boy_b, 'không con nào')).toBe(true)
    expect(checkPuzzle(p.a1_boy_b, '9')).toBe(false)
    expect(checkPuzzle(p.a1_boy_c, 'Tất cả các tháng')).toBe(true)
    expect(checkPuzzle(p.a1_boy_c, '12 tháng')).toBe(true)
    expect(checkPuzzle(p.a1_boy_c, 'tháng hai')).toBe(false)
    expect(checkPuzzle(p.a2_drum, '3')).toBe(true)
    expect(checkPuzzle(p.a2_drum, 'ba tiếng')).toBe(true)
    expect(checkPuzzle(p.a2_drum, '16')).toBe(false)
    expect(checkPuzzle(p.a3_a, 'Cái tên')).toBe(true)
    expect(checkPuzzle(p.a3_b, 'cái lỗ')).toBe(true)
    expect(checkPuzzle(p.a3_b, 'hố')).toBe(true)
    expect(checkPuzzle(p.a3_c, 'CUỐI ĐÁ')).toBe(true)
    expect(checkPuzzle(p.a3_c, 'phía sau tảng đá')).toBe(true)
    expect(checkPuzzle(p.a3_c, 'cá đuối')).toBe(false)
  })
})
