'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, NEGATIVE, NEUTRAL, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  ingresos: number
  costoPartes: number
  nomina: number
  gastosOp: number
  utilidad: number
}

export default function WaterfallUtilidad({
  ingresos,
  costoPartes,
  nomina,
  gastosOp,
  utilidad,
}: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const categories = ['Ingresos', 'Costo partes', 'Nómina', 'Gastos op.', 'Utilidad']

  const afterCosto = ingresos - costoPartes
  const afterNomina = afterCosto - nomina
  const afterGastos = afterNomina - gastosOp

  // Transparent offset bars (waterfall base)
  const baseData = [0, afterCosto, afterNomina, afterGastos, utilidad >= 0 ? 0 : utilidad]
  // Visible bars
  const visibleData = [ingresos, costoPartes, nomina, gastosOp, Math.abs(utilidad)]
  const barColors = [PRIMARY, NEGATIVE, NEGATIVE, NEUTRAL, utilidad >= 0 ? PRIMARY : NEGATIVE]

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        const p = params.find((s: any) => s.seriesIndex === 1)
        if (!p) return ''
        const idx = p.dataIndex
        const sign = idx > 0 && idx < 4 ? '\u2212' : ''
        return `${p.name}<br/>${sign}${fmtMoney(p.value)}`
      },
    },
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontFamily: FONT, fontSize: 11, color: ink },
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
        name: 'Base',
        type: 'bar',
        stack: 'total',
        silent: true,
        itemStyle: {
          borderColor: 'rgba(0,0,0,0)',
          color: 'rgba(0,0,0,0)',
        },
        emphasis: {
          itemStyle: {
            borderColor: 'rgba(0,0,0,0)',
            color: 'rgba(0,0,0,0)',
          },
        },
        data: baseData,
      },
      {
        name: 'Valor',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 50,
        itemStyle: {
          color: (params: any) => barColors[params.dataIndex],
          borderRadius: [3, 3, 0, 0],
        },
        data: visibleData,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 10,
          color: ink,
          formatter: (p: any) => fmtMoney(p.value),
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts
        onChartReady={onChartReady}
        option={option}
        notMerge={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
