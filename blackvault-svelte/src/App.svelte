<script>
  import TopBar from './components/TopBar.svelte';
  import Toast  from './components/Toast.svelte';
  import { nav } from './stores/progress.js';

  import Map      from './views/Map.svelte';
  import Study    from './views/Study.svelte';
  import Drill    from './views/Drill.svelte';
  import Quiz     from './views/Quiz.svelte';
  import Exam     from './views/Exam.svelte';
  import Review   from './views/Review.svelte';
  import Arsenal  from './views/Arsenal.svelte';
  import Threads  from './views/Threads.svelte';
  import Case     from './views/Case.svelte';
  import Range    from './views/Range.svelte';
</script>

<TopBar />

<main id="app">
  {#if $nav.mode === 'map'}      <Map />
  {:else if $nav.mode === 'study'}   <Study />
  {:else if $nav.mode === 'drill'}   <Drill />
  {:else if $nav.mode === 'quiz'}    <Quiz />
  {:else if $nav.mode === 'exam'}    <Exam />
  {:else if $nav.mode === 'review'}  <Review />
  {:else if $nav.mode === 'arsenal'} <Arsenal />
  {:else if $nav.mode === 'threads'} <Threads />
  {:else if $nav.mode === 'case'}    <Case />
  {:else if $nav.mode === 'range'}   <Range />
  {/if}
</main>

<footer>
  <span>BLACKVAULT // self-directed RE · MA · DFIR track</span>
  <span id="footstat">progress saved locally</span>
</footer>

<Toast />
