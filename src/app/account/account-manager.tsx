'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'

export function AccountManager() {
  const router = useRouter()
  const [accounts, setAccounts] = useAtom(accountsAtom)
  const [activeAccountId, setActiveAccountId] = useAtom(activeAccountIdAtom)

  const handleRemoveAccount = (id: string) => {
    const updatedAccounts = accounts.filter((acc) => acc.id !== id)
    setAccounts(updatedAccounts)

    if (activeAccountId === id) {
      const nextActive = updatedAccounts[0]?.id || null
      setActiveAccountId(nextActive)
    }

    if (updatedAccounts.length === 0) {
      router.push('/login')
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">
        No logged-in accounts. Redirecting...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg w-full mx-auto p-6 border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <h2 className="text-xl font-bold tracking-tight mb-2">Account Management</h2>

      <div className="flex flex-col gap-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between p-3 border rounded-lg border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{acc.email || `${acc.username}@duck.com`}</span>
              <span className="text-xs text-slate-400">ID: {acc.id.slice(0, 8)}...</span>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveAccount(acc.id)}
              className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
            >
              Log Out
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}