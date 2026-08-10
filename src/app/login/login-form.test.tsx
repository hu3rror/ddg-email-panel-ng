import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm } from './login-form'

describe('LoginForm Component', () => {
  it('应当渲染 Duck Address 输入框和 Login 提交按钮', () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/Duck Address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
  })

  it('输入非法字符并提交时，应显示校验错误提示信息', async () => {
    render(<LoginForm />)
    const input = screen.getByPlaceholderText(/Duck Address/i)
    const submitBtn = screen.getByRole('button', { name: /Login/i })

    fireEvent.change(input, { target: { value: 'bad@user!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Duck Address can only contain letters and numbers/i)).toBeInTheDocument()
    })
  })
})