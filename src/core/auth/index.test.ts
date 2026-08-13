import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendOtp, verifyOtp, loginWithToken } from './index'

describe('sendOtp (core auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回 { success: true }', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'success' }),
    }))

    const result = await sendOtp('testuser', [])
    expect(result).toEqual({ success: true })
  })

  it('重复账号时直接返回 false，不调用 fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const existing = [{ id: '1', username: 'testuser', email: 'a@b.com', access_token: 't' }]
    const result = await sendOtp('testuser', existing)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('already in your list')
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('RC 挑战时返回引导提示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rc' }),
    }))

    const result = await sendOtp('testuser', [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('security check')
    }
  })

  it('API 错误时返回错误文案', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Upstream error' }),
    }))

    const result = await sendOtp('testuser', [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Upstream error')
    }
  })

  it('非法用户名时返回校验错误', async () => {
    const result = await sendOtp('invalid!', [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('letters and numbers')
    }
  })

  it('网络异常时返回错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await sendOtp('testuser', [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Network error')
    }
  })
})

describe('verifyOtp (core auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回账号信息', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'final_tok', username: 'otpuser', email: 'otpuser@duck.com', cohort: '2025' }),
    }))

    const result = await verifyOtp('otpuser', 'pass 123', [])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.account.access_token).toBe('final_tok')
      expect(result.account.username).toBe('otpuser')
      expect(result.account.email).toBe('otpuser@duck.com')
    }
  })

  it('API 失败时返回错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid or expired pass-phrase' }),
    }))

    const result = await verifyOtp('user', 'bad', [])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid or expired pass-phrase')
    }
  })

  it('返回的用户名已存在时去重拒绝', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'tok', username: 'existing' }),
    }))

    const existing = [{ id: '1', username: 'existing', email: 'e@d.com', access_token: 't' }]
    const result = await verifyOtp('existing', 'any', existing)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('already in your list')
    }
  })
})

describe('loginWithToken (core auth)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回账号信息及预生成别名', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ address: 'my-alias' }),
    }))

    const result = await loginWithToken('tokenuser', 'valid_token', [])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.account.username).toBe('tokenuser')
      expect(result.account.access_token).toBe('valid_token')
      expect(result.account.nextAlias).toBe('my-alias')
    }
  })

  it('API 失败时仍返回账号信息（别名留空）', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    }))

    const result = await loginWithToken('tokenuser', 'valid_token', [])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.account.nextAlias).toBe('')
    }
  })

  it('重复账号时直接返回 false', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const existing = [{ id: '1', username: 'tokenuser', email: 'a@b.com', access_token: 't' }]
    const result = await loginWithToken('tokenuser', 'any', existing)

    expect(result.success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})