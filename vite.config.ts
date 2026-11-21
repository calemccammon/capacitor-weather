import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // Relative paths, so the built site works from any folder: the root of a
  // web server, a GitHub Pages project, or inside the Capacitor app.
  base: './',
  plugins: [
    vue({
      template: {
        // Material Web's components are custom elements, not Vue components.
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('md-') },
      },
    }),
    vueDevTools(),
  ],
  build: {
    // The map library alone is about 1 MB before it is compressed.
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
