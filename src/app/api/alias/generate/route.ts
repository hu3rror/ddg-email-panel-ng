import { NextResponse } from 'next/server'
import { generateAddresses } from '@/core/ddg/client'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const result = await generateAddresses(token)

    if (!result.ok) {
      const err = result.error
      switch (err.type) {
        case 'network_error':
          return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 })
        case 'api_error':
          return NextResponse.json({ message: err.message }, { status: err.status })
        case 'rc_challenge':
          return NextResponse.json({ message: 'Authentication failed' }, { status: 401 })
        case 'parse_error':
          return NextResponse.json({ message: err.message }, { status: 500 })
      }
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (err) {
    console.error('Error in /api/alias/generate:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}