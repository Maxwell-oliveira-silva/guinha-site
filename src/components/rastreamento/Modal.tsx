import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Diálogo baseado em <dialog> nativo: foco preso, Esc e backdrop vêm de
 * graça do navegador, sem trazer uma biblioteca de modal para três telas.
 */
export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  largura = 'md',
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  largura?: 'md' | 'lg'
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (aberto && !dialog.open) dialog.showModal()
    if (!aberto && dialog.open) dialog.close()
  }, [aberto])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onFechar()
      }}
      onClick={(e) => {
        // Clique no backdrop (o alvo é o próprio <dialog>) fecha.
        if (e.target === ref.current) onFechar()
      }}
      aria-labelledby="modal-titulo"
      className={cn(
        'w-[calc(100vw-2rem)] rounded-2xl border border-line bg-ink-soft p-0 text-paper backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        'my-8 max-h-[calc(100dvh-4rem)] overflow-y-auto',
        largura === 'lg' ? 'max-w-3xl' : 'max-w-xl',
      )}
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-line bg-ink-soft px-6 py-5">
        <div>
          <h2 id="modal-titulo" className="font-display text-xl font-bold uppercase text-white">
            {titulo}
          </h2>
          {descricao && <p className="mt-1.5 text-sm leading-relaxed text-paper/65">{descricao}</p>}
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="-mr-1 rounded-full p-2 text-steel transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="px-6 py-6">{children}</div>
    </dialog>
  )
}
