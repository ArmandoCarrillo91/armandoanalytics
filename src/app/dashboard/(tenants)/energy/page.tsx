import { createClient } from '@/lib/supabase/server'
import { getClasesAnio } from '@/tenants/energy/dashboards/summary/queries'
import ClasesAnio from '@/tenants/energy/dashboards/summary/charts/clases-anio/ClasesAnio'
import SharePopover from '@/components/SharePopover'

export default async function EnergyPage() {
  const supabase = createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'energy')
    .single()

  const clasesData = await getClasesAnio()

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-black)' }}>
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
      <ClasesAnio data={clasesData} />
    </div>
  )
}
