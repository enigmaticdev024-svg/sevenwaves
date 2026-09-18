# Seven Waves — Next.js

A rebuild of the Seven Waves WordPress site as a standalone Next.js application,
replacing WordPress, ACF, Contact Form 7 and Storemapper.

The original theme is kept alongside at `../sevenwaves-wp/` as the design
reference. It is never imported at runtime — only the scripts below read from it.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Styling | Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`) |
| Database | PostgreSQL via Drizzle ORM + `node-postgres` |
| Auth | Auth.js v5, credentials provider, bcrypt |
| Images | `next/image`; uploads re-encoded to WebP with sharp |
| Carousels | Embla (replacing Slick) |

## Getting started

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL, AUTH_SECRET, admin login
npm run db:migrate        # apply the SQL migrations in drizzle/
npm run db:seed           # load content from data/seed-data.json
npm run dev
```

The site runs at http://localhost:3000, the admin at `/admin/login`.

### Environment

`DATABASE_URL` and `AUTH_SECRET` are required. `ADMIN_EMAIL` / `ADMIN_PASSWORD`
seed the first admin account. The `SMTP_*` and `CONTACT_*` values are optional —
with `SMTP_HOST` empty, contact submissions are still stored in the database and
shown in the admin inbox, they simply aren't emailed on.

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` powers the Where to Find map. Being
`NEXT_PUBLIC_*`, it is **inlined at build time** — it has to be set when
`next build` runs, not just in the server's runtime environment. Without it the
stockist list still renders in full and the map area shows a fallback, so a
missing key degrades rather than breaks. Restrict the key to the Maps JavaScript
API and to your own domains by HTTP referrer.

Generate a production secret with `openssl rand -base64 32`.

### The stockist map

`src/components/locator/StockistMap.tsx` is a list/map split view: search filters
the list client-side, "Near me" sorts by distance, and hovering or selecting a card
drives the corresponding pin.

The palette lives in `src/lib/map-style.ts` as legacy JSON `styles`. That is
deliberate — supplying a cloud `mapId` instead would move styling into the Google
Cloud Console and make this array be ignored, so the palette would no longer be
reviewable in a diff. The trade-off is that `AdvancedMarkerElement` (which requires
a `mapId`) is unavailable, so pins use the deprecated-but-supported
`google.maps.Marker`. `map-style.ts` documents the migration path.

## Architecture

**Public pages are statically rendered; the admin is dynamic.** Every admin
mutation calls `revalidatePath` for the public routes, so edits appear
immediately without the pages being server-rendered per request.

Because the public pages are built from the database, **the database must be
migrated and seeded before `npm run build`** — otherwise the pages are generated
empty.

### Content model

Repeating content lives in real tables so it can drive SEO routes and JSON-LD:
`products`, `process_steps`, `recipes`, `partners`, `locations`. Fixed per-page
copy lives in `pages.content` as JSONB, validated per slug by the Zod schemas in
`src/lib/content-schemas.ts` — adding a key to a schema makes it appear in the
admin form automatically.

Reads mostly use Drizzle's relational query API (`db.query.*.findMany({ with: … })`);
writes use the query builder (`db.insert(...)`, `db.update(...).where(...)`).

```
drizzle/         generated SQL migrations (committed)
data/            seed-data.json, produced by the scraper
                 locations.json, hand-maintained stockist list
src/
  db/
    schema.ts    tables + relations, the single source of truth
    index.ts     pooled client (one pool reused across hot reloads)
    seed.ts      loads data/seed-data.json
  app/
    (site)/        public pages
    admin/
      (dashboard)/ auth-guarded admin; the single check in its layout
                   protects every screen inside the group
      login/       sits outside the group, so it can't redirect-loop
    api/
  components/
    home/ products/ recipes/ locator/ contact/ site/ admin/ icons/ seo/
  lib/
    content.ts          server-side queries
    content-schemas.ts  Zod schemas for page content, settings, contact form
    seo.ts              JSON-LD builders
    fonts.ts mail.ts
