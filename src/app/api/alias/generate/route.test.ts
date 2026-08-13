import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/core/ddg/client', () => ({
  generateAddresses: vi.fn(),
}))

import { generateAddresses } from '@/core/ddg/client'

describe('POST /api/alias/generate (Edge Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('缺少 Authorization Header 时返回 401', async () => {
    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('成功时返回新别名', async () => {
    vi.mocked(generateAddresses).mockResolvedValue({
      ok: true,
      data: { address: 'new_duck_alias_123' },
    })

    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid_access_token_999' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.address).toBe('new_duck_alias_123')
  })

  it('上游错误时返回对应 status', async () => {
    vi.mocked(generateAddresses).mockResolvedValue({
      ok: false,
      error: { type: 'api_error', status: 401, message: 'Unauthorized' },
    })

    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
      headers: { Authorization: 'Bearer bad_token' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('Unauthorized')
  })

  it('网络错误时返回 502', async () => {
    vi.mocked(generateAddresses).mockResolvedValue({
      ok: false,
      error: { type: 'network_error', message: 'connect ECONNREFUSED' },
    })

    const req = new Request('http://localhost/api/alias/generate', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    })

    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})