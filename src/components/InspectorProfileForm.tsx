'use client'

import { useRef, useState, useTransition } from 'react'
import { UploadCloud, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateOwnProfile } from '@/lib/actions/team'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const INPUT =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL = 'text-sm font-semibold uppercase tracking-wide'

type Side = 'front' | 'back'

export function InspectorProfileForm({
  userId,
  humanId,
  fullName,
  email,
  defaults,
}: {
  userId: string
  humanId: string | null
  fullName: string
  email: string | null
  defaults: {
    phone: string | null
    street: string | null
    city: string | null
    state: string | null
    zip: string | null
    county: string | null
    id_front_path: string | null
    id_back_path: string | null
  }
}) {
  const showToast = useToast()
  const [phone, setPhone] = useState(defaults.phone ?? '')
  const [street, setStreet] = useState(defaults.street ?? '')
  const [city, setCity] = useState(defaults.city ?? '')
  const [state, setState] = useState(defaults.state ?? '')
  const [zip, setZip] = useState(defaults.zip ?? '')
  const [county, setCounty] = useState(defaults.county ?? '')
  const [frontPath, setFrontPath] = useState<string | null>(defaults.id_front_path)
  const [backPath, setBackPath] = useState<string | null>(defaults.id_back_path)
  const [uploading, setUploading] = useState<Side | null>(null)
  const [pending, startTransition] = useTransition()
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  async function handleUpload(side: Side, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(side)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    // RLS requires the first path segment to be the user's own id.
    // `file.lastModified` keeps the path unique without an impure Date.now().
    const objectPath = `${userId}/id-${side}-${file.lastModified}.${ext}`
    const { error } = await supabase.storage.from('documents').upload(objectPath, file, {
      upsert: true,
    })
    setUploading(null)
    if (error) {
      showToast('error', `Upload failed: ${error.message}`)
      return
    }
    if (side === 'front') setFrontPath(objectPath)
    else setBackPath(objectPath)
    // Persist the new path immediately.
    startTransition(async () => {
      const result = await updateOwnProfile({
        phone,
        street,
        city,
        state,
        zip,
        county,
        ...(side === 'front' ? { id_front_path: objectPath } : { id_back_path: objectPath }),
      })
      if (result?.error) showToast('error', result.error)
      else showToast('success', `ID ${side} uploaded.`)
    })
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOwnProfile({ phone, street, city, state, zip, county })
      if (result?.error) showToast('error', result.error)
      else showToast('success', 'Profile saved.')
    })
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <p className="label-tracked text-on-surface-variant">Name</p>
          <p className="font-semibold">{fullName}</p>
        </div>
        {email && (
          <div>
            <p className="label-tracked text-on-surface-variant">Email</p>
            <p className="font-semibold">{email}</p>
          </div>
        )}
        {humanId && (
          <div>
            <p className="label-tracked text-on-surface-variant">Specialist ID</p>
            <p className="font-mono font-semibold">{humanId}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={LABEL}>
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="street" className={LABEL}>
            Street Address
          </label>
          <input
            id="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      {/* County/state/ZIP drive proximity matching when assigning inspections. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className={LABEL}>
            City
          </label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} className={INPUT} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="state" className={LABEL}>
            State
          </label>
          <input
            id="state"
            maxLength={2}
            placeholder="NJ"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={`${INPUT} uppercase`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="zip" className={LABEL}>
            ZIP Code
          </label>
          <input
            id="zip"
            inputMode="numeric"
            maxLength={10}
            placeholder="07102"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="county" className={LABEL}>
            County
          </label>
          <input
            id="county"
            placeholder="Essex"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-on-surface-variant">
        Your county, state and ZIP are used to match you with nearby properties when inspections
        are assigned.
      </p>

      <div>
        <p className={`${LABEL} mb-2`}>Driver&apos;s License / Identification</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(['front', 'back'] as Side[]).map((side) => {
            const has = side === 'front' ? frontPath : backPath
            const ref = side === 'front' ? frontRef : backRef
            return (
              <div key={side}>
                <input
                  ref={ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpload(side, e)}
                />
                <button
                  type="button"
                  onClick={() => ref.current?.click()}
                  disabled={uploading === side}
                  className={`flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm font-semibold ${
                    has
                      ? 'border-success text-success'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {has ? <CheckCircle2 size={20} /> : <UploadCloud size={20} />}
                  {uploading === side
                    ? 'Uploading…'
                    : has
                      ? `ID ${side} uploaded — tap to replace`
                      : `Upload ID ${side}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="min-h-11 self-start rounded-lg bg-primary-container px-5 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save Profile'}
      </button>
    </Card>
  )
}
