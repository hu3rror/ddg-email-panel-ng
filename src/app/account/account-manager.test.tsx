import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountManager } from './account-manager'
import { addAccountHelper, accountsAtom, activeAccountIdAtom } from '@/core/store/account'

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('AccountManager Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
  })

  it('渲染已登录账号列表，点击注销按钮可精准移除 UUID 账号', () => {
    const store = createStore()
    addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })

    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )

    expect(screen.getByText('duck1@duck.com')).toBeInTheDocument()

    const removeBtn = screen.getByRole('button', { name: /^Log Out$/i })
    fireEvent.click(removeBtn)

    expect(store.get(accountsAtom)).toHaveLength(0)
  })

  it('点击邮箱按钮应切换活跃账号并跳转到 /email', () => {
    const store = createStore()
    const acc1 = addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })
    addAccountHelper(store, {
      username: 'duck2',
      email: 'duck2@duck.com',
      access_token: 'tok2',
    })

    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )

    // 当前活跃账号是 acc2（最后添加的），点击 acc1 的邮箱
    const emailBtn = screen.getByRole('button', { name: /Switch to duck1@duck\.com/i })
    fireEvent.click(emailBtn)

    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)
    expect(mockPush).toHaveBeenCalledWith('/email')
  })

  it('有账号时应显示 + Add Account 按钮', () => {
    const store = createStore()
    addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })

    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )

    expect(screen.getByRole('button', { name: /\+ Add Account/i })).toBeInTheDocument()
  })

  it('无账号时显示空状态消息，不会自动重定向（防止 F5 刷新误跳）', () => {
    const store = createStore()

    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )

    expect(screen.getByText(/No logged-in accounts/i)).toBeInTheDocument()
    // 不应出现 Login 按钮（意味着没有 redirect 到 /login 页面）
    expect(screen.queryByRole('button', { name: /^Login$/i })).not.toBeInTheDocument()
  })
})