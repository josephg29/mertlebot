<script>
  import { page } from '$app/state';
  import { House, Zap, Info, Mail, BadgeDollarSign, Bot, Palette, Rocket, LogIn, UserPlus, LogOut, User } from 'lucide-svelte';
  import { logout } from '$lib/auth-store.js';

  let { auth } = $props();
  
  const navItems = [
    { href: '/', label: 'HOME', icon: House },
    { href: '/build', label: 'BUILD', icon: Zap },
    { href: '/about', label: 'ABOUT', icon: Info },
    { href: '/contact', label: 'CONTACT', icon: Mail },
    { href: '/pricing', label: 'PRICING', icon: BadgeDollarSign }
  ];

  const THEMES = ['solder', 'deep-sea', 'phosphor', 'amber', 'arctic', 'sakura'];

  function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'solder';
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mrt-theme', next); } catch {}
  }

  async function handleLogout() {
    await logout();
  }

  function openLogin() {
    // This will be handled by the build page
    window.location.href = '/build#login';
  }

  function openRegister() {
    // This will be handled by the build page
    window.location.href = '/build#register';
  }
</script>

<nav class="main-nav">
  <div class="nav-brand">
    <a href="/" class="brand-link">
      <span class="brand-icon"><Bot size={24} /></span>
      <span class="brand-text">MERTLE.BOT</span>
    </a>
  </div>

  <div class="nav-menu">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-link {($page.url.pathname === item.href || ($page.url.pathname === '/build' && item.href === '/build')) ? 'active' : ''}"
        aria-current={($page.url.pathname === item.href || ($page.url.pathname === '/build' && item.href === '/build')) ? 'page' : undefined}
      >
        <span class="nav-icon"><svelte:component this={item.icon} size={14} /></span>
        <span class="nav-label">{item.label}</span>
      </a>
    {/each}
  </div>

  <div class="nav-actions">
    <button class="nav-action-btn" title="Toggle theme" on:click={cycleTheme}>
      <span class="action-icon"><Palette size={16} /></span>
    </button>
    
    {#if auth.user}
      <div class="nav-user">
        <span class="nav-username">{auth.user.username}</span>
        <button class="nav-action-btn" title="Logout" on:click={handleLogout}>
          <span class="action-icon"><LogOut size={16} /></span>
        </button>
      </div>
    {:else}
      <button class="nav-action-btn" title="Login" on:click={openLogin}>
        <span class="action-icon"><LogIn size={16} /></span>
      </button>
      <button class="nav-action-btn" title="Register" on:click={openRegister}>
        <span class="action-icon"><UserPlus size={16} /></span>
      </button>
    {/if}
    
    <a href="/build" class="cta-btn">
      <span class="cta-icon"><Rocket size={14} /></span>
      <span class="cta-text">START BUILDING</span>
    </a>
  </div>
</nav>

<style>
  .main-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--topbar-bg);
    border-bottom: 4px solid var(--primary);
    padding: 0 20px;
    height: 60px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .nav-brand {
    flex-shrink: 0;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--primary);
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.6);
    transition: transform 0.2s var(--spring);
    -webkit-font-smoothing: none;
  }

  .brand-link:hover {
    transform: translateY(-2px);
  }

  .brand-icon {
    display: inline-flex;
    align-items: center;
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.4));
  }

  .brand-text {
    font-size: 10px;
  }

  .nav-menu {
    display: flex;
    gap: 4px;
    flex: 1;
    justify-content: center;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: var(--surface);
    border: 2px solid var(--border-col);
    color: var(--text-muted);
    text-decoration: none;
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
    transition: transform 0.12s var(--spring), box-shadow 0.12s var(--spring),
                color 0.1s, background 0.1s, border-color 0.1s;
    -webkit-font-smoothing: none;
  }

  .nav-link:hover {
    color: var(--primary);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 2px 4px 0 rgba(0,0,0,0.4);
  }

  .nav-link.active {
    background: var(--primary);
    border-color: var(--primary-dark);
    color: var(--trunk);
    box-shadow: 2px 2px 0 var(--primary-dark);
  }

  .nav-link.active:hover {
    transform: none;
    box-shadow: 2px 2px 0 var(--primary-dark);
  }

  .nav-icon {
    display: inline-flex;
    align-items: center;
  }

  .nav-label {
    font-size: 8px;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .nav-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--surface);
    border: 2px solid var(--border-col);
    color: var(--text-muted);
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.4);
    transition: transform 0.12s var(--spring), box-shadow 0.12s var(--spring),
                color 0.1s, border-color 0.1s;
  }

  .nav-action-btn:hover {
    color: var(--primary);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 2px 4px 0 rgba(0,0,0,0.4);
  }

  .action-icon {
    display: inline-flex;
    align-items: center;
  }

  .cta-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: var(--cta);
    border: 3px solid var(--cta-dark);
    color: #fff;
    text-decoration: none;
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 3px 3px 0 rgba(0,0,0,0.4);
    transition: transform 0.12s var(--spring), box-shadow 0.12s var(--spring),
                background 0.1s;
    -webkit-font-smoothing: none;
  }

  .cta-btn:hover {
    background: var(--cta-light);
    transform: translateY(-2px);
    box-shadow: 3px 5px 0 rgba(0,0,0,0.4);
  }

  .cta-btn:active {
    transform: translateY(1px);
    box-shadow: 1px 1px 0 rgba(0,0,0,0.4);
  }

  .cta-icon {
    display: inline-flex;
    align-items: center;
  }

  .cta-text {
    font-size: 8px;
  }

  .nav-user {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .nav-username {
    font-family: 'Press Start 2P', monospace;
    font-size: 7px;
    color: var(--text-muted);
    -webkit-font-smoothing: none;
  }

  @media (max-width: 1024px) {
    .main-nav {
      padding: 0 16px;
    }

    .nav-link .nav-label {
      display: none;
    }

    .nav-link {
      padding: 10px;
    }

    .cta-btn .cta-text {
      display: none;
    }

    .cta-btn {
      padding: 10px;
    }
  }

  @media (max-width: 768px) {
    .main-nav {
      flex-direction: column;
      height: auto;
      padding: 12px;
      gap: 12px;
    }

    .nav-menu {
      flex-wrap: wrap;
      justify-content: center;
    }

    .nav-actions {
      width: 100%;
      justify-content: center;
    }

    .brand-text {
      font-size: 9px;
    }
  }

  @media (max-width: 480px) {
    .nav-link {
      padding: 8px 12px;
    }
  }
</style>
