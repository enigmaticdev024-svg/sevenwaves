'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact, type ContactState } from '@/app/(site)/contact/actions'

const initialState: ContactState = { status: 'idle' }

/**
 * Replaces Contact Form 7. Submissions post to a server action which validates
 * with Zod, stores the enquiry in PostgreSQL and optionally emails it on.
 *
 * The phone field keeps the mask the theme applied with jQuery Mask —
 * (00) 00000-0000 for 11 digits, (00) 0000-0000 otherwise.
 */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="sw-btn mx-auto mt-6 block cursor-pointer rounded-[.35em] border-[3px] border-navy bg-transparent px-8 py-3 text-navy transition-colors hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Sending…' : 'Send'}
    </button>
  )
}

const inputClass =
  'w-full rounded-[.35em] border-2 border-transparent bg-[#f7f7f7] px-3 py-3 text-navy outline-none focus:border-navy'

export function ContactForm({ successMessage }: { successMessage: string }) {
  const [state, formAction] = useActionState(submitContact, initialState)
  const [phone, setPhone] = useState('')

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="rounded border border-[#6fdf51] bg-[#e8ffe2] p-6 text-center text-[#1ea524]"
      >
        {successMessage}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === 'error' && state.message && (
        <p
          role="alert"
          className="rounded border border-red-500 bg-[#ffe2e2] p-4 text-center text-red-600"
        >
          {state.message}
        </p>
      )}

      <Field label="Name" name="name" error={state.fieldErrors?.name} required>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Email" name="email" error={state.fieldErrors?.email} required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Phone" name="phone" error={state.fieldErrors?.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className={inputClass}
        />
      </Field>

      <Field label="Subject" name="subject" error={state.fieldErrors?.subject}>
        <input id="subject" name="subject" type="text" className={inputClass} />
      </Field>

      <Field
        label="Message"
        name="message"
        error={state.fieldErrors?.message}
        required
      >
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className={`${inputClass} h-auto`}
        />
      </Field>

      {/* Honeypot — hidden from users, catches naive bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton />
    </form>
  )
}

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string
  name: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block cursor-pointer">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[15px] text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
