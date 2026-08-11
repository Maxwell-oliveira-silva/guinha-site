import { chapters } from '@/config/journey'
import { Container } from '@/components/Container'
import { LinkButton } from '@/components/Button'
import truckCutout from '@/assets/images/truck-cutout.webp'

/**
 * Alternativa para quem pede redução de movimento: a mesma viagem, os mesmos
 * capítulos e o mesmo caminhão — apresentados como cenas estáticas.
 */
export function JourneyStatic() {
  return (
    <section id="jornada" aria-label="A viagem da carga, do embarque à entrega">
      {chapters.map((c, i) => (
        <div
          key={c.id}
          className="relative overflow-hidden py-20"
          style={{ background: `linear-gradient(180deg, ${c.skyFrom}, ${c.skyTo})` }}
        >
          <Container className="relative z-10">
            <p className="eyebrow mb-4">{c.marker}</p>
            <h2 className="max-w-3xl text-[clamp(1.9rem,4.6vw,3.4rem)] uppercase text-white">{c.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">{c.body}</p>
            {c.bullets && (
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {c.bullets.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-data text-xs uppercase tracking-wider text-white/85"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {c.cta && (
              <LinkButton href={c.cta.href} variant="primary" className="mt-7">
                {c.cta.label}
              </LinkButton>
            )}
            <img
              src={truckCutout}
              alt={
                i === 0
                  ? 'Caminhão Mercedes-Benz Axor da Guinha Transportes com carreta Transjovina'
                  : ''
              }
              aria-hidden={i !== 0}
              className="mt-10 w-full max-w-lg drop-shadow-[0_25px_30px_rgba(0,0,0,0.5)]"
              loading="lazy"
              decoding="async"
              width={449}
              height={277}
            />
          </Container>
        </div>
      ))}
    </section>
  )
}
