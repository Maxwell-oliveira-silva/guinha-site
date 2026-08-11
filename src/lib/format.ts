/**
 * Formatação de data/hora no fuso da operação (São Paulo), não no fuso do
 * navegador — um cliente consultando de fora do país precisa ver o mesmo
 * horário que o Arnaldo lançou.
 */

const FUSO = 'America/Sao_Paulo'

const dataCurta = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const horaCurta = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
})

const diaMes = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
})

/** '2026-08-12' (date puro do Postgres) → '12/08/2026', sem escorregar um dia. */
export function formatarData(valor: string | null | undefined): string {
  if (!valor) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-')
    return `${dia}/${mes}/${ano}`
  }
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? '—' : dataCurta.format(d)
}

/** timestamptz → '10/08/2026 às 18:30' */
export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'
  return `${dataCurta.format(d)} às ${horaCurta.format(d)}`
}

/** timestamptz → { dia: '10/08', hora: '18:30' } para a timeline */
export function partesDataHora(valor: string): { dia: string; hora: string } {
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return { dia: '—', hora: '' }
  return { dia: diaMes.format(d), hora: horaCurta.format(d) }
}

/** 'há 2 horas', 'há 3 dias' — usado no painel para dar noção de frescor. */
export function tempoRelativo(valor: string | null | undefined): string {
  if (!valor) return '—'
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return '—'

  const segundos = Math.round((Date.now() - d.getTime()) / 1000)
  if (segundos < 60) return 'agora há pouco'
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias < 30) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  return formatarData(valor)
}

/** Valor para <input type="datetime-local"> no fuso da operação. */
export function agoraParaInput(): string {
  const agora = new Date()
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(agora)
  return partes.replace(' ', 'T')
}
