import { Container } from '@/components/Container'
import { clients, trackingPartners } from '@/config/site'

const facts = [
  { value: '20+', label: 'anos de estrada' },
  { value: '100%', label: 'da frota rastreada' },
  { value: '2', label: 'bases: SP e SC' },
  { value: 'ANVISA', label: 'certificação sanitária' },
]

export function TrustBar() {
  return (
    <section aria-label="Números e clientes" className="relative z-10 border-y border-line bg-ink-soft">
      <Container className="py-12">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {f.value}
              </dd>
              <dd className="font-data text-[11px] uppercase tracking-[0.15em] text-steel">{f.label}</dd>
            </div>
          ))}
        </dl>

        <div className="road-rule my-10" />

        <p className="font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">
          Distribuidores que confiam na Guinha
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {clients.map((c) => (
            <li key={c} className="font-display text-sm font-semibold uppercase tracking-wide text-paper/55">
              {c}
            </li>
          ))}
        </ul>

        <p className="mt-8 font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">
          Gerenciamento de risco · {trackingPartners.join(' · ')}
        </p>
      </Container>
    </section>
  )
}
