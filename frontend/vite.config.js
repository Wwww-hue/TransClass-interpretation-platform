import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  // 添加这个 SPA 回退配置
  server: {
    historyApiFallback: true
  }
})