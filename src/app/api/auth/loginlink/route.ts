import { NextResponse } from 'next/server'
import { requestOtpSchema } from '@/core/schemas/auth'
import { requestLoginLink } from '@/core/ddg/client'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parseResult = requestOtpSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username } = parseResult.data
    const upstreamRes = await requestLoginLink(username)

    if (upstreamRes.ok) {
      return NextResponse.json({ message: 'success' }, { status: 200 })
    }

    // 尝试解析上游错误体，特别是 DDG 的 reCAPTCHA 挑战响应
    let upstreamError: Record<string, unknown> = {}
    try {
      upstreamError = (await upstreamRes.json()) as Record<string, unknown>
    } catch {
      // 忽略解析失败
    }

    // 处理 DDG 的 reCAPTCHA 挑战响应：{ error: "rc", c: { ar, cp, flow, error } }
    if (upstreamError.error === 'rc') {
      const challengeInfo = upstreamError.c as
        | { ar?: number; cp?: string; flow?: string; error?: boolean }
        | undefined

      return NextResponse.json(
        {
          message:
            'A security challenge is required to send the OTP. This is expected when the request originates from a server IP. ' +
            'Please try again later, or use Access Token login instead.',
          error: 'rc',
          retryable: true,
          challenge: challengeInfo
            ? {
                ar: challengeInfo.ar,
                cp: challengeInfo.cp,
                flow: challengeInfo.flow,
              }
            : undefined,
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: upstreamRes.statusText || 'Upstream Error' },
      { status: upstreamRes.status }
    )
  } catch (err) {
    console.error('Error in /api/auth/loginlink:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}