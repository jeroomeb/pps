import { requireGlobalAdmin } from '@/lib/auth/dal'
import { getGrowthLeads, getGrowthLeadStats } from '@/lib/actions/leads'
import { LeadsDashboardClient } from './LeadsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  await requireGlobalAdmin()

  const [{ leads, total }, stats] = await Promise.all([
    getGrowthLeads({ pageSize: 100 }),
    getGrowthLeadStats(),
  ])

  return (
    <div className="w-full">
      <LeadsDashboardClient initialLeads={leads} initialTotal={total} initialStats={stats} />
    </div>
  )
}

