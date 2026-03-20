import { createClient } from '@/lib/supabase/server'
import {
  getOcupacionHoy,
  getIngresosAcumulados,
  getKPIsMes,
  getTendencia,
  getTicketPromedio,
} from '@/tenants/energy/dashboards/summary/queries'
import EnergyShell from '@/tenants/energy/dashboards/summary/EnergyShell'
import SharePopover from '@/components/SharePopover'

export default async function EnergyPage() {
  const supabase = await createClient()

  const [
    { data: tenant },
    ocupacion,
    ingresosAcumulados,
    kpis,
    tendencia,
    ticketPromedio,
  ] = await Promise.all([
    supabase.from('tenants').select('id').eq('slug', 'energy').single(),
    getOcupacionHoy(),
    getIngresosAcumulados(),
    getKPIsMes(),
    getTendencia(),
    getTicketPromedio(),
  ])

  return (
    <div style={{ padding: '2rem', background: '#111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#F0EEE8' }}>
          Energy Cycle Studio
        </h1>
        {tenant && (
          <SharePopover
            dashboardSlug="summary"
            tenantId={tenant.id}
            tenantName="Energy Cycle Studio"
            dashboardName="Summary"
          />
        )}
      </div>
      <EnergyShell
        ocupacion={ocupacion}
        ingresosAcumulados={ingresosAcumulados}
        kpis={kpis}
        tendencia={tendencia}
        ticketPromedio={ticketPromedio}
      />
    </div>
  )
}
