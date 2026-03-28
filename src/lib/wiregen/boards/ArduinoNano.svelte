<script>
  export let x = 0;
  export let y = 0;
  const W = 80, H = 260;
  const LEFT = ['D13','D12','~D11','~D10','~D9','D8','D7','~D6','~D5','D4','~D3','D2','GND','RST'];
  const RIGHT = ['TX','RX','RST','GND','5V','A7','A6','A5','A4','A3','A2','A1','A0','AREF','3.3V','Vin'];
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width={W} height={H} rx="5" fill="#1a3a5c" stroke="#0d2840" stroke-width="2"/>
  <rect x="2" y="2" width={W-4} height={H-4} rx="4" fill="none" stroke="#1e4570" stroke-width="1" opacity="0.6"/>
  <rect x="25" y="0" width="30" height="14" rx="2" fill="#888" stroke="#666" stroke-width="1"/>
  <rect x="28" y="2" width="24" height="10" rx="1" fill="#555"/><rect x="31" y="4" width="18" height="6" rx="1" fill="#222"/>
  <rect x="16" y="100" width="48" height="60" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
  <text x="40" y="127" font-size="5.5" fill="#888" text-anchor="middle" font-family="monospace">ATMEGA</text>
  <text x="40" y="137" font-size="5.5" fill="#888" text-anchor="middle" font-family="monospace">328P</text>
  {#each [0,1,2,3,4,5] as i}<rect x="13" y={106+i*8} width="3" height="5" fill="#444"/><rect x="64" y={106+i*8} width="3" height="5" fill="#444"/>{/each}
  <rect x="28" y="78" width="24" height="10" rx="2" fill="#c8a840" stroke="#a08020" stroke-width="1"/>
  <circle cx="10" cy="22" r="2" fill="#00ff44" opacity="0.9"/><circle cx="10" cy="30" r="2" fill="#ffaa00" opacity="0.9"/>
  <rect x="0" y="25" width="8" height={LEFT.length*12+4} rx="1" fill="#444"/>
  {#each LEFT as label, i}{@const py = 30+i*12}
    <rect x="-7" y={py-3} width="7" height="6" fill="#888"/><circle cx="-10" cy={py} r="1.5" fill="#bbb"/>
    <text x="-14" y={py+2} font-size="5" fill="#7bafd4" text-anchor="end" font-family="monospace">{label}</text>
  {/each}
  <rect x={W-8} y="25" width="8" height={RIGHT.length*12+4} rx="1" fill="#444"/>
  {#each RIGHT as label, i}{@const py = 30+i*12}
    <rect x={W} y={py-3} width="7" height="6" fill="#888"/><circle cx={W+10} cy={py} r="1.5" fill="#bbb"/>
    <text x={W+14} y={py+2} font-size="5" fill="#7bafd4" text-anchor="start" font-family="monospace">{label}</text>
  {/each}
  <text x={W/2} y={H-18} font-size="7" fill="#2a6499" text-anchor="middle" font-family="sans-serif" font-weight="bold" opacity="0.7">NANO</text>
</g>
