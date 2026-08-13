import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/core/ddg/client', () => ({
  requestLoginLink: vi.fn(),
}))

import { requestLoginLink } from '@/core/ddg/client'

describe('POST /api/auth/loginlink (Edge Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('成功时返回 200', async () => {
    vi.mocked(requestLoginLink).mockResolvedValue({
      ok: true,
      data: { message: 'success' },
    })

    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.message).toBe('success')
  })

  it('非法输入时返回 400', async () => {
    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user!' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('RC 挑战时返回 429 及挑战信息', async () => {
    vi.mocked(requestLoginLink).mockResolvedValue({
      ok: false,
      error: {
        type: 'rc_challenge',
        challenge: { ar: 3, cp: 'some-challenge-hash', flow: 'otploginlink' },
      },
    })

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
  })

  it('网络错误时返回 502', async () => {
    vi.mocked(requestLoginLink).mockResolvedValue({
      ok: false,
      error: { type: 'network_error', message: 'connect ECONNREFUSED' },
    })

    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('上游 api_error 时透传 status', async () => {
    vi.mocked(requestLoginLink).mockResolvedValue({
      ok: false,
      error: { type: 'api_error', status: 500, message: 'Upstream error' },
    })

    const req = new Request('http://localhost/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.message).toBe('Upstream error')
  })
})