<script>
  import { MessageSquare, Brain, Package, FlaskConical, Target, Wrench, Rocket, Handshake, Bot, Mail } from 'lucide-svelte';

  const howItWorks = [
    { icon: MessageSquare, step: '01', title: 'Describe It', desc: 'Type what you want to build in plain English. No technical jargon needed — just your idea.' },
    { icon: Brain, step: '02', title: 'AI Does the Work', desc: 'The AI selects the right components, plans the circuit, and writes the code — all at once.' },
    { icon: Package, step: '03', title: 'Get Everything', desc: 'Receive an interactive wiring diagram, full parts list with links, and ready-to-flash code.' },
    { icon: FlaskConical, step: '04', title: 'Build or Simulate', desc: 'Follow step-by-step instructions or test your circuit live in the browser before touching a wire.' }
  ];

  const timeline = [
    { year: 'JUN 2025', title: 'First Prototype', desc: 'Weekend project to generate basic LED circuits' },
    { year: 'JUL 2025', title: 'Code Generation', desc: 'Added Arduino code output — projects became buildable' },
    { year: 'AUG 2025', title: 'Parts Database', desc: 'Integrated component specs and buying links' },
    { year: 'SEP 2025', title: 'Wokwi Simulation', desc: 'Added live circuit testing in browser' },
    { year: 'OCT 2025', title: 'Skill System', desc: 'Introduced MONKEY to EXPERT difficulty levels' },
    { year: 'NOW', title: 'Growing Community', desc: 'Makers and students building every day' }
  ];

  const values = [
    { icon: Target, title: 'Accessibility First', desc: 'Electronics should be approachable for everyone' },
    { icon: Wrench, title: 'Practical Results', desc: 'Every output should be buildable in the real world' },
    { icon: Rocket, title: 'Continuous Innovation', desc: 'Always adding new components and features' },
    { icon: Handshake, title: 'Community Driven', desc: 'Features based on what builders actually need' }
  ];
</script>

