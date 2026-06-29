<script>
  import { CASES } from '$lib/data';
  import { cases } from '$lib/stores';

  $: solved = $cases;
  let expanded = null;

  function toggle(id) {
    expanded = expanded === id ? null : id;
  }
</script>

<svelte:head><title>Cases — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>INVESTIGATION CASES</span>
  <span class="ts-right">{Object.values(solved).filter(Boolean).length} / {CASES.length} closed</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>Investigation Cases</h1>
    <p>Full end-to-end investigation scenarios based on real-world intrusion patterns. Each case includes artifacts, IOCs, actor profile, and ATT&CK technique mapping. Work through the evidence to answer the investigative questions and close the case.</p>
  </div>

  <div class="case-list">
    {#each CASES as c}
      {@const done = !!solved[c.id]}
      {@const open = expanded === c.id}
      <div class="case-card" class:done class:open>
        <button class="cc-header" on:click={() => toggle(c.id)}>
          <div class="cc-left">
            <div class="cc-top-row">
              <span class="cc-codename">{c.codename}</span>
              <span class="sev sev-{c.severity === 'CRITICAL' ? 'blood' : 'amber'}">{c.severity}</span>
              {#each c.tracks as t}
                <span class="chip chip-{t === 'DF' ? 'df' : t === 'RE' ? 're' : 'ma'}" style="font-size:9px;padding:1px 5px">{t}</span>
              {/each}
              {#if done}<span class="cc-solved">● CLOSED</span>{/if}
            </div>
            <h2 class="cc-title">{c.title}</h2>
            <div class="cc-meta">
              <span class="cc-actor-lbl">Actor</span> {c.actor}
              <span class="cc-sep">·</span>
              <span class="cc-actor-lbl">Sector</span> {c.sector}
            </div>
          </div>
          <span class="cc-chevron" class:rotated={open}>▼</span>
        </button>

        <div class="cc-body" class:visible={open}>
          <p class="cc-blurb">{c.blurb}</p>

          <div class="cc-detail-grid">
            <div class="cc-detail-block">
              <div class="cd-hd">Key IOCs</div>
              <ul class="ioc-list">
                {#each c.iocs as ioc}
                  <li class="ioc-item"><code>{ioc}</code></li>
                {/each}
              </ul>
            </div>

            <div class="cc-detail-block">
              <div class="cd-hd">Evidence Artifacts</div>
              <ul class="artifact-list">
                {#each c.artifacts as a}
                  <li class="artifact-item"><code>{a}</code></li>
                {/each}
              </ul>
            </div>

            <div class="cc-detail-block cc-full">
              <div class="cd-hd">ATT&CK Techniques</div>
              <div class="ttp-row">
                {#each c.ttps as t}
                  <span class="ttp-chip">{t}</span>
                {/each}
              </div>
            </div>
          </div>

          <div class="cc-questions">
            <div class="cd-hd">Investigative Questions</div>
            <ol class="q-list">
              <li>What was the initial access vector and timestamp? Map to a specific ATT&CK technique.</li>
              <li>Identify all persistence mechanisms installed. List registry keys, scheduled tasks, or services.</li>
              <li>Reconstruct the lateral movement path. Which hosts were compromised and in what order?</li>
              <li>What data was exfiltrated? Estimate volume and identify the exfiltration channel.</li>
              <li>What was the dwell time (initial compromise → first detection)?</li>
            </ol>
          </div>

          <div class="cc-actions">
            <button
              class="cc-btn-solve"
              on:click={() => cases.update(s => ({ ...s, [c.id]: !done }))}
            >
              {done ? 'Reopen Case' : 'Mark as Closed'}
            </button>
          </div>
        </div>
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
    padding: 10px 28px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .page { padding: 28px; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 24px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; }

  .case-list { display: flex; flex-direction: column; gap: 10px; }

  .case-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
    transition: border-color .15s;
  }
  .case-card:hover { border-color: var(--line2); }
  .case-card.done { border-color: color-mix(in srgb, var(--volt) 20%, transparent); }
  .case-card.open { border-color: var(--line2); }

  .cc-header {
    width: 100%; background: none; border: none; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 24px; gap: 16px; text-align: left;
    transition: background .12s;
  }
  .cc-header:hover { background: var(--panel2); }
  .cc-left { flex: 1; min-width: 0; }

  .cc-top-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
  .cc-codename { font-family: var(--mono); font-size: 12px; color: var(--volt); font-weight: 700; letter-spacing: .06em; }
  .sev { font-size: 10px; font-weight: 700; letter-spacing: .08em; }
  .sev-blood { color: var(--blood); }
  .sev-amber { color: var(--amber); }
  .cc-solved { font-size: 10px; color: var(--volt); font-weight: 700; letter-spacing: .08em; margin-left: 4px; }

  .cc-title { font-size: 16px; font-weight: 700; color: var(--bone); margin-bottom: 5px; }
  .cc-meta { font-size: 12px; color: var(--ash); display: flex; gap: 6px; }
  .cc-actor-lbl { font-size: 10px; font-weight: 700; color: var(--dim); text-transform: uppercase; letter-spacing: .06em; }
  .cc-sep { color: var(--dim); }

  .cc-chevron { color: var(--ash); font-size: 11px; flex-shrink: 0; transition: transform .2s; }
  .cc-chevron.rotated { transform: rotate(180deg); }

  .cc-body { display: none; padding: 0 24px 24px; }
  .cc-body.visible { display: block; }

  .cc-blurb { font-size: 14px; color: var(--ash); line-height: 1.7; margin-bottom: 20px; padding-top: 4px; }

  .cc-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .cc-full { grid-column: 1 / -1; }

  .cc-detail-block {
    background: var(--panel2); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 14px 16px;
  }
  .cd-hd { font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: .09em; text-transform: uppercase; margin-bottom: 10px; }

  .ioc-list, .artifact-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 5px; }
  .ioc-item code, .artifact-item code { font-family: var(--mono); font-size: 11px; color: var(--volt); word-break: break-all; }
  .ioc-item::before { content: '⚑ '; color: var(--blood); font-size: 10px; }
  .artifact-item::before { content: '📁 '; font-size: 10px; }

  .ttp-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .ttp-chip {
    font-family: var(--mono); font-size: 11px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 3px 8px; border-radius: 3px;
  }

  .cc-questions {
    background: color-mix(in srgb, var(--amber) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
    border-radius: var(--rad); padding: 14px 16px; margin-bottom: 16px;
  }
  .q-list { padding-left: 18px; display: flex; flex-direction: column; gap: 8px; margin: 0; }
  .q-list li { font-size: 13px; color: var(--ash); line-height: 1.6; }
  .q-list li::marker { color: var(--amber); }

  .cc-actions { display: flex; gap: 10px; }
  .cc-btn-solve {
    padding: 8px 20px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s;
  }
  .cc-btn-solve:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }

  @media (max-width: 700px) { .cc-detail-grid { grid-template-columns: 1fr; } }
</style>
