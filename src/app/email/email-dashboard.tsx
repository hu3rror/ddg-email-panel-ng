'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  activeAccountAtom,
  accountsAtom,
  addAliasHistoryEntry,
  backfillAliasHistory,
  ALIAS_HISTORY_LIMIT,
} from '@/core/store/account'
import { CopyButton } from '@/components/copy-button'
import { useHydrated } from '@/core/hooks/use-hydrated'
import { useMessages } from '@/i18n/use-messages'
import { ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react'

type TranslateFn = (key: string, params?: Record<string, string>) => string

function formatRelativeTime(isoString: string, t: TranslateFn): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return t('email.justNow')
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return t('email.minutesAgo', { n: String(diffMin) })
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return t('email.hoursAgo', { n: String(diffHour) })
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return t('email.daysAgo', { n: String(diffDay) })
  // 超过 7 天显示日期
  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function AliasHistoryPanel({
  history,
  open,
  onToggle,
}: {
  history: { address: string; generatedAt: string }[] | undefined
  open: boolean
  onToggle: () => void
}) {
  const { t } = useMessages()
  if (!history || history.length === 0) return null

  return (
    <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {t('email.recentAliases', {
          count: String(history.length),
          limit: String(ALIAS_HISTORY_LIMIT),
        })}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1.5 pt-1">
            {history.map((entry, idx) => (
              <div
                key={`${entry.address}-${idx}`}
                className="flex items-center justify-between gap-2 p-2 rounded-card bg-[var(--bg-subtle)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-[var(--text-muted)] shrink-0 min-w-[4.5rem] text-right whitespace-nowrap">
                    {formatRelativeTime(entry.generatedAt, t)}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {entry.address}@duck.com
                  </span>
                </div>
                <CopyButton text={`${entry.address}@duck.com`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmailDashboard() {
  const { t } = useMessages()
  const hydrated = useHydrated()
  const activeAccount = useAtomValue(activeAccountAtom)
  const setAccounts = useSetAtom(accountsAtom)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const backfilled = useRef(false)

  // 迁移：已有 nextAlias 但无 aliasHistory 的账户自动回填
  useEffect(() => {
    if (hydrated && !backfilled.current) {
      backfilled.current = true
      setAccounts(backfillAliasHistory)
    }
  }, [hydrated, setAccounts])

  if (!hydrated) {
    return (
      <div
        data-testid="dashboard-skeleton"
        className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 animate-pulse"
      >
        <div className="h-4 bg-[var(--bg-subtle)] rounded w-1/3" />
        <div className="h-12 bg-[var(--bg-subtle)] rounded-card" />
        <div className="h-4 bg-[var(--bg-subtle)] rounded w-1/3" />
        <div className="h-12 bg-[var(--bg-subtle)] rounded-card" />
        <div className="h-10 bg-[var(--bg-subtle)] rounded-btn mt-2" />
      </div>
    )
  }

  if (!activeAccount) {
    return (
      <div className="text-center p-8 text-[var(--text-secondary)]">
        {t('email.noAccount')}
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
        addAliasHistoryEntry(prev, activeAccount.id, {
          address: newAlias,
          generatedAt: new Date().toISOString(),
        })
      )
    } catch (err: any) {
      setErrorMsg(err.message || t('email.generateError'))
    } finally {
      setLoading(false)
    }
  }

  const mainDuckAddress = `${activeAccount.username}@duck.com`
  const privateDuckAddress = activeAccount.nextAlias
    ? `${activeAccount.nextAlias}@duck.com`
    : ''
  const historyCount = activeAccount.aliasHistory?.length ?? 0

  return (
    <div className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 border border-[var(--border-default)] rounded-card bg-[var(--bg-surface)] shadow-sm">
      {/* 主 Duck 地址 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {t('email.mainDuckAddress')}
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
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {t('email.privateDuckAddress')}
        </span>
        <div className="flex items-center justify-between gap-4 p-3 rounded-card bg-[var(--bg-subtle)]">
          {privateDuckAddress ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--duck-pill-bg)] text-[var(--duck-pill-text)] text-base font-medium">
              <ShieldCheck size={16} className="text-ddg-green dark:text-ddg-green-dark" />
              {privateDuckAddress}
            </span>
          ) : (
            <span className="text-sm italic text-[var(--text-muted)]">{t('email.noAliasYet')}</span>
          )}
          <CopyButton text={privateDuckAddress} disabled={!privateDuckAddress} />
        </div>
      </div>

      {errorMsg && <p className="text-xs text-ddg-orange">{errorMsg}</p>}

      <button
        type="button"
        onClick={handleGenerateAlias}
        disabled={loading}
        className="w-full py-2.5 bg-ddg-orange hover:bg-ddg-orange-hover text-white font-semibold rounded-btn text-sm disabled:opacity-50 transition-colors mt-2"
      >
        {loading ? t('email.generating') : t('email.generateButton')}
      </button>

      {/* 别名历史折叠面板 */}
      <AliasHistoryPanel
        history={activeAccount.aliasHistory}
        open={historyOpen}
        onToggle={() => setHistoryOpen((v) => !v)}
      />
    </div>
  )
}