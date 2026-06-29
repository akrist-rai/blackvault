<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';

  $: showSidebar = $page.url.pathname !== '/';

  let sidebarOpen = false;

  afterNavigate(() => {
    sidebarOpen = false;
  });
</script>

{#if showSidebar}
  <div class="shell">
    <Sidebar bind:open={sidebarOpen} on:close={() => (sidebarOpen = false)} />

    <div class="main-wrap">
      <header class="mobile-header">
        <button
          class="hamburger"
          on:click={() => (sidebarOpen = !sidebarOpen)}
          aria-label="Toggle navigation"
          aria-expanded={sidebarOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span class="mobile-brand">BLACK<em>VAULT</em></span>
      </header>

      <slot />
    </div>
  </div>
{:else}
  <slot />
{/if}

<Toast />

<style>
  .shell {
    display: flex;
    min-height: 100dvh;
  }
  .main-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .mobile-header {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 50px;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    z-index: 100;
    flex-shrink: 0;
  }
  .mobile-brand {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--bone);
  }
  .mobile-brand em {
    font-style: normal;
    color: var(--volt);
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 36px;
    height: 36px;
    padding: 6px;
    border-radius: var(--rad);
    background: none;
    border: 1px solid var(--line2);
    cursor: pointer;
    flex-shrink: 0;
  }
  .hamburger:hover { border-color: var(--ash); background: var(--panel2); }
  .hamburger span {
    display: block;
    height: 2px;
    background: var(--ash);
    border-radius: 1px;
    transition: background .15s;
  }
  .hamburger:hover span { background: var(--bone); }

  @media (max-width: 860px) {
    .mobile-header { display: flex; }
  }
</style>
