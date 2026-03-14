'use client'

import { useRef, useEffect } from 'react'
import type ReactECharts from 'echarts-for-react'

export function useChartResize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    const el = containerRef.current
    const instance = chartRef.current?.getEchartsInstance()
    if (!el || !instance) return

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { containerRef, chartRef }
}
