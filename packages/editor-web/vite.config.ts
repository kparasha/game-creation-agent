import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Resolve the workspace packages to their TS source so Vite treats them as part of the app graph
// (transpiled + HMR), instead of expecting pre-built dist. Mirrors tsconfig paths.
const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@forge/core': src('../core/src/index.ts'),
      '@forge/genre-wave-survival': src('../genre-wave-survival/src/index.ts'),
      '@forge/adapter-web-canvas': src('../adapter-web-canvas/src/index.ts'),
      '@forge/providers': src('../providers/src/index.ts'),
    },
  },
});
