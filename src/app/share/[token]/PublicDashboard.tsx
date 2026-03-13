'use client'

import ReactECharts from 'echarts-for-react'

interface ChartData {
  id: string
  title: string
  subtitle?: string
  chart_type: string
  display_config: any
  position_x: number
  position_y: number
  width: number
  height: number
}

interface PublicDashboardProps {
  dashboard: {
    id: string
    name: string
    description?: string
    charts: ChartData[]
  }
}

export default function PublicDashboard({ dashboard }: PublicDashboardProps) {
  const sortedCharts = [...(dashboard.charts || [])].sort((a, b) => {
    if (a.position_y !== b.position_y) return a.position_y - b.position_y
    return a.position_x - b.position_x
  })

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-black)',
          marginBottom: '8px',
        }}
      >
        {dashboard.name}
      </h1>
      {dashboard.description && (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-gray)',
            marginBottom: '32px',
          }}
        >
          {dashboard.description}
        </p>
      )}

      {sortedCharts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 0',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          Este dashboard no tiene charts todav&iacute;a
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '16px',
          }}
        >
          {sortedCharts.map((chart) => (
            <div
              key={chart.id}
              style={{
                gridColumn: `span ${chart.width}`,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '16px',
                minHeight: `${chart.height * 60}px`,
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-black)',
                  marginBottom: '4px',
                }}
              >
                {chart.title}
              </div>
              {chart.subtitle && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                  }}
                >
                  {chart.subtitle}
                </div>
              )}
              {chart.display_config?.echarts_option ? (
                <ReactECharts
                  option={chart.display_config.echarts_option}
                  style={{
                    height: `${Math.max(chart.height * 60 - 60, 200)}px`,
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '120px',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                  }}
                >
                  {chart.chart_type}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
