import { Container } from '@/components/Container'
import { Link } from '@/components/Link'

export function NaoEncontrada() {
  return (
    <div className="flex min-h-[70vh] items-center pt-32">
      <Container>
        <div className="max-w-lg">
          <p className="eyebrow">Erro 404</p>
          <h1 className="mt-4 text-[clamp(2rem,6vw,3.5rem)] uppercase text-white">
            Essa rota não existe
          </h1>
          <p className="mt-5 text-base leading-relaxed text-paper/75">
            O endereço que você abriu não corresponde a nenhuma página do site.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-brand-red px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-red-light"
            >
              Ir para a página inicial
            </Link>
            <Link
              href="/rastrear"
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold tracking-wide text-paper transition-colors hover:border-white/60"
            >
              Rastrear uma carga
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
