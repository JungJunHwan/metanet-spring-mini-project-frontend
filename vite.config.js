import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // shadcn/ui 컴포넌트가 프로젝트 루트에 위치 (components/, lib/)
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // ★ 기존 Proxy 설정 유지 ★
    proxy: {
      '/bike': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
