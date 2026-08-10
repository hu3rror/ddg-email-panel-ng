import { describe, it, expect } from 'vitest'
import { requestOtpSchema } from './auth'

describe('requestOtpSchema (Zod 校验)', () => {
  it('在用户名包含合法字母数字时校验通过', () => {
    const result = requestOtpSchema.safeParse({ username: 'duckuser123' })
    expect(result.success).toBe(true)
  })

  it('在用户名为空时校验失败', () => {
    const result = requestOtpSchema.safeParse({ username: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Duck Address cannot be empty')
    }
  })

  it('在用户名包含特殊字符或空格时校验失败', () => {
    const result = requestOtpSchema.safeParse({ username: 'duck_user@' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Duck Address can only contain letters and numbers')
    }
  })
})