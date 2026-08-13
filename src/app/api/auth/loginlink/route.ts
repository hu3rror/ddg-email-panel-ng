import { NextResponse } from 'next/server'
import { requestOtpSchema } from '@/core/schemas/auth'
import { requestLoginLink } from '@/core/ddg/client'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const result = await requestLoginLink(parsed.data.username)
    if (!result.ok) {
      if (result.error.type === 'rc_challenge') {
        return NextResponse.json(
          {
            message:
              'A security challenge is required to send the OTP. This is expected when the request originates from a server IP. ' +
              'Please try again later, or use Access Token login instead.',
            error: 'rc',
            retryable: true,
            challenge: result.error.challenge,
          },
          { status: 429 }
        )
      }
      if (result.error.type === 'network_error') {
        return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 })
      }
      return NextResponse.json(
        { message: result.error.message },
        { status: result.error.status }
      )
    }

    return NextResponse.json({ message: 'success' }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/auth/loginlink:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}