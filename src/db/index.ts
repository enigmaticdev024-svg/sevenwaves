import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * A single pool is reused across hot reloads in development — without this,
 * every reload would open a new pool and eventually exhaust Postgres.
 */
const globalForDb = globalThis as unknown as { pool: Pool | undefined }

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep this low: `next build` spins up multiple workers that each open a
    // pool, and Neon pooler / free-tier cold starts choke under many concurrent
    // auth attempts.
    max: 1,
    connectionTimeoutMillis: 60_000,
    idleTimeoutMillis: 20_000,
    keepAlive: true,
  })

pool.on('error', (error) => {
  // Idle clients can be dropped by Neon; log and let the next query reconnect.
  console.error('Unexpected Postgres pool error', error.message)
})

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })

export { schema }
export * from './schema'
