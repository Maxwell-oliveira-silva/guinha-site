import { useEffect, useState } from 'react'

/**
 * Roteador mínimo.
 *
 * O site nasceu como página única com navegação por âncora, e continua
 * assim: "/" renderiza exatamente o que renderizava antes. O rastreamento
 * precisou de rotas de verdade (/rastrear é um endereço que o cliente
 * recebe por WhatsApp e digita), mas isso não justificava trazer uma
 * biblioteca de rotas inteira para três telas.
 *
 * São ~60 linhas: History API, um listener e um <Link>. Se um dia o site
 * crescer para dezenas de rotas, trocar por react-router é substituir
 * este arquivo — nada mais depende dele além de App.tsx e do Header.
 */

const EVENTO = 'guinha:navegacao'

function normalizar(caminho: string) {
  const semBarra = caminho.replace(/\/+$/, '')
  return semBarra === '' ? '/' : semBarra
}

export function navegar(destino: string, opcoes?: { substituir?: boolean }) {
  const [caminho, hash] = destino.split('#')
  const atual = normalizar(window.location.pathname)
  const alvo = normalizar(caminho || atual)

  if (alvo !== atual) {
    const metodo = opcoes?.substituir ? 'replaceState' : 'pushState'
    window.history[metodo]({}, '', destino)
    window.dispatchEvent(new Event(EVENTO))
    if (hash) {
      // Espera a nova rota pintar antes de procurar a âncora.
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    return
  }

  if (hash) {
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    window.history.replaceState({}, '', destino)
  }
}

export function useRota() {
  const [rota, setRota] = useState(() => normalizar(window.location.pathname))

  useEffect(() => {
    const sincronizar = () => setRota(normalizar(window.location.pathname))
    window.addEventListener('popstate', sincronizar)
    window.addEventListener(EVENTO, sincronizar)
    return () => {
      window.removeEventListener('popstate', sincronizar)
      window.removeEventListener(EVENTO, sincronizar)
    }
  }, [])

  return rota
}
