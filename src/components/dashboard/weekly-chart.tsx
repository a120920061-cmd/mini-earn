'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber } from '@/lib/api'

type DayData = { date: string; label: string; amount: number }
type ChartData = { days: DayData[]; total: number; max: number }

export function WeeklyEarningsChart() {
  const { t, lang } = useT()
  const [data, setData] = useState<ChartData | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<ChartData>('/api/dashboard/chart')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ days: [], total: 0, max: 1 })
    })()
    return () => { alive = false }
  }, [])

  if (!data) {
    return (
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-end justify-between gap-1.5 h-24">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${30 + i * 8}%` }} />)}
        </div>
      </div>
    )
  }

  const hasData = data.total > 0
  const todayLabel = data.days[data.days.length - 1]?.label

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t('weeklyEarnings')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('last7Days')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary leading-none">{formatMoney(data.total, t('taka'), lang)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t('thisWeek')}</p>
        </div>
      </div>

      {/* bar chart */}
      <div className="flex items-end justify-between gap-1.5 h-24">
        {data.days.map((day, i) => {
          const pct = data.max > 0 ? (day.amount / data.max) * 100 : 0
          const isToday = i === data.days.length - 1
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                {/* tooltip */}
                {day.amount > 0 && (
                  <span className="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold bg-foreground text-background px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                    {formatMoney(day.amount, t('taka'), lang)}
                  </span>
                )}
                <div
                  className={`w-full rounded-md transition-all duration-300 ${
                    isToday
                      ? 'bg-primary'
                      : day.amount > 0
                      ? 'bg-primary/60 group-hover:bg-primary/80'
                      : 'bg-muted group-hover:bg-muted-foreground/30'
                  }`}
                  style={{ height: `${Math.max(pct, day.amount > 0 ? 8 : 3)}%`, minHeight: '3px' }}
                />
              </div>
              <span className={`text-[9px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {t(day.label as any) || day.label}
              </span>
            </div>
          )
        })}
      </div>

      {!hasData && (
        <p className="text-center text-xs text-muted-foreground mt-3">{t('keepGoing')}</p>
      )}
    </div>
  )
}
