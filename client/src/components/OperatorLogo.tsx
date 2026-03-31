import * as React from 'react'
import { cn } from '../lib/utils'

const logoModules = {
  ...import.meta.glob('../assets/logo/*.{png,jpg,jpeg,svg,webp,avif}', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../assets/logos/*.{png,jpg,jpeg,svg,webp,avif}', {
    eager: true,
    import: 'default',
  }),
} as Record<string, string>

const operatorLogos = new Map(
  Object.entries(logoModules).map(([path, src]) => {
    const fileName = path.split('/').pop() ?? path
    const baseName = fileName.replace(/\.[^.]+$/, '')
    return [normalizeLogoKey(baseName), src] as const
  }),
)

function svgDataUri(svg: string) {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22')
  return `data:image/svg+xml,${encoded}`
}

function makeBadgeSvg(text: string) {
  const t = (text || '?').slice(0, 3).toUpperCase()
  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00E5FF" stop-opacity="0.95"/>
      <stop offset="0.55" stop-color="#A755FF" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#FF2EB6" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="2" y="2" width="40" height="40" rx="14" fill="rgba(255,255,255,0.03)" stroke="url(#g)"/>
  <text x="22" y="26" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    font-size="12" font-weight="700" fill="white" filter="url(#glow)">${t}</text>
</svg>`)
}

function initialsFromName(name: string): string {
  const parts = name
    .replace(/&/g, ' and ')
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
  return (letters.join('') || name.slice(0, 3)).slice(0, 3).toUpperCase()
}

function normalizeLogoKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function resolveOperatorLogo(operator?: string, operatorCode?: string): string | null {
  const candidates = [operatorCode, operator]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  for (const candidate of candidates) {
    const match = operatorLogos.get(normalizeLogoKey(candidate))
    if (match) {
      return match
    }
  }

  return null
}

export function OperatorLogo({
  operator,
  operatorCode,
  className,
}: {
  operator?: string
  operatorCode?: string
  className?: string
}) {
  // NOTE: official TOC logos are typically trademarked; we render a consistent badge
  // using Darwin's operatorCode (preferred) or operator name initials as fallback.
  const badgeText = operatorCode?.trim()
    ? operatorCode.trim().toUpperCase()
    : operator?.trim()
      ? initialsFromName(operator.trim())
      : '?'

  const src = React.useMemo(
    () => resolveOperatorLogo(operator, operatorCode) ?? makeBadgeSvg(badgeText),
    [badgeText, operator, operatorCode],
  )

  const forceInvert = React.useMemo(() => {
    if (!src) return false
    const fileName = src.split('/').pop()?.toLowerCase() ?? ''
    return fileName === 'vt.png'
  }, [src])

  return (
    <img
      className={cn('h-11 w-11 rounded-2xl', className)}
      src={src}
      alt={operator ? `${operator} logo` : 'Operator logo'}
      title={operator ? `${operator}${operatorCode ? ` (${operatorCode})` : ''}` : badgeText}
      loading="lazy"
      decoding="async"
      style={forceInvert ? { filter: 'invert(1) brightness(1.2)' } : undefined}
    />
  )
}

