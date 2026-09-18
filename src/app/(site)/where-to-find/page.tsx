import type { Metadata } from 'next'
import { StockistMap } from '@/components/locator/StockistMap'
import { JsonLd } from '@/components/seo/JsonLd'
import { Container } from '@/components/site/Container'
import { getLocations, getPage } from '@/lib/content'
import { breadcrumbSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('where-to-find')
  return {
    title: page.seoTitle ?? 'Where to Find',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/where-to-find' },
    openGraph: {
      title: page.seoTitle ?? 'Where to Find',
      description: page.seoDescription ?? undefined,
      url: '/where-to-find',
      type: 'website',
    },
  }
}

/**
 * `.sw-wtof` — cream background with the sw-wtof-div shape anchored to the top
 * right, centred content.
 */
export default async function WhereToFindPage() {
  const [page, locations] = await Promise.all([
    getPage('where-to-find'),
    getLocations(),
  ])

  const { content } = page

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Where to Find', href: '/where-to-find' },
        ])}
      />

      <section className="flex items-center bg-cream bg-[url('/images/sw-wtof-div.webp')] bg-no-repeat bg-[right_top] text-center">
        <Container className="mb-12 pb-12">
          <h1 className="fluid-wtof-title sw-title my-12">{content.heading}</h1>
          {content.intro && <p className="text-lg">{content.intro}</p>}

          {/* NEXT_PUBLIC_* is inlined at build time, so the key must be present
              when `next build` runs — not just at runtime on the server. */}
          <StockistMap
            locations={locations}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
            searchLabel={content.selectLabel}
          />
        </Container>
      </section>
    </>
  )
}
