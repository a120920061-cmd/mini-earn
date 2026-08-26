'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const CATEGORIES = ['visit', 'social', 'media', 'download', 'survey', 'general']

export function AdminJobForm() {
  const { t } = useT()
  const editingJobId = useAppStore((s) => s.editingJobId)
  const setAdminView = useAppStore((s) => s.setAdminView)
  const editJob = useAppStore((s) => s.editJob)

  const [loading, setLoading] = useState(!!editingJobId)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    reward: '2',
    link: '',
    category: 'visit',
    featured: false,
    enabled: true,
  })

  useEffect(() => {
    if (!editingJobId) return
    let alive = true
    ;(async () => {
      const res = await api<{ job: any }>(`/api/jobs/${editingJobId}`)
      if (!alive) return
      if (res.ok && res.data?.job) {
        const j = res.data.job
        setForm({
          title: j.title || '',
          description: j.description || '',
          instructions: j.instructions || '',
          reward: String(j.reward ?? ''),
          link: j.link || '',
          category: j.category || 'visit',
          featured: !!j.featured,
          enabled: j.enabled !== false,
        })
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [editingJobId])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.link.trim()) {
      toast.error(t('required'))
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      reward: Number(form.reward) || 0,
      link: form.link.trim(),
      category: form.category,
      featured: form.featured,
      enabled: form.enabled,
    }
    const res = editingJobId
      ? await api(`/api/jobs/${editingJobId}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await api('/api/jobs', { method: 'POST', body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) {
      toast.success(editingJobId ? t('saveChanges') : t('addJob'))
      editJob(null)
      setAdminView('admin-jobs')
    } else {
      toast.error('Failed to save')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-view-in max-w-2xl">
      <button
        onClick={() => { editJob(null); setAdminView('admin-jobs') }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </button>

      <h1 className="text-2xl font-bold tracking-tight">
        {editingJobId ? t('editJob') : t('addJob')}
      </h1>

      <form onSubmit={onSave} className="space-y-4">
        <Card className="p-5 space-y-4">
          <Field label={t('jobTitle')}>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Visit Website"
              className="h-11"
            />
          </Field>

          <Field label={t('description')}>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description..."
              rows={2}
            />
          </Field>

          <Field label={t('instructions')}>
            <Textarea
              value={form.instructions}
              onChange={(e) => set('instructions', e.target.value)}
              placeholder={'1. ...\n2. ...\n3. ...'}
              rows={4}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('rewardAmount')}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.reward}
                  onChange={(e) => set('reward', e.target.value)}
                  className="h-11 pl-7"
                />
              </div>
            </Field>
            <Field label={t('category')}>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label={t('linkField')}>
            <Input
              value={form.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://example.com"
              className="h-11"
            />
          </Field>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="text-sm font-medium">{t('featured')}</p>
              <p className="text-xs text-muted-foreground">{t('availableJobs')}</p>
            </div>
            <Switch checked={form.featured} onCheckedChange={(c) => set('featured', c)} />
          </div>

          <div className="flex items-center justify-between pb-1">
            <div>
              <p className="text-sm font-medium">{t('status')}</p>
              <p className="text-xs text-muted-foreground">{form.enabled ? t('active') : t('disabled')}</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(c) => set('enabled', c)} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12"
            onClick={() => { editJob(null); setAdminView('admin-jobs') }}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" className="flex-1 h-12" disabled={saving}>
            {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}
