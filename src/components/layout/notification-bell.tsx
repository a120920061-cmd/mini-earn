'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, CheckCheck, Loader2, Coins, ArrowDownToLine, Info, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'

type Notif = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  link: string | null
  createdAt: string
}

type NotifData = {
  unreadCount: number
  notifications: Notif[]
}

const typeIcon: Record<string, { icon: typeof Coins; color: string }> = {
  earning: { icon: Coins, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  withdrawal: { icon: ArrowDownToLine, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  job: { icon: Briefcase, color: 'bg-primary/10 text-primary' },
  system: { icon: Info, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
}

export function NotificationBell() {
  const { t, lang } = useT()
  const setView = useAppStore((s) => s.setView)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotifData | null>(null)
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const res = await api<NotifData>('/api/notifications')
    if (res.ok && res.data) setData(res.data)
    if (showLoading) setLoading(false)
  }, [])

  // initial load + poll every 30s for fresh notifications
  useEffect(() => {
    let alive = true
    const run = async () => {
      const res = await api<NotifData>('/api/notifications')
      if (alive && res.ok && res.data) setData(res.data)
    }
    run()
    const id = setInterval(run, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const reload = useCallback(() => load(true), [load])

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function markAllRead() {
    setMarking(true)
    const res = await api('/api/notifications/read-all', { method: 'POST' })
    setMarking(false)
    if (res.ok && data) {
      setData({
        unreadCount: 0,
        notifications: data.notifications.map((n) => ({ ...n, read: true })),
      })
    }
  }

  async function onClickNotif(n: Notif) {
    if (!n.read) {
      await api(`/api/notifications/${n.id}/read`, { method: 'PATCH' })
      setData((prev) => prev ? {
        unreadCount: Math.max(0, prev.unreadCount - 1),
        notifications: prev.notifications.map((x) => x.id === n.id ? { ...x, read: true } : x),
      } : prev)
    }
    setOpen(false)
    if (n.link === 'wallet') setView('wallet')
    else if (n.link === 'jobs') setView('jobs')
    else if (n.link === 'dashboard') setView('dashboard')
  }

  const unread = data?.unreadCount || 0

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-full relative"
        onClick={() => { setOpen((o) => !o); if (!open) reload() }}
        aria-label={t('notifications')}
      >
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold grid place-items-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover shadow-xl overflow-hidden z-50 animate-view-in">
            {/* header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Bell className="size-4" />
                {t('notifications')}
                {unread > 0 && (
                  <span className="text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-full font-bold">
                    {unread}
                  </span>
                )}
              </h3>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={marking}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  {marking ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3.5" />}
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {/* list */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-3 space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                </div>
              ) : !data || data.notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
                    <Bell className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data.notifications.map((n) => {
                    const { icon: Icon, color } = typeIcon[n.type] || typeIcon.system
                    return (
                      <button
                        key={n.id}
                        onClick={() => onClickNotif(n)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors',
                          !n.read && 'bg-primary/5'
                        )}
                      >
                        <div className={cn('size-8 rounded-lg grid place-items-center shrink-0 mt-0.5', color)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight flex items-center gap-1.5">
                            {n.title}
                            {!n.read && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt, lang)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
