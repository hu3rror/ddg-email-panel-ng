import { DUCKDUCKGO_API_ENDPOINT, DUCKDUCKGO_API_USERAGENT } from '../constants'

// 与官方 DuckDuckGo 网页客户端 (https://duckduckgo.com/email) 对齐的请求头
export const fetchInit = {
  headers: {
    'User-Agent': DUCKDUCKGO_API_USERAGENT,
    'Accept': '*/*',
    'Origin': 'https://duckduckgo.com',
    'Referer': 'https://duckduckgo.com/',
  },
}

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString()
  return `${DUCKDUCKGO_API_ENDPOINT}${path}?${qs}`
}

// 用户名：官方使用不带 @duck.com 后缀的裸用户名作为 user 参数
export function extractUsername(username: string): string {
  return username.trim().replace(/@duck\.com$/i, '')
}

/**
 * 请求发送 OTP 邮件。
 * 官方客户端使用 GET /auth/loginlink?user=<username>
 * 注：若上游返回 { error: "rc" }（reCAPTCHA/challenge 需要），需携带 ca/cp 参数重试。
 */
export async function requestLoginLink(
  username: string,
  challenge?: { ca: string; cp: string }
): Promise<Response> {
  const user = extractUsername(username)
  const params: Record<string, string> = { user }
  if (challenge) {
    params.ca = challenge.ca
    params.cp = challenge.cp
  }
  const url = buildUrl('/auth/loginlink', params)
  return fetch(url, fetchInit)
}

export async function loginWithOtp(username: string, otp: string): Promise<Response> {
  const user = extractUsername(username)
  // 官方客户端中 OTP 内部的空格变成 + 且为字面量，不经过 URLSearchParams 编码
  const sanitizedOtp = otp.trim().replace(/\s+/g, '+')
  const url = `${DUCKDUCKGO_API_ENDPOINT}/auth/login?otp=${encodeURIComponent(sanitizedOtp).replace(/%2B/g, '+')}&user=${encodeURIComponent(user)}`
  return fetch(url, fetchInit)
}

export async function getDashboardInfo(token: string): Promise<Response> {
  const url = `${DUCKDUCKGO_API_ENDPOINT}/email/dashboard`
  return fetch(url, {
    ...fetchInit,
    headers: {
      ...fetchInit.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function generateAddresses(token: string): Promise<Response> {
  const url = `${DUCKDUCKGO_API_ENDPOINT}/email/addresses`
  return fetch(url, {
    ...fetchInit,
    method: 'POST',
    headers: {
      ...fetchInit.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}