import { useEffect, useState } from 'react'
import { EyeOff } from 'lucide-react'
import { Modal } from './Modal'
import { Alerta, Carregando, StatusBadge } from './ui'
import { formatarDataHora } from '@/lib/format'
import { listarEventos, ErroRastreamento, type EventoAdmin, type Rastreamento } from '@/lib/rastreamento'

export function ModalHistorico({
  aberto,
  registro,
  onFechar,
}: {
  aberto: boolean
  registro: Rastreamento
  onFechar: () => void
}) {
  const [eventos, setEventos] = useState<EventoAdmin[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!aberto) return
    let ativo = true
    setEventos(null)
    setErro('')

    listarEventos(registro.id)
      .then((r) => ativo && setEventos(r))
      .catch((e) =>
        ativo && setErro(e instanceof ErroRastreamento ? e.message : 'Não foi possível carregar o histórico.'),
      )

    return () => {
      ativo = false
    }
  }, [aberto, registro.id])

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      titulo="Histórico completo"
      descricao={`${registro.codigo_rastreio} — ${registro.cliente_nome}`}
    >
      {erro && <Alerta titulo="Não deu para carregar">{erro}</Alerta>}

      {!erro && eventos === null && <Carregando texto="Carregando histórico…" />}

      {!erro && eventos?.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-steel">
          Nenhum evento registrado ainda.
        </p>
      )}

      {!erro && eventos && eventos.length > 0 && (
        <ol className="space-y-3">
          {eventos.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-line bg-ink p-4"
              data-interno={!e.publico || undefined}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={e.status} />
                <span className="font-data text-xs text-steel">{formatarDataHora(e.data_evento)}</span>
              </div>

              {e.localizacao && <p className="mt-2.5 text-sm text-paper/80">{e.localizacao}</p>}
              {e.descricao && <p className="mt-1 text-sm leading-relaxed text-paper/60">{e.descricao}</p>}

              {!e.publico && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.15em] text-steel-dim">
                  <EyeOff className="h-3 w-3" aria-hidden />
                  Interno — não aparece para o cliente
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
