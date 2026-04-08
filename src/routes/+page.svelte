<script>
  import { onMount } from 'svelte';
  import { Zap, Wrench, Monitor, BookOpen, RefreshCw, Palette, GraduationCap, Briefcase, HardHat, Rocket, Play, Gift, BadgeDollarSign } from 'lucide-svelte';

  const features = [
    { icon: Zap, title: 'Instant Wiring Diagrams', desc: 'Turn ideas into professional diagrams in seconds' },
    { icon: Wrench, title: 'Complete Parts Lists', desc: 'Get exact components with specs and buying links' },
    { icon: Monitor, title: 'Ready-to-Flash Code', desc: 'Works with Arduino, ESP32, Raspberry Pi, STM32, Pico & more' },
    { icon: BookOpen, title: 'Step-by-Step Guides', desc: 'Build instructions from beginner to expert' },
    { icon: RefreshCw, title: 'Live Simulation', desc: 'Test circuits in browser before building' },
    { icon: Palette, title: 'Multiple Themes', desc: 'Customize the look with pixel-perfect themes' }
  ];

  const testimonials = [
    { name: 'Alex R.', role: 'Electronics Educator', text: 'My students go from zero to working prototypes in one class. Mertle.bot is revolutionary.', avatar: GraduationCap },
    { name: 'Maya T.', role: 'IoT Startup Founder', text: 'Cut our prototyping time by 70%. The wiring diagrams alone are worth it.', avatar: Briefcase },
    { name: 'Ben K.', role: 'Maker & YouTuber', text: 'Finally, a tool that speaks human AND electronics. My favorite discovery this year.', avatar: HardHat }
  ];

  const stats = [
    { value: 'ALL', label: 'Boards Supported' },
    { value: '99.9%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'Uptime' }
  ];

  let animatedStats = stats.map(() => ({ current: 0, target: 0 }));

  onMount(() => {
    // Animate stats
    stats.forEach((stat, i) => {
      const value = parseFloat(stat.value) || 0;
      animatedStats[i].target = value;

      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        animatedStats[i].current = Math.floor(easeOut * value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      setTimeout(animate, i * 200);
    });
  });
</script>

<div class="landing-page">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">ELECTRONICS MADE EASY</div>
        <h1 class="hero-title">
          Build Electronics Projects
          <span class="hero-highlight">Without the Headache</span>
        </h1>
        <p class="hero-subtitle">
          Describe your idea in plain English. Get complete wiring diagrams, parts lists, and code — instantly.
          From blinking LEDs to complex IoT systems.
        </p>
        <div class="hero-actions">
          <a href="/build" class="hero-btn primary">
            <span class="btn-icon"><Rocket size={16} /></span>
            <span class="btn-text">TRY IT FREE</span>
          </a>
          <a href="#features" class="hero-btn secondary">
            <span class="btn-icon"><Play size={16} /></span>
            <span class="btn-text">SEE HOW IT WORKS</span>
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="visual-header">
            <div class="visual-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="visual-title">Smart Garden System</div>
          </div>
          <div class="visual-content">
            <div class="wire-diagram">
              <div class="component arduino">ARDUINO</div>
              <div class="wire"></div>
              <div class="component sensor">SOIL SENSOR</div>
              <div class="wire"></div>
              <div class="component pump">WATER PUMP</div>
            </div>
            <div class="code-preview">
              <div class="code-line">if (soilMoisture {'<'} 30) {'{'}</div>
              <div class="code-line indent">digitalWrite(pumpPin, HIGH);</div>
              <div class="code-line">{'}'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="stats-section">
    <div class="stats-container">
      {#each stats as stat, i}
        <div class="stat-card">
          <div class="stat-value">
            {#if stat.value.includes('+')}
              {animatedStats[i].current.toLocaleString()}+
            {:else if stat.value.includes('%')}
              {animatedStats[i].current.toFixed(1)}%
            {:else if stat.value.includes('/') || isNaN(parseFloat(stat.value))}
              {stat.value}
            {:else}
              {animatedStats[i].current.toLocaleString()}
            {/if}
          </div>
          <div class="stat-label">{stat.label}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="features-section">
    <div class="section-header">
      <div class="section-badge">WHY MERTLE.BOT</div>
      <h2 class="section-title">Everything You Need to Build</h2>
      <p class="section-subtitle">Stop jumping between tools. Get the complete package.</p>
    </div>

    <div class="features-grid">
      {#each features as feature}
        <div class="feature-card">
          <div class="feature-icon"><svelte:component this={feature.icon} size={40} /></div>
          <h3 class="feature-title">{feature.title}</h3>
          <p class="feature-desc">{feature.desc}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- How It Works -->
  <section class="works-section">
    <div class="section-header">
      <div class="section-badge">HOW IT WORKS</div>
      <h2 class="section-title">From Idea to Working Prototype</h2>
      <p class="section-subtitle">Three simple steps to bring your electronics projects to life</p>
    </div>

    <div class="works-steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3 class="step-title">Describe Your Idea</h3>
          <p class="step-desc">Type what you want to build in plain English. "Temperature-controlled fan", "Motion-sensing light", "Plant watering system".</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3 class="step-title">Get Complete Plans</h3>
          <p class="step-desc">Receive interactive wiring diagrams, exact parts list with buying links, and ready-to-flash code for Arduino/Raspberry Pi.</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3 class="step-title">Build & Test</h3>
          <p class="step-desc">Follow step-by-step instructions. Test your circuit in browser simulation. Build with confidence.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="testimonials-section">
    <div class="section-header">
      <div class="section-badge">LOVED BY MAKERS</div>
      <h2 class="section-title">What Builders Are Saying</h2>
    </div>

    <div class="testimonials-grid">
      {#each testimonials as testimonial}
        <div class="testimonial-card">
          <div class="testimonial-avatar"><svelte:component this={testimonial.avatar} size={48} /></div>
          <div class="testimonial-content">
            <p class="testimonial-text">"{testimonial.text}"</p>
            <div class="testimonial-author">
              <div class="author-name">{testimonial.name}</div>
              <div class="author-role">{testimonial.role}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="cta-container">
      <div class="cta-card">
        <h2 class="cta-title">Ready to Build Something Amazing?</h2>
        <p class="cta-desc">
          Join thousands of makers, educators, and engineers who are bringing their electronics ideas to life with Mertle.bot.
        </p>
        <div class="cta-actions">
          <a href="/build" class="cta-btn primary">
            <span class="btn-icon"><Zap size={16} /></span>
            <span class="btn-text">START BUILDING FREE</span>
          </a>
          <a href="/pricing" class="cta-btn secondary">
            <span class="btn-icon"><BadgeDollarSign size={16} /></span>
            <span class="btn-text">VIEW PLANS</span>
          </a>
        </div>
        <div class="cta-note">
          <span class="note-icon"><Gift size={20} /></span>
          <span class="note-text">No credit card required • Pay only for what you build</span>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .landing-page {
    overflow: hidden;
  }

  /* Hero Section */
  .hero-section {
    padding: 80px 20px;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }

  .hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px),
      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px);
    animation: tile-scroll 20s linear infinite;
    pointer-events: none;
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .hero-badge {
    display: inline-block;
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--primary);
    letter-spacing: 2px;
    padding: 8px 16px;
    background: var(--surface);
    border: 2px solid var(--primary);
    box-shadow: 3px 3px 0 rgba(0,0,0,0.4);
    -webkit-font-smoothing: none;
  }

  .hero-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 32px;
    color: var(--text);
    line-height: 1.3;
    margin: 0;
    -webkit-font-smoothing: none;
  }

  .hero-highlight {
    color: var(--primary);
    display: block;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.6);
  }

  .hero-subtitle {
    font-size: calc(16px * var(--fs, 1));
    color: var(--text-muted);
    line-height: 1.7;
    max-width: 500px;
  }

  .hero-actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .hero-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 28px;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-decoration: none;
    border: 3px solid;
    cursor: pointer;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), box-shadow 0.2s var(--spring),
                background 0.2s, color 0.2s;
    -webkit-font-smoothing: none;
  }

  .hero-btn.primary {
    background: var(--cta);
    border-color: var(--cta-dark);
    color: #fff;
  }

  .hero-btn.primary:hover {
    background: var(--cta-light);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }

  .hero-btn.secondary {
    background: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
  }

  .hero-btn.secondary:hover {
    background: var(--primary);
    color: var(--trunk);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
  }

  .btn-text {
    font-size: 10px;
  }

  .hero-visual {
    display: flex;
    justify-content: center;
  }

  .visual-card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 4px solid var(--border-col);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
    animation: voxel-bob 4s ease-in-out infinite;
  }

  .visual-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--surface2);
    border-bottom: 3px solid var(--border-col);
  }

  .visual-dots {
    display: flex;
    gap: 6px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border: 2px solid;
  }

  .dot.red {
    background: var(--danger);
    border-color: var(--danger-dark);
  }

  .dot.yellow {
    background: var(--primary);
    border-color: var(--primary-dark);
  }

  .dot.green {
    background: var(--cta);
    border-color: var(--cta-dark);
  }

  .visual-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--text);
    -webkit-font-smoothing: none;
  }

  .visual-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .wire-diagram {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
  }

  .component {
    padding: 12px 16px;
    background: var(--surface);
    border: 2px solid var(--border-col);
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--text);
    text-align: center;
    -webkit-font-smoothing: none;
  }

  .component.arduino {
    border-color: var(--primary);
    color: var(--primary);
  }

  .component.sensor {
    border-color: var(--cta);
    color: var(--cta-light);
  }

  .component.pump {
    border-color: var(--link);
    color: var(--link);
  }

  .wire {
    flex: 1;
    height: 4px;
    background: var(--border-col);
    margin: 0 10px;
    position: relative;
  }

  .wire::after {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 8px;
    background: repeating-linear-gradient(
      to right,
      transparent,
      transparent 4px,
      var(--border-col) 4px,
      var(--border-col) 8px
    );
  }

  .code-preview {
    background: var(--code-bg);
    border: 3px solid var(--border-col);
    padding: 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: calc(12px * var(--fs, 1));
    color: var(--text);
  }

  .code-line {
    margin-bottom: 4px;
  }

  .code-line.indent {
    margin-left: 20px;
  }

  /* Stats Section */
  .stats-section {
    padding: 60px 20px;
    background: var(--surface);
  }

  .stats-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 30px;
  }

  .stat-card {
    text-align: center;
    padding: 30px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring);
  }

  .stat-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
  }

  .stat-value {
    font-family: 'Press Start 2P', monospace;
    font-size: 36px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .stat-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    -webkit-font-smoothing: none;
  }

  /* Section Header */
  .section-header {
    text-align: center;
    margin-bottom: 60px;
  }

  .section-badge {
    display: inline-block;
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--primary);
    letter-spacing: 2px;
    padding: 8px 16px;
    background: var(--surface);
    border: 2px solid var(--primary);
    margin-bottom: 20px;
    -webkit-font-smoothing: none;
  }

  .section-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 24px;
    color: var(--text);
    margin-bottom: 16px;
    -webkit-font-smoothing: none;
  }

  .section-subtitle {
    font-size: calc(16px * var(--fs, 1));
    color: var(--text-muted);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Features Section */
  .features-section {
    padding: 100px 20px;
    background: var(--bg);
  }

  .features-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
  }

  .feature-card {
    padding: 30px;
    background: var(--surface);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), border-color 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
  }

  .feature-icon {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    color: var(--primary);
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }

  .feature-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .feature-desc {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
  }

  /* Works Section */
  .works-section {
    padding: 100px 20px;
    background: var(--surface);
  }

  .works-steps {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 24px;
  }

  .step-number {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    border: 4px solid var(--primary-dark);
    color: var(--trunk);
    font-family: 'Press Start 2P', monospace;
    font-size: 24px;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    -webkit-font-smoothing: none;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--text);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .step-desc {
    font-size: calc(15px * var(--fs, 1));
    color: var(--text-muted);
    line-height: 1.7;
  }

  /* Testimonials Section */
  .testimonials-section {
    padding: 100px 20px;
    background: var(--bg);
  }

  .testimonials-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
  }

  .testimonial-card {
    padding: 30px;
    background: var(--surface);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring);
  }

  .testimonial-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
  }

  .testimonial-avatar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    color: var(--primary);
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }

  .testimonial-text {
    font-size: calc(15px * var(--fs, 1));
    color: var(--text);
    line-height: 1.7;
    margin-bottom: 20px;
    font-style: italic;
  }

  .author-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--primary);
    margin-bottom: 4px;
    -webkit-font-smoothing: none;
  }

  .author-role {
    font-size: calc(12px * var(--fs, 1));
    color: var(--text-muted);
  }

  /* CTA Section */
  .cta-section {
    padding: 100px 20px;
    background: var(--surface);
  }

  .cta-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .cta-card {
    padding: 60px;
    background: var(--surface);
    border: 4px solid var(--cta);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
    text-align: center;
  }

  .cta-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 24px;
    color: var(--cta-light);
    margin-bottom: 20px;
    -webkit-font-smoothing: none;
  }

  .cta-desc {
    font-size: calc(16px * var(--fs, 1));
    color: var(--text);
    line-height: 1.7;
    margin-bottom: 40px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .cta-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }

  .cta-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 28px;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-decoration: none;
    border: 3px solid;
    cursor: pointer;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), box-shadow 0.2s var(--spring),
                background 0.2s, color 0.2s;
    -webkit-font-smoothing: none;
  }

  .cta-btn.primary {
    background: var(--cta);
    border-color: var(--cta-dark);
    color: #fff;
  }

  .cta-btn.primary:hover {
    background: var(--cta-light);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }

  .cta-btn.secondary {
    background: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
  }

  .cta-btn.secondary:hover {
    background: var(--primary);
    color: var(--trunk);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }

  .cta-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    background: var(--surface2);
    border: 2px solid var(--primary);
  }

  .note-icon {
    display: inline-flex;
    align-items: center;
    color: var(--primary);
  }

  .note-text {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--primary);
    -webkit-font-smoothing: none;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .hero-container {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .hero-title {
      font-size: 28px;
    }

    .visual-card {
      max-width: 500px;
    }
  }

  @media (max-width: 768px) {
    .hero-section {
      padding: 60px 20px;
    }

    .hero-title {
      font-size: 24px;
    }

    .hero-actions {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-btn {
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }

    .stats-container {
      grid-template-columns: repeat(2, 1fr);
    }

    .features-grid {
      grid-template-columns: 1fr;
    }

    .step {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .testimonials-grid {
      grid-template-columns: 1fr;
    }

    .cta-actions {
      flex-direction: column;
      align-items: center;
    }

    .cta-btn {
      width: 100%;
      max-width: 300px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 20px;
    }

    .hero-subtitle {
      font-size: calc(14px * var(--fs, 1));
    }

    .stats-container {
      grid-template-columns: 1fr;
    }

    .stat-value {
      font-size: 28px;
    }

    .section-title {
      font-size: 20px;
    }

    .cta-card {
      padding: 40px 20px;
    }

    .cta-title {
      font-size: 20px;
    }
  }
</style>
