import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { Home } from '@/pages/Home'
import { NaoEncontrada } from '@/pages/NaoEncontrada'
import { useRota } from '@/lib/router'

/**
 * O rastreamento e o painel entram por import dinâmico: quem só quer o
 * site institucional não baixa o cliente do Supabase nem o painel inteiro.
 */
const RastrearPage = lazy(() =>
  import('@/pages/RastrearPage').then((m) => ({ default: m.RastrearPage })),
)
const AdminRastreamentos = lazy(() =>
  import('@/pages/admin/AdminRastreamentos').then((m) => ({ default: m.AdminRastreamentos })),
)

const TITULOS: Record<string, string> = {
  '/': 'Guinha Transportes — Transporte e Logística em Movimento',
  '/rastrear': 'Rastreie sua carga — Guinha Transportes',
  '/admin/rastreamentos': 'Painel de rastreamentos — Guinha Transportes',
}

/** Casca pública: mesmo cabeçalho, rodapé e botão de WhatsApp de sempre. */
function SitePublico({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-red focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

function Esperando() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Carregando">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-red" />
    </div>
  )
}

function App() {
  const rota = useRota()

  useEffect(() => {
    document.title = TITULOS[rota] ?? 'Página não encontrada — Guinha Transportes'
  }, [rota])

  // O painel tem casca própria (sem cabeçalho institucional).
  if (rota === '/admin/rastreamentos') {
    return (
      <Suspense fallback={<Esperando />}>
        <AdminRastreamentos />
      </Suspense>
    )
  }

  return (
    <SitePublico>
      {rota === '/' ? (
        <Home />
      ) : rota === '/rastrear' ? (
        <Suspense fallback={<Esperando />}>
          <RastrearPage />
        </Suspense>
      ) : (
        <NaoEncontrada />
      )}
    </SitePublico>
  )
}

export default App
