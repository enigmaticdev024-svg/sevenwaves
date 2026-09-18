/**
 * Pings DATABASE_URL so a suspended Neon project is awake before `next build`
 * starts prerendering pages that all hit Postgres at once.
 */
import 'dotenv/config'
import { Pool } from 'pg'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 60_000,
  })

  try {
    await pool.query('select 1')
    console.log('database ready')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('failed to wake database:', error)
  process.exit(1)
})
