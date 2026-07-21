import { PropertyForm } from '@/components/PropertyForm'
import { createProperty } from '@/lib/actions/properties'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NewPropertyPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Properties" title="New Property" />
      <PropertyForm action={createProperty} />
    </div>
  )
}
