'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MAP_OPTIONS } from '@/lib/map-style'
import { Field, inputClass } from '@/components/admin/ui'

type AddressValues = {
  address: string
  city: string
  region: string
  postalCode: string
  country: string
  lat: number | null
  lng: number | null
}

type MapStatus = 'loading' | 'ready' | 'failed'

const FALLBACK_CENTER = { lat: 39.5, lng: -98.35 }
const MAPS_SCRIPT_ID = 'sw-google-maps'
const MAPS_CALLBACK = '__swAdminMapsReady'

type MapsWindow = Window & {
  [MAPS_CALLBACK]?: () => void
  gm_authFailure?: () => void
}

function addressPart(
  result: google.maps.GeocoderResult,
  type: string,
  short = false,
) {
  const part = result.address_components.find((item) => item.types.includes(type))
  return part ? (short ? part.short_name : part.long_name) : ''
}

export function LocationMapPicker({
  apiKey,
  initial,
}: {
  apiKey: string
  initial: AddressValues
}) {
  const mapNode = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const reverseGeocodeRef = useRef<
    ((position: google.maps.LatLngLiteral) => Promise<void>) | null
  >(null)

  const [status, setStatus] = useState<MapStatus>(apiKey ? 'loading' : 'failed')
  const [message, setMessage] = useState(
    apiKey ? 'Loading Google Maps…' : 'Google Maps API key is not configured.',
  )
  const [search, setSearch] = useState(
    [initial.address, initial.city, initial.region, initial.postalCode, initial.country]
      .filter(Boolean)
      .join(', '),
  )
  const [address, setAddress] = useState(initial.address)
  const [city, setCity] = useState(initial.city)
  const [region, setRegion] = useState(initial.region)
  const [postalCode, setPostalCode] = useState(initial.postalCode)
  const [country, setCountry] = useState(initial.country)
  const [lat, setLat] = useState(initial.lat === null ? '' : String(initial.lat))
  const [lng, setLng] = useState(initial.lng === null ? '' : String(initial.lng))
  const [searching, setSearching] = useState(false)

  const placePin = useCallback((position: google.maps.LatLngLiteral, zoom = 17) => {
    const map = mapRef.current
    if (!map) return

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position,
        draggable: true,
        title: 'Drag to fine-tune this location',
      })
      markerRef.current.addListener('dragend', () => {
        const point = markerRef.current?.getPosition()
        if (point) {
          void reverseGeocodeRef.current?.({ lat: point.lat(), lng: point.lng() })
        }
      })
    } else {
      markerRef.current.setPosition(position)
    }

    map.panTo(position)
    map.setZoom(zoom)
  }, [])

  const applyResult = useCallback(
    (result: google.maps.GeocoderResult, position: google.maps.LatLngLiteral) => {
      const street = [
        addressPart(result, 'street_number'),
        addressPart(result, 'route'),
      ]
        .filter(Boolean)
        .join(' ')
      const resolvedCity =
        addressPart(result, 'locality') ||
        addressPart(result, 'postal_town') ||
        addressPart(result, 'sublocality')

      if (street) setAddress(street)
      if (resolvedCity) setCity(resolvedCity)
      const resolvedRegion = addressPart(result, 'administrative_area_level_1', true)
      if (resolvedRegion) setRegion(resolvedRegion)
      const resolvedPostalCode = addressPart(result, 'postal_code')
      if (resolvedPostalCode) setPostalCode(resolvedPostalCode)
      const resolvedCountry = addressPart(result, 'country')
      if (resolvedCountry) setCountry(resolvedCountry)

      setLat(position.lat.toFixed(6))
      setLng(position.lng.toFixed(6))
      placePin(position)
      setMessage('Location selected. Drag the pin to fine-tune it.')
    },
    [placePin],
  )

  const reverseGeocode = useCallback(
    async (position: google.maps.LatLngLiteral) => {
      setLat(position.lat.toFixed(6))
      setLng(position.lng.toFixed(6))
      placePin(position)

      const geocoder = geocoderRef.current
      if (!geocoder) return
      try {
        const response = await geocoder.geocode({ location: position })
        const result = response.results[0]
        if (result) applyResult(result, position)
      } catch {
        setMessage('Pin moved. Address details could not be updated automatically.')
      }
    },
    [applyResult, placePin],
  )

  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode
  }, [reverseGeocode])

  useEffect(() => {
    if (!apiKey) return

    let cancelled = false
    let readinessTimer: ReturnType<typeof setInterval> | undefined
    const w = window as MapsWindow

    const fail = () => {
      if (cancelled) return
      setStatus('failed')
      setMessage('Google Maps could not load. You can still enter the address manually.')
    }
    const ready = () => {
      if (cancelled) return
      if (typeof window.google?.maps?.Map !== 'function') return
      if (readinessTimer) clearInterval(readinessTimer)
      setStatus('ready')
      setMessage('Search for an address or click the map to place the pin.')
    }

    w.gm_authFailure = fail
    if (typeof window.google?.maps?.Map === 'function') {
      ready()
      return () => {
        cancelled = true
      }
    }

    const previous = w[MAPS_CALLBACK]
    w[MAPS_CALLBACK] = () => {
      previous?.()
      ready()
    }

    let script = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = MAPS_SCRIPT_ID
      script.src =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${encodeURIComponent(apiKey)}&loading=async&callback=${MAPS_CALLBACK}`
      script.async = true
      script.addEventListener('error', fail)
      document.head.appendChild(script)
    } else {
      // Another page may already be loading the shared Maps script with its own
      // callback. Watch readiness so client-side navigation still works.
      readinessTimer = setInterval(ready, 100)
      window.setTimeout(() => {
        if (typeof window.google?.maps?.Map !== 'function') fail()
      }, 12_000)
    }

    return () => {
      cancelled = true
      if (readinessTimer) clearInterval(readinessTimer)
    }
  }, [apiKey])

  useEffect(() => {
    if (status !== 'ready' || !mapNode.current || mapRef.current) return

    const initialPosition =
      initial.lat !== null && initial.lng !== null
        ? { lat: initial.lat, lng: initial.lng }
        : null
    const map = new google.maps.Map(mapNode.current, {
      ...MAP_OPTIONS,
      center: initialPosition ?? FALLBACK_CENTER,
      zoom: initialPosition ? 17 : 4,
    })
    mapRef.current = map
    geocoderRef.current = new google.maps.Geocoder()
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        void reverseGeocode({ lat: event.latLng.lat(), lng: event.latLng.lng() })
      }
    })

    if (initialPosition) placePin(initialPosition)
  }, [initial.lat, initial.lng, placePin, reverseGeocode, status])

  const findAddress = useCallback(async () => {
    const query =
      search.trim() ||
      [address, city, region, postalCode, country].filter(Boolean).join(', ')
    if (!query) {
      setMessage('Enter an address, business, city, or ZIP code first.')
      return
    }

    const geocoder = geocoderRef.current
    if (!geocoder) return
    setSearching(true)
    setMessage('Finding that location…')
    try {
      const response = await geocoder.geocode({ address: query })
      const result = response.results[0]
      if (!result) {
        setMessage('No matching location found. Try adding a city or ZIP code.')
        return
      }
      const point = result.geometry.location
      applyResult(result, { lat: point.lat(), lng: point.lng() })
    } catch {
      setMessage('Address search failed. Try again or place the pin manually.')
    } finally {
      setSearching(false)
    }
  }, [address, applyResult, city, country, postalCode, region, search])

  const syncPinFromCoordinates = () => {
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      placePin({ lat: latitude, lng: longitude })
    }
  }

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-navy">Find the location</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search by business name or address, then click or drag the pin for accuracy.
          </p>
          <div className="mt-3 flex gap-2">
            <label htmlFor="location-search" className="sr-only">
              Search Google Maps
            </label>
            <input
              id="location-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void findAddress()
                }
              }}
              placeholder="Business name, full address, city, or ZIP"
              className={inputClass}
              disabled={status !== 'ready'}
            />
            <button
              type="button"
              onClick={() => void findAddress()}
              disabled={status !== 'ready' || searching}
              className="shrink-0 rounded bg-navy px-5 py-2 text-sm font-bold text-cream hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? 'Finding…' : 'Find'}
            </button>
          </div>
          <p
            className="mt-2 text-xs text-slate-500"
            role={message.includes('failed') || message.includes('could not') ? 'alert' : 'status'}
          >
            {message}
          </p>
        </div>

        <div className="relative h-[420px] bg-sky/30">
          <div ref={mapNode} className="h-full w-full" />
          {status !== 'ready' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-slate-500">
              {status === 'loading'
                ? 'Loading map…'
                : 'Map unavailable — complete the address and coordinates below.'}
            </div>
          )}
        </div>
      </section>

      <Field label="Street address" htmlFor="address">
        <input
          id="address"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className={inputClass}
          autoComplete="street-address"
        />
      </Field>

      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={inputClass}
            autoComplete="address-level2"
          />
        </Field>
        <Field label="State / region" htmlFor="region">
          <input
            id="region"
            name="region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className={inputClass}
            autoComplete="address-level1"
          />
        </Field>
        <Field label="ZIP / postal code" htmlFor="postalCode">
          <input
            id="postalCode"
            name="postalCode"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            className={inputClass}
            autoComplete="postal-code"
          />
        </Field>
        <Field label="Country" htmlFor="country">
          <input
            id="country"
            name="country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className={inputClass}
            autoComplete="country-name"
          />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Latitude" htmlFor="lat" hint="Updated automatically by the map.">
          <input
            id="lat"
            name="lat"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            onBlur={syncPinFromCoordinates}
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" htmlFor="lng" hint="Updated automatically by the map.">
          <input
            id="lng"
            name="lng"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            onBlur={syncPinFromCoordinates}
            className={inputClass}
          />
        </Field>
      </div>
    </>
  )
}
