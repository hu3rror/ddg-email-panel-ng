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

/**
 * 辅助方法：向 Store 中添加账号，自动分配唯一 UUID
 */
export function addAccountHelper(
  store: ReturnType<typeof createStore>,
  accountData: Omit<Account, 'id'>
): Account {
  const newAccount: Account = {
    ...accountData,
    id: crypto.randomUUID(),
  }

  const currentAccounts = store.get(accountsAtom)
  store.set(accountsAtom, [...currentAccounts, newAccount])
  store.set(activeAccountIdAtom, newAccount.id)

  return newAccount
}