import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import { differentiators, insurancePartners, trackingPartners } from '@/config/site'
import securityPhoto from '@/assets/images/scene-security.webp'
import techPhoto from '@/assets/images/scene-tech.webp'

export function Differentiators() {
  return (
    <section id="diferenciais" className="scroll-mt-24 relative bg-ink py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Por que Guinha"
          title={
            <>
              Carga rastreada.
              <br />
              <span className="text-brand-red">Risco gerenciado.</span>
            </>
          }
          lead="Toda carga é monitorada por satélite da coleta à entrega no destino final, e nossa frota é segurada pelas maiores seguradoras do país."
        />

        <div className="mt-16 grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <figure className="relative overflow-hidden rounded-2xl">
            <img
              src={securityPhoto}
              alt="Operação monitorada em tempo real por rede de rastreamento via satélite"
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
              width={978}
              height={692}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          </figure>

          <ul className="grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2">
            {differentiators.map((d) => (
              <li key={d.title} className="bg-ink-soft p-7">
                <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-white">
                  {d.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/75">{d.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="road-rule my-16" />

        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="eyebrow">Tecnologia</p>
            <h3 className="mt-4 text-[clamp(1.6rem,3.4vw,2.5rem)] uppercase text-white">
              Estratégia de transporte feita sob medida
            </h3>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/80">
              Distribuir numa capital com tantas restrições de tráfego e recebimento exige ser estratégico.
              Antes da proposta, desenvolvemos um projeto técnico que busca a solução adequada ao core business
              de cada cliente, considerando visibilidade técnica e racionalização dos custos.
            </p>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">
                  Gerenciamento de risco
                </p>
                <ul className="mt-3 space-y-1.5">
                  {trackingPartners.map((t) => (
                    <li key={t} className="font-display text-sm font-semibold uppercase text-paper/75">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">Seguros</p>
                <ul className="mt-3 space-y-1.5">
                  {insurancePartners.map((i) => (
                    <li key={i.type} className="text-sm text-paper/75">
                      <span className="font-display font-semibold uppercase">{i.company}</span>
                      <span className="text-paper/45"> · {i.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <figure className="relative overflow-hidden rounded-2xl">
            <img
              src={techPhoto}
              alt="Painel de controle digital representando a gestão integrada das operações"
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
              width={647}
              height={770}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
          </figure>
        </div>
      </Container>
    </section>
  )
}
