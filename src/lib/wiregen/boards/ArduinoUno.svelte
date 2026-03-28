<script>
  export let x = 0;
  export let y = 0;
  const W = 240, H = 185;
  const TOP_PINS = ['AREF','GND','~13','12','~11','~10','~9','8',null,'7','~6','~5','4','~3','2','TX','RX'];
  const BOT_PINS = ['IOREF','RST','3.3V','5V','GND','GND','Vin',null,'A0','A1','A2','A3','A4','A5'];

  function topX(i) {
    const gap = i > 8 ? 12 : 0;
    const base = TOP_PINS.slice(0, i).filter(p => p !== null).length;
    return 22 + base * 10 + gap;
  }
  function botX(i) {
    const gap = i > 7 ? 12 : 0;
    const base = BOT_PINS.slice(0, i).filter(p => p !== null).length;
    return 22 + base * 10 + gap;
  }
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width={W} height={H} rx="6" fill="#1a3a5c" stroke="#0d2840" stroke-width="2"/>
  <rect x="2" y="2" width={W-4} height={H-4} rx="5" fill="none" stroke="#1e4570" stroke-width="1" opacity="0.6"/>
  <rect x="90" y="68" width="78" height="62" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
  <text x="129" y="96" font-size="6.5" fill="#888" text-anchor="middle" font-family="monospace">ATMEGA</text>
  <text x="129" y="106" font-size="6.5" fill="#888" text-anchor="middle" font-family="monospace">328P</text>
  {#each [0,1,2,3,4,5] as i}
    <rect x="87" y={73+i*9} width="3" height="5" fill="#444"/>
    <rect x="168" y={73+i*9} width="3" height="5" fill="#444"/>
  {/each}
  <rect x="0" y="152" width="18" height="24" rx="2" fill="#888" stroke="#666" stroke-width="1"/>
  <rect x="3" y="155" width="12" height="18" rx="1" fill="#555"/>
  <rect x="5" y="158" width="8" height="12" rx="1" fill="#222"/>
  <rect x="0" y="4" width="14" height="22" rx="3" fill="#333" stroke="#555" stroke-width="1"/>
  <circle cx="7" cy="15" r="4" fill="#111"/><circle cx="7" cy="15" r="2" fill="#888"/>
  <rect x="36" y="2" width="14" height="12" rx="2" fill="#c00" stroke="#900" stroke-width="1"/>
  <circle cx="43" cy="8" r="3" fill="#ff2222"/>
  <rect x="52" y="62" width="20" height="10" rx="2" fill="#c8a840" stroke="#a08020" stroke-width="1"/>
  <circle cx="28" cy="8" r="2.5" fill="#00ff44" opacity="0.9"/>
  <circle cx="22" cy="8" r="2.5" fill="#ffaa00" opacity="0.9"/>
  <circle cx="16" cy="8" r="2.5" fill="#ff6600" opacity="0.9"/>
  <rect x="17" y="0" width="172" height="8" rx="1" fill="#444"/>
  {#each TOP_PINS as label, i}
    {#if label !== null}
      {@const px = topX(i)}
      <rect x={px-3} y="-7" width="6" height="7" fill="#888"/>
      <rect x={px-2} y="-10" width="4" height="4" fill="#555"/>
      <circle cx={px} cy="-10" r="1.5" fill="#bbb"/>
      <text x={px} y="-14" font-size="5.5" fill="#7bafd4" text-anchor="start" font-family="monospace" transform="rotate(-60,{px},-14)">{label}</text>
    {/if}
  {/each}
  <rect x="17" y={H-8} width="145" height="8" rx="1" fill="#444"/>
  {#each BOT_PINS as label, i}
    {#if label !== null}
      {@const px = botX(i)}
      <rect x={px-3} y={H} width="6" height="7" fill="#888"/>
      <rect x={px-2} y={H+7} width="4" height="4" fill="#555"/>
      <circle cx={px} cy={H+10} r="1.5" fill="#bbb"/>
      <text x={px} y={H+24} font-size="5.5" fill="#7bafd4" text-anchor="end" font-family="monospace" transform="rotate(60,{px},{H+24})">{label}</text>
    {/if}
  {/each}
  <text x={W/2} y={H/2+36} font-size="11" fill="#2a6499" text-anchor="middle" font-family="sans-serif" font-weight="bold" opacity="0.7">ARDUINO UNO R3</text>
  <rect x={W-30} y="40" width="18" height="12" rx="1" fill="#333"/>
  {#each [0,1,2] as col}{#each [0,1] as row}
    <circle cx={W-27+col*6} cy={44+row*6} r="1.5" fill="#888"/>
  {/each}{/each}
</g>
