import { getCommitSha } from '@/core/env'

export default function HomePage() {
  const commitSha = getCommitSha()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">DDG Email Panel</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Open source unofficial DuckDuckGo Email Protection panel, deployed natively on Vercel.
        </p>
        <div
          data-testid="version-info"
          className="mt-8 rounded-full border border-slate-200 dark:border-slate-800 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50"
        >
          Version: {commitSha}
        </div>
      </div>
    </main>
  )
}