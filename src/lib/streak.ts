import { db } from '@/lib/db'
import { notify } from '@/lib/notify'

/** Returns the start of the day for a given date (local server time). */
function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Difference in whole days between two dates (b - a), ignoring time-of-day. */
function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}

export const STREAK_BONUS = 2 // flat bonus for keeping a streak alive

/**
 * Update a user's streak after they complete a job. Returns the new streak and
 * whether a streak bonus was awarded. Bonus is only given when the streak is a
 * multiple of 3 (3, 6, 9, ...) to keep it special but attainable.
 */
export async function updateStreak(userId: string): Promise<{ streak: number; bonus: number; milestone: boolean }> {
  const now = new Date()
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true, bestStreak: true, lastJobAt: true } })
  if (!user) return { streak: 0, bonus: 0, milestone: false }

  let newStreak = 1
  if (user.lastJobAt) {
    const diff = dayDiff(user.lastJobAt, now)
    if (diff === 0) {
      // already completed a job today — keep streak, no change
      newStreak = user.streak
    } else if (diff === 1) {
      // consecutive day — increment
      newStreak = user.streak + 1
    } else {
      // gap > 1 day — reset streak to 1
      newStreak = 1
    }
  }

  const newBest = Math.max(user.bestStreak, newStreak)
  const milestone = newStreak > 0 && newStreak % 3 === 0
  const bonus = milestone ? STREAK_BONUS : 0

  await db.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      bestStreak: newBest,
      lastJobAt: now,
      ...(bonus > 0
        ? {
            balance: { increment: bonus },
            totalEarned: { increment: bonus },
          }
        : {}),
    },
  })

  // bonus transaction + notification (non-blocking)
  if (bonus > 0) {
    try {
      await db.transaction.create({
        data: {
          userId,
          amount: bonus,
          type: 'adjustment',
          description: `Streak bonus (day ${newStreak})`,
        },
      })
    } catch {
      // ignore
    }
    await notify({
      userId,
      type: 'system',
      title: 'Streak Bonus!',
      body: `+৳${bonus.toFixed(2)} for a ${newStreak}-day streak! Keep it up 🔥`,
      link: 'dashboard',
    })
  }

  return { streak: newStreak, bonus, milestone }
}
