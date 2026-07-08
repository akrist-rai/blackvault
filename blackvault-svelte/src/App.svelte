<script>
  import TopBar from './components/TopBar.svelte';
  import Toast  from './components/Toast.svelte';
  import { nav } from './stores/progress.js';

  import Map     from './views/Map.svelte';
  import Study   from './views/Study.svelte';
  import Arsenal from './views/Arsenal.svelte';
  import Threads from './views/Threads.svelte';
  import Case    from './views/Case.svelte';
  import Range   from './views/Range.svelte';
</script>

<TopBar />

<main id="main">
  {#if $nav.mode === 'map'}      <Map />
  {:else if $nav.mode === 'study'}   <Study />
  {:else if $nav.mode === 'arsenal'} <Arsenal />
  {:else if $nav.mode === 'threads'} <Threads />
  {:else if $nav.mode === 'case'}    <Case />
  {:else if $nav.mode === 'range'}   <Range />
  {/if}
</main>

<footer>
  <span>SANCTION // RE · MA · DFIR</span>
  <span id="footstat">progress saved locally</span>
</footer>

<Toast />
