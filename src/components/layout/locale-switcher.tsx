'use client'

import { useState, useRef, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Globe, ChevronDown } from 'lucide-react'
import { localeAtom, LOCALE_NAMES } from '@/i18n/locale-atom'
import { routing } from '@/i18n/routing'

export function LocaleSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2 py-1 rounded-btn border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="max-w-[80px] truncate">{LOCALE_NAMES[locale] || locale}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-card border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-md overflow-hidden">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLocale(l); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                l === locale
                  ? 'text-[var(--text-primary)] bg-[var(--bg-subtle)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {LOCALE_NAMES[l] || l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}