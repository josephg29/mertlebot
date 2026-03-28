<script>
  export let x = 0;
  export let y = 0;
  const W = 360, H = 190;
  const TOP_L = ['D0','D1','~D2','~D3','D4','~D5','~D6','D7','D8','~D9','~D10','~D11','D12','~D13','GND','AREF','SDA','SCL'];
  const TOP_R = ['D22','D23','D24','D25','D26','D27'];
  const BOT_P = ['IOREF','RST','3.3V','5V','GND','GND','Vin'];
  const BOT_A = ['A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14','A15'];
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width={W} height={H} rx="6" fill="#1a3a5c" stroke="#0d2840" stroke-width="2"/>
  <rect x="2" y="2" width={W-4} height={H-4} rx="5" fill="none" stroke="#1e4570" stroke-width="1" opacity="0.6"/>
  <rect x="130" y="65" width="80" height="68" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
  <text x="170" y="96" font-size="6" fill="#888" text-anchor="middle" font-family="monospace">ATMEGA</text>
  <text x="170" y="106" font-size="6" fill="#888" text-anchor="middle" font-family="monospace">2560</text>
  {#each [0,1,2,3,4,5,6] as i}<rect x="127" y={70+i*8} width="3" height="5" fill="#444"/><rect x="210" y={70+i*8} width="3" height="5" fill="#444"/>{/each}
  <rect x="0" y="154" width="18" height="26" rx="2" fill="#888" stroke="#666" stroke-width="1"/>
  <rect x="3" y="157" width="12" height="20" rx="1" fill="#555"/><rect x="5" y="160" width="8" height="14" rx="1" fill="#222"/>
  <rect x="0" y="4" width="14" height="22" rx="3" fill="#333" stroke="#555" stroke-width="1"/>
  <circle cx="7" cy="15" r="4" fill="#111"/><circle cx="7" cy="15" r="2" fill="#888"/>
  <rect x="36" y="2" width="14" height="12" rx="2" fill="#c00" stroke="#900" stroke-width="1"/>
  <circle cx="43" cy="8" r="3" fill="#ff2222"/>
  <circle cx="28" cy="8" r="2.5" fill="#00ff44" opacity="0.9"/>
  <circle cx="22" cy="8" r="2.5" fill="#ffaa00" opacity="0.9"/>
  <circle cx="16" cy="8" r="2.5" fill="#ff6600" opacity="0.9"/>
  <rect x="60" y="66" width="36" height="28" rx="2" fill="#111" stroke="#333" stroke-width="1"/>
  <text x="78" y="84" font-size="5.5" fill="#777" text-anchor="middle" font-family="monospace">16U2</text>
  <rect x="17" y="0" width="150" height="8" rx="1" fill="#444"/>
  {#each TOP_L as label, i}{@const px = 22+i*8}
    <rect x={px-3} y="-7" width="6" height="7" fill="#888"/><circle cx={px} cy="-10" r="1.5" fill="#bbb"/>
    <text x={px} y="-14" font-size="5" fill="#7bafd4" text-anchor="start" font-family="monospace" transform="rotate(-60,{px},-14)">{label}</text>
  {/each}
  <rect x="180" y="0" width="54" height="8" rx="1" fill="#444"/>
  {#each TOP_R as label, i}{@const px = 186+i*8}
    <rect x={px-3} y="-7" width="6" height="7" fill="#888"/><circle cx={px} cy="-10" r="1.5" fill="#bbb"/>
    <text x={px} y="-14" font-size="5" fill="#7bafd4" text-anchor="start" font-family="monospace" transform="rotate(-60,{px},-14)">{label}</text>
  {/each}
  <rect x="17" y={H-8} width="62" height="8" rx="1" fill="#444"/>
  {#each BOT_P as label, i}{@const px = 22+i*8}
    <rect x={px-3} y={H} width="6" height="7" fill="#888"/><circle cx={px} cy={H+10} r="1.5" fill="#bbb"/>
    <text x={px} y={H+24} font-size="5" fill="#7bafd4" text-anchor="end" font-family="monospace" transform="rotate(60,{px},{H+24})">{label}</text>
  {/each}
  <rect x="93" y={H-8} width="134" height="8" rx="1" fill="#444"/>
  {#each BOT_A as label, i}{@const px = 98+i*8}
    <rect x={px-3} y={H} width="6" height="7" fill="#888"/><circle cx={px} cy={H+10} r="1.5" fill="#bbb"/>
    <text x={px} y={H+24} font-size="5" fill="#7bafd4" text-anchor="end" font-family="monospace" transform="rotate(60,{px},{H+24})">{label}</text>
  {/each}
  <text x={W/2} y={H/2+42} font-size="10" fill="#2a6499" text-anchor="middle" font-family="sans-serif" font-weight="bold" opacity="0.7">ARDUINO MEGA 2560</text>
</g>
