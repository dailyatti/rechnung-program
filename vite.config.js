import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['html2pdf.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
