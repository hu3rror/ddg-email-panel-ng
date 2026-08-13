'use client'

import { useCallback, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { accountsAtom, activeAccountIdAtom, addAccount } from '@/core/store/account'
import { sendOtp as coreSendOtp, verifyOtp as coreVerifyOtp, loginWithToken as coreLoginWithToken } from '@/core/auth'

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

    const result = await coreSendOtp(username, accounts)
    if (!result.success) {
      setError(result.error)
      setStatus('error')
      return false
    }

    setStatus('idle')
    return true
  }, [accounts])

  const verifyOtp = useCallback(async (username: string, otp: string): Promise<boolean> => {
    setError(null)
    setStatus('verifying-otp')

    const result = await coreVerifyOtp(username, otp, accounts)
    if (!result.success) {
      setError(result.error)
      setStatus('error')
      return false
    }

    // 持久化到 store
    const { accounts: newAccounts, account } = addAccount(accounts, result.account)
    setAccounts(newAccounts)
    setActiveAccountId(account.id)

    setStatus('idle')
    return true
  }, [accounts, setAccounts, setActiveAccountId])

  const loginWithToken = useCallback(async (username: string, token: string): Promise<boolean> => {
    setError(null)
    setStatus('token-login')

    const result = await coreLoginWithToken(username, token, accounts)
    if (!result.success) {
      setError(result.error)
      setStatus('error')
      return false
    }

    // 持久化到 store
    const { accounts: newAccounts, account } = addAccount(accounts, result.account)
    setAccounts(newAccounts)
    setActiveAccountId(account.id)

    setStatus('idle')
    return true
  }, [accounts, setAccounts, setActiveAccountId])

  const clearError = useCallback(() => {
    setError(null)
    setStatus('idle')
  }, [])

  return { status, error, sendOtp, verifyOtp, loginWithToken, clearError }
}