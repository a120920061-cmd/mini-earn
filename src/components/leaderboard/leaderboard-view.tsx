'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Crown, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

type LeaderData = {
  period: string
  top: Earner[]
  myRank: { rank: number; totalEarned: number } | null
}

const podiumHeights = ['h-20', 'h-16', 'h-12']
const podiumColors = [
  'from-amber-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-orange-400 to-orange-500',
]
const podiumBadge = [Crown, Medal, Medal]

export function LeaderboardView() {
  const { t, lang } = useT()
  const setView = useAppStore((s) => s.setView)
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<LeaderData | null>(null)
  const [period, setPeriod] = useState<'week' | 'all'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const res = await api<LeaderData>(`/api/leaderboard?period=${period}`)
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ period, top: [], myRank: null })
      setLoading(false)
    })()
    return () => { alive = false }
  }, [period])

  const podium = data?.top.slice(0, 3) || []
  const rest = data?.top.slice(3) || []

  return (
    <div className="space-y-5 animate-view-in pb-4">
      <button
        onClick={() => setView('dashboard')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </button>

      {/* header */}
      <div className="text-center">
        <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white grid place-items-center mx-auto shadow-lg mb-2">
          <Trophy className="size-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t('leaderboard')}</h1>
        <p className="text-sm text-muted-foreground">{t('topEarnersDesc')}</p>
      </div>

      {/* period toggle */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setPeriod('week')}
          className={cn(
            'py-2 rounded-lg text-sm font-medium transition-all',
            period === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          )}
        >
          {t('thisWeekTop')}
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={cn(
            'py-2 rounded-lg text-sm font-medium transition-all',
            period === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          )}
        >
          {t('allTime')}
        </button>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : !data || data.top.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
            <Trophy className="size-8 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">{t('noEarnersYet')}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('keepEarning')}</p>
        </Card>
      ) : (
        <>
          {/* podium */}
          {podium.length > 0 && (
            <div className="flex items-end justify-center gap-2 sm:gap-3 px-2">
              {/* reorder to [2nd, 1st, 3rd] for podium visual */}
              {[1, 0, 2].map((idx) => {
                const e = podium[idx]
                if (!e) return <div key={idx} className="flex-1 max-w-28" />
                const place = idx + 1
                const Badge = podiumBadge[idx]
                return (
                  <div key={e.id} className="flex-1 max-w-28 flex flex-col items-center">
                    {/* avatar */}
                    <div className="relative mb-1.5">
                      <div
                        className={cn(
                          'size-12 sm:size-14 rounded-2xl grid place-items-center font-bold text-white shadow-md',
                          idx === 0
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                            : idx === 1
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400'
                            : 'bg-gradient-to-br from-orange-400 to-orange-500'
                        )}
                      >
                        {e.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={cn(
                        'absolute -top-1.5 -right-1.5 size-6 rounded-full grid place-items-center text-white shadow',
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-500'
                      )}>
                        <Badge className="size-3.5" />
                      </div>
                      {e.isMe && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {t('you')}
                        </span>
                      )}
                    </div>
                    {/* name */}
                    <p className="text-xs font-semibold truncate w-full text-center">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate w-full text-center">@{e.username}</p>
                    {/* amount */}
                    <p className="text-xs font-bold text-primary mt-0.5">{formatMoney(e.totalEarned, t('taka'), lang)}</p>
                    {/* podium block */}
                    <div
                      className={cn(
                        'w-full rounded-t-lg bg-gradient-to-b mt-2',
                        podiumHeights[idx],
                        podiumColors[idx]
                      )}
                    >
                      <div className="h-full flex items-center justify-center text-white font-bold text-lg">
                        {formatNumber(place, lang)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ranked list 4-10 */}
          {rest.length > 0 && (
            <div className="rounded-2xl border bg-card divide-y overflow-hidden">
              {rest.map((e) => (
                <div
                  key={e.id}
                  className={cn(
                    'flex items-center gap-3 p-3.5',
                    e.isMe && 'bg-primary/5'
                  )}
                >
                  <div className="size-9 rounded-lg bg-muted grid place-items-center text-sm font-bold shrink-0">
                    {formatNumber(e.rank, lang)}
                  </div>
                  <div className="size-9 rounded-full bg-gradient-to-br from-primary/60 to-emerald-700 text-primary-foreground grid place-items-center font-bold shrink-0">
                    {e.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      {e.name}
                      {e.isMe && (
                        <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          {t('you')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{e.username}</p>
                  </div>
                  <p className="font-bold text-sm text-primary">{formatMoney(e.totalEarned, t('taka'), lang)}</p>
                </div>
              ))}
            </div>
          )}

          {/* your rank card */}
          {user && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-emerald-700/10 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold shrink-0">
                  {data?.myRank ? formatNumber(data.myRank.rank, lang) : '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t('yourRank')}</p>
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t('totalEarned')}</p>
                  <p className="font-bold text-primary">
                    {formatMoney(data?.myRank?.totalEarned ?? user.totalEarned, t('taka'), lang)}
                  </p>
                </div>
              </div>
              {!data?.myRank && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  {t('keepEarning')}
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-2 px-2 h-32">
        <Skeleton className="flex-1 max-w-28 h-20 rounded-t-lg" />
        <Skeleton className="flex-1 max-w-28 h-24 rounded-t-lg" />
        <Skeleton className="flex-1 max-w-28 h-16 rounded-t-lg" />
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  )
}
