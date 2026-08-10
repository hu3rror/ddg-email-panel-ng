import { DUCKDUCKGO_API_ENDPOINT, DUCKDUCKGO_API_USERAGENT } from '../constants'

const fetchInit = {
  headers: {
    'User-Agent': DUCKDUCKGO_API_USERAGENT,
  },
}

export async function requestLoginLink(username: string): Promise<Response> {
  const url = `${DUCKDUCKGO_API_ENDPOINT}/auth/loginlink?user=${encodeURIComponent(username)}`
  return fetch(url, fetchInit)
}

export async function loginWithOtp(username: string, otp: string): Promise<Response> {
  const sanitizedOtp = otp.trim().replace(/\s/g, '+')
  const url = `${DUCKDUCKGO_API_ENDPOINT}/auth/login?otp=${encodeURIComponent(sanitizedOtp)}&user=${encodeURIComponent(username)}`
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