import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow: string
  title: ReactNode
  lead?: string
  className?: string
}) {
  return (
    <div className={cn('max-w-3xl', className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] uppercase text-white">{title}</h2>
      {lead && <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">{lead}</p>}
    </div>
  )
}
