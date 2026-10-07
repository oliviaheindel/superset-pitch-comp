import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` → dist/ for Vercel.
// `npm run build:single` → one self-contained HTML per page (VITE_PAGE=site|deck), for a shareable preview with no backend.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    chunkSizeWarningLimit: 4000,
    outDir: mode === 'single' ? `dist-single/${process.env.VITE_PAGE || 'site'}` : 'dist',
    ...(mode === 'single' ? { assetsInlineLimit: 100000000 } : {}),
  },
}));
