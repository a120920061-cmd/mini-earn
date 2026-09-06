'use client'

import { useEffect } from 'react'
import { Wallet } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { AuthScreen } from '@/components/auth/auth-screen'
import { AppShell } from '@/components/layout/app-shell'
import { AdminPanel } from '@/components/admin/admin-panel'

export default function Home() {
  const user = useAppStore((s) => s.user)
  const authLoading = useAppStore((s) => s.authLoading)
  const setUser = useAppStore((s) => s.setUser)
  const setAuthLoading = useAppStore((s) => s.setAuthLoading)
  const adminAsUser = useAppStore((s) => s.adminAsUser)

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Check for Telegram OAuth callback (query params on root URL)
      const url = new URL(window.location.href)
      const hashParam = url.searchParams.get('hash')
      const tgId = url.searchParams.get('id')

      if (hashParam && tgId) {
        // Telegram OAuth redirect — send all params to backend for verification
        const widgetData: Record<string, string> = {}
        url.searchParams.forEach((value, key) => {
          widgetData[key] = value
        })

        setAuthLoading(true)
        const res = await api<{ user?: any; error?: string }>('/api/auth/telegram', {
          method: 'POST',
          body: JSON.stringify({ widgetData }),
        })
        if (!alive) return

        if (res.ok && res.data?.user) {
          setUser(res.data.user)
          toast.success('Telegram login successful')
        } else {
          toast.error('Telegram login failed')
        }

        // Clean URL (remove query params)
        window.history.replaceState({}, document.title, '/')
        setAuthLoading(false)
        return
      }

      // Normal auth check
      setAuthLoading(true)
      const res = await api<{ user: any }>('/api/auth/me')
      if (!alive) return
      if (res.ok && res.data) setUser(res.data.user)
      else setUser(null)
      setAuthLoading(false)
    })()
    return () => { alive = false }
  }, [setUser, setAuthLoading])

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center animate-pulse">
          <Wallet className="size-6" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  if (user.isAdmin && !adminAsUser) return <AdminPanel />

  return <AppShell adminBanner={user.isAdmin && adminAsUser} />
}
