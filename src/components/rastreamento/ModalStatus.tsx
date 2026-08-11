import { useState, type FormEvent } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Modal } from './Modal'
import { Alerta, Campo, StatusBadge, fieldClass } from './ui'
import { agoraParaInput } from '@/lib/format'
import { STATUS, STATUS_LIST, statusIndex, type Status } from '@/config/rastreamento'
import { atualizarStatus, ErroRastreamento, type Rastreamento, type ResultadoAtualizacao } from '@/lib/rastreamento'

/** Sugere a próxima etapa do trilho — o caminho comum em um clique. */
function proximoStatus(atual: Status): Status {
  const i = statusIndex(atual)
  if (i < 0 || i >= STATUS_LIST.length - 2) return atual
  return STATUS_LIST[i + 1] as Status
}

export function ModalStatus({
  aberto,
  registro,
  onFechar,
  onAtualizado,
}: {
  aberto: boolean
  registro: Rastreamento
  onFechar: () => void
  onAtualizado: (resultado: ResultadoAtualizacao) => void
}) {
  const [status, setStatus] = useState<Status>(() => proximoStatus(registro.status_atual))
  const [descricao, setDescricao] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [dataEvento, setDataEvento] = useState(() => agoraParaInput())
  const [publico, setPublico] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const r = await atualizarStatus({
        id: registro.id,
        status,
        descricao,
        localizacao,
        dataEvento,
        publico,
      })
      onAtualizado(r)
    } catch (e) {
      setErro(e instanceof ErroRastreamento ? e.message : 'Não foi possível atualizar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Atualizar status"
      descricao={`${registro.codigo_rastreio} — ${registro.cliente_nome}`}
      largura="lg"
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-ink p-4">
          <StatusBadge status={registro.status_atual} />
          <ArrowRight className="h-4 w-4 text-steel-dim" aria-hidden />
          <StatusBadge status={status} />
        </div>

        <Campo label="Novo status *" htmlFor="novo_status">
          <select
            id="novo_status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={fieldClass}
          >
            {STATUS_LIST.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Local" htmlFor="localizacao" hint="Onde a carga estava neste momento.">
            <input
              id="localizacao"
              maxLength={160}
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Rodovia Anhanguera, km 45"
              className={fieldClass}
            />
          </Campo>

          <Campo label="Data e hora do evento" htmlFor="data_evento">
            <input
              id="data_evento"
              type="datetime-local"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </Campo>
        </div>

        <Campo
          label="Descrição"
          htmlFor="descricao"
          hint="Aparece no histórico do cliente quando o evento for público."
        >
          <textarea
            id="descricao"
            rows={3}
            maxLength={400}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Carga em rota para o destino."
            className={`${fieldClass} resize-y`}
          />
        </Campo>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink p-4">
          <input
            type="checkbox"
            checked={publico}
            onChange={(e) => setPublico(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-red"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Mostrar este evento para o cliente</span>
            <span className="mt-1 block text-xs leading-relaxed text-steel">
              Desmarque para registrar uma movimentação interna. O status atual muda de qualquer forma; só
              a linha do histórico fica oculta.
            </span>
          </span>
        </label>

        {erro && <Alerta titulo="Não deu para atualizar">{erro}</Alerta>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {salvando ? 'Atualizando…' : 'Confirmar atualização'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
