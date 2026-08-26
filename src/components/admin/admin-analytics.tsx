'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Loader2, PieChart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

type DayPoint = { date: string; label: string; amount: number }
type CatCount = { category: string; count: number }
type Analytics = {
  earningsTrend: DayPoint[]
  maxDay: number
  totalEarned14: number
  categories: CatCount[]
  maxCat: number
  totalSubmissions: number
}

const catColors: Record<string, string> = {
  visit: 'bg-sky-500',
  social: 'bg-pink-500',
  media: 'bg-purple-500',
  download: 'bg-amber-500',
  survey: 'bg-teal-500',
  general: 'bg-primary',
}

export function AdminAnalytics() {
  const { t, lang } = useT()
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<Analytics>('/api/admin/analytics')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
    })()
    return () => { alive = false }
  }, [])

  if (!data) {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="flex items-end gap-1 h-32">
            {[...Array(14)].map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${20 + (i % 5) * 12}%` }} />
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* earnings trend (14 days) */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{t('weeklyEarnings')}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">14 {lang === 'bn' ? 'দিন' : 'days'}</p>
            </div>
          </div>
          <p className="font-bold text-primary">{formatMoney(data.totalEarned14, t('taka'), lang)}</p>
        </div>
        <div className="flex items-end gap-1 h-32">
          {data.earningsTrend.map((d, i) => {
            const pct = data.maxDay > 0 ? (d.amount / data.maxDay) * 100 : 0
            const isToday = i === data.earningsTrend.length - 1
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                  {d.amount > 0 && (
                    <span className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold bg-foreground text-background px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                      {formatMoney(d.amount, t('taka'), lang)}
                    </span>
                  )}
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-300',
                      isToday ? 'bg-primary' : d.amount > 0 ? 'bg-primary/50 group-hover:bg-primary/70' : 'bg-muted'
                    )}
                    style={{ height: `${Math.max(pct, d.amount > 0 ? 6 : 3)}%`, minHeight: '3px' }}
                  />
                </div>
                <span className={cn('text-[8px]', isToday ? 'text-primary font-bold' : 'text-muted-foreground')}>
                  {t(d.label as any) || d.label}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* category distribution */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 grid place-items-center">
            <PieChart className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t('category')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatNumber(data.totalSubmissions, lang)} {t('submissions').toLowerCase()}
            </p>
          </div>
        </div>
        {data.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('noSubmissions')}</p>
        ) : (
          <div className="space-y-2.5">
            {data.categories.map((c) => {
              const pct = data.maxCat > 0 ? (c.count / data.maxCat) * 100 : 0
              const color = catColors[c.category] || catColors.general
              return (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium">{c.category}</span>
                    <span className="text-muted-foreground">{formatNumber(c.count, lang)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
