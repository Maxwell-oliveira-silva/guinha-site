import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS, type Status } from '@/config/rastreamento'

/** Mesmo campo do formulário de orçamento — o site já tinha um padrão. */
export const fieldClass =
  'w-full rounded-lg border border-line bg-ink px-4 py-3 text-base text-paper placeholder:text-steel-dim transition-colors focus:border-brand-red focus:outline-none'

export const labelClass = 'mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel'

export function Campo({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-steel-dim">{hint}</p>}
    </div>
  )
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const info = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-data text-[11px] uppercase tracking-[0.12em]',
        info.tone,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', info.dot)} aria-hidden />
      {info.label}
    </span>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-sm text-steel" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {texto}
    </div>
  )
}

export function Alerta({
  titulo,
  children,
  tom = 'erro',
}: {
  titulo: string
  children?: ReactNode
  tom?: 'erro' | 'aviso'
}) {
  const cor = tom === 'erro' ? 'border-brand-red/35 bg-brand-red/8' : 'border-signal/30 bg-signal/8'
  const icone = tom === 'erro' ? 'text-brand-red-light' : 'text-signal'
  return (
    <div role="alert" className={cn('flex gap-3 rounded-xl border p-4', cor)}>
      <AlertTriangle className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', icone)} aria-hidden />
      <div>
        <p className="text-sm font-semibold text-white">{titulo}</p>
        {children && <div className="mt-1.5 text-sm leading-relaxed text-paper/75">{children}</div>}
      </div>
    </div>
  )
}
