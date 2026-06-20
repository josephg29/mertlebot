// Standalone Vite build for the static GitHub Pages showcase. Uses the bare
// svelte plugin (no SvelteKit) so it produces a fully static site that mounts
// the real WiringCanvas component client-side — no server, no API key.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default {
  root,
  // Served from https://<user>.github.io/mertlebot/
  base: '/mertlebot/',
  plugins: [svelte()],
  build: {
    outDir: fileURLToPath(new URL('../build-pages', import.meta.url)),
    emptyOutDir: true,
  },
};
