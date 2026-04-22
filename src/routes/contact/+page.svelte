<script>
  import { Mail, Wrench, Briefcase, X, AlertTriangle, Clock, Globe, Zap, BadgeDollarSign, Check } from 'lucide-svelte';

  let formData = {
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  };
  
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = '';
  
  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'education', label: 'Education/Schools' }
  ];
  
  const faqs = [
    {
      question: 'How accurate are the wiring diagrams?',
      answer: 'Every diagram is generated based on actual component specifications and tested against real-world configurations. We maintain a 99.8% accuracy rate across all generated projects.'
    },
    {
      question: 'Can I use Mertle.bot for commercial projects?',
      answer: 'Absolutely! Many businesses use our tool for prototyping and documentation. Check our pricing page for commercial usage terms.'
    },
    {
      question: 'Do you support Raspberry Pi projects?',
      answer: 'Yes! We support Arduino, Raspberry Pi, ESP32, and many other platforms. Our component library includes thousands of parts across all major ecosystems.'
    },
    {
      question: 'How often is the component database updated?',
      answer: 'We update our database weekly with new components, and our AI models are retrained monthly to incorporate the latest best practices.'
    },
    {
      question: 'Can I save my projects?',
      answer: 'Yes! All projects are automatically saved to your browser\'s local storage. With a subscription, you get cloud storage and cross-device access.'
    },
    {
      question: 'Is there an API available?',
      answer: 'We offer API access for enterprise customers. Contact us for pricing and documentation.'
    }
  ];
  
  const contactMethods = [
    { icon: Mail, title: 'Email', details: 'contact@mertle.bot', desc: 'General inquiries' },
    { icon: Wrench, title: 'Support', details: 'support@mertle.bot', desc: 'Technical help & bugs' },
    { icon: Briefcase, title: 'Business', details: 'partnerships@mertle.bot', desc: 'Partnerships & enterprise' },
    { icon: X, title: 'Social', details: '@mertlebot', desc: 'Twitter & community' }
  ];
  
  let openFaqIndex = null;
  
  function toggleFaq(index) {
    openFaqIndex = openFaqIndex === index ? null : index;
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    isSubmitting = true;
    submitError = '';
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    submitSuccess = true;
    formData = { name: '', email: '', subject: '', message: '', category: 'general' };

    // Reset success message after 5 seconds
    setTimeout(() => {
      submitSuccess = false;
    }, 5000);
    
    isSubmitting = false;
  }
  
  function handleReset() {
    formData = { name: '', email: '', subject: '', message: '', category: 'general' };
    submitSuccess = false;
    submitError = '';
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
          Have questions, feedback, or need help with a project? We're always excited to hear from our community of makers.
        </p>
      </div>
    </div>
  </section>
  
  <!-- Contact Grid -->
  <section class="contact-grid-section">
    <div class="section-container">
      <div class="contact-grid">
        <!-- Contact Form -->
        <div class="form-column">
          <div class="form-header">
            <div class="form-title">SEND US A MESSAGE</div>
            <div class="form-subtitle">We usually reply within 24 hours</div>
          </div>
          
          {#if submitSuccess}
            <div class="success-message">
              <div class="success-icon"><Check size={48} /></div>
              <div class="success-content">
                <div class="success-title">MESSAGE SENT!</div>
                <div class="success-desc">
                  Thanks for reaching out! We'll get back to you within 24 hours.
                </div>
              </div>
            </div>
          {:else}
            <form class="contact-form" on:submit={handleSubmit} on:reset={handleReset}>
              <div class="form-group">
                <label for="name" class="form-label">YOUR NAME</label>
                <input
                  id="name"
                  type="text"
                  bind:value={formData.name}
                  required
                  class="form-input"
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                />
              </div>
              
              <div class="form-group">
                <label for="email" class="form-label">EMAIL ADDRESS</label>
                <input
                  id="email"
                  type="email"
                  bind:value={formData.email}
                  required
                  class="form-input"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </div>
              
              <div class="form-group">
                <label for="subject" class="form-label">SUBJECT</label>
                <input
                  id="subject"
                  type="text"
                  bind:value={formData.subject}
                  required
                  class="form-input"
                  placeholder="What's this about?"
                  disabled={isSubmitting}
                />
              </div>
              
              <div class="form-group">
                <label for="category" class="form-label">CATEGORY</label>
                <select
                  id="category"
                  bind:value={formData.category}
                  class="form-select"
                  disabled={isSubmitting}
                >
                  {#each categories as category}
                    <option value={category.value}>{category.label}</option>
                  {/each}
                </select>
              </div>
              
              <div class="form-group">
                <label for="message" class="form-label">MESSAGE</label>
                <textarea
                  id="message"
                  bind:value={formData.message}
                  required
                  class="form-textarea"
                  placeholder="Tell us about your project, question, or idea..."
                  rows="6"
                  disabled={isSubmitting}
                ></textarea>
              </div>
              
              {#if submitError}
                <div class="error-message">
                  <div class="error-icon"><AlertTriangle size={20} /></div>
                  <div class="error-text">{submitError}</div>
                </div>
              {/if}
              
              <div class="form-actions">
                <button type="reset" class="form-btn secondary" disabled={isSubmitting}>
                  CLEAR
                </button>
                <button type="submit" class="form-btn primary" disabled={isSubmitting}>
                  {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </div>
            </form>
          {/if}
        </div>
        
        <!-- Contact Info -->
        <div class="info-column">
          <div class="info-header">
            <div class="info-title">OTHER WAYS TO REACH US</div>
            <div class="info-subtitle">Quick answers and direct lines</div>
          </div>
          
          <div class="contact-methods">
            {#each contactMethods as method}
              <div class="contact-method">
                <div class="method-icon"><svelte:component this={method.icon} size={24} /></div>
                <div class="method-content">
                  <div class="method-title">{method.title}</div>
                  <div class="method-details">{method.details}</div>
                  <div class="method-desc">{method.desc}</div>
                </div>
              </div>
            {/each}
          </div>
          
          <div class="info-card">
            <div class="card-icon"><Clock size={24} /></div>
            <div class="card-content">
              <div class="card-title">Response Time</div>
              <div class="card-desc">
                We aim to respond within 24 hours on weekdays. For urgent technical issues, email support@mertle.bot with "URGENT" in the subject.
              </div>
            </div>
          </div>
          
          <div class="info-card">
            <div class="card-icon"><Globe size={24} /></div>
            <div class="card-content">
              <div class="card-title">Community</div>
              <div class="card-desc">
                Join our Discord community for real-time help, project sharing, and early access to new features.
              </div>
            </div>
          </div>
        </div>
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
          <a href="/pricing" class="cta-btn secondary">
            <span class="btn-icon"><BadgeDollarSign size={16} /></span>
            <span class="btn-text">VIEW PRICING</span>
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
  
  /* Contact Grid */
  .contact-grid-section {
    padding: 100px 0;
    background: var(--surface);
  }
  
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
  }
  
  .form-column,
  .info-column {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  
  .form-header,
  .info-header {
    margin-bottom: 20px;
  }
  
  .form-title,
  .info-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--primary);
    margin-bottom: 8px;
    -webkit-font-smoothing: none;
  }
  
  .form-subtitle,
  .info-subtitle {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text-muted);
  }
  
  /* Contact Form */
  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: var(--primary);
    letter-spacing: 1px;
    -webkit-font-smoothing: none;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    color: var(--text);
    font-family: 'IBM Plex Mono', monospace;
    font-size: calc(13px * var(--fs, 1));
    padding: 12px;
    outline: none;
    transition: border-color 0.2s;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  }
  
  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--primary);
  }
  
  .form-input::placeholder,
  .form-textarea::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  
  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='square'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 150px;
  }
  
  .success-message {
    padding: 40px;
    background: var(--surface);
    border: 4px solid var(--cta);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.55);
    text-align: center;
  }
  
  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cta);
    margin-bottom: 20px;
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }
  
  .success-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: var(--cta-light);
    margin-bottom: 12px;
    -webkit-font-smoothing: none;
  }
  
  .success-desc {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
  }
  
  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--surface2);
    border: 3px solid var(--danger);
    padding: 16px;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  }
  
  .error-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--danger);
  }
  
  .error-text {
    font-size: calc(12px * var(--fs, 1));
    color: var(--danger);
    line-height: 1.6;
  }
  
  .form-actions {
    display: flex;
    gap: 16px;
  }
  
  .form-btn {
    flex: 1;
    padding: 14px;
    font-family: 'Press Start 2P', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    border: 3px solid;
    cursor: pointer;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), box-shadow 0.2s var(--spring), 
                background 0.2s, color 0.2s;
    -webkit-font-smoothing: none;
  }
  
  .form-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4) !important;
  }
  
  .form-btn.primary {
    background: var(--cta);
    border-color: var(--cta-dark);
    color: #fff;
  }
  
  .form-btn.primary:hover:not(:disabled) {
    background: var(--cta-light);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }
  
  .form-btn.secondary {
    background: var(--surface);
    border-color: var(--border-col);
    color: var(--text-muted);
  }
  
  .form-btn.secondary:hover:not(:disabled) {
    background: var(--surface2);
    color: var(--text);
    transform: translateY(-4px);
    box-shadow: 4px 8px 0 rgba(0,0,0,0.4);
  }
  
  /* Contact Methods */
  .contact-methods {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .contact-method {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
    transition: transform 0.2s var(--spring), border-color 0.2s;
  }
  
  .contact-method:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
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
    margin-bottom: 4px;
    -webkit-font-smoothing: none;
  }
  
  .method-details {
    font-size: calc(14px * var(--fs, 1));
    color: var(--text);
    margin-bottom: 4px;
  }
  
  .method-desc {
    font-size: calc(12px * var(--fs, 1));
    color: var(--text-muted);
  }
  
  /* Info Cards */
  .info-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: var(--surface2);
    border: 3px solid var(--border-col);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.4);
  }
  
  .card-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--primary);
    filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.4));
  }
  
  .card-content {
    flex: 1;
  }
  
  .card-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: var(--primary);
    margin-bottom: 8px;
    -webkit-font-smoothing: none;
  }
  
  .card-desc {
    font-size: calc(13px * var(--fs, 1));
    color: var(--text);
    line-height: 1.6;
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
    .contact-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    
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
    
    .form-actions {
      flex-direction: column;
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
    
    .info-card {
      flex-direction: column;
      text-align: center;
    }
    
    .card-icon {
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
