'use client'

import React, { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { activeAccountAtom, accountsAtom } from '@/core/store/account'
import { CopyButton } from '@/components/copy-button'

export function EmailDashboard() {
  const activeAccount = useAtomValue(activeAccountAtom)
  const setAccounts = useSetAtom(accountsAtom)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!activeAccount) {
    return (
      <div className="text-center p-8 text-slate-500">
        No active account found. Please log in first.
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
    <div className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* 主 Duck 地址 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Main Duck Address
        </span>
        <div className="flex items-center justify-between gap-4">
          <span className="text-base font-medium">{mainDuckAddress}</span>
          <CopyButton text={mainDuckAddress} />
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* 私密 Duck 地址 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Private Duck Address
        </span>
        <div className="flex items-center justify-between gap-4">
          {privateDuckAddress ? (
            <span className="text-base font-medium text-sky-600 dark:text-sky-400">
              {privateDuckAddress}
            </span>
          ) : (
            <span className="text-sm italic text-slate-400">No alias generated yet</span>
          )}
          <CopyButton text={privateDuckAddress} disabled={!privateDuckAddress} />
        </div>
      </div>

      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

      <button
        type="button"
        onClick={handleGenerateAlias}
        disabled={loading}
        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors mt-2"
      >
        {loading ? 'Generating...' : 'Generate Private Duck Address'}
      </button>
    </div>
  )
}