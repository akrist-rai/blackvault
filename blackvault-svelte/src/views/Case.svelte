<script>
  import { nav } from '../stores/progress.js';
  import { CASES } from '../data/curriculum.js';

  let caseId = Object.keys(CASES)[0];
  let nodeKey = 'start';
  let good = 0;
  let bad = 0;
  let fb = null;

  $: C = CASES[caseId];
  $: node = C?.nodes?.[nodeKey] || null;

  function restart() {
    nodeKey = 'start';
    good = 0; bad = 0; fb = null;
  }

  function choose(i) {
    if (!node || node.end) return;
    const choice = node.choices[i];
    if (!choice) return;
    if (choice.good) { good++; fb = { good: true, msg: choice.fb || '' }; }
    else             { bad++;  fb = { good: false, msg: choice.fb || '' }; }
    setTimeout(() => { nodeKey = choice.to; fb = null; }, 900);
  }

  function pickCase(id) {
    caseId = id;
    restart();
  }
</script>

<div class="modehead">
  <div class="eyebrow">Synthesis · live incident</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">The Case</h1>
  <p class="lede">An intrusion with no narration. Make the call at each step — good pivots score, missteps cost. Phases 1–11 fused into one reflex.</p>
</div>

<div class="casepick">
  {#each Object.entries(CASES) as [k, c]}
    <button aria-current={caseId === k} on:click={() => pickCase(k)}>{c.label}</button>
  {/each}
</div>

<div class="casebar">
  <span>GOOD PIVOTS: <b>{good}</b></span>
  <span>MISSTEPS: <b style="color:var(--blood)">{bad}</b></span>
  <span><button class="link-btn" on:click={restart}>↻ Restart</button></span>
</div>

{#if node}
  <div class="casewrap">
    <div class="casenode">
      <div class="clock">{node.clock}</div>
      <p>{node.text}</p>

      {#if fb}
        <div class="fb fb--{fb.good ? 'good' : 'bad'}">
          <b>{fb.good ? 'Good call' : 'Misstep'}</b> {fb.msg}
        </div>
      {/if}

      {#if node.end}
        <div style="margin-top:18px;border-top:1px solid var(--line);padding-top:16px">
          <div class="eyebrow" style="color:var(--amber)">Case closed</div>
          <p style="font-size:15px;color:var(--ash)">
            You reconstructed the full chain by pivoting across sources.
            Score: <b style="color:var(--bone)">{good} good pivots, {bad} missteps</b>.
          </p>
          <button class="btn" style="margin-top:6px" on:click={restart}>Run it again ↻</button>
          <button class="iconbtn" style="margin-left:8px"
            on:click={() => nav.update(s => ({ ...s, mode: 'threads' }))}>Review the threads</button>
        </div>
      {:else}
        {#each node.choices as c, i}
          <button class="choice" on:click={() => choose(i)}>{c.label}</button>
        {/each}
      {/if}
    </div>
  </div>
{/if}
