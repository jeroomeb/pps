import { requireGlobalAdmin } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { CreateTenantForm } from '@/components/CreateTenantForm'
import { TenantLicenseCard, type TenantItem } from '@/components/TenantLicenseCard'
import { Card } from '@/components/ui/Card'
import { Building, KeyRound, Users, ShieldCheck } from 'lucide-react'

export default async function TenantsPage() {
  await requireGlobalAdmin()
  const supabase = await createClient()

  const [{ data: tenants }, { data: properties }, { data: profiles }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, slug, license_tier, max_property_licenses, status, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('properties').select('id, tenant_id'),
    supabase.from('profiles').select('id, tenant_id'),
  ])

  const propertyCounts = new Map<string, number>()
  for (const p of properties ?? []) {
    if (p.tenant_id) {
      propertyCounts.set(p.tenant_id, (propertyCounts.get(p.tenant_id) ?? 0) + 1)
    }
  }

  const staffCounts = new Map<string, number>()
  for (const u of profiles ?? []) {
    if (u.tenant_id) {
      staffCounts.set(u.tenant_id, (staffCounts.get(u.tenant_id) ?? 0) + 1)
    }
  }

  const tenantItems: TenantItem[] = (tenants ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    license_tier: t.license_tier,
    max_property_licenses: t.max_property_licenses,
    status: t.status,
    created_at: t.created_at,
    propertyCount: propertyCounts.get(t.id) ?? 0,
    staffCount: staffCounts.get(t.id) ?? 0,
  }))

  const totalTenants = tenantItems.length
  const totalAllocatedLicenses = tenantItems.reduce((acc, t) => acc + t.max_property_licenses, 0)
  const totalActiveProperties = tenantItems.reduce((acc, t) => acc + t.propertyCount, 0)

  const parentTenantsList = (tenants ?? []).map((t) => ({ id: t.id, name: t.name }))

  return (
    <div>
      <PageHeader
        eyebrow="Global Management Layer"
        title="Tenants & Licenses"
        subtitle="Shared Database, Shared Schema Multi-Tenant Administration & Building SKU Allocations"
        action={<CreateTenantForm parentTenants={parentTenantsList} />}
      />

      {/* Overview KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Subscribed Tenants</p>
            <p className="font-headline text-3xl font-bold">{totalTenants}</p>
          </div>
          <Building size={28} className="text-primary" />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Active Property SKUs</p>
            <p className="font-headline text-3xl font-bold">{totalActiveProperties}</p>
          </div>
          <KeyRound size={28} className="text-primary" />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Total Licensed Capacity</p>
            <p className="font-headline text-3xl font-bold">{totalAllocatedLicenses}</p>
          </div>
          <ShieldCheck size={28} className="text-primary" />
        </Card>
      </div>

      {/* Tenants Grid */}
      <section>
        <h2 className="mb-4 font-headline text-lg font-semibold">Corporate Accounts ({tenantItems.length})</h2>

        {tenantItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tenantItems.map((tenant) => (
              <TenantLicenseCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-on-surface-variant">
            No tenants provisioned yet. Use the Provision Tenant button above to create the first corporate account.
          </Card>
        )}
      </section>
    </div>
  )
}
