'use client'

import { useEffect, useState } from 'react'
import { Trophy, ArrowRight, Crown, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

type Earner = {
  rank: number
  id: string
  name: string
  username: string
  totalEarned: number
  isMe: boolean
}

const rankColors = [
  'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-orange-400 to-orange-500 text-white',
]

export function TopEarnersPreview() {
  const { t, lang } = useT()
  const setView = useAppStore((s) => s.setView)
  const [top, setTop] = useState<Earner[] | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<{ top: Earner[] }>('/api/leaderboard?period=week')
      if (!alive) return
      if (res.ok && res.data) setTop(res.data.top.slice(0, 3))
      else setTop([])
    })()
    return () => { alive = false }
  }, [])

  if (top === null) {
    return (
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="flex-1 h-16 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (top.length === 0) return null

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
            <Trophy className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t('topEarners')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('thisWeekTop')}</p>
          </div>
        </div>
        <button
          onClick={() => setView('leaderboard')}
          className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
        >
          {t('seeAll')}
          <ArrowRight className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {top.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setView('leaderboard')}
            className={cn(
              'flex flex-col items-center p-2.5 rounded-xl transition-colors text-center',
              e.isMe ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
            )}
          >
            <div className="relative mb-1">
              <div
                className={cn(
                  'size-9 rounded-full grid place-items-center font-bold text-sm shrink-0',
                  rankColors[i] || 'bg-muted text-muted-foreground'
                )}
              >
                {e.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-card border text-[8px] font-bold grid place-items-center text-muted-foreground">
                {formatNumber(e.rank, lang)}
              </span>
              {i === 0 && (
                <Crown className="absolute -top-2.5 left-1/2 -translate-x-1/2 size-3.5 text-amber-500 fill-amber-400" />
              )}
            </div>
            <p className="text-[10px] font-medium truncate w-full">{e.name.split(' ')[0]}</p>
            <p className="text-[11px] font-bold text-primary">{formatMoney(e.totalEarned, t('taka'), lang)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
