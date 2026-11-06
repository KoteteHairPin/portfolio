import { defineConfig } from 'vite'

export default defineConfig({
  define: { __PAGES_SHOWCASE__: JSON.stringify(process.env.CF_PAGES === '1') },
  esbuild: { jsx: 'automatic' },
})
