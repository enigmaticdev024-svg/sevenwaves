/**
 * Stockist upsert, shared by the full seed and the locations-only script.
 *
 * Split out from seed.ts so the stockist list can be pushed to a database on its
 * own — the full seed also touches the admin account, pages and media, which is
 * more than you want when all that changed is data/locations.json (after
 * `npm run geocode`, say, or when syncing a hosted database).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { and, eq } from 'drizzle-orm'
import { db } from './index'
import { locations } from './schema'

const PLACEHOLDER = 'Florianópolis, Brazil'

export async function seedLocations() {
  // The live site's locator was Storemapper, which served its list from its own
  // API — the addresses are not in the page HTML and could not be scraped. The
  // export is hand-maintained, not produced by `npm run scrape`.
  const stockists = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'locations.json'), 'utf8'),
  ).locations as Array<typeof locations.$inferInsert>

  let inserted = 0
  let updated = 0

  // Upserted on (name, address) rather than blindly inserted: the two H&H
  // branches share a name, so the street is part of the identity. Locations added
  // through the admin are left alone.
  for (const stockist of stockists) {
    const existing = await db.query.locations.findFirst({
      where: and(
        eq(locations.name, stockist.name),
        eq(locations.address, stockist.address ?? ''),
      ),
    })

    if (existing) {
      await db.update(locations).set(stockist).where(eq(locations.id, existing.id))
      updated++
    } else {
      await db.insert(locations).values(stockist)
      inserted++
    }
  }

  // The placeholder seeded before the real export arrived. Hidden rather than
  // deleted, so it is still recoverable from /admin/locations.
  const placeholder = await db.query.locations.findFirst({
    where: eq(locations.name, PLACEHOLDER),
  })
  let deactivated = false
  if (placeholder?.active) {
    await db
      .update(locations)
      .set({ active: false })
      .where(eq(locations.id, placeholder.id))
    deactivated = true
  }

  return { inserted, updated, deactivated }
}
