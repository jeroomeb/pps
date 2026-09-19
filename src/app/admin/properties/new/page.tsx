import Link from 'next/link'
import { AlertCircle, KeyRound, ArrowLeft } from 'lucide-react'
import { PropertyForm } from '@/components/PropertyForm'
import { createProperty } from '@/lib/actions/properties'
import { PageHeader } from '@/components/ui/PageHeader'
import { getTenantLicenseSummary, getProfile } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'

export default async function NewPropertyPage() {
  const [licenseSummary, profile, supabase] = await Promise.all([
    getTenantLicenseSummary(),
    getProfile(),
    createClient(),
  ])

  const { data: tenants } = profile.is_global_admin
    ? await supabase.from('tenants').select('id, name').order('name')
    : { data: null }

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Properties"
        title="New Property"
        backHref="/admin/properties"
        backLabel="Properties"
      />

      {licenseSummary && (
        <div className="mb-6">
          {licenseSummary.isAtCapacity ? (
            <Card className="border-error/40 bg-error-container/20">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 text-error mt-0.5" />
                <div>
                  <h3 className="font-headline font-bold text-on-error-container">
                    Property License Limit Reached
                  </h3>
                  <p className="mt-1 text-sm text-on-error-container">
                    Your account has allocated all <strong>{licenseSummary.maxProperties}</strong> property license SKU units on your <strong>{licenseSummary.licenseTier}</strong> plan.
                  </p>
                  <p className="mt-2 text-xs text-on-error-container">
                    To add more properties, please contact your administrator or Amenity Op&apos;s support to expand your corporate license tier.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound size={14} className="text-primary" />
                Property License SKU: {licenseSummary.usedProperties} of {licenseSummary.maxProperties} used
              </span>
              <span className="font-semibold text-primary">
                {licenseSummary.remainingLicenses} license{licenseSummary.remainingLicenses === 1 ? '' : 's'} remaining
              </span>
            </div>
          )}
        </div>
      )}

      <PropertyForm action={createProperty} tenants={tenants ?? undefined} />
    </div>
  )
}
