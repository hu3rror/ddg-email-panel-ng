'use client'

import React from 'react'
import Link from 'next/link'
import { useAtom, useAtomValue } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'

export function AccountSwitcher() {
  const accounts = useAtomValue(accountsAtom)
  const [activeAccountId, setActiveAccountId] = useAtom(activeAccountIdAtom)

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

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeAccountId || ''}
        onChange={(e) => setActiveAccountId(e.target.value)}
        className="px-3 py-1.5 bg-[var(--bg-surface)] border rounded-btn border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium focus:outline-none"
      >
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.email || `${acc.username}@duck.com`}
          </option>
        ))}
      </select>
    </div>
  )
}