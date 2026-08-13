import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { useEffect, useRef, useState } from 'react'
import { Provider, createStore } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'
import { useAuth } from './use-auth'

vi.mock('@/core/auth', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  loginWithToken: vi.fn(),
}))

import { sendOtp as coreSendOtp, verifyOtp as coreVerifyOtp, loginWithToken as coreLoginWithToken } from '@/core/auth'

/** 测试辅助组件：调用 useAuth 并将状态暴露到 DOM 中 */
function AuthTestHarness({ username, otp, token, action }: {
  username?: string
  otp?: string
  token?: string
  action: 'sendOtp' | 'verifyOtp' | 'loginWithToken'
}) {
  const { status, error, sendOtp, verifyOtp, loginWithToken } = useAuth()
  const [result, setResult] = useState<boolean | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    async function run() {
      let res: boolean
      if (action === 'sendOtp' && username) {
        res = await sendOtp(username)
      } else if (action === 'verifyOtp' && username && otp) {
        res = await verifyOtp(username, otp)
      } else if (action === 'loginWithToken' && username && token) {
        res = await loginWithToken(username, token)
      } else {
        return
      }
      setResult(res)
    }
    run()
  }, [action, username, otp, token, sendOtp, verifyOtp, loginWithToken])

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="error">{error || ''}</span>
      <span data-testid="result">{result === null ? 'pending' : result ? 'true' : 'false'}</span>
    </div>
  )
}

function createTestStore() {
  const store = createStore()
  store.set(accountsAtom, [])
  store.set(activeAccountIdAtom, null)
  return store
}

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sendOtp: 核心模块成功时返回 true，状态恢复 idle', async () => {
    vi.mocked(coreSendOtp).mockResolvedValue({ success: true })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="testuser" action="sendOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('true')
    })
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })

  it('sendOtp: 核心模块失败时返回 false，设置错误和 status', async () => {
    vi.mocked(coreSendOtp).mockResolvedValue({
      success: false,
      error: 'Account testuser@duck.com is already in your list.',
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="testuser" action="sendOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('status').textContent).toBe('error')
    expect(screen.getByTestId('error').textContent).toContain('already in your list')
  })

  it('verifyOtp: 成功时写入 store 并返回 true', async () => {
    vi.mocked(coreVerifyOtp).mockResolvedValue({
      success: true,
      account: { username: 'otpuser', email: 'otpuser@duck.com', access_token: 'final_abc', cohort: '' },
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="otpuser" otp="pass 123" action="verifyOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('true')
    })
    expect(screen.getByTestId('status').textContent).toBe('idle')

    // 验证 store 中已写入账号
    const accounts = store.get(accountsAtom)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].username).toBe('otpuser')
    expect(accounts[0].access_token).toBe('final_abc')
    expect(store.get(activeAccountIdAtom)).toBe(accounts[0].id)
  })

  it('verifyOtp: 失败时不写入 store', async () => {
    vi.mocked(coreVerifyOtp).mockResolvedValue({
      success: false,
      error: 'Invalid or expired pass-phrase',
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="otpuser" otp="bad" action="verifyOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('status').textContent).toBe('error')
    expect(store.get(accountsAtom)).toHaveLength(0)
  })

  it('loginWithToken: 成功时写入 store 并返回 true', async () => {
    vi.mocked(coreLoginWithToken).mockResolvedValue({
      success: true,
      account: { username: 'tokenuser', email: 'tokenuser@duck.com', access_token: 'valid_token', nextAlias: 'my-alias' },
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="tokenuser" token="valid_token" action="loginWithToken" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('true')
    })
    expect(screen.getByTestId('status').textContent).toBe('idle')

    const accounts = store.get(accountsAtom)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].username).toBe('tokenuser')
    expect(accounts[0].access_token).toBe('valid_token')
    expect(accounts[0].nextAlias).toBe('my-alias')
  })

  it('loginWithToken: 失败时不写入 store', async () => {
    vi.mocked(coreLoginWithToken).mockResolvedValue({
      success: false,
      error: 'The Access Token is invalid or expired',
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="tokenuser" token="bad" action="loginWithToken" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('status').textContent).toBe('error')
    expect(store.get(accountsAtom)).toHaveLength(0)
  })

  it('clearError 重置状态', async () => {
    // 先触发一个失败
    vi.mocked(coreSendOtp).mockResolvedValue({
      success: false,
      error: 'Some error',
    })

    function ClearTest() {
      const { status, error, sendOtp, clearError } = useAuth()
      const [cleared, setCleared] = useState(false)

      useEffect(() => {
        async function run() {
          await sendOtp('testuser')
          clearError()
          setCleared(true)
        }
        run()
      }, [sendOtp, clearError])

      return (
        <div>
          <span data-testid="status">{status}</span>
          <span data-testid="error">{error || ''}</span>
          <span data-testid="cleared">{cleared ? 'yes' : 'no'}</span>
        </div>
      )
    }

    const store = createTestStore()
    render(
      <Provider store={store}>
        <ClearTest />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('idle')
    })
    expect(screen.getByTestId('error').textContent).toBe('')
  })
})