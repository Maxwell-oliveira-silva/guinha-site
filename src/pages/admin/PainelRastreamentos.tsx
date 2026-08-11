import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  History,
  LogOut,
  PackageCheck,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  Truck,
  TriangleAlert,
  Warehouse,
} from 'lucide-react'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { Link } from '@/components/Link'
import { cn } from '@/lib/utils'
import { Alerta, Carregando, StatusBadge, fieldClass } from '@/components/rastreamento/ui'
import { FormRastreamento } from '@/components/rastreamento/FormRastreamento'
import { ModalStatus } from '@/components/rastreamento/ModalStatus'
import { ModalHistorico } from '@/components/rastreamento/ModalHistorico'
import { Toast, type Aviso } from '@/components/rastreamento/Toast'
import { formatarData, formatarDataHora, tempoRelativo } from '@/lib/format'
import { REALTIME_ENABLED, STATUS, STATUS_LIST } from '@/config/rastreamento'
import { supabase } from '@/lib/supabase'
import {
  definirAtivo,
  ErroRastreamento,
  FILTROS_PADRAO,
  listarRastreamentos,
  obterIndicadores,
  type Filtros,
  type Indicadores,
  type Rastreamento,
} from '@/lib/rastreamento'
import type { Perfil } from '@/hooks/useAdminAuth'
import logoWhite from '@/assets/images/logo-guinha-white.webp'

type Modal =
  | { tipo: 'nenhum' }
  | { tipo: 'form'; registro: Rastreamento | null }
  | { tipo: 'status'; registro: Rastreamento }
  | { tipo: 'historico'; registro: Rastreamento }

const CARDS = [
  { chave: 'total', rotulo: 'Total rastreadas', icone: PackageCheck, cor: 'text-paper' },
  { chave: 'em_transporte', rotulo: 'Em transporte', icone: Truck, cor: 'text-signal' },
  { chave: 'aguardando', rotulo: 'Aguardando coleta', icone: Warehouse, cor: 'text-steel' },
  { chave: 'saiu_entrega', rotulo: 'Saiu para entrega', icone: Clock3, cor: 'text-signal' },
  { chave: 'entregues', rotulo: 'Entregues', icone: PackageCheck, cor: 'text-go' },
  { chave: 'ocorrencias', rotulo: 'Com ocorrência', icone: TriangleAlert, cor: 'text-brand-red-light' },
] as const

