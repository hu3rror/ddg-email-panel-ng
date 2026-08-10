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

import { verifyOtpSchema } from './auth'

describe('verifyOtpSchema (OTP 清洗与校验)', () => {
  it('应当自动将带有空格/换行的 OTP 清洗并替换为 + 号', () => {
    const result = verifyOtpSchema.safeParse({
      username: 'duckuser',
      otp: ' abc 123 xyz ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.otp).toBe('abc+123+xyz')
    }
  })

  it('在 OTP 为空时校验失败', () => {
    const result = verifyOtpSchema.safeParse({
      username: 'duckuser',
      otp: '   ',
    })
    expect(result.success).toBe(false)
  })
})

import { accessTokenLoginSchema } from './auth'

describe('accessTokenLoginSchema (Token 直连登录校验)', () => {
  it('在用户名和 Access Token 均为合法非空值时通过校验', () => {
    const result = accessTokenLoginSchema.safeParse({
      username: 'duckuser',
      token: '  valid_api_token_123  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.token).toBe('valid_api_token_123')
    }
  })

  it('在 Token 为空或全为空格时校验失败', () => {
    const result = accessTokenLoginSchema.safeParse({
      username: 'duckuser',
      token: '   ',
    })
    expect(result.success).toBe(false)
  })
})