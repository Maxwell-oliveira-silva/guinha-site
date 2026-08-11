/**
 * Integração do formulário de orçamento.
 *
 * Por padrão o formulário monta uma mensagem e abre o WhatsApp da empresa —
 * funciona sem backend nenhum. Quando houver um endpoint (Formspree, n8n, API
 * própria, etc.), basta preencher QUOTE_ENDPOINT e trocar QUOTE_MODE para
 * 'endpoint' ou 'both'.
 */

export type QuoteMode = 'whatsapp' | 'endpoint' | 'both'

export const QUOTE_MODE: QuoteMode = 'whatsapp'

/** Ex.: 'https://formspree.io/f/xxxxxxx' — deixe vazio enquanto não existir. */
export const QUOTE_ENDPOINT = ''

/** Para onde os e-mails de orçamento devem ir, se um backend for plugado. */
export const QUOTE_RECIPIENT = 'logistica@guinhatransportes.com.br'
