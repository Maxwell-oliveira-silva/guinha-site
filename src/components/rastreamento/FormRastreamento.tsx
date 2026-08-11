import { useState, type FormEvent } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { Modal } from './Modal'
import { Alerta, Campo, fieldClass } from './ui'
import { STATUS, STATUS_LIST, type Status } from '@/config/rastreamento'
import {
  atualizarRastreamento,
  criarRastreamento,
  ErroRastreamento,
  type Rastreamento,
} from '@/lib/rastreamento'

type Props = {
  aberto: boolean
  /** null = criando um novo */
  registro: Rastreamento | null
  onFechar: () => void
  onSalvo: (registro: Rastreamento, criado: boolean) => void
}

const VAZIO = {
  cliente_nome: '',
  origem: '',
  destino: '',
  previsao_entrega: '',
  status_atual: 'recebida' as Status,
  observacao_publica: '',
  ativo: true,
  codigo_rastreio: '',
}

type Campos = typeof VAZIO

function doRegistro(r: Rastreamento | null): Campos {
  if (!r) return { ...VAZIO }
  return {
    cliente_nome: r.cliente_nome,
    origem: r.origem,
    destino: r.destino,
    previsao_entrega: r.previsao_entrega ?? '',
    status_atual: r.status_atual,
    observacao_publica: r.observacao_publica ?? '',
    ativo: r.ativo,
    codigo_rastreio: r.codigo_rastreio,
  }
}

export function FormRastreamento({ aberto, registro, onFechar, onSalvo }: Props) {
  const editando = registro !== null
  // A key no <Modal> abaixo remonta o formulário a cada abertura, então o
  // estado inicial sempre reflete o registro selecionado.
  const [campos, setCampos] = useState<Campos>(() => doRegistro(registro))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const set =
    <K extends keyof Campos>(chave: K) =>
    (valor: Campos[K]) =>
      setCampos((c) => ({ ...c, [chave]: valor }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    const base = {
      cliente_nome: campos.cliente_nome.trim(),
      origem: campos.origem.trim(),
      destino: campos.destino.trim(),
      previsao_entrega: campos.previsao_entrega || null,
      observacao_publica: campos.observacao_publica.trim() || null,
      ativo: campos.ativo,
    }

    try {
      if (editando) {
        // O status não se altera por aqui: mudar status é uma ação com
        // histórico própria ("Atualizar status"), para não gerar evento
        // silencioso a cada edição de cadastro.
        const salvo = await atualizarRastreamento(registro.id, base)
        onSalvo(salvo, false)
      } else {
        const salvo = await criarRastreamento({
          ...base,
          status_atual: campos.status_atual,
          codigo_rastreio: campos.codigo_rastreio.trim() || undefined,
        })
        onSalvo(salvo, true)
      }
    } catch (e) {
      setErro(e instanceof ErroRastreamento ? e.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      titulo={editando ? 'Editar rastreamento' : 'Novo rastreamento'}
      descricao={
        editando
          ? `Código ${registro.codigo_rastreio} — o código não muda depois de emitido.`
          : 'O código é gerado automaticamente no formato GUI-ANO-NNNNNN.'
      }
    >
      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        <Campo label="Cliente *" htmlFor="cliente_nome" className="sm:col-span-2">
          <input
            id="cliente_nome"
            required
            maxLength={160}
            value={campos.cliente_nome}
            onChange={(e) => set('cliente_nome')(e.target.value)}
            className={fieldClass}
            placeholder="Razão social ou nome do cliente"
          />
        </Campo>

        <Campo
          label="Código de rastreamento"
          htmlFor="codigo_rastreio"
          className="sm:col-span-2"
          hint={
            editando
              ? 'O cliente já recebeu este código — ele é fixo.'
              : 'Deixe em branco para gerar automaticamente. Preencha apenas para migrar um código antigo.'
          }
        >
          <div className="relative">
            <input
              id="codigo_rastreio"
              value={campos.codigo_rastreio}
              onChange={(e) => set('codigo_rastreio')(e.target.value.toUpperCase())}
              disabled={editando}
              placeholder="Gerado automaticamente"
              pattern="GUI-\d{4}-\d{6}"
              title="Formato: GUI-2026-000001"
              className={`${fieldClass} font-data disabled:cursor-not-allowed disabled:opacity-60`}
            />
            {!editando && !campos.codigo_rastreio && (
              <Wand2
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-dim"
                aria-hidden
              />
            )}
          </div>
        </Campo>

        <Campo label="Origem *" htmlFor="origem">
          <input
            id="origem"
            required
            maxLength={160}
            value={campos.origem}
            onChange={(e) => set('origem')(e.target.value)}
            className={fieldClass}
            placeholder="São Paulo - SP"
          />
        </Campo>

        <Campo label="Destino *" htmlFor="destino">
          <input
            id="destino"
            required
            maxLength={160}
            value={campos.destino}
            onChange={(e) => set('destino')(e.target.value)}
            className={fieldClass}
            placeholder="Campinas - SP"
          />
        </Campo>

        <Campo label="Previsão de entrega" htmlFor="previsao_entrega">
          <input
            id="previsao_entrega"
            type="date"
            value={campos.previsao_entrega}
            onChange={(e) => set('previsao_entrega')(e.target.value)}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </Campo>

        <Campo
          label="Status inicial"
          htmlFor="status_atual"
          hint={editando ? 'Use "Atualizar status" para mover a carga.' : undefined}
        >
          <select
            id="status_atual"
            value={campos.status_atual}
            disabled={editando}
            onChange={(e) => set('status_atual')(e.target.value as Status)}
            className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {STATUS_LIST.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          label="Observação pública"
          htmlFor="observacao_publica"
          className="sm:col-span-2"
          hint="Este texto aparece para o cliente na página de rastreamento. Não escreva informação interna aqui."
        >
          <textarea
            id="observacao_publica"
            rows={3}
            maxLength={500}
            value={campos.observacao_publica}
            onChange={(e) => set('observacao_publica')(e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </Campo>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink p-4 sm:col-span-2">
          <input
            type="checkbox"
            checked={campos.ativo}
            onChange={(e) => set('ativo')(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-red"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Rastreamento ativo</span>
            <span className="mt-1 block text-xs leading-relaxed text-steel">
              Desativado, o código continua no sistema mas o cliente deixa de ver o acompanhamento no site.
            </span>
          </span>
        </label>

        {erro && (
          <div className="sm:col-span-2">
            <Alerta titulo="Não deu para salvar">{erro}</Alerta>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar rastreamento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
