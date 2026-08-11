import { useState, type FormEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { QUOTE_ENDPOINT, QUOTE_MODE } from '@/config/integrations'
import { site } from '@/config/site'

type Fields = {
  nome: string
  empresa: string
  telefone: string
  email: string
  origem: string
  destino: string
  carga: string
  observacoes: string
}

const empty: Fields = {
  nome: '',
  empresa: '',
  telefone: '',
  email: '',
  origem: '',
  destino: '',
  carga: '',
  observacoes: '',
}

const fieldClass =
  'w-full rounded-lg border border-line bg-ink px-4 py-3 text-base text-paper placeholder:text-steel-dim transition-colors focus:border-brand-red focus:outline-none'

function buildMessage(f: Fields) {
  const lines = [
    'Solicitação de orçamento — site Guinha Transportes',
    '',
    `Nome: ${f.nome}`,
    f.empresa && `Empresa: ${f.empresa}`,
    `Telefone/WhatsApp: ${f.telefone}`,
    f.email && `E-mail: ${f.email}`,
    `Origem: ${f.origem}`,
    `Destino: ${f.destino}`,
    `Tipo de carga: ${f.carga}`,
    f.observacoes && `Observações: ${f.observacoes}`,
  ].filter(Boolean)
  return lines.join('\n')
}

export function Quote() {
  const [values, setValues] = useState<Fields>(empty)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const message = buildMessage(values)

    try {
      if ((QUOTE_MODE === 'endpoint' || QUOTE_MODE === 'both') && QUOTE_ENDPOINT) {
        const res = await fetch(QUOTE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error('falha no envio')
      }

      if (QUOTE_MODE === 'whatsapp' || QUOTE_MODE === 'both') {
        window.open(buildWhatsAppLink(message), '_blank', 'noopener')
      }

      setSent(true)
    } catch {
      setError(
        'Não foi possível enviar agora. Chame no WhatsApp ' + site.whatsappDisplay + ' ou tente novamente.',
      )
    }
  }

  return (
    <section id="orcamento" className="scroll-mt-24 relative bg-ink-soft py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="eyebrow">Orçamento</p>
            <h2 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] uppercase text-white">
              Conte o trajeto.
              <br />
              <span className="text-brand-red">Devolvemos a proposta.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-paper/80">
              Quanto mais detalhe sobre origem, destino e tipo de carga, mais precisa fica a proposta. Se
              preferir, fale direto no WhatsApp {site.whatsappDisplay}.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                'Cargas fechadas e fracionadas',
                'Atendimento em todo o território nacional',
                'Frota 100% rastreada e segurada',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-paper/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {sent ? (
            <div className="flex flex-col items-start justify-center rounded-2xl border border-line bg-ink p-10">
              <div className="rounded-full bg-brand-red/15 p-3">
                <Check className="h-7 w-7 text-brand-red" strokeWidth={2.5} />
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold uppercase text-white">Pedido montado</h3>
              <p className="mt-3 text-sm leading-relaxed text-paper/80">
                Abrimos o WhatsApp com os dados preenchidos. Se a janela não apareceu, libere os pop-ups do
                navegador ou chame no {site.whatsappDisplay}.
              </p>
              <Button
                variant="secondary"
                className="mt-7"
                onClick={() => {
                  setSent(false)
                  setValues(empty)
                }}
              >
                Enviar outro pedido
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-ink p-7 sm:p-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="nome" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Nome *
                  </label>
                  <input id="nome" required value={values.nome} onChange={set('nome')} className={fieldClass} />
                </div>

                <div>
                  <label htmlFor="empresa" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Empresa
                  </label>
                  <input id="empresa" value={values.empresa} onChange={set('empresa')} className={fieldClass} />
                </div>

                <div>
                  <label htmlFor="telefone" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    id="telefone"
                    required
                    type="tel"
                    inputMode="tel"
                    value={values.telefone}
                    onChange={set('telefone')}
                    className={fieldClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    E-mail
                  </label>
                  <input id="email" type="email" value={values.email} onChange={set('email')} className={fieldClass} />
                </div>

                <div>
                  <label htmlFor="origem" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Origem *
                  </label>
                  <input
                    id="origem"
                    required
                    placeholder="Cidade/UF"
                    value={values.origem}
                    onChange={set('origem')}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="destino" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Destino *
                  </label>
                  <input
                    id="destino"
                    required
                    placeholder="Cidade/UF"
                    value={values.destino}
                    onChange={set('destino')}
                    className={fieldClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="carga" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Tipo de carga *
                  </label>
                  <input
                    id="carga"
                    required
                    placeholder="O que será transportado, peso e volume aproximados"
                    value={values.carga}
                    onChange={set('carga')}
                    className={fieldClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="observacoes" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    rows={4}
                    value={values.observacoes}
                    onChange={set('observacoes')}
                    className={`${fieldClass} resize-y`}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-5 text-sm text-brand-red-light">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="group mt-7 w-full sm:w-auto">
                Solicitar orçamento
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <p className="mt-4 text-xs leading-relaxed text-steel-dim">
                Ao enviar, abrimos o WhatsApp da Guinha com os dados preenchidos para você confirmar.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  )
}
