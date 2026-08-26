'use client'

import { useMemo } from 'react'
import { Flame, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

/**
 * Streak card shown on the dashboard. Uses the streak/bestStreak/lastJobAt
 * fields from the current user (kept in sync by the dashboard/job-submit flow).
 */
export function StreakCard() {
  const { t, lang } = useT()
  const user = useAppStore((s) => s.user)

  const { streak, best, status } = useMemo(() => {
    const streak = user?.streak ?? 0
    const best = user?.bestStreak ?? 0
    const lastJobAt = user?.lastJobAt ? new Date(user.lastJobAt) : null
    const now = new Date()
    let status: 'active' | 'today' | 'broken' = 'broken'
    if (lastJobAt) {
      const dayStart = new Date(now)
      dayStart.setHours(0, 0, 0, 0)
      const lastDayStart = new Date(lastJobAt)
      lastDayStart.setHours(0, 0, 0, 0)
      const diffDays = Math.round((dayStart.getTime() - lastDayStart.getTime()) / 86400000)
      if (diffDays === 0) status = 'today' // already completed a job today
      else if (diffDays === 1) status = 'active' // streak alive, complete today to keep it
      else status = 'broken'
    }
    return { streak, best, status }
  }, [user?.streak, user?.bestStreak, user?.lastJobAt])

  const isHot = streak >= 3

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        isHot
          ? 'bg-gradient-to-br from-orange-500/15 to-red-500/10 border-orange-500/30'
          : 'bg-card'
      )}
    >
      {isHot && (
        <div className="absolute -right-4 -top-4 size-20 rounded-full bg-orange-500/10 animate-pulse" />
      )}
      <div className="relative flex items-center gap-3">
        {/* flame */}
        <div
          className={cn(
            'size-12 rounded-xl grid place-items-center shrink-0 transition-colors',
            isHot
              ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white animate-pulse'
              : streak > 0
              ? 'bg-orange-500/10 text-orange-500'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <Flame className={cn('size-6', isHot && 'drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none">{formatNumber(streak, lang)}</span>
            <span className="text-xs text-muted-foreground">{t('dayStreak')}</span>
          </div>
          <p className="text-xs font-medium mt-0.5">{t('dailyStreak')}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <TrendingUp className="size-3" />
            {t('bestStreak')}: <b>{formatNumber(best, lang)}</b>
          </p>
        </div>

        {/* status pill */}
        <div
          className={cn(
            'shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full',
            status === 'today' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            status === 'active' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            status === 'broken' && 'bg-muted text-muted-foreground'
          )}
        >
          {status === 'today' ? `✓ ${t('today')}` : status === 'active' ? t('today') : t('streakLost')}
        </div>
      </div>

      {/* progress dots (last 7 days target) */}
      {streak > 0 && (
        <div className="relative mt-3 flex items-center gap-1">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < streak
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-muted'
              )}
            />
          ))}
          <span className="text-[9px] text-muted-foreground ml-1 whitespace-nowrap">
            {formatNumber(streak, lang)}/7
          </span>
        </div>
      )}

      {/* hint */}
      {status !== 'today' && (
        <p className="relative text-[10px] text-muted-foreground mt-2">
          {t('completeJobToday')}
        </p>
      )}
    </div>
  )
}
