import { describe, it, expect } from 'vitest'
import { matchLocale } from './locale-atom'

describe('matchLocale', () => {
  it('should return the default locale for an empty list', () => {
    expect(matchLocale([])).toBe('en')
  })

  it('should return the default locale for an unrecognized language', () => {
    expect(matchLocale(['xx'])).toBe('en')
  })

  it('should match exact locale', () => {
    expect(matchLocale(['zh-CN'])).toBe('zh-CN')
    expect(matchLocale(['ja-JP'])).toBe('ja-JP')
    expect(matchLocale(['en'])).toBe('en')
  })

  it('should match by language prefix for known languages', () => {
    expect(matchLocale(['en-US'])).toBe('en')
    expect(matchLocale(['en-GB'])).toBe('en')
    expect(matchLocale(['fr-CA'])).toBe('fr')
    expect(matchLocale(['de-DE'])).toBe('de')
  })

  it('should prefer the first matching language in the list', () => {
    // navigator.languages 按偏好排序，应返回第一个匹配的
    expect(matchLocale(['fr', 'de'])).toBe('fr')
    expect(matchLocale(['de', 'fr'])).toBe('de')
  })

  it('should prefer exact match over prefix match', () => {
    // 'zh-CN' 和 'zh-TW' 都存在于列表中，'zh-CN' 是精确匹配
    expect(matchLocale(['zh-CN'])).toBe('zh-CN')
    expect(matchLocale(['zh-TW'])).toBe('zh-TW')
    // 只有 'zh' 前缀时，返回列表中第一个匹配的（zh-CN）
    expect(matchLocale(['zh'])).toBe('zh-CN')
  })

  it('should handle pt-BR for Portuguese', () => {
    expect(matchLocale(['pt-BR'])).toBe('pt-BR')
    // 通用 'pt' 应匹配 'pt-BR'
    expect(matchLocale(['pt'])).toBe('pt-BR')
    expect(matchLocale(['pt-PT'])).toBe('pt-BR')
  })

  it('should match Korean', () => {
    expect(matchLocale(['ko'])).toBe('ko')
    expect(matchLocale(['ko-KR'])).toBe('ko')
  })

  it('should match Arabic', () => {
    expect(matchLocale(['ar'])).toBe('ar')
    expect(matchLocale(['ar-SA'])).toBe('ar')
  })

  it('should match Traditional Chinese', () => {
    expect(matchLocale(['zh-TW'])).toBe('zh-TW')
    expect(matchLocale(['zh-HK'])).toBe('zh-TW')
  })

  it('should filter out empty strings', () => {
    expect(matchLocale(['', 'en'])).toBe('en')
    expect(matchLocale(['', ''])).toBe('en')
  })
})