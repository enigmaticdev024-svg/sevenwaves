'use client'

import { useMemo, useState } from 'react'
import { inputClass } from '@/components/admin/ui'

type ParsedColor = {
  hex: string
  alpha: number
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}

function parseColor(value: string): ParsedColor {
  const hex = value.trim().match(/^#([\da-f]{6})$/i)
  if (hex) return { hex: `#${hex[1].toLowerCase()}`, alpha: 1 }

  const shortHex = value.trim().match(/^#([\da-f])([\da-f])([\da-f])$/i)
  if (shortHex) {
    return {
      hex: `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}`.toLowerCase(),
      alpha: 1,
    }
  }

  const rgba = value
    .trim()
    .match(
      /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i,
    )
  if (rgba) {
    return {
      hex: `#${toHex(Number(rgba[1]))}${toHex(Number(rgba[2]))}${toHex(Number(rgba[3]))}`,
      alpha: rgba[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgba[4]))),
    }
  }

  return { hex: '#000000', alpha: 1 }
}

function rgbaValue(hex: string, alpha: number) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${red},${green},${blue},${Number(alpha.toFixed(2))})`
}

export function ColorPickerInput({
  id,
  name,
  defaultValue,
  allowAlpha = false,
}: {
  id: string
  name: string
  defaultValue: string
  allowAlpha?: boolean
}) {
  const initial = useMemo(() => parseColor(defaultValue), [defaultValue])
  const [hex, setHex] = useState(initial.hex)
  const [hexText, setHexText] = useState(initial.hex)
  const [alpha, setAlpha] = useState(initial.alpha)
  const submittedValue = allowAlpha ? rgbaValue(hex, alpha) : hex

  const updateHexText = (value: string) => {
    setHexText(value)
    if (/^#[\da-f]{6}$/i.test(value)) setHex(value.toLowerCase())
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name={name} value={submittedValue} />

      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(event) => {
            setHex(event.target.value)
            setHexText(event.target.value)
          }}
          className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
          aria-label="Choose colour"
        />
        <input
          id={`${id}-hex`}
          value={hexText}
          onChange={(event) => updateHexText(event.target.value)}
          onBlur={() => setHexText(hex)}
          className={inputClass}
          aria-label="Hex colour value"
          spellCheck={false}
        />
      </div>

      {allowAlpha && (
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor={`${id}-opacity`} className="text-xs font-medium text-slate-600">
            Opacity
          </label>
          <input
            id={`${id}-opacity`}
            type="range"
            min="0"
            max="100"
            value={Math.round(alpha * 100)}
            onChange={(event) => setAlpha(Number(event.target.value) / 100)}
            className="min-w-0 flex-1 accent-navy"
          />
          <output
            htmlFor={`${id}-opacity`}
            className="w-10 text-right text-xs tabular-nums text-slate-600"
          >
            {Math.round(alpha * 100)}%
          </output>
        </div>
      )}

      <div
        className="mt-3 h-6 rounded border border-slate-200"
        style={{ backgroundColor: submittedValue }}
        aria-hidden="true"
      />
    </div>
  )
}
