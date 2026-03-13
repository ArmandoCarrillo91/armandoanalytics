'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { Agg } from '@/types/taller'

const AGG_OPTIONS: { value: Agg; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
]

interface Props {
  desde: string
  hasta: string
  agg: Agg
  basePath: string
}

export default function DateRangePicker({ desde, hasta, agg, basePath }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [start, setStart] = useState(desde)
  const [end, setEnd] = useState(hasta)
  const [selectedAgg, setSelectedAgg] = useState<Agg>(agg)

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('desde', start)
    params.set('hasta', end)
    params.set('agg', selectedAgg)
    router.push(`${basePath}?${params.toString()}`)
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    padding: '6px 10px',
    border: '1px solid var(--taller-border)',
    borderRadius: 6,
    background: 'var(--taller-surface)',
    color: 'var(--taller-ink)',
    outline: 'none',
  }

  return (
    <div className="taller-datepicker">
      <input
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        style={inputStyle}
      />
      <span style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>→</span>
      <input
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        style={inputStyle}
      />

      {/* Aggregation selector */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--taller-border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {AGG_OPTIONS.map((opt) => {
          const active = selectedAgg === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setSelectedAgg(opt.value)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                padding: '6px 10px',
                border: 'none',
                borderRight: '1px solid var(--taller-border)',
                background: active ? 'var(--taller-green)' : 'var(--taller-surface)',
                color: active ? '#ffffff' : 'var(--taller-ink)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <button
        onClick={apply}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          padding: '6px 14px',
          border: '1px solid var(--taller-green)',
          borderRadius: 6,
          background: 'var(--taller-green)',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Aplicar
      </button>
    </div>
  )
}
