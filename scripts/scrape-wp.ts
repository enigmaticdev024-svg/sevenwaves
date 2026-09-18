/**
 * Scrapes the live WordPress site and writes data/seed-data.json.
 *
 * All page copy lived in the WordPress database (ACF fields), not in the theme
 * files, so this is the only way to recover it. Images are downloaded into
 * public/images (skipped when the theme already shipped the same filename).
 *
 * The live site lazy-loads images: the real URL is in `data-src`, while `src`
 * holds a base64 placeholder. Always prefer `data-src`.
 *
 * Run with: npx tsx scripts/scrape-wp.ts
 */
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { basename, join } from 'node:path'
import * as cheerio from 'cheerio'

const BASE = 'https://sevenwaves.com'
const PUBLIC_IMAGES = join(process.cwd(), 'public', 'images')
const OUT = join(process.cwd(), 'data', 'seed-data.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

type Img = { src: string; alt: string; width?: number; height?: number }

// ---------------------------------------------------------------- helpers

async function fetchPage(path: string): Promise<cheerio.CheerioAPI> {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return cheerio.load(await res.text())
}

/** Real image URL: data-src (lazy) wins over the base64 placeholder in src. */
function imgOf($el: cheerio.Cheerio<never>): Img | null {
  const src = $el.attr('data-src') || $el.attr('src') || ''
  if (!src || src.startsWith('data:')) return null
  const w = Number($el.attr('width'))
  const h = Number($el.attr('height'))
  return {
    src,
    alt: ($el.attr('alt') || '').trim(),
    width: Number.isFinite(w) && w > 0 ? w : undefined,
    height: Number.isFinite(h) && h > 0 ? h : undefined,
  }
}

const downloaded = new Set<string>()

/** Downloads into public/images, returns the local public path. */
async function localize(img: Img | null): Promise<string | null> {
  if (!img) return null
  const name = decodeURIComponent(basename(new URL(img.src, BASE).pathname))
  const dest = join(PUBLIC_IMAGES, name)
  const publicPath = `/images/${name}`

  if (existsSync(dest) || downloaded.has(name)) return publicPath

  try {
    const res = await fetch(img.src, { headers: { 'User-Agent': UA } })
    if (!res.ok || !res.body) {
      console.warn(`  ! download failed ${img.src} (${res.status})`)
      return publicPath
    }
    mkdirSync(PUBLIC_IMAGES, { recursive: true })
    await pipeline(
      Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(dest),
    )
    downloaded.add(name)
    console.log(`  + ${name}`)
  } catch (err) {
    console.warn(`  ! download error ${img.src}:`, (err as Error).message)
  }
  return publicPath
}

/** Collapse whitespace, normalise the curly quotes WordPress inserts. */
function txt(s: string | undefined | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** Preserve intentional <br> line breaks as newlines, then strip tags. */
function multiline($: cheerio.CheerioAPI, el: never): string {
  const html = $(el).html() ?? ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .trim()
}

/** First element matching `sel` whose text is non-empty. */
function firstNonEmpty($: cheerio.CheerioAPI, sel: string): string {
  for (const el of $(sel).toArray()) {
    const t = txt($(el).text())
    if (t) return t
  }
  return ''
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------- home

async function scrapeHome() {
  console.log('\n[home]')
  const $ = await fetchPage('/')

  const heroImage = await localize(imgOf($('section.sw-home img').first() as never))
  // The CTA link lives inside .sw-home-info; it is chrome, not copy.
  const $hero = $('article.sw-home-info').clone()
  $hero.find('a').remove()
  const heroCopy = multiline($, $hero.get(0) as never)
  const heroCta = txt($('article.sw-home-info a').first().text())

  // --- three bottles ------------------------------------------------
  const bottles: { name: string; image: string | null }[] = []
  for (const li of $('.sw-cachacas-itens li').toArray()) {
    const $img = $(li).find('img').first()
    bottles.push({
      name: txt($img.attr('alt')),
      image: await localize(imgOf($img as never)),
    })
  }

  const bottlesHeading = txt($('.sw-cachacas-info h2').first().text())
  // WordPress' autop emits invalid nested <p><p>text</p></p>, which the HTML
  // parser flattens into an empty <p> followed by the real one — so take the
  // first paragraph that actually has text.
  const bottlesCopy = firstNonEmpty($, '.sw-cachacas-info p')
  // The bottle links come first in the DOM but wrap only images, so skip to
  // the first anchor that carries a label.
  const bottlesCta = firstNonEmpty($, '.sw-cachacas-info a')

  // --- production process -------------------------------------------
  // Each step is an <h4 class="sw-sobre-titulos"> with an image and copy in
  // the same container. The closing headline lives in .sw-sobre-process and
  // is excluded here.
  const steps: { title: string; body: string; image: string | null }[] = []
  const seenTitles = new Set<string>()

  // The first step ("Planting") renders its photo as a full-width block above
  // the copy rather than inside the step's own column. The narrow image beside
  // it (sw-plantations2) is decorative chrome, so it stays in the layout code.
  const leadImage = await localize(
    imgOf($('.sw-sobre .text-center img').first() as never),
  )

  for (const h of $('.sw-sobre .sw-sobre-titulos').toArray()) {
    if ($(h).closest('.sw-sobre-process').length) continue
    const title = txt($(h).text())
    if (!title || seenTitles.has(title)) continue
    seenTitles.add(title)

    const $container = $(h).parent()
    const body = multiline($, $container.find('p').first().get(0) as never)

    // Most steps put the image next to the heading, but "Bottling" wraps its
    // heading in an extra <div>, leaving the image a level up in the <article>.
    let own = await localize(imgOf($container.find('img').first() as never))
    if (!own) {
      own = await localize(
        imgOf($(h).closest('article').find('img').first() as never),
      )
    }

    // Step 0's own column holds only the decorative inset, so use the lead.
    const image = steps.length === 0 ? (leadImage ?? own) : own
    steps.push({ title, body, image })
  }

  const processIntro = txt($('article.sw-sobre-info p').first().text())
  const processOutro = txt($('.sw-sobre-process .sw-sobre-titulos').first().text())

  // --- homepage drinks slider ----------------------------------------
  const featuredDrinks: { name: string; image: string | null }[] = []
  for (const li of $('.sw-drinks .sw-drinks-slider li').toArray()) {
    const name = txt($(li).find('h2').first().text())
    if (!name) continue
    featuredDrinks.push({
      name,
      image: await localize(imgOf($(li).find('img').first() as never)),
    })
  }

  // --- certifications -------------------------------------------------
  const partners: { title: string; icon: string | null; image: string | null }[] = []
  for (const li of $('.sw-metas li').toArray()) {
    const title = txt($(li).find('h5, .sw-metas-titulos').first().text())
    if (!title) continue
    // Certification seals render from the SVG sprite via <use xlink:href="#id">
    const useHref =
      $(li).find('use').first().attr('xlink:href') ||
      $(li).find('use').first().attr('href') ||
      ''
    partners.push({
      title,
      icon: useHref.replace('#', '') || null,
      image: await localize(imgOf($(li).find('img').first() as never)),
    })
  }
  const partnersHeading = txt($('.sw-metas .sw-sobre-titulos').first().text())

  return {
    heroImage,
    heroCopy,
    heroCta,
    bottles,
    bottlesHeading,
    bottlesCopy,
    bottlesCta,
    processIntro,
    processOutro,
    steps,
    featuredDrinks,
    partners,
    partnersHeading,
    seo: seoOf($),
  }
}

// ---------------------------------------------------------------- products

async function scrapeProducts() {
  console.log('\n[our-cachaca]')
  const $ = await fetchPage('/our-cachaca/')

  // Bottle shots + names come from the navigator slider; the descriptive
  // content comes from the paired fade slider, in the same order.
  const names: { name: string; bottle: string | null }[] = []
  for (const div of $('.sw-ourcaxaca-slider > div').toArray()) {
    const name = txt($(div).find('h1').last().text())
    if (!name) continue
    names.push({
      name,
      bottle: await localize(imgOf($(div).find('img').first() as never)),
    })
  }

  const products: {
    name: string
    slug: string
    bottle: string | null
    description: string
    recipeSuggestion: string
    tastingNotes: string[]
  }[] = []

  const panels = $('.sw-ourcaxaca-fade .cachacas').toArray()
  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i]
    const paragraphs = $(panel).find('p').toArray()
    const description = multiline($, paragraphs[0] as never)

    // The suggestion sits in a dotted-border <p> introduced by a <strong>.
    let recipeSuggestion = ''
    for (const p of paragraphs) {
      const strong = txt($(p).find('strong').first().text())
      if (/recipe suggestion/i.test(strong)) {
        recipeSuggestion = multiline($, p as never)
          .replace(/^recipe suggestion:\s*/i, '')
          .trim()
      }
    }

    const tastingNotes = $(panel)
      .find('.sw-ourcachaca-itens li')
      .toArray()
      .map((li) => txt($(li).text()))
      .filter(Boolean)

    const name = names[i]?.name ?? txt($(panel).attr('class')).replace(/.*sw-ourcachaca-(\S+).*/, '$1')
    products.push({
      name: name.toUpperCase(),
      slug: slugify(name),
      bottle: names[i]?.bottle ?? null,
      description,
      recipeSuggestion,
      tastingNotes,
    })
  }

  return { products, seo: seoOf($) }
}

// ---------------------------------------------------------------- about

async function scrapeAbout() {
  console.log('\n[about-us]')
  const $ = await fetchPage('/about-us/')

  const headline = txt($('.sw-aboutus-titulo').first().text())
  const subheading = txt($('.sw-aboutus-subtitulo').first().text())
  const image = await localize(
    imgOf($('.sw-aboutus-img img, figure.sw-aboutus-img img').first() as never),
  )
  const body = $('.sw-aboutus-content p')
    .toArray()
    .map((p) => multiline($, p as never))
    .filter(Boolean)

  return { headline, subheading, image, body, seo: seoOf($) }
}

// ---------------------------------------------------------------- recipes

async function scrapeRecipes() {
  console.log('\n[recipes]')
  const $ = await fetchPage('/recipes/')

  const heading = multiline($, $('.sw-recipes-content .titulos').get(0) as never)

  const recipes: {
    name: string
    slug: string
    image: string | null
    ingredients: string
    instructions: string
  }[] = []

  for (const li of $('.sw-recipes-drinks .sw-drinks-slider > li').toArray()) {
    const name = txt($(li).find('h2').first().text())
    if (!name) continue

    const image = await localize(imgOf($(li).find('img').first() as never))

    // Ingredients and instructions sit in two columns, each introduced by a
    // <strong> label. Selecting by column is unreliable because the wrapper
    // also matches `col*` and contains both — so split the slide's text on the
    // labels instead, which is unambiguous.
    const slideText = multiline($, li as never)
    const ingMatch = slideText.match(/ingredients:\s*/i)
    const insMatch = slideText.match(/instructions:\s*/i)

    let ingredients = ''
    let instructions = ''

    if (ingMatch?.index !== undefined) {
      const start = ingMatch.index + ingMatch[0].length
      const end =
        insMatch?.index !== undefined && insMatch.index > ingMatch.index
          ? insMatch.index
          : slideText.length
      ingredients = slideText.slice(start, end).trim()
    }
    if (insMatch?.index !== undefined) {
      instructions = slideText.slice(insMatch.index + insMatch[0].length).trim()
    }

    recipes.push({ name, slug: slugify(name), image, ingredients, instructions })
  }

  return { heading, recipes, seo: seoOf($) }
}

// ---------------------------------------------------------------- chrome

async function scrapeChrome() {
  console.log('\n[nav + footer]')
  const $ = await fetchPage('/')

  const nav: { label: string; href: string }[] = []
  for (const a of $('.sw-menu .nav-link').toArray()) {
    const label = txt($(a).text())
    const href = ($(a).attr('href') || '').replace(BASE, '') || '/'
    if (label) nav.push({ label, href: href.replace(/\/$/, '') || '/' })
  }

  const social: { label: string; href: string }[] = []
  for (const a of $('.sw-footer a[target="_blank"]').toArray()) {
    const href = $(a).attr('href') || ''
    if (!href) continue
    const label = /tiktok/i.test(href)
      ? 'TikTok'
      : /instagram/i.test(href)
        ? 'Instagram'
        : /youtube/i.test(href)
          ? 'YouTube'
          : txt($(a).text()) || 'Link'
    social.push({ label, href })
  }

  return { nav, social }
}

// ---------------------------------------------------------------- seo

function seoOf($: cheerio.CheerioAPI) {
  return {
    title: txt($('title').first().text()),
    description: txt($('meta[name="description"]').attr('content')),
  }
}

// ---------------------------------------------------------------- main

async function main() {
  mkdirSync(PUBLIC_IMAGES, { recursive: true })

  const [home, products, about, recipes, chrome] = [
    await scrapeHome(),
    await scrapeProducts(),
    await scrapeAbout(),
    await scrapeRecipes(),
    await scrapeChrome(),
  ]

  const data = { scrapedFrom: BASE, home, products, about, recipes, chrome }
  writeFileSync(OUT, JSON.stringify(data, null, 2))

  console.log('\n--- summary ---')
  console.log(`products      ${products.products.length}`)
  console.log(`process steps ${home.steps.length}`)
  console.log(`recipes       ${recipes.recipes.length}`)
  console.log(`featured      ${home.featuredDrinks.length}`)
  console.log(`partners      ${home.partners.length}`)
  console.log(`about paras   ${about.body.length}`)
  console.log(`nav items     ${chrome.nav.length}`)
  console.log(`\nwrote ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
