// Standalone Vite config (no SvelteKit) so we can mount a single component
// for screenshotting. Used only by scripts/capture-diagram.mjs.
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [svelte()],
  server: { port: 5199, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
};
