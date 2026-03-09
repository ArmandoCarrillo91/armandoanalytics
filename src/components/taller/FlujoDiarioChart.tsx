'use client'

import ReactECharts from 'echarts-for-react'

const option = {
  backgroundColor: 'transparent',
  grid: { top: 40, right: 16, bottom: 40, left: 48, containLabel: true },
  xAxis: {
    type: 'category' as const,
    data: ['placeholder'],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    axisTick: { show: false },
    axisLabel: {
      color: 'rgba(255,255,255,0.25)',
      fontFamily: 'JetBrains Mono',
      fontSize: 10,
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: 'rgba(255,255,255,0.25)',
      fontFamily: 'JetBrains Mono',
      fontSize: 10,
    },
    splitLine: {
      lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' as const },
    },
  },
  series: [
    {
      name: 'Ingresos',
      type: 'line' as const,
      data: [],
      smooth: true,
      lineStyle: { color: '#0070F3', width: 2 },
      itemStyle: { color: '#0070F3' },
      areaStyle: { color: 'rgba(0,112,243,0.08)' },
    },
    {
      name: 'Egresos',
      type: 'line' as const,
      data: [],
      smooth: true,
      lineStyle: { color: 'rgba(255,255,255,0.2)', width: 1.5 },
      itemStyle: { color: 'rgba(255,255,255,0.2)' },
    },
    {
      name: 'Flujo libre',
      type: 'line' as const,
      data: [],
      smooth: true,
      lineStyle: { color: '#22C55E', width: 2 },
      itemStyle: { color: '#22C55E' },
      areaStyle: { color: 'rgba(34,197,94,0.06)' },
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
  legend: {
    data: ['Ingresos', 'Egresos', 'Flujo libre'],
    textStyle: {
      color: 'rgba(255,255,255,0.3)',
      fontFamily: 'JetBrains Mono',
      fontSize: 10,
    },
    top: 0,
    right: 0,
  },
}

export default function FlujoDiarioChart() {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: 3,
            fontFamily: 'var(--font-jetbrains)',
          }}
        >
          FLUJO DIARIO
        </span>
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: 'var(--font-jetbrains)',
          }}
        >
          30D
        </span>
      </div>
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  )
}
