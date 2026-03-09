'use client'

import ReactECharts from 'echarts-for-react'

const option = {
  backgroundColor: 'transparent',
  grid: { top: 16, right: 24, bottom: 16, left: 16, containLabel: true },
  xAxis: { type: 'value' as const, show: false },
  yAxis: {
    type: 'category' as const,
    data: [],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: 'rgba(255,255,255,0.3)',
      fontFamily: 'JetBrains Mono',
      fontSize: 10,
    },
  },
  series: [
    {
      type: 'bar' as const,
      data: [],
      barMaxWidth: 12,
      borderRadius: [0, 4, 4, 0] as [number, number, number, number],
      itemStyle: { color: 'rgba(0,112,243,0.7)' },
      emphasis: { itemStyle: { color: '#0070F3' } },
    },
  ],
  tooltip: {
    trigger: 'axis' as const,
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: {
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'JetBrains Mono',
      fontSize: 11,
    },
  },
}

export default function GastosCategoriaChart() {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 24,
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: 3,
          fontFamily: 'var(--font-jetbrains)',
          display: 'block',
          marginBottom: 16,
        }}
      >
        GASTOS POR CATEGORÍA
      </span>
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  )
}
