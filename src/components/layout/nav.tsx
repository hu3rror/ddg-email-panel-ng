'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, User, Github, Menu, X } from 'lucide-react'
import { AccountSwitcher } from './account-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleSwitcher } from './locale-switcher'
import { useMessages } from '@/i18n/use-messages'

const GITHUB_URL = 'https://github.com/hu3rror/ddg-email-panel-ng'

export function Nav() {
  const [open, setOpen] = useState(false)
  const { t } = useMessages()

  return (
    <header className="w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 backdrop-blur">
      <div className="nav-container flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6 sm:gap-10">
          <Link href="/email" className="flex items-center gap-2 font-bold text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            <img src="/favicon.svg" alt="" className="w-6 h-6 rounded" />
            {t('nav.title')}
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
            <Link href="/email" className="flex items-center gap-1.5 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <Mail className="w-4 h-4" />
              {t('nav.email')}
            </Link>
            <Link href="/account" className="flex items-center gap-1.5 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <User className="w-4 h-4" />
              {t('nav.account')}
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <Github className="w-4 h-4" />
              {t('nav.about')}
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 nav-actions shrink-0">
            <LocaleSwitcher />
            <AccountSwitcher />
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-md text-[var(--text-secondary)] hover:text-ddg-blue dark:hover:text-ddg-blue-dark hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-[var(--border-default)] px-6 py-4 flex flex-col gap-4">
          <nav className="flex flex-col gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <Link href="/email" onClick={() => setOpen(false)} className="flex items-center gap-2 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <Mail className="w-4 h-4" />
              {t('nav.email')}
            </Link>
            <Link href="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <User className="w-4 h-4" />
              {t('nav.account')}
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              <Github className="w-4 h-4" />
              {t('nav.about')}
            </a>
          </nav>

          <div className="flex flex-col gap-4 border-t border-[var(--border-default)] pt-4">
            <LocaleSwitcher />
            <div className="flex items-center gap-6">
              <AccountSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}