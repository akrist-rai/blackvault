<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  let active = 'decode_config';
  let fnName = 'FUN_00401500';
  let renaming = null; // 'fn' | 'f0' | 'f8' | 'f10' | null
  let renameVal = '';

  let f0 = 'undefined4', f8 = 'undefined8', f10 = 'undefined4';

  $: done = $progress.labs?.ghidra || {};

  function startRename(which, current) { renaming = which; renameVal = current; }
  function commitRename() {
    const v = renameVal.trim();
    if (!v) { renaming = null; return; }
    if (renaming === 'fn') {
      fnName = v;
      if (/xor|decrypt|decode/i.test(v)) { setObj('ghidra', 'logic', progress); toast('✓ that name fits — it XOR-decrypts in place'); }
      else toast('rename it to what it actually does');
    } else if (renaming === 'f0') {
      f0 = v; checkStruct();
    } else if (renaming === 'f8') {
      f8 = v; checkStruct();
    } else if (renaming === 'f10') {
      f10 = v; checkStruct();
    }
    renaming = null;
  }
  function checkStruct() {
    const ok0 = /id|key/i.test(f0), ok8 = /name|ptr|str/i.test(f8), ok10 = /flag/i.test(f10);
    if (ok0 && ok8 && ok10) { setObj('ghidra', 'struct', progress); toast('✓ struct recovered — every access now reads as a named field'); }
  }
  function followXref() {
    active = 'xor_fn';
    setObj('ghidra', 'xref', progress);
  }
</script>

<div class="funclist">
  <button aria-current={active === 'decode_config'} on:click={() => active = 'decode_config'}>decode_config</button>
  <button aria-current={active === 'xor_fn'} on:click={() => active = 'xor_fn'}>{fnName}</button>
</div>

{#if active === 'decode_config'}
  <div class="repane">
    <h5>decompiler — decode_config</h5>
    <pre class="pcode">void decode_config(char *cfg) {'{'}
    int len = <span class="xreflink" on:click={followXref}>{fnName}</span>(cfg);
    apply_settings(cfg, len);
{'}'}</pre>
  </div>
  <div class="hintbox">Click the highlighted call to jump to the function it references — that's an xref.</div>
{:else}
  <div class="repane">
    <h5>decompiler —
      {#if renaming === 'fn'}
        <span class="renamebox"><input bind:value={renameVal} on:keydown={e => e.key === 'Enter' && commitRename()} on:blur={commitRename} autofocus></span>
      {:else}
        <span class="xreflink" on:click={() => startRename('fn', fnName)}>{fnName}</span>
      {/if}
    </h5>
    <pre class="pcode">int {fnName}(char *param_1) {'{'}
    int local_c = 0;
    while (param_1[local_c] != 0) {'{'}
        param_1[local_c] = param_1[local_c] ^ 0x2a;
        local_c = local_c + 1;
    {'}'}
    return local_c;
{'}'}</pre>
  </div>
  <div class="hintbox" style="margin-bottom:14px"><b>Rename it:</b> click the function name above and give it a name that matches what the loop actually does.</div>

  <div class="repane">
    <h5>same pointer, accessed elsewhere in the binary</h5>
    <pre class="pcode">*(int    *)(p + 0x0)   →  {#if renaming === 'f0'}<span class="renamebox"><input bind:value={renameVal} on:keydown={e => e.key === 'Enter' && commitRename()} on:blur={commitRename} autofocus></span>{:else}<span class="xreflink" on:click={() => startRename('f0', f0)}>{f0}</span>{/if}
*(char  **)(p + 0x8)   →  {#if renaming === 'f8'}<span class="renamebox"><input bind:value={renameVal} on:keydown={e => e.key === 'Enter' && commitRename()} on:blur={commitRename} autofocus></span>{:else}<span class="xreflink" on:click={() => startRename('f8', f8)}>{f8}</span>{/if}
*(int    *)(p + 0x10)  →  {#if renaming === 'f10'}<span class="renamebox"><input bind:value={renameVal} on:keydown={e => e.key === 'Enter' && commitRename()} on:blur={commitRename} autofocus></span>{:else}<span class="xreflink" on:click={() => startRename('f10', f10)}>{f10}</span>{/if}</pre>
  </div>
  <div class="hintbox">A pointer forces 8-byte alignment — the middle field (offset 0x8, 8 bytes) is a pointer, not an int. Rename each field to recover the struct: <code>{'{'} int id; char *name; int flags; {'}'}</code>.</div>
{/if}

<style>
  .xreflink:hover { color: var(--bone); }
</style>
