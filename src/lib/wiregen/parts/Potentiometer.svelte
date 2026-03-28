<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
  export let value = 50;
  $: angle = -135 + (value / 100) * 270;
  $: rad = (angle * Math.PI) / 180;
  $: wiperX = 20 + Math.cos(rad) * 10;
  $: wiperY = 18 - Math.sin(rad) * 10;
</script>

<g transform="translate({x},{y})">
  <rect x="2" y="2" width="36" height="36" rx="5" fill="#1a3a5c" stroke="#0d2840" stroke-width="1.5"/>
  <path d="M 9,30 A 13,13 0 1,1 31,30" fill="none" stroke="#888" stroke-width="3" stroke-linecap="round"/>
  <line x1="20" y1="18" x2={wiperX} y2={wiperY} stroke="#ffcc00" stroke-width="2" stroke-linecap="round"/>
  <circle cx="20" cy="18" r="5" fill="#333" stroke="#555" stroke-width="1"/>
  <circle cx="20" cy="18" r="2" fill="#555"/>
  <circle cx="20" cy="18" r="9" fill="none" stroke="#444" stroke-width="1"/>
  {#each [8,20,32] as px}
    <line x1={px} y1="38" x2={px} y2="46" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
    <circle cx={px} cy="46" r="2" fill="#888"/>
  {/each}
  <text x="8" y="52" font-size="5.5" fill="#cc4444" text-anchor="middle" font-family="monospace">L</text>
  <text x="20" y="52" font-size="5.5" fill="#ffcc00" text-anchor="middle" font-family="monospace">W</text>
  <text x="32" y="52" font-size="5.5" fill="#4444cc" text-anchor="middle" font-family="monospace">R</text>
  {#if label}<text x="20" y="60" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
