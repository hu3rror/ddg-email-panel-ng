import { NextResponse } from 'next/server'
import { requestOtpSchema } from '@/core/schemas/auth'
import { requestLoginLink } from '@/core/ddg/client'
import { ddgErrorToResponse } from '@/core/ddg/error-response'

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
      const err = result.error
      const challenge =
        err.type === 'rc_challenge'
          ? err.challenge
          : undefined
      return ddgErrorToResponse(err, {
        rcChallenge: {
          status: 429,
          body: {
            message:
              'A security challenge is required to send the OTP. This is expected when the request originates from a server IP. ' +
              'Please try again later, or use Access Token login instead.',
            error: 'rc',
            retryable: true,
            challenge,
          },
        },
      })
    }

    return NextResponse.json({ message: 'success' }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/auth/loginlink:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}