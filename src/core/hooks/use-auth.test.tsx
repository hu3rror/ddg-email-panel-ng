import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React, { useEffect, useRef, useState } from 'react'
import { Provider, createStore } from 'jotai'
import { accountsAtom, activeAccountIdAtom } from '@/core/store/account'
import { useAuth } from './use-auth'

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

  it('sendOtp: 成功发送 OTP 时返回 true，状态恢复 idle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'success' }),
    }))

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

  it('sendOtp: 重复账号时不发送请求，返回 false 并设置错误', async () => {
    const store = createTestStore()
    // 预置一个同名账号
    store.set(accountsAtom, [
      { id: 'existing-id', username: 'testuser', email: 'testuser@duck.com', access_token: 'tok' },
    ])

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

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
    // 不应调用 fetch
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sendOtp: API 返回错误时返回 false 并设置错误信息', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Upstream error' }),
    }))

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
    expect(screen.getByTestId('error').textContent).toContain('Upstream error')
  })

  it('sendOtp: RC 挑战错误时设置引导用户切换 Token 登录的提示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rc', message: 'rc' }),
    }))

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="testuser" action="sendOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('error').textContent).toContain('security check')
  })

  it('verifyOtp: 成功验证 OTP 时创建账号、写入 store、返回 true', async () => {
    vi.stubGlobal('fetch', vi.fn()
      // 第一阶段：验证 OTP → 返回临时 token
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'final_abc', username: 'otpuser', email: 'otpuser@duck.com' }),
      })
    )

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

  it('verifyOtp: API 失败时返回 false 并设置错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid or expired pass-phrase' }),
    }))

    const store = createTestStore()
    render(
      <Provider store={store}>
        <AuthTestHarness username="otpuser" otp="bad otp" action="verifyOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('status').textContent).toBe('error')
    // store 不应有账号
    expect(store.get(accountsAtom)).toHaveLength(0)
  })

  it('verifyOtp: 返回的用户名已存在时去重拒绝', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'tok', username: 'existing', email: 'existing@duck.com' }),
    }))

    const store = createTestStore()
    store.set(accountsAtom, [
      { id: 'existing-id', username: 'existing', email: 'existing@duck.com', access_token: 'tok' },
    ])

    render(
      <Provider store={store}>
        <AuthTestHarness username="existing" otp="any" action="verifyOtp" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(screen.getByTestId('error').textContent).toContain('already in your list')
    // store 不应新增
    expect(store.get(accountsAtom)).toHaveLength(1)
  })

  it('loginWithToken: 成功时创建账号、写入 store、返回 true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ address: 'my-private-alias' }),
    }))

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
    expect(accounts[0].nextAlias).toBe('my-private-alias')
  })

  it('loginWithToken: 重复账号时提前返回 false 且不调用 fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()
    store.set(accountsAtom, [
      { id: 'existing-id', username: 'tokenuser', email: 'tokenuser@duck.com', access_token: 'tok' },
    ])

    render(
      <Provider store={store}>
        <AuthTestHarness username="tokenuser" token="any" action="loginWithToken" />
      </Provider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('false')
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})