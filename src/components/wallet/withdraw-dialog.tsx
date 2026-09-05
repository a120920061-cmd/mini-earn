'use client'

import { useState } from 'react'
import { Loader2, Wallet, ArrowDownToLine } from 'lucide-react'
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
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney } from '@/lib/api'
import { toast } from 'sonner'
import { dict } from '@/lib/i18n'

const METHODS = ['bkash', 'nagad', 'rocket', 'bank'] as const
type Method = (typeof METHODS)[number]

export function WithdrawDialog({
  open,
  onOpenChange,
  balance,
  onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  balance: number
  onDone?: (newBalance: number) => void
}) {
  const { t, lang } = useT()
  const curLang = useAppStore((s) => s.lang)
  const d = dict[curLang]
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<Method>('bkash')
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<Record<string, string>>({})

  function reset() {
    setAmount('')
    setAccount('')
    setMethod('bkash')
    setErr({})
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 100) e.amount = d.minWithdraw
    if (amt > balance) e.amount = d.insufficientBalance
    if (account.trim().length < 5) e.account = d.invalidAccount
    setErr(e)
    return Object.keys(e).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const res = await api<{ balance: number; error?: string }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), method, account: account.trim() }),
    })
    setLoading(false)
    if (!res.ok) {
      const key = (res.data?.error || 'server_error') as keyof typeof dict['en']
      if (key === 'minWithdraw' || key === 'insufficientBalance' || key === 'invalidAccount') {
        setErr({ ...(key === 'account' ? { account: d[key] } : { amount: d[key] }) })
      } else if (key === 'referralRequired') {
        // hidden gate revealed only at withdrawal time
        const missing = (res.data as any)?.missing ?? 10
        toast.error(curLang === 'bn' ? `উত্তোলনের জন্য আরও ${missing} জনকে রেফার করতে হবে` : `Refer ${missing} more users to withdraw`)
        onOpenChange(false)
      } else {
        toast.error(d[key] || res.error || 'Error')
      }
      return
    }
    toast.success(d.withdrawalRequested)
    onDone?.(res.data!.balance)
    reset()
    onOpenChange(false)
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
              <ArrowDownToLine className="size-4.5" />
            </div>
            {t('withdrawMoney')}
          </DialogTitle>
          <DialogDescription>{t('withdrawSubtitle')}</DialogDescription>
        </DialogHeader>

        {/* available balance */}
        <div className="rounded-xl bg-muted p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Wallet className="size-4" /> {t('balance')}
          </span>
          <span className="font-bold text-primary">{formatMoney(balance, t('taka'), lang)}</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('withdrawAmount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
              <Input
                type="number"
                step="0.01"
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="h-11 pl-7"
              />
            </div>
            {err.amount && <p className="text-xs text-destructive">{err.amount}</p>}
            <p className="text-xs text-muted-foreground">{t('minWithdraw')}</p>
          </div>

          {/* method */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('paymentMethod')}</Label>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    method === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t(m)}
                </button>
              ))}
            </div>
          </div>

          {/* account */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('accountNumber')}</Label>
            <Input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={t('accountNumberPlaceholder')}
              className="h-11"
              inputMode="tel"
            />
            {err.account && <p className="text-xs text-destructive">{err.account}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : t('requestWithdraw')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
