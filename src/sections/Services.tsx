import { useEffect, useRef } from 'react'
import { Route, Satellite, Settings2, ShieldCheck, Truck, Warehouse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap, ScrollTrigger } from '@/animations/gsap'
import { Container } from '@/components/Container'
import { services, fleet } from '@/config/site'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import fleetPhoto from '@/assets/images/fleet-highway.webp'

const icons: Record<string, LucideIcon> = {
  truck: Truck,
  route: Route,
  warehouse: Warehouse,
  satellite: Satellite,
  'shield-check': ShieldCheck,
  settings: Settings2,
}

type Service = (typeof services)[number]

/** Uma parada na estrada. `side` diz para que lado sai o traço que liga à pista. */
function Stop({ service, side }: { service: Service; side: 'up' | 'down' | 'left' }) {
  const Icon = icons[service.icon] ?? Truck
  return (
    <article data-stop className="relative">
      {side !== 'left' && (
        <span
          aria-hidden="true"
          className={`absolute left-3.5 hidden h-16 w-px bg-asphalt/30 lg:block ${
            side === 'up' ? '-bottom-16' : '-top-16'
          }`}
        />
      )}
      <Icon className="h-7 w-7 text-brand-red-dark" strokeWidth={1.6} />
      <h3 className="mt-5 font-display text-lg font-bold uppercase leading-tight tracking-tight text-ink">
        {service.title}
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{service.description}</p>
    </article>
  )
}

/** A pista: faixa de asfalto com tracejado central — o mesmo desenho do logotipo. */
function Road({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-11 overflow-hidden rounded-full bg-asphalt">
        <div
          className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, var(--color-signal) 0 22px, transparent 22px 44px)',
          }}
        />
      </div>
    )
  }
  return (
    <div aria-hidden="true" className="relative my-16 hidden h-11 overflow-hidden rounded-full bg-asphalt lg:block">
      <div
        className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--color-signal) 0 26px, transparent 26px 52px)',
        }}
      />
    </div>
  )
}

export function Services() {
  const rootRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.from('[data-stop]', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-road]', start: 'top 80%' },
      })
    }, rootRef)
    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reduced])

  const top = services.slice(0, 3)
  const bottom = services.slice(3)

  return (
    // sem padding inferior: a foto encerra a seção e faz o degradê de volta ao escuro
    <section id="servicos" ref={rootRef} className="scroll-mt-24 relative bg-paper pt-24 sm:pt-32">
      <Container>
        {/* abertura em duas colunas — as outras seções empilham, esta divide */}
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-data text-[11px] uppercase tracking-[0.22em] text-brand-red-dark">
              O que fazemos
            </p>
            <h2 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] uppercase text-ink">
              Uma operação,
              <br />
              <span className="text-brand-red-dark">todos os modais rodoviários</span>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-ink/70 lg:pb-3">
            Da caminhonete à carreta LS, com veículos baú para cargas fechadas e fracionadas. Você contrata
            uma transportadora e resolve a cadeia inteira.
          </p>
        </div>

        {/* --- as paradas ao longo da pista --- */}
        <div data-road className="mt-20">
          {/* desktop: três acima, pista no meio, três abaixo */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-x-12">
              {top.map((s) => (
                <Stop key={s.title} service={s} side="up" />
              ))}
            </div>
            <Road />
            <div className="grid grid-cols-3 gap-x-12">
              {bottom.map((s) => (
                <Stop key={s.title} service={s} side="down" />
              ))}
            </div>
          </div>

          {/* mobile e tablet: a pista desce pela lateral, uma parada por linha —
              em duas colunas a coluna direita ficava solta, longe da estrada */}
          <div className="relative pl-16 lg:hidden">
            <Road vertical />
            <div className="grid gap-12">
              {services.map((s) => (
                <Stop key={s.title} service={s} side="left" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-ink/12 pt-8">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">Nossa frota</p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {fleet.map((f) => (
              <li
                key={f}
                className="rounded-full border border-ink/20 px-4 py-2 font-data text-xs uppercase tracking-wider text-ink/75"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* a frota que você acabou de ler, rodando — e a transição de volta ao escuro */}
      <figure className="relative mt-24 h-64 sm:h-96">
        <img
          src={fleetPhoto}
          alt="Cavalo mecânico Mercedes-Benz Axor da Guinha Transportes puxando carreta Transjovina em rodovia"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          width={1280}
          height={720}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper via-transparent to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />
        <figcaption className="absolute bottom-8 left-6 max-w-md md:left-10">
          <p className="font-data text-[11px] uppercase tracking-[0.2em] text-brand-red-light">Em operação</p>
          <p className="mt-2 font-display text-xl font-bold uppercase leading-tight text-white sm:text-2xl">
            Cargas fechadas e fracionadas, em todo o território nacional
          </p>
        </figcaption>
      </figure>
    </section>
  )
}
