import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/core/ddg/client', () => ({
  loginWithOtpTwoStage: vi.fn(),
}))

import { loginWithOtpTwoStage } from '@/core/ddg/client'

describe('POST /api/auth/login (OTP 两阶段认证 Edge Route)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回 200 及账号信息', async () => {
    vi.mocked(loginWithOtpTwoStage).mockResolvedValue({
      ok: true,
      data: {
        access_token: 'final_access_token_999',
        username: 'duckuser',
        email: 'duckuser@duck.com',
        cohort: '2025',
      },
    })

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'duckuser', otp: 'pass 123' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.access_token).toBe('final_access_token_999')
    expect(data.username).toBe('duckuser')
    expect(data.email).toBe('duckuser@duck.com')
  })

  it('OTP 无效时返回 401', async () => {
    vi.mocked(loginWithOtpTwoStage).mockResolvedValue({
      ok: false,
      error: { type: 'api_error', status: 401, message: 'Invalid or expired pass-phrase' },
    })

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'duckuser', otp: 'bad' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('Invalid or expired pass-phrase')
  })

  it('网络错误时返回 502', async () => {
    vi.mocked(loginWithOtpTwoStage).mockResolvedValue({
      ok: false,
      error: { type: 'network_error', message: 'connect ECONNREFUSED' },
    })

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'duckuser', otp: 'pass 123' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})