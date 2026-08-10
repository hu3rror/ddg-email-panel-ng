import { describe, it, expect } from 'vitest'
import en from '../../messages/en.json'
import zhCN from '../../messages/zh-CN.json'
import jaJP from '../../messages/ja-JP.json'

describe('i18n Dictionaries', () => {
  it('所有语言字典文件（en, zh-CN, ja-JP）必须包含相匹配的核心翻译键', () => {
    // 校验 Nav 区域
    expect(en.nav.title).toBeDefined()
    expect(zhCN.nav.title).toBe('DDG 邮箱面板')
    expect(jaJP.nav.title).toBe('DDG メール面板')

    // 校验 Login 区域
    expect(en.login.title).toBe('Enter your Duck Address')
    expect(zhCN.login.title).toBe('请输入你的 Duck 邮箱地址')
    expect(jaJP.login.title).toBe('Duckアドレスを入力してください')
  })
})