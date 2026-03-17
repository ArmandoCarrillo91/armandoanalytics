'use client'

import { useRef, useCallback } from 'react'
import type { ECharts } from 'echarts'

export function useChartResize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const onChartReady = useCallback((instance: ECharts) => {
    const el = containerRef.current
    if (!el) return

    // Clean up previous observer if any
    observerRef.current?.disconnect()

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(el)
    observerRef.current = observer
  }, [])

  return { containerRef, onChartReady }
}
