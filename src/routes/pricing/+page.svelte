<script>
  import { onMount } from 'svelte';
  import { Check, X, Mail, Zap } from 'lucide-svelte';
  
  const plans = [
    {
      name: 'CREDITS',
      price: 'Free',
      period: 'to start',
      description: 'Pay only for what you build',
      popular: false,
      features: [
        { text: 'Buy credits as you go', included: true },
        { text: 'Full wiring diagrams', included: true },
        { text: 'Arduino & ESP code generation', included: true },
        { text: 'Parts list with buying links', included: true },
        { text: 'No monthly commitment', included: true },
        { text: 'Wokwi simulation', included: false },
        { text: 'Raspberry Pi support', included: false },
        { text: 'Priority processing', included: false }
      ],
      cta: 'START BUILDING',
      ctaLink: '/build'
    },
    {
      name: 'PLUS',
      price: '$8',
      period: 'per month',
      description: 'For regular makers & students',
      popular: false,
      features: [
        { text: 'Generous monthly credit allowance', included: true },
        { text: 'Full wiring diagrams', included: true },
        { text: 'Multi-platform code (Arduino, Pi, ESP)', included: true },
        { text: 'Parts list with buying links', included: true },
        { text: 'Wokwi simulation', included: true },
        { text: 'Priority processing', included: true },
        { text: 'All components unlocked', included: true },
        { text: 'Commercial use', included: false }
      ],
      cta: 'GET PLUS',
      ctaLink: '/build'
    },
    {
      name: 'UNLIMITED',
      price: '$14',
      period: 'per month',
      description: 'Unlimited everything, no limits',
      popular: true,
      features: [
        { text: 'Unlimited generations', included: true },
        { text: 'Everything in Plus', included: true },
        { text: 'Full wiring diagrams', included: true },
        { text: 'Multi-platform code (Arduino, Pi, ESP)', included: true },
        { text: 'Wokwi simulation', included: true },
        { text: 'Priority processing', included: true },
        { text: 'All components unlocked', included: true },
        { text: 'Commercial use', included: true }
      ],
      cta: 'GO UNLIMITED',
      ctaLink: '/build'
    }
  ];
  
  const faqs = [
    {
      question: 'How do credits work?',
      answer: 'Each project generation costs a small number of credits. You start with a free batch and can top up anytime — no subscription required.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.'
    },
    {
      question: 'Can I switch plans later?',
      answer: 'Yes. You can upgrade, downgrade, or cancel at any time from your account settings. Unused credits carry over.'
    },
    {
      question: 'What is the difference between Plus and Unlimited?',
      answer: 'Plus gives you a generous monthly credit allowance — enough for most regular users. Unlimited removes all limits and adds commercial use rights.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. Cancel from your account settings at any time. Your credits remain usable until they run out.'
    },
    {
      question: 'Do credits expire?',
      answer: 'Credits on paid plans reset monthly. One-off credit top-ups on the free tier never expire.'
    }
  ];
  
</script>

