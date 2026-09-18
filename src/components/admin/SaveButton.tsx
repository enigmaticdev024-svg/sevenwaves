'use client'

import { useFormStatus } from 'react-dom'

export function SaveButton({ children = 'Save' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded bg-navy px-5 py-2 text-sm font-bold text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}

export function DangerButton({
  children = 'Delete',
  confirmText = 'Delete this item? This cannot be undone.',
}: {
  children?: React.ReactNode
  confirmText?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault()
      }}
      className="cursor-pointer rounded border border-red-300 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? 'Deleting…' : children}
    </button>
  )
}
