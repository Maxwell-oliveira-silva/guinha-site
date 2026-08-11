// Dados reais extraídos do material institucional (folder/brochura) da Guinha Transportes.
// Campos claramente editáveis estão sinalizados — não invente dados que não estejam aqui.

export const WHATSAPP_NUMBER = '5511996928882' // Cel (11) 99692-8882 — formato internacional p/ wa.me

export const site = {
  name: 'Guinha Transportes',
  legalName: 'Guinha Transporte e Logística - Eireli',
  tagline: 'Transporte e Logística',
  yearsInMarket: 20, // "há mais de 20 anos" — brochura
  phones: ['(11) 4188-6588', '(11) 4187-1325', '(11) 4188-6638'],
  whatsappDisplay: '(11) 99692-8882',
  emails: ['guinhatransportes@globo.com', 'logistica@guinhatransportes.com.br'],
  addresses: [
    {
      label: 'Matriz — Carapicuíba/SP',
      lines: [
        'Estrada Copaíba, 591 — Jardim Cecília Cristina',
        'CEP 06329-050 — Carapicuíba/SP',
        'Às margens do Rodoanel (saída Carapicuíba)',
      ],
    },
    {
      label: 'Filial — Ilhota/SC',
      lines: [
        'Rua Modesto Vargas, 98 — Centro',
        'CEP 83200-000 — Ilhota/SC',
        'Às margens da BR-101',
      ],
    },
  ],
  // Empresa parceira/coligada, presente na mesma identidade visual
  partner: {
    name: 'Transjovina',
    legalName: 'Transjovina Transporte e Mudança Ltda.',
  },
  social: {
    instagram: '', // placeholder — preencher quando disponível
    facebook: '',
    linkedin: '',
  },
} as const

export const mission = 'Ser uma empresa respeitada e admirada pelos parceiros e clientes, através de excelência.'

export const vision =
  'Utilizar produtos e serviços integrados de nossos clientes, assim como desenvolvedores inteligentes e sob medida, sempre buscando eficiência e otimização de custos.'

export const values = [
  'Ética',
  'Busca constante pela perfeição',
  'Respeito aos clientes, parceiros e colaboradores',
  'Inovação constante, soluções diferenciadas',
  'Proatividade e excelência na execução',
  'Responsabilidade socioambiental',
]

export const fleet = [
  'Carretas LS',
  'Bi-Truck',
  'Truck',
  'Toco',
  'Caminhão 3/4',
  'Caminhão 3/4 refrigerado',
  'Caminhonetes Iveco e Máster',
]

export const services = [
  {
    icon: 'truck',
    title: 'Transporte de cargas',
    description:
      'Cargas fechadas e fracionadas, com frota diversificada — de caminhonetes a carretas LS — todos os veículos baús.',
  },
  {
    icon: 'route',
    title: 'Distribuição e entregas',
    description: 'Coletas e entregas em todo o território nacional, com estratégia dedicada por cliente.',
  },
  {
    icon: 'warehouse',
    title: 'Estoque e Cross Docking',
    description: 'Espaço para armazenagem e cross docking sempre que a operação do cliente exigir.',
  },
  {
    icon: 'satellite',
    title: 'Rastreamento e monitoramento',
    description: 'Cargas rastreadas via satélite desde a coleta até a entrega no destino final.',
  },
  {
    icon: 'shield-check',
    title: 'Segurança e seguros',
    description: 'Seguro de carga (AXA), seguro da matriz (Porto Seguro) e seguro dos veículos (Seguradora Alfa).',
  },
  {
    icon: 'settings',
    title: 'Soluções logísticas sob medida',
    description: 'Projetos técnicos personalizados, considerando visibilidade operacional e racionalização de custos.',
  },
] as const

export const differentiators = [
  {
    title: 'Mais de 20 anos de mercado',
    description: 'Atuação consolidada em logística e transporte, com dedicação à satisfação contínua dos clientes.',
  },
  {
    title: 'Frota rastreada 100%',
    description: 'Monitoramento via satélite com parceiros Buonny, Villagro, Onix Sat e Sascar.',
  },
  {
    title: 'Certificações sanitárias',
    description: 'Certificados pela VISA Local, CRF/SP e SC, e ANVISA — alimentos, cosméticos, perfumes, higiene pessoal, saúde e saneantes.',
  },
  {
    title: 'Cobertura nacional',
    description: 'Matriz em Carapicuíba/SP (Rodoanel) e filial em Ilhota/SC (BR-101), atendendo todo o território nacional.',
  },
]

export const trackingPartners = ['Buonny', 'Villagro', 'Onix Sat', 'Sascar']

export const insurancePartners = [
  { type: 'Seguro de carga', company: 'AXA' },
  { type: 'Seguro da matriz', company: 'Porto Seguro' },
  { type: 'Seguro dos veículos', company: 'Seguradora Alfa' },
]

// Clientes reais citados no material institucional — usados como prova social.
export const clients = [
  'Descarpack',
  'Cirúrgica KD',
  'Aliança Cirúrgica',
  'Nacional Comercial Hospitalar',
  'Medston',
  'Camp-Lab',
  'Dipromed',
  'Volpi Distribuidora',
]

// href começando com '#' é uma seção da home; começando com '/' é uma rota
// própria. O Header resolve as âncoras para '/#secao' quando o visitante
// está em outra página.
export const navLinks = [
  { label: 'Empresa', href: '#empresa' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Diferenciais', href: '#diferenciais' },
  { label: 'Rastrear carga', href: '/rastrear' },
  { label: 'Contato', href: '#contato' },
  { label: 'Orçamento', href: '#orcamento' },
] as const
