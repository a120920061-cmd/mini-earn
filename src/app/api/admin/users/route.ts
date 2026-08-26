import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET users (admin only) — supports ?q=search
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''

    const users = await db.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { username: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        balance: true,
        totalEarned: true,
        enabled: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        balance: Number(u.balance),
        totalEarned: Number(u.totalEarned),
        createdAt: u.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
