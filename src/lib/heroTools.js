const TOOL_COLORS = {
  primary: '#FFD54F',
  rust: '#FF7043',
  grass: '#4CAF50',
  metal: '#546E7A',
  light: '#90A4AE',
};

const TOOL_TYPES = ['hammer', 'gear', 'robot', 'wrench'];

export function getRandomToolType() {
  return TOOL_TYPES[Math.floor(Math.random() * TOOL_TYPES.length)];
}

export function drawTool(ctx, particle) {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.scale(particle.scale, particle.scale);
  ctx.globalAlpha = particle.alpha;

  switch (particle.type) {
    case 'hammer':
      drawHammer(ctx);
      break;
    case 'gear':
      drawGear(ctx);
      break;
    case 'robot':
      drawRobot(ctx);
      break;
    case 'wrench':
      drawWrench(ctx);
      break;
  }

  ctx.restore();
}

function drawHammer(ctx) {
  // Head
  ctx.fillStyle = TOOL_COLORS.rust;
  ctx.fillRect(-6, -10, 12, 8);

  // Handle
  ctx.fillStyle = TOOL_COLORS.metal;
  ctx.fillRect(-2, -2, 4, 12);

  // Detail
  ctx.strokeStyle = TOOL_COLORS.light;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-6, -10, 12, 8);
}

function drawGear(ctx) {
  const teeth = 8;
  const outerRadius = 8;
  const innerRadius = 4;

  ctx.fillStyle = TOOL_COLORS.metal;

  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius * 1.3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();

  // Center hole
  ctx.fillStyle = TOOL_COLORS.rust;
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = TOOL_COLORS.light;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawRobot(ctx) {
  // Head
  ctx.fillStyle = TOOL_COLORS.primary;
  ctx.fillRect(-8, -10, 16, 14);

  // Eyes
  ctx.fillStyle = TOOL_COLORS.rust;
  ctx.fillRect(-5, -6, 3, 3);
  ctx.fillRect(2, -6, 3, 3);

  // Antenna
  ctx.strokeStyle = TOOL_COLORS.metal;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -11);
  ctx.lineTo(-2, -14);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(2, -11);
  ctx.lineTo(2, -14);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = TOOL_COLORS.rust;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.stroke();

  // Border
  ctx.strokeStyle = TOOL_COLORS.light;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-8, -10, 16, 14);
}

function drawWrench(ctx) {
  // Handle
  ctx.strokeStyle = TOOL_COLORS.metal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(4, -8);
  ctx.stroke();

  // Head circle
  ctx.fillStyle = TOOL_COLORS.rust;
  ctx.beginPath();
  ctx.arc(6, -6, 5, 0, Math.PI * 2);
  ctx.fill();

  // Opening
  ctx.fillStyle = TOOL_COLORS.metal;
  ctx.beginPath();
  ctx.arc(6, -6, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = TOOL_COLORS.light;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(6, -6, 5, 0, Math.PI * 2);
  ctx.stroke();
}
