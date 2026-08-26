import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

type Activity = {
  id: string
  type: string // earning | withdrawal | adjustment
  title: string
  amount: number
  createdAt: string
}

// GET — recent activity feed for the dashboard (last 5 combined earnings + withdrawals)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const [txs, withdrawals] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, amount: true, description: true, createdAt: true },
      }),
      db.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, amount: true, method: true, status: true, createdAt: true },
      }),
    ])

    const activities: Activity[] = [
      ...txs.map((t) => ({
        id: t.id,
        type: t.type,
        title: t.description,
        amount: Number(t.amount),
        createdAt: t.createdAt.toISOString(),
      })),
      ...withdrawals.map((w) => ({
        id: w.id,
        type: 'withdrawal_req',
        title: `${w.method} withdrawal`,
        amount: Number(w.amount),
        createdAt: w.createdAt.toISOString(),
      })),
    ]

    activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return NextResponse.json({ activities: activities.slice(0, 6) })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
