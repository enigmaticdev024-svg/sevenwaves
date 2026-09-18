import type { Metadata } from 'next'
import { ContactForm } from '@/components/contact/ContactForm'
import { JsonLd } from '@/components/seo/JsonLd'
import { Container } from '@/components/site/Container'
import { getPage } from '@/lib/content'
import { breadcrumbSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact')
  return {
    title: page.seoTitle ?? 'Contact',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/contact' },
    openGraph: {
      title: page.seoTitle ?? 'Contact',
      description: page.seoDescription ?? undefined,
      url: '/contact',
      type: 'website',
    },
  }
}

/** Reuses the cream `.sw-wtof` treatment, as the theme's contact page did. */
export default async function ContactPage() {
  const page = await getPage('contact')
  const { content } = page

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Contact', href: '/contact' },
        ])}
      />

      <section className="bg-cream bg-[url('/images/sw-wtof-div.webp')] bg-no-repeat bg-[right_top] pb-12">
        <Container className="mb-12">
          <h1 className="sw-title my-12 text-center">{content.heading}</h1>
          {content.intro && (
            <p className="mx-auto max-w-2xl text-center text-lg">
              {content.intro}
            </p>
          )}

          <div className="mx-auto w-full max-w-2xl py-8 text-start">
            <ContactForm successMessage={content.successMessage} />
          </div>
        </Container>
      </section>
    </>
  )
}
