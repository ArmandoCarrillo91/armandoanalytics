'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, NEUTRAL, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

const VERDE = '#86efac'

interface Props {
  data: { semana: string; mo: number; costo_partes: number; margen_partes: number }[]
}

export default function ComposicionServicio({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        let r = `<b>${params[0]?.axisValue || ''}</b>`
        let total = 0
        params.forEach((p: any) => { total += p.value })
        params.forEach((p: any) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0'
          r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)} (${pct}%)`
        })
        r += `<br/><b>Total: ${fmtMoney(total)}</b>`
        return r
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: ink },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 50, right: 20, top: 10, bottom: 40 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.semana),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink, formatter: (v: number) => fmtAxis(v) },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    series: [
      {
        name: 'Mano de obra',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.mo),
        itemStyle: { color: PRIMARY, borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Refacciones',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.costo_partes),
        itemStyle: { color: NEUTRAL },
        barMaxWidth: 24,
      },
      {
        name: 'Margen en partes',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.margen_partes),
        itemStyle: { color: VERDE, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 24,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts onChartReady={onChartReady} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
