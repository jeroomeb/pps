import { requireRole } from '@/lib/auth/dal'
import { getGrowthLeads, getGrowthLeadStats } from '@/lib/actions/leads'
import { LeadsDashboardClient } from './LeadsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  await requireRole('admin')

  const [{ leads, total }, stats] = await Promise.all([
    getGrowthLeads({ pageSize: 100 }),
    getGrowthLeadStats(),
  ])

  return (
    <main className="flex-1 p-4 lg:p-8">
      <LeadsDashboardClient initialLeads={leads} initialTotal={total} initialStats={stats} />
    </main>
  )
}

