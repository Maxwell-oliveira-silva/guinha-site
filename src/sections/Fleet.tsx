import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import conjuntoPhoto from '@/assets/images/frota-real-conjunto.webp'
import carretaPhoto from '@/assets/images/frota-real-carreta.webp'
import cabinePhoto from '@/assets/images/frota-real-cabine.webp'

/**
 * Fotos reais da frota — sem produção e sem render.
 *
 * O resto do site trabalha com imagens cinematográficas; aqui a régua muda de
 * propósito: são registros da operação, e a legenda diz isso em voz alta. Vem
 * logo depois de Serviços, aproveitando o degradê que aquela seção já faz de
 * volta para o escuro.
 */
export function Fleet() {
  return (
    <section id="frota" className="scroll-mt-24 relative bg-ink py-24 sm:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading
            eyebrow="A frota de verdade"
            title={
              <>
                Sem render.
                <br />
                <span className="text-brand-red">Sem estúdio.</span>
              </>
            }
          />
          <p className="max-w-md text-base leading-relaxed text-paper/75 lg:pb-3">
            Registros da nossa própria operação — o conjunto carregado antes de sair, a parada no posto de
            madrugada e a base vista de dentro da cabine. É o caminhão que chega na sua doca.
          </p>
        </div>

        {/* o conjunto inteiro abre a galeria: é a única foto em que a carreta
            Transjovina aparece de ponta a ponta, com a marca legível */}
        <figure className="relative mt-14 overflow-hidden rounded-2xl bg-ink-soft">
          <img
            src={conjuntoPhoto}
            alt="Cavalo mecânico Mercedes-Benz Axor branco engatado à carreta baú Transjovina, estacionado à noite sob iluminação de poste"
            className="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/9] lg:aspect-[21/9]"
            loading="lazy"
            decoding="async"
            width={567}
            height={510}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
            <p className="eyebrow">Conjunto completo · Axor + carreta</p>
            <p className="mt-2 max-w-lg font-display text-lg font-bold uppercase leading-tight text-white sm:text-2xl">
              Carregado e pronto para a rota, na véspera da entrega
            </p>
          </figcaption>
        </figure>

        <div className="mt-5 grid gap-5 lg:h-[440px] lg:grid-cols-[1.35fr_0.65fr]">
          <figure className="relative overflow-hidden rounded-2xl bg-ink-soft">
            <img
              src={carretaPhoto}
              alt="Cavalo mecânico branco da Guinha acoplado à carreta baú Transjovina, abastecendo em um posto à noite"
              className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full"
              loading="lazy"
              decoding="async"
              width={677}
              height={510}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="eyebrow">Carreta baú · Transjovina</p>
              <p className="mt-2 max-w-sm font-display text-lg font-bold uppercase leading-tight text-white sm:text-xl">
                Parada técnica de madrugada, rodando para o destino
              </p>
            </figcaption>
          </figure>

          <figure className="relative overflow-hidden rounded-2xl bg-ink-soft">
            <img
              src={cabinePhoto}
              alt="Vista de dentro da cabine do caminhão, com as mãos do motorista no volante e veículos da frota Transjovina ao fundo"
              className="aspect-[3/4] w-full object-cover lg:aspect-auto lg:h-full"
              loading="lazy"
              decoding="async"
              width={382}
              height={510}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="eyebrow">Saída da base</p>
              <p className="mt-2 font-display text-lg font-bold uppercase leading-tight text-white">
                Motorista próprio, frota própria
              </p>
            </figcaption>
          </figure>
        </div>

        <p className="mt-6 font-data text-[11px] uppercase tracking-[0.2em] text-steel-dim">
          Fotos reais da operação Guinha · Transjovina
        </p>
      </Container>
    </section>
  )
}
