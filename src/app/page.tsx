'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCommitSha } from '@/core/env'
import { useMessages } from '@/i18n/use-messages'

export default function HomePage() {
  const router = useRouter()
  const { t } = useMessages()
  const commitSha = getCommitSha()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ddg_accounts')
      if (raw) {
        const accounts = JSON.parse(raw)
        if (Array.isArray(accounts) && accounts.length > 0) {
          // 先触发淡出动画，动画结束后再跳转，避免生硬的瞬时切换
          setFading(true)
          const timer = setTimeout(() => router.replace('/email'), 250)
          return () => clearTimeout(timer)
        }
      }
    } catch {}
  }, [router])

  return (
    <main
      className={`flex-1 flex flex-col items-center justify-center p-24 transition-opacity duration-300 ease-out ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex flex-col gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">{t('home.title')}</h1>
        <p className="text-[var(--text-secondary)] max-w-md">
          {t('home.description')}
        </p>
        <Link
          href="/login"
          className="mt-4 px-6 py-2.5 bg-ddg-orange hover:bg-ddg-orange-hover text-white font-semibold rounded-btn text-sm transition-colors"
        >
          {t('home.loginButton')}
        </Link>
        <div
          data-testid="version-info"
          className="mt-8 rounded-full border border-[var(--border-default)] px-4 py-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)]"
        >
          {t('home.version', { sha: commitSha })}
        </div>
      </div>
    </main>
  )
}