<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/stores';

  // Pages that get the full sidebar shell
  $: showSidebar = $page.url.pathname !== '/';
</script>

{#if showSidebar}
  <div class="shell">
    <Sidebar />
    <div class="main-wrap">
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

  @media (max-width: 860px) {
    .shell { flex-direction: column; }
  }
</style>
