import { WHATSAPP_NUMBER } from '@/config/site'

export function buildWhatsAppLink(message: string) {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`
}

export const defaultWhatsAppMessage =
  'Olá! Vim pelo site da Guinha Transportes e gostaria de solicitar um orçamento.'
