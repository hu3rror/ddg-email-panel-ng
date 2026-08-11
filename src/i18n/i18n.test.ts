import { describe, it, expect } from 'vitest'
import en from '../../messages/en.json'
import zhCN from '../../messages/zh-CN.json'
import zhTW from '../../messages/zh-TW.json'
import jaJP from '../../messages/ja-JP.json'
import es from '../../messages/es.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'
import itLang from '../../messages/it.json'
import ptBR from '../../messages/pt-BR.json'
import ru from '../../messages/ru.json'
import ko from '../../messages/ko.json'
import hi from '../../messages/hi.json'
import ar from '../../messages/ar.json'
import tr from '../../messages/tr.json'
import { routing } from './routing'

const dictionaries = {
  en, es, fr, de, 'it': itLang, 'pt-BR': ptBR, ru, ko, hi, ar, tr,
  'zh-CN': zhCN, 'zh-TW': zhTW, 'ja-JP': jaJP,
}

/** Collect all leaf-string keys under a prefix, recursively */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return prefix ? [prefix] : []
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  )
}

const expectedKeys = flattenKeys(en)

describe('i18n Dictionaries', () => {
  it('路由配置必须声明所有已提供翻译的语言', () => {
    expect(routing.locales).toEqual(Object.keys(dictionaries))
  })

  it('每个语言字典都必须包含所有翻译键（与 English 基准完全一致）', () => {
    for (const [locale, dict] of Object.entries(dictionaries)) {
      const keys = flattenKeys(dict)
      const missing = expectedKeys.filter((k) => !keys.includes(k))
      const extra = keys.filter((k) => !expectedKeys.includes(k))
      expect(missing, `${locale}: 缺少键 ${missing.join(', ')}`).toEqual([])
      expect(extra, `${locale}: 多余键 ${extra.join(', ')}`).toEqual([])
    }
  })

  it('所有字符串值必须是字符串类型（非对象/数组）', () => {
    for (const [locale, dict] of Object.entries(dictionaries)) {
      const keys = flattenKeys(dict)
      for (const key of keys) {
        const value = key.split('.').reduce<unknown>((obj, k) => {
          if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k]
          return undefined
        }, dict as unknown as Record<string, unknown>)
        expect(typeof value, `${locale}.${key}`).toBe('string')
      }
    }
  })

  it('默认语言 English 的基准翻译保持稳定', () => {
    expect(en.nav.title).toBe('DDG Email Panel')
    expect(en.login.title).toBe('Enter your Duck Address')
  })
})