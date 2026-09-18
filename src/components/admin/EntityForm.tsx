'use client'

import { useActionState } from 'react'
import { SaveButton } from '@/components/admin/SaveButton'
import { Card, SubmitRow } from '@/components/admin/ui'
import type { ActionState } from '@/app/admin/(dashboard)/actions'

/**
 * Thin client wrapper so entity forms get inline validation feedback. The
 * fields themselves are passed in as children from the server component, which
 * keeps the media/query work on the server.
 */
export function EntityForm({
  action,
  children,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  children: React.ReactNode
  submitLabel?: string
}) {
  const [state, formAction] = useActionState(action, { status: 'idle' })

  return (
    <form action={formAction}>
      {state.status === 'error' && (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}
      <Card>{children}</Card>
      <SubmitRow message={state.status === 'success' ? state.message : undefined}>
        <SaveButton>{submitLabel}</SaveButton>
      </SubmitRow>
    </form>
  )
}
