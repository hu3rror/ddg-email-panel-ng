'use client'

import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { localeAtom } from '@/i18n/locale-atom'

const RTL_LOCALES = new Set(['ar'])

/**
 * 保持 <html lang> 与当前语言一致，并为 RTL 语言（如阿拉伯语）设置 dir="rtl"。
 * 仅做客户端副作用，不影响服务端渲染的初始 lang。
 */
export function HtmlLangSync() {
  const [locale] = useAtom(localeAtom)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
  }, [locale])

  return null
}