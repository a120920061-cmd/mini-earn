import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET all withdrawals (admin) — optional ?status=pending|approved|rejected
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = status ? { status } : {}

    const withdrawals = await db.withdrawal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    })

    const totalAmount = await db.withdrawal.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
    })
    const pendingCount = await db.withdrawal.count({ where: { status: 'pending' } })

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        account: w.account,
        status: w.status,
        note: w.note,
        createdAt: w.createdAt.toISOString(),
        user: w.user,
      })),
      stats: {
        totalApproved: Number(totalAmount._sum.amount || 0),
        pendingCount,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
