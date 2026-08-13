import { NextResponse } from 'next/server'
import { verifyOtpSchema } from '@/core/schemas/auth'
import { loginWithOtpTwoStage } from '@/core/ddg/client'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = verifyOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const result = await loginWithOtpTwoStage(parsed.data.username, parsed.data.otp)
    if (!result.ok) {
      if (result.error.type === 'network_error') {
        return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 })
      }
      return NextResponse.json(
        { message: result.error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (err) {
    console.error('Error in /api/auth/login:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}