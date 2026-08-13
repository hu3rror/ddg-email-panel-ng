import { requestOtpSchema, verifyOtpSchema, accessTokenLoginSchema } from '@/core/schemas/auth'
import { isDuplicate, type Account } from '@/core/store/account'

// ──────────────────────────────────────────────
// 类型
// ──────────────────────────────────────────────

export type AuthResult =
  | { success: true }
  | { success: false; error: string }

export type AuthWithAccountResult =
  | { success: true; account: Omit<Account, 'id'> }
  | { success: false; error: string }

// ──────────────────────────────────────────────
// 核心函数（纯逻辑，无 React 依赖）
// ──────────────────────────────────────────────

/**
 * 发送 OTP 邮件。
 * 流程：校验 → 去重 → 调 API。
 */
export async function sendOtp(
  username: string,
  existingAccounts: Account[]
): Promise<AuthResult> {
  // 校验
  const parsed = requestOtpSchema.safeParse({ username })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // 去重
  if (isDuplicate(existingAccounts, username)) {
    return { success: false, error: `Account ${username}@duck.com is already in your list.` }
  }

  // 调 API
  try {
    const res = await fetch('/api/auth/loginlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.error === 'rc') {
        return {
          success: false,
          error:
            'DuckDuckGo requires a security check to send OTP emails. ' +
            'Please try again later, or use the Access Token login below.',
        }
      }
      return { success: false, error: data.message || 'Failed to send OTP' }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error sending request'
    return { success: false, error: message }
  }
}

/**
 * 验证 OTP 并登录。
 * 流程：校验 → 调 API → 去重 → 返回账号信息。
 */
export async function verifyOtp(
  username: string,
  otp: string,
  existingAccounts: Account[]
): Promise<AuthWithAccountResult> {
  // 校验
  const parsed = verifyOtpSchema.safeParse({ username, otp })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // 调 API
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, otp }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: data.message || 'Verification failed' }
    }

    const userData = await res.json()

    // 去重（用户名来自上游响应）
    if (isDuplicate(existingAccounts, userData.username || username)) {
      return {
        success: false,
        error: `Account ${userData.email || (userData.username || username) + '@duck.com'} is already in your list.`,
      }
    }

    return {
      success: true,
      account: {
        username: userData.username || username,
        email: userData.email || `${userData.username || username}@duck.com`,
        access_token: userData.access_token,
        cohort: userData.cohort || '',
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error verifying OTP'
    return { success: false, error: message }
  }
}

/**
 * 使用 Access Token 登录。
 * 流程：校验 → 去重 → 调 API → 返回账号信息。
 */
export async function loginWithToken(
  username: string,
  token: string,
  existingAccounts: Account[]
): Promise<AuthWithAccountResult> {
  // 校验
  const parsed = accessTokenLoginSchema.safeParse({ username, token })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  // 去重
  if (isDuplicate(existingAccounts, username)) {
    return { success: false, error: `Account ${username}@duck.com is already in your list.` }
  }

  // 调 API
  try {
    const res = await fetch('/api/alias/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    let nextAlias = ''
    if (res.ok) {
      const aliasData = await res.json()
      nextAlias = aliasData.address || ''
    }

    return {
      success: true,
      account: {
        username,
        email: `${username}@duck.com`,
        access_token: token,
        nextAlias,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'The Access Token is invalid or expired'
    return { success: false, error: message }
  }
}