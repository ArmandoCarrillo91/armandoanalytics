'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, FONT } from '../chartColors'
import { fmtAxisCount } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { dia: string; total: number; cobrados: number }[]
}

export default function ServiciosDiarios({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        const p = params[0]
        return p ? `<b>${p.axisValue}</b><br/>${p.marker} Cobrados: ${p.value}` : ''
      },
    },
    grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.dia),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink, formatter: (v: number) => fmtAxisCount(v) },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    series: [
      {
        name: 'Cobrados',
        type: 'bar',
        data: data.map((d) => d.cobrados),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 9,
          color: ink,
          formatter: (p: any) => (p.value > 0 ? String(p.value) : ''),
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts onChartReady={onChartReady} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
