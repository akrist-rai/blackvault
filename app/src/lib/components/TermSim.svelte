<script>
  export let cmd = '';
  export let out = '';
  export let onComplete = () => {};

  let state = 'idle'; // idle | typing | printing | done
  let displayCmd = '';
  let displayLines = [];
  let termEl;

  $: outLines = out ? out.trim().split('\n') : [];

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function execute() {
    state = 'typing';
    displayCmd = '';
    displayLines = [];

    for (let i = 0; i < cmd.length; i++) {
      displayCmd += cmd[i];
      await sleep(16 + Math.random() * 22);
    }

    await sleep(180);
    state = 'printing';

    for (const line of outLines) {
      displayLines = [...displayLines, line];
      if (termEl) termEl.scrollTop = termEl.scrollHeight;
      await sleep(50 + Math.random() * 40);
    }

    state = 'done';
    onComplete();
  }

  function reset() {
    state = 'idle';
    displayCmd = '';
    displayLines = [];
  }

  function lineClass(line) {
    if (line.startsWith('[!]')) return 'ln-alert';
    if (line.startsWith('[✓]')) return 'ln-ok';
    if (line.startsWith('[i]')) return 'ln-info';
    return '';
  }
</script>

<div class="term-wrap">
  <div class="term-chrome">
    <span class="dot dot-r"></span>
    <span class="dot dot-y"></span>
    <span class="dot dot-g"></span>
    <span class="term-title">BLACKVAULT — Terminal</span>
  </div>

  <div class="term-body" bind:this={termEl}>
    {#if state !== 'idle'}
      <div class="term-prompt-line">
        <span class="prompt">user@bv:~$</span>
        <span class="cmd-text">{displayCmd}{state === 'typing' ? '█' : ''}</span>
      </div>
    {/if}

    {#each displayLines as line}
      <div class="term-line {lineClass(line)}">{line}</div>
    {/each}

    {#if state === 'idle'}
      <div class="term-idle-line">
        <span class="prompt">user@bv:~$</span>
        <span class="cursor">█</span>
      </div>
    {/if}
  </div>

  <div class="term-footer">
    {#if state === 'idle'}
      <button class="tf-btn tf-exec" on:click={execute}>▶ Execute</button>
      <span class="tf-cmd-preview">{cmd}</span>
    {:else if state === 'typing' || state === 'printing'}
      <span class="tf-running">● Running…</span>
    {:else}
      <span class="tf-done">✓ Command completed</span>
      <button class="tf-btn tf-reset" on:click={reset}>↺ Reset</button>
    {/if}
  </div>
</div>

<style>
  .term-wrap {
    background: #010c0a;
    border: 1px solid color-mix(in srgb, var(--volt) 22%, transparent);
    border-radius: var(--rad);
    overflow: hidden;
    font-family: var(--mono);
    font-size: 12px;
    margin-top: 10px;
  }

  .term-chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    background: #020e0b;
    border-bottom: 1px solid color-mix(in srgb, var(--volt) 12%, transparent);
  }
  .dot {
    width: 9px; height: 9px;
    border-radius: 50%; flex-shrink: 0;
  }
  .dot-r { background: #e53040; }
  .dot-y { background: #e0a020; }
  .dot-g { background: #00d4b8; }
  .term-title {
    font-size: 9px;
    color: var(--ash);
    letter-spacing: .08em;
    margin-left: 4px;
    text-transform: uppercase;
  }

  .term-body {
    padding: 10px 14px;
    min-height: 80px;
    max-height: 260px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .term-prompt-line {
    display: flex;
    gap: 6px;
    line-height: 1.6;
    flex-wrap: wrap;
  }
  .term-idle-line {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .term-line {
    color: #8aada5;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.55;
    padding-left: 2px;
  }
  .term-line.ln-alert { color: var(--blood); }
  .term-line.ln-ok    { color: var(--volt);  }
  .term-line.ln-info  { color: var(--blue);  }

  .prompt { color: var(--volt); font-weight: 700; flex-shrink: 0; }
  .cmd-text { color: var(--bone); word-break: break-all; }

  .cursor {
    color: var(--volt);
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .term-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    background: #020e0b;
    border-top: 1px solid color-mix(in srgb, var(--volt) 12%, transparent);
    min-height: 36px;
    flex-wrap: wrap;
  }

  .tf-btn {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
  }
  .tf-exec {
    background: color-mix(in srgb, var(--volt) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 28%, transparent);
    color: var(--volt);
  }
  .tf-exec:hover { background: color-mix(in srgb, var(--volt) 22%, transparent); }
  .tf-reset {
    background: transparent;
    border: 1px solid var(--line2);
    color: var(--ash);
  }
  .tf-reset:hover { border-color: var(--ash); color: var(--bone); }

  .tf-cmd-preview {
    font-size: 10px;
    color: var(--dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .tf-running {
    font-size: 10px;
    color: var(--amber);
    letter-spacing: .06em;
    animation: pulse 1.1s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .35; }
  }

  .tf-done {
    font-size: 10px;
    color: var(--volt);
    letter-spacing: .04em;
  }
</style>
