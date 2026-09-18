'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

/** Standalone uploader for the media library page. */
export function MediaUploader() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    setError(null)
    let uploaded = 0

    for (const file of Array.from(files)) {
      try {
        const body = new FormData()
        body.append('file', file)
        body.append('alt', '')
        const res = await fetch('/api/upload', { method: 'POST', body })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `${file.name} failed to upload.`)
        }
        uploaded++
      } catch (err) {
        setError((err as Error).message)
      }
    }

    setDone(uploaded)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  return (
    <div>
      <label htmlFor="media-upload" className="mb-2 block text-sm font-medium">
        Upload images
      </label>
      <input
        ref={fileRef}
        id="media-upload"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
        }}
        className="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-bold file:text-cream"
      />
      <p className="mt-2 text-xs text-slate-500">
        JPEG, PNG, WebP, AVIF or GIF. SVG is not accepted, as it can carry
        scripts.
      </p>

      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
      {!uploading && done > 0 && (
        <p className="mt-2 text-sm text-green-700">
          Uploaded {done} {done === 1 ? 'image' : 'images'}.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
