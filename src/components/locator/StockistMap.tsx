'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MarkerClusterer, type Cluster } from '@googlemaps/markerclusterer'
import { MAP_OPTIONS } from '@/lib/map-style'
import type { Location } from '@/lib/content'

/**
 * Replaces the Storemapper embed on the Where to Find page.
 *
 * A list on the left, map on the right, the two kept in sync: hovering a card
 * raises its pin, selecting one flies the map to it. Search filters the list
 * client-side over name/city/address/ZIP — deliberately not the Places API, which
 * would add a second billable service and a network round-trip for what is a
 * 13-row array already in memory.
 *
 * The map is progressive enhancement. Without a Maps key (or if the script fails
 * to load) the list still renders in full, with Google Maps links per stockist —
 * so the page is never blank on a missing env var.
 */

const AMBER = '#eea33b'
const NAVY = '#232e44'
const TEAL = '#008080'
const CREAM = '#ffecdc'

/** Los Angeles metro — only used before bounds are fitted to the real pins. */
const FALLBACK_CENTER = { lat: 34.02, lng: -118.29 }

type Mapped = Location & { lat: number; lng: number }

/** Narrow to the stockists that can actually be placed on a map. */
function isMapped(l: Location): l is Mapped {
  return typeof l.lat === 'number' && typeof l.lng === 'number'
}

function fullAddress(l: Location) {
  const tail = [l.city, [l.region, l.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  return [l.address, tail].filter(Boolean).join(', ')
}

/** Google's own deep link, which opens the native app on mobile. */
function directionsUrl(l: Location) {
  const q = isMapped(l) ? `${l.lat},${l.lng}` : fullAddress(l)
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

/** Great-circle distance in miles, for the "near me" ordering. */
function milesBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

/**
 * The teardrop pin, as an SVG data URI. Two visual states: amber at rest, teal
 * and larger when selected, so the active stockist is obvious at a glance.
 */
function pinIcon(selected: boolean): google.maps.Icon {
  const fill = selected ? TEAL : AMBER
  const scale = selected ? 1.25 : 1
  const w = 30 * scale
  const h = 42 * scale
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 42">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13 25.2 13.6 25.8a2 2 0 0 0 2.8 0C17 40.2 30 25.5 30 15 30 6.7 23.3 0 15 0Z" fill="${fill}" stroke="${NAVY}" stroke-width="2"/>
    <circle cx="15" cy="15" r="5.5" fill="${CREAM}"/>
  </svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h),
  }
}

/** Amber bubble with a count, echoing the cluster badge on the old locator. */
function clusterIcon(count: number): google.maps.Icon {
  const size = count < 10 ? 44 : 52
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="${AMBER}" fill-opacity="0.35"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 9}" fill="${AMBER}" stroke="${NAVY}" stroke-width="2"/>
  </svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  }
}

