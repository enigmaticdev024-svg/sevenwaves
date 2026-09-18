import type { Metadata } from 'next'
import { BottlesSection } from '@/components/home/BottlesSection'
import { DrinksSection } from '@/components/home/DrinksSection'
import { HeroSection } from '@/components/home/HeroSection'
import { PartnersSection } from '@/components/home/PartnersSection'
import { ProcessSection } from '@/components/home/ProcessSection'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  getPage,
  getPartners,
  getProcessSteps,
  getProducts,
  getRecipes,
  getSiteSettings,
} from '@/lib/content'
import { organizationSchema, websiteSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home')
  return {
    title: page.seoTitle ?? 'Seven Waves',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/' },
    openGraph: {
      title: page.seoTitle ?? 'Seven Waves',
      description: page.seoDescription ?? undefined,
      url: '/',
      type: 'website',
      images: page.heroImage ? [page.heroImage.src] : undefined,
    },
  }
}

export default async function HomePage() {
  const [page, products, steps, featured, partners, settings] = await Promise.all([
    getPage('home'),
    getProducts(),
    getProcessSteps(),
    getRecipes({ featuredOnly: true }),
    getPartners(),
    getSiteSettings(),
  ])

  const { content } = page

  return (
    <>
      <JsonLd data={organizationSchema(settings)} />
      <JsonLd data={websiteSchema(settings)} />

      <h1 className="sr-only">Seven Waves — {settings.tagline}</h1>

      <HeroSection
        image={page.heroImage}
        copy={content.heroCopy}
        cta={content.heroCta}
        ctaHref={content.heroCtaHref}
      />

      <BottlesSection
        products={products}
        heading={content.bottlesHeading}
        copy={content.bottlesCopy}
        cta={content.bottlesCta}
        ctaHref={content.bottlesCtaHref}
      />

      <ProcessSection
        steps={steps}
        intro={content.processIntro}
        outro={content.processOutro}
      />

      <DrinksSection recipes={featured} />

      <PartnersSection partners={partners} heading={content.partnersHeading} />
    </>
  )
}
