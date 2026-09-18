/**
 * One-shot asset script.
 *
 * The WordPress theme inlined a 127KB SVG sprite into the bottom of every page
 * and referenced symbols with <use xlink:href="#id">. This splits that sprite:
 *
 *  - Small, CSS-tinted icons (logo, seal, arrows, star, dividers) become React
 *    components so `fill` still cascades from Tailwind classes.
 *  - The three big certification seals (106KB combined, one section, fixed
 *    size, multicolour) become standalone .svg files loaded via next/image.
 *
 * Run with: npx tsx scripts/extract-sprite.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SPRITE = join(
  process.cwd(),
  '..',
  'sevenwaves-wp',
  'imagens',
  'svg-sprite.svg',
)
const ICON_DIR = join(process.cwd(), 'src', 'components', 'icons')
const PUBLIC_ICON_DIR = join(process.cwd(), 'public', 'images', 'seals')

// Symbols kept as standalone files rather than inlined components.
const AS_FILE = new Set(['sw-organico', 'sw-ibd', 'sw-selo'])

// symbol id -> React component name
const COMPONENT_NAMES: Record<string, string> = {
  'sw-logo': 'SwLogo',
  'sw-brazilian-spirit': 'BrazilianSpirit',
  'icon-instagram': 'InstagramIcon',
  'sw-aboutus-div': 'AboutUsDivider',
  'sw-wtof-div': 'WhereToFindDivider',
  'sw-btn': 'ArrowIcon',
  'sw-star': 'StarIcon',
}

/** Convert kebab-case SVG attributes to JSX camelCase. */
function toJsx(svg: string): string {
  const attrMap: Record<string, string> = {
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-dasharray': 'strokeDasharray',
    'stop-color': 'stopColor',
    'stop-opacity': 'stopOpacity',
    'clip-path': 'clipPath',
    'fill-opacity': 'fillOpacity',
    'stroke-opacity': 'strokeOpacity',
    'xlink:href': 'xlinkHref',
    'xml:space': 'xmlSpace',
    'gradientUnits': 'gradientUnits',
  }
  let out = svg
  for (const [from, to] of Object.entries(attrMap)) {
    out = out.replaceAll(`${from}=`, `${to}=`)
  }
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  // The sprite carries decorative ids like id="#212c41f5". They serve no
  // purpose here and would become duplicate DOM ids when an icon renders more
  // than once on a page, so drop them.
  out = out.replace(/\sid="[^"]*"/g, '')
  return out.trim()
}

function main() {
  const sprite = readFileSync(SPRITE, 'utf8')
  mkdirSync(ICON_DIR, { recursive: true })
  mkdirSync(PUBLIC_ICON_DIR, { recursive: true })

  const symbolRe = /<symbol[^>]*id="([^"]+)"[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g
  const created: string[] = []

  let match: RegExpExecArray | null
  while ((match = symbolRe.exec(sprite))) {
    const [, id, viewBox, inner] = match

    if (AS_FILE.has(id)) {
      const file = join(PUBLIC_ICON_DIR, `${id}.svg`)
      writeFileSync(
        file,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner.trim()}</svg>\n`,
      )
      console.log(`file      public/images/seals/${id}.svg`)
      continue
    }

    const name = COMPONENT_NAMES[id]
    if (!name) {
      console.warn(`skipped   ${id} (no component name mapped)`)
      continue
    }

    const body = toJsx(inner)
    const tsx = `// Generated from sevenwaves-wp/imagens/svg-sprite.svg (#${id})
// Do not edit by hand — see scripts/extract-sprite.ts

import type { SVGProps } from 'react'

export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" {...props}>
      ${body}
    </svg>
  )
}
`
    writeFileSync(join(ICON_DIR, `${name}.tsx`), tsx)
    created.push(name)
    console.log(`component src/components/icons/${name}.tsx`)
  }

  // Barrel file
  const barrel =
    created.map((n) => `export { ${n} } from './${n}'`).join('\n') + '\n'
  writeFileSync(join(ICON_DIR, 'index.ts'), barrel)
  console.log(`\nbarrel    src/components/icons/index.ts (${created.length} icons)`)
}

main()
