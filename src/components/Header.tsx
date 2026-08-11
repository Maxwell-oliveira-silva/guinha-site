import { useEffect, useState } from 'react'
import { Menu, PackageSearch, X } from 'lucide-react'
import { Container } from './Container'
import { LinkButton } from './Button'
import { Link } from '@/components/Link'
import { useRota } from '@/lib/router'
import { navLinks } from '@/config/site'
import logoWhite from '@/assets/images/logo-guinha-white.webp'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const rota = useRota()

  // As âncoras do menu apontam para seções da home. Fora dela, viram
  // '/#secao' para o visitante voltar e rolar até o lugar certo.
  const resolver = (href: string) => (href.startsWith('#') && rota !== '/' ? `/${href}` : href)
  const ehRota = (href: string) => href.startsWith('/')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-ink/85 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.08)]' : 'bg-transparent'
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href={rota === '/' ? '#topo' : '/'} className="flex items-center gap-2" aria-label="Guinha Transportes — início">
          <img src={logoWhite} alt="Guinha Transportes" className="h-9 w-auto md:h-10" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={resolver(link.href)}
              aria-current={ehRota(link.href) && rota === link.href ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 text-sm font-medium tracking-wide transition-colors hover:text-white ${
                ehRota(link.href) && rota === link.href ? 'text-white' : 'text-paper/80'
              }`}
            >
              {ehRota(link.href) && <PackageSearch className="h-3.5 w-3.5" aria-hidden />}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <LinkButton href={resolver('#orcamento')} variant="primary" className="px-6 py-3 text-xs">
            Solicitar orçamento
          </LinkButton>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-full p-2 text-paper lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </Container>

      <div
        id="mobile-menu"
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-500 ${
          open ? 'max-h-[34rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <Container className="flex flex-col gap-1 pb-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={resolver(link.href)}
              onClick={() => setOpen(false)}
              aria-current={ehRota(link.href) && rota === link.href ? 'page' : undefined}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-paper/90 transition-colors hover:bg-white/5"
            >
              {ehRota(link.href) && <PackageSearch className="h-4 w-4 text-brand-red-light" aria-hidden />}
              {link.label}
            </Link>
          ))}
          <LinkButton
            href={resolver('#orcamento')}
            variant="primary"
            className="mt-3 w-full"
            onClick={() => setOpen(false)}
          >
            Solicitar orçamento
          </LinkButton>
        </Container>
      </div>
    </header>
  )
}
