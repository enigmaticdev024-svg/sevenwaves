import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { withDbRetry } from '@/db/retry'
import {
  locations,
  navItems,
  partners,
  processSteps,
  products,
  recipes,
  siteSettings,
} from '@/db/schema'
import {
  parsePageContent,
  siteSettingsSchema,
  SITE_SETTINGS_KEY,
  type PageSlug,
  type PageContentFor,
  type SiteSettings,
} from '@/lib/content-schemas'

/** Shape handed to <Image>. */
export type Media = {
  src: string
  alt: string
  width: number
  height: number
} | null

type MediaRow = {
  path: string
  alt: string
  width: number | null
  height: number | null
} | null

/** Falls back to sane dimensions so <Image> never renders without them. */
export function toMedia(row: MediaRow, fallbackAlt = ''): Media {
  if (!row) return null
  return {
    src: row.path,
    alt: row.alt || fallbackAlt,
    width: row.width ?? 1200,
    height: row.height ?? 800,
  }
}

/** Columns every image relation needs; keeps the payload small. */
const mediaColumns = {
  columns: { path: true, alt: true, width: true, height: true },
} as const

// ---------------------------------------------------------------- settings

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await withDbRetry(() =>
    db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, SITE_SETTINGS_KEY),
    }),
  )
  const parsed = siteSettingsSchema.safeParse(row?.value ?? {})
  return parsed.success ? parsed.data : siteSettingsSchema.parse({})
}

export async function getNavItems() {
  return withDbRetry(() =>
    db.query.navItems.findMany({
      where: eq(navItems.active, true),
      orderBy: asc(navItems.order),
      columns: { id: true, label: true, href: true },
    }),
  )
}

// ---------------------------------------------------------------- pages

export async function getPage<S extends PageSlug>(slug: S) {
  const page = await withDbRetry(() =>
    db.query.pages.findFirst({
      where: (p, { eq: equals }) => equals(p.slug, slug),
      with: { heroImage: mediaColumns, ogImage: mediaColumns },
    }),
  )

  return {
    title: page?.title ?? '',
    seoTitle: page?.seoTitle ?? null,
    seoDescription: page?.seoDescription ?? null,
    heroImage: toMedia(page?.heroImage ?? null, page?.title ?? ''),
    ogImage: toMedia(page?.ogImage ?? null, page?.title ?? ''),
    content: parsePageContent(slug, page?.content) as PageContentFor<S>,
  }
}

// ---------------------------------------------------------------- products

export async function getProducts() {
  const rows = await withDbRetry(() =>
    db.query.products.findMany({
      where: eq(products.active, true),
      orderBy: asc(products.order),
      with: {
        bottleImage: mediaColumns,
        bgImage: mediaColumns,
        animalImage: mediaColumns,
      },
    }),
  )

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    recipeSuggestion: p.recipeSuggestion,
    tastingNotes: p.tastingNotes,
    accentColor: p.accentColor,
    titleFadeColor: p.titleFadeColor,
    titleColor: p.titleColor,
    bottle: toMedia(p.bottleImage, `${p.name} bottle`),
    background: toMedia(p.bgImage, ''),
    animal: toMedia(p.animalImage, p.name),
  }))
}

export type Product = Awaited<ReturnType<typeof getProducts>>[number]

// ---------------------------------------------------------------- process

export async function getProcessSteps() {
  const rows = await withDbRetry(() =>
    db.query.processSteps.findMany({
      orderBy: asc(processSteps.order),
      with: { image: mediaColumns },
    }),
  )

  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    image: toMedia(s.image, s.title),
  }))
}

export type ProcessStep = Awaited<ReturnType<typeof getProcessSteps>>[number]

// ---------------------------------------------------------------- recipes

export async function getRecipes({ featuredOnly = false } = {}) {
  const rows = await withDbRetry(() =>
    db.query.recipes.findMany({
      where: featuredOnly
        ? and(eq(recipes.active, true), eq(recipes.featured, true))
        : eq(recipes.active, true),
      orderBy: asc(recipes.order),
      with: { image: mediaColumns },
    }),
  )

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    ingredients: r.ingredients,
    instructions: r.instructions,
    image: toMedia(r.image, r.name),
  }))
}

export type Recipe = Awaited<ReturnType<typeof getRecipes>>[number]

// ---------------------------------------------------------------- partners

export async function getPartners() {
  const rows = await withDbRetry(() =>
    db.query.partners.findMany({
      where: eq(partners.active, true),
      orderBy: asc(partners.order),
      with: { logo: mediaColumns },
    }),
  )

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    logo: toMedia(p.logo, p.title),
  }))
}

export type Partner = Awaited<ReturnType<typeof getPartners>>[number]

// ---------------------------------------------------------------- locations

export async function getLocations() {
  return withDbRetry(() =>
    db.query.locations.findMany({
      where: eq(locations.active, true),
      orderBy: asc(locations.order),
      columns: {
        id: true,
        name: true,
        address: true,
        city: true,
        region: true,
        postalCode: true,
        country: true,
        phone: true,
        lat: true,
        lng: true,
        mapEmbedUrl: true,
        websiteUrl: true,
      },
    }),
  )
}

export type Location = Awaited<ReturnType<typeof getLocations>>[number]
