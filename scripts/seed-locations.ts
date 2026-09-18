/**
 * Pushes data/locations.json into the database and nothing else.
 *
 * Run with:  npm run db:seed:locations
 *
 * Targets whatever DATABASE_URL points at. To sync the hosted database instead
 * of the local one, override it for the single command — the same way the
 * migration is applied:
 *
 *   DATABASE_URL="$NEON_DATABASE_URL" npm run db:seed:locations
 *
 * Idempotent: rows are matched on (name, address), so re-running updates in
 * place. Use this after `npm run geocode` rather than the full `db:seed`, which
 * also re-seeds the admin account, pages and media.
 */
import 'dotenv/config'
import { seedLocations } from '../src/db/seed-locations'

async function main() {
  const host = new URL(process.env.DATABASE_URL!).hostname
  console.log(`seeding locations -> ${host}`)

  const { inserted, updated, deactivated } = await seedLocations()

  if (deactivated) console.log('  placeholder "Florianópolis, Brazil" deactivated')
  console.log(`  ${inserted} added, ${updated} updated`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
