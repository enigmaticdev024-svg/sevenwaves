import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { savePage, type ActionState } from '@/app/admin/(dashboard)/actions'
import { PageForm } from '@/components/admin/PageForm'
import { LinkButton, PageHeader } from '@/components/admin/ui'
import { db } from '@/db'
import * as t from '@/db/schema'
import { parsePageContent, pageSchemas, type PageSlug } from '@/lib/content-schemas'

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Next 16 made route params async.
  const { slug } = await params
  if (!(slug in pageSchemas)) notFound()
  const pageSlug = slug as PageSlug

  const page = await db.query.pages.findFirst({
    where: eq(t.pages.slug, pageSlug),
  })
  if (!page) notFound()

  const media = await db.query.mediaAssets.findMany({
    orderBy: desc(t.mediaAssets.createdAt),
    columns: { id: true, path: true, alt: true, filename: true },
  })

  const content = parsePageContent(pageSlug, page.content) as Record<
    string,
    unknown
  >

  // Bind the slug so the client component gets a plain (prev, formData) action.
  async function action(prev: ActionState, formData: FormData) {
    'use server'
    return savePage(pageSlug, prev, formData)
  }

  return (
    <>
      <PageHeader
        title={page.title}
        description={`Editing ${pageSlug === 'home' ? '/' : `/${pageSlug}`}`}
        action={
          <LinkButton
            href={pageSlug === 'home' ? '/' : `/${pageSlug}`}
            variant="ghost"
          >
            View page
          </LinkButton>
        }
      />

      <PageForm
        slug={pageSlug}
        title={page.title}
        seoTitle={page.seoTitle}
        seoDescription={page.seoDescription}
        content={content}
        heroImageId={page.heroImageId}
        ogImageId={page.ogImageId}
        mediaOptions={media}
        action={action}
      />
    </>
  )
}
