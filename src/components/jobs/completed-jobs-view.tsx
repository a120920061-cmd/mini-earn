'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Calendar, Coins } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber, formatDate, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'

type CompletedJob = {
  id: string
  reward: number
  proof: string | null
  completedAt: string
  job: {
    id: string
    title: string
    description: string
    category: string
    reward: number
  }
}

const categoryColor: Record<string, string> = {
  visit: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  social: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  media: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  download: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  survey: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  general: 'bg-primary/10 text-primary',
}

export function CompletedJobsView() {
  const { t, lang } = useT()
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [items, setItems] = useState<CompletedJob[] | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<{ completed: CompletedJob[] }>('/api/jobs/completed')
      if (!alive) return
      if (res.ok && res.data) setItems(res.data.completed)
      else setItems([])
    })()
    return () => { alive = false }
  }, [refreshKey])

  return (
    <div className="space-y-4 animate-view-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('completedHistory')}</h1>
        <p className="text-sm text-muted-foreground">
          {items ? `${formatNumber(items.length, lang)} ${t('completedJobs').toLowerCase()}` : ''}
        </p>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
            <CheckCircle2 className="size-8 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">{t('noCompletedJobs')}</p>
          <p className="text-sm text-muted-foreground">{t('startFirstJob')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cat = item.job.category || 'general'
            const color = categoryColor[cat] || categoryColor.general
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  {/* completed check */}
                  <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight line-clamp-1">{item.job.title}</h3>
                      <Badge variant="secondary" className={cn('text-[10px] capitalize shrink-0', color)}>{cat}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.job.description}</p>
                    <div className="flex items-center gap-3 mt-2.5 text-xs">
                      <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <Coins className="size-3.5" />
                        {t('earned')}: {formatMoney(item.reward, t('taka'), lang)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {timeAgo(item.completedAt, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
