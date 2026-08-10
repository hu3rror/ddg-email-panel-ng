import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

describe('POST /api/auth/loginlink (Edge Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('当请求合法时，注入特定 Android User-Agent 并代理至 DDG 上游，返回 200', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'success' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    // 关键校验：确保请求包含了 DuckDuckGo 的特定 User-Agent Header
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('auth/loginlink?user=validuser'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('DuckDuckGo'),
        }),
      })
    )
  })

  it('当输入非法用户名时，直接拒绝请求并返回 400 Bad Request', async () => {
    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user!' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})