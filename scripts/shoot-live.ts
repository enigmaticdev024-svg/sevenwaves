/**
 * Screenshots the live WordPress site into .verify/live/ so the rebuild can be
 * compared side by side. Run with: npx tsx scripts/shoot-live.ts
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const BASE = 'https://sevenwaves.com'
const OUT = join(process.cwd(), '.verify', 'live')

const ROUTES = [
  ['home', '/'],
  ['our-cachaca', '/our-cachaca/'],
  ['about-us', '/about-us/'],
  ['recipes', '/recipes/'],
  ['where-to-find', '/where-to-find/'],
  ['contact', '/contact/'],
] as const

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 812 },
]

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    })
    const page = await context.newPage()

    for (const [name, path] of ROUTES) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 90000 })

        // Dismiss whatever age gate the live site is using.
        for (const label of [/21 or older/i, /yes/i, /enter/i, /i am/i]) {
          const btn = page.getByRole('button', { name: label })
          if (await btn.count()) {
            await btn.first().click().catch(() => {})
            break
          }
          const link = page.getByRole('link', { name: label })
          if (await link.count()) {
            await link.first().click().catch(() => {})
            break
          }
        }
        await page.waitForTimeout(1200)

        // Scroll to trigger lazy images and WOW reveals.
        await page.evaluate(`new Promise((resolve) => {
          let y = 0;
          const step = () => {
            y += Math.round(window.innerHeight / 2);
            window.scrollTo(0, y);
            if (y < document.body.scrollHeight) setTimeout(step, 120);
            else { window.scrollTo(0, 0); setTimeout(resolve, 800); }
          };
          step();
        })`)
        // The site lazy-loads via data-src with a base64 placeholder in src.
        // Promote every data-src so the real images are actually in frame.
        await page.evaluate(`(() => {
          document.querySelectorAll('img[data-src]').forEach((img) => {
            img.src = img.getAttribute('data-src').trim();
            if (img.getAttribute('data-srcset')) {
              img.srcset = img.getAttribute('data-srcset');
            }
            img.removeAttribute('data-src');
          });
        })()`)
        await page.waitForFunction(
          `Array.from(document.images).every((i) => i.complete)`,
          undefined,
          { timeout: 30000 },
        ).catch(() => {})
        await page.waitForTimeout(1500)

        await page.screenshot({
          path: join(OUT, `${name}-${viewport.name}.png`),
          fullPage: true,
          animations: 'disabled',
        })
        console.log(`  saved live ${name}-${viewport.name}.png`)
      } catch (err) {
        console.warn(`  ! ${name}-${viewport.name}: ${(err as Error).message}`)
      }
    }
    await context.close()
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
