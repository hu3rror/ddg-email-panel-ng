import { NextResponse } from 'next/server'
import { generateAddresses } from '@/core/ddg/client'
import { ddgErrorToResponse } from '@/core/ddg/error-response'

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
      return ddgErrorToResponse(result.error)
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (err) {
    console.error('Error in /api/alias/generate:', err)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}