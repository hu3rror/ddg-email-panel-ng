'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtom, useAtomValue } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'
import { useHydrated } from '@/core/hooks/use-hydrated'

export function AccountSwitcher() {
  const router = useRouter()
  const hydrated = useHydrated()
  const accounts = useAtomValue(accountsAtom)
  const [activeAccountId, setActiveAccountId] = useAtom(activeAccountIdAtom)

  if (!hydrated) {
    return (
      <div
        data-testid="switcher-skeleton"
        className="px-3 py-1.5 w-[120px] h-9 rounded-btn bg-[var(--bg-subtle)] animate-pulse"
        aria-label="Loading accounts"
      />
    )
  }

  if (accounts.length === 0) {
    return (
      <Link
        href="/login"
        className="px-4 py-1.5 text-sm font-semibold rounded-btn bg-ddg-orange hover:bg-ddg-orange-hover text-white transition-colors"
      >
        Login
      </Link>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__add__') {
      router.push('/login?next=/account')
      return
    }
    setActiveAccountId(e.target.value)
  }

  return (
    <div className="flex items-center gap-2 relative">
      <select
        value={activeAccountId || ''}
        onChange={handleChange}
        className="appearance-none px-3 py-1.5 pr-8 bg-[var(--bg-surface)] border rounded-btn border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium focus:outline-none cursor-pointer"
      >
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.email || `${acc.username}@duck.com`}
          </option>
        ))}
        <option value="__add__">+ Add Account</option>
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}