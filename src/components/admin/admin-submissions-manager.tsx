'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'

type Submission = {
  id: string
  status: string
  reward: number
  proof: string | null
  createdAt: string
  job: { id: string; title: string; category: string }
  user: { id: string; name: string; username: string; email: string }
}

const statusStyle: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function AdminSubmissionsManager() {
  const { t, lang } = useT()
  const [submissions, setSubmissions] = useState<Submission[] | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    let alive = true
    const id = setTimeout(() => {
      ;(async () => {
        setSubmissions(null)
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (status) params.set('status', status)
        const res = await api<{ submissions: Submission[] }>(
          `/api/admin/submissions?${params.toString()}`
        )
        if (!alive) return
        if (res.ok && res.data) setSubmissions(res.data.submissions)
        else setSubmissions([])
      })()
    }, 300)
    return () => { alive = false; clearTimeout(id) }
  }, [q, status])

  const filters: { key: string; tKey: any }[] = [
    { key: '', tKey: 'allStatuses' },
    { key: 'completed', tKey: 'completed' },
    { key: 'rejected', tKey: 'rejected' },
  ]

  return (
    <div className="space-y-4 animate-view-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('manageSubmissions')}</h1>
        <p className="text-sm text-muted-foreground">
          {submissions ? formatNumber(submissions.length, lang) : '—'} {t('submissions').toLowerCase()}
        </p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchSubmissions')}
          className="h-11 pl-9"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm px-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* status filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border',
              status === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            )}
          >
            {t(f.tKey)}
          </button>
        ))}
      </div>

      {/* list */}
      {submissions === null ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
            <ClipboardList className="size-8 text-muted-foreground" />
          </div>
          <p className="font-semibold mb-1">{t('noSubmissions')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {submissions.map((s) => (
            <Card key={s.id} className="p-3">
              <div className="flex items-center gap-3">
                {/* status icon */}
                <div
                  className={cn(
                    'size-9 rounded-lg grid place-items-center shrink-0',
                    statusStyle[s.status] || statusStyle.pending
                  )}
                >
                  {s.status === 'completed' ? <CheckCircle2 className="size-4.5" /> : <XCircle className="size-4.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{s.job.title}</p>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 capitalize shrink-0">{s.job.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.user.name} · @{s.user.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(s.createdAt, lang)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-primary">{formatMoney(s.reward, t('taka'), lang)}</p>
                  <Badge variant="outline" className={cn('text-[9px] h-4 px-1 mt-0.5 border-0', statusStyle[s.status] || statusStyle.pending)}>
                    {t(s.status as any)}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
