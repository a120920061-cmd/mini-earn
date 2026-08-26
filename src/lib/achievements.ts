import { db } from '@/lib/db'

export type Badge = {
  id: string
  title: string
  description: string
  icon: string // emoji or lucide name key
  color: string // tailwind gradient
  unlocked: boolean
  progress?: { current: number; target: number }
}

/** Compute achievement badges for a user based on their stats. */
export async function computeBadges(userId: string): Promise<Badge[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      totalEarned: true,
      streak: true,
      bestStreak: true,
      createdAt: true,
    },
  })
  if (!user) return []

  const completedCount = await db.submission.count({
    where: { userId, status: 'completed' },
  })

  const earned = Number(user.totalEarned)
  const streak = user.streak
  const best = user.bestStreak
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / 86400000
  )

  const badges: Badge[] = [
    {
      id: 'first-job',
      title: 'First Steps',
      description: 'Complete your first job',
      icon: '🎯',
      color: 'from-sky-400 to-sky-600',
      unlocked: completedCount >= 1,
      progress: { current: Math.min(completedCount, 1), target: 1 },
    },
    {
      id: 'five-jobs',
      title: 'Getting Busy',
      description: 'Complete 5 jobs',
      icon: '⚡',
      color: 'from-amber-400 to-orange-500',
      unlocked: completedCount >= 5,
      progress: { current: Math.min(completedCount, 5), target: 5 },
    },
    {
      id: 'ten-jobs',
      title: 'Job Master',
      description: 'Complete 10 jobs',
      icon: '🏆',
      color: 'from-purple-400 to-purple-600',
      unlocked: completedCount >= 10,
      progress: { current: Math.min(completedCount, 10), target: 10 },
    },
    {
      id: 'earn-10',
      title: 'First Taka',
      description: 'Earn ৳10 total',
      icon: '💵',
      color: 'from-emerald-400 to-emerald-600',
      unlocked: earned >= 10,
      progress: { current: Math.min(Math.round(earned * 10) / 10, 10), target: 10 },
    },
    {
      id: 'earn-50',
      title: 'Earner',
      description: 'Earn ৳50 total',
      icon: '💎',
      color: 'from-cyan-400 to-blue-500',
      unlocked: earned >= 50,
      progress: { current: Math.min(Math.round(earned * 10) / 10, 50), target: 50 },
    },
    {
      id: 'earn-100',
      title: 'Big Earner',
      description: 'Earn ৳100 total',
      icon: '👑',
      color: 'from-yellow-400 to-amber-500',
      unlocked: earned >= 100,
      progress: { current: Math.min(Math.round(earned * 10) / 10, 100), target: 100 },
    },
    {
      id: 'streak-3',
      title: 'On Fire',
      description: 'Reach a 3-day streak',
      icon: '🔥',
      color: 'from-orange-400 to-red-500',
      unlocked: best >= 3,
      progress: { current: Math.min(best, 3), target: 3 },
    },
    {
      id: 'streak-7',
      title: 'Unstoppable',
      description: 'Reach a 7-day streak',
      icon: '🚀',
      color: 'from-pink-400 to-rose-600',
      unlocked: best >= 7,
      progress: { current: Math.min(best, 7), target: 7 },
    },
    {
      id: 'loyal-member',
      title: 'Loyal Member',
      description: 'Be active for 7 days',
      icon: '⭐',
      color: 'from-indigo-400 to-violet-600',
      unlocked: accountAgeDays >= 7,
      progress: { current: Math.min(accountAgeDays, 7), target: 7 },
    },
  ]

  return badges
}
