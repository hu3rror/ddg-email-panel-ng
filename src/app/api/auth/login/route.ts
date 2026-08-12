import { NextResponse } from 'next/server'
import { verifyOtpSchema } from '@/core/schemas/auth'
import { loginWithOtp, getDashboardInfo } from '@/core/ddg/client'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parseResult = verifyOtpSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username, otp } = parseResult.data

    // 第一阶段：使用 OTP 获取临时 Auth Token
    const loginRes = await loginWithOtp(username, otp)
    if (!loginRes.ok) {
      return NextResponse.json(
        { message: 'Invalid or expired pass-phrase' },
        { status: 401 }
      )
    }

    const loginData = await loginRes.json()
    const tempToken = loginData.token || loginData.access_token

    if (!tempToken) {
      return NextResponse.json({ message: 'Token exchange failed' }, { status: 400 })
    }

    // 第二阶段：使用临时 Token 请求 Dashboard 获取完整 Account 信息
    const dashboardRes = await getDashboardInfo(tempToken)
    if (!dashboardRes.ok) {
      return NextResponse.json(
        { message: 'Failed to retrieve account dashboard' },
        { status: dashboardRes.status }
      )
    }

    const dashboardData = await dashboardRes.json()
    const userData = dashboardData.user || dashboardData

    return NextResponse.json(
      {
        access_token: userData.access_token || tempToken,
        username: userData.username || username,
        // 注意：上游 dashboard 的 email 字段是真实转发邮箱，而非 Duck Address
        // 此处始终使用 Duck Address 作为展示用的 email
        email: `${userData.username || username}@duck.com`,
        cohort: userData.cohort || '',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in /api/auth/login:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}