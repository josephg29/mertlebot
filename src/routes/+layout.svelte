<script>
  import '../app.css';
  import Navigation from '$lib/components/Navigation.svelte';

  const { children } = $props();
</script>

<Navigation />
<main class="site-content">
  {@render children()}
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
