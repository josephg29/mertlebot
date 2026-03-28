<script>
  export let x = 0;
  export let y = 0;
  const W = 100, H = 300;
  const LEFT = ['EN','VP','VN','34','35','32','33','25','26','27','14','12','GND','13','D9','D10','D11','Vin'];
  const RIGHT = ['3.3V','GND','15','2','4','16','17','5','18','19','21/SDA','RX0','TX0','22/SCL','23','GND'];
</script>

<g transform="translate({x},{y})">
  <rect x="0" y="0" width={W} height={H} rx="5" fill="#2d1b00" stroke="#1a0f00" stroke-width="2"/>
  <rect x="2" y="2" width={W-4} height={H-4} rx="4" fill="none" stroke="#3d2a00" stroke-width="1" opacity="0.7"/>
  <rect x="15" y="0" width="70" height="30" rx="3" fill="#3d2a00"/>
  <path d="M 50,4 L 70,4 L 70,14 L 30,14 L 30,22 L 70,22 L 70,28" fill="none" stroke="#c8a840" stroke-width="2" stroke-linecap="round"/>
  <rect x="33" y="28" width="34" height="14" rx="2" fill="#888" stroke="#666" stroke-width="1"/>
  <rect x="36" y="30" width="28" height="10" rx="1" fill="#555"/><rect x="39" y="32" width="22" height="6" rx="1" fill="#222"/>
  <rect x="18" y="100" width="64" height="64" rx="3" fill="#111" stroke="#333" stroke-width="1"/>
  <rect x="22" y="104" width="56" height="56" rx="2" fill="#1a1a1a"/>
  <text x="50" y="128" font-size="6" fill="#888" text-anchor="middle" font-family="monospace">ESP32</text>
  <text x="50" y="140" font-size="5" fill="#666" text-anchor="middle" font-family="monospace">WROOM-32</text>
  {#each [0,1,2,3] as col}{#each [0,1,2,3] as row}<circle cx={26+col*14} cy={108+row*14} r="1" fill="#444"/>{/each}{/each}
  <rect x="72" y="185" width="18" height="12" rx="2" fill="#c00" stroke="#900" stroke-width="1"/>
  <text x="81" y="194" font-size="5" fill="#ff8888" text-anchor="middle">EN</text>
  <rect x="10" y="185" width="18" height="12" rx="2" fill="#333" stroke="#555" stroke-width="1"/>
  <text x="19" y="194" font-size="5" fill="#aaa" text-anchor="middle">BOOT</text>
  <circle cx="50" cy="202" r="3" fill="#00bbff" opacity="0.8"/>
  <rect x="0" y="25" width="8" height={LEFT.length*12+8} rx="1" fill="#555"/>
  {#each LEFT as label, i}{@const py = 30+i*12}
    <rect x="-7" y={py-3} width="7" height="6" fill="#888"/><circle cx="-10" cy={py} r="1.5" fill="#bbb"/>
    <text x="-14" y={py+2} font-size="5" fill="#d4a76a" text-anchor="end" font-family="monospace">{label}</text>
  {/each}
  <rect x={W-8} y="25" width="8" height={RIGHT.length*12+8} rx="1" fill="#555"/>
  {#each RIGHT as label, i}{@const py = 30+i*12}
    <rect x={W} y={py-3} width="7" height="6" fill="#888"/><circle cx={W+10} cy={py} r="1.5" fill="#bbb"/>
    <text x={W+14} y={py+2} font-size="5" fill="#d4a76a" text-anchor="start" font-family="monospace">{label}</text>
  {/each}
  <text x={W/2} y={H-14} font-size="7" fill="#8a6030" text-anchor="middle" font-family="sans-serif" font-weight="bold" opacity="0.9">ESP32 DevKit V1</text>
</g>
