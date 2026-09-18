import 'server-only'
import nodemailer from 'nodemailer'

/**
 * Contact notifications are optional. With SMTP_HOST unset the submission is
 * still stored in the database and visible in the admin inbox — email is purely
 * an additional channel, so a mail outage can never lose an enquiry.
 */
export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.CONTACT_TO_EMAIL &&
      process.env.CONTACT_FROM_EMAIL,
  )
}

type ContactNotification = {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export async function sendContactNotification(data: ContactNotification) {
  if (!isMailConfigured()) return { sent: false, reason: 'not-configured' }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  })

  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.subject ? `Subject: ${data.subject}` : null,
    '',
    data.message,
  ].filter(Boolean)

  await transport.sendMail({
    from: process.env.CONTACT_FROM_EMAIL,
    to: process.env.CONTACT_TO_EMAIL,
    replyTo: data.email,
    subject: data.subject
      ? `[Seven Waves] ${data.subject}`
      : `[Seven Waves] New enquiry from ${data.name}`,
    text: lines.join('\n'),
  })

  return { sent: true }
}