export function StockistMap({
  locations,
  apiKey,
  searchLabel,
}: {
  locations: Location[]
  apiKey: string
  searchLabel: string
}) {
  const mapNode = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef(new Map<string, google.maps.Marker>())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const cardRefs = useRef(new Map<string, HTMLLIElement | null>())

  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    apiKey ? 'loading' : 'failed',
  )
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'locating' | 'denied'>('idle')

  const mappable = useMemo(() => locations.filter(isMapped), [locations])

  // Filter, then order: nearest-first once we know where the visitor is,
  // otherwise the admin's own ordering.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q
      ? locations.filter((l) =>
          [l.name, l.address, l.city, l.region, l.postalCode]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : locations

    if (!origin) return matched
    return [...matched].sort((a, b) => {
      if (!isMapped(a)) return 1
      if (!isMapped(b)) return -1
      return milesBetween(origin, a) - milesBetween(origin, b)
    })
  }, [locations, query, origin])

  /** Frame every pin worth showing. */
  const fitTo = useCallback((items: Mapped[]) => {
    const map = mapRef.current
    if (!map || !items.length) return
    if (items.length === 1) {
      map.setCenter({ lat: items[0].lat, lng: items[0].lng })
      map.setZoom(15)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    for (const i of items) bounds.extend({ lat: i.lat, lng: i.lng })
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
  }, [])

  const select = useCallback((location: Location) => {
    setSelectedId(location.id)
    const map = mapRef.current
    if (map && isMapped(location)) {
      map.panTo({ lat: location.lat, lng: location.lng })
      if ((map.getZoom() ?? 0) < 14) map.setZoom(15)
    }
    cardRefs.current
      .get(location.id)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [])

  // --- script load ------------------------------------------------------
  useEffect(() => {
    if (!apiKey) return
    let cancelled = false

    const succeed = () => {
      if (!cancelled) setStatus('ready')
    }
    const fail = (reason: unknown) => {
      console.error('Google Maps failed to load', reason)
      if (!cancelled) setStatus('failed')
    }

    /**
     * Readiness is signalled by the script's `callback` parameter, not by its
     * `load` event — the event fires while the API is still initialising, and
     * constructing a Map then throws "google.maps.Map is not a constructor".
     *
     * `importLibrary()` would be the other option, but it is installed by
     * Google's inline bootstrap snippet only; a plain URL-loaded script does not
     * define it and populates `google.maps.*` directly instead.
     */
    const CALLBACK = '__swMapsReady'
    const ID = 'sw-google-maps'

    type MapsWindow = Window & {
      [CALLBACK]?: () => void
      gm_authFailure?: () => void
    }
    const w = window as MapsWindow

    // Auth problems (bad key, wrong referrer, billing off) do not reject the
    // script — Google loads fine and then paints its own grey "Oops!" panel over
    // the map. This hook is the only notification, and it lets us show the
    // stockist fallback instead of Google's error.
    w.gm_authFailure = () => fail(new Error('Maps auth rejected (key/referrer/billing)'))

    // Loaded already by an earlier mount — nothing to wait for.
    if (typeof window.google?.maps?.Map === 'function') {
      succeed()
      return () => {
        cancelled = true
      }
    }

    // Chain rather than overwrite: in React's development double-mount a second
    // effect runs while the first request is still in flight, and both need
    // waking when the single shared script finally calls back.
    const previous = w[CALLBACK]
    w[CALLBACK] = () => {
      previous?.()
      succeed()
    }

    let script = document.getElementById(ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = ID
      script.src =
        `https://maps.googleapis.com/maps/api/js` +
        `?key=${encodeURIComponent(apiKey)}&loading=async&callback=${CALLBACK}`
      script.async = true
      script.addEventListener('error', () =>
        fail(new Error('Maps script request failed')),
      )
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [apiKey])

  // --- map + markers ----------------------------------------------------
  useEffect(() => {
    if (status !== 'ready' || !mapNode.current || mapRef.current) return

    // The map is an enhancement, not the page. Anything thrown in here would
    // otherwise propagate out of the effect and unmount the stockist list along
    // with it — so failures degrade to the fallback panel instead.
    try {
      const map = new google.maps.Map(mapNode.current, {
        ...MAP_OPTIONS,
        center: FALLBACK_CENTER,
        zoom: 10,
      })
      mapRef.current = map

      for (const location of mappable) {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          title: location.name,
          icon: pinIcon(false),
        })
        marker.addListener('click', () => select(location))
        markersRef.current.set(location.id, marker)
      }

      // Framed before clustering, so the viewport is correct even if the
      // clusterer is unavailable.
      fitTo(mappable)

      clustererRef.current = new MarkerClusterer({
        map,
        markers: [...markersRef.current.values()],
        renderer: {
          render: ({ count, position }: Cluster) =>
            new google.maps.Marker({
              position,
              icon: clusterIcon(count),
              label: {
                text: String(count),
                color: NAVY,
                fontSize: '14px',
                fontWeight: '700',
              },
              // Above the plain pins, below an opened selection.
              zIndex: 1000 + count,
            }),
        },
      })
    } catch (err) {
      console.error('Stockist map failed to initialise', err)
      // Clustering is optional; a map that got built stays usable without it.
      if (!mapRef.current) setStatus('failed')
    }
  }, [status, mappable, select, fitTo])

  // Repaint pins when the selection or hover changes.
  useEffect(() => {
    if (status !== 'ready') return
    for (const [id, marker] of markersRef.current) {
      const active = id === selectedId
      marker.setIcon(pinIcon(active))
      marker.setZIndex(active ? 10_000 : id === hoveredId ? 9_000 : 1)
    }
  }, [status, selectedId, hoveredId])

  // Keep the map framed on whatever the search narrowed to.
  useEffect(() => {
    if (status !== 'ready' || !query.trim()) return
    fitTo(visible.filter(isMapped))
  }, [status, query, visible, fitTo])

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setGeoState('denied')
    setGeoState('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoState('idle')
        setOrigin({ lat: coords.latitude, lng: coords.longitude })
        mapRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude })
        mapRef.current?.setZoom(11)
      },
      () => setGeoState('denied'),
      { timeout: 8000 },
    )
  }, [])

  const resetView = useCallback(() => {
    setSelectedId(null)
    setQuery('')
    fitTo(mappable)
  }, [fitTo, mappable])

  if (!locations.length) {
    return (
      <p className="py-12 text-lg">
        Stockist locations are coming soon. Please check back shortly.
      </p>
    )
  }

  return (
    <div className="mt-10 text-left">
      {/* --- controls ---------------------------------------------------- */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="sw-stockist-search" className="sr-only">
            {searchLabel}
          </label>
          <SearchIcon />
          <input
            id="sw-stockist-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            className="w-full rounded-full border-2 border-navy/15 bg-white py-3 pl-11 pr-4 text-base text-navy placeholder:text-navy/40 focus:border-teal focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={locate}
          className="flex shrink-0 items-center gap-2 rounded-full border-2 border-navy/15 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wide text-navy transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
          disabled={geoState === 'locating'}
        >
          <TargetIcon />
          {geoState === 'locating' ? 'Locating…' : 'Near me'}
        </button>

        {(query || selectedId || origin) && (
          <button
            type="button"
            onClick={resetView}
            className="shrink-0 rounded-full px-3 py-3 text-sm font-semibold uppercase tracking-wide text-navy/60 underline transition-colors hover:text-teal"
          >
            Reset
          </button>
        )}
      </div>

      {geoState === 'denied' && (
        <p className="mb-4 text-sm text-navy/60">
          We couldn&rsquo;t get your location — search by city or ZIP instead.
        </p>
      )}

      {/* --- list + map -------------------------------------------------- */}
      <div className="grid gap-4 overflow-hidden lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="flex flex-col rounded-3xl bg-white/70 p-3 lg:max-h-[620px]">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-widest text-navy/50">
            {visible.length} {visible.length === 1 ? 'stockist' : 'stockists'}
            {origin && ' · nearest first'}
          </p>

          {visible.length === 0 ? (
            <p className="px-2 py-8 text-navy/60">
              Nothing matched “{query}”. Try a city or ZIP code.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {visible.map((location) => {
                const active = location.id === selectedId
                return (
                  <li
                    key={location.id}
                    ref={(node) => {
                      cardRefs.current.set(location.id, node)
                    }}
                    onMouseEnter={() => setHoveredId(location.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className={[
                        'rounded-2xl border-2 bg-white p-4 transition-colors',
                        active
                          ? 'border-teal'
                          : 'border-transparent hover:border-amber',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => select(location)}
                        className="block w-full text-left"
                        aria-current={active ? 'true' : undefined}
                      >
                        <span className="block font-display text-xl uppercase leading-tight text-navy">
                          {location.name}
                        </span>
                        <span className="mt-1 block text-sm leading-snug text-navy/70">
                          {fullAddress(location)}
                        </span>
                      </button>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {origin && isMapped(location) && (
                          <span className="font-semibold text-teal">
                            {milesBetween(origin, location).toFixed(1)} mi
                          </span>
                        )}
                        {location.phone && (
                          <a
                            href={`tel:${location.phone.replace(/[^+\d]/g, '')}`}
                            className="text-navy/70 underline hover:text-teal"
                          >
                            {location.phone}
                          </a>
                        )}
                        <a
                          href={directionsUrl(location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-navy underline hover:text-teal"
                        >
                          Directions
                        </a>
                        {location.websiteUrl && (
                          <a
                            href={location.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-navy/70 underline hover:text-teal"
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* The map itself, or a graceful stand-in. */}
        <div className="relative h-[420px] overflow-hidden rounded-3xl bg-sky/40 lg:h-[620px]">
          {status === 'failed' ? (
            <MapFallback locations={mappable} />
          ) : (
            <>
              <div ref={mapNode} className="h-full w-full" />
              {status === 'loading' && (
                <div className="absolute inset-0 grid place-items-center bg-sky/40">
                  <span className="text-sm uppercase tracking-widest text-navy/60">
                    Loading map…
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Shown when there is no API key or the script blocked. Not an error state as far
 * as the visitor is concerned — the list beside it is fully usable, and this still
 * offers a way through to Google Maps.
 */
function MapFallback({ locations }: { locations: Mapped[] }) {
  const all = locations.map((l) => `${l.lat},${l.lng}`).join('|')
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <MapPinIcon />
      <p className="max-w-xs text-navy/70">
        The interactive map isn&rsquo;t available right now. The full stockist list
        is beside it.
      </p>
      {all && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${locations[0].lat},${locations[0].lng}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border-2 border-navy px-5 py-2 text-sm font-semibold uppercase tracking-wide text-navy hover:border-teal hover:text-teal"
        >
          Open in Google Maps
        </a>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-10 w-10 text-navy/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
