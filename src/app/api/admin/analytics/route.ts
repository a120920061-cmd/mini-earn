import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — admin analytics: 14-day earnings trend + category distribution
export async function GET() {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const start = new Date()
    start.setDate(start.getDate() - 13)
    start.setHours(0, 0, 0, 0)

    // earnings per day for last 14 days
    const earnings = await db.transaction.findMany({
      where: { type: 'earning', createdAt: { gte: start } },
      select: { amount: true, createdAt: true },
    })

    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const days: { date: string; label: string; amount: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, label: dayNames[d.getDay()], amount: 0 })
    }
    for (const tx of earnings) {
      const key = tx.createdAt.toISOString().slice(0, 10)
      const bucket = days.find((d) => d.date === key)
      if (bucket) bucket.amount += Number(tx.amount)
    }
    const maxDay = Math.max(...days.map((d) => d.amount), 1)
    const totalEarned14 = days.reduce((s, d) => s + d.amount, 0)

    // category distribution (submission counts per category)
    const submissions = await db.submission.findMany({
      where: { status: 'completed' },
      select: { jobId: true },
    })
    const jobIds = [...new Set(submissions.map((s) => s.jobId))]
    const jobs = await db.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, category: true },
    })
    const jobCatMap = new Map(jobs.map((j) => [j.id, j.category || 'general']))
    const catCounts: Record<string, number> = {}
    for (const s of submissions) {
      const cat = jobCatMap.get(s.jobId) || 'general'
      catCounts[cat] = (catCounts[cat] || 0) + 1
    }
    const categories = Object.entries(catCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
    const maxCat = Math.max(...categories.map((c) => c.count), 1)

    return NextResponse.json({
      earningsTrend: days,
      maxDay,
      totalEarned14,
      categories,
      maxCat,
      totalSubmissions: submissions.length,
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