<div class="pricing-page">
  <!-- Hero -->
  <section class="pricing-hero">
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">PRICING</div>
        <h1 class="hero-title">Simple, Transparent Pricing</h1>
        <p class="hero-subtitle">
          Choose the plan that fits your needs. All plans include our core wiring wizardry — pay for the extras that matter to you.
        </p>
        
      </div>
    </div>
  </section>
  
  <!-- Plans -->
  <section class="plans-section">
    <div class="section-container">
      <div class="plans-grid">
        {#each plans as plan}
          <div class="plan-card {plan.popular ? 'popular' : ''}">
            {#if plan.popular}
              <div class="popular-badge">MOST POPULAR</div>
            {/if}
            
            <div class="plan-header">
              <div class="plan-name">{plan.name}</div>
              <div class="plan-price">
                <span class="price-amount">{plan.price}</span>
                <span class="price-period">{plan.price === 'Free' ? '' : plan.period}</span>
              </div>
              <div class="plan-desc">{plan.description}</div>
            </div>
            
            <div class="plan-features">
              {#each plan.features as feature}
                <div class="feature-item {feature.included ? 'included' : 'excluded'}">
                  <span class="feature-icon">
                    {#if feature.included}<Check size={12} />{:else}<X size={12} />{/if}
                  </span>
                  <span class="feature-text">{feature.text}</span>
                </div>
              {/each}
            </div>
            
            <div class="plan-actions">
              <a href={plan.ctaLink} class="plan-cta {plan.popular ? 'primary' : 'secondary'}">
                {plan.cta} →
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>
  
  <!-- FAQ -->
  <section class="faq-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-badge">FAQ</div>
        <h2 class="section-title">Common Questions</h2>
        <p class="section-subtitle">Everything you need to know about our plans</p>
      </div>
      
      <div class="faq-grid">
        {#each faqs as faq}
          <div class="faq-card">
            <div class="faq-question">{faq.question}</div>
            <div class="faq-answer">{faq.answer}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>
  
  <!-- CTA -->
  <section class="cta-section">
    <div class="cta-container">
      <div class="cta-card">
        <h2 class="cta-title">Still Have Questions?</h2>
        <p class="cta-desc">
          Not sure which plan is right for you? Contact our team and we'll help you choose.
        </p>
        <div class="cta-actions">
          <a href="/contact" class="cta-btn primary">
            <span class="btn-icon"><Mail size={16} /></span>
            <span class="btn-text">CONTACT US</span>
          </a>
          <a href="/build" class="cta-btn secondary">
            <span class="btn-icon"><Zap size={16} /></span>
            <span class="btn-text">TRY FREE VERSION</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .pricing-page {
    overflow: hidden;
  }
  
  /* Hero */
  .pricing-hero {
    padding: 80px 20px;
    background: var(--bg);
  }
  
  .hero-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-content {
    text-align: center;
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
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* Section Container */
  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  /* Plans Section */
  .plans-section {
    padding: 100px 0;
    background: var(--surface);
  }
  
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
  }
  
  .plan-card {
    background: var(--surface2);
    border: 4px solid var(--border-col);
    padding: 40px;
    position: relative;
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
    transition: transform 0.3s var(--spring), border-color 0.3s;
  }
  
  .plan-card:hover {
    transform: translateY(-8px);
  }
  
  .plan-card.popular {
    border-color: var(--cta);
    transform: translateY(-4px);
  }
  
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--cta);
    color: #fff;
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    letter-spacing: 1px;
    padding: 6px 12px;
    border: 3px solid var(--cta-dark);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
    -webkit-font-smoothing: none;
  }
  
  .plan-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .plan-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: var(--primary);
    margin-bottom: 16px;
    -webkit-font-smoothing: none;
  }
  
  .plan-price {
    margin-bottom: 16px;
  }
  
  .price-amount {
    font-family: 'Press Start 2P', monospace;
    font-size: 36px;
    color: var(--text);
    -webkit-font-smoothing: none;
  }
  
  .price-period {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: var(--text-muted);
    margin-left: 4px;
    -webkit-font-smoothing: none;
  }
  
  .plan-desc {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text-muted);
    line-height: 1.6;
  }
  
  .plan-features {
    margin-bottom: 30px;
  }
  
  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--surface);
  }
  
  .feature-item:last-child {
    border-bottom: none;
  }
  
  .feature-item.included {
    color: var(--text);
  }
  
  .feature-item.excluded {
    color: var(--text-muted);
    opacity: 0.6;
  }
  
  .feature-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--surface);
    border: 2px solid var(--border-col);
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
  }
  
  .feature-item.included .feature-icon {
    background: var(--cta);
    border-color: var(--cta-dark);
    color: #fff;
  }
  
  .feature-item.excluded .feature-icon {
    background: var(--surface);
    border-color: var(--border-col);
    color: var(--text-muted);
  }
  
  .feature-text {
    font-size: calc(13px * var(--fs, 1));
    line-height: 1.5;
  }
  
  .plan-actions {
    text-align: center;
  }
  
  .plan-cta {
    display: inline-block;
    padding: 14px 28px;
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
  
  .plan-cta.primary {
    background: var(--cta);
    border-color: var(--cta-dark);
    color: #fff;
  }
  
  .plan-cta.primary:hover {
    background: var(--cta-light);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }
  
  .plan-cta.secondary {
    background: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .plan-cta.secondary:hover {
    background: var(--primary);
    color: var(--trunk);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
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
  
  .faq-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
  }
  
  .faq-card {
    padding: 30px;
    background: var(--surface);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring);
  }
  
  .faq-card:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
  }
  
  .faq-question {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: var(--primary);
    margin-bottom: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: none;
  }
  
  .faq-answer {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.7;
    padding-left: 16px;
    border-left: 4px solid var(--cta);
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
  
  /* Responsive Design */
  @media (max-width: 1024px) {
    .hero-title {
      font-size: 28px;
    }
    
    .plans-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
      margin: 0 auto;
    }
  }
  
  @media (max-width: 768px) {
    .pricing-hero {
      padding: 60px 20px;
    }
    
    .hero-title {
      font-size: 24px;
    }
    
    .faq-grid {
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
    
    .section-title {
      font-size: 20px;
    }
    
    .plan-card {
      padding: 30px 20px;
    }
    
    .price-amount {
      font-size: 28px;
    }
    
    .cta-card {
      padding: 40px 20px;
    }
    
    .cta-title {
      font-size: 20px;
    }
  }
</style>
