// Tooltip que sigue al cursor. Usa position:fixed para evitar ser recortado
// por contenedores con overflow:hidden (ej: tablas con rounded corners).
import { useState } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

export default function Tooltip({ text, children }: Readonly<TooltipProps>) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <span
      className="block relative"
      onMouseEnter={e => setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div
          style={{ position: 'fixed', left: pos.x + 14, top: pos.y + 14, zIndex: 9999 }}
          className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg whitespace-normal pointer-events-none leading-relaxed"
        >
          {text}
        </div>,
        document.body
      )}
    </span>
  )
}
