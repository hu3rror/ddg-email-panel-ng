import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HomePage from './page'

vi.mock('@/core/env', () => ({
  getCommitSha: () => 'a1b2c3d',
}))

const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

describe('HomePage Component (T-01 Vertical Slice)', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    localStorage.clear()
  })

  it('应当渲染 DDG Email Panel 标题', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DDG Email Panel')
  })

  it('应当在页面底部或版本区域正确展示传入的 Commit Short SHA', () => {
    render(<HomePage />)
    expect(screen.getByTestId('version-info')).toHaveTextContent('Version: a1b2c3d')
  })

  it('未登录（无账号）时渲染 Landing Page，不触发跳转', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DDG Email Panel')
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('已登录（有账号）时淡出后跳转到 /email', () => {
    vi.useFakeTimers()
    localStorage.setItem('ddg_accounts', JSON.stringify([{ id: '1', username: 'test' }]))
    render(<HomePage />)
    // 淡出动画期间尚未跳转
    expect(mockReplace).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(250) })
    expect(mockReplace).toHaveBeenCalledWith('/email')
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})