```

Changing the schema: edit `src/db/schema.ts`, run `npm run db:generate` to emit
a migration into `drizzle/`, then `npm run db:migrate` to apply it.

Server actions authenticate individually (`requireAdmin`) — they are publicly
callable endpoints, so the layout's session check protects rendering, not
invocation.

## Scripts

| Command | Purpose |
|---|---|
| `npm run scrape` | Re-scrape sevenwaves.com into `data/seed-data.json`, downloading any new images |
| `npm run geocode` | Replace approximate stockist coordinates in `data/locations.json` with geocoded ones (`-- --dry` to preview) |
| `npm run db:generate` | Generate a SQL migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Load `data/seed-data.json` into PostgreSQL (idempotent) |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run verify` | End-to-end checks + screenshots into `.verify/` |
| `npm run shoot:live` | Screenshot the live WordPress site into `.verify/live/` for comparison |
| `npm run typecheck` | `tsc --noEmit` |

`scripts/extract-sprite.ts` is a one-shot that split the theme's 127KB SVG
sprite into `src/components/icons/` (small, CSS-tinted icons) and
`public/images/seals/` (the three large certification seals). It only needs
re-running if the sprite changes.

## Design notes

Values were transcribed from the theme's compiled stylesheet rather than
eyeballed. The parts most sensitive to drift:

- **Fluid type** — every heading uses `calc(MIN + (MAX-MIN)*(100vw-320px)/1600)`,
  defined once as `--fluid-*` custom properties.
- **Wave dividers** — background images anchored to a section edge, with large
  padding to clear them.
- **Negative-margin overlaps** in the production-process collage
  (`-13.75rem`, `-11.5625rem`, …), all reset below 576px. Step copy carries
  `relative z-10` so it stays legible above the overlapping photographs.
- **Scroll reveals** replace WOW.js and, as WOW was configured with
  `{ mobile: false }`, only run at ≥992px. The hiding rules are scoped to a
  `.js` class set by an inline script, so if scripting fails nothing is left
  invisible.

## Deliberate departures from the original

- The header uses `sticky` instead of Bootstrap's `.fixed-top`, which removes
  the content jump the original had when the bar left the flow.
- Recipe slider arrows are anchored below the slide; the theme's fixed offsets
  put them on top of the recipe copy.
- Process steps render in true visual order. The WordPress template emitted them
  `0,1,2,4,3,5,6,7`, placing Filtering before Fermentation in the DOM.
- One `<h1>` per page. The theme used `<h1>` for the header logo, the footer
  logo and section titles.
- Canonical URLs are computed per route (the theme hardcoded
  `http://sevenwaves.com/` on every page).
- Not ported: `delete_all_transients()` on every `init`, and the five
  `query_posts()` calls per homepage render.

## Known follow-ups

- **Stinger Fit is a trial licence.** `public/fonts/StingerFitTrial-Light.woff2`
  came from the theme and is used for all display headings. A production licence
  or a substitute face is needed before launch.
- **Stockist coordinates are approximate.** The 13 locations in
  `data/locations.json` were carried over by hand (Storemapper served its list
  from its own API, so they could not be scraped). Their lat/lng came from the
  `ll=` parameter of the Storemapper share links, which is the *map centre at
  zoom 12* rather than the geocoded pin — good to roughly 200m. Run
  `npm run geocode` with a Geocoding API key to replace them with exact
  positions, then `npm run db:seed`.
- **Three stockists are held back.** `Crows Cocktails`, `Legends Sports Bar` and
  `The Butcher's Daughter` came from an earlier list and did not appear in the
  13-stockist export from the live site. They are seeded `active: false` pending
  confirmation — tick "Show on the site" in `/admin/locations` to publish them.
- **"Fermetation"** is spelled that way on the live site. It was seeded verbatim
  and can be corrected in `/admin/process`.
- Uploads go to `public/uploads/`, which is gitignored. On a host with an
  ephemeral filesystem this needs a persistent volume or object storage.
