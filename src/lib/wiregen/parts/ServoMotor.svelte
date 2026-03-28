<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
  export let angle = 90;
  $: hornRad = ((angle - 90) * Math.PI) / 180;
  $: hornX = 62 + Math.cos(hornRad) * 14;
  $: hornY = 22 - Math.sin(hornRad) * 14;
</script>

<g transform="translate({x},{y})">
  <rect x="10" y="4" width="56" height="50" rx="4" fill="#1155aa" stroke="#0a3a77" stroke-width="1.5"/>
  <rect x="12" y="6" width="52" height="46" rx="3" fill="none" stroke="#2266cc" stroke-width="1" opacity="0.5"/>
  <rect x="50" y="8" width="18" height="40" rx="3" fill="#0a3a77" stroke="#061e3d" stroke-width="1"/>
  <circle cx="60" cy="22" r="10" fill="#222" stroke="#444" stroke-width="1.5"/>
  <circle cx="60" cy="22" r="6" fill="#333"/><circle cx="60" cy="22" r="3" fill="#555"/>
  <line x1="60" y1="22" x2={hornX} y2={hornY} stroke="#888" stroke-width="3" stroke-linecap="round"/>
  <circle cx={hornX} cy={hornY} r="3" fill="#aaa"/>
  <rect x="0" y="16" width="12" height="24" rx="2" fill="#1155aa" stroke="#0a3a77" stroke-width="1"/>
  <rect x="68" y="16" width="12" height="24" rx="2" fill="#1155aa" stroke="#0a3a77" stroke-width="1"/>
  <circle cx="6" cy="28" r="3" fill="#0a3a77"/><circle cx="74" cy="28" r="3" fill="#0a3a77"/>
  <rect x="2" y="24" width="10" height="24" rx="1" fill="#333" stroke="#555" stroke-width="1"/>
  <rect x="4" y="27" width="6" height="6" rx="1" fill="#555"/>
  <rect x="4" y="34" width="6" height="6" rx="1" fill="#cc2222"/>
  <rect x="4" y="41" width="6" height="6" rx="1" fill="#ffaa00"/>
  <line x1="0" y1="30" x2="4" y2="30" stroke="#333" stroke-width="2"/>
  <line x1="0" y1="37" x2="4" y2="37" stroke="#cc2222" stroke-width="2"/>
  <line x1="0" y1="44" x2="4" y2="44" stroke="#ffaa00" stroke-width="2"/>
  <circle cx="0" cy="30" r="2" fill="#888"/><circle cx="0" cy="37" r="2" fill="#888"/><circle cx="0" cy="44" r="2" fill="#888"/>
  <text x="-4" y="32" font-size="5" fill="#aaa" text-anchor="end" font-family="monospace">GND</text>
  <text x="-4" y="39" font-size="5" fill="#cc4444" text-anchor="end" font-family="monospace">5V</text>
  <text x="-4" y="46" font-size="5" fill="#ffaa00" text-anchor="end" font-family="monospace">SIG</text>
  <text x="32" y="38" font-size="6" fill="#88aaff" text-anchor="middle" font-family="monospace">SERVO</text>
  {#if label}<text x="35" y="62" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
