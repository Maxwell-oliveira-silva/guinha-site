import { supabase } from './supabase'
import type { Status } from '@/config/rastreamento'

/**
 * Camada única de acesso ao rastreamento.
 *
 * Todo componente passa por aqui — nenhuma tela monta query própria. É o
 * ponto onde, no futuro, entram cache, Realtime ou um endpoint diferente
 * sem que a interface precise mudar.
 */

// ---------------------------------------------------------------- público

export type EventoPublico = {
  id: string
  status: Status
  descricao: string | null
  localizacao: string | null
  data_evento: string
}

export type RastreamentoPublico = {
  codigo_rastreio: string
  status_atual: Status
  origem: string
  destino: string
  previsao_entrega: string | null
  observacao_publica: string | null
  ultima_atualizacao: string
}

export type ResultadoConsulta =
  | { tipo: 'encontrado'; rastreamento: RastreamentoPublico; eventos: EventoPublico[] }
  | { tipo: 'nao_encontrado' }
  | { tipo: 'inativo' }
  | { tipo: 'indisponivel'; mensagem: string }

const SEM_CONEXAO =
  'Não conseguimos falar com o sistema de rastreamento agora. Verifique sua conexão e tente de novo em instantes.'

const NAO_CONFIGURADO =
  'O rastreamento online ainda não está disponível neste ambiente. Fale com a Guinha pelo WhatsApp que consultamos para você.'

export async function rastrearCarga(codigo: string): Promise<ResultadoConsulta> {
  if (!supabase) return { tipo: 'indisponivel', mensagem: NAO_CONFIGURADO }

  const { data, error } = await supabase.rpc('rastrear_carga', { p_codigo: codigo })

  if (error) {
    console.error('[rastreamento] falha na consulta pública', error)
    return { tipo: 'indisponivel', mensagem: SEM_CONEXAO }
  }

  const payload = data as {
    encontrado?: boolean
    ativo?: boolean
    rastreamento?: RastreamentoPublico
    eventos?: EventoPublico[]
  } | null

  if (!payload?.encontrado) return { tipo: 'nao_encontrado' }
  if (payload.ativo === false || !payload.rastreamento) return { tipo: 'inativo' }

  return {
    tipo: 'encontrado',
    rastreamento: payload.rastreamento,
    eventos: payload.eventos ?? [],
  }
}

// ----------------------------------------------------------- administrativo

