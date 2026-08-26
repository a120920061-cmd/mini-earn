'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Loader2, Mail, AtSign, ShieldCheck, ShieldOff, Users as UsersIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, timeAgo } from '@/lib/api'
import { toast } from 'sonner'

type AdminUser = {
  id: string
  name: string
  username: string
  email: string
  balance: number
  totalEarned: number
  enabled: boolean
  isAdmin: boolean
  createdAt: string
}

export function AdminUsersManager() {
  const { t, lang } = useT()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [q, setQ] = useState('')

  const load = useCallback(async (query: string) => {
    const res = await api<{ users: AdminUser[] }>(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`)
    if (res.ok && res.data) setUsers(res.data.users)
    else setUsers([])
  }, [])

  useEffect(() => {
    let alive = true
    const id = setTimeout(() => {
      ;(async () => {
        const res = await api<{ users: AdminUser[] }>(
          `/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`
        )
        if (!alive) return
        if (res.ok && res.data) setUsers(res.data.users)
        else setUsers([])
      })()
    }, 300)
    return () => { alive = false; clearTimeout(id) }
  }, [q])

  async function toggleEnabled(u: AdminUser, enabled: boolean) {
    setUsers((prev) => prev?.map((x) => (x.id === u.id ? { ...x, enabled } : x)) || null)
    const res = await api(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
      const key = (res.data?.error as any) || 'server_error'
      if (key === 'cannot_disable_admin') toast.error('Cannot disable admin')
      else if (key === 'cannot_disable_self') toast.error('Cannot disable yourself')
      else toast.error('Failed')
      load(q)
    } else {
      toast.success(enabled ? t('enable') : t('disable'))
    }
  }

  return (
    <div className="space-y-4 animate-view-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('manageUsers')}</h1>
        <p className="text-sm text-muted-foreground">{users?.length || 0} {t('user').toLowerCase()}</p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchUsers')}
          className="h-11 pl-9"
        />
      </div>

      {users === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <UsersIcon className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('noUsersYet')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className={`p-4 ${!u.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary/80 to-emerald-700 text-primary-foreground grid place-items-center font-bold shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{u.name}</h3>
                    {u.isAdmin && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Admin</Badge>
                    )}
                  </div>
                  <div className="space-y-0.5 mt-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5 truncate"><AtSign className="size-3" />@{u.username}</p>
                    <p className="flex items-center gap-1.5 truncate"><Mail className="size-3" />{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-bold text-primary">{formatMoney(u.balance, t('taka'))}</span>
                    <span className="text-muted-foreground">· {t('totalEarned')}: {formatMoney(u.totalEarned, t('taka'))}</span>
                    <span className="text-muted-foreground">· {timeAgo(u.createdAt, lang)}</span>
                  </div>
                </div>
              </div>

              {!u.isAdmin && (
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                  <span className={`text-xs flex items-center gap-1 ${u.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {u.enabled ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
                    {u.enabled ? t('active') : t('disabled')}
                  </span>
                  <Switch checked={u.enabled} onCheckedChange={(c) => toggleEnabled(u, c)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
