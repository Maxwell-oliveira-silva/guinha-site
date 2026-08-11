import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/animations/gsap'
import { chapters } from '@/config/journey'
import { Container } from '@/components/Container'
import { LinkButton } from '@/components/Button'
import truckCutout from '@/assets/images/truck-cutout.webp'

const VH_PER_CHAPTER = 105
const TOTAL_VH = VH_PER_CHAPTER * chapters.length

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Silhueta contínua de galpões e torres — o cenário de um corredor logístico. */
function buildSkyline() {
  let d = 'M 0 200 L 0 150'
  let x = 0
  let i = 0
  while (x < 3200) {
    const w = 60 + ((i * 53) % 130)
    const h = 150 - ((i * 37) % 95)
    d += ` L ${x} ${h} L ${x + w} ${h}`
    x += w
    i += 1
  }
  return `${d} L 3200 200 Z`
}

export function Journey() {
  const wrapperRef = useRef<HTMLElement | null>(null)
  const truckRef = useRef<HTMLDivElement | null>(null)
  const skyRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const dashRef = useRef<HTMLDivElement | null>(null)
  const skylineRef = useRef<HTMLDivElement | null>(null)
  const odometerRef = useRef<HTMLSpanElement | null>(null)
  const railRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.65,
        onUpdate: (self) => {
          const p = self.progress
          const chapterPos = p * chapters.length

          // o caminhão real atravessa a cena da esquerda para a direita
          if (truckRef.current) {
            gsap.set(truckRef.current, {
              xPercent: lerp(-8, 118, p),
              y: Math.sin(p * Math.PI * 22) * 3,
            })
          }

          // faixas da pista correndo — velocidade ligada ao scroll
          if (dashRef.current) {
            gsap.set(dashRef.current, { backgroundPositionX: `${-p * 3600}px` })
          }

          // paralaxe do horizonte
          if (skylineRef.current) {
            gsap.set(skylineRef.current, { xPercent: -p * 38 })
          }

          // crossfade dos céus
          skyRefs.current.forEach((el, i) => {
            if (!el) return
            gsap.set(el, { opacity: clamp(1 - Math.abs(chapterPos - (i + 0.5)), 0, 1) })
          })

          // crossfade dos painéis de texto
          panelRefs.current.forEach((el, i) => {
            if (!el) return
            const o = clamp(1 - Math.abs(chapterPos - (i + 0.5)) * 1.75, 0, 1)
            gsap.set(el, { opacity: o, y: (1 - o) * 30, pointerEvents: o > 0.6 ? 'auto' : 'none' })
          })

          // odômetro / trilha de progresso
          if (odometerRef.current) {
            odometerRef.current.textContent = String(Math.round(p * 870)).padStart(3, '0')
          }
          if (railRef.current) {
            gsap.set(railRef.current, { scaleX: p })
          }
        },
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="jornada"
      ref={wrapperRef}
      style={{ height: `${TOTAL_VH}vh` }}
      className="relative"
      aria-label="A viagem da carga, do embarque à entrega"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        {/* --- céus por capítulo --- */}
        {chapters.map((c, i) => (
          <div
            key={c.id}
            ref={(el) => {
              skyRefs.current[i] = el
            }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${c.skyFrom} 0%, ${c.skyTo} 72%, ${c.skyTo} 100%)`,
              opacity: i === 0 ? 1 : 0,
            }}
          />
        ))}

        {/* sol difuso */}
        <div className="absolute right-[12%] top-[22%] h-48 w-48 rounded-full bg-white/15 blur-[70px] md:h-72 md:w-72" />

        {/* horizonte industrial com paralaxe — silhueta contínua, assentada na pista */}
        <div
          ref={skylineRef}
          className="absolute bottom-[22%] left-0 h-[14%] w-[240%] will-change-transform"
          aria-hidden="true"
        >
          <svg viewBox="0 0 3200 200" preserveAspectRatio="none" className="h-full w-full">
            <path d={buildSkyline()} fill="#05060a" opacity={0.7} />
          </svg>
        </div>

        {/* --- pista --- */}
        <div className="absolute inset-x-0 bottom-0 h-[22%]" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-asphalt to-ink" />
          <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
          <div
            ref={dashRef}
            className="absolute left-0 top-[46%] h-1.5 w-[300%] will-change-[background-position]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, var(--color-signal) 0 70px, transparent 70px 150px)',
            }}
          />
        </div>

        {/* --- o caminhão real da frota, rodando sobre a pista --- */}
        <div
          ref={truckRef}
          className="absolute bottom-[10%] left-0 z-[5] w-[58vw] max-w-[250px] will-change-transform sm:bottom-[13%] sm:w-[34vw] sm:max-w-[460px]"
        >
          <img
            src={truckCutout}
            alt="Caminhão Mercedes-Benz Axor da Guinha Transportes com carreta Transjovina"
            className="w-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.6)]"
            loading="lazy"
            decoding="async"
            width={449}
            height={277}
          />
        </div>

        {/* --- vinhetas de leitura ---
            A vertical sozinha deixava o texto em 3.2:1 sobre o céu do pôr do sol,
            abaixo do mínimo de 4.5:1. O scrim lateral escurece só as bordas, onde
            os painéis ficam, e leva o contraste para ~13:1 sem apagar o céu. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/5 to-ink/80" />

        {/* --- painéis de texto --- */}
        <Container className="pointer-events-none relative z-20 h-full">
          {chapters.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                panelRefs.current[i] = el
              }}
              className={`absolute top-[11%] max-w-[86vw] px-2 sm:top-[16%] sm:max-w-lg ${
                c.align === 'right'
                  ? 'left-6 text-left md:left-auto md:right-10 md:text-right'
                  : 'left-6 text-left md:left-10'
              }`}
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <p className="eyebrow mb-4">{c.marker}</p>
              <h2 className="text-[clamp(1.75rem,3.8vw,3rem)] uppercase text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                {c.title}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                {c.body}
              </p>
              {c.bullets && (
                <ul
                  className={`mt-6 flex flex-wrap gap-2.5 ${
                    c.align === 'right' ? 'md:justify-end' : ''
                  }`}
                >
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="rounded-full border border-white/30 bg-ink/40 px-4 py-1.5 font-data text-xs uppercase tracking-wider text-white/95 backdrop-blur-sm"
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
            </div>
          ))}
        </Container>

        {/* --- odômetro: barra de progresso rente ao asfalto --- */}
        {/* pr-24 no celular para o odômetro não ficar embaixo do botão do WhatsApp */}
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center gap-4 pl-6 pr-24 md:px-10">
          <span className="font-data text-[10px] uppercase tracking-[0.2em] text-white/60">
            KM <span ref={odometerRef}>000</span>
          </span>
          <div className="relative h-px flex-1 bg-white/20">
            <div
              ref={railRef}
              className="absolute inset-y-0 left-0 w-full origin-left bg-brand-red"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
          <span className="font-data text-[10px] uppercase tracking-[0.2em] text-white/35">870</span>
        </div>
      </div>
    </section>
  )
}
