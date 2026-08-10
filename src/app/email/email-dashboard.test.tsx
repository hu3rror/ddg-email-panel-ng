import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { EmailDashboard } from './email-dashboard'
import {
  accountsAtom,
  activeAccountIdAtom,
  Account,
  ALIAS_HISTORY_LIMIT,
} from '@/core/store/account'

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
    vi.unstubAllGlobals()
  })

  it('应当正确渲染主 Duck 地址与当前的私密 Duck 地址', () => {
    render(
      <Provider store={store}>
        <EmailDashboard />
      </Provider>
    )

    expect(screen.getByText('testduck@duck.com')).toBeInTheDocument()
    // 地址同时出现在顶部 Private Duck Address 和 collapsed 历史面板中
    const matches = screen.getAllByText('initial_alias@duck.com')
    expect(matches.length).toBeGreaterThanOrEqual(2)
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
      // 新地址同时出现在顶部 Private Duck Address 和 collapsed 历史面板中
      const matches = screen.getAllByText('brand_new_alias_888@duck.com')
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('别名历史面板 (Alias History Panel)', () => {
    it('无历史记录时不渲染历史面板', async () => {
      // 使用一个既无 nextAlias 也无 aliasHistory 的账户
      const noHistoryStore = createStore()
      noHistoryStore.set(accountsAtom, [{
        id: 'no-history',
        username: 'empty',
        email: 'empty@duck.com',
        access_token: 'tok',
      }])
      noHistoryStore.set(activeAccountIdAtom, 'no-history')

      render(
        <Provider store={noHistoryStore}>
          <EmailDashboard />
        </Provider>
      )

      await waitFor(() => {
        expect(
          screen.queryByText(/Recent Private Duck Addresses/)
        ).not.toBeInTheDocument()
      })
    })

    it('有历史记录时显示折叠面板标题（默认折叠）', async () => {
      // 预置 aliasHistory
      const storeWithHistory = createStore()
      storeWithHistory.set(accountsAtom, [
        {
          ...mockAccount,
          aliasHistory: [
            { address: 'alias-1', generatedAt: '2025-06-01T10:00:00Z' },
          ],
        },
      ])
      storeWithHistory.set(activeAccountIdAtom, mockAccount.id)

      render(
        <Provider store={storeWithHistory}>
          <EmailDashboard />
        </Provider>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/Recent Private Duck Addresses \(1\/10\)/)
        ).toBeInTheDocument()
      })
      // 默认折叠，地址在 DOM 中但被 overflow-hidden 裁剪
      expect(screen.getByText('alias-1@duck.com')).toBeInTheDocument()
    })

    it('点击折叠标题展开历史列表', async () => {
      const storeWithHistory = createStore()
      storeWithHistory.set(accountsAtom, [
        {
          ...mockAccount,
          aliasHistory: [
            { address: 'alias-1', generatedAt: '2025-06-01T10:00:00Z' },
          ],
        },
      ])
      storeWithHistory.set(activeAccountIdAtom, mockAccount.id)

      render(
        <Provider store={storeWithHistory}>
          <EmailDashboard />
        </Provider>
      )

      const toggle = await screen.findByText(/Recent Private Duck Addresses/)
      fireEvent.click(toggle)

      expect(screen.getByText('alias-1@duck.com')).toBeInTheDocument()
    })

    it('生成新地址后历史列表自动增加一条', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ address: 'spankin_new' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      render(
        <Provider store={store}>
          <EmailDashboard />
        </Provider>
      )

      // 先展开历史面板
      const toggle = await screen.findByText(/Recent Private Duck Addresses/)
      fireEvent.click(toggle)

      // 验证 fetch 未被调用过
      expect(fetchMock).not.toHaveBeenCalled()

      // 生成新地址
      const generateBtn = screen.getByRole('button', {
        name: /Generate Private Duck Address/i,
      })
      fireEvent.click(generateBtn)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
        // 新地址同时出现在顶部 Private Duck Address 和历史面板中
        const matches = screen.getAllByText('spankin_new@duck.com')
        expect(matches.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})