'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import { activeAccountAtom, accountsAtom } from '@/core/store/account'
import { CopyButton } from '@/components/copy-button'
import { ShieldCheck } from 'lucide-react'

export function EmailDashboard() {
  const activeAccount = useAtomValue(activeAccountAtom)
  const setAccounts = useSetAtom(accountsAtom)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const router = useRouter()

  useEffect(() => {
    if (!activeAccount) {
      router.push('/login')
    }
  }, [activeAccount, router])

  if (!activeAccount) {
    return (
      <div className="text-center p-8 text-[var(--text-secondary)]">
        No active account found. Redirecting to login...
      </div>
    )
  }

  const handleGenerateAlias = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/alias/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeAccount.access_token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to generate alias')
      }

      const data = await res.json()
      const newAlias = data.address

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === activeAccount.id ? { ...acc, nextAlias: newAlias } : acc
        )
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating private address')
    } finally {
      setLoading(false)
    }
  }

  const mainDuckAddress = `${activeAccount.username}@duck.com`
  const privateDuckAddress = activeAccount.nextAlias
    ? `${activeAccount.nextAlias}@duck.com`
    : ''

  return (
    <div className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 border border-[var(--border-default)] rounded-card bg-[var(--bg-surface)] shadow-sm">
      {/* 主 Duck 地址 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Main Duck Address
        </span>
        <div className="flex items-center justify-between gap-4 p-3 rounded-card bg-[var(--bg-subtle)]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--duck-pill-bg)] text-[var(--duck-pill-text)] text-base font-medium">
            {mainDuckAddress}
          </span>
          <CopyButton text={mainDuckAddress} />
        </div>
      </div>

      <hr className="border-[var(--border-default)]" />

      {/* 私密 Duck 地址 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Private Duck Address
        </span>
        <div className="flex items-center justify-between gap-4 p-3 rounded-card bg-[var(--bg-subtle)]">
          {privateDuckAddress ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--duck-pill-bg)] text-[var(--duck-pill-text)] text-base font-medium">
              <ShieldCheck size={16} className="text-ddg-green dark:text-ddg-green-dark" />
              {privateDuckAddress}
            </span>
          ) : (
            <span className="text-sm italic text-[var(--text-muted)]">No alias generated yet</span>
          )}
          <CopyButton text={privateDuckAddress} disabled={!privateDuckAddress} />
        </div>
      </div>

      {errorMsg && <p className="text-xs text-[var(--brand-orange)]">{errorMsg}</p>}

      <button
        type="button"
        onClick={handleGenerateAlias}
        disabled={loading}
        className="w-full py-2.5 bg-ddg-orange hover:bg-ddg-orange-hover text-white font-semibold rounded-btn text-sm disabled:opacity-50 transition-colors mt-2"
      >
        {loading ? 'Generating...' : 'Generate Private Duck Address'}
      </button>
    </div>
  )
}