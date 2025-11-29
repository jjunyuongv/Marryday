import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // 프록시 제거 - 직접 백엔드 서버로 호출
        // proxy: {
        //     '/api': {
        //         target: 'http://marryday.kro.kr',
        //         changeOrigin: true
        //     },
        //     '/images': {
        //         target: 'http://marryday.kro.kr',
        //         changeOrigin: true
        //     }
        // }
    }
})

