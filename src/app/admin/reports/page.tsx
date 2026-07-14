import { createClient } from '@/lib/supabase/server'
import { ResendEmailButton } from '@/components/ResendEmailButton'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      'id, completed_at, pdf_path, properties(name), checklist_templates(name), profiles(full_name)'
    )
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const withUrls = await Promise.all(
    (inspections ?? []).map(async (inspection) => {
      let pdfUrl: string | null = null
      if (inspection.pdf_path) {
        const { data } = await supabase.storage
          .from('reports')
          .createSignedUrl(inspection.pdf_path, 3600)
        pdfUrl = data?.signedUrl ?? null
      }
      return { ...inspection, pdfUrl }
    })
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Completed Inspections
      </p>
      <h1 className="mb-6 font-headline text-2xl font-bold">Reports</h1>

      <div className="flex flex-col gap-3">
        {withUrls.length ? (
          withUrls.map((inspection) => {
            const property = inspection.properties as unknown as { name: string }
            const template = inspection.checklist_templates as unknown as { name: string }
            const inspector = inspection.profiles as unknown as { full_name: string }
            return (
              <div
                key={inspection.id}
                className="rounded border border-outline-variant bg-surface-container-lowest p-4"
              >
                <p className="font-headline text-lg font-semibold">{property.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {template.name} — {inspector.full_name}
                </p>
                <p className="mb-3 text-xs text-on-surface-variant">
                  Completed{' '}
                  {inspection.completed_at
                    ? new Date(inspection.completed_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : ''}
                </p>
                <div className="flex gap-2">
                  {inspection.pdfUrl && (
                    <a
                      href={inspection.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
                    >
                      Download PDF
                    </a>
                  )}
                  <ResendEmailButton inspectionId={inspection.id} />
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-on-surface-variant">No completed inspections yet.</p>
        )}
      </div>
    </div>
  )
}
