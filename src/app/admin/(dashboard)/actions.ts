'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  contactSubmissions,
  locations,
  mediaAssets,
  navItems,
  pages,
  partners,
  processSteps,
  products,
  recipes,
  siteSettings,
} from '@/db/schema'
import {
  pageSchemas,
  siteSettingsSchema,
  SITE_SETTINGS_KEY,
  type PageSlug,
} from '@/lib/content-schemas'

export type ActionState = { status: 'idle' | 'success' | 'error'; message?: string }

/**
 * Every mutation below goes through this. Server actions are publicly callable
 * endpoints, so each one must authenticate independently — the admin layout's
 * check protects rendering, not invocation.
 */
async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session
}

/** Public pages are statically rendered; refresh them after every write. */
function revalidateSite() {
  for (const path of [
    '/',
    '/our-cachaca',
    '/about-us',
    '/recipes',
    '/where-to-find',
    '/contact',
  ]) {
    revalidatePath(path)
  }
  revalidatePath('/sitemap.xml')
}

const str = (v: FormDataEntryValue | null) => String(v ?? '').trim()
const num = (v: FormDataEntryValue | null, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const bool = (v: FormDataEntryValue | null) => v === 'on' || v === 'true'
const nullableId = (v: FormDataEntryValue | null) => {
  const s = str(v)
  return s === '' ? null : s
}
/** Textarea list -> string[], one entry per non-empty line. */
const lines = (v: FormDataEntryValue | null) =>
  str(v)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

// ---------------------------------------------------------------- pages

export async function savePage(
  slug: PageSlug,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const schema = pageSchemas[slug]
  // Build the content object from the flat form, letting Zod fill defaults.
  const raw: Record<string, unknown> = {}
  for (const key of Object.keys(schema.shape)) {
    const value = formData.get(`content.${key}`)
    if (value === null) continue
    // `body` on the about page is a list of paragraphs, one per blank-line block.
    raw[key] =
      key === 'body'
        ? String(value)
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
        : String(value)
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message }
  }

  await db
    .update(pages)
    .set({
      title: str(formData.get('title')),
      seoTitle: str(formData.get('seoTitle')) || null,
      seoDescription: str(formData.get('seoDescription')) || null,
      heroImageId: nullableId(formData.get('heroImageId')),
      ogImageId: nullableId(formData.get('ogImageId')),
      content: parsed.data,
    })
    .where(eq(pages.slug, slug))

  revalidateSite()
  return { status: 'success', message: 'Saved.' }
}

// ---------------------------------------------------------------- products

export async function saveProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = str(formData.get('id'))
  const name = str(formData.get('name')).toUpperCase()
  if (!name) return { status: 'error', message: 'Name is required.' }

  const data = {
    name,
    slug: str(formData.get('slug')) || name.toLowerCase(),
    order: num(formData.get('order')),
    description: str(formData.get('description')),
    recipeSuggestion: str(formData.get('recipeSuggestion')),
    tastingNotes: lines(formData.get('tastingNotes')),
    accentColor: str(formData.get('accentColor')) || '#eea33b',
    titleColor: str(formData.get('titleColor')) || '#232e44',
    titleFadeColor: str(formData.get('titleFadeColor')) || 'rgba(35,46,68,.1)',
    active: bool(formData.get('active')),
    bottleImageId: nullableId(formData.get('bottleImageId')),
    bgImageId: nullableId(formData.get('bgImageId')),
    animalImageId: nullableId(formData.get('animalImageId')),
  }

  if (id) await db.update(products).set(data).where(eq(products.id, id))
  else await db.insert(products).values(data)

  revalidateSite()
  redirect('/admin/products')
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin()
  await db.delete(products).where(eq(products.id, str(formData.get('id'))))
  revalidateSite()
  redirect('/admin/products')
}

// ---------------------------------------------------------------- process

export async function saveProcessStep(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = str(formData.get('id'))
  const data = {
    order: num(formData.get('order')),
    title: str(formData.get('title')),
    body: str(formData.get('body')),
    imageId: nullableId(formData.get('imageId')),
  }
  if (!data.title) return { status: 'error', message: 'Title is required.' }

  if (id) await db.update(processSteps).set(data).where(eq(processSteps.id, id))
  else await db.insert(processSteps).values(data)

  revalidateSite()
  redirect('/admin/process')
}

export async function deleteProcessStep(formData: FormData) {
  await requireAdmin()
  await db.delete(processSteps).where(eq(processSteps.id, str(formData.get('id'))))
  revalidateSite()
  redirect('/admin/process')
}

// ---------------------------------------------------------------- recipes

export async function saveRecipe(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = str(formData.get('id'))
  const name = str(formData.get('name'))
  if (!name) return { status: 'error', message: 'Name is required.' }

  const data = {
    order: num(formData.get('order')),
    name,
    slug:
      str(formData.get('slug')) ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ingredients: str(formData.get('ingredients')),
    instructions: str(formData.get('instructions')),
    featured: bool(formData.get('featured')),
    active: bool(formData.get('active')),
    imageId: nullableId(formData.get('imageId')),
  }

  if (id) await db.update(recipes).set(data).where(eq(recipes.id, id))
  else await db.insert(recipes).values(data)

  revalidateSite()
  redirect('/admin/recipes')
}

export async function deleteRecipe(formData: FormData) {
  await requireAdmin()
  await db.delete(recipes).where(eq(recipes.id, str(formData.get('id'))))
  revalidateSite()
  redirect('/admin/recipes')
}

// ---------------------------------------------------------------- partners

