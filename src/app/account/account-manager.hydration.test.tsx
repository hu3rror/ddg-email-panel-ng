import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { AccountManager } from './account-manager'
import { addAccountHelper, accountsAtom } from '@/core/store/account'

const mockUseHydrated = vi.fn()
vi.mock('@/core/hooks/use-hydrated', () => ({
  useHydrated: () => mockUseHydrated(),
}))

describe('AccountManager hydration-aware', () => {
  beforeEach(() => {
    localStorage.clear()
    mockUseHydrated.mockReturnValue(true)
  })

  it('shows a skeleton when not hydrated yet', () => {
    mockUseHydrated.mockReturnValue(false)
    const store = createStore()
    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )
    expect(screen.getByTestId('account-skeleton')).toBeInTheDocument()
    expect(screen.queryByText(/No logged-in accounts/i)).not.toBeInTheDocument()
  })

  it('shows empty state when hydrated but no accounts', () => {
    const store = createStore()
    render(
      <Provider store={store}>
        <AccountManager />
      </Provider>
    )
    expect(screen.getByText(/No logged-in accounts/i)).toBeInTheDocument()
  })
})