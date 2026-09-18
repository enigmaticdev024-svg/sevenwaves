import Link from 'next/link'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded border border-slate-200 bg-white p-6 ${className}`}>
      {children}
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy'

export function SubmitRow({
  children,
  message,
}: {
  children?: ReactNode
  message?: string
}) {
  return (
    <div className="mt-6 flex items-center gap-4 border-t border-slate-200 pt-4">
      {children}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  )
}

export function LinkButton({
  href,
  children,
  variant = 'primary',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
}) {
  return (
    <Link
      href={href}
      className={
        variant === 'primary'
          ? 'rounded bg-navy px-4 py-2 text-sm font-bold text-cream hover:opacity-90'
          : 'rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50'
      }
    >
      {children}
    </Link>
  )
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
      {children}
    </th>
  )
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="border-b border-slate-100 px-4 py-3 align-top">{children}</td>
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}
