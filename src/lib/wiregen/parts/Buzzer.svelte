<script>
  export let x = 0;
  export let y = 0;
  export let label = '';
  const holes = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180;
    return { cx: 18 + Math.cos(rad) * 13, cy: 16 + Math.sin(rad) * 13 };
  });
</script>

<g transform="translate({x},{y})">
  <ellipse cx="18" cy="16" rx="16" ry="16" fill="#111" stroke="#333" stroke-width="1.5"/>
  <ellipse cx="18" cy="16" rx="10" ry="10" fill="#1a1a1a" stroke="#444" stroke-width="1"/>
  <circle cx="18" cy="16" r="4" fill="#333"/><circle cx="18" cy="16" r="2" fill="#555"/>
  {#each holes as h}<circle cx={h.cx} cy={h.cy} r="1.5" fill="#333"/>{/each}
  <text x="10" y="12" font-size="7" fill="#ff4444" text-anchor="middle" font-family="monospace" font-weight="bold">+</text>
  <line x1="10" y1="32" x2="10" y2="40" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <line x1="26" y1="32" x2="26" y2="40" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <circle cx="10" cy="40" r="2" fill="#888"/><circle cx="26" cy="40" r="2" fill="#888"/>
  <text x="10" y="48" font-size="5.5" fill="#ff4444" text-anchor="middle" font-family="monospace">+</text>
  <text x="26" y="48" font-size="5.5" fill="#888" text-anchor="middle" font-family="monospace">−</text>
  {#if label}<text x="18" y="56" font-size="6" fill="#aaa" text-anchor="middle" font-family="sans-serif">{label}</text>{/if}
</g>
