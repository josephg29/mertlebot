<script>
  export let x = 0;
  export let y = 0;
  export let value = '220Ω';
  export let label = '';
  const PRESETS = {
    '220': ['red','red','brown','gold'], '470': ['yellow','purple','brown','gold'],
    '1k': ['brown','black','red','gold'], '10k': ['brown','black','orange','gold'],
    '100k': ['brown','black','yellow','gold'],
  };
  $: bands = PRESETS[value.replace(/[Ωk]/g, '').replace('k','000')] ?? PRESETS['220'];
</script>

<g transform="translate({x},{y})">
  <line x1="0" y1="10" x2="16" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <line x1="64" y1="10" x2="80" y2="10" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <rect x="16" y="3" width="48" height="14" rx="4" fill="#d4b483" stroke="#b8933a" stroke-width="1"/>
  <rect x="24" y="3" width="5" height="14" fill={bands[0]} opacity="0.9"/>
  <rect x="32" y="3" width="5" height="14" fill={bands[1]} opacity="0.9"/>
  <rect x="40" y="3" width="5" height="14" fill={bands[2]} opacity="0.9"/>
  <rect x="52" y="3" width="4" height="14" fill={bands[3]} opacity="0.85"/>
  <text x="40" y="-3" font-size="7" fill="#bbb" text-anchor="middle" font-family="monospace">{value}</text>
  {#if label}<text x="40" y="24" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
