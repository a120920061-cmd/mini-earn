import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, ensureSeed } from '@/lib/auth'

// GET — leaderboard of top earners
// ?period=week (default) | all
export async function GET(req: Request) {
  await ensureSeed()
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') === 'all' ? 'all' : 'week'

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    if (period === 'all') {
      // all-time: order users by totalEarned
      const top = await db.user.findMany({
        where: { isAdmin: false, enabled: true, totalEarned: { gt: 0 } },
        orderBy: { totalEarned: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          username: true,
          totalEarned: true,
        },
      })

      let myRank: { rank: number; totalEarned: number } | null = null
      if (user && !user.isAdmin) {
        const higher = await db.user.count({
          where: {
            isAdmin: false,
            enabled: true,
            totalEarned: { gt: user.totalEarned },
          },
        })
        myRank = { rank: higher + 1, totalEarned: user.totalEarned }
      }

      return NextResponse.json({
        period,
        top: top.map((u, i) => ({
          rank: i + 1,
          id: u.id,
          name: u.name,
          username: u.username,
          totalEarned: Number(u.totalEarned),
          isMe: user?.id === u.id,
        })),
        myRank,
      })
    }

    // weekly: aggregate earnings per user in the last 7 days
    const rows = await db.transaction.groupBy({
      by: ['userId'],
      where: {
        type: 'earning',
        createdAt: { gte: weekAgo },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    })

    const userIds = rows.map((r) => r.userId)
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, enabled: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u]))

    const top = rows
      .map((r, i) => {
        const u = userMap.get(r.userId)
        if (!u) return null
        return {
          rank: i + 1,
          id: u.id,
          name: u.name,
          username: u.username,
          totalEarned: Number(r._sum.amount || 0),
          isMe: user?.id === u.id,
        }
      })
      .filter(Boolean) as {
        rank: number
        id: string
        name: string
        username: string
        totalEarned: number
        isMe: boolean
      }[]

    // current user's weekly rank
    let myRank: { rank: number; totalEarned: number } | null = null
    if (user && !user.isAdmin) {
      const myRows = await db.transaction.groupBy({
        by: ['userId'],
        where: {
          type: 'earning',
          createdAt: { gte: weekAgo },
          userId: user.id,
        },
        _sum: { amount: true },
      })
      const myTotal = Number(myRows[0]?._sum.amount || 0)
      if (myTotal > 0) {
        // count users with more weekly earnings than me
        const allWeekRows = await db.transaction.groupBy({
          by: ['userId'],
          where: { type: 'earning', createdAt: { gte: weekAgo } },
          _sum: { amount: true },
        })
        const higher = allWeekRows.filter(
          (r) => Number(r._sum.amount || 0) > myTotal
        ).length
        myRank = { rank: higher + 1, totalEarned: myTotal }
      }
    }

    return NextResponse.json({ period, top, myRank })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
