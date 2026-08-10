import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { EmailDashboard } from './email-dashboard'
import { accountsAtom, activeAccountIdAtom, Account } from '@/core/store/account'

describe('EmailDashboard Component', () => {
  let store: ReturnType<typeof createStore>
  const mockAccount: Account = {
    id: 'test-uuid-123',
    username: 'testduck',
    email: 'testduck@duck.com',
    access_token: 'mock_token',
    nextAlias: 'initial_alias',
  }

  beforeEach(() => {
    localStorage.clear()
    store = createStore()
    store.set(accountsAtom, [mockAccount])
    store.set(activeAccountIdAtom, mockAccount.id)
  })

  it('应当正确渲染主 Duck 地址与当前的私密 Duck 地址', () => {
    render(
      <Provider store={store}>
        <EmailDashboard />
      </Provider>
    )

    expect(screen.getByText('testduck@duck.com')).toBeInTheDocument()
    expect(screen.getByText('initial_alias@duck.com')).toBeInTheDocument()
  })

  it('无账号时显示空状态消息，不会自动重定向（防止 F5 刷新误跳）', () => {
    const emptyStore = createStore()
    emptyStore.set(accountsAtom, [])

    render(
      <Provider store={emptyStore}>
        <EmailDashboard />
      </Provider>
    )

    expect(screen.getByText(/No active account found/i)).toBeInTheDocument()
    // 不应出现 Login 按钮（意味着没有 redirect 到 /login 页面）
    expect(screen.queryByRole('button', { name: /^Login$/i })).not.toBeInTheDocument()
  })

  it('点击“Generate Private Duck Address”按钮时，应当调用 API 并在 UI 上同步更新新别名', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ address: 'brand_new_alias_888' }),
      })
    )

    render(
      <Provider store={store}>
        <EmailDashboard />
      </Provider>
    )

    const generateBtn = screen.getByRole('button', {
      name: /Generate Private Duck Address/i,
    })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText('brand_new_alias_888@duck.com')).toBeInTheDocument()
    })
  })
})