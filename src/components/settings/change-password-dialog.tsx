'use client'

import { useState, useMemo } from 'react'
import { KeyRound, Loader2, Eye, EyeOff, Check } from 'lucide-react'
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
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { dict } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function strengthOf(pw: string): { score: 0 | 1 | 2 | 3; label: 'weak' | 'medium' | 'strong' } {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const s = Math.min(score, 3) as 0 | 1 | 2 | 3
  if (s <= 1) return { score: s, label: 'weak' }
  if (s === 2) return { score: s, label: 'medium' }
  return { score: s, label: 'strong' }
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useT()
  const curLang = useAppStore((s) => s.lang)
  const d = dict[curLang]
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => strengthOf(next), [next])

  function reset() {
    setCurrent('')
    setNext('')
    setConfirm('')
    setShowCur(false)
    setShowNew(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!current || !next || !confirm) {
      toast.error(d.required)
      return
    }
    if (next.length < 6) {
      toast.error(d.minPassword)
      return
    }
    if (next !== confirm) {
      toast.error(d.passwordsDoNotMatch)
      return
    }
    setLoading(true)
    const res = await api('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    setLoading(false)
    if (res.ok) {
      toast.success(t('passwordChanged'))
      reset()
      onOpenChange(false)
    } else {
      const key = (res.data?.error || 'server_error') as keyof typeof dict['en']
      toast.error(d[key] || 'Failed')
    }
  }

  const strengthColor = strength.label === 'weak' ? 'bg-destructive' : strength.label === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
  const strengthText = strength.label === 'weak' ? 'text-destructive' : strength.label === 'medium' ? 'text-amber-600' : 'text-emerald-600'

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
              <KeyRound className="size-4.5" />
            </div>
            {t('changePassword')}
          </DialogTitle>
          <DialogDescription>{t('changePasswordDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {/* current password */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('currentPassword')}</Label>
            <div className="relative">
              <Input
                type={showCur ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••"
                className="h-11 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCur((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Toggle"
              >
                {showCur ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* new password */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('newPassword')}</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="••••••"
                className="h-11 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Toggle"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {/* strength meter */}
            {next.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i <= strength.score ? strengthColor : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <p className={cn('text-[10px] font-medium', strengthText)}>
                  {t('passwordStrength')}: {t(strength.label)}
                </p>
              </div>
            )}
          </div>

          {/* confirm password */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('confirmPassword')}</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••"
                className="h-11 pr-10"
                autoComplete="new-password"
              />
              {confirm && next === confirm && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
              )}
            </div>
            {confirm && next !== confirm && (
              <p className="text-xs text-destructive">{t('passwordsDoNotMatch')}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
