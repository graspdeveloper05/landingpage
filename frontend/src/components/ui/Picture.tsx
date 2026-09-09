import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * Serves WebP where the browser takes it and JPEG everywhere else, from a
 * single base path: `/hero/hero-scene` resolves to `.webp` and `.jpg`.
 *
 * `narrow` adds a smaller variant for phones, so a 175 KB desktop hero is not
 * downloaded over mobile data to be displayed at a third of the size (§11).
 */
export function Picture({
  base,
  narrow,
  narrowMaxWidth = 768,
  className,
  imgClassName,
  alt,
  ...img
}: {
  /** Path without extension, e.g. "/hero/hero-scene" */
  base: string
  /** Optional smaller base, e.g. "/hero/hero-scene-960" */
  narrow?: string
  narrowMaxWidth?: number
  className?: string
  imgClassName?: string
  alt: string
} & Omit<ComponentProps<'img'>, 'src' | 'alt' | 'className'>) {
  const media = `(max-width: ${narrowMaxWidth}px)`

  return (
    <picture className={className}>
      {narrow && <source media={media} srcSet={`${narrow}.webp`} type="image/webp" />}
      {narrow && <source media={media} srcSet={`${narrow}.jpg`} type="image/jpeg" />}
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img src={`${base}.jpg`} alt={alt} className={cn(imgClassName)} {...img} />
    </picture>
  )
}