export async function savePartner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = str(formData.get('id'))
  const data = {
    order: num(formData.get('order')),
    title: str(formData.get('title')),
    logoId: nullableId(formData.get('logoId')),
    active: bool(formData.get('active')),
  }
  if (!data.title) return { status: 'error', message: 'Title is required.' }

  if (id) await db.update(partners).set(data).where(eq(partners.id, id))
  else await db.insert(partners).values(data)

  revalidateSite()
  redirect('/admin/partners')
}

export async function deletePartner(formData: FormData) {
  await requireAdmin()
  await db.delete(partners).where(eq(partners.id, str(formData.get('id'))))
  revalidateSite()
  redirect('/admin/partners')
}

// ---------------------------------------------------------------- locations

export async function saveLocation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const id = str(formData.get('id'))
  const latRaw = str(formData.get('lat'))
  const lngRaw = str(formData.get('lng'))
  const lat = latRaw ? Number(latRaw) : null
  const lng = lngRaw ? Number(lngRaw) : null

  if ((lat === null) !== (lng === null)) {
    return {
      status: 'error',
      message: 'Latitude and longitude must either both be set or both be empty.',
    }
  }
  if (
    lat !== null &&
    lng !== null &&
    (!Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180)
  ) {
    return { status: 'error', message: 'Enter valid map coordinates.' }
  }

  const data = {
    order: num(formData.get('order')),
    name: str(formData.get('name')),
    address: str(formData.get('address')),
    city: str(formData.get('city')),
    region: str(formData.get('region')),
    postalCode: str(formData.get('postalCode')),
    country: str(formData.get('country')) || 'USA',
    phone: str(formData.get('phone')),
    lat,
    lng,
    mapEmbedUrl: str(formData.get('mapEmbedUrl')),
    websiteUrl: str(formData.get('websiteUrl')),
    active: bool(formData.get('active')),
  }
  if (!data.name) return { status: 'error', message: 'Name is required.' }

  if (id) await db.update(locations).set(data).where(eq(locations.id, id))
  else await db.insert(locations).values(data)

  revalidateSite()
  redirect('/admin/locations')
}

export async function deleteLocation(formData: FormData) {
  await requireAdmin()
  await db.delete(locations).where(eq(locations.id, str(formData.get('id'))))
  revalidateSite()
  redirect('/admin/locations')
}

// ---------------------------------------------------------------- settings

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const socialLabels = formData.getAll('socialLabel').map(String)
  const socialHrefs = formData.getAll('socialHref').map(String)
  const social = socialLabels
    .map((label, i) => ({ label: label.trim(), href: (socialHrefs[i] ?? '').trim() }))
    .filter((s) => s.label && s.href)

  const parsed = siteSettingsSchema.safeParse({
    siteName: str(formData.get('siteName')),
    tagline: str(formData.get('tagline')),
    copyright: str(formData.get('copyright')),
    social,
    ageGateEnabled: bool(formData.get('ageGateEnabled')),
    ageGateMinAge: num(formData.get('ageGateMinAge'), 21),
    ageGateHeading: str(formData.get('ageGateHeading')),
    ageGateBody: str(formData.get('ageGateBody')),
    ageGateConfirm: str(formData.get('ageGateConfirm')),
    ageGateDeny: str(formData.get('ageGateDeny')),
    ageGateRememberDays: num(formData.get('ageGateRememberDays'), 30),
    seoTitle: str(formData.get('seoTitle')),
    seoDescription: str(formData.get('seoDescription')),
  })

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message }
  }

  await db
    .insert(siteSettings)
    .values({ key: SITE_SETTINGS_KEY, value: parsed.data })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: parsed.data },
    })

  revalidateSite()
  return { status: 'success', message: 'Saved.' }
}

const navSchema = z.array(
  z.object({ label: z.string().min(1), href: z.string().min(1) }),
)

export async function saveNav(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()

  const labels = formData.getAll('navLabel').map(String)
  const hrefs = formData.getAll('navHref').map(String)
  const items = labels
    .map((label, i) => ({ label: label.trim(), href: (hrefs[i] ?? '').trim() }))
    .filter((n) => n.label && n.href)

  const parsed = navSchema.safeParse(items)
  if (!parsed.success) {
    return { status: 'error', message: 'Each menu item needs a label and a link.' }
  }

  await db.transaction(async (tx) => {
    await tx.delete(navItems)
    await tx.insert(navItems).values(
      parsed.data.map((n, i) => ({ ...n, order: i })),
    )
  })

  revalidateSite()
  return { status: 'success', message: 'Menu saved.' }
}

// ---------------------------------------------------------------- media

export async function updateMediaAlt(formData: FormData) {
  await requireAdmin()
  await db
    .update(mediaAssets)
    .set({ alt: str(formData.get('alt')) })
    .where(eq(mediaAssets.id, str(formData.get('id'))))
  revalidateSite()
  revalidatePath('/admin/media')
}

// ---------------------------------------------------------------- inbox

export async function toggleSubmissionRead(formData: FormData) {
  await requireAdmin()
  const id = str(formData.get('id'))
  const current = await db.query.contactSubmissions.findFirst({
    where: eq(contactSubmissions.id, id),
  })
  await db
    .update(contactSubmissions)
    .set({ readAt: current?.readAt ? null : new Date() })
    .where(eq(contactSubmissions.id, id))
  revalidatePath('/admin/submissions')
}

export async function deleteSubmission(formData: FormData) {
  await requireAdmin()
  await db
    .delete(contactSubmissions)
    .where(eq(contactSubmissions.id, str(formData.get('id'))))
  revalidatePath('/admin/submissions')
}
