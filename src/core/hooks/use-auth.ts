'use client'

import { useCallback, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { accountsAtom, activeAccountIdAtom, addAccount, isDuplicate } from '@/core/store/account'
import {
  requestOtpSchema,
  verifyOtpSchema,
  accessTokenLoginSchema,
} from '@/core/schemas/auth'

export type AuthStatus =
  | 'idle'
  | 'sending-otp'
  | 'otp-sent'
  | 'verifying-otp'
  | 'token-login'
  | 'success'
  | 'error'

export interface UseAuthReturn {
  status: AuthStatus
  error: string | null
  sendOtp: (username: string) => Promise<boolean>
  verifyOtp: (username: string, otp: string) => Promise<boolean>
  loginWithToken: (username: string, token: string) => Promise<boolean>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const accounts = useAtomValue(accountsAtom)
  const setAccounts = useSetAtom(accountsAtom)
  const setActiveAccountId = useSetAtom(activeAccountIdAtom)

  const sendOtp = useCallback(async (username: string): Promise<boolean> => {
    setError(null)
    setStatus('sending-otp')

    // 校验
    const parseResult = requestOtpSchema.safeParse({ username })
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message)
      setStatus('error')
      return false
    }

    // 去重
    if (isDuplicate(accounts, username)) {
      setError(`Account ${username}@duck.com is already in your list.`)
      setStatus('error')
      return false
    }

    try {
      const res = await fetch('/api/auth/loginlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'rc') {
          setError(
            'DuckDuckGo requires a security check to send OTP emails. ' +
            'Please try again later, or use the Access Token login below.'
          )
        } else {
          setError(data.message || 'Failed to send OTP')
        }
        setStatus('error')
        return false
      }

      setStatus('idle')
      return true
    } catch (err: any) {
      setError(err.message || 'Error sending request')
      setStatus('error')
      return false
    }
  }, [accounts])

  const verifyOtp = useCallback(async (username: string, otp: string): Promise<boolean> => {
    setError(null)
    setStatus('verifying-otp')

    const parseResult = verifyOtpSchema.safeParse({ username, otp })
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message)
      setStatus('error')
      return false
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || 'Verification failed')
        setStatus('error')
        return false
      }

      const userData = await res.json()

      // 去重检查（用户名来自上游响应，规范化后比对）
      if (isDuplicate(accounts, userData.username || username)) {
        setError(
          `Account ${userData.email || (userData.username || username) + '@duck.com'} is already in your list.`
        )
        setStatus('error')
        return false
      }

      const { accounts: newAccounts, account } = addAccount(accounts, {
        username: userData.username || username,
        email: userData.email || '',
        access_token: userData.access_token,
        cohort: userData.cohort || '',
      })
      setAccounts(newAccounts)
      setActiveAccountId(account.id)

      setStatus('idle')
      return true
    } catch (err: any) {
      setError(err.message || 'Error verifying OTP')
      setStatus('error')
      return false
    }
  }, [accounts, setAccounts, setActiveAccountId])

  const loginWithToken = useCallback(async (username: string, token: string): Promise<boolean> => {
    setError(null)
    setStatus('token-login')

    const parseResult = accessTokenLoginSchema.safeParse({ username, token })
    if (!parseResult.success) {
      setError(parseResult.error.issues[0].message)
      setStatus('error')
      return false
    }

    // 去重检查
    if (isDuplicate(accounts, username)) {
      setError(`Account ${username}@duck.com is already in your list.`)
      setStatus('error')
      return false
    }

    try {
      const res = await fetch('/api/alias/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      let nextAlias = ''
      if (res.ok) {
        const aliasData = await res.json()
        nextAlias = aliasData.address || ''
      }

      const { accounts: newAccounts, account } = addAccount(accounts, {
        username,
        email: `${username}@duck.com`,
        access_token: token,
        nextAlias,
      })
      setAccounts(newAccounts)
      setActiveAccountId(account.id)

      setStatus('idle')
      return true
    } catch (err: any) {
      setError(err.message || 'The Access Token is invalid or expired')
      setStatus('error')
      return false
    }
  }, [accounts, setAccounts, setActiveAccountId])

  const clearError = useCallback(() => {
    setError(null)
    setStatus('idle')
  }, [])

  return { status, error, sendOtp, verifyOtp, loginWithToken, clearError }
}