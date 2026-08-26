import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, ensureSeed } from '@/lib/auth'

// GET — last 7 days earnings breakdown for the dashboard chart
export async function GET() {
  await ensureSeed()
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)

    const txs = await db.transaction.findMany({
      where: {
        userId: user.id,
        type: 'earning',
        createdAt: { gte: start },
      },
      select: { amount: true, createdAt: true },
    })

    // build 7-day buckets
    const days: { date: string; label: string; amount: number }[] = []
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      days.push({
        date: key,
        label: dayNames[d.getDay()],
        amount: 0,
      })
    }
    for (const tx of txs) {
      const key = tx.createdAt.toISOString().slice(0, 10)
      const bucket = days.find((d) => d.date === key)
      if (bucket) bucket.amount += Number(tx.amount)
    }

    const total = days.reduce((s, d) => s + d.amount, 0)
    const max = Math.max(...days.map((d) => d.amount), 1)

    return NextResponse.json({ days, total, max })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
