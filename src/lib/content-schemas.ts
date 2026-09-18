import { z } from 'zod'

/**
 * Per-page singleton copy.
 *
 * Repeatable content (products, process steps, recipes, partners, locations)
 * lives in its own table. What remains is the fixed copy for each page, stored
 * as JSON in Page.content and validated here so the admin forms stay
 * structured and a bad write can't corrupt a page.
 */

export const homeContentSchema = z.object({
  heroCopy: z.string().default(''),
  heroCta: z.string().default('more about us'),
  heroCtaHref: z.string().default('/about-us'),
  bottlesHeading: z.string().default(''),
  bottlesCopy: z.string().default(''),
  bottlesCta: z.string().default('Our cachaça'),
  bottlesCtaHref: z.string().default('/our-cachaca'),
  processIntro: z.string().default(''),
  processOutro: z.string().default(''),
  partnersHeading: z.string().default(''),
})

export const aboutContentSchema = z.object({
  headline: z.string().default(''),
  subheading: z.string().default(''),
  body: z.array(z.string()).default([]),
})

export const ourCachacaContentSchema = z.object({
  recipeSuggestionLabel: z.string().default('Recipe suggestion:'),
})

export const recipesContentSchema = z.object({
  heading: z.string().default(''),
  ingredientsLabel: z.string().default('Ingredients:'),
  instructionsLabel: z.string().default('Instructions:'),
})

export const whereToFindContentSchema = z.object({
  heading: z.string().default('Where to find'),
  intro: z.string().default(''),
  // `selectLabel` named the old <select>; the locator is now a searchable map, so
  // it doubles as the search field's placeholder. Kept under the same key so
  // existing stored content and the admin form carry over unchanged.
  selectLabel: z.string().default('Search by city, ZIP or venue'),
})

export const contactContentSchema = z.object({
  heading: z.string().default('Contact'),
  intro: z.string().default(''),
  successMessage: z
    .string()
    .default('Thank you — your message has been sent. We will be in touch soon.'),
})

/** slug -> schema */
export const pageSchemas = {
  home: homeContentSchema,
  'about-us': aboutContentSchema,
  'our-cachaca': ourCachacaContentSchema,
  recipes: recipesContentSchema,
  'where-to-find': whereToFindContentSchema,
  contact: contactContentSchema,
} as const

export type PageSlug = keyof typeof pageSchemas

export type HomeContent = z.infer<typeof homeContentSchema>
export type AboutContent = z.infer<typeof aboutContentSchema>
export type OurCachacaContent = z.infer<typeof ourCachacaContentSchema>
export type RecipesContent = z.infer<typeof recipesContentSchema>
export type WhereToFindContent = z.infer<typeof whereToFindContentSchema>
export type ContactContent = z.infer<typeof contactContentSchema>

export type PageContentFor<S extends PageSlug> = z.infer<(typeof pageSchemas)[S]>

/**
 * Parse a Page.content blob for a given slug. Falls back to schema defaults so
 * a page always renders, even if the stored JSON is empty or partial.
 */
export function parsePageContent<S extends PageSlug>(
  slug: S,
  value: unknown,
): PageContentFor<S> {
  const schema = pageSchemas[slug]
  const result = schema.safeParse(value ?? {})
  if (result.success) return result.data as PageContentFor<S>
  return schema.parse({}) as PageContentFor<S>
}

// ---------------------------------------------------------------- settings

export const socialLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

export const siteSettingsSchema = z.object({
  siteName: z.string().default('Seven Waves'),
  tagline: z.string().default('Genuine Cachaça Of Brazil'),
  copyright: z.string().default('Seven Waves. All rights reserved.'),
  social: z.array(socialLinkSchema).default([]),
  ageGateEnabled: z.boolean().default(true),
  ageGateMinAge: z.number().int().default(21),
  ageGateHeading: z.string().default('Are you of legal drinking age?'),
  ageGateBody: z
    .string()
    .default('You must be of legal age to enter this site.'),
  ageGateConfirm: z.string().default('Yes, I am'),
  ageGateDeny: z.string().default('No'),
  ageGateRememberDays: z.number().int().default(30),
  seoTitle: z.string().default('Seven Waves'),
  seoDescription: z.string().default('Genuine Cachaça Of Brazil'),
})

export type SiteSettings = z.infer<typeof siteSettingsSchema>

export const SITE_SETTINGS_KEY = 'site'

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(200),
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().max(200).optional().default(''),
  message: z
    .string()
    .trim()
    .min(10, 'Please enter a message of at least 10 characters.')
    .max(5000),
  // Honeypot — real users never fill this in.
  website: z.string().max(0).optional().default(''),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
