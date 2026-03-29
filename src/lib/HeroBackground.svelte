<script>
  import { onMount } from 'svelte';

  let canvas;
  let animationId;

  onMount(() => {
    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ─────────────────────── STATE ───────────────────────
    const cloud = {
      x: -110,
      speed: 0.6,
      width: 96,
      height: 40,
    };

    let particles = [];
    let frameCount = 0;
    const MAX_PARTICLES = 20;
    const CLOUD_Y = 0.18; // proportion of viewport height

    // ─────────────────────── DRAWING ───────────────────────

    function drawCloud(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      // Wide base
      ctx.fillRect(x, y + 16, 96, 24);
      // Left bump
      ctx.fillRect(x + 16, y + 8, 24, 16);
      // Center-high bump
      ctx.fillRect(x + 48, y, 24, 16);
      // Right bump
      ctx.fillRect(x + 64, y + 8, 16, 16);
    }

    function drawHammer(ctx, x, y, rotation, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;

      // Head
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(-12, -8, 24, 10);

      // Handle
      ctx.fillStyle = '#546E7A';
      ctx.fillRect(-3, 2, 6, 22);

      ctx.restore();
    }

    function drawGear(ctx, x, y, rotation, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;

      const teeth = 8;
      const outerR = 10;
      const innerR = 5;

      // Draw teeth
      ctx.fillStyle = '#78909C';
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const x = Math.cos(angle) * outerR - 2;
        const y = Math.sin(angle) * outerR - 3;
        ctx.save();
        ctx.translate(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillRect(-2, -3, 4, 6);
        ctx.restore();
      }

      // Center hub
      ctx.fillStyle = '#37474F';
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fill();

      // Outline
      ctx.strokeStyle = '#90A4AE';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, outerR + 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    function drawBolt(ctx, x, y, rotation, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = '#90A4AE';

      // Head (hexagon approximation - just a wider rect)
      ctx.fillRect(-8, -12, 16, 8);

      // Body shaft
      ctx.fillRect(-3, -4, 6, 20);

      // Thread lines
      ctx.strokeStyle = '#546E7A';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const ty = -2 + i * 4;
        ctx.beginPath();
        ctx.moveTo(-6, ty);
        ctx.lineTo(6, ty);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawTool(ctx, particle) {
      if (particle.type === 'hammer') {
        drawHammer(ctx, particle.x, particle.y, particle.rotation, particle.alpha);
      } else if (particle.type === 'gear') {
        drawGear(ctx, particle.x, particle.y, particle.rotation, particle.alpha);
      } else if (particle.type === 'bolt') {
        drawBolt(ctx, particle.x, particle.y, particle.rotation, particle.alpha);
      }
    }

    // ─────────────────────── LOGIC ───────────────────────

    function spawnTool() {
      if (particles.length >= MAX_PARTICLES) return;

      const types = ['hammer', 'gear', 'bolt'];
      const type = types[Math.floor(Math.random() * types.length)];
      const cloudYPx = canvas.height * CLOUD_Y;

      particles.push({
        type,
        x: cloud.x + 10 + Math.random() * (cloud.width - 20),
        y: cloudYPx + cloud.height + 4,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.07,
        alpha: 1,
        age: 0,
      });
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics
        p.vy += 0.12;
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;
        p.age++;

        // Fade in bottom 30%
        const fadeStart = canvas.height * 0.7;
        if (p.y > fadeStart) {
          p.alpha = Math.max(0, 1 - (p.y - fadeStart) / (canvas.height * 0.3));
        }

        // Remove if off-screen
        if (p.y > canvas.height + 40) {
          particles.splice(i, 1);
        }
      }
    }

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function animate() {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Update cloud position
      cloud.x += cloud.speed;
      if (cloud.x > w + 20) {
        cloud.x = -cloud.width - 20;
      }

      // Draw cloud
      const cloudY = Math.round(h * CLOUD_Y);
      drawCloud(ctx, cloud.x, cloudY, cloud.width, cloud.height);

      // Spawn tools
      if (frameCount % 10 === 0) {
        spawnTool();
      }

      // Update and draw particles
      updateParticles();
      particles.forEach((p) => {
        drawTool(ctx, p);
      });

      frameCount++;
      animationId = requestAnimationFrame(animate);
    }

    // Setup
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) cancelAnimationFrame(animationId);
    };
  });
</script>

<canvas bind:this={canvas} class="hero-bg-canvas" aria-hidden="true" />

<style>
  .hero-bg-canvas {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    display: block;
  }
</style>
