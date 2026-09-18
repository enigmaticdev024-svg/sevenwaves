/**
 * Seeds PostgreSQL from data/seed-data.json (produced by scripts/scrape-wp.ts).
 *
 * Idempotent: safe to re-run. Run with `npm run db:seed`.
 */
import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { seedLocations } from './seed-locations'
import sharp from 'sharp'
import { db } from './index'
import {
  adminUsers,
  mediaAssets,
  navItems,
  pages,
  partners,
  processSteps,
  products,
  recipes,
  siteSettings,
} from './schema'

type SeedData = typeof import('../../data/seed-data.json')

const PUBLIC_DIR = join(process.cwd(), 'public')
const DATA_FILE = join(process.cwd(), 'data', 'seed-data.json')

// Per-product section palette, transcribed from the theme's compiled CSS
// (.sw-ourcachaca-OAK / -SILVER / -CLASSIC / -UMBURANA and the faded
// repeated-wordmark colours).
const PRODUCT_STYLES: Record<
  string,
  { accentColor: string; titleFadeColor: string; titleColor: string; bg: string }
> = {
  OAK: {
    accentColor: '#eea33b',
    titleFadeColor: 'rgba(0,128,128,.1)',
    titleColor: '#008080',
    bg: '/images/sw-bg-oak.webp',
  },
  SILVER: {
    accentColor: '#a6d5e1',
    titleFadeColor: 'rgba(35,46,68,.1)',
    titleColor: '#232e44',
    bg: '/images/sw-bg-silver.webp',
  },
  CLASSIC: {
    accentColor: '#a6d5e1',
    titleFadeColor: 'rgba(35,46,68,.1)',
    titleColor: '#232e44',
    bg: '/images/sw-bg-silver.webp',
  },
  UMBURANA: {
    accentColor: '#baa58c',
    titleFadeColor: 'rgba(255,236,220,.1)',
    titleColor: '#ffecdc',
    bg: '/images/sw-bg-umburana.webp',
  },
}

const ANIMAL_IMAGES: Record<string, string> = {
  OAK: '/images/sw-animal-oak.webp',
  SILVER: '/images/sw-animal-silver.webp',
  CLASSIC: '/images/sw-animal-silver.webp',
  UMBURANA: '/images/sw-animal-umburana.webp',
}

// ---------------------------------------------------------------- media

const mediaCache = new Map<string, string>()

/**
 * Registers a public image path as a media asset, reading real dimensions off
 * disk so <Image> can always be given explicit width/height.
 */
