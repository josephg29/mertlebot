<script>
  import { onMount } from 'svelte';
  import { ParticlePool } from './particlePool.js';
  import { drawTool, getRandomToolType } from './heroTools.js';

  let canvas;
  let ctx;
  let particlePool;
  let animationId;
  let frameCount = 0;
  let shouldReduce = false;

  onMount(() => {
    // Check for prefers-reduced-motion
    shouldReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldReduce) return;

    canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    const canvasContainer = document.querySelector('.hero-background-container');
    if (canvasContainer) {
      canvasContainer.appendChild(canvas);
    }

    ctx = canvas.getContext('2d', { alpha: true });
    particlePool = new ParticlePool(30);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  });

  function resizeCanvas() {
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set display size (css pixels)
    const dpr = window.devicePixelRatio || 1;
    canvas.width *= dpr;
    canvas.height *= dpr;
    ctx.scale(dpr, dpr);
  }

  function animate() {
    if (shouldReduce || !canvas) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    // Spawn tools from clouds
    if (frameCount % 8 === 0) {
      const tool = getRandomToolType();
      const cloudY = h * 0.25;
      const cloudWidth = 180;
      const cloudLeft = (frameCount / 480) * (w + cloudWidth);
      const cloudX = (cloudLeft % (w + cloudWidth)) - cloudWidth;
      const spawnX = cloudX + 40 + Math.random() * (cloudWidth - 80);

      particlePool.acquire(tool, spawnX, cloudY);
    }

    particlePool.update();

    // Draw all active particles
    particlePool.getActive().forEach((particle) => {
      drawTool(ctx, particle);
    });

    frameCount++;
    animationId = requestAnimationFrame(animate);
  }
</script>

<div class="hero-background-container">
  <div class="hero-clouds">
    <!-- Single cloud layer moving left to right -->
    <svg
      class="cloud-svg cloud-1"
      viewBox="0 0 160 80"
      width="160"
      height="80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Pixelated cloud shape using 8px blocks -->
      <rect x="32" y="32" width="8" height="8" fill="white" />
      <rect x="40" y="24" width="8" height="8" fill="white" />
      <rect x="48" y="16" width="8" height="8" fill="white" />
      <rect x="56" y="16" width="8" height="8" fill="white" />
      <rect x="64" y="24" width="8" height="8" fill="white" />
      <rect x="72" y="32" width="8" height="8" fill="white" />
      <rect x="80" y="32" width="8" height="8" fill="white" />
      <rect x="88" y="32" width="8" height="8" fill="white" />
      <rect x="40" y="32" width="8" height="8" fill="white" />
      <rect x="48" y="32" width="8" height="8" fill="white" />
      <rect x="56" y="32" width="8" height="8" fill="white" />
      <rect x="64" y="32" width="8" height="8" fill="white" />
      <rect x="32" y="40" width="8" height="8" fill="white" />
      <rect x="40" y="40" width="8" height="8" fill="white" />
      <rect x="48" y="40" width="8" height="8" fill="white" />
      <rect x="56" y="40" width="8" height="8" fill="white" />
      <rect x="64" y="40" width="8" height="8" fill="white" />
      <rect x="72" y="40" width="8" height="8" fill="white" />
      <rect x="80" y="40" width="8" height="8" fill="white" />
      <rect x="88" y="40" width="8" height="8" fill="white" />
      <rect x="96" y="32" width="8" height="8" fill="white" />
      <rect x="104" y="32" width="8" height="8" fill="white" />
    </svg>
  </div>
</div>

<style>
  .hero-background-container {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
  }

  .hero-clouds {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .cloud-svg {
    position: absolute;
    top: 15%;
    left: 0;
    width: 180px;
    height: 90px;
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
    animation: cloud-drift 40s linear infinite;
  }

  :global(.hero-canvas) {
    position: absolute;
    inset: 0;
    display: block;
  }

  @keyframes cloud-drift {
    0% {
      transform: translateX(-200px);
      opacity: 0;
    }
    5% {
      opacity: 1;
    }
    95% {
      opacity: 1;
    }
    100% {
      transform: translateX(calc(100vw + 200px));
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cloud-svg {
      animation: none;
      opacity: 0.3;
    }

    :global(.hero-canvas) {
      display: none;
    }
  }
</style>
