'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { accountsAtom, activeAccountAtom } from '@/core/store/account'
import { useAuth } from '@/core/hooks/use-auth'

function AddingBanner({ activeAccount }: { activeAccount: { email?: string; username: string } | null }) {
  if (!activeAccount) return null
  return (
    <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-btn px-3 py-2 text-center">
      You are currently logged in as{' '}
      <Link
        href="/email"
        className="underline hover:text-[var(--text-primary)] transition-colors"
      >
        {activeAccount.email || `${activeAccount.username}@duck.com`}
      </Link>.
      Adding another account will switch to it.
    </div>
  )
}

export function LoginForm({ next = '/email' }: { next?: string }) {
  const router = useRouter()
  const accounts = useAtomValue(accountsAtom)
  const activeAccount = useAtomValue(activeAccountAtom)
  const { status, error, sendOtp, verifyOtp, loginWithToken, clearError } = useAuth()

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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Check your inbox!</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Passphrase sent to <strong>{username}@duck.com</strong>
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <input
            type="text"
            placeholder="Enter One-time Passphrase"
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
          {loading ? 'Verifying...' : 'Continue'}
        </button>

        <button
          type="button"
          onClick={() => switchMode('username')}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center mt-2 transition-colors"
        >
          Back
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
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Login using Access Token</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Enter your Duck Address and API Access Token</p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex rounded-btn border border-[var(--border-default)] overflow-hidden">
            <input
              type="text"
              placeholder="Duck Address"
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
            placeholder="Enter your Access Token"
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
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => switchMode('username')}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-center mt-2 transition-colors"
        >
          Back to Username Login
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
          Enter your Duck Address
        </label>
        <div className="flex rounded-btn border border-[var(--border-default)] overflow-hidden">
          <input
            id="username"
            type="text"
            placeholder="Duck Address"
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
        {loading ? 'Sending...' : 'Login'}
      </button>

      <button
        type="button"
        onClick={() => switchMode('token')}
        className="text-xs text-ddg-blue dark:text-ddg-blue-dark hover:underline text-center mt-1 transition-colors"
      >
        Login using Access Token
      </button>
    </form>
  )
}