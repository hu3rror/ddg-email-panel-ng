'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  requestOtpSchema,
  verifyOtpSchema,
  accessTokenLoginSchema,
} from '@/core/schemas/auth'
import { accountsAtom, activeAccountIdAtom, activeAccountAtom, Account } from '@/core/store/account'

export function LoginForm({ next = '/email' }: { next?: string }) {
  const router = useRouter()
  const accounts = useAtomValue(accountsAtom)
  const activeAccount = useAtomValue(activeAccountAtom)
  const setAccounts = useSetAtom(accountsAtom)
  const setActiveAccountId = useSetAtom(activeAccountIdAtom)

  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'username' | 'otp' | 'token'>('username')

  const isAddingAccount = accounts.length > 0

  const addingBanner = isAddingAccount ? (
    <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-btn px-3 py-2 text-center">
      You are currently logged in as{' '}
      <Link
        href="/email"
        className="underline hover:text-[var(--text-primary)] transition-colors"
      >
        {activeAccount?.email || `${activeAccount?.username}@duck.com`}
      </Link>.
      Adding another account will switch to it.
    </div>
  ) : null

  const handleDuplicate = (username: string): boolean => {
    const existing = accounts.find(
      (a) => a.username.toLowerCase() === username.toLowerCase()
    )
    if (existing) {
      setErrorMsg(
        `Account ${existing.email || existing.username + '@duck.com'} is already in your list.`
      )
      return true
    }
    return false
  }

  // 发送 OTP 邮件
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parseResult = requestOtpSchema.safeParse({ username })
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0].message)
      return
    }

    // 去重检查: 在发送 OTP 之前检查，避免浪费一次性密码
    if (handleDuplicate(username)) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/loginlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        if (data.error === 'rc') {
          setErrorMsg(
            'DuckDuckGo requires a security check to send OTP emails. ' +
              'Please try again later, or use the Access Token login below.'
          )
          return
        }

        throw new Error(data.message || 'Failed to send OTP')
      }

      setMode('otp')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending request')
    } finally {
      setLoading(false)
    }
  }

  // 验证 OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parseResult = verifyOtpSchema.safeParse({ username, otp })
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Verification failed')
      }

      const userData = await res.json()

      // 去重检查
      if (handleDuplicate(userData.username)) {
        setLoading(false)
        return
      }

      const newAccount: Account = {
        id: crypto.randomUUID(),
        username: userData.username,
        email: userData.email,
        access_token: userData.access_token,
        cohort: userData.cohort,
      }

      setAccounts((prev) => [...prev, newAccount])
      setActiveAccountId(newAccount.id)

      router.push(next)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying OTP')
    } finally {
      setLoading(false)
    }
  }

  // 直连 Access Token 登录
  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parseResult = accessTokenLoginSchema.safeParse({ username, token })
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      // 去重检查
      if (handleDuplicate(parseResult.data.username)) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/alias/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${parseResult.data.token}`,
        },
      })

      let nextAlias = ''
      if (res.ok) {
        const aliasData = await res.json()
        nextAlias = aliasData.address || ''
      }

      const newAccount: Account = {
        id: crypto.randomUUID(),
        username: parseResult.data.username,
        email: `${parseResult.data.username}@duck.com`,
        access_token: parseResult.data.token,
        nextAlias,
      }

      setAccounts((prev) => [...prev, newAccount])
      setActiveAccountId(newAccount.id)

      router.push(next)
    } catch (err: any) {
      setErrorMsg(err.message || 'The Access Token is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP 输入界面 ──
  if (mode === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
        {addingBanner}
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
          {errorMsg && <p className="text-xs text-ddg-orange">{errorMsg}</p>}
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
          onClick={() => {
            setMode('username')
            setErrorMsg('')
          }}
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
        {addingBanner}
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

          {errorMsg && <p className="text-xs text-ddg-orange">{errorMsg}</p>}
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
          onClick={() => {
            setMode('username')
            setErrorMsg('')
          }}
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
      {addingBanner}
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
        {errorMsg && <p className="text-xs text-ddg-orange">{errorMsg}</p>}
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
        onClick={() => {
          setMode('token')
          setErrorMsg('')
        }}
        className="text-xs text-ddg-blue dark:text-ddg-blue-dark hover:underline text-center mt-1 transition-colors"
      >
        Login using Access Token
      </button>
    </form>
  )
}