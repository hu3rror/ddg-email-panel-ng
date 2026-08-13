import { NextResponse } from 'next/server'
import type { DdgError } from './client'

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export interface DdgErrorToResponseOverrides {
  /** 覆盖 api_error 的 HTTP 状态码（默认：err.status） */
  apiErrorStatus?: number
  /** 自定义 rc_challenge 的响应体与状态码（默认：401 + { message }） */
  rcChallenge?: {
    status?: number
    body?: Record<string, unknown>
  }
}

// ──────────────────────────────────────────────
// 共享函数
// ──────────────────────────────────────────────

/**
 * 将 DdgError 转换为 NextResponse。
 * 统一处理 4 种错误变体的 HTTP 状态码与响应体。
 *
 * 默认映射：
 *   network_error → 502  { message: 'Upstream unavailable' }
 *   api_error     → err.status  { message: err.message }
 *   rc_challenge  → 401  { message: 'Authentication failed' }
 *   parse_error   → 500  { message: err.message }
 *
 * 通过 overrides 可定制：
 *   - apiErrorStatus: 覆盖 api_error 的状态码
 *   - rcChallenge: 覆盖 rc_challenge 的响应体与状态码
 */
export function ddgErrorToResponse(
  err: DdgError,
  overrides?: DdgErrorToResponseOverrides
): NextResponse {
  switch (err.type) {
    case 'network_error':
      return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 })

    case 'api_error': {
      const status = overrides?.apiErrorStatus ?? err.status
      return NextResponse.json({ message: err.message }, { status })
    }

    case 'rc_challenge': {
      const rc = overrides?.rcChallenge
      return NextResponse.json(
        rc?.body ?? { message: 'Authentication failed' },
        { status: rc?.status ?? 401 }
      )
    }

    case 'parse_error':
      return NextResponse.json({ message: err.message }, { status: 500 })
  }
}