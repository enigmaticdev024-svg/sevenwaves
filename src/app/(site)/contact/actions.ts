'use server'

import { headers } from 'next/headers'
import { contactFormSchema } from '@/lib/content-schemas'
import { db } from '@/db'
import { contactSubmissions } from '@/db/schema'
import { sendContactNotification } from '@/lib/mail'

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    subject: formData.get('subject') ?? '',
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      fieldErrors[key] ??= issue.message
    }
    // The honeypot is invisible, so a failure there is a bot. Return the
    // generic success message rather than telling it what tripped.
    if (fieldErrors.website) return { status: 'success' }

    return {
      status: 'error',
      message: 'Please check the highlighted fields and try again.',
      fieldErrors,
    }
  }

  const { website: _honeypot, ...data } = parsed.data

  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    ''

  await db.insert(contactSubmissions).values({
    name: data.name,
    email: data.email,
    phone: data.phone ?? '',
    subject: data.subject ?? '',
    message: data.message,
    ip,
    userAgent: headerList.get('user-agent') ?? '',
  })

  // Email is best-effort: the submission is already safely stored.
  try {
    await sendContactNotification(data)
  } catch (err) {
    console.error('contact notification failed', err)
  }

  return { status: 'success' }
}
