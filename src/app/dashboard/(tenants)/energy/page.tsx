import { createClient } from '@/lib/supabase/server'
import {
  getOcupacionHoy,
  getIngresosAcumulados,
  getKPIsMes,
  getTotalBicis,
  getIngresosAcumuladosMesAnterior,
  getHorasAcumuladasMes,
  getOcupacionSemanal,
  getChurnRisk,
  getClasesBajaOcupacionManana,
  getListosRenovar,
} from '@/tenants/energy/dashboards/summary/queries'
import EnergyShell from '@/tenants/energy/dashboards/summary/EnergyShell'
import SharePopover from '@/components/SharePopover'

export default async function EnergyPage() {
  const supabase = createClient()

  const [
    { data: tenant },
    ocupacion,
    ingresosAcumulados,
    kpis,
    totalBicis,
    ingresosAnterior,
    horasMes,
    heatmap,
    churnRisk,
    clasesBajas,
    listosRenovar,
  ] = await Promise.all([
    supabase.from('tenants').select('id').eq('slug', 'energy').single(),
    getOcupacionHoy(),
    getIngresosAcumulados(),
    getKPIsMes(),
    getTotalBicis(),
    getIngresosAcumuladosMesAnterior(),
    getHorasAcumuladasMes(),
    getOcupacionSemanal(),
    getChurnRisk(),
    getClasesBajaOcupacionManana(),
    getListosRenovar(),
  ])

  return (
    <div style={{ padding: '20px 24px', background: '#0F0F0F', minHeight: '100vh' }}>
      {tenant && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <SharePopover
            dashboardSlug="summary"
            tenantId={tenant.id}
            tenantName="Energy Cycle Studio"
            dashboardName="Summary"
          />
        </div>
      )}
      <EnergyShell
        ocupacion={ocupacion}
        kpis={kpis}
        totalBicis={totalBicis}
        ingresosAcumulados={ingresosAcumulados}
        ingresosAnterior={ingresosAnterior}
        horasMes={horasMes}
        churnRisk={churnRisk}
        clasesBajas={clasesBajas}
        listosRenovar={listosRenovar}
        heatmap={heatmap}
      />
    </div>
  )
}
