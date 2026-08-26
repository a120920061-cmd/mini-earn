'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Globe,
  Sun,
  Moon,
  Bell,
  Info,
  Heart,
  Trash2,
  Loader2,
  LogOut,
  ShieldCheck,
  ShieldOff,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
import { useTheme } from 'next-themes'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { ChangePasswordDialog } from '@/components/settings/change-password-dialog'

export function SettingsView() {
  const { t } = useT()
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const curLang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const logoutLocal = useAppStore((s) => s.logoutLocal)
  const { theme, setTheme } = useTheme()
  const [clearingNotif, setClearingNotif] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  async function clearNotifications() {
    setClearingNotif(true)
    // mark all as read (simple "clear" semantics without a dedicated delete endpoint)
    const res = await api('/api/notifications/read-all', { method: 'POST' })
    setClearingNotif(false)
    if (res.ok) {
      toast.success(t('cleared'))
      setClearOpen(false)
    } else {
      toast.error('Failed')
    }
  }

  async function onLogout() {
    await api('/api/auth/logout', { method: 'POST' })
    logoutLocal()
    toast.success(t('logoutSuccess'))
  }

  return (
    <div className="space-y-5 animate-view-in">
      <button
        onClick={() => setView('profile')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settingsTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('appName')}</p>
      </div>

      {/* Appearance */}
      <Section title={t('appearance')}>
        {/* language */}
        <Row
          icon={<Globe className="size-4" />}
          label={t('languageRegion')}
          desc={curLang === 'bn' ? 'বাংলা' : 'English'}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(curLang === 'bn' ? 'en' : 'bn')}
            className="min-w-20"
          >
            {curLang === 'bn' ? 'EN' : 'বাং'}
          </Button>
        </Row>
        {/* theme */}
        <Row
          icon={theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          label={t('theme')}
          desc={theme === 'dark' ? t('darkMode') : t('lightMode')}
        >
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')}
            aria-label="Toggle theme"
          />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title={t('notificationsSettings')}>
        <Row
          icon={<Bell className="size-4" />}
          label={t('clearNotifications')}
          desc={t('clearNotificationsDesc')}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearOpen(true)}
            disabled={clearingNotif}
            className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
          >
            {clearingNotif ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </Row>
      </Section>

      {/* Security */}
      <Section title={t('changePassword')}>
        <Row
          icon={<KeyRound className="size-4" />}
          label={t('changePassword')}
          desc={t('changePasswordDesc')}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPwOpen(true)}
          >
            <KeyRound className="size-4" />
          </Button>
        </Row>
      </Section>

      {/* Account status */}
      {user && (
        <Section title={t('accountActions')}>
          <Row
            icon={user.enabled ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
            label={t('accountStatus')}
            desc={user.enabled ? t('active') : t('disabled')}
          >
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {user.enabled ? t('active') : t('disabled')}
            </span>
          </Row>
        </Section>
      )}

      {/* Danger zone */}
      <Section title={t('dangerZone')}>
        <Row
          icon={<LogOut className="size-4" />}
          label={t('logout')}
          desc={user?.email || ''}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
          >
            <LogOut className="size-4" />
          </Button>
        </Row>
      </Section>

      {/* About */}
      <Card className="p-5 text-center">
        <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center mx-auto mb-3">
          <Info className="size-6" />
        </div>
        <h3 className="font-semibold">{t('appName')}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t('aboutDesc')}</p>
        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <span>{t('version')} 1.0</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            {t('madeWith')} <Heart className="size-3 fill-red-500 text-red-500" />
          </span>
        </div>
      </Card>

      {/* clear confirm */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clearNotifications')}?</AlertDialogTitle>
            <AlertDialogDescription>{t('clearNotificationsDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearNotifications}
              disabled={clearingNotif}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {clearingNotif ? <Loader2 className="size-4 animate-spin" /> : t('clearNotifications')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* change password dialog */}
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">{title}</p>
      <Card className="divide-y p-0 overflow-hidden">{children}</Card>
    </div>
  )
}

function Row({
  icon,
  label,
  desc,
  children,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
