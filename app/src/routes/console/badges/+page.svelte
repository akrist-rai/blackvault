<script>
  import { BADGES } from '$lib/data';
  import { badges } from '$lib/stores';
  $: earned = new Set($badges);
</script>

<svelte:head><title>Badges — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>ACHIEVEMENTS</span>
  <span class="ts-right">{$badges.length} / {BADGES.length} earned</span>
</div>

<main class="page">
  <div class="badge-grid">
    {#each BADGES as b}
      {@const have = earned.has(b.id)}
      <div class="badge-card" class:earned={have}>
        <div class="b-icon">{b.icon}</div>
        <div class="b-name">{b.name}</div>
        <div class="b-desc">{b.desc}</div>
        {#if have}
          <div class="b-status earned-label">EARNED</div>
        {:else}
          <div class="b-status locked-label">LOCKED</div>
        {/if}
      </div>
    {/each}
  </div>
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }
  .page { padding: 28px; }
  .badge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .badge-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 24px; text-align: center;
    transition: border-color .15s; opacity: .5;
  }
  .badge-card.earned { opacity: 1; border-color: color-mix(in srgb, var(--amber) 40%, transparent); }
  .b-icon { font-size: 32px; margin-bottom: 10px; }
  .b-name { font-size: 15px; font-weight: 700; color: var(--bone); margin-bottom: 6px; }
  .b-desc { font-size: 12px; color: var(--ash); line-height: 1.5; margin-bottom: 12px; }
  .b-status { font-size: 10px; font-weight: 700; letter-spacing: .1em; }
  .earned-label { color: var(--amber); }
  .locked-label { color: var(--dim); }
</style>
