import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  requestLoginLink,
  loginWithOtpTwoStage,
  generateAddresses,
} from './client'

function mockFetchOnce(data: unknown, status = 200, ok?: boolean) {
  return vi.fn().mockResolvedValueOnce({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  })
}

describe('requestLoginLink', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回 { ok: true, data: { message } }', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ message: 'success' }))

    const result = await requestLoginLink('testuser')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.message).toBe('success')
    }
  })

  it('以裸用户名构建 URL，移除 @duck.com 后缀', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'success' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await requestLoginLink('testuser@duck.com')
    const callUrl = fetchMock.mock.calls[0][0] as string
    expect(callUrl).toContain('user=testuser')
    expect(callUrl).not.toContain('user=testuser%40duck.com')
  })

  it('RC 挑战时返回 rc_challenge variant', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce(
        { error: 'rc', c: { ar: 3, cp: 'some-hash', flow: 'otploginlink', error: false } },
        200,
        true // DDG 返回 200 + { error: "rc" }
      )
    )

    const result = await requestLoginLink('testuser')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('rc_challenge')
      if (result.error.type === 'rc_challenge') {
        expect(result.error.challenge.ar).toBe(3)
        expect(result.error.challenge.cp).toBe('some-hash')
      }
    }
  })

  it('携带 challenge 参数时追加 ca/cp 到 URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'success' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await requestLoginLink('testuser', { ca: 'challenge_a', cp: 'challenge_p' })
    const callUrl = fetchMock.mock.calls[0][0] as string
    expect(callUrl).toContain('ca=challenge_a')
    expect(callUrl).toContain('cp=challenge_p')
  })

  it('网络错误时返回 network_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')))

    const result = await requestLoginLink('testuser')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('network_error')
    }
  })

  it('上游返回非 2xx 时返回 api_error', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ message: 'Rate limited' }, 429, false))

    const result = await requestLoginLink('testuser')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('api_error')
      if (result.error.type === 'api_error') {
        expect(result.error.status).toBe(429)
        expect(result.error.message).toContain('Rate limited')
      }
    }
  })

  it('解析失败时返回 parse_error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid json')
        },
      })
    )

    const result = await requestLoginLink('testuser')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('parse_error')
    }
  })
})

describe('loginWithOtpTwoStage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('两阶段成功时返回 DdgAccountInfo', async () => {
    // 第一阶段：login → 临时 token
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'temp_token_123' }),
        text: async () => JSON.stringify({ token: 'temp_token_123' }),
      })
      // 第二阶段：dashboard → 用户信息
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: { access_token: 'final_token', username: 'otpuser', cohort: '2025' },
        }),
        text: async () =>
          JSON.stringify({
            user: { access_token: 'final_token', username: 'otpuser', cohort: '2025' },
          }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const result = await loginWithOtpTwoStage('otpuser', 'pass 123')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.access_token).toBe('final_token')
      expect(result.data.username).toBe('otpuser')
      expect(result.data.email).toBe('otpuser@duck.com')
      expect(result.data.cohort).toBe('2025')
    }
  })

  it('OTP 内部空格替换为 + 号', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'tok' }),
      text: async () => JSON.stringify({ token: 'tok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await loginWithOtpTwoStage('user', 'abc 123 xyz')
    const callUrl = fetchMock.mock.calls[0][0] as string
    expect(callUrl).toContain('otp=abc+123+xyz')
  })

  it('第一阶段失败时返回友好错误信息', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      })
    )

    const result = await loginWithOtpTwoStage('user', 'bad')
    expect(result.ok).toBe(false)
    if (!result.ok && result.error.type === 'api_error') {
      expect(result.error.message).toBe('Invalid or expired pass-phrase')
    }
  })

  it('第二阶段失败时透传错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ token: 'temp_token' }),
          text: async () => JSON.stringify({ token: 'temp_token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Dashboard unavailable' }),
          text: async () => JSON.stringify({ message: 'Dashboard unavailable' }),
        })
    )

    const result = await loginWithOtpTwoStage('user', 'valid')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.type).toBe('api_error')
    }
  })

  it('临时 token 缺失时返回 parse_error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ no_token_here: true }),
        text: async () => JSON.stringify({ no_token_here: true }),
      })
    )

    const result = await loginWithOtpTwoStage('user', 'valid')
    expect(result.ok).toBe(false)
    if (!result.ok && result.error.type === 'parse_error') {
      expect(result.error.message).toBe('Token exchange failed')
    }
  })

  it('email 始终返回 Duck Address，而非 dashboard 的真实转发邮箱', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ token: 'tok' }),
          text: async () => JSON.stringify({ token: 'tok' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            user: { access_token: 'final', username: 'duckuser', email: 'real@gmail.com' },
          }),
          text: async () =>
            JSON.stringify({
              user: { access_token: 'final', username: 'duckuser', email: 'real@gmail.com' },
            }),
        })
    )

    const result = await loginWithOtpTwoStage('duckuser', 'pass 123')
    expect(result.ok).toBe(true)
    if (result.ok) {
      // email 应展示 Duck Address，而非上游 dashboard 返回的真实转发邮箱
      expect(result.data.email).toBe('duckuser@duck.com')
      expect(result.data.email).not.toBe('real@gmail.com')
    }
  })
})

describe('generateAddresses', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回地址', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ address: 'new_alias_123' }),
        text: async () => JSON.stringify({ address: 'new_alias_123' }),
      })
    )

    const result = await generateAddresses('valid_token')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.address).toBe('new_alias_123')
    }
  })

  it('失败时返回 api_error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      })
    )

    const result = await generateAddresses('bad_token')
    expect(result.ok).toBe(false)
    if (!result.ok && result.error.type === 'api_error') {
      expect(result.error.status).toBe(401)
    }
  })
})