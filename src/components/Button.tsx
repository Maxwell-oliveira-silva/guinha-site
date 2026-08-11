import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Link } from '@/components/Link'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variants = {
  primary:
    'bg-brand-red text-white shadow-[0_8px_30px_-8px_rgba(210,31,60,0.6)] hover:bg-brand-red-light hover:shadow-[0_12px_40px_-8px_rgba(210,31,60,0.8)] hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-transparent text-paper border border-white/25 hover:border-white/60 hover:bg-white/5 hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'bg-white/95 text-ink hover:bg-white',
}

type Variant = keyof typeof variants

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: { children: ReactNode; variant?: Variant; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

/**
 * Passa pelo roteador: um href de rota ("/rastrear") navega sem recarregar
 * a página, e uma âncora ("#orcamento") continua rolando como sempre.
 * Links externos, mailto e tel seguem o comportamento nativo.
 */
export function LinkButton({
  children,
  variant = 'primary',
  className,
  href = '#',
  ...props
}: { children: ReactNode; variant?: Variant; className?: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  )
}
