'use client'

interface SafeImageProps {
  src: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  fallback?: string
}

export default function SafeImage({ src, alt = '', className, style, fallback = '' }: SafeImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const el = e.target as HTMLImageElement
        if (fallback) {
          el.src = fallback
        } else {
          el.style.display = 'none'
        }
      }}
    />
  )
}
