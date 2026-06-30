<script>
  import { ctf, showToast } from '$lib/stores';
  import { base } from '$app/paths';

  const FILE_PATH = `${base}/files/nightglass_triage.log`;
  const FILE_SHA256 = '1a8aeca42811c5f2374d9a93c375223872d579bef72a848b3dbd7b4cb8537781';

  const STAGES = [
    {
      key: 'field_nightglass_0',
      title: '1 · Decode the EncodedCommand',
      prompt: "The process-creation event for powershell.exe carries a -EncodedCommand argument. PowerShell's -EncodedCommand is always Base64 over UTF-16LE text — decode it that way and read out the literal C2 callback URL (full scheme://host:port/path).",
      hint: "base64 -d on its own gives you raw bytes that look empty/garbled in a terminal because every other byte is 0x00 — that's UTF-16LE. Recode it: `base64 -d nightglass_triage.log_extract | iconv -f utf-16le -t utf-8`, or in Python: `base64.b64decode(s).decode('utf-16-le')`.",
      flag: 'http://cdn-edge-sync.net:8080/beacon',
      placeholder: 'http://...',
    },
    {
      key: 'field_nightglass_1',
      title: '2 · Find the XOR key',
      prompt: 'The same decoded command assigns a single-byte key to a variable right before the network call. Submit it in hex, e.g. 0xNN.',
      hint: "It's sitting in plain sight in the same decoded PowerShell line you already produced for stage 1 — re-read it.",
      flag: '0x5a',
      placeholder: '0x..',
    },
    {
      key: 'field_nightglass_2',
      title: '3 · Recover the memory-carved flag',
      prompt: 'The triage log includes a 19-byte hex dump carved from an RWX memory region with no backing file on disk. XOR every byte against the key from stage 2 and submit the resulting ASCII string.',
      hint: "Python one-liner: `bytes(b ^ 0x5a for b in bytes.fromhex('37 3f 37 3e 2f 37 2a 05 22 35 28 05 3e 3f 39 35 3e 3f 3e'.replace(' ',''))).decode()`",
      flag: 'memdump_xor_decoded',
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
      showToast(solvedCount + 1 === STAGES.length ? 'NIGHTGLASS fully resolved!' : 'Stage cleared', 'success');
    } else {
      wrong = { ...wrong, [stage.key]: true };
    }
  }
</script>

<svelte:head><title>Field Exercise: NIGHTGLASS — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span><a href="{base}/console/range">Range</a> / Field Exercise — NIGHTGLASS</span>
  <span class="ts-right">{solvedCount}/{STAGES.length} stages</span>
</div>

<main class="page">
  <div class="hero">
    <span class="hero-tag">LIVE ARTIFACT — REAL FILE, YOUR OWN MACHINE</span>
    <h1>Case NIGHTGLASS — Memory-Resident PowerShell Stager</h1>
    <p class="hero-sub">
      Every other Range lab simulates terminal output in the browser. This one doesn't — you download
      a real triage log and run real commands on your own hardware (or any sandboxed VM you trust) to pull
      three real answers out of it. Nothing on this page does the decoding for you.
    </p>
    <div class="hero-pbar"><div class="hero-pfill" style="width:{Math.round(solvedCount/STAGES.length*100)}%"></div></div>
    <div class="hero-plabel">{solvedCount}/{STAGES.length} stages solved{allSolved ? ' — exercise complete' : ''}</div>
  </div>

  <section class="teach">
    <h2>Background</h2>
    <p>
      A phishing email delivered <code>Q3_Invoice_Adjustment.docm</code> to a finance workstation.
      Opening it and enabling macros spawned <code>powershell.exe</code> with a <code>-EncodedCommand</code>
      argument — a technique mapped to <strong>T1059.001</strong> (PowerShell) and <strong>T1027</strong>
      (Obfuscated Files or Information). The host's EDR captured the process tree, the network beacon to a
      remote host, and carved a short byte sequence out of an unbacked RWX memory region before the process
      was killed. That capture — and nothing else — is what you're downloading below.
    </p>
    <p>
      Two real-world facts make this exercise work the way a real triage does:
    </p>
    <ul class="teach-list">
      <li><strong>-EncodedCommand is always UTF-16LE.</strong> PowerShell encodes the command as UTF-16LE
        text before Base64-ing it, every time, on every Windows host. Decode the Base64 first, then read the
        result as UTF-16LE — not UTF-8 — or you'll get a string that looks like garbage with null bytes
        between every character.</li>
      <li><strong>Single-byte XOR is the most common "obfuscation" in commodity malware</strong> precisely
        because it's cheap to implement in shellcode and defeats naive string scanning. Once you have the
        key — and it's almost always sitting in plaintext somewhere near the encoded blob, because the
        operator needs the loader to know it too — recovering the plaintext is one line of code.</li>
    </ul>
  </section>

  <section class="download-box">
    <h2>Download the artifact</h2>
    <p>This is a synthetic, inert text file — safe to open in any editor, no execution involved.</p>
    <div class="dl-row">
      <a class="dl-btn" href={FILE_PATH} download>⬇ nightglass_triage.log</a>
      <div class="dl-meta">
        <span class="dl-meta-lbl">SHA-256</span>
        <code class="dl-hash">{FILE_SHA256}</code>
      </div>
    </div>
    <p class="dl-note">
      Verify it before you trust it — exactly what you'd do with a real evidence file:
      <code>sha256sum nightglass_triage.log</code> and compare against the hash above.
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
          {#if wrong[stage.key]}<div class="stage-wrong">Incorrect — re-check the decoding step, the answer comes from the file, not a guess.</div>{/if}
          {#if showHint[stage.key]}<div class="stage-hint">{stage.hint}</div>{/if}
        {/if}
      </div>
    {/each}
  </section>

  {#if allSolved}
    <div class="done-banner">
      <span class="done-icon">★</span>
      Case NIGHTGLASS closed. You decoded a real Base64/UTF-16LE PowerShell stager and recovered a
      single-byte-XOR-obfuscated payload from a memory carve — the same two techniques you'll see in the
      overwhelming majority of real commodity-malware triage work.
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
