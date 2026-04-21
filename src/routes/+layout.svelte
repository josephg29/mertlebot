<script>
  import '../app.css';
  import Navigation from '$lib/components/Navigation.svelte';
  import { initAuth, authStore } from '$lib/auth-store.js';
  import { onMount } from 'svelte';
  
  const { children } = $props();
  
  onMount(() => {
    initAuth();
  });
  
  // Export auth store for use in pages
  export let data;
  $: auth = $authStore;
</script>

<Navigation {auth} />
<main class="site-content">
  {@render children({ auth })}
</main>

<style>
  .site-content {
    flex: 1;
    overflow: auto;
  }
  
  :global(body) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: auto;
  }
  
  :global(html) {
    overflow: auto;
  }
</style>