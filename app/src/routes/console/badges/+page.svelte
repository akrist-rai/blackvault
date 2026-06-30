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
  <div class="badge-intro">
    <h1>Achievements</h1>
    <p>Badges are earned automatically as you capture flags and pass phases elsewhere on the platform — nothing to self-report here.</p>
    <div class="badge-pbar"><div class="badge-pfill" style="width:{Math.round($badges.length / BADGES.length * 100)}%"></div></div>
  </div>

  <div class="badge-grid">
    {#each BADGES as b}
      {@const have = earned.has(b.id)}
      <div class="badge-card" class:earned={have}>
        <div class="b-icon-wrap" class:earned={have}><div class="b-icon">{b.icon}</div></div>
        <div class="b-name">{b.name}</div>
        <div class="b-desc">{b.desc}</div>
        {#if have}
          <div class="b-status earned-label">● EARNED</div>
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

  .badge-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 24px 28px; margin-bottom: 24px;
  }
  .badge-intro h1 { font-size: 18px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .badge-intro p { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 14px; }
  .badge-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; }
  .badge-pfill { height: 100%; background: var(--amber); border-radius: 2px; transition: width .5s ease; box-shadow: var(--glow-amber); }

  .badge-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .badge-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 26px 22px; text-align: center;
    transition: border-color .15s, transform .15s, opacity .15s; opacity: .5;
  }
  .badge-card.earned {
    opacity: 1;
    border-color: color-mix(in srgb, var(--amber) 40%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--amber) 12%, transparent) inset;
  }
  .badge-card.earned:hover { transform: translateY(-2px); border-color: var(--amber); }

  .b-icon-wrap {
    width: 56px; height: 56px; margin: 0 auto 12px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; background: var(--panel2); border: 1px solid var(--line);
  }
  .b-icon-wrap.earned {
    background: color-mix(in srgb, var(--amber) 10%, transparent);
    border-color: color-mix(in srgb, var(--amber) 35%, transparent);
    box-shadow: var(--glow-amber);
  }
  .b-icon { font-size: 28px; }
  .b-name { font-size: 15px; font-weight: 700; color: var(--bone); margin-bottom: 6px; }
  .b-desc { font-size: 12px; color: var(--ash); line-height: 1.5; margin-bottom: 12px; }
  .b-status { font-size: 10px; font-weight: 700; letter-spacing: .1em; }
  .earned-label { color: var(--amber); }
  .locked-label { color: var(--dim); }

  @media (max-width: 800px) { .badge-grid { grid-template-columns: 1fr 1fr; } }
</style>
