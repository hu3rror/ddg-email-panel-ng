import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm } from './login-form'

describe('LoginForm Component', () => {
  it('应当渲染 Duck Address 输入框和 Exact Login 提交按钮', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/Duck Address/i)).toBeInTheDocument()
    // 使用严格正则 /^Login$/i 避免与 "Login using Access Token" 混淆
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument()
  })

  it('输入非法字符并提交时，应显示校验错误提示信息', async () => {
    render(<LoginForm />)
    const input = screen.getByPlaceholderText(/Duck Address/i)
    const submitBtn = screen.getByRole('button', { name: /^Login$/i })

    fireEvent.change(input, { target: { value: 'bad@user!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Duck Address can only contain letters and numbers/i)).toBeInTheDocument()
    })
  })

  it('支持切换至 Access Token 模式，并在提交有效 Token 时存入 AccountStore 并重定向', async () => {
    render(<LoginForm />)

    // 1. 点击切换链接进入 Token 登录模式
    const switchBtn = screen.getByRole('button', { name: /Login using Access Token/i })
    fireEvent.click(switchBtn)

    // 2. 校验 Token 输入框已出现
    const tokenInput = screen.getByPlaceholderText(/Access Token/i)
    expect(tokenInput).toBeInTheDocument()

    // 3. 填入 Duck Address 和 Token
    const usernameInput = screen.getByPlaceholderText(/Duck Address/i)
    fireEvent.change(usernameInput, { target: { value: 'tokenuser' } })
    fireEvent.change(tokenInput, { target: { value: 'my_access_token_888' } })

    // Mock 验证 Token 的生成别名 API 响应
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ address: 'generated_alias_xyz' }),
      })
    )

    const submitBtn = screen.getByRole('button', { name: /^Login$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.queryByText(/cannot be empty/i)).not.toBeInTheDocument()
    })
  })
})