export type Rastreamento = {
  id: string
  codigo_rastreio: string
  cliente_nome: string
  cliente_id: string | null
  viagem_id: string | null
  origem: string
  destino: string
  previsao_entrega: string | null
  status_atual: Status
  observacao_publica: string | null
  observacao_interna: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export type EventoAdmin = EventoPublico & {
  publico: boolean
  criado_por: string | null
  created_at: string
}

export type Indicadores = {
  total: number
  em_transporte: number
  aguardando: number
  saiu_entrega: number
  entregues: number
  ocorrencias: number
  inativos: number
}

export type EntradaRastreamento = {
  cliente_nome: string
  origem: string
  destino: string
  previsao_entrega: string | null
  status_atual: Status
  observacao_publica: string | null
  ativo: boolean
  /** Vazio = o banco gera GUI-ANO-NNNNNN sozinho. */
  codigo_rastreio?: string
}

export type Filtros = {
  busca: string
  status: Status | 'todos'
  de: string
  ate: string
  ordenarPor: 'updated_at' | 'created_at' | 'codigo_rastreio' | 'previsao_entrega'
  ordemAsc: boolean
  pagina: number
  porPagina: number
}

export const FILTROS_PADRAO: Filtros = {
  busca: '',
  status: 'todos',
  de: '',
  ate: '',
  ordenarPor: 'updated_at',
  ordemAsc: false,
  pagina: 1,
  porPagina: 20,
}

/** Erro já traduzido para algo que o Arnaldo entenda na tela. */
export class ErroRastreamento extends Error {}

function exigirCliente() {
  if (!supabase) throw new ErroRastreamento(NAO_CONFIGURADO)
  return supabase
}

const CAMPOS_ADMIN =
  'id, codigo_rastreio, cliente_nome, cliente_id, viagem_id, origem, destino, previsao_entrega, status_atual, observacao_publica, observacao_interna, ativo, created_at, updated_at'

export async function listarRastreamentos(
  filtros: Filtros,
): Promise<{ linhas: Rastreamento[]; total: number }> {
  const db = exigirCliente()
  const inicio = (filtros.pagina - 1) * filtros.porPagina

  let query = db
    .from('rastreamentos')
    .select(CAMPOS_ADMIN, { count: 'exact' })
    .order(filtros.ordenarPor, { ascending: filtros.ordemAsc, nullsFirst: false })
    .range(inicio, inicio + filtros.porPagina - 1)

  const busca = filtros.busca.trim()
  if (busca) {
    // Escapa vírgula e parêntese, que são sintaxe do filtro `or` do PostgREST.
    const termo = busca.replace(/[,()]/g, ' ')
    query = query.or(
      [
        `codigo_rastreio.ilike.%${termo}%`,
        `cliente_nome.ilike.%${termo}%`,
        `origem.ilike.%${termo}%`,
        `destino.ilike.%${termo}%`,
      ].join(','),
    )
  }

  if (filtros.status !== 'todos') query = query.eq('status_atual', filtros.status)
  if (filtros.de) query = query.gte('created_at', `${filtros.de}T00:00:00`)
  if (filtros.ate) query = query.lte('created_at', `${filtros.ate}T23:59:59`)

  const { data, error, count } = await query
  if (error) throw traduzir(error)

  return { linhas: (data ?? []) as Rastreamento[], total: count ?? 0 }
}

export async function obterIndicadores(): Promise<Indicadores> {
  const db = exigirCliente()
  const { data, error } = await db.rpc('rastreamento_indicadores')
  if (error) throw traduzir(error)
  return data as Indicadores
}

export async function listarEventos(rastreamentoId: string): Promise<EventoAdmin[]> {
  const db = exigirCliente()
  const { data, error } = await db
    .from('rastreamento_eventos')
    .select('id, status, descricao, localizacao, data_evento, publico, criado_por, created_at')
    .eq('rastreamento_id', rastreamentoId)
    .order('data_evento', { ascending: true })
  if (error) throw traduzir(error)
  return (data ?? []) as EventoAdmin[]
}

export async function criarRastreamento(entrada: EntradaRastreamento): Promise<Rastreamento> {
  const db = exigirCliente()
  const { codigo_rastreio, ...resto } = entrada
  const payload = codigo_rastreio?.trim()
    ? { ...resto, codigo_rastreio: codigo_rastreio.trim().toUpperCase() }
    : resto // sem o campo: o trigger do banco gera o código

  const { data, error } = await db.from('rastreamentos').insert(payload).select(CAMPOS_ADMIN).single()
  if (error) throw traduzir(error)
  return data as Rastreamento
}

export async function atualizarRastreamento(
  id: string,
  entrada: Omit<EntradaRastreamento, 'codigo_rastreio' | 'status_atual'>,
): Promise<Rastreamento> {
  const db = exigirCliente()
  const { data, error } = await db
    .from('rastreamentos')
    .update(entrada)
    .eq('id', id)
    .select(CAMPOS_ADMIN)
    .single()
  if (error) throw traduzir(error)
  return data as Rastreamento
}

/** Liga/desliga o acompanhamento público sem tocar no resto do cadastro. */
export async function definirAtivo(id: string, ativo: boolean): Promise<Rastreamento> {
  const db = exigirCliente()
  const { data, error } = await db
    .from('rastreamentos')
    .update({ ativo })
    .eq('id', id)
    .select(CAMPOS_ADMIN)
    .single()
  if (error) throw traduzir(error)
  return data as Rastreamento
}

export type ResultadoAtualizacao = {
  codigo_rastreio: string
  status_anterior: Status
  status_atual: Status
  ultima_atualizacao: string
}

export async function atualizarStatus(params: {
  id: string
  status: Status
  descricao?: string
  localizacao?: string
  dataEvento?: string
  publico?: boolean
}): Promise<ResultadoAtualizacao> {
  const db = exigirCliente()
  const { data, error } = await db.rpc('atualizar_status_rastreamento', {
    p_rastreamento_id: params.id,
    p_status: params.status,
    p_descricao: params.descricao?.trim() || null,
    p_localizacao: params.localizacao?.trim() || null,
    p_data_evento: params.dataEvento ? new Date(params.dataEvento).toISOString() : null,
    p_publico: params.publico ?? true,
  })
  if (error) throw traduzir(error)
  return data as ResultadoAtualizacao
}

// ------------------------------------------------------------------ erros

type ErroSupabase = { code?: string; message?: string }

function traduzir(error: ErroSupabase): ErroRastreamento {
  const code = error.code ?? ''
  const msg = error.message ?? ''

  if (code === '23505' || msg.includes('codigo_rastreio_key')) {
    return new ErroRastreamento('Já existe um rastreamento com esse código. Deixe o campo em branco para gerar um novo.')
  }
  if (msg.includes('rastreamentos_codigo_formato')) {
    return new ErroRastreamento('O código precisa seguir o formato GUI-2026-000001.')
  }
  if (code === '42501' || code === 'PGRST301' || msg.toLowerCase().includes('row-level security')) {
    return new ErroRastreamento('Sua conta não tem permissão para esta ação. Fale com o responsável pelo sistema.')
  }
  if (code === 'P0002') {
    return new ErroRastreamento('Rastreamento não encontrado. Ele pode ter sido removido por outro usuário.')
  }
  if (!code && (msg.includes('Failed to fetch') || msg.includes('NetworkError'))) {
    return new ErroRastreamento(SEM_CONEXAO)
  }

  console.error('[rastreamento] erro não mapeado', error)
  return new ErroRastreamento(msg || 'Não foi possível concluir a operação. Tente novamente.')
}
