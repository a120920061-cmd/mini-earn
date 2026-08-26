import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST — clone an existing job (admin only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const source = await db.job.findUnique({ where: { id } })
    if (!source) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const cloned = await db.job.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description,
        instructions: source.instructions,
        reward: source.reward,
        link: source.link,
        category: source.category,
        featured: false, // copies start non-featured so admin can promote
        enabled: false,  // copies start disabled so admin can review first
      },
    })

    return NextResponse.json({
      job: { ...cloned, reward: Number(cloned.reward) },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
