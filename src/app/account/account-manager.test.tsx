import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountManager } from './account-manager'
import { addAccountHelper, accountsAtom } from '@/core/store/account'

describe('AccountManager Component', () => {
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
})