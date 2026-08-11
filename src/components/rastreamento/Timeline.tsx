import { AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { partesDataHora } from '@/lib/format'
import { STATUS, STATUS_ORDER, statusIndex, type Status } from '@/config/rastreamento'
import type { EventoPublico } from '@/lib/rastreamento'

type Passo = {
  chave: string
  status: Status
  estado: 'concluido' | 'atual' | 'futuro'
  evento?: EventoPublico
}

/**
 * Junta duas coisas numa lista só: o trilho fixo de sete etapas (que o
 * cliente quer ver inteiro, inclusive o que ainda não aconteceu) e os
 * eventos reais do banco. Ocorrências não têm posição no trilho — entram
 * na ordem cronológica, entre as etapas já datadas.
 */
function montarPassos(statusAtual: Status, eventos: EventoPublico[]): Passo[] {
  const porStatus = new Map<Status, EventoPublico>()
  for (const e of eventos) {
    if (e.status !== 'ocorrencia') porStatus.set(e.status, e) // fica o mais recente
  }

  const atualIdx = statusIndex(statusAtual)

  const trilho: Passo[] = STATUS_ORDER.map((status, i) => {
    const evento = porStatus.get(status)
    let estado: Passo['estado']
    if (statusAtual === 'ocorrencia') {
      // Ocorrência congela o trilho: o que já aconteceu fica marcado,
      // o resto fica aguardando, sem nenhuma etapa "em andamento".
      estado = evento ? 'concluido' : 'futuro'
    } else if (i < atualIdx) {
      estado = 'concluido'
    } else if (i === atualIdx) {
      // 'entregue' é terminal — não faz sentido pulsar como "em andamento".
      estado = statusAtual === 'entregue' ? 'concluido' : 'atual'
    } else {
      estado = 'futuro'
    }
    return { chave: status, status, estado, evento }
  })

  const ocorrencias = eventos
    .filter((e) => e.status === 'ocorrencia')
    .sort((a, b) => a.data_evento.localeCompare(b.data_evento))

  if (ocorrencias.length === 0) return trilho

  // Intercala pela data. O detalhe que importa: uma ocorrência posterior a
  // tudo que já aconteceu entra logo depois da última etapa REAL — não no
  // fim da lista, atrás das etapas que ainda nem começaram. É o caso comum
  // (a carga travou onde parou) e é ali que o cliente procura a explicação.
  const ultimaReal = trilho.reduce((ultimo, p, i) => (p.evento ? i : ultimo), -1)
  const maisRecente = ocorrencias[ocorrencias.length - 1]

  const comoPasso = (oc: EventoPublico): Passo => ({
    chave: oc.id,
    status: 'ocorrencia',
    estado: statusAtual === 'ocorrencia' && oc.id === maisRecente.id ? 'atual' : 'concluido',
    evento: oc,
  })

  const resultado: Passo[] = []
  const pendentes = [...ocorrencias]

  trilho.forEach((passo, i) => {
    const data = passo.evento?.data_evento
    while (data && pendentes.length > 0 && pendentes[0].data_evento < data) {
      resultado.push(comoPasso(pendentes.shift()!))
    }
    resultado.push(passo)
    if (i === ultimaReal) {
      while (pendentes.length > 0) resultado.push(comoPasso(pendentes.shift()!))
    }
  })

  // Só sobra algo aqui se nenhuma etapa do trilho tiver acontecido ainda.
  while (pendentes.length > 0) resultado.push(comoPasso(pendentes.shift()!))

  return resultado
}

function Marcador({ passo }: { passo: Passo }) {
  if (passo.status === 'ocorrencia') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-red/50 bg-brand-red/15">
        <AlertTriangle className="h-3.5 w-3.5 text-brand-red-light" strokeWidth={2.5} aria-hidden />
      </span>
    )
  }

  if (passo.estado === 'concluido') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-red">
        <Check className="h-4 w-4 text-white" strokeWidth={3} aria-hidden />
      </span>
    )
  }

  if (passo.estado === 'atual') {
    return (
      <span className="pulse-signal flex h-7 w-7 items-center justify-center rounded-full border-2 border-signal bg-ink">
        <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
      </span>
    )
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-line bg-ink">
      <span className="h-2 w-2 rounded-full bg-line" aria-hidden />
    </span>
  )
}

export function Timeline({
  statusAtual,
  eventos,
}: {
  statusAtual: Status
  eventos: EventoPublico[]
}) {
  const passos = montarPassos(statusAtual, eventos)

  return (
    <ol className="relative">
      {passos.map((passo, i) => {
        const info = STATUS[passo.status]
        const ultimo = i === passos.length - 1
        const partes = passo.evento ? partesDataHora(passo.evento.data_evento) : null
        const apagado = passo.estado === 'futuro'

        return (
          <li
            key={passo.chave}
            className="rise-in relative flex gap-4 pb-7 last:pb-0"
            style={{ animationDelay: `${Math.min(i, 9) * 55}ms` }}
          >
            {!ultimo && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-3.5 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 rounded-full',
                  passo.estado === 'concluido' ? 'bg-brand-red/45' : 'bg-line',
                )}
              />
            )}

            <div className="relative z-10 shrink-0">
              <Marcador passo={passo} />
            </div>

            <div className={cn('min-w-0 flex-1 pt-0.5', apagado && 'opacity-45')}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p
                  className={cn(
                    'text-sm font-semibold sm:text-base',
                    passo.estado === 'atual' ? 'text-signal' : 'text-white',
                    passo.status === 'ocorrencia' && 'text-brand-red-light',
                  )}
                >
                  {info.label}
                </p>
                {partes && (
                  <p className="font-data text-xs text-steel">
                    {partes.dia} · {partes.hora}
                  </p>
                )}
                {passo.estado === 'atual' && (
                  <span className="font-data text-[10px] uppercase tracking-[0.18em] text-signal/80">
                    etapa atual
                  </span>
                )}
              </div>

              {passo.evento?.localizacao && (
                <p className="mt-1 text-sm text-paper/70">{passo.evento.localizacao}</p>
              )}
              {passo.evento?.descricao && (
                <p className="mt-1 text-sm leading-relaxed text-paper/60">{passo.evento.descricao}</p>
              )}
              {apagado && !passo.evento && (
                <p className="mt-1 text-sm text-steel-dim">Ainda não iniciada</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
