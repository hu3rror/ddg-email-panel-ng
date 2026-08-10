'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'
import { useHydrated } from '@/core/hooks/use-hydrated'

export function AccountManager() {
  const router = useRouter()
  const hydrated = useHydrated()
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

  if (!hydrated) {
    return (
      <div
        data-testid="account-skeleton"
        className="flex flex-col gap-4 max-w-lg w-full mx-auto p-6 animate-pulse"
      >
        <div className="h-6 bg-[var(--bg-subtle)] rounded w-1/2 mb-2" />
        <div className="h-16 bg-[var(--bg-subtle)] rounded-card" />
        <div className="h-16 bg-[var(--bg-subtle)] rounded-card" />
        <div className="h-10 bg-[var(--bg-subtle)] rounded-btn mt-2 border-2 border-dashed border-[var(--border-default)]" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8 text-[var(--text-secondary)]">
        No logged-in accounts found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg w-full mx-auto p-6 border border-[var(--border-default)] rounded-card bg-[var(--bg-surface)] shadow-sm">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Account Management</h2>

      <div className="flex flex-col gap-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between p-3 border border-[var(--border-default)] rounded-card bg-[var(--bg-subtle)]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text-primary)]">{acc.email || `${acc.username}@duck.com`}</span>
              <span className="text-xs text-[var(--text-muted)]">ID: {acc.id.slice(0, 8)}...</span>
            </div>

            <button
              type="button"
              onClick={() => handleRemoveAccount(acc.id)}
              className="px-3 py-1 text-xs font-medium rounded-btn border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Log Out
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push('/login?next=/account')}
        className="w-full py-2.5 mt-2 border-2 border-dashed border-[var(--border-default)] rounded-btn text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
      >
        + Add Account
      </button>
    </div>
  )
}