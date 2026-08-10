'use client'

import React from 'react'
import Link from 'next/link'
import { AccountSwitcher } from './account-switcher'

export function Nav() {
  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/email" className="font-bold text-lg tracking-tight">
          DDG Email Panel
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Link href="/email" className="hover:text-sky-600 dark:hover:text-sky-400">
            Email
          </Link>
          <Link href="/account" className="hover:text-sky-600 dark:hover:text-sky-400">
            Account
          </Link>
        </nav>
      </div>

      <AccountSwitcher />
    </header>
  )
}