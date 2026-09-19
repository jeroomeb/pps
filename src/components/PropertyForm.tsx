'use client'

import { useActionState, useState } from 'react'
import { MapPin, Navigation, Crosshair, ShieldCheck, CircleDollarSign, Building } from 'lucide-react'
import { SubmitButton } from '@/components/SubmitButton'
import { AddressFields } from '@/components/AddressFields'
import { Card } from '@/components/ui/Card'
import type { PropertyFormState } from '@/lib/actions/properties'
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type ScheduleEntry } from '@/lib/schedule'
import type { AddressParts } from '@/lib/address'
import type { PayoutTier } from '@/lib/database.types'

const INPUT =
  'min-h-12 rounded border border-outline-variant px-3 focus:border-primary-container focus:outline-none'
const LABEL = 'text-sm font-semibold uppercase tracking-wide'

export function PropertyForm({
  action,
  defaultValues,
  tenants,
}: {
  action: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>
  defaultValues?: AddressParts & {
    name: string
    email: string
    phone?: string | null
    notes?: string | null
    humanId?: string | null
    schedule?: ScheduleEntry[]
    requireIdPhoto?: boolean
    enableGpsGeofencing?: boolean
    latitude?: number | null
    longitude?: number | null
    geofenceRadiusMeters?: number
    payoutTier?: PayoutTier
    customPayoutRate?: number | null
    tenantId?: string | null
  }
  tenants?: { id: string; name: string }[]
}) {
  const [state, formAction] = useActionState<PropertyFormState, FormData>(action, undefined)

  const [lat, setLat] = useState<string>(defaultValues?.latitude?.toString() ?? '')
  const [lon, setLon] = useState<string>(defaultValues?.longitude?.toString() ?? '')
  const [payoutTier, setPayoutTier] = useState<PayoutTier>(defaultValues?.payoutTier ?? 'tier_2')
  const [detectingGps, setDetectingGps] = useState(false)
  const [gpsNotice, setGpsNotice] = useState<string | null>(null)

  // Schedule is first-of-month only, so a weekday is either on or off.
  const checkedDays = new Set((defaultValues?.schedule ?? []).map((e) => e.weekday))

  function handleDetectCurrentLocation() {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsNotice('Geolocation is not supported by your browser.')
      return
    }

    setDetectingGps(true)
    setGpsNotice(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingGps(false)
        const detectedLat = position.coords.latitude.toFixed(6)
        const detectedLon = position.coords.longitude.toFixed(6)
        setLat(detectedLat)
        setLon(detectedLon)
        setGpsNotice(`Coordinates captured: ${detectedLat}, ${detectedLon} (±${Math.round(position.coords.accuracy)}m accuracy)`)
      },
      (error) => {
        setDetectingGps(false)
        setGpsNotice(`Could not detect location: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        {defaultValues?.humanId && (
          <p className="text-xs text-on-surface-variant">
            Property ID: <span className="font-mono font-semibold">{defaultValues.humanId}</span>
          </p>
        )}

        {tenants && tenants.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="property_tenant_id" className={LABEL}>
              Assigned Organization / Corporate Tenant
            </label>
            <select
              id="property_tenant_id"
              name="tenant_id"
              defaultValue={defaultValues?.tenantId ?? ''}
              className={`${INPUT} bg-surface-container-lowest`}
            >
              <option value="">Amenity Op&apos;s HQ (Master / Global)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className={LABEL}>
              Property Name
            </label>
            <input id="name" name="name" required defaultValue={defaultValues?.name} className={INPUT} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={LABEL}>
              Property Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultValues?.email}
              placeholder="reports@property.com"
              className={INPUT}
            />
          </div>
        </div>

        <AddressFields
          defaults={defaultValues}
          requireStreet={true}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className={LABEL}>
            Property Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone ?? ''}
            className={`${INPUT} lg:max-w-xs`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className={LABEL}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={defaultValues?.notes ?? ''}
            placeholder="Notes visible to admins and the assigned specialist…"
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none"
          />
        </div>

        {/* Task 6: GPS Tracking & Virtual Geofencing Configuration */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation size={18} className="text-primary" />
            <h3 className="font-headline font-semibold text-sm text-on-surface">
              GPS Tracking & Virtual Geofencing Perimeter
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">
            Verify specialists are physically on-site during audits, track dwell duration, and capture automatic arrival timestamps.
          </p>

          <label className="flex cursor-pointer items-start gap-3 mb-4">
            <input
              type="checkbox"
              name="enable_gps_geofencing"
              defaultChecked={defaultValues?.enableGpsGeofencing ?? true}
              className="mt-1 h-4 w-4 accent-[#ee8a4b]"
            />
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Enable On-Site GPS Geofence Verification
              </p>
              <p className="text-xs text-on-surface-variant">
                When enabled, the app tracks the specialist&apos;s proximity to the property boundary and records entry/exit telemetry.
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-3 border-t border-outline-variant">
            <div className="flex flex-col gap-1">
              <label htmlFor="latitude" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Latitude (Center)
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 40.712776"
                className="min-h-10 rounded border border-outline-variant bg-surface px-3 text-sm focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="longitude" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Longitude (Center)
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="e.g. -74.005974"
                className="min-h-10 rounded border border-outline-variant bg-surface px-3 text-sm focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="geofence_radius_meters" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Geofence Perimeter Radius
              </label>
              <select
                id="geofence_radius_meters"
                name="geofence_radius_meters"
                defaultValue={defaultValues?.geofenceRadiusMeters ?? 100}
                className="min-h-10 rounded border border-outline-variant bg-surface px-3 text-sm focus:border-primary-container focus:outline-none"
              >
                <option value={50}>50 meters (~160 ft - Tight building perimeter)</option>
                <option value={100}>100 meters (~330 ft - Standard property)</option>
                <option value={200}>200 meters (~650 ft - Large multi-acre complex)</option>
                <option value={500}>500 meters (~1640 ft - Expansive campus / resort)</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container transition disabled:opacity-50"
            >
              <Crosshair size={14} className={detectingGps ? 'animate-spin text-primary' : 'text-primary'} />
              {detectingGps ? 'Pinpointing GPS…' : 'Set to Current Device Location'}
            </button>
            {gpsNotice && (
              <span className="text-xs text-primary font-medium">
                {gpsNotice}
              </span>
            )}
          </div>
        </div>

        {/* Task 5 & Question 4: 3-Tier Specialist Compensation & Payout Matrix Tier */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <div className="mb-2 flex items-center gap-2">
            <CircleDollarSign size={18} className="text-primary" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">
              Specialist Audit Compensation & Payout Tier
            </h3>
          </div>
          <p className="mb-4 text-xs text-on-surface-variant">
            Assign this property to an audit compensation tier. Specialists auditing this site will automatically receive the organization&apos;s designated tier payout rate.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="payout_tier" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Property Compensation Tier
              </label>
              <select
                id="payout_tier"
                name="payout_tier"
                value={payoutTier}
                onChange={(e) => setPayoutTier(e.target.value as PayoutTier)}
                className="min-h-10 rounded border border-outline-variant bg-surface px-3 text-sm focus:border-primary-container focus:outline-none"
              >
                <option value="tier_1">Tier 1 Property (Baseline / Standard)</option>
                <option value="tier_2">Tier 2 Property (Mid-Tier / Commercial)</option>
                <option value="tier_3">Tier 3 Property (Premium / Luxury High-Rise)</option>
                <option value="custom">Custom Flat Rate Override ($)</option>
              </select>
            </div>

            {payoutTier === 'custom' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="custom_payout_rate" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Custom Payout Amount ($ USD)
                </label>
                <input
                  id="custom_payout_rate"
                  name="custom_payout_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={defaultValues?.customPayoutRate ?? ''}
                  placeholder="e.g. 85.00"
                  className="min-h-10 rounded border border-outline-variant bg-surface px-3 text-sm focus:border-primary-container focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Client Feature: Photo ID Verification Toggle */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="require_id_photo"
              defaultChecked={defaultValues?.requireIdPhoto ?? true}
              className="mt-1 h-4 w-4 accent-[#ee8a4b]"
            />
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Require Driver&apos;s License ID Verification
              </p>
              <p className="text-xs text-on-surface-variant">
                Enable for 1099 independent contractor audits to enforce photo ID document submission.
                Disable for properties maintained by internal corporate / W-2 facilities staff.
              </p>
            </div>
          </label>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={`${LABEL} mb-1`}>Required Inspection Days</legend>
          <p className="text-xs text-on-surface-variant">
            Pick which days of the week this property needs inspecting. Shown on the property page
            and to the assigned specialist for reference — inspections are still scheduled
            individually below.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAY_ORDER.map((w) => (
              <label
                key={w}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant px-3 text-sm font-semibold transition hover:bg-surface-container-low has-[:checked]:border-primary has-[:checked]:bg-primary-container has-[:checked]:text-on-primary-container"
              >
                <input
                  type="checkbox"
                  name="schedule"
                  value={`1-${w}`}
                  defaultChecked={checkedDays.has(w)}
                  className="h-4 w-4 accent-[#ee8a4b]"
                />
                {WEEKDAY_LABELS[w]}
              </label>
            ))}
          </div>
        </fieldset>

        {state?.error && (
          <p className="rounded bg-error-container px-3 py-2 text-sm text-on-error-container">
            {state.error}
          </p>
        )}

        <SubmitButton className="lg:self-start">Save Property</SubmitButton>
      </form>
    </Card>
  )
}
