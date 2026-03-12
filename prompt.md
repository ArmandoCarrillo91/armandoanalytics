Build the complete dashboard flow. Three states in one page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — Update app/dashboard/taller/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This page has 3 states:

STATE A — No dashboards exist:
  Centered empty state:
  - Icon: simple grid icon (SVG, 32px, #A1A1AA)
  - Title: "No dashboards yet" — Inter 15px 500, #111111
  - Subtitle: "Create your first dashboard to start analyzing data"
    Inter 13px, #6B7280
  - Button "+ New Dashboard" — onClick opens inline input

STATE B — Dashboards exist, none selected:
  List of dashboard cards:
  - Each card: border 1px solid #EAEAEA, border-radius 8px, padding 16px
  - Dashboard name: Inter 14px 500, #111111
  - Chart count: "X charts" — Inter 12px, #6B7280
  - Created date: Inter 11px, #A1A1AA
  - Full card clickable → goes to STATE C
  - Top right: "+ New Dashboard" button

STATE C — Dashboard selected (charts view):
  URL: /dashboard/taller?d={dashboard_id}
  - Dashboard name as page title (below topbar)
  - Grid of chart cards — 2 columns
  - Each chart card: border 1px solid #EAEAEA, border-radius 8px
    title, chart type badge, rendered ECharts preview
  - Empty state per card: "No data" — #A1A1AA centered
  - "+" button in topbar → /dashboard/taller/new-chart?d={dashboard_id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — Create Dashboard inline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When user clicks "+ New Dashboard":
- Show inline input field (no modal, no page change)
- Placeholder: "Dashboard name..."
- Press Enter or click "Create" to save
- Calls createDashboard('taller', userId, name)
- On success: navigate to STATE C with new dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — Update new-chart page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Update app/dashboard/taller/new-chart/page.tsx:
- Read dashboard_id from URL searchParams: ?d={dashboard_id}
- On save: use that dashboard_id instead of fetching first dashboard
- On cancel: go back to /dashboard/taller?d={dashboard_id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — Render saved charts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each chart in STATE C:
- Read chart.query_config.sql
- Call /api/query with that SQL and tenantSlug: 'taller'
- Render with ECharts using chart.display_config
- Show loading skeleton while fetching
- Show "Query error" in red if SQL fails

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm run build — zero errors
