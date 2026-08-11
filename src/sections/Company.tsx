import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import { site, mission, vision, values } from '@/config/site'
import workerPhoto from '@/assets/images/scene-worker.webp'
import aerialPhoto from '@/assets/images/scene-aerial.webp'

export function Company() {
  return (
    <section id="empresa" className="scroll-mt-24 relative overflow-hidden bg-ink-soft py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Quem somos"
              title={
                <>
                  Mais de 20 anos
                  <br />
                  às margens do <span className="text-brand-red">Rodoanel</span>
                </>
              }
              lead="A Guinha Transporte e Logística atua há mais de 20 anos no mercado, com dedicação voltada ao transporte eficaz, seguro e prático — buscando continuamente a satisfação de nossos clientes."
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {site.addresses.map((addr) => (
                <div key={addr.label} className="border-l-2 border-brand-red pl-5">
                  <p className="font-data text-[11px] uppercase tracking-[0.15em] text-brand-red-light">
                    {addr.label}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm leading-relaxed text-paper/75">
                    {addr.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <figure className="relative">
            <img
              src={workerPhoto}
              alt="Colaborador da Guinha Transportes movimentando caixas no armazém"
              className="aspect-[4/3] w-full rounded-xl object-cover object-center grayscale"
              loading="lazy"
              decoding="async"
              width={335}
              height={290}
            />
            <figcaption className="mt-4 font-data text-[11px] uppercase tracking-[0.15em] text-steel-dim">
              Movimentação de carga · base Carapicuíba
            </figcaption>
          </figure>
        </div>

        {/* a missão vira citação de destaque: quebra o padrão de abertura das
            outras seções e dá a ela o peso que uma lista de três colunas tirava */}
        <figure className="my-20 border-l-2 border-brand-red pl-6 md:pl-10">
          <blockquote className="max-w-3xl font-display text-[clamp(1.5rem,3.2vw,2.4rem)] font-bold uppercase leading-tight tracking-tight text-white">
            {mission}
          </blockquote>
          <figcaption className="mt-5 font-data text-[11px] uppercase tracking-[0.2em] text-steel">
            Missão · Guinha Transporte e Logística
          </figcaption>
        </figure>

        <div className="road-rule my-16" />

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="font-data text-[11px] uppercase tracking-[0.2em] text-brand-red-light">Visão</h3>
            <p className="mt-4 text-base leading-relaxed text-paper/70">{vision}</p>
          </div>
          <div>
            <h3 className="font-data text-[11px] uppercase tracking-[0.2em] text-brand-red-light">Valores</h3>
            <ul className="mt-4 space-y-2.5">
              {values.map((v) => (
                <li key={v} className="flex gap-3 text-sm leading-relaxed text-paper/70">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-red" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <figure className="relative mt-20 h-56 sm:h-80">
        <img
          src={aerialPhoto}
          alt="Rodovia de múltiplas faixas com tráfego intenso de caminhões e veículos de carga"
          className="h-full w-full object-cover grayscale"
          loading="lazy"
          decoding="async"
          width={1100}
          height={303}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-soft via-transparent to-ink-soft/70" />
        <figcaption className="absolute bottom-6 left-6 font-data text-[11px] uppercase tracking-[0.2em] text-white/70 md:left-10">
          Atendimento em todo o território nacional
        </figcaption>
      </figure>
    </section>
  )
}
