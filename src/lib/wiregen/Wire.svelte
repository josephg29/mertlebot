<script>
  export let wire;
  export let dimmed = false;
  export let highlighted = false;

  const COLOR_HEX = {
    red: '#ef4444', black: '#374151', yellow: '#eab308', orange: '#f97316',
    blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', white: '#f8fafc', gray: '#9ca3af',
  };

  $: points = wire.path.map(([x, y]) => `${x},${y}`).join(' ');
  $: hex = COLOR_HEX[wire.color] ?? '#888';
  $: midIdx = Math.floor(wire.path.length / 2);
  $: labelPos = wire.path[midIdx];
  $: groupOpacity = dimmed ? 0.15 : 1;
</script>

<g opacity={groupOpacity} style="transition: opacity 0.3s ease">
  <polyline {points} stroke="#000" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.25"/>
  {#if highlighted}
    <polyline {points} stroke={hex} stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
      <animate attributeName="opacity" values="0.15;0.4;0.15" dur="1.5s" repeatCount="indefinite"/>
    </polyline>
  {/if}
  <polyline {points} stroke={hex} stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline {points} stroke="white" stroke-width="0.8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.15"/>
  <circle cx={wire.path[0][0]} cy={wire.path[0][1]} r="3" fill={hex} stroke="#000" stroke-width="0.8"/>
  <circle cx={wire.path[wire.path.length - 1][0]} cy={wire.path[wire.path.length - 1][1]} r="3" fill={hex} stroke="#000" stroke-width="0.8"/>
  {#if wire.label}
    <text x={labelPos[0]} y={labelPos[1] - 5} font-size="7" fill={hex} text-anchor="middle" font-family="monospace" opacity="0.85">{wire.label}</text>
  {/if}
</g>
