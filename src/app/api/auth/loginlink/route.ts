import { NextResponse } from 'next/server'
import { requestOtpSchema } from '@/core/schemas/auth'
import { requestLoginLink } from '@/core/ddg/client'

// 指定为 Vercel Edge Runtime 极速响应
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

    return NextResponse.json(
      { message: upstreamRes.statusText || 'Upstream Error' },
      { status: upstreamRes.status }
    )
  } catch (err) {
    console.error('Error in /api/auth/loginlink:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}