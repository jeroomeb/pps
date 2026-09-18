import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  Building,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/timezone'
import type { PayoutStatus } from '@/lib/database.types'

export default async function SpecialistEarningsPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  // If the tenant organization has disabled the payouts module, redirect out
  if (!profile.tenant?.enable_payouts) {
    redirect('/inspector')
  }

  // Load specialist's own payouts ledger
  const { data: rawPayouts } = await supabase
    .from('specialist_payouts')
    .select(
      'id, inspection_id, property_id, amount, status, approved_at, paid_at, payment_reference, notes, created_at, properties(name, address)'
    )
    .eq('specialist_id', profile.id)
    .order('created_at', { ascending: false })

  type PayoutItem = {
    id: string
    inspectionId: string
    propertyId: string
    propertyName: string
    propertyAddress: string
    amount: number
    status: PayoutStatus
    approvedAt: string | null
    paidAt: string | null
    paymentReference: string | null
    notes: string | null
    createdAt: string
  }

  const payouts: PayoutItem[] = (rawPayouts ?? []).map((p) => {
    const prop = p.properties as unknown as { name?: string; address?: string } | null
    return {
      id: p.id,
      inspectionId: p.inspection_id,
      propertyId: p.property_id,
      propertyName: prop?.name ?? 'Property',
      propertyAddress: prop?.address ?? '',
      amount: Number(p.amount),
      status: p.status as PayoutStatus,
      approvedAt: p.approved_at,
      paidAt: p.paid_at,
      paymentReference: p.payment_reference,
      notes: p.notes,
      createdAt: p.created_at,
    }
  })

  // Summary aggregates
  const pendingItems = payouts.filter((p) => p.status === 'pending')
  const approvedItems = payouts.filter((p) => p.status === 'approved')
  const paidItems = payouts.filter((p) => p.status === 'paid')

  const pendingTotal = pendingItems.reduce((acc, p) => acc + p.amount, 0)
  const approvedTotal = approvedItems.reduce((acc, p) => acc + p.amount, 0)
  const paidTotal = paidItems.reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Specialist Earnings"
        title="My Audit Compensation &amp; Payouts"
        subtitle="Track compensation for completed property audits, review pending approvals, and view disbursement history."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Pending Review</p>
            <p className="mt-1 font-headline text-2xl font-bold">${pendingTotal.toFixed(2)}</p>
            <p className="text-[11px] text-on-surface-variant">{pendingItems.length} audit(s) awaiting approval</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
            <Clock size={20} />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Approved for Payout</p>
            <p className="mt-1 font-headline text-2xl font-bold text-primary">${approvedTotal.toFixed(2)}</p>
            <p className="text-[11px] text-on-surface-variant">{approvedItems.length} audit(s) approved</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <CheckCircle2 size={20} className="text-primary" />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="label-tracked text-on-surface-variant">Total Paid Out</p>
            <p className="mt-1 font-headline text-2xl font-bold text-success">${paidTotal.toFixed(2)}</p>
            <p className="text-[11px] text-on-surface-variant">{paidItems.length} completed payment(s)</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-container/40 text-success">
            <CreditCard size={20} />
          </div>
        </Card>
      </div>

      {/* Earnings Breakdown Table */}
      {payouts.length > 0 ? (
        <Card padded={false}>
          <table className="hidden w-full text-sm lg:table">
            <thead>
              <tr className="border-b border-outline-variant text-left label-tracked text-on-surface-variant">
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Audit Date</th>
                <th className="px-4 py-3 font-semibold">Compensation</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Settlement Details</th>
                <th className="px-4 py-3 text-right font-semibold">Audit Report</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-outline-variant transition last:border-0 hover:bg-surface-container-low"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Building size={14} className="text-on-surface-variant" />
                      <span>{row.propertyName}</span>
                    </div>
                    {row.propertyAddress && (
                      <p className="text-xs text-on-surface-variant pl-5">{row.propertyAddress}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {formatDate(new Date(row.createdAt))}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-on-surface">
                    ${row.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        row.status === 'paid'
                          ? 'bg-success-container/40 text-success'
                          : row.status === 'approved'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      {row.status === 'pending'
                        ? 'Under Review'
                        : row.status === 'approved'
                          ? 'Approved'
                          : 'Paid'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    {row.paymentReference ? (
                      <div className="font-mono font-semibold text-on-surface">
                        Ref: {row.paymentReference}
                      </div>
                    ) : row.approvedAt ? (
                      <span>Approved {formatDate(new Date(row.approvedAt))}</span>
                    ) : (
                      <span>Awaiting admin review</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/inspector/inspections/${row.inspectionId}`}
                      title="View Inspection Report"
                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
                    >
                      <FileText size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile View */}
          <div className="flex flex-col divide-y divide-outline-variant lg:hidden">
            {payouts.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{row.propertyName}</p>
                  <span className="font-mono font-bold text-sm">${row.amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Completed {formatDate(new Date(row.createdAt))}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      row.status === 'paid'
                        ? 'bg-success-container/40 text-success'
                        : row.status === 'approved'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {row.status}
                  </span>

                  {row.paymentReference && (
                    <span className="font-mono text-xs text-on-surface-variant">
                      Ref: {row.paymentReference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
          <AlertCircle size={28} className="mb-2 text-on-surface-variant/70" />
          <p className="text-sm font-semibold text-on-surface">No compensation records yet</p>
          <p className="text-xs">
            Completed inspections will automatically generate earnings statements here.
          </p>
        </Card>
      )}
    </div>
  )
}
