import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCommitSha } from './env'

describe('getCommitSha', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('优先读取 VERCEL_GIT_COMMIT_SHA 环境变量并返回前 7 位 Short Hash', () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'abcdef1234567890'
    expect(getCommitSha()).toBe('abcdef1')
  })

  it('若 VERCEL_GIT_COMMIT_SHA 不存在，读取 NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA', () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = '9876543210fedcba'
    expect(getCommitSha()).toBe('9876543')
  })

  it('若任何 Commit 环境变量均不存在，则返回本地开发 Fallback 标识 "dev"', () => {
    delete process.env.VERCEL_GIT_COMMIT_SHA
    delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    expect(getCommitSha()).toBe('dev')
  })
})