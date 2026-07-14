import { PropertyForm } from '@/components/PropertyForm'
import { createProperty } from '@/lib/actions/properties'

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Properties
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">New Property</h1>
      <PropertyForm action={createProperty} />
    </div>
  )
}
