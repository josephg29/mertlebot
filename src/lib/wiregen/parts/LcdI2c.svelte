<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
  const chars = Array.from({ length: 16 });
  const text1 = 'Hello, Arduino! ';
  const text2 = 'Temp: 24.5 C    ';
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width="130" height="54" rx="3" fill="#226622" stroke="#114411" stroke-width="1.5"/>
  <rect x="4" y="4" width="122" height="40" rx="2" fill="#aaddaa" stroke="#88aa88" stroke-width="1"/>
  <rect x="6" y="6" width="118" height="36" rx="1" fill="#99cc99"/>
  {#each chars as _, i}
    <rect x={8+i*7} y="8" width="6" height="15" rx="0.5" fill="#77aa77"/>
    {#if text1[i] !== ' '}
      <rect x={9+i*7} y="9" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="12" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="15" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="9" width="2" height="8" fill="#224422" opacity="0.8"/>
    {/if}
  {/each}
  {#each chars as _, i}
    <rect x={8+i*7} y="26" width="6" height="15" rx="0.5" fill="#77aa77"/>
    {#if text2[i] !== ' '}
      <rect x={9+i*7} y="27" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="30" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="33" width="4" height="2" fill="#224422" opacity="0.8"/>
      <rect x={9+i*7} y="27" width="2" height="8" fill="#224422" opacity="0.8"/>
    {/if}
  {/each}
  <rect x="4" y="44" width="60" height="10" rx="2" fill="#1a3a1a" stroke="#0d200d" stroke-width="1"/>
  <text x="34" y="51" font-size="5" fill="#66aa66" text-anchor="middle" font-family="monospace">I2C Backpack</text>
  <rect x="68" y="44" width="20" height="9" rx="1" fill="#111"/>
  <text x="78" y="51" font-size="4" fill="#666" text-anchor="middle" font-family="monospace">PCF8574</text>
  <rect x="94" y="45" width="5" height="5" rx="1" fill="#333"/>
  <rect x="101" y="45" width="5" height="5" rx="1" fill="#333"/>
  <rect x="108" y="45" width="5" height="5" rx="1" fill="#444"/>
  {#each [14,28,42,56] as px}
    <line x1={px} y1="54" x2={px} y2="60" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
    <circle cx={px} cy="60" r="2" fill="#888"/>
  {/each}
  <text x="14" y="67" font-size="5" fill="#aaa" text-anchor="middle" font-family="monospace">GND</text>
  <text x="28" y="67" font-size="5" fill="#cc4444" text-anchor="middle" font-family="monospace">VCC</text>
  <text x="42" y="67" font-size="5" fill="#4488ff" text-anchor="middle" font-family="monospace">SDA</text>
  <text x="56" y="67" font-size="5" fill="#44cc44" text-anchor="middle" font-family="monospace">SCL</text>
  {#if label}<text x="65" y="74" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
