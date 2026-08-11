import { useState, type FormEvent } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { Link } from '@/components/Link'
import { Alerta, Campo, fieldClass } from '@/components/rastreamento/ui'
import logoWhite from '@/assets/images/logo-guinha-white.webp'

export function LoginAdmin({
  entrar,
  aviso,
}: {
  entrar: (email: string, senha: string) => Promise<void>
  /** Mensagem de contexto: sessão sem permissão, ambiente sem Supabase… */
  aviso?: { titulo: string; texto: string }
}) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center bg-ink py-16">
      <Container>
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex" aria-label="Voltar ao site">
            <img src={logoWhite} alt="Guinha Transportes" className="h-9 w-auto" />
          </Link>

          <div className="rounded-2xl border border-line bg-ink-soft p-7 sm:p-9">
            <div className="inline-flex rounded-full bg-brand-red/12 p-2.5">
              <Lock className="h-5 w-5 text-brand-red-light" aria-hidden />
            </div>

            <h1 className="mt-5 font-display text-2xl font-bold uppercase text-white">Área administrativa</h1>
            <p className="mt-2 text-sm leading-relaxed text-paper/65">
              Gestão de rastreamentos da Guinha Transportes. Acesso restrito à equipe.
            </p>

            {aviso && (
              <div className="mt-6">
                <Alerta tom="aviso" titulo={aviso.titulo}>
                  {aviso.texto}
                </Alerta>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-7 grid gap-5">
              <Campo label="E-mail" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                />
              </Campo>

              <Campo label="Senha" htmlFor="senha">
                <input
                  id="senha"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={fieldClass}
                />
              </Campo>

              {erro && <Alerta titulo="Não foi possível entrar">{erro}</Alerta>}

              <Button type="submit" variant="primary" disabled={enviando} className="w-full">
                {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {enviando ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-steel-dim">
            É cliente da Guinha?{' '}
            <Link href="/rastrear" className="text-brand-red-light underline-offset-4 hover:underline">
              Rastreie sua carga aqui
            </Link>
            .
          </p>
        </div>
      </Container>
    </div>
  )
}
