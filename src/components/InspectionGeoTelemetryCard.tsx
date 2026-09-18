'use client'

import { useState } from 'react'
import { MapPin, Navigation, Clock, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, Radio } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatDistance, formatSpeed, formatDwellDuration, formatCoordinates } from '@/lib/geo'
import { formatDateTime } from '@/lib/timezone'

export type GeoLogEntry = {
  id: string
  latitude: number
  longitude: number
  speed_meters_per_sec: number | null
  accuracy_meters: number | null
  distance_to_center_meters: number | null
  is_inside_geofence: boolean
  logged_at: string
}

interface InspectionGeoTelemetryCardProps {
  arrivedAt: string | null
  departedAt: string | null
  dwellTimeSeconds: number | null
  geofenceStatus: 'pending' | 'verified' | 'outside' | 'exempt'
  geofenceRadiusMeters?: number
  propertyLatitude?: number | null
  propertyLongitude?: number | null
  geoLogs?: GeoLogEntry[]
}

export function InspectionGeoTelemetryCard({
  arrivedAt,
  departedAt,
  dwellTimeSeconds,
  geofenceStatus,
  geofenceRadiusMeters = 100,
  propertyLatitude = null,
  propertyLongitude = null,
  geoLogs = [],
}: InspectionGeoTelemetryCardProps) {
  const [showLogs, setShowLogs] = useState(false)

  const isVerified = geofenceStatus === 'verified'
  const isExempt = geofenceStatus === 'exempt'
  const isOutside = geofenceStatus === 'outside'

  return (
    <Card className="mb-8 border border-outline-variant bg-surface-container-lowest">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isVerified
                ? 'bg-emerald-100 text-emerald-800'
                : isExempt
                ? 'bg-surface-container-high text-on-surface-variant'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isVerified ? (
              <CheckCircle2 size={20} />
            ) : isExempt ? (
              <ShieldCheck size={20} />
            ) : (
              <Navigation size={20} />
            )}
          </div>
          <div>
            <h3 className="font-headline text-base font-bold text-on-surface">
              On-Site Audit & Geo-Telemetry Verification
            </h3>
            <p className="text-xs text-on-surface-variant">
              Satellite GPS positioning & virtual perimeter presence telemetry
            </p>
          </div>
        </div>

        <div>
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Verified On-Site
            </span>
          )}
          {isOutside && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Outside Perimeter
            </span>
          )}
          {isExempt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Exempt from GPS
            </span>
          )}
          {geofenceStatus === 'pending' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Unverified / No Telemetry
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
        <div>
          <p className="label-tracked text-on-surface-variant">Arrival Time</p>
          <p className="text-sm font-semibold text-on-surface">
            {arrivedAt ? formatDateTime(arrivedAt) : 'Not Logged'}
          </p>
        </div>

        <div>
          <p className="label-tracked text-on-surface-variant">Departure / Completed</p>
          <p className="text-sm font-semibold text-on-surface">
            {departedAt ? formatDateTime(departedAt) : 'Not Logged'}
          </p>
        </div>

        <div>
          <p className="label-tracked text-on-surface-variant">On-Site Dwell Time</p>
          <p className="text-sm font-semibold text-primary">
            {formatDwellDuration(dwellTimeSeconds)}
          </p>
        </div>

        <div>
          <p className="label-tracked text-on-surface-variant">Geofence Boundary</p>
          <p className="text-sm font-semibold text-on-surface">
            {isExempt ? 'Disabled' : `${geofenceRadiusMeters}m radius`}
          </p>
        </div>
      </div>

      {propertyLatitude != null && propertyLongitude != null && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-surface-container-low px-3.5 py-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1 font-semibold text-on-surface">
            <MapPin size={13} className="text-primary" />
            Property Coordinates:
          </span>
          <span>{formatCoordinates(propertyLatitude, propertyLongitude)}</span>
        </div>
      )}

      {/* Field Breadcrumbs Log Expander */}
      {geoLogs.length > 0 && (
        <div className="mt-4 border-t border-outline-variant pt-3">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center justify-between text-xs font-semibold text-primary hover:underline"
          >
            <span className="flex items-center gap-1.5">
              <Radio size={14} />
              {showLogs ? 'Hide' : 'View'} Recorded GPS Field Breadcrumbs ({geoLogs.length} points captured)
            </span>
            {showLogs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showLogs && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-outline-variant">
              <table className="min-w-full divide-y divide-outline-variant text-left text-xs">
                <thead className="bg-surface-container-high font-semibold text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2">Coordinates</th>
                    <th className="px-3 py-2">Distance to Center</th>
                    <th className="px-3 py-2">Transit Speed</th>
                    <th className="px-3 py-2">Accuracy</th>
                    <th className="px-3 py-2">Perimeter Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface">
                  {geoLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low">
                      <td className="whitespace-nowrap px-3 py-1.5 text-on-surface-variant">
                        {formatDateTime(log.logged_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[11px]">
                        {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 font-semibold">
                        {log.distance_to_center_meters != null
                          ? formatDistance(log.distance_to_center_meters)
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-on-surface-variant">
                        {formatSpeed(log.speed_meters_per_sec)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-on-surface-variant">
                        {log.accuracy_meters != null ? `±${Math.round(log.accuracy_meters)}m` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            log.is_inside_geofence
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.is_inside_geofence ? 'Inside Boundary' : 'Outside'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
