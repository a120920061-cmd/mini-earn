'use client'

import { useState } from 'react'
import { Wallet, Loader2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useT } from '@/hooks/use-t'
import { api, formatMoney } from '@/lib/api'
import { toast } from 'sonner'
import { dict } from '@/lib/i18n'
import { useAppStore } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

export function BalanceAdjustDialog({
  userId,
  userName,
  currentBalance,
  open,
  onOpenChange,
  onDone,
}: {
  userId: string
  userName: string
  currentBalance: number
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone?: (newBalance: number) => void
}) {
  const { t } = useT()
  const curLang = useAppStore((s) => s.lang)
  const d = dict[curLang]
  const [mode, setMode] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() {
    setMode('add')
    setAmount('')
    setReason('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(d.invalidAmount)
      return
    }
    setLoading(true)
    const signed = mode === 'add' ? amt : -amt
    const res = await api<{ balance: number; error?: string }>(
      `/api/admin/users/${userId}/balance`,
      { method: 'POST', body: JSON.stringify({ amount: signed, reason: reason.trim() }) }
    )
    setLoading(false)
    if (res.ok && res.data) {
      toast.success(d.balanceAdjusted)
      onDone?.(res.data.balance)
      reset()
      onOpenChange(false)
    } else {
      const key = (res.data?.error || 'server_error') as keyof typeof dict['en']
      toast.error(d[key] || 'Failed')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Wallet className="size-4.5" />
            </div>
            {t('adjustBalance')}
          </DialogTitle>
          <DialogDescription>
            {userName} · {t('balance')}: <b>{formatMoney(currentBalance, t('taka'), curLang)}</b>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {/* mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={cn(
                'py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'add' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Plus className="size-4" />
              {t('addBalance')}
            </button>
            <button
              type="button"
              onClick={() => setMode('deduct')}
              className={cn(
                'py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'deduct' ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Minus className="size-4" />
              {t('deductBalance')}
            </button>
          </div>

          {/* amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('amount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                className="h-11 pl-7"
                autoFocus
              />
            </div>
          </div>

          {/* reason */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="h-11"
              maxLength={200}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className={cn('flex-1', mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90')}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : mode === 'add' ? <Plus className="size-4" /> : <Minus className="size-4" />}
              {mode === 'add' ? t('addBalance') : t('deductBalance')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
