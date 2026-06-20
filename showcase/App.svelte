<script>
  import WiringCanvas from '../src/lib/wiregen/WiringCanvas.svelte';
  import { samples } from './samples.js';

  let selected = 0;
  const repo = 'https://github.com/josephg29/mertlebot';
</script>

<main>
  <header>
    <div class="brand">
      <span class="logo">⚙</span>
      <span>MERTLE.BOT</span>
    </div>
    <h1>A verification engine for AI-generated circuits</h1>
    <p class="lede">
      Mertle turns a plain-English electronics idea into parts, Arduino code, and a wiring
      diagram — then <strong>geometrically validates and repairs</strong> that diagram before you
      see it. Below is the real, custom SVG wiring engine running entirely in your browser.
    </p>
    <div class="links">
      <a class="btn primary" href={repo}>View source on GitHub</a>
      <a class="btn" href={`${repo}/blob/main/PORTFOLIO.md`}>Portfolio notes</a>
    </div>
  </header>

  <section class="demo">
    <div class="tabs">
      {#each samples as sample, i}
        <button class:active={i === selected} on:click={() => (selected = i)}>{sample.name}</button>
      {/each}
    </div>
    <div class="canvas-wrap">
      {#key selected}
        <WiringCanvas diagram={samples[selected].diagram} />
      {/key}
    </div>
    <p class="blurb">{samples[selected].blurb}</p>
  </section>

  <footer>
    <p>
      This is a static showcase of the client-side rendering engine. The full generation pipeline
      (Claude + the validation/repair loop) runs on the live app, which needs a server and an
      Anthropic API key. <a href={repo}>See the README</a> to run it.
    </p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0f1117;
    color: #e6edf3;
    font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  main { max-width: 960px; margin: 0 auto; padding: 48px 20px 64px; }
  .brand { display: flex; align-items: center; gap: 8px; color: #eab308; font-weight: 700; letter-spacing: 2px; }
  .logo { font-size: 20px; }
  h1 { font-size: clamp(26px, 4vw, 40px); line-height: 1.15; margin: 18px 0 12px; }
  .lede { color: #9fb0bf; font-size: 16px; line-height: 1.6; max-width: 70ch; }
  .lede strong { color: #e6edf3; }
  .links { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
  .btn {
    display: inline-block; padding: 10px 16px; border-radius: 8px; text-decoration: none;
    color: #e6edf3; border: 1px solid #2e3c44; font-size: 14px;
  }
  .btn.primary { background: #22c55e; color: #06210f; border-color: #22c55e; font-weight: 700; }
  .demo { margin-top: 40px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .tabs button {
    padding: 8px 14px; border-radius: 8px; border: 1px solid #2e3c44; background: #161b22;
    color: #9fb0bf; cursor: pointer; font: inherit; font-size: 14px;
  }
  .tabs button.active { color: #eab308; border-color: #eab308; }
  .canvas-wrap {
    border: 1px solid #2e3c44; border-radius: 12px; overflow: hidden; background: #0d1117;
  }
  .blurb { color: #9fb0bf; font-size: 14px; margin-top: 12px; }
  footer { margin-top: 48px; color: #6b7a86; font-size: 13px; line-height: 1.6; }
  a { color: #58a6ff; }
</style>
