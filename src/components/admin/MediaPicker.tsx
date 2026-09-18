'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

export type MediaOption = {
  id: string
  path: string
  alt: string
  filename: string
}

/**
 * Image selector used by every admin form. Holds the chosen id in a hidden
 * input so the surrounding <form> posts it, and can upload a new file inline
 * via /api/upload (which re-encodes to WebP and creates the MediaAsset).
 */
export function MediaPicker({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string
  label: string
  options: MediaOption[]
  defaultValue?: string | null
}) {
  const [assets, setAssets] = useState(options)
  const [value, setValue] = useState(defaultValue ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = assets.find((a) => a.id === value)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed.')
      setAssets((prev) => [json.asset, ...prev])
      setValue(json.asset.id)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>

      <div className="flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50">
          {selected ? (
            <Image
              src={selected.path}
              alt={selected.alt || selected.filename}
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>

        <div className="flex-1">
          <input type="hidden" name={name} value={value} />
          <select
            id={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy"
          >
            <option value="">— none —</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.filename}
              </option>
            ))}
          </select>

          <div className="mt-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void upload(file)
              }}
              className="block w-full text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs"
            />
            {uploading && (
              <p className="mt-1 text-xs text-slate-500">Uploading…</p>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
