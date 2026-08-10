'use client'

import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'

export function AccountSwitcher() {
  const accounts = useAtomValue(accountsAtom)
  const [activeAccountId, setActiveAccountId] = useAtom(activeAccountIdAtom)

  if (accounts.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeAccountId || ''}
        onChange={(e) => setActiveAccountId(e.target.value)}
        className="px-3 py-1.5 bg-transparent border rounded-md border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none"
      >
        {accounts.map((acc) => (
          <option
            key={acc.id}
            value={acc.id}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            {acc.email || `${acc.username}@duck.com`}
          </option>
        ))}
      </select>
    </div>
  )
}