async function media(path: string | null, alt = ''): Promise<string | null> {
  if (!path) return null
  const cached = mediaCache.get(path)
  if (cached) return cached

  const filePath = join(PUBLIC_DIR, path.replace(/^\//, ''))
  let width: number | null = null
  let height: number | null = null
  let size = 0
  let mime = 'image/webp'

  if (existsSync(filePath)) {
    try {
      const meta = await sharp(filePath).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
      size = meta.size ?? 0
      if (meta.format === 'png') mime = 'image/png'
      else if (meta.format === 'jpeg') mime = 'image/jpeg'
      else if (meta.format === 'svg') mime = 'image/svg+xml'
    } catch {
      // Non-fatal: an unreadable image still gets a row so the page renders.
    }
  } else {
    console.warn(`  ! missing file for ${path}`)
  }

  const filename = path.split('/').pop() ?? path
  const [asset] = await db
    .insert(mediaAssets)
    .values({ path, filename, alt, width, height, size, mime })
    .onConflictDoUpdate({
      target: mediaAssets.path,
      set: { width, height, size, mime, ...(alt ? { alt } : {}) },
    })
    .returning({ id: mediaAssets.id })

  mediaCache.set(path, asset.id)
  return asset.id
}

// ---------------------------------------------------------------- main

async function main() {
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as SeedData

  console.log('seeding…')

  // --- admin user ----------------------------------------------------
  const email = process.env.ADMIN_EMAIL || 'admin@sevenwaves.com'
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
  await db
    .insert(adminUsers)
    .values({
      email,
      name: process.env.ADMIN_NAME || 'Seven Waves Admin',
      passwordHash: await bcrypt.hash(password, 12),
    })
    .onConflictDoNothing({ target: adminUsers.email })
  console.log(`  admin      ${email}`)

  // --- site settings -------------------------------------------------
  await db
    .insert(siteSettings)
    .values({
      key: 'site',
      value: {
        siteName: 'Seven Waves',
        tagline: data.home.seo.description || 'Genuine Cachaça Of Brazil',
        copyright: 'Seven Waves. All rights reserved.',
        social: data.chrome.social,
        ageGateEnabled: true,
        ageGateMinAge: 21,
        ageGateHeading: 'Are you of legal drinking age?',
        ageGateBody: 'You must be 21 or older to enter this site.',
        ageGateConfirm: 'Yes, I am 21 or older',
        ageGateDeny: 'No',
        ageGateRememberDays: 30,
        seoTitle: 'Seven Waves',
        seoDescription: data.home.seo.description || 'Genuine Cachaça Of Brazil',
      },
    })
    .onConflictDoNothing({ target: siteSettings.key })

  // --- navigation ----------------------------------------------------
  await db.delete(navItems)
  await db.insert(navItems).values(
    data.chrome.nav.map((n, i) => ({ order: i, label: n.label, href: n.href })),
  )
  console.log(`  nav        ${data.chrome.nav.length}`)

  // --- pages ---------------------------------------------------------
  const heroImageId = await media(data.home.heroImage, 'Seven Waves')
  const aboutImageId = await media(data.about.image, 'Seven Waves founders')

  const pageRows = [
    {
      slug: 'home',
      title: 'Home',
      heroImageId,
      seoTitle: 'Seven Waves — Genuine Cachaça of Brazil',
      seoDescription: data.home.bottlesCopy || data.home.seo.description,
      content: {
        heroCopy: data.home.heroCopy,
        heroCta: data.home.heroCta || 'more about us',
        heroCtaHref: '/about-us',
        bottlesHeading: data.home.bottlesHeading,
        bottlesCopy: data.home.bottlesCopy,
        bottlesCta: data.home.bottlesCta || 'Our cachaça',
        bottlesCtaHref: '/our-cachaca',
        processIntro: data.home.processIntro,
        processOutro: data.home.processOutro,
        partnersHeading: data.home.partnersHeading,
      },
    },
    {
      slug: 'about-us',
      title: 'About Us',
      heroImageId: aboutImageId,
      seoTitle: 'About Us — Seven Waves',
      seoDescription: data.about.subheading || data.about.headline,
      content: {
        headline: data.about.headline,
        subheading: data.about.subheading,
        body: data.about.body,
      },
    },
    {
      slug: 'our-cachaca',
      title: 'Our Cachaça',
      heroImageId: null,
      seoTitle: 'Our Cachaça — Seven Waves',
      seoDescription:
        'Explore the Seven Waves range: Silver, Classic, Oak and Umburana — organic Brazilian cachaça.',
      content: { recipeSuggestionLabel: 'Recipe suggestion:' },
    },
    {
      slug: 'recipes',
      title: 'Recipes',
      heroImageId: null,
      seoTitle: 'Recipes — Seven Waves',
      seoDescription:
        'Caipirinhas and cocktails made with Seven Waves organic Brazilian cachaça.',
      content: {
        heading: data.recipes.heading,
        ingredientsLabel: 'Ingredients:',
        instructionsLabel: 'Instructions:',
      },
    },
    {
      slug: 'where-to-find',
      title: 'Where to Find',
      heroImageId: null,
      seoTitle: 'Where to Find — Seven Waves',
      seoDescription: 'Find Seven Waves cachaça near you.',
      content: {
        heading: 'Where to find',
        intro: '',
        // Doubles as the locator's search placeholder — see whereToFindContentSchema.
        selectLabel: 'Search by city, ZIP or venue',
      },
    },
    {
      slug: 'contact',
      title: 'Contact',
      heroImageId: null,
      seoTitle: 'Contact — Seven Waves',
      seoDescription: 'Get in touch with the Seven Waves team.',
      content: {
        heading: 'Contact',
        intro: '',
        successMessage:
          'Thank you — your message has been sent. We will be in touch soon.',
      },
    },
  ]

  for (const page of pageRows) {
    await db.insert(pages).values(page).onConflictDoNothing({ target: pages.slug })
  }
  console.log(`  pages      ${pageRows.length}`)

  // --- products ------------------------------------------------------
  await db.delete(products)
  for (const [i, p] of data.products.products.entries()) {
    const style = PRODUCT_STYLES[p.name] ?? PRODUCT_STYLES.SILVER
    await db.insert(products).values({
      order: i,
      name: p.name,
      slug: p.slug,
      description: p.description,
      recipeSuggestion: p.recipeSuggestion,
      tastingNotes: p.tastingNotes,
      accentColor: style.accentColor,
      titleFadeColor: style.titleFadeColor,
      titleColor: style.titleColor,
      bottleImageId: await media(p.bottle, `${p.name} bottle`),
      bgImageId: await media(style.bg, `${p.name} background`),
      animalImageId: await media(ANIMAL_IMAGES[p.name] ?? null, p.name),
    })
  }
  console.log(`  products   ${data.products.products.length}`)

  // --- process steps --------------------------------------------------
  await db.delete(processSteps)
  for (const [i, s] of data.home.steps.entries()) {
    await db.insert(processSteps).values({
      order: i,
      title: s.title,
      body: s.body,
      imageId: await media(s.image, s.title),
    })
  }
  console.log(`  process    ${data.home.steps.length}`)

  // --- recipes --------------------------------------------------------
  // Resolve each homepage slider entry to its single best recipe. Matching the
  // other way round over-matches, because half the recipes end in "Caipirinha".
  const featuredNames = new Set<string>()
  for (const drink of data.home.featuredDrinks) {
    const target = drink.name.toLowerCase()
    const best = data.recipes.recipes
      .map((r) => r.name)
      .filter((name) => {
        const n = name.toLowerCase()
        return n === target || target.includes(n) || n.includes(target)
      })
      .sort((a, b) => {
        const aExact = a.toLowerCase() === target ? 1 : 0
        const bExact = b.toLowerCase() === target ? 1 : 0
        return bExact - aExact || b.length - a.length
      })[0]
    if (best) featuredNames.add(best)
  }

  await db.delete(recipes)
  for (const [i, r] of data.recipes.recipes.entries()) {
    await db.insert(recipes).values({
      order: i,
      name: r.name,
      slug: r.slug,
      ingredients: r.ingredients,
      instructions: r.instructions,
      featured: featuredNames.has(r.name),
      imageId: await media(r.image, r.name),
    })
  }
  console.log(
    `  recipes    ${data.recipes.recipes.length} (${featuredNames.size} featured)`,
  )

  // --- partners -------------------------------------------------------
  await db.delete(partners)
  for (const [i, p] of data.home.partners.entries()) {
    await db.insert(partners).values({
      order: i,
      title: p.title,
      icon: p.icon,
      logoId: await media(p.image, p.title),
    })
  }
  console.log(`  partners   ${data.home.partners.length}`)

  // --- locations ------------------------------------------------------
  // Shared with `npm run db:seed:locations` — see src/db/seed-locations.ts.
  const stockistResult = await seedLocations()
  if (stockistResult.deactivated) {
    console.log('  locations  placeholder "Florianópolis, Brazil" deactivated')
  }
  console.log(
    `  locations  ${stockistResult.inserted} added, ${stockistResult.updated} updated`,
  )

  console.log('done.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
