import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { AdminPayoutsManager, type AdminPayoutRow } from '@/components/AdminPayoutsManager'
import type { PayoutStatus } from '@/lib/database.types'

export default async function AdminPayoutsPage() {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  // Load tenant payout configuration
  let tenantConfig = {
    enable_payouts: false,
    default_payout_rate: 75.0,
  }

  if (profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('enable_payouts, default_payout_rate')
      .eq('id', profile.tenant_id)
      .single()

    if (tenant) {
      tenantConfig = {
        enable_payouts: tenant.enable_payouts ?? false,
        default_payout_rate: Number(tenant.default_payout_rate ?? 75.0),
      }
    }
  }

  // Load payouts ledger with property and specialist names
  const { data: rawPayouts } = await supabase
    .from('specialist_payouts')
    .select(
      'id, inspection_id, specialist_id, property_id, amount, status, approved_at, paid_at, payment_reference, notes, created_at, properties(name), profiles!specialist_payouts_specialist_id_fkey(full_name, human_id)'
    )
    .order('created_at', { ascending: false })

  const payouts: AdminPayoutRow[] = (rawPayouts ?? []).map((p) => {
    const prop = p.properties as unknown as { name?: string } | null
    const spec = p.profiles as unknown as { full_name?: string; human_id?: string | null } | null

    return {
      id: p.id,
      inspectionId: p.inspection_id,
      specialistId: p.specialist_id,
      specialistName: spec?.full_name ?? 'Specialist',
      specialistHumanId: spec?.human_id ?? null,
      propertyId: p.property_id,
      propertyName: prop?.name ?? 'Property',
      amount: Number(p.amount),
      status: p.status as PayoutStatus,
      approvedAt: p.approved_at,
      paidAt: p.paid_at,
      paymentReference: p.payment_reference,
      notes: p.notes,
      createdAt: p.created_at,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Financials"
        title="Specialist Payouts &amp; Compensation"
        subtitle="Manage per-inspection compensation rates, review pending audit disbursements, and record settlements."
      />

      <AdminPayoutsManager
        tenantId={profile.tenant_id ?? '00000000-0000-0000-0000-000000000001'}
        initialEnabled={tenantConfig.enable_payouts}
        initialDefaultRate={tenantConfig.default_payout_rate}
        payouts={payouts}
      />
    </div>
  )
}
