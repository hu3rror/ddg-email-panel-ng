import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountSwitcher } from './account-switcher'
import { addAccountHelper, activeAccountIdAtom } from '@/core/store/account'

describe('AccountSwitcher Component', () => {
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
})