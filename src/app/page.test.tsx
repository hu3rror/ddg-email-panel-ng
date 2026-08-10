import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HomePage from './page'

// Mock 环境变量解析模块
vi.mock('@/core/env', () => ({
  getCommitSha: () => 'a1b2c3d',
}))

describe('HomePage Component (T-01 Vertical Slice)', () => {
  it('应当渲染 DDG Email Panel 标题', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DDG Email Panel')
  })

  it('应当在页面底部或版本区域正确展示传入的 Commit Short SHA', () => {
    render(<HomePage />)
    expect(screen.getByTestId('version-info')).toHaveTextContent('Version: a1b2c3d')
  })
})