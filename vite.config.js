import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 4444
  },
  preview: {
    port: 4444
  },
  ssr: {
    external: ['better-sqlite3']
  },
  test: {
    include: ['src/tests/**/*.test.{js,ts}'],
    environment: 'node',
    globals: false,
  }
});
