import { useCallback, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { navegar } from '@/lib/router'

type LinkProps = { href: string; children: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>

/**
 * Âncora que navega pelo roteador interno em vez de recarregar a página.
 * Continua sendo um <a> de verdade: o endereço aparece na barra de status,
 * "abrir em nova aba" funciona e o Google consegue seguir o link.
 */
export function Link({ href, children, onClick, ...props }: LinkProps) {
  const handle = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      // Respeita ctrl/cmd-clique, botão do meio e target="_blank".
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        props.target === '_blank'
      ) {
        return
      }
      if (/^[a-z]+:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return

      e.preventDefault()
      navegar(href)
    },
    [href, onClick, props.target],
  )

  return (
    <a href={href} onClick={handle} {...props}>
      {children}
    </a>
  )
}
