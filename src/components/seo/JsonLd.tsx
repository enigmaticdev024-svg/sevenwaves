/**
 * Renders a JSON-LD block. The payload is built server-side from our own
 * database, never from user input, and JSON.stringify output is escaped for
 * the `<` that could otherwise break out of the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
