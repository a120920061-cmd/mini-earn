'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Pull-to-refresh hook for mobile. Attach the returned `bind` props to a
 * scrollable container (or the page wrapper). When the user pulls down past
 * the threshold at the top of the scroll, `onRefresh` is called.
 *
 * Only activates on touch devices to avoid interfering with desktop scroll.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(0) // current pull distance in px
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const threshold = 70

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // only track if scrolled to top
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY
    } else {
      startY.current = null
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startY.current === null || refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && window.scrollY <= 0) {
        // dampen the pull (resistance)
        const damped = Math.min(delta * 0.5, threshold + 30)
        setPulling(damped)
      }
    },
    [refreshing]
  )

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return
    if (pulling >= threshold && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPulling(0)
    startY.current = null
  }, [pulling, refreshing, onRefresh])

  const progress = Math.min(pulling / threshold, 1)
  const showIndicator = pulling > 0 || refreshing

  return {
    pulling,
    refreshing,
    progress,
    showIndicator,
    bind: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
