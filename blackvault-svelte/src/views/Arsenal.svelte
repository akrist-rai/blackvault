<script>
  import { PHASES } from '../data/curriculum.js';
  import { toast } from '../stores/progress.js';
  import { ARSENAL_STRIP, imageUrl } from '../data/images.js';

  const STRIP = [...ARSENAL_STRIP, ...ARSENAL_STRIP];

  let search = '';

  $: filtered = search.trim()
    ? PHASES.map(p => ({
        ...p,
        commands: p.commands.filter(c =>
          c.c.toLowerCase().includes(search.toLowerCase()) ||
          c.d.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(p => p.commands.length)
    : PHASES;

  function copyCmd(text) {
    navigator.clipboard?.writeText(text).then(() => toast('✓ copied'));
  }

  function accentOf(tracks) {
    const A = { DF: 'var(--amber)', RE: 'var(--volt)', MA: 'var(--blood)' };
    return tracks.length > 1 ? 'var(--bone)' : (A[tracks[0]] || 'var(--bone)');
  }
</script>

<div class="modehead">
  <div class="eyebrow">Command reference</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Arsenal</h1>
  <p class="lede">Every command from every phase. Tap to copy.</p>
</div>

<div class="imgstrip-wrap" aria-hidden="true">
  <div class="imgstrip">
    {#each STRIP as img}
      <div class="imgstrip__tile">
        <img src={imageUrl(img)} alt="" loading="lazy" />
      </div>
    {/each}
  </div>
</div>

<div class="searchbar" style="margin-bottom:24px">
  <input class="searchinput" placeholder="Filter commands…" bind:value={search} />
</div>

{#each filtered as p}
  {@const ac = accentOf(p.tracks)}
  <div style="margin-bottom:28px">
    <div class="sec__h" style="color:{ac};margin-bottom:10px">
      PHASE {String(p.n).padStart(2,'0')} · {p.title}
    </div>
    {#each p.commands as c}
      <div class="cmd" on:click={() => copyCmd(c.c)} style="cursor:pointer">
        <code>{c.c}</code>
        <span>{c.d}</span>
      </div>
    {/each}
  </div>
{/each}

{#if filtered.length === 0}
  <div class="emptybox"><b>No commands match</b> "{search}"</div>
{/if}
