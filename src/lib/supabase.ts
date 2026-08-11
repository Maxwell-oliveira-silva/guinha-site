import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase — chave ANÔNIMA apenas.
 *
 * A service role key NUNCA entra aqui: qualquer coisa prefixada com VITE_
 * vai parar no bundle que o navegador baixa. Todo o controle de acesso
 * está nas policies de RLS e nas funções do banco.
 *
 * O site institucional foi ao ar antes deste módulo existir e precisa
 * continuar subindo mesmo sem as variáveis configuradas — por isso o
 * client é opcional e as telas de rastreamento sabem lidar com a ausência
 * dele (estado "serviço indisponível") em vez de estourar em branco.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurado = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'guinha-admin-auth',
      },
    })
  : null

if (!supabaseConfigurado && import.meta.env.DEV) {
  console.warn(
    '[rastreamento] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não definidas. ' +
      'Copie .env.example para .env e preencha — ver README.',
  )
}
