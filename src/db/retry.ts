/**
 * Neon (especially free-tier / cold starts) can drop connections mid-query
 * during `next build`'s parallel prerender. Retry a few times on those
 * transient failures before failing the page.
 */
const TRANSIENT = /connection terminated|ECONNRESET|ECONNREFUSED|ETIMEDOUT|timeout|08P01|57P01|53300/i

function isTransient(error: unknown): boolean {
  const messages: string[] = []
  let current: unknown = error
  for (let i = 0; i < 4 && current; i++) {
    if (current instanceof Error) {
      messages.push(current.message)
      if ('code' in current && typeof current.code === 'string') {
        messages.push(current.code)
      }
      current = (current as Error & { cause?: unknown }).cause
      continue
    }
    break
  }
  return messages.some((m) => TRANSIENT.test(m))
}

export async function withDbRetry<T>(
  run: () => Promise<T>,
  { attempts = 5, baseDelayMs = 400 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run()
    } catch (error) {
      lastError = error
      if (!isTransient(error) || attempt === attempts) throw error
      const delay = baseDelayMs * 2 ** (attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
