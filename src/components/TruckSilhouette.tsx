import { forwardRef } from 'react'

/**
 * Silhueta vetorial do caminhão real da Guinha/Transjovina (Mercedes-Benz Axor
 * cabine-sobre-motor com teto sleeper + carreta baú), redesenhada a partir das
 * fotos reais fornecidas — não é um caminhão genérico de estoque.
 */
export const TruckSilhouette = forwardRef<SVGSVGElement, { className?: string }>(function TruckSilhouette(
  { className },
  ref,
) {
  return (
    <svg ref={ref} viewBox="0 0 920 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* sombra de contato */}
      <ellipse cx="460" cy="272" rx="430" ry="14" fill="black" opacity="0.35" />

      {/* ---- carreta / baú ---- */}
      <g>
        <rect x="60" y="70" width="560" height="150" rx="6" fill="#e8e9ea" />
        <rect x="60" y="70" width="560" height="150" rx="6" stroke="#9aa0a6" strokeWidth="2" />
        {/* corrugado */}
        {Array.from({ length: 27 }).map((_, i) => (
          <line key={i} x1={70 + i * 20} y1="78" x2={70 + i * 20} y2="212" stroke="#d3d5d7" strokeWidth="2" />
        ))}
        {/* faixa vermelha diagonal (assinatura visual da lona real) */}
        <path d="M 70 205 L 610 205 L 610 190 L 130 190 Z" fill="#d21f3c" />
        <path d="M 70 214 L 610 214 L 610 208 L 110 208 Z" fill="#141517" />
        {/* wordmark simplificado */}
        <text x="160" y="130" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fontSize="30" fill="#141517" letterSpacing="2">
          GUINHA
        </text>
        <text x="160" y="158" fontFamily="Space Grotesk, sans-serif" fontWeight="500" fontSize="15" fill="#6b7076" letterSpacing="4">
          TRANSPORTES
        </text>

        {/* eixos da carreta (tri-eixo) */}
        <g fill="#1c1e22">
          <circle cx="470" cy="238" r="30" />
          <circle cx="540" cy="238" r="30" />
          <circle cx="600" cy="238" r="30" />
        </g>
        <g fill="#4a4d52">
          <circle cx="470" cy="238" r="13" />
          <circle cx="540" cy="238" r="13" />
          <circle cx="600" cy="238" r="13" />
        </g>
      </g>

      {/* ---- cavalo mecânico (cabine sobre motor, teto sleeper) ---- */}
      <g>
        {/* corpo inferior / chassi */}
        <path d="M 616 196 L 700 196 L 700 220 L 616 220 Z" fill="#2a2c30" />

        {/* cabine */}
        <path
          d="M 636 92
             C 636 78, 648 68, 664 68
             L 792 68
             C 806 68, 816 78, 818 92
             L 862 92
             C 878 92, 888 104, 888 120
             L 888 196
             L 636 196
             Z"
          fill="#f2f2f0"
          stroke="#c7c9cc"
          strokeWidth="2"
        />

        {/* teto sleeper / spoiler */}
        <path d="M 660 68 C 660 54, 670 46, 684 46 L 760 46 C 772 46, 780 54, 782 68 Z" fill="#dfe1e2" />

        {/* para-brisa dividido */}
        <path d="M 648 96 L 700 96 L 696 140 L 648 140 Z" fill="#7c9bb0" opacity="0.85" />
        <path d="M 706 96 L 748 96 L 748 140 L 702 140 Z" fill="#7c9bb0" opacity="0.85" />

        {/* grade frontal + estrela */}
        <rect x="838" y="118" width="44" height="52" rx="4" fill="#1c1e22" />
        <circle cx="860" cy="144" r="15" fill="#2a2c30" stroke="#c7c9cc" strokeWidth="2" />
        <circle cx="860" cy="144" r="6" fill="#e8e9ea" />

        {/* para-choque */}
        <rect x="826" y="172" width="62" height="16" rx="4" fill="#3a3d42" />
        {/* faróis */}
        <rect x="830" y="150" width="16" height="12" rx="2" fill="#f6d87a" />

        {/* tanque de combustível */}
        <rect x="700" y="176" width="70" height="34" rx="17" fill="#c7c9cc" />

        {/* degrau/escada */}
        <rect x="792" y="170" width="30" height="8" rx="2" fill="#9aa0a6" />

        {/* eixos do cavalo (direção + tandem tração) */}
        <g fill="#1c1e22">
          <circle cx="662" cy="238" r="30" />
          <circle cx="850" cy="238" r="32" />
        </g>
        <g fill="#4a4d52">
          <circle cx="662" cy="238" r="13" />
          <circle cx="850" cy="238" r="14" />
        </g>
      </g>
    </svg>
  )
})
