Implement the login page from the Stitch design screenshot + dashboard shell.
The logo SVGs already exist in public/brand/ — use them throughout.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 0 — VERIFY LOGO FILES EXIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run: ls public/brand/
Expected files: logo-icon-default.svg, logo-icon-navbar.svg, logo-wordmark.svg
If missing: run npm run generate:logo first

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — app/login/page.tsx + login.module.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recreate the Stitch design pixel-perfect. Split layout:

LEFT PANEL (60%, dark navy #0D1117):
- Top-left corner: "SYSTEM_NODE: 0X4492 // LAT: 40.7128 N" — 10px mono, rgba(255,255,255,0.2)
- Center: 2×2 grid of locked metric cards, dark border rgba(255,255,255,0.06):
    A1 // MONTHLY REVENUE  → blurred blue bar
    B1 // FREE CASH FLOW   → blurred green bar  
    A2 // MARGIN %         → blurred amber bar
    B2 // SERVICES DELTA   → blurred gray bar
  Each card: lock icon top-right, "SIGN IN TO VIEW" in #0070F3 bottom-left
  Blur effect: filter: blur(8px) on a colored div
- Bottom-left: "ENCRYPTION: AES-256-GCM" — 10px mono, rgba(255,255,255,0.15)

RIGHT PANEL (40%, #F5F5F5):
- Top-left: 
    <img src="/brand/logo-icon-default.svg" width="32" height="32" />
    "ARMANDOANALYTICS" — bold mono, dark, letter-spacing 2px
- Headline: "EXECUTE LOGIN" — 48px, 800 weight, mono, #0D1117, letter-spacing -1px
- Subtext: "ACCESSING TERMINAL INTERFACE V2.04.1" — 11px, rgba(0,0,0,0.3), spacing 3px
- Fields (bottom-border ONLY, no box border):
    label "01 / USER_EMAIL" → email input
    label "02 / ACCESS_KEY" → password input
- Button: full width, background #0D1117, color white, "RUN LOGIN QUERY ▸" 
  font: mono 13px 700, border-radius 4px, height 52px
  hover: background #0070F3, transition 0.2s
- Link: "RESET ACCESS CREDENTIALS" — 10px, rgba(0,0,0,0.25), centered
- Footer: 
    green dot (6px, #22C55E, box-shadow 0 0 6px #22C55E) 
    "SYSTEM ACTIVE · V2.0.412-STABLE · NODE_01" — 10px mono, rgba(0,0,0,0.2)

FONT: JetBrains Mono via next/font/google
STYLES: CSS Modules only (login.module.css) — no Tailwind

AUTH LOGIC ('use client'):
  import { createClient } from '@/lib/supabase/client'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleLogin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('CREDENCIALES INVÁLIDAS — INTENTA DE NUEVO')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  Button text states:
  - idle:    "RUN LOGIN QUERY ▸"
  - loading: "EXECUTING..." (disabled)
  - error:   show error message above button in red mono 11px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — Dashboard shell
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Files to create:
  app/dashboard/taller/page.tsx          (Server Component)
  components/taller/TallerDashboard.tsx  (Client Component, 'use client')
  components/taller/KPIStrip.tsx         (Client Component, 'use client')
  components/taller/FlujoDiarioChart.tsx (Client Component, 'use client')
  components/taller/GastosCategoriaChart.tsx (Client Component, 'use client')

━━━ app/dashboard/taller/page.tsx ━━━
Server Component:
- import { createClient } from '@/lib/supabase/server'
- const { data: { user } } = await supabase.auth.getUser()
- if (!user) redirect('/login')
- Pass user to TallerDashboard
- NO data fetching yet — placeholder props only

━━━ components/taller/TallerDashboard.tsx ━━━
'use client'
Full layout, background #0D1117, font JetBrains Mono:

TOP BAR (border-bottom: 1px solid rgba(255,255,255,0.06)):
  Left:  <img src="/brand/logo-icon-navbar.svg" w=28 h=28 /> 
         "TALLER MECÁNICO RAFA" — 13px 600 white
         Badge: "TENANT_01" — 9px mono, rgba(255,255,255,0.2), 
                border 1px rgba(255,255,255,0.08), border-radius 4px, px-2
  Right: user.email — 11px mono, rgba(255,255,255,0.3)

KPI STRIP:
  <KPIStrip /> — 4 metric cards horizontal

CHARTS GRID (2 columns, gap 16px, padding 24px):
  Left 65%:  <FlujoDiarioChart />
  Right 35%: <GastosCategoriaChart />

━━━ components/taller/KPIStrip.tsx ━━━
4 cards horizontal, background rgba(255,255,255,0.02), 
border 1px solid rgba(255,255,255,0.05), border-radius 8px:

  INGRESOS      | FLUJO LIBRE   | MARGEN        | SERVICIOS
  "—"           | "—"           | "—"           | "—"
  value: 32px 800 white
  label: 9px mono rgba(255,255,255,0.25) letter-spacing 3px
  All values placeholder "—" for now

━━━ components/taller/FlujoDiarioChart.tsx ━━━
'use client'
import ReactECharts from 'echarts-for-react'

Full card: background rgba(255,255,255,0.02), border rgba(255,255,255,0.05), 
border-radius 8px, padding 24px

Card header: "FLUJO DIARIO" label (9px mono) + period badge "30D"

ECharts option with dark theme:
{
  backgroundColor: 'transparent',
  grid: { top: 40, right: 16, bottom: 40, left: 48, containLabel: true },
  xAxis: {
    type: 'category',
    data: ['placeholder'],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    axisTick: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono', fontSize: 10 },
    splitLine: { show: false }
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } }
  },
  series: [
    { name: 'Ingresos',    type: 'line', data: [], smooth: true,
      lineStyle: { color: '#0070F3', width: 2 },
      itemStyle: { color: '#0070F3' },
      areaStyle: { color: 'rgba(0,112,243,0.08)' } },
    { name: 'Egresos',     type: 'line', data: [], smooth: true,
      lineStyle: { color: 'rgba(255,255,255,0.2)', width: 1.5 },
      itemStyle: { color: 'rgba(255,255,255,0.2)' } },
    { name: 'Flujo libre', type: 'line', data: [], smooth: true,
      lineStyle: { color: '#22C55E', width: 2 },
      itemStyle: { color: '#22C55E' },
      areaStyle: { color: 'rgba(34,197,94,0.06)' } }
  ],
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono', fontSize: 11 }
  },
  legend: {
    data: ['Ingresos', 'Egresos', 'Flujo libre'],
    textStyle: { color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', fontSize: 10 },
    top: 0, right: 0
  }
}

━━━ components/taller/GastosCategoriaChart.tsx ━━━
'use client'
import ReactECharts from 'echarts-for-react'

Same card style as FlujoDiarioChart.
Header: "GASTOS POR CATEGORÍA"

ECharts option:
{
  backgroundColor: 'transparent',
  grid: { top: 16, right: 24, bottom: 16, left: 16, containLabel: true },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: [],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono', fontSize: 10 }
  },
  series: [{
    type: 'bar',
    data: [],
    barMaxWidth: 12,
    borderRadius: [0, 4, 4, 0],
    itemStyle: { color: 'rgba(0,112,243,0.7)' },
    emphasis: { itemStyle: { color: '#0070F3' } }
  }],
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13,17,23,0.95)',
    borderColor: 'rgba(255,255,255,0.08)',
    textStyle: { color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono', fontSize: 11 }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS ABSOLUTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER getSession() — always getUser()
- Calculations only in SQL, never in components
- ECharts only renders, never calculates
- Max 200 lines per file — split if needed
- 'use client' = first line, no exceptions for ECharts components
- After ALL files created, run: npm run build
- Zero build errors before finishing
- Commit: git commit -m "feat: login stitch design + dashboard shell"