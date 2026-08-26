import { db } from '@/lib/db'

/**
 * Create a notification for a user. Silent — errors are swallowed so the
 * calling flow (job submission, withdrawal status change, etc.) is never
 * blocked by notification failures.
 */
export async function notify(opts: {
  userId: string
  type: string // earning | withdrawal | system | job
  title: string
  body: string
  link?: string | null
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: opts.userId,
        type: opts.type,
        title: String(opts.title).slice(0, 200),
        body: String(opts.body).slice(0, 500),
        link: opts.link ?? null,
      },
    })
  } catch {
    // never block the main flow on notification creation
  }
}
