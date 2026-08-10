import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  accountsAtom,
  activeAccountIdAtom,
  addAccountHelper,
  updateAccountAliasHelper,
  setActiveAccountHelper,
  removeAccountHelper,
  addAccount,
  removeAccount,
  updateAlias,
  isDuplicate,
  addAliasHistoryEntry,
  backfillAliasHistory,
  ALIAS_HISTORY_LIMIT,
} from './account'

describe('AccountStore pure functions (深层纯函数)', () => {
  it('addAccount 追加账户并生成 UUID，且不修改原数组', () => {
    const existing: any[] = []
    const { accounts, account } = addAccount(existing, {
      username: 'testuser',
      email: 'user@example.com',
      access_token: 'token_123',
    })

    expect(existing).toHaveLength(0) // 原数组未被修改
    expect(accounts).toHaveLength(1)
    expect(accounts[0].username).toBe('testuser')
    expect(account.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
    expect(accounts[0].id).toBe(account.id)
  })

  it('removeAccount 按 id 移除且不修改原数组', () => {
    const a1 = { id: 'id-1', username: 'u1', email: 'a@b.com', access_token: 't1' }
    const a2 = { id: 'id-2', username: 'u2', email: 'c@d.com', access_token: 't2' }
    const input = [a1, a2]

    const result = removeAccount(input, 'id-1')

    expect(input).toHaveLength(2) // 原数组不变
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('id-2')
  })

  it('updateAlias 更新指定账户的 nextAlias 且不修改原数组', () => {
    const a1 = { id: 'id-1', username: 'u1', email: 'a@b.com', access_token: 't1', nextAlias: 'old' }
    const input = [a1]

    const result = updateAlias(input, 'id-1', 'new-alias')

    expect(input[0].nextAlias).toBe('old') // 原数组不变
    expect(result[0].nextAlias).toBe('new-alias')
  })

  it('isDuplicate 大小写不敏感检测用户名', () => {
    const accounts = [
      { id: '1', username: 'Alice', email: 'a@b.com', access_token: 't1' },
    ]

    expect(isDuplicate(accounts, 'alice')).toBe(true)
    expect(isDuplicate(accounts, 'ALICE')).toBe(true)
    expect(isDuplicate(accounts, 'Alice')).toBe(true)
    expect(isDuplicate(accounts, 'bob')).toBe(false)
  })

  it('addAliasHistoryEntry 追加新记录到最前，并同步更新 nextAlias', () => {
    const acc = {
      id: 'id-1',
      username: 'u1',
      email: 'a@b.com',
      access_token: 't1',
      nextAlias: 'old',
      aliasHistory: [
        { address: 'old', generatedAt: '2025-01-01T00:00:00Z' },
      ],
    }
    const input = [acc]

    const result = addAliasHistoryEntry(input, 'id-1', {
      address: 'new-alias',
      generatedAt: '2025-01-02T00:00:00Z',
    })

    // 原数组不被修改
    expect(input[0].aliasHistory).toHaveLength(1)
    expect(input[0].nextAlias).toBe('old')

    expect(result[0].nextAlias).toBe('new-alias')
    expect(result[0].aliasHistory).toHaveLength(2)
    expect(result[0].aliasHistory![0].address).toBe('new-alias')
    expect(result[0].aliasHistory![1].address).toBe('old')
  })

  it('addAliasHistoryEntry 超过上限时截断最旧记录', () => {
    const history = Array.from({ length: ALIAS_HISTORY_LIMIT }, (_, i) => ({
      address: `alias-${i}`,
      generatedAt: `2025-01-01T00:00:0${i}Z`,
    }))
    const acc = {
      id: 'id-1',
      username: 'u1',
      email: 'a@b.com',
      access_token: 't1',
      nextAlias: 'alias-0',
      aliasHistory: history,
    }

    const result = addAliasHistoryEntry([acc], 'id-1', {
      address: 'brand-new',
      generatedAt: '2025-02-01T00:00:00Z',
    })

    expect(result[0].aliasHistory).toHaveLength(ALIAS_HISTORY_LIMIT)
    expect(result[0].aliasHistory![0].address).toBe('brand-new')
    // 最末尾的 alias-9 被淘汰
    expect(
      result[0].aliasHistory!.some((e) => e.address === 'alias-9')
    ).toBe(false)
  })

  it('backfillAliasHistory 为有 nextAlias 但无历史的老账户回填一条', () => {
    const acc = {
      id: 'id-1',
      username: 'u1',
      email: 'a@b.com',
      access_token: 't1',
      nextAlias: 'legacy-alias',
    }
    const unaffected = {
      id: 'id-2',
      username: 'u2',
      email: 'c@d.com',
      access_token: 't2',
    }

    const result = backfillAliasHistory([acc, unaffected])

    expect(result[0].aliasHistory).toHaveLength(1)
    expect(result[0].aliasHistory![0].address).toBe('legacy-alias')
    expect(result[0].aliasHistory![0].generatedAt).toBeDefined()
    // 无 nextAlias 的不受影响
    expect(result[1].aliasHistory).toBeUndefined()
  })

  it('backfillAliasHistory 不覆盖已有历史，且不修改原数组', () => {
    const acc = {
      id: 'id-1',
      username: 'u1',
      email: 'a@b.com',
      access_token: 't1',
      nextAlias: 'new',
      aliasHistory: [{ address: 'old', generatedAt: '2025-01-01T00:00:00Z' }],
    }

    const result = backfillAliasHistory([acc])

    expect(acc.aliasHistory).toHaveLength(1) // 原数组不变
    expect(result[0].aliasHistory).toHaveLength(1)
    expect(result[0].aliasHistory![0].address).toBe('old')
  })
})

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

  it('addAliasHistory 通过 store 持久化并同步 nextAlias', () => {
    const account = addAccountHelper(store, {
      username: 'testuser',
      email: 'user@example.com',
      access_token: 'token_123',
    })

    store.set(
      accountsAtom,
      addAliasHistoryEntry(store.get(accountsAtom), account.id, {
        address: 'first',
        generatedAt: '2025-01-01T00:00:00Z',
      })
    )

    expect(store.get(accountsAtom)[0].nextAlias).toBe('first')
    expect(store.get(accountsAtom)[0].aliasHistory).toHaveLength(1)
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