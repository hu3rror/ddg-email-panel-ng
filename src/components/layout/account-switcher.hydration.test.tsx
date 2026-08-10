import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountSwitcher } from './account-switcher'
import { addAccountHelper } from '@/core/store/account'

const mockUseHydrated = vi.fn()
vi.mock('@/core/hooks/use-hydrated', () => ({
  useHydrated: () => mockUseHydrated(),
}))

describe('AccountSwitcher hydration-aware', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseHydrated.mockReturnValue(true)
  })

  it('shows a skeleton when not hydrated yet', () => {
    mockUseHydrated.mockReturnValue(false)
    const store = createStore()
    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )
    expect(screen.getByTestId('switcher-skeleton')).toBeInTheDocument()
  })

  it('shows login button when hydrated but no accounts', () => {
    const store = createStore()
    render(
      <Provider store={store}>
        <AccountSwitcher />
      </Provider>
    )
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument()
  })
})