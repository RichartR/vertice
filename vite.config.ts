import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ExcelJS se carga dinámicamente (solo al exportar) y pesa ~930 kB minificado.
    // El bundle principal está en ~450 kB, bien por debajo del límite por defecto.
    chunkSizeWarningLimit: 1000,
  },
})
