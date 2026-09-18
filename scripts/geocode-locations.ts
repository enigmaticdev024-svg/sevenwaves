/**
 * Replaces approximate stockist coordinates with geocoded ones.
 *
 * The lat/lng in data/locations.json were read from the `ll=` parameter of the
 * old Storemapper share links, which is the *map centre at zoom 12*, not the
 * geocoded pin — so pins can sit a couple of hundred metres off the building.
 * This asks the Geocoding API for each address and rewrites the file in place.
 *
 * Needs a server-side key with the **Geocoding API** enabled. That is a different
 * service from the Maps JavaScript API, and a browser key restricted by HTTP
 * referrer will be rejected here — set GOOGLE_GEOCODING_API_KEY to an unrestricted
 * (or IP-restricted) key rather than reusing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 *
 * Run with: npm run geocode          (writes data/locations.json)
 *           npm run geocode -- --dry (report only, no write)
 *
 * Re-seed afterwards to push the new coordinates into the database:
 *           npm run db:seed
 */
import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type Row = {
  name: string
  address?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  lat?: number
  lng?: number
}

const FILE = join(process.cwd(), 'data', 'locations.json')
const KEY =
  process.env.GOOGLE_GEOCODING_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const DRY = process.argv.includes('--dry')

/** Metres between two coordinates — used only to report how far each pin moved. */
function metresBetween(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const [aLat, aLng] = a
  const [bLat, bLng] = b
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6_371_000 * 2 * Math.asin(Math.sqrt(h)))
}

async function geocode(query: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', KEY!)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const body = (await res.json()) as {
    status: string
    error_message?: string
    results: {
      geometry: { location: { lat: number; lng: number }; location_type: string }
      formatted_address: string
    }[]
  }

  // ZERO_RESULTS is a per-address problem; anything else is usually the key or
  // quota and will affect every row, so fail loudly rather than mangle the file.
  if (body.status === 'ZERO_RESULTS') return null
  if (body.status !== 'OK') {
    throw new Error(`${body.status}${body.error_message ? `: ${body.error_message}` : ''}`)
  }

  const hit = body.results[0]
  return {
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
    precision: hit.geometry.location_type,
    formatted: hit.formatted_address,
  }
}

async function main() {
  if (!KEY) {
    console.error(
      'No API key. Set GOOGLE_GEOCODING_API_KEY in .env (Geocoding API enabled).',
    )
    process.exit(1)
  }

  const file = JSON.parse(readFileSync(FILE, 'utf8')) as {
    locations: Row[]
    [key: string]: unknown
  }

  let moved = 0
  let failed = 0

  for (const row of file.locations) {
    const query = [row.address, row.city, row.region, row.postalCode, row.country]
      .filter(Boolean)
      .join(', ')

    try {
      const hit = await geocode(query)
      if (!hit) {
        console.warn(`  ✗ ${row.name} — no result for "${query}"`)
        failed++
        continue
      }

      const shift =
        typeof row.lat === 'number' && typeof row.lng === 'number'
          ? metresBetween([row.lat, row.lng], [hit.lat, hit.lng])
          : null

      console.log(
        `  ✓ ${row.name.padEnd(24)} ${hit.lat.toFixed(6)}, ${hit.lng.toFixed(6)}` +
          `  ${hit.precision}${shift === null ? '' : `  (moved ${shift}m)`}`,
      )

      // ROOFTOP / RANGE_INTERPOLATED are building-level; APPROXIMATE is often just
      // the locality centre, which is no better than what we already have.
      if (hit.precision === 'APPROXIMATE') {
        console.warn(`      ↳ approximate only, leaving existing coordinates`)
        continue
      }

      row.lat = Number(hit.lat.toFixed(6))
      row.lng = Number(hit.lng.toFixed(6))
      if (shift !== null && shift > 0) moved++
    } catch (err) {
      console.error(`  ! ${row.name} — ${(err as Error).message}`)
      process.exit(1)
    }
  }

  if (DRY) {
    console.log(`\ndry run — ${moved} would move, ${failed} unresolved. Nothing written.`)
    return
  }

  writeFileSync(FILE, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
  console.log(
    `\nwrote data/locations.json — ${moved} moved, ${failed} unresolved.` +
      `\nRun \`npm run db:seed\` to apply them to the database.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
