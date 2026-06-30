<script>
  import { CASES } from '$lib/data';
  import { cases, caseFlags, showToast } from '$lib/stores';

  $: solved = $cases;
  $: flagState = $caseFlags;
  let expanded = null;
  let inputs = {};
  let wrong = {};

  function toggle(id) {
    expanded = expanded === id ? null : id;
  }

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function submitChal(caseId, idx, flag) {
    const key = `${caseId}_${idx}`;
    const val = normalizeFlag(inputs[key]);
    if (val === flag.toLowerCase()) {
      wrong = { ...wrong, [key]: false };
      caseFlags.update(s => {
        const next = { ...s, [caseId]: { ...(s[caseId] || {}), [idx]: true } };
        const c = CASES.find(x => x.id === caseId);
        const allDone = c.chals.every((_, i) => next[caseId]?.[i]);
        if (allDone) {
          cases.update(cs => ({ ...cs, [caseId]: true }));
          showToast(`Case ${c.codename} closed — all flags captured`, 'success');
        } else {
          showToast('Flag captured', 'success');
        }
        return next;
      });
    } else {
      wrong = { ...wrong, [key]: true };
    }
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
    <p>Full end-to-end investigation scenarios based on real-world intrusion patterns. Read the actor profile, IOCs, and evidence artifacts, then submit BV{'{'}...{'}'} flags derived from the case facts. A case auto-closes once every flag is captured — no self-reporting.</p>
    <div class="intro-pbar"><div class="intro-pfill" style="width:{Math.round(Object.values(solved).filter(Boolean).length / CASES.length * 100)}%"></div></div>
    <div class="intro-plabel">{Object.values(solved).filter(Boolean).length}/{CASES.length} cases closed</div>
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

          <div class="cc-challenges">
            <div class="cd-hd">Flag Challenges — close the case</div>
            {#each c.chals as chal, i}
              {@const key = `${c.id}_${i}`}
              {@const got = !!(flagState[c.id]?.[i])}
              <div class="chal" class:chal-solved={got}>
                <div class="chal-q"><span class="chal-num">{i + 1}.</span> {chal.q}</div>
                {#if got}
                  <div class="chal-solved-row">
                    <span class="chal-icon">✓</span>
                    <code class="chal-flag">BV{'{'}{chal.flag}{'}'}</code>
                  </div>
                {:else}
                  <form class="chal-form" on:submit|preventDefault={() => submitChal(c.id, i, chal.flag)}>
                    <input
                      class="chal-input"
                      type="text"
                      placeholder={'BV{...}'}
                      autocomplete="off"
                      spellcheck="false"
                      bind:value={inputs[key]}
                    />
                    <button class="chal-submit" type="submit">Submit</button>
                  </form>
                  {#if wrong[key]}<div class="chal-wrong">Incorrect — re-read the brief above and try again.</div>{/if}
                {/if}
              </div>
            {/each}
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
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .intro-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .intro-pfill { height: 100%; background: var(--blood); border-radius: 2px; transition: width .5s ease; box-shadow: 0 0 14px color-mix(in srgb, var(--blood) 30%, transparent); }
  .intro-plabel { font-size: 11px; color: var(--ash); letter-spacing: .04em; }

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

  .cc-challenges {
    background: color-mix(in srgb, var(--amber) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
    border-radius: var(--rad); padding: 16px 18px; margin-bottom: 4px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .cc-challenges .cd-hd { margin-bottom: 2px; }

  .chal {
    border-top: 1px solid color-mix(in srgb, var(--amber) 14%, transparent);
    padding-top: 12px;
  }
  .chal:first-of-type { border-top: none; padding-top: 0; }
  .chal-q { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 8px; }
  .chal-num { color: var(--amber); font-weight: 700; margin-right: 2px; }

  .chal-form { display: flex; gap: 8px; }
  .chal-input {
    flex: 1; min-width: 0;
    background: var(--void); border: 1px solid var(--line);
    color: var(--bone); font-family: var(--mono); font-size: 12px;
    padding: 8px 10px; border-radius: var(--rad);
    transition: border-color .15s;
  }
  .chal-input:focus { outline: none; border-color: var(--volt); }
  .chal-submit {
    padding: 8px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s; flex-shrink: 0;
  }
  .chal-submit:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }
  .chal-wrong { font-size: 12px; color: var(--blood); margin-top: 6px; }

  .chal-solved-row { display: flex; align-items: center; gap: 8px; }
  .chal-icon { color: var(--volt); font-weight: 700; }
  .chal-flag {
    font-family: var(--mono); font-size: 12px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 4px 10px; border-radius: 3px;
  }

  @media (max-width: 700px) { .cc-detail-grid { grid-template-columns: 1fr; } }
</style>
