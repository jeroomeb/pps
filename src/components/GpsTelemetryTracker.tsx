'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MapPin, Navigation, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react'
import { calculateHaversineDistance, formatDistance, formatSpeed } from '@/lib/geo'
import { logInspectionGeoBreadcrumb } from '@/lib/actions/geo'

export interface GpsTelemetryTrackerProps {
  inspectionId: string
  propertyId: string
  propertyName: string
  enableGpsGeofencing: boolean
  propertyLatitude: number | null
  propertyLongitude: number | null
  geofenceRadiusMeters?: number
  onStatusChange?: (status: TrackerState['status'], distanceMeters: number | null) => void
}

export type TrackerState = {
  status: 'initializing' | 'verified' | 'outside' | 'denied' | 'unsupported' | 'exempt'
  distanceMeters: number | null
  speedMps: number | null
  accuracyMeters: number | null
  arrivedAt: string | null
  lastLoggedTime: string | null
}

export function GpsTelemetryTracker({
  inspectionId,
  propertyId,
  propertyName,
  enableGpsGeofencing,
  propertyLatitude,
  propertyLongitude,
  geofenceRadiusMeters = 100,
  onStatusChange,
}: GpsTelemetryTrackerProps) {
  const [state, setState] = useState<TrackerState>({
    status: enableGpsGeofencing && propertyLatitude != null && propertyLongitude != null ? 'initializing' : 'exempt',
    distanceMeters: null,
    speedMps: null,
    accuracyMeters: null,
    arrivedAt: null,
    lastLoggedTime: null,
  })

  const [refreshing, setRefreshing] = useState(false)
  const lastSentRef = useRef<number>(0)
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null)

  // Notify parent component of live status changes for gate enforcement (INSP-10)
  useEffect(() => {
    onStatusChange?.(state.status, state.distanceMeters)
  }, [state.status, state.distanceMeters, onStatusChange])

  const sendBreadcrumb = useCallback(
    async (lat: number, lon: number, speed: number | null, accuracy: number | null) => {
      try {
        const result = await logInspectionGeoBreadcrumb({
          inspectionId,
          propertyId,
          latitude: lat,
          longitude: lon,
          speed,
          accuracy,
        })

        if (result.success) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          setState((prev) => ({
            ...prev,
            status: result.isInside ? 'verified' : 'outside',
            distanceMeters: result.distanceMeters ?? prev.distanceMeters,
            arrivedAt: result.arrivedAt ?? prev.arrivedAt,
            lastLoggedTime: nowStr,
          }))
        }
      } catch (err) {
        console.error('Failed to stream GPS breadcrumb:', err)
      }
    },
    [inspectionId, propertyId]
  )

  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, speed, accuracy } = position.coords
      const now = Date.now()

      let dist: number | null = null
      let isInside = false

      if (propertyLatitude != null && propertyLongitude != null) {
        dist = Math.round(
          calculateHaversineDistance(latitude, longitude, propertyLatitude, propertyLongitude)
        )
        isInside = dist <= geofenceRadiusMeters
      }

      setState((prev) => ({
        ...prev,
        status: isInside ? 'verified' : 'outside',
        distanceMeters: dist,
        speedMps: speed,
        accuracyMeters: accuracy,
      }))

      // Throttle server breadcrumbs: send if 25s elapsed OR position shifted by > 30m
      const timeSinceLast = now - lastSentRef.current
      let movedFar = false
      if (lastCoordsRef.current) {
        const deltaDist = calculateHaversineDistance(
          latitude,
          longitude,
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lon
        )
        if (deltaDist > 30) movedFar = true
      }

      if (timeSinceLast > 25000 || movedFar || !lastCoordsRef.current) {
        lastSentRef.current = now
        lastCoordsRef.current = { lat: latitude, lon: longitude }
        void sendBreadcrumb(latitude, longitude, speed, accuracy)
      }
    },
    [propertyLatitude, propertyLongitude, geofenceRadiusMeters, sendBreadcrumb]
  )

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    if (error.code === error.PERMISSION_DENIED) {
      setState((prev) => ({ ...prev, status: 'denied' }))
    } else {
      setState((prev) => ({ ...prev, status: 'outside' }))
    }
  }, [])

  const handleManualRefresh = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({ ...prev, status: 'unsupported' }))
      return
    }

    setRefreshing(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRefreshing(false)
        handlePositionSuccess(pos)
      },
      (err) => {
        setRefreshing(false)
        handlePositionError(err)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [handlePositionSuccess, handlePositionError])

  useEffect(() => {
    if (!enableGpsGeofencing || propertyLatitude == null || propertyLongitude == null) {
      setState((prev) => ({ ...prev, status: 'exempt' }))
      return
    }

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({ ...prev, status: 'unsupported' }))
      return
    }

    let watchId: number | null = null

    watchId = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    })

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [
    enableGpsGeofencing,
    propertyLatitude,
    propertyLongitude,
    geofenceRadiusMeters,
    handlePositionSuccess,
    handlePositionError,
  ])

  if (state.status === 'exempt') {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-2 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-secondary" />
          <span>GPS Geofencing is <strong>exempt</strong> for {propertyName}.</span>
        </span>
      </div>
    )
  }

  if (state.status === 'unsupported') {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-2 text-xs text-on-surface-variant">
        <AlertCircle size={14} className="text-amber-500 shrink-0" />
        <span>Device does not support location services. Visual verification will apply.</span>
      </div>
    )
  }

  if (state.status === 'denied') {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-error/50 bg-error-container/30 px-3.5 py-3 text-xs text-on-error-container">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-error">Location Access Disabled</p>
            <p className="text-on-error-container mt-0.5 leading-relaxed">
              Enable browser location permissions to verify your physical presence inside the property perimeter.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded bg-error px-3 py-1.5 font-semibold text-white hover:brightness-95 transition self-start sm:self-auto shrink-0 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking…' : 'Retry Permission Check'}
        </button>
      </div>
    )
  }

  if (state.status === 'initializing') {
    return (
      <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3.5 py-2 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <RefreshCw size={13} className="animate-spin text-primary shrink-0" />
          <span>Acquiring satellite GPS coordinates & virtual perimeter status…</span>
        </div>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="text-primary hover:underline font-semibold"
        >
          Force Check
        </button>
      </div>
    )
  }

  const isVerified = state.status === 'verified'

  return (
    <div
      className={`mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border p-3.5 text-xs transition-colors ${
        isVerified
          ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
          : 'border-amber-300 bg-amber-50 text-amber-950'
      }`}
    >
      <div className="flex items-start sm:items-center gap-2.5">
        {isVerified ? (
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
        ) : (
          <Navigation size={18} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {isVerified ? 'On-Site & Geofence Verified' : 'Outside Virtual Perimeter'}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {isVerified ? 'Within Perimeter' : 'Proximity Gate'}
            </span>
          </div>
          <p className="mt-0.5 opacity-90">
            {state.distanceMeters != null ? (
              <>
                Distance from property center: <strong>{formatDistance(state.distanceMeters)}</strong>
                {' '}(Boundary: {geofenceRadiusMeters}m radius)
              </>
            ) : (
              'Calculating proximity to property coordinates…'
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t sm:border-t-0 border-current/10 pt-2 sm:pt-0 text-[11px] opacity-85">
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded border border-current/20 px-2 py-0.5 font-semibold hover:bg-black/5 transition cursor-pointer"
        >
          <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Updating…' : 'Refresh'}
        </button>
        <span className="flex items-center gap-1">
          <Navigation size={12} />
          {formatSpeed(state.speedMps)}
        </span>
        {state.accuracyMeters != null && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            ±{Math.round(state.accuracyMeters)}m precision
          </span>
        )}
        {state.lastLoggedTime && (
          <span className="text-current/75">
            Updated {state.lastLoggedTime}
          </span>
        )}
      </div>
    </div>
  )
}
