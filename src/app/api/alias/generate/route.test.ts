import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

describe('POST /api/alias/generate (Edge Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('缺少 Authorization Bearer Header 时，返回 401 Unauthorized', async () => {
    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('带有合法 Bearer Token 时，代理请求 DDG 上游 addresses 接口，返回新生成的别名', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ address: 'new_duck_alias_123' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid_access_token_999',
      },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.address).toBe('new_duck_alias_123')

    // 校验是否将 Bearer Token 透传给 DDG 上游
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('email/addresses'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid_access_token_999',
        }),
      })
    )
  })
})