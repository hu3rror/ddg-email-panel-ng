import { describe, it, expect } from 'vitest'
import { ddgErrorToResponse } from './error-response'
import type { DdgError } from './client'

describe('ddgErrorToResponse', () => {
  it('network_error → 502', async () => {
    const err: DdgError = { type: 'network_error', message: 'connect ECONNREFUSED' }
    const res = ddgErrorToResponse(err)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body).toEqual({ message: 'Upstream unavailable' })
  })

  it('api_error → 透传 status', async () => {
    const err: DdgError = { type: 'api_error', status: 429, message: 'Rate limited' }
    const res = ddgErrorToResponse(err)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body).toEqual({ message: 'Rate limited' })
  })

  it('api_error → 通过 apiErrorStatus 覆盖 status', async () => {
    const err: DdgError = { type: 'api_error', status: 500, message: 'Invalid or expired pass-phrase' }
    const res = ddgErrorToResponse(err, { apiErrorStatus: 401 })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ message: 'Invalid or expired pass-phrase' })
  })

  it('rc_challenge → 默认 401', async () => {
    const err: DdgError = {
      type: 'rc_challenge',
      challenge: { ar: 3, cp: 'hash', flow: 'otploginlink' },
    }
    const res = ddgErrorToResponse(err)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ message: 'Authentication failed' })
  })

  it('rc_challenge → 自定义 body 和 status', async () => {
    const err: DdgError = {
      type: 'rc_challenge',
      challenge: { ar: 3, cp: 'hash', flow: 'otploginlink' },
    }
    const res = ddgErrorToResponse(err, {
      rcChallenge: {
        status: 429,
        body: {
          message: 'A security challenge is required.',
          error: 'rc',
          retryable: true,
          challenge: { ar: 3, cp: 'hash', flow: 'otploginlink' },
        },
      },
    })
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body).toEqual({
      message: 'A security challenge is required.',
      error: 'rc',
      retryable: true,
      challenge: { ar: 3, cp: 'hash', flow: 'otploginlink' },
    })
  })

  it('parse_error → 500', async () => {
    const err: DdgError = { type: 'parse_error', message: 'Failed to parse response' }
    const res = ddgErrorToResponse(err)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ message: 'Failed to parse response' })
  })
})