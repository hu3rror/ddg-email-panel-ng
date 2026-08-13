import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountSwitcher } from './account-switcher'
import { addAccountHelper, activeAccountIdAtom } from '@/core/store/account'

const { mockPush, mockPathname } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockPathname: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}))

describe('AccountSwitcher Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockPush.mockClear()
    mockPathname.mockReturnValue('/account')
  })

  it('无账号时应渲染登录按钮而非下拉框', () => {
    const store = createStore()

    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )

    expect(screen.getByRole('link', { name: /Login/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('应当能够渲染多个账号下拉选项并支持按 UUID 切换当前激活账号', () => {
    const store = createStore()
    const acc1 = addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })
    const acc2 = addAccountHelper(store, {
      username: 'duck2',
      email: 'duck2@duck.com',
      access_token: 'tok2',
    })

    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue(acc2.id)

    fireEvent.change(select, { target: { value: acc1.id } })
    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)
  })

  it('在非 /email 页面切换账号时应跳转到该账号的 /email 界面', () => {
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
        <AccountSwitcher />
      </Provider>
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: acc1.id } })

    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)
    expect(mockPush).toHaveBeenCalledWith('/email')
  })

  it('已在 /email 页面切换账号时只更新活跃账号，不重复跳转', () => {
    mockPathname.mockReturnValue('/email')
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
        <AccountSwitcher />
      </Provider>
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: acc1.id } })

    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('选择 + Add Account 时应跳转到登录页', () => {
    const store = createStore()
    addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })

    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '__add__' } })

    expect(mockPush).toHaveBeenCalledWith('/login?next=/account')
  })

  it('有账号时应包含 + Add Account 选项', () => {
    const store = createStore()
    addAccountHelper(store, {
      username: 'duck1',
      email: 'duck1@duck.com',
      access_token: 'tok1',
    })

    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    const options = Array.from(select.options).map((o) => (o as HTMLOptionElement).value)
    expect(options).toContain('__add__')
    expect(screen.getByText('+ Add Account')).toBeInTheDocument()
  })
})