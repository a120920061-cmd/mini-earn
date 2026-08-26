'use client'

import { useEffect, useState } from 'react'
import { Activity as ActivityIcon, Coins, ArrowDownToLine, Sliders, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/use-t'
import { useAppStore } from '@/store/use-app-store'
import { api, formatMoney, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'

type Activity = {
  id: string
  type: string
  title: string
  amount: number
  createdAt: string
}

const typeMeta: Record<string, { icon: typeof Coins; color: string }> = {
  earning: { icon: Coins, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  withdrawal: { icon: ArrowDownToLine, color: 'bg-destructive/10 text-destructive' },
  withdrawal_req: { icon: ArrowDownToLine, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  adjustment: { icon: Sliders, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
}

export function ActivityFeed() {
  const { t, lang } = useT()
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [activities, setActivities] = useState<Activity[] | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<{ activities: Activity[] }>('/api/dashboard/activity')
      if (!alive) return
      if (res.ok && res.data) setActivities(res.data.activities)
      else setActivities([])
    })()
    return () => { alive = false }
  }, [refreshKey])

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <ActivityIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{t('recentActivity')}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t('recentActivityDesc')}</p>
        </div>
      </div>

      {activities === null ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center">
          <div className="size-10 rounded-full bg-muted grid place-items-center mx-auto mb-2">
            <ActivityIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{t('noRecentActivity')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((a) => {
            const meta = typeMeta[a.type] || typeMeta.adjustment
            const Icon = meta.icon
            const positive = a.type === 'earning' || (a.amount > 0 && a.type !== 'withdrawal' && a.type !== 'withdrawal_req')
            return (
              <div key={a.id} className="flex items-center gap-2.5 py-1.5">
                <div className={cn('size-8 rounded-lg grid place-items-center shrink-0', meta.color)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt, lang)}</p>
                </div>
                <p className={cn(
                  'text-xs font-bold shrink-0',
                  positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                )}>
                  {positive ? '+' : '-'}{formatMoney(Math.abs(a.amount), t('taka'), lang)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
