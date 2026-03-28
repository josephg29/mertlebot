<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
  export let pressed = false;
</script>

<g transform="translate({x},{y})">
  <line x1="0" y1="0" x2="12" y2="12" stroke="#aaa" stroke-width="1.5"/>
  <line x1="40" y1="0" x2="28" y2="12" stroke="#aaa" stroke-width="1.5"/>
  <line x1="0" y1="40" x2="12" y2="28" stroke="#aaa" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="28" y2="28" stroke="#aaa" stroke-width="1.5"/>
  <rect x="10" y="10" width="20" height="20" rx="2" fill="#2a3a2a" stroke="#444" stroke-width="1"/>
  <line x1="10" y1="13" x2="30" y2="13" stroke="#555" stroke-width="1"/>
  <line x1="10" y1="27" x2="30" y2="27" stroke="#555" stroke-width="1"/>
  <circle cx="20" cy="20" r="7" fill={pressed ? '#ff4444' : '#888'} stroke="#555" stroke-width="1"/>
  <circle cx="20" cy="20" r="4" fill={pressed ? '#cc2222' : '#aaa'}/>
  {#each [[0,0],[40,0],[0,40],[40,40]] as [px,py]}
    <circle cx={px} cy={py} r="2.5" fill="#888" stroke="#555" stroke-width="1"/>
  {/each}
  {#if label}<text x="20" y="48" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
