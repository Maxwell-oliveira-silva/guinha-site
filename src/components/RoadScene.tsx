import type { Ref } from 'react'
import { chapters } from '@/config/journey'

type RoadSceneProps = {
  setSkyRef: (i: number) => (el: HTMLDivElement | null) => void
  sceneryRef: Ref<HTMLDivElement>
  roadRef: Ref<HTMLDivElement>
}

export function RoadScene({ setSkyRef, sceneryRef, roadRef }: RoadSceneProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* camadas de céu — uma por capítulo, crossfade controlado via GSAP */}
      {chapters.map((c, i) => (
        <div
          key={c.id}
          ref={setSkyRef(i)}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${c.skyFrom} 0%, ${c.skyTo} 65%, ${c.skyTo} 100%)`,
            opacity: i === 0 ? 1 : 0,
          }}
        />
      ))}

      {/* sol/brilho sutil */}
      <div className="absolute right-[8%] top-[18%] h-40 w-40 rounded-full bg-white/20 blur-3xl md:h-64 md:w-64" />

      {/* horizonte / skyline com paralaxe */}
      <div ref={sceneryRef} className="absolute bottom-[26%] left-0 h-[18%] w-[220%] opacity-70 will-change-transform">
        <svg viewBox="0 0 3000 200" preserveAspectRatio="none" className="h-full w-full">
          {Array.from({ length: 30 }).map((_, i) => {
            const x = i * 100 + (i % 3) * 12
            const h = 40 + ((i * 37) % 90)
            return <rect key={i} x={x} y={200 - h} width={i % 4 === 0 ? 46 : 26} height={h} fill="#0a0c10" opacity={0.55} />
          })}
        </svg>
      </div>

      {/* pista */}
      <div className="absolute inset-x-0 bottom-0 h-[26%]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2c30] to-[#141517]" />
        <div className="absolute inset-x-0 top-0 h-2 bg-white/25" />
        <div
          ref={roadRef}
          className="absolute left-0 top-1/2 h-2 w-[200%] -translate-y-1/2 will-change-[background-position]"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #f4d35e 0 60px, transparent 60px 120px)',
          }}
        />
      </div>

      {/* vinheta para legibilidade do texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/70" />
    </div>
  )
}
