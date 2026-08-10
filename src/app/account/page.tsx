import { Nav } from '@/components/layout/nav'
import { AccountManager } from './account-manager'

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 flex items-center justify-center p-4">
        <AccountManager />
      </main>
    </div>
  )
}