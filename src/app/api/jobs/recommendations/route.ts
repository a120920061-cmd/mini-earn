import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — recommended jobs for the current user
// Based on the categories they've completed the most jobs in (excluding completed/favorited)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // find the user's top categories by completed-submission count
    const submissions = await db.submission.findMany({
      where: { userId: user.id, status: 'completed' },
      select: { jobId: true },
    })

    const jobIds = [...new Set(submissions.map((s) => s.jobId))]
    const jobs = await db.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, category: true },
    })
    const catMap = new Map(jobs.map((j) => [j.id, j.category || 'general']))

    // count completions per category
    const catCounts: Record<string, number> = {}
    for (const s of submissions) {
      const c = catMap.get(s.jobId) || 'general'
      catCounts[c] = (catCounts[c] || 0) + 1
    }

    // favorite categories (sorted by count)
    const favCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)

    // already-completed + favorited job ids (to exclude)
    const favs = await db.favorite.findMany({
      where: { userId: user.id },
      select: { jobId: true },
    })
    const excludeIds = new Set([...submissions.map((s) => s.jobId), ...favs.map((f) => f.jobId)])

    // find enabled jobs in favorite categories that the user hasn't completed/favorited
    let recommended: Array<{
      id: string
      title: string
      description: string
      reward: number
      link: string
      category: string
      featured: boolean
      enabled: boolean
      completed: boolean
      favorited: boolean
      createdAt: string
    }> = []

    if (favCats.length > 0) {
      const candidates = await db.job.findMany({
        where: {
          enabled: true,
          category: { in: favCats },
          id: { notIn: [...excludeIds] },
        },
        orderBy: [{ featured: 'desc' }, { reward: 'desc' }],
        take: 5,
      })
      recommended = candidates.map((j) => ({
        ...j,
        reward: Number(j.reward),
        completed: false,
        favorited: false,
        createdAt: j.createdAt.toISOString(),
      }))
    }

    // fallback: if no favorites yet, recommend top-reward enabled jobs the user hasn't completed
    if (recommended.length === 0) {
      const fallback = await db.job.findMany({
        where: {
          enabled: true,
          id: { notIn: [...excludeIds] },
        },
        orderBy: [{ featured: 'desc' }, { reward: 'desc' }],
        take: 3,
      })
      recommended = fallback.map((j) => ({
        ...j,
        reward: Number(j.reward),
        completed: false,
        favorited: false,
        createdAt: j.createdAt.toISOString(),
      }))
    }

    return NextResponse.json({
      recommendations: recommended,
      topCategories: favCats.slice(0, 3),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
