'use client'

import { useEffect, useState } from 'react'
import { Award, Lock, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/use-t'
import { api, formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

type Badge = {
  id: string
  title: string
  description: string
  icon: string
  color: string
  unlocked: boolean
  progress?: { current: number; target: number }
}

type BadgeData = {
  badges: Badge[]
  unlockedCount: number
  totalCount: number
}

export function BadgesGrid() {
  const { t, lang } = useT()
  const [data, setData] = useState<BadgeData | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<BadgeData>('/api/achievements')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ badges: [], unlockedCount: 0, totalCount: 0 })
    })()
    return () => { alive = false }
  }, [])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
            <Award className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t('achievements')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('badgesDesc')}</p>
          </div>
        </div>
        {data && (
          <span className="text-xs font-bold text-muted-foreground">
            <span className="text-primary">{formatNumber(data.unlockedCount, lang)}</span>
            <span className="mx-0.5">{t('of')}</span>
            {formatNumber(data.totalCount, lang)}
          </span>
        )}
      </div>

      {data === null ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : data.badges.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{t('noBadgesYet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                'flex flex-col items-center p-2.5 rounded-xl text-center transition-all',
                b.unlocked
                  ? 'bg-card border shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  : 'bg-muted/50 opacity-70'
              )}
              title={b.description}
            >
              <div
                className={cn(
                  'relative size-10 rounded-xl grid place-items-center text-xl mb-1.5',
                  b.unlocked
                    ? `bg-gradient-to-br ${b.color}`
                    : 'bg-muted grayscale'
                )}
              >
                {b.unlocked ? (
                  <span>{b.icon}</span>
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-[10px] font-semibold leading-tight line-clamp-1 w-full">{b.title}</p>
              <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight mt-0.5 h-6">
                {b.description}
              </p>
              {b.progress && !b.unlocked && (
                <div className="w-full mt-1.5">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (b.progress.current / b.progress.target) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-0.5">
                    {formatNumber(Math.round(b.progress.current), lang)}/{formatNumber(b.progress.target, lang)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
