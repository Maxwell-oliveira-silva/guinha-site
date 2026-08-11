/**
 * Catálogo de status da carga.
 *
 * A ordem deste array é a ordem da linha do tempo mostrada ao cliente.
 * 'ocorrencia' fica fora do trilho: é um desvio, não uma etapa.
 *
 * Os valores precisam bater com o enum `rastreamento_status` do Postgres
 * (supabase/migrations/20260810120000_rastreamento_schema.sql).
 */

export const STATUS_ORDER = [
  'recebida',
  'em_conferencia',
  'coletada',
  'em_transporte',
  'chegou_destino',
  'saiu_entrega',
  'entregue',
] as const

export type StatusTrilha = (typeof STATUS_ORDER)[number]
export type Status = StatusTrilha | 'ocorrencia'

type StatusInfo = {
  label: string
  /** Como o cliente lê o estado, na voz da transportadora. */
  publico: string
  /** classes Tailwind: texto, fundo e borda do selo */
  tone: string
  dot: string
}

export const STATUS: Record<Status, StatusInfo> = {
  recebida: {
    label: 'Carga recebida',
    publico: 'Carga recebida na unidade',
    tone: 'text-steel bg-white/5 border-white/15',
    dot: 'bg-steel',
  },
  em_conferencia: {
    label: 'Em conferência',
    publico: 'Volumes em conferência',
    tone: 'text-signal bg-signal/10 border-signal/25',
    dot: 'bg-signal',
  },
  coletada: {
    label: 'Coletada',
    publico: 'Carga coletada',
    tone: 'text-signal bg-signal/10 border-signal/25',
    dot: 'bg-signal',
  },
  em_transporte: {
    label: 'Em transporte',
    publico: 'A caminho do destino',
    tone: 'text-signal bg-signal/10 border-signal/25',
    dot: 'bg-signal',
  },
  chegou_destino: {
    label: 'Chegou ao destino',
    publico: 'Chegou à cidade de destino',
    tone: 'text-signal bg-signal/10 border-signal/25',
    dot: 'bg-signal',
  },
  saiu_entrega: {
    label: 'Saiu para entrega',
    publico: 'Saiu para entrega',
    tone: 'text-signal bg-signal/10 border-signal/25',
    dot: 'bg-signal',
  },
  entregue: {
    label: 'Entregue',
    publico: 'Entrega concluída',
    tone: 'text-go bg-go/10 border-go/25',
    dot: 'bg-go',
  },
  ocorrencia: {
    label: 'Ocorrência',
    publico: 'Ocorrência registrada',
    tone: 'text-brand-red-light bg-brand-red/10 border-brand-red/30',
    dot: 'bg-brand-red-light',
  },
}

export const STATUS_LIST = [...STATUS_ORDER, 'ocorrencia'] as const

export function isStatus(value: string): value is Status {
  return value in STATUS
}

/** Posição na trilha; -1 para 'ocorrencia', que não tem posição fixa. */
export function statusIndex(status: Status): number {
  return (STATUS_ORDER as readonly string[]).indexOf(status)
}

export const CODIGO_EXEMPLO = 'GUI-2026-000001'
export const CODIGO_REGEX = /^GUI-\d{4}-\d{6}$/

/** Aceita "gui 2026 1", "gui-2026-000001", "GUI20260000 01"… e normaliza. */
export function normalizarCodigo(entrada: string): string {
  const limpo = entrada.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = /^GUI(\d{4})(\d{1,6})$/.exec(limpo)
  if (m) return `GUI-${m[1]}-${m[2].padStart(6, '0')}`
  return entrada.trim().toUpperCase()
}

/**
 * Realtime.
 *
 * Deixe `false` enquanto a operação não precisar. Para ligar:
 *   1. publique as tabelas (ver o fim de 20260810120200_rastreamento_rpc.sql);
 *   2. troque para `true`.
 * O painel administrativo passa a recarregar sozinho a cada mudança.
 * A página pública continua consultando pela RPC — o canal Realtime
 * respeita RLS e, para o público, não há linha visível nenhuma.
 */
export const REALTIME_ENABLED = false
