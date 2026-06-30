<script>
  import { ctf, showToast } from '$lib/stores';
  import { base } from '$app/paths';

  const FILE_PATH = `${base}/files/venomquill_static_report.log`;
  const FILE_SHA256 = 'b8a2d6602633c67debe6c4d178f1bd270c4226ae0008b327167e48e93b4bfacf';

  const STAGES = [
    {
      key: 'field_venomquill_0',
      title: '1 · Confirm packing by entropy',
      prompt: 'REGION_A is a 256-byte dump from the non-standard ".venomq" section. Compute its Shannon entropy (H = -Σ p·log2(p) over the byte histogram) and submit it rounded DOWN to the nearest whole number, 0-8.',
      hint: "Python: from collections import Counter; import math; data=bytes.fromhex('...'); c=Counter(data); n=len(data); h=-sum((v/n)*math.log2(v/n) for v in c.values()); print(int(h))",
      flag: '7',
      placeholder: '0-8',
    },
    {
      key: 'field_venomquill_1',
      title: '2 · Brute-force the XOR key',
      prompt: 'A 19-byte string was carved from .venomq right after REGION_A. No key is given — try all 256 single-byte keys and keep the one that decodes to all-printable uppercase letters, digits, and underscores. Submit the recovered mutex string.',
      hint: "Python: for k in range(256): d=bytes(b^k for b in data); -- check d.decode('ascii') is alnum/underscore only, print the one that passes.",
      flag: 'wormclaw_mutex_8841',
      placeholder: 'MUTEX_NAME',
    },
    {
      key: 'field_venomquill_2',
      title: '3 · Decode the config block',
      prompt: 'Malware builder kits almost always reuse the same XOR key across every embedded resource. Apply the key you just recovered to the 27-byte CONFIG BLOCK and submit the decoded ASCII flag.',
      hint: 'Same XOR loop as stage 2, same key, different hex bytes — no new technique needed.',
      flag: 'entropy_and_xor_brute_force',
      placeholder: 'BV{...}',
    },
  ];

  $: solved = $ctf;
  $: solvedCount = STAGES.filter(s => solved[s.key]).length;
  $: allSolved = solvedCount === STAGES.length;

  let inputs = {};
  let wrong = {};
  let showHint = {};

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function submit(stage) {
    const val = normalizeFlag(inputs[stage.key]);
    if (val === normalizeFlag(stage.flag)) {
      wrong = { ...wrong, [stage.key]: false };
      ctf.update(s => ({ ...s, [stage.key]: true }));
      showToast(solvedCount + 1 === STAGES.length ? 'VENOMQUILL fully resolved!' : 'Stage cleared', 'success');
    } else {
      wrong = { ...wrong, [stage.key]: true };
    }
  }
</script>

<svelte:head><title>Field Exercise: VENOMQUILL — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span><a href="{base}/console/range">Range</a> / Field Exercise — VENOMQUILL</span>
  <span class="ts-right">{solvedCount}/{STAGES.length} stages</span>
</div>

