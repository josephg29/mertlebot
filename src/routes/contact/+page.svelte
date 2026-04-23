<script>
  import { Mail, Globe, Zap } from 'lucide-svelte';

  const faqs = [
    {
      question: 'How accurate are the wiring diagrams?',
      answer: 'Every diagram is generated based on actual component specifications and tested against real-world configurations.'
    },
    {
      question: 'Can I use Mertle.bot for commercial projects?',
      answer: 'Absolutely! Mertle.bot is completely free and many businesses use it for prototyping and documentation.'
    },
    {
      question: 'Do you support Raspberry Pi projects?',
      answer: 'Yes! We support Arduino, Raspberry Pi, ESP32, and many other platforms.'
    },
    {
      question: 'Can I save my projects?',
      answer: 'Yes! All projects are automatically saved to your browser\'s local storage.'
    }
  ];

  const contactMethods = [
    { icon: Mail, title: 'Email', details: 'joseph@paradime.tech', href: 'mailto:joseph@paradime.tech', desc: 'Direct line to the maker' },
    { icon: Globe, title: 'Website', details: 'paradime.tech', href: 'https://paradime.tech', desc: 'Our company website' }
  ];

  let openFaqIndex = null;

  function toggleFaq(index) {
    openFaqIndex = openFaqIndex === index ? null : index;
  }
</script>

<div class="contact-page">
  <!-- Hero -->
  <section class="contact-hero">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">GET IN TOUCH</div>
        <h1 class="hero-title">We're Here to Help You Build</h1>
        <p class="hero-subtitle">
          Questions, feedback, or just want to say hi? Drop us a line.
        </p>
      </div>
    </div>
  </section>

  <!-- Contact Info -->
  <section class="contact-grid-section">
    <div class="section-container">
      <div class="info-header">
        <div class="info-title">REACH OUT</div>
        <div class="info-subtitle">Direct lines — no bots, no ticket queues</div>
      </div>

      <div class="contact-methods">
        {#each contactMethods as method}
          <a class="contact-method" href={method.href} target={method.href.startsWith('http') ? '_blank' : undefined} rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
            <div class="method-icon"><svelte:component this={method.icon} size={24} /></div>
            <div class="method-content">
              <div class="method-title">{method.title}</div>
              <div class="method-details">{method.details}</div>
              <div class="method-desc">{method.desc}</div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="faq-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-badge">FAQ</div>
        <h2 class="section-title">Frequently Asked Questions</h2>
        <p class="section-subtitle">Quick answers to common questions</p>
      </div>

      <div class="faq-list">
        {#each faqs as faq, i}
          <div class="faq-item {openFaqIndex === i ? 'open' : ''}">
            <button class="faq-question" on:click={() => toggleFaq(i)}>
              <span class="faq-text">{faq.question}</span>
              <span class="faq-toggle">{openFaqIndex === i ? '−' : '+'}</span>
            </button>
            {#if openFaqIndex === i}
              <div class="faq-answer">
                <div class="faq-answer-content">{faq.answer}</div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="cta-container">
      <div class="cta-card">
        <h2 class="cta-title">Ready to Start Building?</h2>
        <p class="cta-desc">
          Don't let questions hold you back. Start creating amazing electronics projects today.
        </p>
        <div class="cta-actions">
          <a href="/build" class="cta-btn primary">
            <span class="btn-icon"><Zap size={16} /></span>
            <span class="btn-text">LAUNCH BUILDER</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .contact-page {
    overflow: hidden;
  }

  /* Hero */
  .contact-hero {
    padding: 80px 20px;
    background: var(--bg);
  }

  .hero-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hero-content {
    max-width: 600px;
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
  }

  /* Section Container */
  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Contact Info */
  .contact-grid-section {
    padding: 100px 0;
    background: var(--surface);
  }

  .info-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .info-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--primary);
    margin-bottom: 8px;
    -webkit-font-smoothing: none;
  }

  .info-subtitle {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text-muted);
  }

  .contact-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .contact-method {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s var(--spring), border-color 0.2s, box-shadow 0.2s var(--spring);
  }

  .contact-method:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
    box-shadow: 4px 6px 0 rgba(0,0,0,0.4);
  }

  .method-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--primary);
    filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.4));
  }

  .method-content {
    flex: 1;
  }

  .method-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--primary);
    margin-bottom: 6px;
    -webkit-font-smoothing: none;
  }

  .method-details {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    margin-bottom: 4px;
    word-break: break-all;
  }

  .method-desc {
    font-size: calc(12px * var(--fs, 1));
    color: var(--text-muted);
  }

  /* FAQ Section */
  .faq-section {
    padding: 100px 0;
    background: var(--bg);
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

  .faq-list {
    max-width: 800px;
    margin: 0 auto;
    background: var(--surface);
    border: 4px solid var(--border-col);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
  }

  .faq-item {
    border-bottom: 3px solid var(--surface2);
  }

  .faq-item:last-child {
    border-bottom: none;
  }

  .faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: none;
    border: none;
    padding: 24px;
    text-align: left;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: calc(15px * var(--fs, 1));
    color: var(--text);
    transition: background 0.2s;
  }

  .faq-question:hover {
    background: var(--surface2);
  }

  .faq-text {
    flex: 1;
    margin-right: 20px;
  }

  .faq-toggle {
    font-family: 'Press Start 2P', monospace;
    font-size: 20px;
    color: var(--primary);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    -webkit-font-smoothing: none;
  }

  .faq-answer {
    padding: 0 24px 24px;
    animation: fadeIn 0.3s ease-out;
  }

  .faq-answer-content {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.7;
    padding-left: 20px;
    border-left: 4px solid var(--cta);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* CTA Section */
  .cta-section {
    padding: 100px 0;
    background: var(--surface);
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

  .btn-icon {
    display: inline-flex;
    align-items: center;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .hero-title {
      font-size: 28px;
    }
  }

  @media (max-width: 768px) {
    .contact-hero {
      padding: 60px 20px;
    }

    .hero-title {
      font-size: 24px;
    }

    .contact-grid-section {
      padding: 60px 0;
    }

    .faq-question {
      padding: 20px;
      font-size: calc(14px * var(--fs, 1));
    }

    .faq-answer {
      padding: 0 20px 20px;
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

    .contact-method {
      flex-direction: column;
      text-align: center;
    }

    .method-icon {
      align-self: center;
    }

    .cta-card {
      padding: 40px 20px;
    }

    .cta-title {
      font-size: 20px;
    }
  }
</style>
