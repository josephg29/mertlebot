<script>
  export let x = 0;
  export let y = 0;
  export let color = 'red';
  export let label = '';
  const COLORS = {
    red: { body: '#ff2222', glow: 'rgba(255,40,40,0.4)' },
    green: { body: '#22ff44', glow: 'rgba(34,255,68,0.4)' },
    yellow: { body: '#ffee00', glow: 'rgba(255,238,0,0.4)' },
    blue: { body: '#4499ff', glow: 'rgba(68,153,255,0.4)' },
    white: { body: '#eeeeff', glow: 'rgba(220,220,255,0.4)' },
  };
  $: c = COLORS[color] ?? COLORS.red;
</script>

<g transform="translate({x},{y})">
  <ellipse cx="12" cy="16" rx="13" ry="13" fill={c.glow}/>
  <ellipse cx="12" cy="16" rx="11" ry="11" fill={c.body} stroke="#333" stroke-width="1"/>
  <ellipse cx="8" cy="12" rx="4" ry="3" fill="white" opacity="0.35"/>
  <rect x="4" y="22" width="16" height="12" fill={c.body} stroke="#333" stroke-width="1"/>
  <line x1="14" y1="22" x2="14" y2="34" stroke="#333" stroke-width="1.5"/>
  <line x1="8" y1="34" x2="8" y2="54" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="34" x2="16" y2="54" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <text x="8" y="52" font-size="5.5" fill="#ccc" text-anchor="middle" font-family="monospace">+</text>
  <text x="16" y="52" font-size="5.5" fill="#888" text-anchor="middle" font-family="monospace">−</text>
  {#if label}<text x="12" y="62" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
