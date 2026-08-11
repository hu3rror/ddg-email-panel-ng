'use client'

import React from 'react'
import Link from 'next/link'
import { AccountSwitcher } from './account-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

const GITHUB_URL = 'https://github.com/hu3rror/ddg-email-panel-ng'

export function Nav() {
  return (
    <header className="w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 backdrop-blur px-6 py-3">
      <div className="nav-container flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 nav-links">
          <Link href="/email" className="font-bold text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            DDG Email Panel
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium text-[var(--text-secondary)]">
            <Link href="/email" className="hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              Email
            </Link>
            <Link href="/account" className="hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              Account
            </Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
              About
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 nav-actions shrink-0">
          <AccountSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}