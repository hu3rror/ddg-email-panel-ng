import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

describe('POST /api/auth/loginlink (Edge Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('使用 GET 代理至 DDG 上游 /auth/loginlink?user= 并返回 200', async () => {
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

    // 验证上游调用为 GET /auth/loginlink?user=validuser 而非 POST 或 email= 参数
    const callUrl = mockFetch.mock.calls[0][0] as string
    expect(callUrl).toContain('/auth/loginlink')
    expect(callUrl).toContain('user=validuser')
    expect(callUrl).not.toContain('email=')
    // 不应包含旧端点
    expect(callUrl).not.toContain('/auth/account/loginlink')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Origin': 'https://duckduckgo.com',
          'Referer': 'https://duckduckgo.com/',
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

  it('处理上游返回 { error: "rc" } 时返回 429 及挑战信息', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 200, // DDG 即使 rc 也返回 200
      json: async () => ({
        error: 'rc',
        c: {
          ar: 3,
          cp: 'some-challenge-hash',
          flow: 'otploginlink',
          error: false,
        },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)

    const data = await res.json()
    expect(data.error).toBe('rc')
    expect(data.challenge).toBeDefined()
    expect(data.challenge.ar).toBe(3)
    expect(data.challenge.cp).toBe('some-challenge-hash')
  })
})