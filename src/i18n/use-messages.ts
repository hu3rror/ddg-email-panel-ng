'use client'

import { useAtom } from 'jotai'
import { localeAtom } from './locale-atom'
import { type Locale } from './routing'
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

/** 每个 locale 的字典必须注册在这里。新增 locale 时，TypeScript 的 Record<Locale,…> 会强制要求添加。 */
const dictionaries: Record<Locale, typeof en> = {
  en,
  es,
  fr,
  de,
  'it': itLang,
  'pt-BR': ptBR,
  ru,
  ko,
  hi,
  ar,
  tr,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': jaJP,
}

/**
 * 通过点路径从字典中取值，如 "nav.title"。
 * 支持 {param} 插值。未找到时回退到 key 本身。
 */
function resolve(dict: typeof en, key: string, params?: Record<string, string>): string {
  const value = key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k]
    return undefined
  }, dict as unknown as Record<string, unknown>)

  if (typeof value !== 'string') return key
  if (!params) return value
  return Object.entries(params).reduce((str, [k, v]) => str.replace(`{${k}}`, v), value)
}

export function useMessages() {
  const [locale] = useAtom(localeAtom)
  const dict = dictionaries[locale]

  return {
    t: (key: string, params?: Record<string, string>) => resolve(dict, key, params),
    locale,
  }
}