'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import {
  requestOtpSchema,
  verifyOtpSchema,
  accessTokenLoginSchema,
} from '@/core/schemas/auth'
import { accountsAtom, activeAccountIdAtom, Account } from '@/core/store/account'

export function LoginForm() {
  const router = useRouter()
  const setAccounts = useSetAtom(accountsAtom)
  const setActiveAccountId = useSetAtom(activeAccountIdAtom)

  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'username' | 'otp' | 'token'>('username')

  // 发送 OTP 邮件
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parseResult = requestOtpSchema.safeParse({ username })
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0].message)
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

        // 处理 DDG reCAPTCHA 挑战 — 引导用户使用 Access Token 登录
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

      const newAccount: Account = {
        id: crypto.randomUUID(),
        username: userData.username,
        email: userData.email,
        access_token: userData.access_token,
        cohort: userData.cohort,
      }

      setAccounts((prev) => [...prev, newAccount])
      setActiveAccountId(newAccount.id)

      router.push('/email')
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
      // 通过尝试生成别名验证 Token 的可用性
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

      router.push('/email')
    } catch (err: any) {
      setErrorMsg(err.message || 'The Access Token is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  // OTP 输入界面
  if (mode === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Check your inbox!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Passphrase sent to <strong>{username}@duck.com</strong>
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <input
            type="text"
            placeholder="Enter One-time Passphrase"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-transparent text-sm"
          />
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Continue'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('username')
            setErrorMsg('')
          }}
          className="text-xs text-slate-500 hover:underline text-center mt-2"
        >
          Back
        </button>
      </form>
    )
  }

  // Token 登录界面
  if (mode === 'token') {
    return (
      <form onSubmit={handleTokenLogin} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Login using Access Token</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your Duck Address and API Access Token</p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <div className="flex rounded-md shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
            <input
              type="text"
              placeholder="Duck Address"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
            />
            <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500">
              @duck.com
            </span>
          </div>

          <input
            type="text"
            placeholder="Enter your Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-slate-300 dark:border-slate-700 bg-transparent text-sm"
          />

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('username')
            setErrorMsg('')
          }}
          className="text-xs text-slate-500 hover:underline text-center mt-2"
        >
          Back to Username Login
        </button>
      </form>
    )
  }

  // 默认 Duck Address 登录界面
  return (
    <form onSubmit={handleSendOtp} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium">
          Enter your Duck Address
        </label>
        <div className="flex rounded-md shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
          <input
            id="username"
            type="text"
            placeholder="Duck Address"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
          />
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500">
            @duck.com
          </span>
        </div>
        {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Login'}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode('token')
          setErrorMsg('')
        }}
        className="text-xs text-sky-600 dark:text-sky-400 hover:underline text-center mt-1"
      >
        Login using Access Token
      </button>
    </form>
  )
}