import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  
  const debug: any = {
    hasToken: !!token,
    tokenLength: token.length,
    tokenPreview: token.slice(0, 15) + '...',
    tokenFormat: token.includes(':') ? 'has colon' : 'NO COLON',
    bodyKeys: Object.keys(body),
  }

  // If initData present, show verification details
  if (body.initData) {
    try {
      const params = new URLSearchParams(body.initData)
      const hash = params.get('hash')
      params.delete('hash')
      
      const sortedKeys = Array.from(params.keys()).sort()
      const dataCheckString = sortedKeys.map(k => `${k}=${params.get(k)}`).join('\n')
      
      const secretKey = createHmac('sha256', 'WebAppData').update(token).digest()
      const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
      
      debug.initDataLength = body.initData.length
      debug.receivedHash = hash
      debug.computedHash = computedHash
      debug.hashMatch = hash === computedHash
      debug.dataCheckString = dataCheckString.slice(0, 200)
      debug.params = Object.fromEntries(params.entries())
    } catch(e: any) {
      debug.initDataError = e.message
    }
  }

  return NextResponse.json(debug)
}
