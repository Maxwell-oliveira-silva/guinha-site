import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, PackageSearch, SearchX, Search } from 'lucide-react'
import { Container } from '@/components/Container'
import { Button } from '@/components/Button'
import { Alerta } from '@/components/rastreamento/ui'
import { ResultadoRastreio } from '@/components/rastreamento/ResultadoRastreio'
import { rastrearCarga, type ResultadoConsulta } from '@/lib/rastreamento'
import { CODIGO_EXEMPLO, CODIGO_REGEX, normalizarCodigo } from '@/config/rastreamento'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { site } from '@/config/site'

type Estado = 'ocioso' | 'buscando' | 'atualizando' | 'pronto'

export function RastrearPage() {
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState<Estado>('ocioso')
  const [resultado, setResultado] = useState<ResultadoConsulta | null>(null)
  const [erroFormato, setErroFormato] = useState('')
  const resultadoRef = useRef<HTMLDivElement>(null)
  const ultimoCodigo = useRef('')

  const consultar = useCallback(async (valor: string, modo: 'buscando' | 'atualizando') => {
    ultimoCodigo.current = valor
    setEstado(modo)
    const r = await rastrearCarga(valor)
    // Descarta resposta antiga se o cliente já pesquisou outro código.
    if (ultimoCodigo.current !== valor) return
    setResultado(r)
    setEstado('pronto')
  }, [])

  // Permite mandar o link pronto pelo WhatsApp: /rastrear?codigo=GUI-2026-000001.
  // Roda só na montagem — a query string não muda com a página aberta.
  useEffect(() => {
    const daUrl = new URLSearchParams(window.location.search).get('codigo')
    if (!daUrl) return
    const normalizado = normalizarCodigo(daUrl)
    setCodigo(normalizado)
    if (CODIGO_REGEX.test(normalizado)) void consultar(normalizado, 'buscando')
  }, [consultar])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const normalizado = normalizarCodigo(codigo)
    setCodigo(normalizado)

    if (!normalizado) {
      setErroFormato('Digite o código de rastreamento que você recebeu.')
      return
    }
    if (!CODIGO_REGEX.test(normalizado)) {
      setErroFormato(`O código tem o formato ${CODIGO_EXEMPLO}. Confira e tente de novo.`)
      return
    }

    setErroFormato('')
    void consultar(normalizado, 'buscando')
  }

  // Rola até o resultado depois que ele aparece — no celular ele nasce
  // abaixo da dobra e sem isso parece que nada aconteceu.
  useEffect(() => {
    if (estado === 'pronto' && resultado) {
      resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [estado, resultado])

  const buscando = estado === 'buscando'

  return (
    <div className="min-h-screen bg-ink pb-24 pt-32 sm:pt-40">
      <Container>
        <div className="max-w-3xl">
          <p className="eyebrow">Rastreamento</p>
          <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] uppercase text-white">
            Rastreie
            <br />
            <span className="text-brand-red">sua carga</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg">
            Digite o código de rastreamento para acompanhar sua entrega.
          </p>
        </div>

        {/* Busca */}
        <form onSubmit={onSubmit} className="mt-10 max-w-2xl" noValidate>
          <label htmlFor="codigo" className="mb-2 block font-data text-[11px] uppercase tracking-[0.15em] text-steel">
            Digite seu código de rastreamento
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-steel-dim"
                aria-hidden
              />
              <input
                id="codigo"
                name="codigo"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value)
                  if (erroFormato) setErroFormato('')
                }}
                onBlur={() => setCodigo((v) => (v ? normalizarCodigo(v) : v))}
                placeholder={CODIGO_EXEMPLO}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="search"
                aria-invalid={Boolean(erroFormato)}
                aria-describedby={erroFormato ? 'codigo-erro' : 'codigo-dica'}
                className="w-full rounded-full border border-line bg-ink-soft py-4 pl-11 pr-4 font-data text-base tracking-wide text-paper placeholder:font-body placeholder:tracking-normal placeholder:text-steel-dim transition-colors focus:border-brand-red focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" disabled={buscando} className="py-4 sm:px-8">
              {buscando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Buscando…
                </>
              ) : (
                <>
                  <PackageSearch className="h-4 w-4" aria-hidden />
                  Rastrear carga
                </>
              )}
            </Button>
          </div>

          {erroFormato ? (
            <p id="codigo-erro" role="alert" className="mt-3 text-sm text-brand-red-light">
              {erroFormato}
            </p>
          ) : (
            <p id="codigo-dica" className="mt-3 text-xs text-steel-dim">
              Exemplo: <span className="font-data text-steel">{CODIGO_EXEMPLO}</span> — o código está no seu
              comprovante de coleta ou foi enviado pela nossa equipe.
            </p>
          )}
        </form>

        {/* Resultado */}
        <div ref={resultadoRef} className="mt-12 max-w-4xl scroll-mt-28" aria-live="polite">
          {buscando && !resultado && <EsqueletoResultado />}

          {estado !== 'ocioso' && resultado && (
            <>
              {resultado.tipo === 'encontrado' && (
                <ResultadoRastreio
                  rastreamento={resultado.rastreamento}
                  eventos={resultado.eventos}
                  atualizando={estado === 'atualizando'}
                  onAtualizar={() => void consultar(resultado.rastreamento.codigo_rastreio, 'atualizando')}
                />
              )}

              {resultado.tipo === 'nao_encontrado' && <NaoEncontrado codigo={ultimoCodigo.current} />}

              {resultado.tipo === 'inativo' && (
                <Alerta tom="aviso" titulo="Este rastreamento não está mais disponível">
                  <p>
                    O acompanhamento online desta carga foi encerrado. Se você precisa de informações sobre
                    ela, fale com a nossa equipe pelo WhatsApp {site.whatsappDisplay}.
                  </p>
                  <FaleConosco codigo={ultimoCodigo.current} />
                </Alerta>
              )}

              {resultado.tipo === 'indisponivel' && (
                <Alerta titulo="Não foi possível consultar agora">
                  <p>{resultado.mensagem}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      variant="secondary"
                      className="px-5 py-2.5 text-xs"
                      onClick={() => void consultar(ultimoCodigo.current, 'buscando')}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                  <FaleConosco codigo={ultimoCodigo.current} />
                </Alerta>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  )
}

function NaoEncontrado({ codigo }: { codigo: string }) {
  return (
    <div className="rise-in rounded-2xl border border-line bg-ink-soft p-8 text-center sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/12">
        <SearchX className="h-7 w-7 text-brand-red-light" aria-hidden />
      </div>

      <h2 className="mt-6 font-display text-2xl font-bold uppercase text-white">
        Código de rastreamento não encontrado
      </h2>

      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-paper/75">
        Não localizamos nenhuma carga com o código{' '}
        <span className="font-data text-white">{codigo}</span>. Confira se todos os caracteres foram
        digitados corretamente — ou entre em contato com a Guinha Transportes que localizamos para você.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href={buildWhatsAppLink(
            `Olá! Estou tentando rastrear a carga de código ${codigo} no site, mas não encontrei. Podem me ajudar?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-brand-red-light"
        >
          Falar no WhatsApp
        </a>
        <span className="font-data text-xs text-steel">ou ligue {site.phones[0]}</span>
      </div>
    </div>
  )
}

function FaleConosco({ codigo }: { codigo: string }) {
  return (
    <a
      href={buildWhatsAppLink(`Olá! Preciso de informações sobre a carga ${codigo}.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-block text-sm font-semibold text-brand-red-light underline-offset-4 hover:underline"
    >
      Falar com a Guinha no WhatsApp
    </a>
  )
}

function EsqueletoResultado() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-ink-soft p-6 sm:p-8" aria-hidden>
      <div className="flex justify-between gap-6">
        <div className="space-y-3">
          <div className="h-2.5 w-32 rounded bg-white/8" />
          <div className="h-5 w-48 rounded bg-white/12" />
        </div>
        <div className="h-8 w-36 rounded-full bg-white/8" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-7 w-7 shrink-0 rounded-full bg-white/8" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-40 rounded bg-white/8" />
              <div className="h-3 w-24 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
