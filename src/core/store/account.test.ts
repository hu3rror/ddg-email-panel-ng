import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  accountsAtom,
  activeAccountIdAtom,
  addAccountHelper,
  updateAccountAliasHelper,
} from './account'

describe('AccountStore (Jotai v2 持久化 Store)', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('新增账户时应当自动为其分配唯一的 UUID 主键', () => {
    const newAccount = addAccountHelper(store, {
      username: 'testuser',
      email: 'user@example.com',
      access_token: 'token_123',
    })

    expect(newAccount.id).toBeDefined()
    expect(newAccount.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )

    const accounts = store.get(accountsAtom)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].username).toBe('testuser')
    expect(store.get(activeAccountIdAtom)).toBe(newAccount.id)
  })

  it('应当能够精准更新指定 UUID 账户的 nextAlias 字段', () => {
    const account = addAccountHelper(store, {
      username: 'testuser',
      email: 'user@example.com',
      access_token: 'token_123',
      nextAlias: 'old_alias',
    })

    updateAccountAliasHelper(store, account.id, 'new_updated_alias')

    const accounts = store.get(accountsAtom)
    expect(accounts[0].nextAlias).toBe('new_updated_alias')
  })
})