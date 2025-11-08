// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // Para pacotes Electron, precisamos de caminhos relativos em produção
  // Use ELECTRON=true no build do Electron para base './'
  base: process.env.ELECTRON === 'true' ? './' : '/',
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'https://app-atommo-990926851328.us-central1.run.app',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'https://app-atommo-990926851328.us-central1.run.app',
        changeOrigin: true,
        secure: false,
      },
      '/metrics': {
        target: 'https://app-atommo-990926851328.us-central1.run.app',
        changeOrigin: true,
        secure: false,
      },
      // Proxy para Glances (http://localhost:61208) evitando CORS
      '/glances': {
        target: 'http://localhost:61208',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/glances/, ''),
      },
    },
  },
})
