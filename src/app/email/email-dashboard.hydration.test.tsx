import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, Provider } from 'jotai'
import { EmailDashboard } from './email-dashboard'
import { accountsAtom, activeAccountIdAtom, Account } from '@/core/store/account'

// Mock useHydrated so we can control hydration state
const mockUseHydrated = vi.fn()
vi.mock('@/core/hooks/use-hydrated', () => ({
  useHydrated: () => mockUseHydrated(),
}))

describe('EmailDashboard hydration-aware', () => {
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
    mockUseHydrated.mockReturnValue(true) // default: hydrated
    store = createStore()
    store.set(accountsAtom, [mockAccount])
    store.set(activeAccountIdAtom, mockAccount.id)
  })

  it('shows a skeleton when not hydrated yet', () => {
    mockUseHydrated.mockReturnValue(false)
    render(
      <Provider store={store}>
        <EmailDashboard />
      </Provider>
    )
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
    expect(screen.queryByText(/No active account found/i)).not.toBeInTheDocument()
  })

  it('shows empty state when hydrated but no active account', () => {
    const emptyStore = createStore()
    emptyStore.set(accountsAtom, [])
    render(
      <Provider store={emptyStore}>
        <EmailDashboard />
      </Provider>
    )
    expect(screen.getByText(/No active account found/i)).toBeInTheDocument()
  })
})