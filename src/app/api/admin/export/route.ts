import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — export data as CSV
// ?type=users|submissions|withdrawals
export async function GET(req: Request) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'users'

    let headers: string[]
    let rows: string[][]

    if (type === 'users') {
      const users = await db.user.findMany({
        where: { isAdmin: false },
        orderBy: { createdAt: 'desc' },
        select: {
          name: true, username: true, email: true,
          balance: true, totalEarned: true, enabled: true,
          streak: true, bestStreak: true, createdAt: true,
        },
      })
      headers = ['Name', 'Username', 'Email', 'Balance', 'Total Earned', 'Status', 'Streak', 'Best Streak', 'Joined']
      rows = users.map((u) => [
        u.name, u.username, u.email,
        String(Number(u.balance)), String(Number(u.totalEarned)),
        u.enabled ? 'Active' : 'Disabled',
        String(u.streak), String(u.bestStreak),
        u.createdAt.toISOString(),
      ])
    } else if (type === 'submissions') {
      const subs = await db.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          job: { select: { title: true, category: true } },
          user: { select: { name: true, username: true, email: true } },
        },
      })
      headers = ['User', 'Username', 'Email', 'Job Title', 'Category', 'Status', 'Reward', 'Date']
      rows = subs.map((s) => [
        s.user.name, s.user.username, s.user.email,
        s.job.title, s.job.category, s.status,
        String(Number(s.reward)), s.createdAt.toISOString(),
      ])
    } else if (type === 'withdrawals') {
      const wds = await db.withdrawal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { user: { select: { name: true, username: true, email: true } } },
      })
      headers = ['User', 'Username', 'Email', 'Amount', 'Method', 'Account', 'Status', 'Date']
      rows = wds.map((w) => [
        w.user.name, w.user.username, w.user.email,
        String(Number(w.amount)), w.method, w.account, w.status,
        w.createdAt.toISOString(),
      ])
    } else {
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
    }

    // build CSV with proper escaping
    const escape = (s: string) => {
      const str = String(s ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')

    const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
