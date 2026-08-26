import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { computeBadges } from '@/lib/achievements'

// GET — detailed stats for a single user (admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        balance: true,
        totalEarned: true,
        isAdmin: true,
        enabled: true,
        streak: true,
        bestStreak: true,
        lastJobAt: true,
        createdAt: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const [completedCount, withdrawals, recentTx, badges] = await Promise.all([
      db.submission.count({ where: { userId: id, status: 'completed' } }),
      db.withdrawal.count({ where: { userId: id } }),
      db.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
      }),
      computeBadges(id),
    ])

    return NextResponse.json({
      user: {
        ...user,
        balance: Number(user.balance),
        totalEarned: Number(user.totalEarned),
        lastJobAt: user.lastJobAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        completedJobs: completedCount,
        withdrawals: withdrawals,
        unlockedBadges: badges.filter((b) => b.unlocked).length,
        totalBadges: badges.length,
      },
      badges,
      recentTransactions: recentTx.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
