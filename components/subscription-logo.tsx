'use client'
import { useState } from 'react'

interface SubscriptionLogoProps {
  logoUrl?: string | null
  logoEmoji?: string | null
  categoryIcon: string
  name: string
  size?: 'sm' | 'md'
}

export function SubscriptionLogo({ logoUrl, logoEmoji, categoryIcon, name, size = 'md' }: SubscriptionLogoProps) {
  const [imgError, setImgError] = useState(false)
  const dim = size === 'sm' ? 32 : 40
  const emoji = logoEmoji ?? categoryIcon

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={dim}
        height={dim}
        onError={() => setImgError(true)}
        className="rounded-lg object-contain"
        style={{ width: dim, height: dim }}
      />
    )
  }
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-muted"
      style={{ width: dim, height: dim, fontSize: size === 'sm' ? 16 : 20 }}
    >
      {emoji}
    </span>
  )
}
