'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactECharts from 'echarts-for-react'
import { getDashboards, createDashboard, createChart } from '@/app/actions/dashboards'

const CHART_TYPES = ['line', 'bar', 'pie', 'kpi'] as const

const DEFAULT_SQL = `SELECT
  DATE_TRUNC('day', paid_at)::date as fecha,
  SUM(total_client) as total
FROM services
WHERE paid_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND paid_at IS NOT NULL
GROUP BY 1
ORDER BY 1`

export default function NewChartPage() {
  const router = useRouter()
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [chartType, setChartType] = useState<string>('line')
  const [title, setTitle] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function runQuery() {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, tenantSlug: 'taller' })
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
        return
      }
      const data = json.data ?? []
      setResults(data)
      if (data.length > 0) {
        const cols = Object.keys(data[0])
        setColumns(cols)
        setXAxis(cols[0])
        setYAxis(cols[1] ?? cols[0])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveChart() {
    if (!title || results.length === 0) return
    setSaving(true)
    try {
      const userId = (await (await fetch('/api/me')).json()).id

      let dashboards = await getDashboards('taller')
      let dashboard = dashboards?.[0]

      if (!dashboard) {
        dashboard = await createDashboard('taller', userId, 'Taller Mecánico Rafa')
      }

      await createChart(dashboard.id, 'taller', userId, {
        title,
        chart_type: chartType as any,
        query_config: { sql },
        display_config: {
          x_axis: xAxis,
          y_axis: yAxis,
          format: 'currency',
          currency: 'MXN',
          color: '#0070F3'
        }
      })

      router.push('/dashboard/taller')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function getEChartsOption() {
    if (results.length === 0) return {}
    if (chartType === 'kpi') return {}

    const xData = results.map(r => r[xAxis])
    const yData = results.map(r => r[yAxis])

    return {
      backgroundColor: 'transparent',
      grid: { top: 20, right: 20, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#EAEAEA' } },
        axisLabel: { color: '#6B7280', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F4F4F5' } },
        axisLabel: { color: '#6B7280', fontSize: 11 }
      },
      series: [{
        type: chartType,
        data: yData,
        smooth: true,
        itemStyle: { color: '#0070F3' },
        areaStyle: chartType === 'line' ? {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,112,243,0.12)' },
              { offset: 1, color: 'rgba(0,112,243,0)' }
            ]
          }
        } : undefined
      }],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#FFFFFF',
        borderColor: '#EAEAEA',
        textStyle: { color: '#111111', fontSize: 12 }
      }
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: 0 }}>
          New Chart
        </h1>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
          Write SQL → Preview → Save to dashboard
        </p>
      </div>

      {/* Title input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Chart title..."
          style={{
            width: '100%', padding: '8px 12px',
            border: '1px solid #EAEAEA', borderRadius: '6px',
            fontSize: '13px', color: '#111111', outline: 'none',
            fontFamily: 'Inter, sans-serif'
          }}
        />
      </div>

      {/* SQL Editor */}
      <div style={{ marginBottom: '12px' }}>
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          rows={6}
          style={{
            width: '100%', padding: '12px',
            border: '1px solid #EAEAEA', borderRadius: '6px',
            fontSize: '12px', fontFamily: 'monospace',
            color: '#111111', resize: 'vertical', outline: 'none',
            lineHeight: 1.6
          }}
        />
      </div>

      {/* Run button */}
      <button
        onClick={runQuery}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: '#111111', color: 'white',
          border: 'none', borderRadius: '6px',
          fontSize: '13px', fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {loading ? 'Running...' : 'Run Query →'}
      </button>

      {/* Error */}
      {error && (
        <div style={{ marginTop: '12px', padding: '10px 12px',
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: '6px', fontSize: '12px', color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginTop: '24px' }}>

          {/* Chart type selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {CHART_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${chartType === t ? '#0070F3' : '#EAEAEA'}`,
                  borderRadius: '6px', fontSize: '12px',
                  background: chartType === t ? '#EFF6FF' : 'white',
                  color: chartType === t ? '#0070F3' : '#6B7280',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Axis selectors */}
          {chartType !== 'kpi' && columns.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select value={xAxis} onChange={e => setXAxis(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #EAEAEA',
                  borderRadius: '6px', fontSize: '12px', color: '#111111' }}>
                {columns.map(c => <option key={c} value={c}>{c} (X)</option>)}
              </select>
              <select value={yAxis} onChange={e => setYAxis(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #EAEAEA',
                  borderRadius: '6px', fontSize: '12px', color: '#111111' }}>
                {columns.map(c => <option key={c} value={c}>{c} (Y)</option>)}
              </select>
            </div>
          )}

          {/* Chart preview */}
          {chartType === 'kpi' ? (
            <div style={{ padding: '24px', border: '1px solid #EAEAEA',
              borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#111111' }}>
                {results[0]?.[yAxis] ?? results[0]?.[columns[0]]}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                {title || yAxis}
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid #EAEAEA', borderRadius: '8px', padding: '16px' }}>
              <ReactECharts option={getEChartsOption()} style={{ height: '280px' }} />
            </div>
          )}

          {/* Save button */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={saveChart}
              disabled={saving || !title}
              style={{
                padding: '8px 16px',
                background: '#0070F3', color: 'white',
                border: 'none', borderRadius: '6px',
                fontSize: '13px', fontWeight: 500,
                cursor: saving || !title ? 'not-allowed' : 'pointer',
                opacity: saving || !title ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {saving ? 'Saving...' : 'Save to Dashboard →'}
            </button>
            <button
              onClick={() => router.push('/dashboard/taller')}
              style={{
                padding: '8px 16px',
                background: 'white', color: '#6B7280',
                border: '1px solid #EAEAEA', borderRadius: '6px',
                fontSize: '13px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
