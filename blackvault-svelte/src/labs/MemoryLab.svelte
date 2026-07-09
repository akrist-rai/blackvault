<script>
  import { tick } from 'svelte';
  import { progress, setObj } from '../stores/progress.js';

  const banner = () => [
    { kind: 'dim', text: 'vol3 on a Win10 image. A process is hidden by DKOM (unlinked from the active list).' },
    { kind: 'dim', text: 'Diff pslist vs psscan, then inspect its VADs. Try: pslist · psscan · vadinfo <pid> · disasm <addr> · help' },
    { kind: '', text: '' },
  ];
  let lines = banner();
  let cmdVal = '';
  let outEl;

  async function scrollDown() { await tick(); if (outEl) outEl.scrollTop = outEl.scrollHeight; }

  function run(raw) {
    const c = raw.trim();
    if (!c) return;
    const out = [{ kind: 'cmd', text: c }];
    const push = (kind, text) => out.push({ kind, text });
    if (c === 'help') push('', 'pslist · psscan · vadinfo <pid> · disasm <addr> · clear');
    else if (c === 'pslist') ['  PID   Name', '  4     System', '  812   explorer.exe', '  1188  svchost.exe', '  2440  chrome.exe'].forEach(t => push('', t));
    else if (c === 'psscan') {
      ['  PID   Name', '  4     System', '  812   explorer.exe', '  1188  svchost.exe', '  2440  chrome.exe'].forEach(t => push('', t));
      push('hl', '  3133  svchost.exe   ← in pool scan but NOT in pslist (unlinked / DKOM)');
      setObj('memory', 'hidden', progress);
    } else if (/^vadinfo\s+3133$/.test(c)) {
      push('', 'VAD for pid 3133:');
      push('hl', '  0x009a0000 - 0x009a3fff  PAGE_EXECUTE_READWRITE  Private');
      push('dim', '  RWX private region in a "svchost" = injected code.');
      setObj('memory', 'rwx', progress);
    } else if (/^vadinfo\s+\d+$/.test(c)) {
      push('', '  (normal image-backed VADs, no RWX)');
    } else if (/^disasm\s+0x?9a0000$/.test(c.replace(/\s+/g, ' '))) {
      push('', '  0x9a0000  fc            cld');
      push('', '  0x9a0001  e8 82 00 00 00  call 0x9a0088');
      push('', '  0x9a0006  60            pushad');
      push('', '  0x9a0007  31 d2         xor edx,edx');
      push('hl', '    → classic API-hashing shellcode prologue (Metasploit-style)');
      setObj('memory', 'shellcode', progress);
    } else if (c === 'clear') {
      lines = banner(); cmdVal = ''; scrollDown(); return;
    } else {
      push('err', c.split(/\s+/)[0] + ': unknown (type help)');
    }
    out.push({ kind: '', text: '' });
    lines = [...lines, ...out];
    cmdVal = '';
    scrollDown();
  }

  function onKeydown(e) { if (e.key === 'Enter') run(cmdVal); }
  const chips = ['pslist', 'psscan', 'vadinfo 3133', 'disasm 0x9a0000'];
</script>

<div class="term">
  <div class="term__out" bind:this={outEl}>
    {#each lines as l}
      {#if l.kind === 'cmd'}
        <div><span class="pmt">vol&gt;</span> {l.text}</div>
      {:else if l.kind}
        <div class={l.kind}>{l.text}</div>
      {:else}
        <div>{l.text}</div>
      {/if}
    {/each}
  </div>
  <div class="term__in">
    <span>vol&gt;</span>
    <div class="term-input-wrapper"><input autocomplete="off" spellcheck="false" placeholder="diff pslist vs psscan…" bind:value={cmdVal} on:keydown={onKeydown}></div>
  </div>
</div>
<div class="qchips">{#each chips as c}<button on:click={() => cmdVal = c}>{c}</button>{/each}</div>
<div class="hintbox"><b>DKOM detection:</b> rootkits unlink the malicious EPROCESS from the doubly-linked active list, so <code>pslist</code> can't see it — but <code>psscan</code> finds the block by scanning pool tags. The diff is the giveaway; then RWX VADs reveal where the code lives.</div>
