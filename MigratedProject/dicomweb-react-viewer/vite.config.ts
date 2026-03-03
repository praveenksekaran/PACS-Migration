import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { chunkFor } from './src/lib/buildChunks'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // dicom-image-loader and tools both use new Worker(new URL('./worker.js', import.meta.url))
    // which breaks when Vite re-locates the bundle to .vite/deps/ — serve them raw.
    // @cornerstonejs/core has no such pattern and is safe to pre-bundle; esbuild will
    // handle its CJS transitive deps (vtk.js → globalthis, fast-deep-equal, etc.).
    exclude: [
      '@cornerstonejs/dicom-image-loader',
      '@cornerstonejs/tools',
    ],
    // All CJS packages imported (directly or via vtk.js) by the two excluded packages.
    // Explicitly including them forces esbuild to pre-bundle + CJS→ESM convert them
    // so the browser always gets a proper default export.
    include: [
      // Codec Emscripten modules (dicom-image-loader → codec packages)
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-openjph/wasmjs',
      // Direct CJS deps of excluded packages
      'lodash.get',
      'dicom-parser',
      // CJS deps pulled in transitively via vtk.js sub-paths (used by @cornerstonejs/tools)
      'globalthis',
      'fast-deep-equal',
      'seedrandom',
      'spark-md5',
      'utif',
      'xmlbuilder2',
    ],
  },
  // worker is a top-level Vite config key (NOT inside build).
  // ES module workers are compatible with Rollup code-splitting (manualChunks).
  // Default 'iife' format conflicts when manualChunks is set.
  worker: {
    format: 'es',
  },
  build: {
    outDir: '../dicomweb-viewer/public',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: chunkFor,
      },
    },
  },
  server: {
    proxy: {
      '/rs': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/wadouri': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Exclude Playwright E2E specs from Vitest discovery
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
