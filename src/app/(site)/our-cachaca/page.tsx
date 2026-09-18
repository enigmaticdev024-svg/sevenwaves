import type { Metadata } from 'next'
import { ProductShowcase } from '@/components/products/ProductShowcase'
import { JsonLd } from '@/components/seo/JsonLd'
import { getPage, getProducts, getSiteSettings } from '@/lib/content'
import { breadcrumbSchema, productSchema } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('our-cachaca')
  return {
    title: page.seoTitle ?? 'Our Cachaça',
    description: page.seoDescription ?? undefined,
    alternates: { canonical: '/our-cachaca' },
    openGraph: {
      title: page.seoTitle ?? 'Our Cachaça',
      description: page.seoDescription ?? undefined,
      url: '/our-cachaca',
      type: 'website',
    },
  }
}

export default async function OurCachacaPage() {
  const [page, products, settings] = await Promise.all([
    getPage('our-cachaca'),
    getProducts(),
    getSiteSettings(),
  ])

  return (
    <>
      {products.map((product) => (
        <JsonLd key={product.id} data={productSchema(product, settings)} />
      ))}
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', href: '/' },
          { name: 'Our Cachaça', href: '/our-cachaca' },
        ])}
      />

      <h1 className="sr-only">Our Cachaça</h1>

      <ProductShowcase
        products={products}
        recipeSuggestionLabel={page.content.recipeSuggestionLabel}
      />
    </>
  )
}
