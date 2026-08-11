import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink, defaultWhatsAppMessage } from '@/lib/whatsapp'

export function WhatsAppButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      href={buildWhatsAppLink(defaultWhatsAppMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className={`group fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] py-3.5 pl-3.5 pr-3.5 text-white shadow-[0_10px_35px_-10px_rgba(37,211,102,0.7)] transition-all duration-500 hover:pr-6 focus-visible:outline-2 focus-visible:outline-offset-4 sm:bottom-8 sm:right-8 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={2.2} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-500 group-hover:max-w-xs">
        Falar no WhatsApp
      </span>
      <span className="absolute inset-0 -z-10 rounded-full bg-[#25D366] animate-ping opacity-20" />
    </a>
  )
}
