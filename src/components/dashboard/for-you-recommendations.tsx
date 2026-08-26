'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber } from '@/lib/api'
import type { JobItem } from '@/components/jobs/job-card'

type RecData = {
  recommendations: JobItem[]
  topCategories: string[]
}

export function ForYouRecommendations() {
  const { t, lang } = useT()
  const openJob = useAppStore((s) => s.openJob)
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [data, setData] = useState<RecData | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<RecData>('/api/jobs/recommendations')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ recommendations: [], topCategories: [] })
    })()
    return () => { alive = false }
  }, [refreshKey])

  if (!data) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="flex-1 h-20 rounded-lg" />)}
        </div>
      </Card>
    )
  }

  if (data.recommendations.length === 0) return null

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t('forYou')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('forYouDesc')}</p>
          </div>
        </div>
        {data.topCategories.length > 0 && (
          <div className="flex gap-1">
            {data.topCategories.slice(0, 2).map((c) => (
              <span key={c} className="text-[9px] capitalize bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {data.recommendations.map((job) => (
          <button
            key={job.id}
            onClick={() => openJob(job.id)}
            className="shrink-0 w-44 p-3 rounded-xl border bg-card text-left transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
          >
            <p className="font-semibold text-sm leading-tight line-clamp-1">{job.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8">{job.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-primary text-sm">{formatMoney(job.reward, t('taka'), lang)}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
