'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, WARNING, NEUTRAL, FONT } from '../chartColors'
import { fmtAxisCount } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { tipo: string; cantidad: number }[]
}

const PALETTE = [PRIMARY, WARNING, NEUTRAL, '#3b82f6']

export default function TiposServicio({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const sorted = [...data].sort((a, b) => a.cantidad - b.cantidad)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink, formatter: (v: number) => fmtAxisCount(v) },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.tipo),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d, i) => ({
          value: d.cantidad,
          itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: [0, 3, 3, 0] },
        })),
        barMaxWidth: 18,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts onChartReady={onChartReady} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
