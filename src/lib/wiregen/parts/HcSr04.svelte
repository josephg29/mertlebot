<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="8" width="80" height="42" rx="3" fill="#226622" stroke="#114411" stroke-width="1.5"/>
  <rect x="2" y="10" width="76" height="38" rx="2" fill="none" stroke="#338833" stroke-width="1" opacity="0.5"/>
  <circle cx="18" cy="29" r="14" fill="#333" stroke="#555" stroke-width="1.5"/>
  <circle cx="18" cy="29" r="10" fill="#222"/><circle cx="18" cy="29" r="6" fill="#444"/><circle cx="18" cy="29" r="3" fill="#555"/>
  <circle cx="14" cy="25" r="2" fill="#666" opacity="0.6"/>
  <circle cx="62" cy="29" r="14" fill="#333" stroke="#555" stroke-width="1.5"/>
  <circle cx="62" cy="29" r="10" fill="#222"/><circle cx="62" cy="29" r="6" fill="#444"/><circle cx="62" cy="29" r="3" fill="#555"/>
  <circle cx="58" cy="25" r="2" fill="#666" opacity="0.6"/>
  <text x="40" y="22" font-size="5.5" fill="#88cc88" text-anchor="middle" font-family="monospace">HC-SR04</text>
  {#each [12,28,52,68] as px}
    <rect x={px-2} y="0" width="4" height="8" fill="#aaa"/><circle cx={px} cy="0" r="2" fill="#888"/>
  {/each}
  <text x="12" y="-5" font-size="5" fill="#88cc88" text-anchor="middle" font-family="monospace">VCC</text>
  <text x="28" y="-5" font-size="5" fill="#88cc88" text-anchor="middle" font-family="monospace">TRIG</text>
  <text x="52" y="-5" font-size="5" fill="#88cc88" text-anchor="middle" font-family="monospace">ECHO</text>
  <text x="68" y="-5" font-size="5" fill="#88cc88" text-anchor="middle" font-family="monospace">GND</text>
  {#if label}<text x="40" y="58" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
