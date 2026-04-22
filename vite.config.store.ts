import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_STORE_BUILD': JSON.stringify('true'),
  },
  plugins: [
    {
      name: 'store-manifest',
      closeBundle() {
        copyFileSync(
          resolve(__dirname, 'public/manifest.store.json'),
          resolve(__dirname, 'dist/manifest.json'),
        );
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
