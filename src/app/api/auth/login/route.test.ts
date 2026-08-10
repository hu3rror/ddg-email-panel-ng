import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

describe('POST /api/auth/login (OTP 两阶段认证 Edge Route)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('正确执行两阶段校验：验证 OTP 获取 Session Token，再调用 Dashboard 获取 Access Token', async () => {
    const mockFetch = vi
      .fn()
      // 第一阶段：/auth/login
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', token: 'temp_otp_token' }),
      })
      // 第二阶段：/email/dashboard
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            access_token: 'final_access_token_999',
            username: 'duckuser',
            email: 'user@example.com',
          },
        }),
      })

    vi.stubGlobal('fetch', mockFetch)

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

    // 验证 OTP 被转换为 + 号发往 DDG 上游
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('otp=pass%2B123'),
      expect.anything()
    )
  })
})