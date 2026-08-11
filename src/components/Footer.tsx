import { Mail, MapPin, Phone } from 'lucide-react'
import { Container } from './Container'
import { Link } from '@/components/Link'
import { useRota } from '@/lib/router'
import { site, services, navLinks } from '@/config/site'
import { buildWhatsAppLink, defaultWhatsAppMessage } from '@/lib/whatsapp'
import { FacebookIcon, InstagramIcon, LinkedinIcon } from './SocialIcons'
import logoWhite from '@/assets/images/logo-guinha-white.webp'
import logoTransjovina from '@/assets/images/logo-transjovina.webp'

export function Footer() {
  const year = new Date().getFullYear()
  const rota = useRota()
  // Mesma regra do Header: âncora da home vira '/#secao' fora dela.
  const resolver = (href: string) => (href.startsWith('#') && rota !== '/' ? `/${href}` : href)
  const hasSocial = site.social.instagram || site.social.facebook || site.social.linkedin

  return (
    <footer id="contato" className="border-t border-line bg-ink-soft scroll-mt-24">
      <Container className="grid grid-cols-1 gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <img src={logoWhite} alt="Guinha Transportes" className="h-10 w-auto" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
            Há mais de {site.yearsInMarket} anos movendo negócios com eficácia, segurança e compromisso —
            transporte e logística rodoviária para todo o território nacional.
          </p>

          <div className="mt-8 border-t border-line pt-6">
            <p className="font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">Empresa coligada</p>
            <span className="mt-4 inline-flex rounded-md bg-white px-4 py-2.5">
              <img
                src={logoTransjovina}
                alt={site.partner.legalName}
                className="h-6 w-auto"
                loading="lazy"
                decoding="async"
                width={900}
                height={242}
              />
            </span>
          </div>

          {hasSocial && (
            <div className="mt-6 flex gap-3">
              {site.social.instagram && (
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="rounded-full border border-white/15 p-2.5 text-paper/70 transition-colors hover:border-brand-red hover:text-white"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {site.social.facebook && (
                <a
                  href={site.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="rounded-full border border-white/15 p-2.5 text-paper/70 transition-colors hover:border-brand-red hover:text-white"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
              {site.social.linkedin && (
                <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="rounded-full border border-white/15 p-2.5 text-paper/70 transition-colors hover:border-brand-red hover:text-white"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-paper/50">Serviços</h3>
          <ul className="mt-5 space-y-3">
            {services.slice(0, 5).map((s) => (
              <li key={s.title}>
                <a href="#servicos" className="text-sm text-paper/70 transition-colors hover:text-white">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-paper/50">Contato</h3>
          <ul className="mt-5 space-y-4">
            <li className="flex items-start gap-3 text-sm text-paper/70">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
              <div className="flex flex-col">
                {site.phones.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-paper/70">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
              <div className="flex flex-col">
                {site.emails.map((e) => (
                  <a key={e} href={`mailto:${e}`} className="hover:text-white">
                    {e}
                  </a>
                ))}
              </div>
            </li>
            {site.addresses.map((addr) => (
              <li key={addr.label} className="flex items-start gap-3 text-sm text-paper/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                <div className="flex flex-col">
                  <span className="font-medium text-paper/90">{addr.label}</span>
                  {addr.lines.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <a
            href={buildWhatsAppLink(defaultWhatsAppMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#25D366] hover:text-[#2fe578]"
          >
            Falar no WhatsApp: {site.whatsappDisplay}
          </a>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 text-xs text-paper/60 md:flex-row">
          <p>
            © {year} {site.legalName}. Todos os direitos reservados.
          </p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Links do rodapé">
            {navLinks.map((l) => (
              <Link key={l.href} href={resolver(l.href)} className="hover:text-paper/80">
                {l.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </footer>
  )
}
