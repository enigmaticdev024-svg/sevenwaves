/**
 * Connectivity + row-count check against whatever DATABASE_URL points at.
 *
 * Useful for confirming a remote (Neon) database matches local after a
 * migrate + seed. Run with:
 *   npx tsx scripts/db-check.ts
 *   DATABASE_URL="postgres://…" npx tsx scripts/db-check.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'

const TABLES = [
  'media_assets',
  'pages',
  'products',
  'process_steps',
  'recipes',
  'partners',
  'locations',
  'contact_submissions',
  'nav_items',
  'site_settings',
  'admin_users',
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  // Never print credentials — show only the host being targeted.
  const { host, pathname } = new URL(url)
  console.log(`target: ${host}${pathname}\n`)

  const pool = new Pool({ connectionString: url })
  try {
    const meta = await pool.query(
      'select version(), current_database() as db, current_user as usr',
    )
    console.log(`connected  ${meta.rows[0].db} as ${meta.rows[0].usr}`)
    console.log(`server     ${meta.rows[0].version.split(',')[0]}\n`)

    const present = await pool.query(
      "select tablename from pg_tables where schemaname = 'public'",
    )
    const names = new Set(present.rows.map((r) => r.tablename))

    let missing = 0
    for (const table of TABLES) {
      if (!names.has(table)) {
        console.log(`  MISSING  ${table}`)
        missing++
        continue
      }
      const { rows } = await pool.query(`select count(*)::int as n from "${table}"`)
      console.log(`  ${String(rows[0].n).padStart(4)}  ${table}`)
    }

    if (names.has('__drizzle_migrations')) {
      const { rows } = await pool.query(
        'select count(*)::int as n from "__drizzle_migrations"',
      )
      console.log(`\nmigrations applied: ${rows[0].n}`)
    }

    if (missing) {
      console.error(`\n${missing} table(s) missing — run db:migrate`)
      process.exitCode = 1
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
