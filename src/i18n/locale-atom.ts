'use client'

import { atomWithStorage } from 'jotai/utils'
import { routing, type Locale } from './routing'

/** 与 jotai 的 SyncStorage 接口一致，内联定义以避免深层导入触发多实例检测。 */
interface SyncStorage<Value> {
  getItem: (key: string, initialValue: Value) => Value
  setItem: (key: string, newValue: Value) => void
  removeItem: (key: string) => void
}

/**
 * 将一组浏览器语言代码（按偏好排序）匹配到最接近的 locale。
 * 匹配逻辑：精确匹配 → 语言前缀匹配（如 "en-US" 匹配 "en"）→ 默认英文。
 * 导出为纯函数以便测试。
 */
export function matchLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    if (!lang) continue
    // 精确匹配：如 "zh-CN" 直接命中
    if (routing.locales.includes(lang as Locale)) return lang as Locale

    // 中文特殊处理：区分简体（zh-CN）与繁体（zh-TW）
    if (lang.startsWith('zh')) {
      // 繁体：Hant 脚本 / TW、HK、MO 地区
      if (/hant|tw|hk|mo/i.test(lang)) return 'zh-TW'
      // 简体：Hans 脚本 / CN、SG 地区；裸 "zh" 默认简体
      return 'zh-CN'
    }

    // 语言前缀匹配：如 "en-GB" → "en"，"pt-PT" → "pt-BR"
    const prefix = lang.split('-')[0]
    const match = routing.locales.find((l) => l.startsWith(prefix))
    if (match) return match
  }

  return routing.defaultLocale
}

/**
 * 当 localStorage 中没有保存的语言偏好时，检测浏览器语言并匹配最接近的 locale。
 */
function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return routing.defaultLocale

  // navigator.languages 按偏好排序，优先使用第一个
  const langs: string[] =
    (navigator.languages as string[] | undefined)?.length
      ? (navigator.languages as string[])
      : [navigator.language]

  return matchLocale(langs)
}

/**
 * 自定义 localStorage 存储：
 * - 用户已手动选择过的语言 → 使用保存值
 * - 首次访问（localStorage 无值）→ 检测浏览器语言
 * - 浏览器语言也不匹配时 → 默认英文
 */
const localeStorage: SyncStorage<Locale> = {
  getItem: (key, initialValue) => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) return stored as Locale
    } catch {
      /* localStorage 不可用，使用 initialValue */
    }
    return detectBrowserLocale()
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* 静默忽略 */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* 静默忽略 */
    }
  },
}

export const localeAtom = atomWithStorage<Locale>('ddg_locale', routing.defaultLocale, localeStorage)

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  'pt-BR': 'Português',
  ru: 'Русский',
  ko: '한국어',
  hi: 'हिन्दी',
  ar: 'العربية',
  tr: 'Türkçe',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja-JP': '日本語',
}