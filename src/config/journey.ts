export type Chapter = {
  id: string
  marker: string
  title: string
  body: string
  bullets?: string[]
  align: 'left' | 'right'
  /** gradiente de céu do trecho — do amanhecer ao pôr do sol da chegada */
  skyFrom: string
  skyTo: string
  cta?: { label: string; href: string }
}

export const chapters: Chapter[] = [
  {
    id: 'saida',
    marker: 'KM 000 · Saída',
    title: 'Prontos para colocar sua carga em movimento.',
    body: 'A viagem começa na nossa base, às margens do Rodoanel em Carapicuíba. Da coleta ao romaneio, tudo é conferido antes de a roda girar.',
    align: 'left',
    skyFrom: '#14243b',
    skyTo: '#5b7fa6',
  },
  {
    id: 'logistica',
    marker: 'KM 120 · Logística',
    title: 'Coleta, armazena, distribui.',
    body: 'Cargas fechadas e fracionadas na mesma operação, com espaço de estoque e cross docking quando a sua necessidade pede.',
    bullets: ['Transporte de cargas', 'Distribuição', 'Coletas e entregas', 'Cross docking'],
    align: 'right',
    skyFrom: '#1b3350',
    skyTo: '#7fa3c4',
  },
  {
    id: 'confiabilidade',
    marker: 'KM 340 · Confiabilidade',
    title: 'Segurança, pontualidade e compromisso em cada operação.',
    body: 'Carga segurada pela AXA, veículos pela Seguradora Alfa e matriz pela Porto Seguro. Motoristas aprovados no perfil das principais gerenciadoras de risco.',
    align: 'left',
    skyFrom: '#2b3348',
    skyTo: '#a8906f',
  },
  {
    id: 'tecnologia',
    marker: 'KM 610 · Tecnologia',
    title: 'Você acompanha. Nós dirigimos.',
    body: 'Rastreamento por satélite do embarque à entrega, integrado ao nosso TMS para prevenção de perdas na interface armazém-transporte.',
    bullets: ['Rastreamento via satélite', 'Gestão integrada (TMS)', 'Monitoramento 24h'],
    align: 'right',
    skyFrom: '#0d1424',
    skyTo: '#2f3f63',
  },
  {
    id: 'destino',
    marker: 'KM 870 · Destino',
    title: 'Sua carga chegou ao destino.',
    body: 'É assim em cada entrega. Conte o que você precisa transportar e devolvemos uma proposta feita para a sua operação.',
    align: 'left',
    skyFrom: '#5e2a16',
    skyTo: '#e9a24c',
    cta: { label: 'Solicitar orçamento', href: '#orcamento' },
  },
]
