/**
 * Slots para assets cinematográficos opcionais (ex.: gerados no Higgsfield).
 *
 * Enquanto estiverem vazios, o site usa as FOTOS REAIS da frota — que é o
 * padrão e continua funcionando sozinho. Ao colocar um arquivo em
 * `public/media/` e apontar o caminho aqui, o componente correspondente troca
 * automaticamente. Veja HIGGSFIELD.md na raiz do projeto para os prompts.
 */

/** Loop de vídeo atrás do hero. Ex.: '/media/hero-loop.mp4' */
export const HERO_VIDEO = '/media/hero-loop.mp4'

/** Poster exibido enquanto o vídeo carrega — cai na foto real se vazio. */
export const HERO_VIDEO_POSTER = ''
