import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

import path from 'path'

// Plugin para injetar variáveis de ambiente no index.html (SEO, OG, etc.)
function htmlInjectEnv(mode: string) {
  return {
    name: 'html-inject-env',
    transformIndexHtml(html: string) {
      const env = loadEnv(mode, process.cwd(), '')
      const appUrl = env.VITE_APP_URL || 'https://rateio.ckao.in'
      const siteName = 'Rateio Justo'
      const title = 'Sentou, sorriu — o Rateio Justo dividiu.'
      const description = 'Cada um paga o seu. Nunca mais abra a calculadora na mesa.'
      const ogImage = `${appUrl.replace(/\/$/, '')}/og-image.jpg`

      return html
        .replace(/\{\{APP_URL\}\}/g, appUrl)
        .replace(/\{\{OG_IMAGE\}\}/g, ogImage)
        .replace(/\{\{SITE_NAME\}\}/g, siteName)
        .replace(/\{\{META_TITLE\}\}/g, title)
        .replace(/\{\{META_DESCRIPTION\}\}/g, description)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    htmlInjectEnv(mode),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg', 'og-image.jpg'],
      manifest: {
        name: 'Rateio Justo',
        short_name: 'Rateio',
        description: 'Divida contas sem tretas.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
