import { ShieldAlert } from 'lucide-react'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { Link } from '@/components/Link'
import { Carregando } from '@/components/rastreamento/ui'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { LoginAdmin } from './LoginAdmin'
import { PainelRastreamentos } from './PainelRastreamentos'
import { site } from '@/config/site'

/**
 * Porteiro da rota /admin/rastreamentos.
 *
 * Vale repetir: esta checagem é de interface. Se alguém contornar o
 * roteador e chegar direto no painel, as consultas voltam vazias — a RLS
 * do Postgres não devolve linha nenhuma para quem não tem perfil de admin
 * ativo, e as escritas são recusadas pelo banco.
 */
export function AdminRastreamentos() {
  const { estado, perfil, entrar, sair } = useAdminAuth()

  if (estado === 'carregando') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink">
        <Carregando texto="Verificando acesso…" />
      </div>
    )
  }

  if (estado === 'indisponivel') {
    return (
      <LoginAdmin
        entrar={entrar}
        aviso={{
          titulo: 'Ambiente sem conexão com o banco',
          texto:
            'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas nesta publicação. Consulte o README para ligá-las.',
        }}
      />
    )
  }

  if (estado === 'deslogado') {
    return <LoginAdmin entrar={entrar} />
  }

  if (estado === 'sem_permissao') {
    return (
      <div className="flex min-h-dvh items-center bg-ink py-16">
        <Container>
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-ink-soft p-8 text-center sm:p-10">
            <div className="mx-auto inline-flex rounded-full bg-brand-red/12 p-3">
              <ShieldAlert className="h-6 w-6 text-brand-red-light" aria-hidden />
            </div>

            <h1 className="mt-6 font-display text-2xl font-bold uppercase text-white">Acesso não liberado</h1>
            <p className="mt-4 text-sm leading-relaxed text-paper/70">
              Sua conta existe, mas ainda não tem permissão para o painel de rastreamentos. Peça ao
              responsável pelo sistema para liberar seu acesso — ou fale com a Guinha em{' '}
              {site.whatsappDisplay}.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => void sair()}>
                Sair desta conta
              </Button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-red-light"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return <PainelRastreamentos perfil={perfil} sair={() => void sair()} />
}
