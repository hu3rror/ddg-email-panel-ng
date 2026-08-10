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