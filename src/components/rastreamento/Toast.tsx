import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export type Aviso = { id: number; titulo: string; detalhe?: string }

/**
 * Confirmação visual de uma ação concluída. Fica no canto inferior no
 * desktop e no topo do conteúdo no celular, onde o polegar não cobre.
 */
export function Toast({ aviso, onFechar }: { aviso: Aviso; onFechar: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFechar, 6000)
    return () => clearTimeout(t)
  }, [aviso.id, onFechar])

  return (
    <div
      role="status"
      aria-live="polite"
      className="rise-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-go/30 bg-ink-elevated p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] sm:w-96"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-go" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{aviso.titulo}</p>
        {aviso.detalhe && <p className="mt-1 text-xs leading-relaxed text-paper/65">{aviso.detalhe}</p>}
      </div>
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar aviso"
        className="-mr-1 -mt-1 rounded-full p-1.5 text-steel transition-colors hover:bg-white/5 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
