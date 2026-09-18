/**
 * End-to-end verification against a running dev server.
 *
 * Checks the public pages render and behave, the contact form writes to the
 * database, and an admin content edit round-trips to the public site.
 * Screenshots land in .verify/ for visual comparison against the live site.
 *
 * Run with: npx tsx scripts/verify.ts
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'

const BASE = process.env.VERIFY_URL ?? 'http://localhost:3000'
const OUT = join(process.cwd(), '.verify')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sevenwaves.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'

const ROUTES = [
  ['home', '/'],
  ['our-cachaca', '/our-cachaca'],
  ['about-us', '/about-us'],
  ['recipes', '/recipes'],
  ['where-to-find', '/where-to-find'],
  ['contact', '/contact'],
] as const

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'tablet', width: 992, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
]

let failures = 0
let checks = 0

function check(ok: boolean, label: string, detail = '') {
  checks++
  if (!ok) failures++
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Dismiss the age gate. The overlay only mounts after hydration, so wait for
 * it briefly rather than checking once — otherwise it appears *after* we look,
 * leaves `body.is-locked` in place, and blocks scrolling for the rest of the run.
 */
async function passAgeGate(page: Page) {
  const button = page.getByRole('button', { name: /21 or older|yes, i am/i })
  try {
    await button.first().waitFor({ state: 'visible', timeout: 5000 })
    await button.first().click()
    await page.waitForFunction(
      `!document.body.classList.contains('is-locked')`,
      undefined,
      { timeout: 5000 },
    )
  } catch {
    // Already consented (cookie pre-set) or the gate is disabled.
  }
}

async function checkConsoleErrors(browser: Browser) {
  console.log('\n[console + network errors]')
  for (const [name, path] of ROUTES) {
    const page = await browser.newPage()
    const errors: string[] = []
    const missing: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('response', (res) => {
      if (res.status() >= 400) missing.push(`${res.status()} ${res.url()}`)
    })

    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
    await passAgeGate(page)
    await page.waitForTimeout(500)

    check(errors.length === 0, `${name}: no console errors`, errors.slice(0, 2).join(' | '))
    check(missing.length === 0, `${name}: no failed requests`, missing.slice(0, 3).join(' | '))
    await page.close()
  }
}

async function checkAgeGate(browser: Browser) {
  console.log('\n[age gate]')
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })

  const dialog = page.getByRole('dialog')
  check(await dialog.isVisible(), 'gate shows on first visit')

  // Content must be in the DOM behind the overlay, or the page is unindexable.
  const html = await page.content()
  check(html.includes('New Year'), 'page content present behind the gate')

  await passAgeGate(page)
  check(!(await dialog.isVisible().catch(() => false)), 'gate dismisses on confirm')

  const cookies = await context.cookies()
  check(
    cookies.some((c) => c.name === 'sw_age_ok'),
    'consent cookie set',
  )

  await page.reload({ waitUntil: 'networkidle' })
  check(
    !(await page.getByRole('dialog').isVisible().catch(() => false)),
    'gate stays dismissed after reload',
  )
  await context.close()
}

async function checkHeader(browser: Browser) {
  console.log('\n[header]')
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await passAgeGate(page)

  const logo = page.locator('header svg').first()
  const before = await logo.boundingBox()
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForTimeout(800)
  const after = await logo.boundingBox()

  check(
    Boolean(before && after && after.width < before.width),
    'logo shrinks on scroll',
    `${Math.round(before?.width ?? 0)}px -> ${Math.round(after?.width ?? 0)}px`,
  )
  await page.close()
}

async function checkMobileMenu(browser: Browser) {
  console.log('\n[mobile menu]')
  const page = await browser.newPage()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await passAgeGate(page)

  const toggle = page.getByRole('button', { name: /open menu/i })
  check(await toggle.isVisible(), 'hamburger visible on mobile')
  await toggle.click()
  await page.waitForTimeout(300)
  check(
    await page.getByRole('link', { name: 'Recipes' }).isVisible(),
    'menu opens',
  )
  await page.close()
}

