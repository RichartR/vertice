// Banner de instalación para iOS Safari — se muestra la primera vez que el usuario
// visita la app desde Safari en iOS (donde no hay prompt nativo de instalación PWA).
// Se cierra con el botón X y no vuelve a aparecer (persiste en localStorage).
import { useState } from 'react'

const STORAGE_KEY = 'ios-install-banner-dismissed'

function isIosSafari(): boolean {
  const ua = globalThis.navigator?.userAgent ?? ''
  const isIos = /iphone|ipad|ipod/i.test(ua)
  // En Safari el UA contiene "Safari" pero no "CriOS" ni "FxiOS" (Chrome/Firefox para iOS)
  const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua)
  // Si ya está instalada como PWA, no mostrar el banner
  const isStandalone = ('standalone' in globalThis.navigator) &&
    (globalThis.navigator as Navigator & { standalone?: boolean }).standalone === true
  return isIos && isSafari && !isStandalone
}

export default function IosBanner() {
  const [visible, setVisible] = useState(() => {
    if (!isIosSafari()) return false
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })

  if (!visible) return null

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded-2xl border border-accent-dark/30 bg-white px-4 py-3 shadow-lg">
      <div className="flex-1 text-sm text-gray-700">
        Para instalar la app: pulsa el botón{' '}
        <span className="font-medium">Compartir</span>{' '}
        <span aria-hidden>⬆</span> → <span className="font-medium">Añadir a pantalla de inicio</span>
      </div>
      <button
        onClick={handleClose}
        aria-label="Cerrar"
        className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
