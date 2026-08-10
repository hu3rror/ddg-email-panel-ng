import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  accountsAtom,
  activeAccountIdAtom,
  addAccountHelper,
  updateAccountAliasHelper,
  setActiveAccountHelper,
  removeAccountHelper,
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

  it('应当能够按 UUID 准确切换当前激活的账户', () => {
    const acc1 = addAccountHelper(store, {
      username: 'user1',
      email: '1@duck.com',
      access_token: 'tok1',
    })
    const acc2 = addAccountHelper(store, {
      username: 'user2',
      email: '2@duck.com',
      access_token: 'tok2',
    })

    expect(store.get(activeAccountIdAtom)).toBe(acc2.id)

    setActiveAccountHelper(store, acc1.id)
    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)
  })

  it('应当能够按 UUID 精准删除目标账户，并在删除当前激活账户时自动退回备用账户或 null', () => {
    const acc1 = addAccountHelper(store, {
      username: 'user1',
      email: '1@duck.com',
      access_token: 'tok1',
    })
    const acc2 = addAccountHelper(store, {
      username: 'user2',
      email: '2@duck.com',
      access_token: 'tok2',
    })

    // 删除当前激活的 acc2
    removeAccountHelper(store, acc2.id)

    const accounts = store.get(accountsAtom)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].id).toBe(acc1.id)
    expect(store.get(activeAccountIdAtom)).toBe(acc1.id)

    // 删除最后一个账号
    removeAccountHelper(store, acc1.id)
    expect(store.get(accountsAtom)).toHaveLength(0)
    expect(store.get(activeAccountIdAtom)).toBeNull()
  })
})