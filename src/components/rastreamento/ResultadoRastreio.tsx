import { CalendarClock, Clock, MapPin, Navigation, RefreshCw } from 'lucide-react'
import { Button } from '@/components/Button'
import { StatusBadge } from './ui'
import { Timeline } from './Timeline'
import { formatarData, formatarDataHora } from '@/lib/format'
import { STATUS } from '@/config/rastreamento'
import type { EventoPublico, RastreamentoPublico } from '@/lib/rastreamento'

function Dado({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: typeof MapPin
  rotulo: string
  valor: string
}) {
  return (
    <div className="rounded-xl border border-line bg-ink p-4">
      <p className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.18em] text-steel-dim">
        <Icone className="h-3.5 w-3.5" aria-hidden />
        {rotulo}
      </p>
      <p className="mt-2 text-sm font-semibold leading-snug text-white sm:text-base">{valor}</p>
    </div>
  )
}

export function ResultadoRastreio({
  rastreamento,
  eventos,
  onAtualizar,
  atualizando,
}: {
  rastreamento: RastreamentoPublico
  eventos: EventoPublico[]
  onAtualizar: () => void
  atualizando: boolean
}) {
  const info = STATUS[rastreamento.status_atual]

  return (
    <div className="rise-in">
      {/* Cabeçalho: código + estado atual */}
      <div className="rounded-2xl border border-line bg-ink-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-steel-dim">
              Código de rastreamento
            </p>
            <p className="mt-2 font-data text-xl font-medium tracking-wide text-white sm:text-2xl">
              {rastreamento.codigo_rastreio}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-steel-dim">Status atual</p>
            <div className="mt-2">
              <StatusBadge status={rastreamento.status_atual} />
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-paper/75 sm:text-base">{info.publico}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Dado icone={MapPin} rotulo="Origem" valor={rastreamento.origem} />
          <Dado icone={Navigation} rotulo="Destino" valor={rastreamento.destino} />
          <Dado
            icone={CalendarClock}
            rotulo="Previsão de entrega"
            valor={formatarData(rastreamento.previsao_entrega)}
          />
          <Dado
            icone={Clock}
            rotulo="Última atualização"
            valor={formatarDataHora(rastreamento.ultima_atualizacao)}
          />
        </div>

        {rastreamento.observacao_publica && (
          <div className="mt-5 rounded-xl border border-signal/25 bg-signal/8 p-4">
            <p className="font-data text-[10px] uppercase tracking-[0.18em] text-signal">Observação</p>
            <p className="mt-2 text-sm leading-relaxed text-paper/85">{rastreamento.observacao_publica}</p>
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="mt-6 rounded-2xl border border-line bg-ink-soft p-6 sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Histórico da viagem</p>
            <h3 className="mt-2 font-display text-xl font-bold uppercase text-white sm:text-2xl">
              Onde sua carga passou
            </h3>
          </div>

          <Button
            variant="secondary"
            onClick={onAtualizar}
            disabled={atualizando}
            className="px-5 py-2.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${atualizando ? 'animate-spin' : ''}`} aria-hidden />
            {atualizando ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        {eventos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-steel">
            Ainda não há movimentações registradas para esta carga. Assim que a operação avançar, o
            histórico aparece aqui.
          </p>
        ) : (
          <Timeline statusAtual={rastreamento.status_atual} eventos={eventos} />
        )}
      </div>
    </div>
  )
}
