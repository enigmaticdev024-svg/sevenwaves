import type { Metadata } from 'next'
import Image from 'next/image'
import { JsonLd } from '@/components/seo/JsonLd'
import { Container } from '@/components/site/Container'
import { getPage } from '@/lib/content'
import { breadcrumbSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about-us')
  return {
    title: page.seoTitle ?? 'About Us',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/about-us' },
    openGraph: {
      title: page.seoTitle ?? 'About Us',
      description: page.seoDescription ?? undefined,
      url: '/about-us',
      type: 'article',
      images: page.heroImage ? [page.heroImage.src] : undefined,
    },
  }
}

/**
 * `.sw-aboutus` — amber page with a navy top band carrying the sw-aboutus-div
 * wave anchored to its left edge (padding 15rem top / 30rem bottom, 10rem on
 * mobile). The headline is cream; highlighted runs sit on an amber background.
 */
export default async function AboutUsPage() {
  const page = await getPage('about-us')
  const { content } = page

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'About Us', href: '/about-us' },
        ])}
      />

      <section className="bg-amber">
        <div className="bg-navy bg-[url('/images/sw-aboutus-div.webp')] bg-contain bg-[left_bottom] bg-no-repeat px-4 py-40 lg:pt-60 lg:pb-[30rem]">
          <article className="mx-auto max-w-4xl">
            <h1 className="fluid-about-title font-semibold text-cream">
              {content.headline}
            </h1>
          </article>
        </div>

        <Container>
          <article className="mx-auto max-w-4xl py-12">
            {content.subheading && (
              <h2 className="fluid-h3 mt-12 font-display font-light uppercase text-center pl-8 pr-8 font-bold">
                {content.subheading}
              </h2>
            )}

            {page.heroImage && (
              <figure className="my-12">
                <Image
                  src={page.heroImage.src}
                  alt={page.heroImage.alt || 'Seven Waves'}
                  width={page.heroImage.width}
                  height={page.heroImage.height}
                  sizes="(max-width: 992px) 100vw, 900px"
                  className="h-auto w-full"
                />
              </figure>
            )}

            <div className="space-y-6">
              {content.body.map((paragraph, i) => (
                <p key={i} className="fluid-about-body">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </Container>
      </section>
    </>
  )
}
