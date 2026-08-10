import Link from 'next/link'
import { getCommitSha } from '@/core/env'

export default function HomePage() {
  const commitSha = getCommitSha()

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">DDG Email Panel</h1>
        <p className="text-[var(--text-secondary)] max-w-md">
          Open source unofficial DuckDuckGo Email Protection panel, deployed natively on Vercel.
        </p>
        <Link
          href="/login"
          className="mt-4 px-6 py-2.5 bg-ddg-orange hover:bg-ddg-orange-hover text-white font-semibold rounded-btn text-sm transition-colors"
        >
          Login
        </Link>
        <div
          data-testid="version-info"
          className="mt-8 rounded-full border border-[var(--border-default)] px-4 py-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)]"
        >
          Version: {commitSha}
        </div>
      </div>
    </main>
  )
}