'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { accountsAtom, activeAccountAtom } from '@/core/store/account'
import { useAuth } from '@/core/hooks/use-auth'
import { useMessages } from '@/i18n/use-messages'

function AddingBanner({ activeAccount }: { activeAccount: { email?: string; username: string } | null }) {
  const { t } = useMessages()
  if (!activeAccount) return null
  return (
    <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-btn px-3 py-2 text-center">
      {t('login.addingBannerPrefix')}
      <Link
        href="/email"
        className="underline hover:text-[var(--text-primary)] transition-colors"
      >
        {activeAccount.email || `${activeAccount.username}@duck.com`}
      </Link>
      {t('login.addingBannerSuffix')}
    </div>
  )
}

export function LoginForm({ next = '/email' }: { next?: string }) {
  const router = useRouter()
  const accounts = useAtomValue(accountsAtom)
  const activeAccount = useAtomValue(activeAccountAtom)
  const { status, error, sendOtp, verifyOtp, loginWithToken, clearError } = useAuth()
  const { t } = useMessages()

  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [mode, setMode] = useState<'username' | 'otp' | 'token'>('username')

  const loading = status === 'sending-otp' || status === 'verifying-otp' || status === 'token-login'
  const isAddingAccount = accounts.length > 0

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await sendOtp(username)) {
      setMode('otp')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await verifyOtp(username, otp)) {
      router.push(next)
    }
  }

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await loginWithToken(username, token)) {
      router.push(next)
    }
  }

  const switchMode = (newMode: 'username' | 'otp' | 'token') => {
    setMode(newMode)
    clearError()
  }

  // ── OTP 输入界面 ──
  if (mode === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
        <AddingBanner activeAccount={isAddingAccount ? activeAccount : null} />
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('login.otpTitle')}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t('login.otpDescription', { email: `${username}@duck.com` })}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <input
            type="text"
            placeholder={t('login.otpPlaceholder')}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 border rounded-btn border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]"
          />
          {error && <p className="text-xs text-ddg-orange">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-ddg-orange hover:bg-ddg-orange-hover text-white rounded-btn text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? t('login.otpVerifying') : t('login.otpContinue')}
        </button>

        <button
          type="button"
          onClick={() => switchMode('username')}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center mt-2 transition-colors"
        >
          {t('login.otpBack')}
        </button>
      </form>
    )
  }

  // ── Token 登录界面 ──
  if (mode === 'token') {
    return (
      <form onSubmit={handleTokenLogin} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
        <AddingBanner activeAccount={isAddingAccount ? activeAccount : null} />
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('login.tokenTitle')}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{t('login.tokenDescription')}</p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex rounded-btn border border-[var(--border-default)] overflow-hidden">
            <input
              type="text"
              placeholder={t('login.tokenDuckPlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
            />
            <span className="bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              @duck.com
            </span>
          </div>

          <input
            type="text"
            placeholder={t('login.tokenPlaceholder')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-btn border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]"
          />

          {error && <p className="text-xs text-ddg-orange">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-ddg-orange hover:bg-ddg-orange-hover text-white rounded-btn text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? t('login.tokenLoggingIn') : t('login.tokenLoginButton')}
        </button>

        <button
          type="button"
          onClick={() => switchMode('username')}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center mt-2 transition-colors"
        >
          {t('login.tokenBack')}
        </button>
      </form>
    )
  }

  // ── 默认 Duck Address 登录界面 ──
  return (
    <form onSubmit={handleSendOtp} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
      <AddingBanner activeAccount={isAddingAccount ? activeAccount : null} />
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium text-[var(--text-primary)]">
          {t('login.usernameLabel')}
        </label>
        <div className="flex rounded-btn border border-[var(--border-default)] overflow-hidden">
          <input
            id="username"
            type="text"
            placeholder={t('login.usernamePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 px-3 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
          />
          <span className="bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            @duck.com
          </span>
        </div>
        {error && <p className="text-xs text-ddg-orange">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-ddg-orange hover:bg-ddg-orange-hover text-white rounded-btn text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {loading ? t('login.usernameSending') : t('login.usernameLoginButton')}
      </button>

      <button
        type="button"
        onClick={() => switchMode('token')}
        className="text-xs text-ddg-blue dark:text-ddg-blue-dark hover:underline text-center mt-1 transition-colors"
      >
        {t('login.usernameTokenLink')}
      </button>
    </form>
  )
}