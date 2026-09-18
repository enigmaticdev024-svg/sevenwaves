import type { SiteSettings } from '@/lib/content-schemas'
import type { Product, Recipe } from '@/lib/content'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

const abs = (path: string) =>
  path.startsWith('http') ? path : `${SITE_URL}${path}`

export function organizationSchema(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: SITE_URL,
    description: settings.seoDescription,
    logo: abs('/images/seven-waves-logo.svg'),
    sameAs: settings.social.map((s) => s.href),
  }
}

export function websiteSchema(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.siteName,
    url: SITE_URL,
    description: settings.seoDescription,
  }
}

export function productSchema(product: Product, settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${settings.siteName} ${product.name}`,
    description: product.description,
    brand: { '@type': 'Brand', name: settings.siteName },
    category: 'Cachaça',
    ...(product.bottle ? { image: abs(product.bottle.src) } : {}),
    ...(product.tastingNotes.length
      ? {
          additionalProperty: product.tastingNotes.map((note) => ({
            '@type': 'PropertyValue',
            name: 'Tasting note',
            value: note,
          })),
        }
      : {}),
  }
}

/** Splits the free-text ingredient / instruction blocks into schema arrays. */
function lines(block: string): string[] {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

export function recipeSchema(recipe: Recipe, settings: SiteSettings) {
  const steps = lines(recipe.instructions)
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    ...(recipe.image ? { image: abs(recipe.image.src) } : {}),
    author: { '@type': 'Organization', name: settings.siteName },
    recipeCategory: 'Cocktail',
    recipeCuisine: 'Brazilian',
    recipeIngredient: lines(recipe.ingredients),
    recipeInstructions: (steps.length
      ? steps
      : [recipe.instructions]
    ).map((text) => ({ '@type': 'HowToStep', text })),
  }
}

export function breadcrumbSchema(
  trail: { name: string; href: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.href),
    })),
  }
}