<div class="about-page">
  <!-- Hero -->
  <section class="about-hero">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">OUR STORY</div>
        <h1 class="hero-title">Building the Future of Electronics Education</h1>
        <p class="hero-subtitle">
          Mertle.bot started as a weekend hack in June 2025 and has grown into the most comprehensive hardware assistant on the web. We're on a mission to make electronics accessible to everyone.
        </p>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-value">2025</div>
            <div class="stat-label">FOUNDED</div>
          </div>
          <div class="stat">
            <div class="stat-value">99.9%</div>
            <div class="stat-label">ACCURACY</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-card">
          <div class="visual-icon"><Bot size={64} strokeWidth={2.5} /></div>
          <div class="visual-text">MERTLE.BOT</div>
          <div class="visual-tag">wiring wizards since 2025</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Mission -->
  <section class="mission-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-badge">OUR MISSION</div>
        <h2 class="section-title">Democratizing Hardware Creation</h2>
        <p class="section-subtitle">
          We believe anyone should be able to bring their electronics ideas to life — no engineering degree required.
        </p>
      </div>

      <div class="values-grid">
        {#each values as value}
          <div class="value-card">
            <div class="value-icon"><svelte:component this={value.icon} size={40} /></div>
            <h3 class="value-title">{value.title}</h3>
            <p class="value-desc">{value.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="team-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-badge">HOW IT WORKS</div>
        <h2 class="section-title">From Idea to Circuit in Seconds</h2>
        <p class="section-subtitle">
          No engineering degree. No prior experience. Just describe what you want to build.
        </p>
      </div>

      <div class="team-grid">
        {#each howItWorks as item}
          <div class="team-card primary">
            <div class="team-avatar"><svelte:component this={item.icon} size={48} /></div>
            <div class="team-name">{item.step}</div>
            <div class="team-role">{item.title}</div>
            <div class="team-desc">{item.desc}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Timeline -->
  <section class="timeline-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-badge">OUR JOURNEY</div>
        <h2 class="section-title">From Idea to Indispensable Tool</h2>
      </div>

      <div class="timeline">
        {#each timeline as item, i}
          <div class="timeline-item">
            <div class="timeline-year">{item.year}</div>
            <div class="timeline-content">
              <div class="timeline-title">{item.title}</div>
              <div class="timeline-desc">{item.desc}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="cta-container">
      <div class="cta-card">
        <h2 class="cta-title">Join the Electronics Revolution</h2>
        <p class="cta-desc">
          Whether you're a complete beginner or seasoned engineer, Mertle.bot has something for you.
        </p>
        <div class="cta-actions">
          <a href="/build" class="cta-btn primary">
            <span class="btn-icon"><Rocket size={16} /></span>
            <span class="btn-text">START BUILDING</span>
          </a>
          <a href="/contact" class="cta-btn secondary">
            <span class="btn-icon"><Mail size={16} /></span>
            <span class="btn-text">GET IN TOUCH</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .about-page {
    overflow: hidden;
  }

  /* Hero */
  .about-hero {
    padding: 80px 20px;
    background: var(--bg);
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
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
    margin-bottom: 24px;
    -webkit-font-smoothing: none;
  }

  .hero-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 32px;
    color: var(--text);
    margin-bottom: 20px;
    line-height: 1.3;
    -webkit-font-smoothing: none;
  }

  .hero-subtitle {
    font-size: calc(16px * var(--fs, 1));
    color: var(--text-muted);
    line-height: 1.7;
    margin-bottom: 40px;
    max-width: 500px;
  }

  .hero-stats {
    display: flex;
    gap: 30px;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    font-family: 'Press Start 2P', monospace;
    font-size: 28px;
    color: var(--primary);
    margin-bottom: 8px;
    -webkit-font-smoothing: none;
  }

  .stat-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--text-muted);
    letter-spacing: 1px;
    -webkit-font-smoothing: none;
  }

  .hero-visual {
    display: flex;
    justify-content: center;
  }

  .visual-card {
    padding: 40px;
    background: var(--surface);
    border: 4px solid var(--primary);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
    text-align: center;
    animation: voxel-bob 4s ease-in-out infinite;
  }

  .visual-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: var(--primary);
    filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.4));
  }

  .visual-text {
    font-family: 'Press Start 2P', monospace;
    font-size: 20px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .visual-tag {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--text-muted);
    letter-spacing: 2px;
    -webkit-font-smoothing: none;
  }

  /* Section Container */
  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Mission Section */
  .mission-section {
    padding: 100px 0;
    background: var(--surface);
  }

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
    background: var(--surface2);
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

  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
  }

  .value-card {
    padding: 30px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), border-color 0.2s;
  }

  .value-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
  }

  .value-icon {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    color: var(--primary);
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }

  .value-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .value-desc {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
  }

  /* Team Section */
  .team-section {
    padding: 100px 0;
    background: var(--bg);
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
  }

  .team-card {
    padding: 30px;
    background: var(--surface);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    text-align: center;
    transition: transform 0.2s var(--spring);
  }

  .team-card:hover {
    transform: translateY(-4px);
  }

  .team-card.primary {
    border-color: var(--primary);
  }

  .team-card.cta {
    border-color: var(--cta);
  }

  .team-card.link {
    border-color: var(--link);
  }

  .team-card.danger {
    border-color: var(--danger);
  }

  .team-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: var(--primary);
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }

  .team-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--text);
    margin-bottom: 8px;
    -webkit-font-smoothing: none;
  }

  .team-role {
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    color: var(--text-muted);
    margin-bottom: 16px;
    letter-spacing: 1px;
    -webkit-font-smoothing: none;
  }

  .team-desc {
    font-size: calc(13px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
  }

  /* Timeline Section */
  .timeline-section {
    padding: 100px 0;
    background: var(--surface);
  }

  .timeline {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 30px;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--border-col);
  }

  .timeline-item {
    position: relative;
    margin-bottom: 40px;
    padding-left: 60px;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-item::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    width: 16px;
    height: 16px;
    background: var(--primary);
    border: 3px solid var(--primary-dark);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  }

  .timeline-year {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .timeline-content {
    background: var(--surface2);
    border: 3px solid var(--border-col);
    padding: 20px;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  }

  .timeline-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: var(--primary);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }

  .timeline-desc {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
  }

  /* CTA Section */
  .cta-section {
    padding: 100px 0;
    background: var(--bg);
  }

  .cta-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
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

  .btn-icon {
    display: inline-flex;
    align-items: center;
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
      max-width: 400px;
      margin: 0 auto;
    }
  }

  @media (max-width: 768px) {
    .about-hero {
      padding: 60px 20px;
    }

    .hero-title {
      font-size: 24px;
    }

    .hero-stats {
      flex-direction: column;
      gap: 20px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-value {
      margin-bottom: 0;
    }

    .values-grid,
    .team-grid {
      grid-template-columns: 1fr;
    }

    .timeline::before {
      left: 20px;
    }

    .timeline-item {
      padding-left: 40px;
    }

    .timeline-item::before {
      left: 14px;
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
