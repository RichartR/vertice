import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vértice',
        short_name: 'Vértice',
        description: 'Gestión de sesiones y facturación',
        theme_color: '#b9d9ce',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    // ExcelJS se carga dinámicamente (solo al exportar) y pesa ~930 kB minificado.
    // El bundle principal está en ~450 kB, bien por debajo del límite por defecto.
    chunkSizeWarningLimit: 1000,
  },
})
