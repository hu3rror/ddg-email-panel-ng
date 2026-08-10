'use client'

import React from 'react'
import Link from 'next/link'
import { AccountSwitcher } from './account-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

export function Nav() {
  return (
    <header className="w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/50 backdrop-blur px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/email" className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
          DDG Email Panel
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-[var(--text-secondary)]">
          <Link href="/email" className="hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
            Email
          </Link>
          <Link href="/account" className="hover:text-ddg-blue dark:hover:text-ddg-blue-dark transition-colors">
            Account
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <AccountSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}