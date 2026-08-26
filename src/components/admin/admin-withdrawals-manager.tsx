'use client'

import { useEffect, useState } from 'react'
import { ArrowDownToLine, Loader2, Check, X, Clock, Wallet, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, timeAgo } from '@/lib/api'
import { toast } from 'sonner'

type Withdrawal = {
  id: string
  amount: number
  method: string
  account: string
  status: string
  note: string | null
  createdAt: string
  user: { id: string; name: string; username: string; email: string }
}

type AdminData = {
  withdrawals: Withdrawal[]
  stats: { totalApproved: number; pendingCount: number }
}

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function AdminWithdrawalsManager() {
  const { t, lang } = useT()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [action, setAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [processing, setProcessing] = useState(false)

  async function load() {
    setLoading(true)
    const status = filter === 'all' ? '' : `?status=${filter}`
    const res = await api<AdminData>(`/api/admin/withdrawals${status}`)
    if (res.ok && res.data) setData(res.data)
    else setData({ withdrawals: [], stats: { totalApproved: 0, pendingCount: 0 } })
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const status = filter === 'all' ? '' : `?status=${filter}`
      const res = await api<AdminData>(`/api/admin/withdrawals${status}`)
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ withdrawals: [], stats: { totalApproved: 0, pendingCount: 0 } })
      setLoading(false)
    })()
    return () => { alive = false }
  }, [filter])

  async function confirmAction() {
    if (!action) return
    setProcessing(true)
    const status = action.type === 'approve' ? 'approved' : 'rejected'
    const res = await api(`/api/admin/withdrawals/${action.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    setProcessing(false)
    if (res.ok) {
      toast.success(action.type === 'approve' ? t('approve') : t('reject'))
      setAction(null)
      load()
    } else {
      toast.error('Failed')
    }
  }

  const filters: { key: typeof filter; tKey: any; count?: number }[] = [
    { key: 'pending', tKey: 'pending' },
    { key: 'approved', tKey: 'approved' },
    { key: 'rejected', tKey: 'rejected' },
    { key: 'all', tKey: 'status' },
  ]

  return (
    <div className="space-y-4 animate-view-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('manageWithdrawals')}</h1>
          <p className="text-sm text-muted-foreground">
            {data?.stats.pendingCount || 0} {t('pendingWithdrawals').toLowerCase()}
          </p>
        </div>
      </div>

      {/* summary card */}
      {data && (
        <div className="rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 flex items-center gap-1.5">
              <Wallet className="size-4" /> {t('totalWithdrawals')}
            </p>
            <p className="text-3xl font-bold mt-1">{formatMoney(data.stats.totalApproved, t('taka'), lang)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">{t('pending')}</p>
            <p className="text-3xl font-bold">{data.stats.pendingCount}</p>
          </div>
        </div>
      )}

      {/* filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {t(f.tKey)}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : !data || data.withdrawals.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
            <ArrowDownToLine className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('noWithdrawals')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.withdrawals.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${statusStyle[w.status] || statusStyle.pending}`}>
                  {w.status === 'approved' ? <Check className="size-5" /> : w.status === 'rejected' ? <X className="size-5" /> : <Clock className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate">{w.user.name}</h3>
                    <span className="font-bold text-primary">{formatMoney(w.amount, t('taka'), lang)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{w.user.username} · {w.user.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] capitalize">{t(w.method as any) || w.method}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{w.account}</span>
                    <span className="text-xs text-muted-foreground">· {timeAgo(w.createdAt, lang)}</span>
                  </div>
                  {w.note && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">{w.note}</p>
                  )}
                  {w.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setAction({ id: w.id, type: 'approve' })}
                      >
                        <Check className="size-3.5" /> {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                        onClick={() => setAction({ id: w.id, type: 'reject' })}
                      >
                        <X className="size-3.5" /> {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action?.type === 'approve' ? t('approve') : t('reject')}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action?.type === 'approve'
                ? lang === 'bn' ? 'এই উত্তোলন অনুমোদন করা হবে এবং ইউজারের ব্যালেন্স থেকে টাকা কাটা হবে।' : 'This withdrawal will be approved and the amount deducted from the user.'
                : lang === 'bn' ? 'এই উত্তোলন প্রত্যাখ্যান করা হবে এবং টাকা ইউজারকে ফেরত দেওয়া হবে।' : 'This withdrawal will be rejected and the amount refunded to the user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={processing}
              className={action?.type === 'approve' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-destructive text-white hover:bg-destructive/90'}
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : action?.type === 'approve' ? t('approve') : t('reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
