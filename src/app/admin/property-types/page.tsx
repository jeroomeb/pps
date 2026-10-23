import { requireGlobalAdmin } from '@/lib/auth/dal'
import { PageHeader } from '@/components/ui/PageHeader'
import { getAllPropertyTypes } from '@/lib/property-types'
import { PropertyTypesManager } from '@/components/PropertyTypesManager'

export default async function PropertyTypesPage() {
  await requireGlobalAdmin()
  const propertyTypes = await getAllPropertyTypes()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Administration"
        title="Manage Property Types"
        backHref="/admin/properties"
        backLabel="Properties"
      />
      <PropertyTypesManager initialPropertyTypes={propertyTypes} />
    </div>
  )
}