<main class="page">
  <div class="hero">
    <span class="hero-tag">LIVE ARTIFACT — STATIC MALWARE ANALYSIS</span>
    <h1>Case VENOMQUILL — Packed Dropper, Static Triage</h1>
    <p class="hero-sub">
      No network logs, no memory dumps — just the raw bytes of a suspicious binary's sections, the way
      a sample lands on an analyst's desk before anyone runs it. Download the worksheet and do the same
      static-analysis pass a real triage would: entropy first, then string recovery, on your own machine.
    </p>
    <div class="hero-pbar"><div class="hero-pfill" style="width:{Math.round(solvedCount/STAGES.length*100)}%"></div></div>
    <div class="hero-plabel">{solvedCount}/{STAGES.length} stages solved{allSolved ? ' — exercise complete' : ''}</div>
  </div>

  <section class="teach">
    <h2>Background</h2>
    <p>
      <code>vc_update_svc.bin</code> showed up in a software-update quarantine bucket. Before anyone
      executes it — sandboxed or not — static triage answers two questions: is it packed or encrypted
      (so dynamic analysis won't see the real code), and can anything be recovered from it without
      running it at all. Both questions are answered with the same two techniques real analysts reach
      for first, every time: <strong>entropy measurement</strong> and <strong>XOR key recovery</strong>.
    </p>
    <ul class="teach-list">
      <li><strong>Entropy flags packing before you've read a single instruction.</strong> Legitimate
        compiler-emitted code clusters around 4.5-6.5 bits/byte because instruction encodings and padding
        repeat. Packed, encrypted, or compressed regions look statistically indistinguishable from random
        noise — entropy climbs toward the theoretical max of 8.0. Tools like <code>capa</code>,
        <code>Detect It Easy</code>, and <code>PEiD</code> all run this exact check as their first pass.</li>
      <li><strong>Single-byte XOR has no secret-key step</strong> — there are only 256 possible keys, so
        brute force isn't a shortcut, it <em>is</em> the technique. Try every key, keep whichever output
        is printable. It works because malware builder kits are built for speed, not cryptographic
        rigor, and they near-universally reuse one key across every embedded string and resource.</li>
    </ul>
  </section>

  <section class="download-box">
    <h2>Download the artifact</h2>
    <p>A synthetic, inert text worksheet — safe to open in any editor, no execution involved.</p>
    <div class="dl-row">
      <a class="dl-btn" href={FILE_PATH} download>⬇ venomquill_static_report.log</a>
      <div class="dl-meta">
        <span class="dl-meta-lbl">SHA-256</span>
        <code class="dl-hash">{FILE_SHA256}</code>
      </div>
    </div>
    <p class="dl-note">
      Verify before you trust it: <code>sha256sum venomquill_static_report.log</code> and compare against
      the hash above — standard evidence-handling practice for any artifact that crosses your desk.
    </p>
  </section>

  <section class="stages">
    <h2>Stages</h2>
    {#each STAGES as stage}
      {@const got = !!solved[stage.key]}
      <div class="stage" class:stage-solved={got}>
        <div class="stage-hd">{stage.title}</div>
        <p class="stage-prompt">{stage.prompt}</p>
        {#if got}
          <div class="stage-solved-row">
            <span class="stage-icon">✓</span>
            <code class="stage-flag">{stage.flag}</code>
          </div>
        {:else}
          <form class="stage-form" on:submit|preventDefault={() => submit(stage)}>
            <input
              class="stage-input"
              type="text"
              placeholder={stage.placeholder}
              autocomplete="off"
              spellcheck="false"
              bind:value={inputs[stage.key]}
            />
            <button class="stage-submit" type="submit">Submit</button>
            <button type="button" class="stage-hintbtn" on:click={() => showHint = {...showHint, [stage.key]: !showHint[stage.key]}}>
              {showHint[stage.key] ? 'Hide hint' : 'Hint'}
            </button>
          </form>
          {#if wrong[stage.key]}<div class="stage-wrong">Incorrect — re-check the computation, the answer comes from the file, not a guess.</div>{/if}
          {#if showHint[stage.key]}<div class="stage-hint">{stage.hint}</div>{/if}
        {/if}
      </div>
    {/each}
  </section>

  {#if allSolved}
    <div class="done-banner">
      <span class="done-icon">★</span>
      Case VENOMQUILL closed. You ran the same first-pass static analysis a real malware analyst runs on
      every unknown sample: entropy to flag packing, brute-force XOR to recover strings without ever
      touching a disassembler.
      <a href="{base}/console/range" class="done-link">← Back to Range</a>
    </div>
  {/if}
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
  .topstrip a { color: var(--ash); }
  .topstrip a:hover { color: var(--volt); text-decoration: none; }
  .ts-right { color: var(--volt); }

  .page { padding: 28px; max-width: 920px; }

  .hero {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 24px;
  }
  .hero-tag {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .1em;
    color: var(--amber); border: 1px solid color-mix(in srgb, var(--amber) 35%, transparent);
    background: color-mix(in srgb, var(--amber) 8%, transparent);
    padding: 4px 10px; border-radius: 20px; margin-bottom: 14px;
  }
  .hero h1 { font-size: 21px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .hero-sub { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 18px; }
  .hero-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .hero-pfill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .5s ease; box-shadow: var(--glow-volt); }
  .hero-plabel { font-size: 11px; color: var(--ash); letter-spacing: .04em; }

  .teach, .download-box, .stages { margin-bottom: 24px; }
  .teach h2, .download-box h2, .stages h2 {
    font-size: 14px; font-weight: 700; color: var(--bone);
    letter-spacing: .04em; margin-bottom: 12px;
  }
  .teach p { font-size: 13px; color: var(--ash); line-height: 1.7; margin-bottom: 12px; }
  .teach code { font-family: var(--mono); color: var(--volt); font-size: 12px; }
  .teach-list { padding-left: 18px; display: flex; flex-direction: column; gap: 10px; }
  .teach-list li { font-size: 13px; color: var(--ash); line-height: 1.6; }
  .teach-list strong { color: var(--bone); }

  .download-box {
    background: color-mix(in srgb, var(--volt) 5%, var(--panel));
    border: 1px solid color-mix(in srgb, var(--volt) 22%, var(--line));
    border-radius: var(--rad); padding: 22px 26px;
  }
  .download-box p { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 14px; }
  .download-box code { font-family: var(--mono); color: var(--bone); font-size: 12px; }
  .dl-row { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-bottom: 12px; }
  .dl-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: var(--rad);
    background: color-mix(in srgb, var(--volt) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 40%, transparent);
    color: var(--volt); font-weight: 700; font-size: 13px;
  }
  .dl-btn:hover { background: color-mix(in srgb, var(--volt) 26%, transparent); text-decoration: none; }
  .dl-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .dl-meta-lbl { font-size: 10px; color: var(--dim); letter-spacing: .08em; text-transform: uppercase; }
  .dl-hash { font-size: 11px; color: var(--ash); word-break: break-all; }
  .dl-note { font-size: 12px; color: var(--dim); margin-bottom: 0; }

  .stage {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 18px 22px; margin-bottom: 12px;
  }
  .stage.stage-solved { border-color: color-mix(in srgb, var(--volt) 30%, var(--line)); }
  .stage-hd { font-size: 14px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .stage-prompt { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 12px; }

  .stage-form { display: flex; gap: 8px; flex-wrap: wrap; }
  .stage-input {
    flex: 1; min-width: 200px;
    background: var(--void); border: 1px solid var(--line);
    color: var(--bone); font-family: var(--mono); font-size: 12px;
    padding: 9px 12px; border-radius: var(--rad);
  }
  .stage-input:focus { outline: none; border-color: var(--volt); }
  .stage-submit {
    padding: 9px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0;
  }
  .stage-submit:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }
  .stage-hintbtn {
    padding: 9px 14px;
    background: transparent; border: 1px solid var(--line2);
    color: var(--ash); border-radius: var(--rad);
    font-size: 12px; cursor: pointer; flex-shrink: 0;
  }
  .stage-hintbtn:hover { border-color: var(--amber); color: var(--amber); }
  .stage-wrong { font-size: 12px; color: var(--blood); margin-top: 8px; }
  .stage-hint { font-size: 12px; color: var(--amber); margin-top: 10px; line-height: 1.6; font-family: var(--mono); }

  .stage-solved-row { display: flex; align-items: center; gap: 8px; }
  .stage-icon { color: var(--volt); font-weight: 700; }
  .stage-flag {
    font-family: var(--mono); font-size: 12px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 4px 10px; border-radius: 3px;
  }

  .done-banner {
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    border-radius: var(--rad); padding: 16px 22px;
    font-size: 13px; color: var(--bone); line-height: 1.6;
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .done-icon { font-size: 18px; color: var(--volt); flex-shrink: 0; }
  .done-link { margin-left: auto; color: var(--volt); font-size: 12px; }
</style>
