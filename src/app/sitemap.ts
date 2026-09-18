import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { SITE_URL } from '@/lib/seo'

const PRIORITIES: Record<string, number> = {
  home: 1,
  'our-cachaca': 0.9,
  'about-us': 0.8,
  recipes: 0.8,
  'where-to-find': 0.7,
  contact: 0.6,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await db.query.pages.findMany({
    columns: { slug: true, updatedAt: true },
  })

  return pages.map((page) => ({
    url: page.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: PRIORITIES[page.slug] ?? 0.5,
  }))
}
