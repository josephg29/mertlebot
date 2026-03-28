<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width="34" height="48" rx="3" fill="#1a4a8a" stroke="#0d2d5e" stroke-width="1.5"/>
  <rect x="2" y="2" width="30" height="44" rx="2" fill="none" stroke="#2060aa" stroke-width="1" opacity="0.5"/>
  {#each [0,1,2,3] as row}{#each [0,1,2,3] as col}
    <rect x={6+col*6} y={6+row*6} width="4" height="4" rx="1" fill="#2a6acc" opacity="0.6"/>
  {/each}{/each}
  <text x="17" y="38" font-size="6" fill="#88aaff" text-anchor="middle" font-family="monospace">DHT22</text>
  <text x="17" y="46" font-size="5" fill="#5577cc" text-anchor="middle" font-family="monospace">AM2302</text>
  {#each [7,16,25,33] as px}
    <rect x={px-2} y="48" width="4" height="12" fill="#aaa"/><circle cx={px} cy="60" r="2" fill="#888"/>
  {/each}
  <text x="7" y="68" font-size="5" fill="#8af" text-anchor="middle" font-family="monospace">VCC</text>
  <text x="16" y="68" font-size="5" fill="#8af" text-anchor="middle" font-family="monospace">DAT</text>
  <text x="25" y="68" font-size="5" fill="#555" text-anchor="middle" font-family="monospace">NC</text>
  <text x="33" y="68" font-size="5" fill="#8af" text-anchor="middle" font-family="monospace">GND</text>
  {#if label}<text x="17" y="76" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
