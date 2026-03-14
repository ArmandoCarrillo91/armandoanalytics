'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ChartThemeColors {
  ink: string
  muted: string
  border: string
  surface: string
}

const LIGHT: ChartThemeColors = {
  ink: '#1a1814',
  muted: '#97928a',
  border: '#e5e1d8',
  surface: '#ffffff',
}

const DARK: ChartThemeColors = {
  ink: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.40)',
  border: 'rgba(255,255,255,0.10)',
  surface: '#1a1a1a',
}

export function useChartColors(): ChartThemeColors {
  const { resolvedTheme } = useTheme()
  const [colors, setColors] = useState(LIGHT)

  useEffect(() => {
    setColors(resolvedTheme === 'dark' ? DARK : LIGHT)
  }, [resolvedTheme])

  return colors
}
