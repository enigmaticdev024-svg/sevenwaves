import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { auth } from '@/auth'
import { db } from '@/db'
import { mediaAssets } from '@/db/schema'

const MAX_BYTES = 12 * 1024 * 1024 // 12MB
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])
const MAX_DIMENSION = 2400

/** Strips anything that could escape the uploads directory. */
function safeName(name: string) {
  const base = name.replace(/\.[^.]+$/, '')
  return (
    base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'upload'
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const alt = String(form.get('alt') ?? '')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is larger than 12MB.' },
      { status: 413 },
    )
  }
  // SVGs are excluded deliberately: they can carry scripts, and serving them
  // from our own origin would make that a stored XSS vector.
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || 'unknown'}.` },
      { status: 415 },
    )
  }

  const input = Buffer.from(await file.arrayBuffer())

  // Re-encode to WebP. This normalises the format, drops EXIF, and guarantees
  // the bytes we serve are a real image rather than whatever was uploaded.
  let output: Buffer
  let width: number | undefined
  let height: number | undefined
  try {
    const pipeline = sharp(input, { animated: file.type === 'image/gif' })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })

    const result = await pipeline.toBuffer({ resolveWithObject: true })
    output = result.data
    width = result.info.width
    height = result.info.height
  } catch {
    return NextResponse.json(
      { error: 'That file could not be processed as an image.' },
      { status: 400 },
    )
  }

  const now = new Date()
  const dir = join(
    'uploads',
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
  )
  const filename = `${safeName(file.name)}-${now.getTime()}.webp`
  const absDir = join(process.cwd(), 'public', dir)
  await mkdir(absDir, { recursive: true })
  await writeFile(join(absDir, filename), output)

  const path = `/${dir.replace(/\\/g, '/')}/${filename}`
  const [asset] = await db
    .insert(mediaAssets)
    .values({
      path,
      filename,
      alt,
      width: width ?? null,
      height: height ?? null,
      size: output.byteLength,
      mime: 'image/webp',
    })
    .returning()

  return NextResponse.json({ asset })
}
