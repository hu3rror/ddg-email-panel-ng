import { DUCKDUCKGO_API_ENDPOINT, DUCKDUCKGO_API_USERAGENT } from '../constants'

// ──────────────────────────────────────────────
// 公共类型
// ──────────────────────────────────────────────

export type DdgError =
  | { type: 'network_error'; message: string }
  | { type: 'api_error'; status: number; message: string }
  | { type: 'rc_challenge'; challenge: { ar: number; cp: string; flow: string } }
  | { type: 'parse_error'; message: string }

export type DdgResult<T> = { ok: true; data: T } | { ok: false; error: DdgError }

export type DdgAccountInfo = {
  access_token: string
  username: string
  email: string
  cohort: string
}

// ──────────────────────────────────────────────
// 内部工具
// ──────────────────────────────────────────────

const fetchInit = {
  headers: {
    'User-Agent': DUCKDUCKGO_API_USERAGENT,
    Accept: '*/*',
    Origin: 'https://duckduckgo.com',
    Referer: 'https://duckduckgo.com/',
  },
}

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString()
  return `${DUCKDUCKGO_API_ENDPOINT}${path}?${qs}`
}

function extractUsername(username: string): string {
  return username.trim().replace(/@duck\.com$/i, '')
}

/**
 * 通用 fetch → JSON 包装器。
 * 处理 network_error、api_error、parse_error 三种变体。
 * 注意：不处理 rc_challenge（需要检查 200 响应体），由 requestLoginLink 自行处理。
 */
async function fetchJson<T>(
  http: typeof globalThis.fetch,
  url: string,
  init?: RequestInit
): Promise<DdgResult<T>> {
  try {
    const res = await http(url, init)
    let body: unknown
    try {
      body = await res.json()
    } catch {
      return { ok: false, error: { type: 'parse_error', message: 'Failed to parse response' } }
    }
    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: 'api_error',
          status: res.status,
          message: (body as Record<string, unknown>)?.message as string || res.statusText,
        },
      }
    }
    return { ok: true, data: body as T }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: { type: 'network_error', message } }
  }
}

// ──────────────────────────────────────────────
// 公共接口（3 个入口点）
// ──────────────────────────────────────────────

/**
 * 请求发送 OTP 邮件。
 * 官方客户端使用 GET /auth/loginlink?user=<username>
 * 注：若上游返回 { error: "rc" }（reCAPTCHA 挑战需要），返回 rc_challenge variant。
 * 调用方可携带 challenge 参数重试。
 */
export async function requestLoginLink(
  username: string,
  challenge?: { ca: string; cp: string }
): Promise<DdgResult<{ message: string }>> {
  const user = extractUsername(username)
  const params: Record<string, string> = { user }
  if (challenge) {
    params.ca = challenge.ca
    params.cp = challenge.cp
  }
  const url = buildUrl('/auth/loginlink', params)

  try {
    const res = await fetch(url, fetchInit)
    let body: unknown
    try {
      body = await res.json()
    } catch {
      return { ok: false, error: { type: 'parse_error', message: 'Failed to parse response' } }
    }

    // DDG 可能返回 200 + { error: "rc" }，必须检查 body
    const bodyObj = body as Record<string, unknown> | undefined
    if (bodyObj?.error === 'rc') {
      const c = bodyObj.c as { ar?: number; cp?: string; flow?: string } | undefined
      return {
        ok: false,
        error: {
          type: 'rc_challenge',
          challenge: { ar: c?.ar ?? 0, cp: c?.cp ?? '', flow: c?.flow ?? '' },
        },
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: 'api_error',
          status: res.status,
          message: (bodyObj?.message as string) || res.statusText,
        },
      }
    }

    return { ok: true, data: { message: (bodyObj?.message as string) || 'success' } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { ok: false, error: { type: 'network_error', message } }
  }
}

/**
 * 两阶段 OTP 登录：login → dashboard。
 * 隐藏了临时 token 交换和 dashboard 数据提取的编排细节。
 * email 始终返回 Duck Address（username@duck.com），而非上游 dashboard 的真实转发邮箱。
 */
export async function loginWithOtpTwoStage(
  username: string,
  otp: string
): Promise<DdgResult<DdgAccountInfo>> {
  const user = extractUsername(username)
  const sanitizedOtp = otp.trim().replace(/\s+/g, '+')
  const loginUrl = `${DUCKDUCKGO_API_ENDPOINT}/auth/login?otp=${encodeURIComponent(sanitizedOtp).replace(/%2B/g, '+')}&user=${encodeURIComponent(user)}`

  // 第一阶段：login → 临时 token
  const loginResult = await fetchJson<{ token?: string; access_token?: string }>(fetch, loginUrl, fetchInit)
  if (!loginResult.ok) {
    if (loginResult.error.type === 'api_error') {
      // 把上游的原始错误信息替换为对用户友好的文案
      return { ok: false, error: { ...loginResult.error, message: 'Invalid or expired pass-phrase' } }
    }
    return loginResult
  }

  const tempToken = loginResult.data.token || loginResult.data.access_token
  if (!tempToken) {
    return { ok: false, error: { type: 'parse_error', message: 'Token exchange failed' } }
  }

  // 第二阶段：dashboard → 完整账号信息
  interface DashboardResponse {
    user?: { access_token?: string; username?: string; cohort?: string }
    access_token?: string
    username?: string
    cohort?: string
  }

  const dashboardResult = await fetchJson<DashboardResponse>(
    fetch,
    `${DUCKDUCKGO_API_ENDPOINT}/email/dashboard`,
    {
      ...fetchInit,
      headers: {
        ...fetchInit.headers,
        Authorization: `Bearer ${tempToken}`,
      },
    }
  )
  if (!dashboardResult.ok) {
    return dashboardResult
  }

  const userData = dashboardResult.data.user || dashboardResult.data
  return {
    ok: true,
    data: {
      access_token: userData.access_token || tempToken,
      username: userData.username || username,
      email: `${userData.username || username}@duck.com`,
      cohort: userData.cohort || '',
    },
  }
}

/**
 * 生成新的 Private Duck Address。
 * 对应上游 POST /email/addresses。
 */
export async function generateAddresses(
  token: string
): Promise<DdgResult<{ address: string }>> {
  const url = `${DUCKDUCKGO_API_ENDPOINT}/email/addresses`
  return fetchJson(fetch, url, {
    ...fetchInit,
    method: 'POST',
    headers: {
      ...fetchInit.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}