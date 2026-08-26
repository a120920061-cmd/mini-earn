'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power, Loader2, Briefcase, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { api, formatMoney, timeAgo } from '@/lib/api'
import { toast } from 'sonner'
import type { JobItem } from '@/components/jobs/job-card'

export function AdminJobsManager() {
  const { t, lang } = useT()
  const editJob = useAppStore((s) => s.editJob)
  const [jobs, setJobs] = useState<JobItem[] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    const res = await api<{ jobs: JobItem[] }>('/api/jobs?all=true')
    if (res.ok && res.data) setJobs(res.data.jobs)
    else setJobs([])
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<{ jobs: JobItem[] }>('/api/jobs?all=true')
      if (!alive) return
      if (res.ok && res.data) setJobs(res.data.jobs)
      else setJobs([])
    })()
    return () => { alive = false }
  }, [])

  async function toggleEnabled(job: JobItem, enabled: boolean) {
    // optimistic
    setJobs((prev) => prev?.map((j) => (j.id === job.id ? { ...j, enabled } : j)) || null)
    const res = await api(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
      toast.error('Failed to update')
      load()
    } else {
      toast.success(enabled ? t('enable') : t('disable'))
    }
  }

  async function toggleFeatured(job: JobItem, featured: boolean) {
    setJobs((prev) => prev?.map((j) => (j.id === job.id ? { ...j, featured } : j)) || null)
    const res = await api(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ featured }),
    })
    if (!res.ok) {
      toast.error('Failed')
      load()
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await api(`/api/jobs/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      toast.success(t('deleteJob'))
      setDeleteId(null)
      load()
    } else {
      toast.error('Failed')
    }
  }

  if (jobs === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-view-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('manageJobs')}</h1>
          <p className="text-sm text-muted-foreground">{jobs.length} {t('totalJobs').toLowerCase()}</p>
        </div>
        <Button onClick={() => editJob(null)} className="h-10">
          <Plus className="size-4.5" />
          <span className="hidden sm:inline">{t('addJob')}</span>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('noJobsYet')}</p>
          <Button className="mt-4" onClick={() => editJob(null)}>
            <Plus className="size-4" /> {t('addJob')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className={`p-4 ${!job.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Briefcase className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{job.title}</h3>
                    {job.featured && (
                      <Badge variant="secondary" className="gap-1 text-[10px] h-5 px-1.5">
                        <Star className="size-3 fill-current" /> {t('featured')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{job.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="font-bold text-primary">{formatMoney(job.reward, t('taka'))}</span>
                    <span>·</span>
                    <span className="capitalize">{job.category}</span>
                    <span>·</span>
                    <span>{timeAgo(job.createdAt, lang)}</span>
                  </div>
                </div>
              </div>

              {/* controls */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-xs text-muted-foreground">{t('status')}</span>
                  <Switch
                    checked={!!job.enabled}
                    onCheckedChange={(c) => toggleEnabled(job, c)}
                  />
                  <span className={`text-xs font-medium ${job.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {job.enabled ? t('active') : t('disabled')}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => editJob(job.id)}>
                  <Pencil className="size-3.5" />
                  {t('edit')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleFeatured(job, !job.featured)}>
                  <Star className={`size-3.5 ${job.featured ? 'fill-current text-amber-500' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(job.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteJob')}?</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