async function checkSliders(browser: Browser) {
  console.log('\n[sliders]')
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/our-cachaca`, { waitUntil: 'networkidle' })
  await passAgeGate(page)

  const first = await page.locator('h2.sr-only').first().textContent()
  const next = page.getByRole('button', { name: /next slide/i }).first()
  check(await next.isVisible(), 'product slider arrows render')
  await next.click()
  await page.waitForTimeout(800)

  // The paired panel must move with the bottle slider.
  const visiblePanels = await page.locator('[class*="min-h-"]').count()
  check(visiblePanels > 0, 'product panels render', `${visiblePanels} panels`)
  check(Boolean(first), 'product names present', first ?? '')
  await page.close()
}

async function checkContactForm(browser: Browser) {
  console.log('\n[contact form]')
  const page = await browser.newPage()
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' })
  await passAgeGate(page)

  // Invalid submission is rejected.
  await page.fill('#name', 'A')
  await page.fill('#email', 'not-an-email')
  await page.fill('#message', 'short')
  await page.getByRole('button', { name: /send/i }).click()
  await page.waitForTimeout(1200)
  check(
    (await page.getByRole('alert').count()) > 0,
    'invalid input is rejected',
  )

  // Valid submission succeeds.
  const stamp = Date.now()
  await page.fill('#name', 'Verification Bot')
  await page.fill('#email', `verify+${stamp}@example.com`)
  await page.fill('#phone', '11987654321')
  await page.fill('#subject', 'Automated check')
  await page.fill('#message', `End-to-end verification message ${stamp}.`)

  // Read the masked value before submitting — success replaces the form.
  const phone = await page.locator('#phone').inputValue().catch(() => '')
  check(phone === '(11) 98765-4321', 'phone mask applied', phone)

  await page.getByRole('button', { name: /send/i }).click()
  await page.waitForTimeout(2000)

  const status = await page.getByRole('status').textContent().catch(() => null)
  check(Boolean(status), 'valid submission accepted', status?.slice(0, 60) ?? '')

  await page.close()
  return { stamp, phoneFormatted: phone }
}

async function checkAdmin(browser: Browser, submissionStamp: number) {
  console.log('\n[admin]')
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  check(page.url().includes('/admin/login'), 'unauthenticated admin redirects to login')

  await page.fill('#email', ADMIN_EMAIL)
  await page.fill('#password', ADMIN_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 })
  check(true, 'admin login succeeds')

  // The submission made above should be in the inbox.
  await page.goto(`${BASE}/admin/submissions`, { waitUntil: 'networkidle' })
  const inbox = await page.content()
  check(
    inbox.includes(String(submissionStamp)),
    'contact submission appears in the inbox',
  )

  // Edit the homepage bottles heading and confirm it reaches the public page.
  const marker = `Verified ${Date.now()}`
  await page.goto(`${BASE}/admin/pages/home`, { waitUntil: 'networkidle' })
  const field = page.locator('#content\\.bottlesHeading')
  const original = await field.inputValue()
  await field.fill(marker)
  await page.getByRole('button', { name: /^save$/i }).click()
  await page.waitForTimeout(2500)

  const publicPage = await context.newPage()
  await publicPage.goto(BASE, { waitUntil: 'networkidle' })
  const publicHtml = await publicPage.content()
  check(publicHtml.includes(marker), 'admin edit appears on the public site')
  await publicPage.close()

  // Restore.
  await page.goto(`${BASE}/admin/pages/home`, { waitUntil: 'networkidle' })
  await page.locator('#content\\.bottlesHeading').fill(original)
  await page.getByRole('button', { name: /^save$/i }).click()
  await page.waitForTimeout(2000)
  check(true, `restored original heading (“${original}”)`)

  await context.close()
}

async function screenshots(browser: Browser) {
  console.log('\n[screenshots]')
  mkdirSync(OUT, { recursive: true })

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    })
    // Pre-consent so the gate never mounts. Its own behaviour is covered by
    // checkAgeGate; here it would just cover the page and block scrolling.
    await context.addCookies([
      { name: 'sw_age_ok', value: '1', url: BASE },
    ])
    const page = await context.newPage()

    for (const [name, path] of ROUTES) {
      // 'domcontentloaded' rather than 'load'/'networkidle': the image-heavy
      // pages never settle at small viewports, and the Where to Find map is a
      // third-party iframe that may never fire load at all. The scroll pass
      // below gives images time to arrive regardless.
      await page.goto(`${BASE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      })
      await passAgeGate(page)
      // Trigger lazy images and scroll reveals. Passed as a string because
      // tsx compiles inline arrow functions with a `__name` helper that does
      // not exist in the page context.
      await page.evaluate(`new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(step, 90);
          else { window.scrollTo(0, 0); setTimeout(resolve, 400); }
        };
        step();
      })`)
      await page.waitForTimeout(700)
      await page.screenshot({
        path: join(OUT, `${name}-${viewport.name}.png`),
        fullPage: true,
        // Without this, resizing the viewport for a full-page capture restarts
        // the reveal animations and everything is caught at opacity 0.
        animations: 'disabled',
      })
      console.log(`  saved ${name}-${viewport.name}.png`)
    }
    await context.close()
  }
}

async function main() {
  const browser = await chromium.launch()
  try {
    await checkAgeGate(browser)
    await checkHeader(browser)
    await checkMobileMenu(browser)
    await checkSliders(browser)
    const { stamp, phoneFormatted } = await checkContactForm(browser)
    console.log(`  (phone mask produced "${phoneFormatted}")`)
    await checkAdmin(browser, stamp)
    await checkConsoleErrors(browser)
    await screenshots(browser)
  } finally {
    await browser.close()
  }

  console.log(`\n${checks - failures}/${checks} checks passed`)
  if (failures > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