export function PainelRastreamentos({ perfil, sair }: { perfil: Perfil | null; sair: () => void }) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO)
  const [buscaDigitada, setBuscaDigitada] = useState('')
  const [linhas, setLinhas] = useState<Rastreamento[]>([])
  const [total, setTotal] = useState(0)
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState<Modal>({ tipo: 'nenhum' })
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [alternandoId, setAlternandoId] = useState<string | null>(null)

  const primeiraCarga = useRef(true)

  const notificar = useCallback((titulo: string, detalhe?: string) => {
    setAviso({ id: Date.now(), titulo, detalhe })
  }, [])

  // Debounce da busca: 350 ms depois da última tecla, e sempre voltando
  // para a página 1 — filtrar mantendo a página 7 mostraria uma tela vazia.
  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((f) => (f.busca === buscaDigitada ? f : { ...f, busca: buscaDigitada, pagina: 1 }))
    }, 350)
    return () => clearTimeout(t)
  }, [buscaDigitada])

  const carregar = useCallback(async () => {
    if (primeiraCarga.current) setCarregando(true)
    else setRecarregando(true)
    setErro('')

    try {
      const [lista, ind] = await Promise.all([listarRastreamentos(filtros), obterIndicadores()])
      setLinhas(lista.linhas)
      setTotal(lista.total)
      setIndicadores(ind)
    } catch (e) {
      setErro(e instanceof ErroRastreamento ? e.message : 'Não foi possível carregar os rastreamentos.')
    } finally {
      primeiraCarga.current = false
      setCarregando(false)
      setRecarregando(false)
    }
  }, [filtros])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // Realtime opcional — ver REALTIME_ENABLED em config/rastreamento.ts.
  useEffect(() => {
    const db = supabase
    if (!REALTIME_ENABLED || !db) return
    const canal = db
      .channel('rastreamentos-painel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rastreamentos' }, () => {
        void carregar()
      })
      .subscribe()
    return () => {
      void db.removeChannel(canal)
    }
  }, [carregar])

  const paginas = Math.max(1, Math.ceil(total / filtros.porPagina))
  const temFiltro = filtros.busca !== '' || filtros.status !== 'todos' || filtros.de !== '' || filtros.ate !== ''

  const intervalo = useMemo(() => {
    if (total === 0) return '0'
    const inicio = (filtros.pagina - 1) * filtros.porPagina + 1
    const fim = Math.min(total, inicio + linhas.length - 1)
    return `${inicio}–${fim} de ${total}`
  }, [filtros.pagina, filtros.porPagina, linhas.length, total])

  function ordenarPor(coluna: Filtros['ordenarPor']) {
    setFiltros((f) => ({
      ...f,
      ordenarPor: coluna,
      ordemAsc: f.ordenarPor === coluna ? !f.ordemAsc : false,
      pagina: 1,
    }))
  }

  async function alternarAtivo(registro: Rastreamento) {
    setAlternandoId(registro.id)
    try {
      const salvo = await definirAtivo(registro.id, !registro.ativo)
      setLinhas((ls) => ls.map((l) => (l.id === salvo.id ? salvo : l)))
      notificar(
        salvo.ativo ? 'Rastreamento reativado' : 'Rastreamento desativado',
        `${salvo.codigo_rastreio} — ${
          salvo.ativo
            ? 'o cliente voltou a ver o acompanhamento no site.'
            : 'o cliente deixa de ver o acompanhamento no site.'
        }`,
      )
      void carregar()
    } catch (e) {
      setErro(e instanceof ErroRastreamento ? e.message : 'Não foi possível alterar o rastreamento.')
    } finally {
      setAlternandoId(null)
    }
  }

  return (
    <div className="min-h-dvh bg-ink">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Voltar ao site">
              <img src={logoWhite} alt="Guinha Transportes" className="h-7 w-auto" />
            </Link>
            <span className="hidden font-data text-[11px] uppercase tracking-[0.18em] text-steel-dim sm:block">
              Painel de rastreamentos
            </span>
          </div>

          <div className="flex items-center gap-3">
            {perfil?.nome && <span className="hidden text-sm text-paper/70 md:block">{perfil.nome}</span>}
            <button
              type="button"
              onClick={sair}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-paper/80 transition-colors hover:border-white/40 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sair
            </button>
          </div>
        </Container>
      </header>

      <Container className="py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Operação</p>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase text-white sm:text-4xl">
              Rastreamentos
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              className="px-5 py-3 text-xs"
              onClick={() => void carregar()}
              disabled={recarregando}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', recarregando && 'animate-spin')} aria-hidden />
              {recarregando ? 'Atualizando…' : 'Atualizar'}
            </Button>
            <Button variant="primary" onClick={() => setModal({ tipo: 'form', registro: null })}>
              <PackagePlus className="h-4 w-4" aria-hidden />
              Novo rastreamento
            </Button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {CARDS.map(({ chave, rotulo, icone: Icone, cor }) => (
            <div key={chave} className="rounded-xl border border-line bg-ink-soft p-4">
              <Icone className={cn('h-4 w-4', cor)} aria-hidden />
              <p className="mt-3 font-display text-2xl font-bold text-white tabular-nums sm:text-3xl">
                {indicadores ? indicadores[chave] : <span className="text-steel-dim">—</span>}
              </p>
              <p className="mt-1 text-[11px] leading-tight text-steel">{rotulo}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mt-6 grid gap-3 rounded-xl border border-line bg-ink-soft p-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-dim"
              aria-hidden
            />
            <input
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
              placeholder="Buscar código, cliente, origem ou destino"
              aria-label="Buscar rastreamentos"
              className={`${fieldClass} py-2.5 pl-10 text-sm`}
            />
          </div>

          <select
            value={filtros.status}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, status: e.target.value as Filtros['status'], pagina: 1 }))
            }
            aria-label="Filtrar por status"
            className={`${fieldClass} py-2.5 text-sm`}
          >
            <option value="todos" className="bg-ink">
              Todos os status
            </option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {STATUS[s].label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.de}
            onChange={(e) => setFiltros((f) => ({ ...f, de: e.target.value, pagina: 1 }))}
            aria-label="Criados a partir de"
            className={`${fieldClass} py-2.5 text-sm [color-scheme:dark]`}
          />
          <input
            type="date"
            value={filtros.ate}
            onChange={(e) => setFiltros((f) => ({ ...f, ate: e.target.value, pagina: 1 }))}
            aria-label="Criados até"
            className={`${fieldClass} py-2.5 text-sm [color-scheme:dark]`}
          />

          <button
            type="button"
            onClick={() => {
              setBuscaDigitada('')
              setFiltros(FILTROS_PADRAO)
            }}
            disabled={!temFiltro}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-steel transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
          >
            Limpar
          </button>
        </div>

        {erro && (
          <div className="mt-6">
            <Alerta titulo="Algo deu errado">
              <p>{erro}</p>
              <Button variant="secondary" className="mt-4 px-5 py-2.5 text-xs" onClick={() => void carregar()}>
                Tentar novamente
              </Button>
            </Alerta>
          </div>
        )}

        {/* Tabela */}
        <div className="mt-6">
          {carregando ? (
            <Carregando texto="Carregando rastreamentos…" />
          ) : linhas.length === 0 ? (
            <Vazio
              comFiltro={temFiltro}
              onLimpar={() => {
                setBuscaDigitada('')
                setFiltros(FILTROS_PADRAO)
              }}
              onCriar={() => setModal({ tipo: 'form', registro: null })}
            />
          ) : (
            <>
              {/* Desktop */}
              <div
                className={cn(
                  'hidden overflow-x-auto rounded-xl border border-line lg:block',
                  recarregando && 'opacity-60 transition-opacity',
                )}
              >
                <table className="w-full min-w-[68rem] text-left text-sm">
                  <thead className="border-b border-line bg-ink-soft">
                    <tr className="font-data text-[10px] uppercase tracking-[0.15em] text-steel-dim">
                      <Th onClick={() => ordenarPor('codigo_rastreio')} ativo={filtros.ordenarPor === 'codigo_rastreio'}>
                        Código
                      </Th>
                      <th className="px-4 py-3.5 font-normal">Cliente</th>
                      <th className="px-4 py-3.5 font-normal">Origem</th>
                      <th className="px-4 py-3.5 font-normal">Destino</th>
                      <th className="px-4 py-3.5 font-normal">Status</th>
                      <Th onClick={() => ordenarPor('updated_at')} ativo={filtros.ordenarPor === 'updated_at'}>
                        Última atualização
                      </Th>
                      <th className="px-4 py-3.5 text-right font-normal">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {linhas.map((r) => (
                      <tr key={r.id} className={cn('transition-colors hover:bg-white/[0.02]', !r.ativo && 'opacity-55')}>
                        <td className="whitespace-nowrap px-4 py-4 font-data text-xs text-white">
                          {r.codigo_rastreio}
                          {!r.ativo && (
                            <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-steel-dim">
                              inativo
                            </span>
                          )}
                        </td>
                        <td className="max-w-[14rem] truncate px-4 py-4 text-paper/85" title={r.cliente_nome}>
                          {r.cliente_nome}
                        </td>
                        <td className="max-w-[11rem] truncate px-4 py-4 text-paper/70" title={r.origem}>
                          {r.origem}
                        </td>
                        <td className="max-w-[11rem] truncate px-4 py-4 text-paper/70" title={r.destino}>
                          {r.destino}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={r.status_atual} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-paper/70">
                          <span title={formatarDataHora(r.updated_at)}>{tempoRelativo(r.updated_at)}</span>
                          {r.previsao_entrega && (
                            <span className="block text-xs text-steel-dim">
                              prev. {formatarData(r.previsao_entrega)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Acoes
                            registro={r}
                            alternando={alternandoId === r.id}
                            onStatus={() => setModal({ tipo: 'status', registro: r })}
                            onEditar={() => setModal({ tipo: 'form', registro: r })}
                            onHistorico={() => setModal({ tipo: 'historico', registro: r })}
                            onAlternar={() => void alternarAtivo(r)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celular */}
              <ul className={cn('grid gap-3 lg:hidden', recarregando && 'opacity-60 transition-opacity')}>
                {linhas.map((r) => (
                  <li
                    key={r.id}
                    className={cn('rounded-xl border border-line bg-ink-soft p-4', !r.ativo && 'opacity-60')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-data text-xs text-white">{r.codigo_rastreio}</span>
                      <StatusBadge status={r.status_atual} />
                    </div>

                    <p className="mt-3 font-semibold text-white">{r.cliente_nome}</p>
                    <p className="mt-1 text-sm text-paper/70">
                      {r.origem} <span className="text-steel-dim">→</span> {r.destino}
                    </p>
                    <p className="mt-2 font-data text-[11px] text-steel">
                      atualizado {tempoRelativo(r.updated_at)}
                      {r.previsao_entrega && ` · prev. ${formatarData(r.previsao_entrega)}`}
                      {!r.ativo && ' · inativo'}
                    </p>

                    <div className="mt-4 border-t border-line pt-3">
                      <Acoes
                        registro={r}
                        alternando={alternandoId === r.id}
                        onStatus={() => setModal({ tipo: 'status', registro: r })}
                        onEditar={() => setModal({ tipo: 'form', registro: r })}
                        onHistorico={() => setModal({ tipo: 'historico', registro: r })}
                        onAlternar={() => void alternarAtivo(r)}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Paginação */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="font-data text-xs text-steel">{intervalo}</p>

                {paginas > 1 && (
                  <div className="flex items-center gap-2">
                    <PagBtn
                      onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina - 1 }))}
                      disabled={filtros.pagina <= 1}
                      rotulo="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </PagBtn>
                    <span className="font-data text-xs text-steel">
                      {filtros.pagina} / {paginas}
                    </span>
                    <PagBtn
                      onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina + 1 }))}
                      disabled={filtros.pagina >= paginas}
                      rotulo="Próxima página"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </PagBtn>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Container>

      {/* Modais — a key remonta o formulário a cada registro escolhido */}
      {modal.tipo === 'form' && (
        <FormRastreamento
          key={modal.registro?.id ?? 'novo'}
          aberto
          registro={modal.registro}
          onFechar={() => setModal({ tipo: 'nenhum' })}
          onSalvo={(salvo, criado) => {
            setModal({ tipo: 'nenhum' })
            notificar(
              criado ? 'Rastreamento criado' : 'Rastreamento atualizado',
              criado
                ? `Código ${salvo.codigo_rastreio} gerado para ${salvo.cliente_nome}.`
                : `${salvo.codigo_rastreio} salvo em ${formatarDataHora(salvo.updated_at)}.`,
            )
            void carregar()
          }}
        />
      )}

      {modal.tipo === 'status' && (
        <ModalStatus
          key={modal.registro.id}
          aberto
          registro={modal.registro}
          onFechar={() => setModal({ tipo: 'nenhum' })}
          onAtualizado={(r) => {
            setModal({ tipo: 'nenhum' })
            notificar(
              'Atualizado com sucesso!',
              `Rastreamento ${r.codigo_rastreio} atualizado para ${STATUS[r.status_atual].label} em ${formatarDataHora(
                r.ultima_atualizacao,
              )}.`,
            )
            void carregar()
          }}
        />
      )}

      {modal.tipo === 'historico' && (
        <ModalHistorico
          key={modal.registro.id}
          aberto
          registro={modal.registro}
          onFechar={() => setModal({ tipo: 'nenhum' })}
        />
      )}

      {aviso && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
          <Toast aviso={aviso} onFechar={() => setAviso(null)} />
        </div>
      )}
    </div>
  )
}

function Th({
  children,
  onClick,
  ativo,
}: {
  children: React.ReactNode
  onClick: () => void
  ativo: boolean
}) {
  return (
    <th className="px-4 py-3.5 font-normal">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 transition-colors hover:text-white',
          ativo && 'text-brand-red-light',
        )}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" aria-hidden />
      </button>
    </th>
  )
}

function PagBtn({
  children,
  onClick,
  disabled,
  rotulo,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  rotulo: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      className="rounded-lg border border-line p-2 text-paper/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-35 disabled:hover:border-line"
    >
      {children}
    </button>
  )
}

function Acoes({
  registro,
  alternando,
  onStatus,
  onEditar,
  onHistorico,
  onAlternar,
}: {
  registro: Rastreamento
  alternando: boolean
  onStatus: () => void
  onEditar: () => void
  onHistorico: () => void
  onAlternar: () => void
}) {
  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-paper/75 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40'

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onStatus} className={cn(btn, 'border-brand-red/40 text-brand-red-light hover:border-brand-red')}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        Status
      </button>
      <button type="button" onClick={onHistorico} className={btn} title="Ver histórico completo">
        <History className="h-3.5 w-3.5" aria-hidden />
        <span className="lg:sr-only xl:not-sr-only">Histórico</span>
      </button>
      <button type="button" onClick={onEditar} className={btn} title="Editar cadastro">
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        <span className="lg:sr-only xl:not-sr-only">Editar</span>
      </button>
      <button
        type="button"
        onClick={onAlternar}
        disabled={alternando}
        className={btn}
        title={registro.ativo ? 'Desativar acompanhamento público' : 'Reativar acompanhamento público'}
      >
        {registro.ativo ? (
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden />
        )}
        <span className="lg:sr-only xl:not-sr-only">{registro.ativo ? 'Desativar' : 'Ativar'}</span>
      </button>
    </div>
  )
}

function Vazio({
  comFiltro,
  onLimpar,
  onCriar,
}: {
  comFiltro: boolean
  onLimpar: () => void
  onCriar: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg font-bold uppercase text-white">
        {comFiltro ? 'Nenhum rastreamento com esses filtros' : 'Nenhum rastreamento cadastrado ainda'}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-steel">
        {comFiltro
          ? 'Tente outro termo, outro status ou amplie o período.'
          : 'Crie o primeiro: o código GUI-ANO-NNNNNN é gerado automaticamente e pode ser enviado ao cliente na hora.'}
      </p>
      <div className="mt-7">
        {comFiltro ? (
          <Button variant="secondary" onClick={onLimpar}>
            Limpar filtros
          </Button>
        ) : (
          <Button variant="primary" onClick={onCriar}>
            <PackagePlus className="h-4 w-4" aria-hidden />
            Novo rastreamento
          </Button>
        )}
      </div>
    </div>
  )
}
