import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [
      react(),
      VitePWA({ 
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        devOptions: {
          enabled: true // Enable PWA in dev mode for testing
        },
        manifest: {
          name: 'ColorSplash',
          short_name: 'ColorSplash',
          description: 'A magical color-by-numbers game for kids.',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/72x72/1f58c.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'https://cdn.jsdelivr.net/npm/twemoji@11.3.0/2/72x72/1f58c.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY)
    },
    server: {
      host: '0.0.0.0', // Listen on all network addresses
      port: 3000,      // Fixed port
      strictPort: false
    }
  }
})