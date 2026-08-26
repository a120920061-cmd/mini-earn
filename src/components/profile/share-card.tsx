'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Gift, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { toast } from 'sonner'

export function ShareCard() {
  const { t } = useT()
  const user = useAppStore((s) => s.user)
  const [copied, setCopied] = useState(false)

  if (!user) return null

  // simple shareable link with username (no DB tracking — keeps it lightweight)
  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${user.username}`
    : `https://miniearn.app/?ref=${user.username}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast.success(t('copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = shareLink
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        toast.success(t('copied'))
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Copy failed')
      }
      document.body.removeChild(ta)
    }
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Mini Earn',
          text: `${t('shareDesc')} — ${user?.name}`,
          url: shareLink,
        })
      } catch {
        // user cancelled — no action needed
      }
    } else {
      copyLink()
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      {/* gradient header */}
      <div className="relative bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-4">
        <div className="absolute -right-4 -top-4 size-20 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
            <Gift className="size-5" />
          </div>
          <div>
            <p className="font-semibold leading-none">{t('shareApp')}</p>
            <p className="text-xs opacity-90 mt-1">{t('shareDesc')}</p>
          </div>
        </div>
      </div>

      {/* link + actions */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">{t('yourReferralLink')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-lg border bg-muted px-3 py-2.5">
              <p className="text-xs font-mono truncate text-muted-foreground">{shareLink}</p>
            </div>
            <Button
              size="icon"
              variant={copied ? 'default' : 'outline'}
              className="size-10 shrink-0"
              onClick={copyLink}
              aria-label={t('copyLink')}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11"
          onClick={nativeShare}
        >
          <Share2 className="size-4" />
          {t('shareApp')}
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>{t('shareDesc')}</span>
        </div>
      </div>
    </Card>
  )
}
