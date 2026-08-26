'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { cn } from '@/lib/utils'

/**
 * Wraps children with pull-to-refresh support. Shows a spinner indicator at
 * the top while pulling or refreshing. The whole page scroll is used.
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
}) {
  const { progress, refreshing, showIndicator, bind } = usePullToRefresh(onRefresh)

  return (
    <div {...bind} className="min-h-screen flex flex-col">
      {/* pull indicator */}
      <div
        className={cn(
          'fixed top-0 inset-x-0 z-50 grid place-items-center transition-opacity pointer-events-none',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{ height: '40px', transform: `translateY(${showIndicator ? 4 : -40}px)` }}
      >
        <div
          className={cn(
            'size-8 rounded-full grid place-items-center shadow-md transition-colors',
            refreshing ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border'
          )}
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw
              className="size-4 transition-transform"
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
