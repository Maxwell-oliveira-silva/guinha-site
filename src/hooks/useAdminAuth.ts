import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type Perfil = { user_id: string; nome: string | null; papel: string; ativo: boolean }

export type EstadoAuth =
  | 'carregando'
  | 'indisponivel' // Supabase não configurado neste ambiente
  | 'deslogado'
  | 'sem_permissao' // autenticado, mas não é admin ativo
  | 'autorizado'

/**
 * Sessão administrativa.
 *
 * Estar autenticado não é suficiente: a conta precisa ter uma linha ativa
 * em `perfis_admin`. Essa checagem aqui é só para a interface — quem
 * realmente barra é a RLS, que devolve zero linhas para quem não é admin
 * mesmo que alguém force a rota no navegador.
 */
export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [estado, setEstado] = useState<EstadoAuth>(supabase ? 'carregando' : 'indisponivel')

  useEffect(() => {
    if (!supabase) return
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setSession(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
    })

    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!supabase) return
    if (!userId) {
      setPerfil(null)
      setEstado('deslogado')
      return
    }

    let ativo = true
    setEstado('carregando')

    supabase
      .from('perfis_admin')
      .select('user_id, nome, papel, ativo')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) console.error('[rastreamento] falha ao ler perfil admin', error)
        const p = (data as Perfil | null) ?? null
        setPerfil(p)
        setEstado(p?.ativo ? 'autorizado' : 'sem_permissao')
      })

    return () => {
      ativo = false
    }
  }, [userId])

  const entrar = useCallback(async (email: string, senha: string) => {
    if (!supabase) throw new Error('Serviço de autenticação indisponível neste ambiente.')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('E-mail ou senha incorretos.')
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada.')
      }
      throw new Error(error.message)
    }
  }, [])

  const sair = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return { estado, session, perfil, entrar, sair }
}
