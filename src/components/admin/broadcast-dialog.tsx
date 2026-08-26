'use client'

import { useState } from 'react'
import { Megaphone, Loader2, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

export function BroadcastDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useT()
  const curLang = useAppStore((s) => s.lang)
  const d = dict[curLang]
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function reset() {
    setTitle('')
    setMessage('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 2 || message.trim().length < 2) {
      toast.error(d.required)
      return
    }
    setLoading(true)
    const res = await api<{ ok: boolean; sent: number }>('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), body: message.trim() }),
    })
    setLoading(false)
    if (res.ok && res.data) {
      toast.success(`${d.broadcastSent} (${res.data.sent})`)
      reset()
      onOpenChange(false)
    } else {
      toast.error('Failed')
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
              <Megaphone className="size-4.5" />
            </div>
            {t('sendBroadcast')}
          </DialogTitle>
          <DialogDescription>{t('broadcastHint')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('broadcastTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={curLang === 'bn' ? 'যেমন: নতুন কাজ যোগ হয়েছে!' : 'e.g. New jobs added!'}
              className="h-11"
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t('broadcastMessage')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={curLang === 'bn' ? 'বিস্তারিত লিখুন...' : 'Write the details...'}
              rows={4}
              maxLength={400}
            />
            <p className="text-[10px] text-muted-foreground text-right">{message.length}/400</p>
          </div>

          {/* recipients badge */}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-2.5">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('recipients')}:</span>
            <span className="text-xs font-semibold">{t('allUsers')}</span>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t('broadcast')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
