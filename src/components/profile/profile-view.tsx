'use client'

import { useState } from 'react'
import {
  User as UserIcon,
  Mail,
  AtSign,
  Wallet,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Languages,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { useTheme } from 'next-themes'
import { dict } from '@/lib/i18n'
import { ShareCard } from '@/components/profile/share-card'
import { BadgesGrid } from '@/components/profile/badges-grid'

export function ProfileView() {
  const { t, lang } = useT()
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const curLang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const logoutLocal = useAppStore((s) => s.logoutLocal)
  const { theme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(user?.name || '')
  const [editLoading, setEditLoading] = useState(false)
  const d = dict[curLang]

  async function onLogout() {
    setLoggingOut(true)
    await api('/api/auth/logout', { method: 'POST' })
    setLoggingOut(false)
    logoutLocal()
    toast.success(t('logoutSuccess'))
  }

  async function onEditSave(e: React.FormEvent) {
    e.preventDefault()
    const name = editName.trim()
    if (name.length < 2) {
      toast.error(d.minName)
      return
    }
    setEditLoading(true)
    const res = await api<{ user: any }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
    setEditLoading(false)
    if (res.ok && res.data?.user) {
      setUser(res.data.user)
      toast.success(t('profileUpdated'))
      setEditOpen(false)
    } else {
      const key = (res.data?.error || 'server_error') as keyof typeof dict['en']
      toast.error(d[key] || 'Error')
    }
  }

  if (!user) return null

  return (
    <div className="space-y-5 animate-view-in">
      <h1 className="text-2xl font-bold tracking-tight">{t('profile')}</h1>

      {/* profile header */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground grid place-items-center text-2xl font-bold shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg truncate">{user.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => { setEditName(user.name); setEditOpen(true) }}
                aria-label={t('editProfile')}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {user.enabled ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" /> {t('active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <ShieldOff className="size-3.5" /> {t('disabled')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* balance summary */}
      <div className="rounded-2xl border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('balance')}</p>
            <p className="font-bold text-lg">{formatMoney(user.balance, t('taka'), lang)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t('totalEarned')}</p>
          <p className="font-semibold text-sm">{formatMoney(user.totalEarned, t('taka'), lang)}</p>
        </div>
      </div>

      {/* share / invite */}
      <ShareCard />

      {/* account info */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">{t('account')}</p>
        <Card className="divide-y p-0 overflow-hidden">
          <InfoRow icon={<AtSign className="size-4" />} label={t('username')} value={`@${user.username}`} />
          <InfoRow icon={<Mail className="size-4" />} label={t('email')} value={user.email} />
        </Card>
      </div>

      {/* achievements / badges */}
      <BadgesGrid />

      {/* settings */}
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">{t('settings')}</p>
        <Card className="divide-y p-0 overflow-hidden">
          {/* language */}
          <div className="flex items-center gap-3 p-4">
            <div className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground">
              <Languages className="size-4.5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t('language')}</p>
              <p className="text-xs text-muted-foreground">{curLang === 'bn' ? 'বাংলা' : 'English'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(curLang === 'bn' ? 'en' : 'bn')}
              className="min-w-20"
            >
              <Globe className="size-4" />
              {curLang === 'bn' ? 'EN' : 'বাং'}
            </Button>
          </div>

          {/* theme */}
          <div className="flex items-center gap-3 p-4">
            <div className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground">
              {theme === 'dark' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t('theme')}</p>
              <p className="text-xs text-muted-foreground">
                {theme === 'dark' ? t('darkMode') : t('lightMode')}
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')}
              aria-label="Toggle theme"
            />
          </div>
        </Card>
      </div>

      {/* logout */}
      <Button
        variant="outline"
        className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
        onClick={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? <Loader2 className="size-5 animate-spin" /> : <LogOut className="size-5" />}
        {t('logout')}
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        {t('appName')} · v1.0
      </p>

      {/* edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Pencil className="size-4" />
              </div>
              {t('editProfile')}
            </DialogTitle>
            <DialogDescription>{t('editName')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onEditSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t('name')}</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={curLang === 'bn' ? 'আপনার নাম' : 'Your name'}
                className="h-11"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={editLoading}>
                {editLoading ? <Loader2 className="size-4 animate-spin" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}
