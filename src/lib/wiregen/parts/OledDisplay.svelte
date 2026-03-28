<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width="60" height="44" rx="3" fill="#111188" stroke="#0000aa" stroke-width="1.5"/>
  <rect x="4" y="4" width="52" height="32" rx="2" fill="#000011" stroke="#333" stroke-width="1"/>
  <rect x="8" y="10" width="2" height="8" fill="#00ccff" opacity="0.9"/>
  <rect x="11" y="10" width="2" height="8" fill="#00ccff" opacity="0.9"/>
  <rect x="8" y="14" width="5" height="2" fill="#00ccff" opacity="0.9"/>
  <rect x="16" y="10" width="2" height="8" fill="#00ccff" opacity="0.9"/>
  <rect x="20" y="10" width="5" height="2" fill="#00ccff" opacity="0.9"/>
  <rect x="20" y="10" width="2" height="8" fill="#00ccff" opacity="0.9"/>
  <rect x="20" y="17" width="5" height="2" fill="#00ccff" opacity="0.9"/>
  <rect x="27" y="10" width="5" height="2" fill="#00ccff" opacity="0.9"/>
  <rect x="27" y="10" width="2" height="8" fill="#00ccff" opacity="0.9"/>
  <rect x="27" y="17" width="5" height="2" fill="#00ccff" opacity="0.9"/>
  <rect x="8" y="22" width="4" height="6" rx="1" fill="#00ffaa" opacity="0.7"/>
  <rect x="14" y="22" width="4" height="6" rx="1" fill="#00ffaa" opacity="0.7"/>
  <rect x="20" y="22" width="4" height="6" rx="1" fill="#00ffaa" opacity="0.7"/>
  <rect x="26" y="22" width="2" height="6" rx="1" fill="#00ffaa" opacity="0.7"/>
  <rect x="30" y="22" width="4" height="6" rx="1" fill="#00ffaa" opacity="0.7"/>
  <rect x="24" y="38" width="12" height="4" rx="1" fill="#222"/>
  <text x="30" y="42" font-size="3.5" fill="#666" text-anchor="middle" font-family="monospace">SSD1306</text>
  {#each [10,22,38,50] as px}
    <line x1={px} y1="44" x2={px} y2="50" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
    <circle cx={px} cy="50" r="2" fill="#888"/>
  {/each}
  <text x="10" y="57" font-size="5" fill="#aaa" text-anchor="middle" font-family="monospace">GND</text>
  <text x="22" y="57" font-size="5" fill="#cc4444" text-anchor="middle" font-family="monospace">VCC</text>
  <text x="38" y="57" font-size="5" fill="#44cc44" text-anchor="middle" font-family="monospace">SCL</text>
  <text x="50" y="57" font-size="5" fill="#4488ff" text-anchor="middle" font-family="monospace">SDA</text>
  {#if label}<text x="30" y="64" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
