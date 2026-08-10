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
    const upstreamRes = await generateAddresses(token)

    if (upstreamRes.ok) {
      const data = await upstreamRes.json()
      return NextResponse.json(data, { status: 200 })
    }

    return NextResponse.json(
      { message: upstreamRes.statusText || 'Failed to generate address' },
      { status: upstreamRes.status }
    )
  } catch (err) {
    console.error('Error in /api/alias/generate:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}