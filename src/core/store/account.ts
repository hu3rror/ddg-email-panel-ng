import { atom, createStore } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface Account {
  id: string // UUID
  username: string
  email: string
  access_token: string
  cohort?: string
  nextAlias?: string
  remark?: string
}

export const accountsAtom = atomWithStorage<Account[]>('ddg_accounts', [])
export const activeAccountIdAtom = atomWithStorage<string | null>(
  'ddg_active_account_id',
  null
)

export const activeAccountAtom = atom((get) => {
  const accounts = get(accountsAtom)
  const activeId = get(activeAccountIdAtom)
  return accounts.find((a) => a.id === activeId) || accounts[0] || null
})

// ── 深层纯函数（不碰 store，hook 和测试共用） ──

/**
 * 追加一个账户并生成 UUID。不修改原数组。
 */
export function addAccount(
  accounts: Account[],
  data: Omit<Account, 'id'>
): { accounts: Account[]; account: Account } {
  const account: Account = {
    ...data,
    id: crypto.randomUUID(),
  }
  return { accounts: [...accounts, account], account }
}

/**
 * 按 id 移除账户。不修改原数组。
 */
export function removeAccount(accounts: Account[], id: string): Account[] {
  return accounts.filter((a) => a.id !== id)
}

/**
 * 更新指定账户的 nextAlias。不修改原数组。
 */
export function updateAlias(
  accounts: Account[],
  id: string,
  newAlias: string
): Account[] {
  return accounts.map((acc) =>
    acc.id === id ? { ...acc, nextAlias: newAlias } : acc
  )
}

/**
 * 大小写不敏感去重检查。
 */
export function isDuplicate(
  accounts: Account[],
  username: string
): boolean {
  return accounts.some(
    (a) => a.username.toLowerCase() === username.toLowerCase()
  )
}

// ── 原有 Helper 包装器（委托给纯函数，向后兼容） ──

export function addAccountHelper(
  store: ReturnType<typeof createStore>,
  accountData: Omit<Account, 'id'>
): Account {
  const { accounts, account } = addAccount(store.get(accountsAtom), accountData)
  store.set(accountsAtom, accounts)
  store.set(activeAccountIdAtom, account.id)
  return account
}

export function updateAccountAliasHelper(
  store: ReturnType<typeof createStore>,
  id: string,
  newAlias: string
): void {
  store.set(accountsAtom, updateAlias(store.get(accountsAtom), id, newAlias))
}

export function setActiveAccountHelper(
  store: ReturnType<typeof createStore>,
  id: string
): void {
  store.set(activeAccountIdAtom, id)
}

export function removeAccountHelper(
  store: ReturnType<typeof createStore>,
  id: string
): void {
  const currentAccounts = store.get(accountsAtom)
  const updated = removeAccount(currentAccounts, id)
  store.set(accountsAtom, updated)

  const activeId = store.get(activeAccountIdAtom)
  if (activeId === id) {
    store.set(activeAccountIdAtom, updated[0]?.id || null)
  }
}