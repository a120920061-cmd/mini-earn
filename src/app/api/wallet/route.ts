import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const [transactions, withdrawals, completedCount] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.submission.count({
        where: { userId: user.id, status: 'completed' },
      }),
    ])

    return NextResponse.json({
      balance: user.balance,
      totalEarned: user.totalEarned,
      completedJobs: completedCount,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        account: w.account,
        status: w.status,
        note: w.note,
        createdAt: w.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
