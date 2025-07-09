import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // /api ile başlayan tüm istekleri Netlify'daki canlı sitenize yönlendirir
      '/api': {
        target: 'https://pandaflicks.netlify.app', // KENDİ NETLIFY SİTE ADRESİNİZ
        changeOrigin: true,
      },
    },
  },
});