import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { gsap } from '@/animations/gsap'
import { Container } from '@/components/Container'
import { LinkButton } from '@/components/Button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HERO_VIDEO, HERO_VIDEO_POSTER } from '@/config/media'
import heroPhoto from '@/assets/images/truck-sunset.webp'

export function Hero() {
  const rootRef = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-hero-photo]', { scale: 1.12, duration: 2.2, ease: 'power2.out' })
        .from('[data-hero-eyebrow]', { y: 18, opacity: 0, duration: 0.7 }, 0.35)
        .from('[data-hero-line]', { y: 44, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.45)
        .from('[data-hero-sub]', { y: 20, opacity: 0, duration: 0.8 }, 0.9)
        .from('[data-hero-cta]', { y: 16, opacity: 0, duration: 0.7, stagger: 0.08 }, 1.05)
        .from('[data-hero-scroll]', { opacity: 0, duration: 0.6 }, 1.4)
    }, rootRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      id="topo"
      ref={rootRef}
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink pb-20 pt-32 sm:pb-24"
    >
      {/* foto real da frota Guinha/Transjovina — trocada por vídeo se houver um em HERO_VIDEO.
          No celular fica a foto: economiza ~1 MB de dados e bateria. */}
      {HERO_VIDEO && !reduced && isDesktop ? (
        <video
          data-hero-photo
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          src={HERO_VIDEO}
          poster={HERO_VIDEO_POSTER || heroPhoto}
          autoPlay
          muted
          loop
          playsInline
          aria-label="Caminhão da frota Guinha Transportes em rodovia ao entardecer"
        />
      ) : (
        <img
          data-hero-photo
          src={heroPhoto}
          alt="Caminhão da frota Guinha Transportes com carreta Transjovina em rodovia ao entardecer"
          className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          fetchPriority="high"
          decoding="async"
          width={895}
          height={725}
        />
      )}

      {/* gradientes de leitura */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/30 to-transparent" />

      <Container className="relative z-10">
        <p data-hero-eyebrow className="eyebrow mb-6">
          Carapicuíba/SP · Ilhota/SC · Cobertura nacional
        </p>

        <h1 className="max-w-4xl text-[clamp(2.25rem,5.6vw,4.5rem)] uppercase text-white">
          <span data-hero-line className="block">
            Sua carga rastreada{' '}
          </span>
          <span data-hero-line className="block">
            do embarque{' '}
          </span>
          <span data-hero-line className="block">
            <span className="text-brand-red">à entrega</span>
          </span>
        </h1>

        <p data-hero-sub className="mt-6 max-w-xl text-base leading-relaxed text-paper/75">
          Há mais de 20 anos a Guinha Transportes leva cargas fechadas e fracionadas por todo o Brasil —
          com frota 100% monitorada via satélite e certificação ANVISA.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* largura total no celular: alvo de toque confortável para o polegar */}
          <LinkButton data-hero-cta href="#orcamento" variant="primary" className="group w-full sm:w-auto">
            Solicitar orçamento
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </LinkButton>
          <LinkButton data-hero-cta href="#servicos" variant="secondary" className="w-full sm:w-auto">
            Ver nossos serviços
          </LinkButton>
        </div>
      </Container>

      <div
        data-hero-scroll
        className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 text-paper/45"
      >
        <span className="font-data text-[10px] uppercase tracking-[0.3em]">Role para acompanhar a viagem</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  )
}
