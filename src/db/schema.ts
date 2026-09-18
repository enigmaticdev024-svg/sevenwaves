import { relations } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Seven Waves content schema.
 *
 * Replaces WordPress + ACF. Repeating content gets real tables so it can drive
 * SEO routes and JSON-LD; fixed per-page copy lives in `pages.content` as JSONB,
 * validated per slug by the Zod schemas in src/lib/content-schemas.ts.
 */

const id = () => uuid('id').primaryKey().defaultRandom()

// ---------------------------------------------------------------- media

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: id(),
    filename: text('filename').notNull(),
    // Public URL, e.g. /images/sw-oak.webp
    path: text('path').notNull().unique(),
    alt: text('alt').notNull().default(''),
    width: integer('width'),
    height: integer('height'),
    mime: text('mime').notNull().default('image/webp'),
    size: integer('size').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('media_assets_created_at_idx').on(t.createdAt)],
)

// ---------------------------------------------------------------- pages

export const pages = pgTable('pages', {
  id: id(),
  // "home" | "about-us" | "our-cachaca" | "recipes" | "where-to-find" | "contact"
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: jsonb('content').notNull().default({}),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  ogImageId: uuid('og_image_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  heroImageId: uuid('hero_image_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ---------------------------------------------------------------- products

export const products = pgTable(
  'products',
  {
    id: id(),
    order: integer('order').notNull().default(0),
    // Uppercase — the theme keyed its per-product styling off the exact casing.
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().default(''),
    recipeSuggestion: text('recipe_suggestion').notNull().default(''),
    tastingNotes: text('tasting_notes').array().notNull().default([]),
    // Section palette, mirroring the WordPress per-product backgrounds.
    accentColor: text('accent_color').notNull().default('#eea33b'),
    titleFadeColor: text('title_fade_color')
      .notNull()
      .default('rgba(0,128,128,.1)'),
    titleColor: text('title_color').notNull().default('#008080'),
    active: boolean('active').notNull().default(true),
    bottleImageId: uuid('bottle_image_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    bgImageId: uuid('bg_image_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    animalImageId: uuid('animal_image_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('products_order_idx').on(t.order)],
)

// ---------------------------------------------------------------- process

export const processSteps = pgTable(
  'process_steps',
  {
    id: id(),
    // Visual order. The WordPress template emitted 0,1,2,4,3,5,6,7 — a bug.
    order: integer('order').notNull().default(0),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    imageId: uuid('image_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('process_steps_order_idx').on(t.order)],
)

// ---------------------------------------------------------------- recipes

export const recipes = pgTable(
  'recipes',
  {
    id: id(),
    order: integer('order').notNull().default(0),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ingredients: text('ingredients').notNull().default(''),
    instructions: text('instructions').notNull().default(''),
    // Shown in the homepage drinks slider.
    featured: boolean('featured').notNull().default(false),
    active: boolean('active').notNull().default(true),
    imageId: uuid('image_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('recipes_order_idx').on(t.order)],
)

// ---------------------------------------------------------------- partners

export const partners = pgTable(
  'partners',
  {
    id: id(),
    order: integer('order').notNull().default(0),
    title: text('title').notNull(),
    // Sprite symbol id, when there is no uploaded logo.
    icon: text('icon'),
    logoId: uuid('logo_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('partners_order_idx').on(t.order)],
)

// ---------------------------------------------------------------- locations

export const locations = pgTable(
  'locations',
  {
    id: id(),
    order: integer('order').notNull().default(0),
    name: text('name').notNull(),
    address: text('address').notNull().default(''),
    city: text('city').notNull().default(''),
    region: text('region').notNull().default(''),
    postalCode: text('postal_code').notNull().default(''),
    country: text('country').notNull().default('USA'),
    phone: text('phone').notNull().default(''),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    mapEmbedUrl: text('map_embed_url').notNull().default(''),
    websiteUrl: text('website_url').notNull().default(''),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('locations_order_idx').on(t.order)],
)

// ---------------------------------------------------------------- contact

export const contactSubmissions = pgTable(
  'contact_submissions',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    subject: text('subject').notNull().default(''),
    message: text('message').notNull(),
    ip: text('ip').notNull().default(''),
    userAgent: text('user_agent').notNull().default(''),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('contact_submissions_created_at_idx').on(t.createdAt),
    index('contact_submissions_read_at_idx').on(t.readAt),
  ],
)

// ---------------------------------------------------------------- chrome

export const navItems = pgTable(
  'nav_items',
  {
    id: id(),
    order: integer('order').notNull().default(0),
    label: text('label').notNull(),
    href: text('href').notNull(),
    active: boolean('active').notNull().default(true),
  },
  (t) => [index('nav_items_order_idx').on(t.order)],
)

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// ---------------------------------------------------------------- auth

export const adminUsers = pgTable('admin_users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// ---------------------------------------------------------------- relations
// Needed by the relational query API (db.query.*.findMany({ with: … })).

export const pagesRelations = relations(pages, ({ one }) => ({
  ogImage: one(mediaAssets, {
    fields: [pages.ogImageId],
    references: [mediaAssets.id],
    relationName: 'pageOgImage',
  }),
  heroImage: one(mediaAssets, {
    fields: [pages.heroImageId],
    references: [mediaAssets.id],
    relationName: 'pageHeroImage',
  }),
}))

export const productsRelations = relations(products, ({ one }) => ({
  bottleImage: one(mediaAssets, {
    fields: [products.bottleImageId],
    references: [mediaAssets.id],
    relationName: 'productBottle',
  }),
  bgImage: one(mediaAssets, {
    fields: [products.bgImageId],
    references: [mediaAssets.id],
    relationName: 'productBg',
  }),
  animalImage: one(mediaAssets, {
    fields: [products.animalImageId],
    references: [mediaAssets.id],
    relationName: 'productAnimal',
  }),
}))

export const processStepsRelations = relations(processSteps, ({ one }) => ({
  image: one(mediaAssets, {
    fields: [processSteps.imageId],
    references: [mediaAssets.id],
    relationName: 'processStepImage',
  }),
}))

export const recipesRelations = relations(recipes, ({ one }) => ({
  image: one(mediaAssets, {
    fields: [recipes.imageId],
    references: [mediaAssets.id],
    relationName: 'recipeImage',
  }),
}))

export const partnersRelations = relations(partners, ({ one }) => ({
  logo: one(mediaAssets, {
    fields: [partners.logoId],
    references: [mediaAssets.id],
    relationName: 'partnerLogo',
  }),
}))

export const mediaAssetsRelations = relations(mediaAssets, ({ many }) => ({
  pagesOg: many(pages, { relationName: 'pageOgImage' }),
  pagesHero: many(pages, { relationName: 'pageHeroImage' }),
  productsBottle: many(products, { relationName: 'productBottle' }),
  productsBg: many(products, { relationName: 'productBg' }),
  productsAnimal: many(products, { relationName: 'productAnimal' }),
  processSteps: many(processSteps, { relationName: 'processStepImage' }),
  recipes: many(recipes, { relationName: 'recipeImage' }),
  partners: many(partners, { relationName: 'partnerLogo' }),
}))

// ---------------------------------------------------------------- types

export type MediaAssetRow = typeof mediaAssets.$inferSelect
export type PageRow = typeof pages.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type ProcessStepRow = typeof processSteps.$inferSelect
export type RecipeRow = typeof recipes.$inferSelect
export type PartnerRow = typeof partners.$inferSelect
export type LocationRow = typeof locations.$inferSelect
export type ContactSubmissionRow = typeof contactSubmissions.$inferSelect
export type NavItemRow = typeof navItems.$inferSelect
export type AdminUserRow = typeof adminUsers.$inferSelect
