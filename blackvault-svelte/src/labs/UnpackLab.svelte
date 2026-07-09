<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const STUB = [
    { a: '0x4051f0', t: 'pushad', c: 'save all registers' },
    { a: '0x4051f1', t: 'mov esi, 0x40a000', c: 'packed source' },
    { a: '0x4051f6', t: 'mov edi, 0x401000', c: 'dest = OEP region' },
    { a: '0x4051fb', t: 'call VirtualAlloc', c: 'alloc unpack buffer' },
    { a: '0x405200', t: '<decompress loop>', c: 'rebuild original code' },
    { a: '0x405240', t: 'popad', c: 'restore registers' },
    { a: '0x405241', t: 'jmp 0x401000', c: 'TAIL JUMP → Original Entry Point', oep: true },
  ];

  let pc = 0;
  let out = null;
  let mcq = {};

  function step() { if (pc < STUB.length - 1) pc++; }
  function runToTail() { pc = STUB.length - 1; out = { kind: 'hl', text: 'stopped on the tail jump → jmp 0x401000. That target is the OEP.' }; }
  function dump() {
    if (pc >= STUB.length - 1) { out = { kind: 'hl', text: '[+] dumped process image at OEP 0x401000 → unpacked.exe. Now fix the entry point & rebuild imports.' }; setObj('unpack', 'dump', progress); }
    else out = { kind: 'err', text: '[-] run to the tail jump first — dumping before OEP gives an incomplete payload.' };
  }

  let unp_oep = '';
  function checkOep() { if (/0x?401000/.test(unp_oep.toLowerCase().replace(/\s/g, ''))) setObj('unpack', 'oep', progress); else if (unp_oep) toast('the tail-jump target is the OEP'); }
  function answer(key, correct) {
    mcq[key] = correct ? 'correct' : 'wrong';
    if (correct) setObj('unpack', key, progress); else toast('not quite — re-read it');
  }

  let licensePatched = false;
  function patchLicense() {
    licensePatched = true;
    setObj('unpack', 'patch', progress);
  }
</script>

<p class="lede" style="margin-top:0">The packer stub decompresses the real code then jumps to it. Catch that jump.</p>
<div class="repane">
  <h5>packer stub</h5>
  <div class="asm">
    {#each STUB as s, i}
      <div class="row" style={i === pc ? 'background:rgba(45,226,230,.14)' : ''}>
        <span class="a">{s.a}</span><span class="mn" style={s.oep ? 'color:var(--blood)' : ''}>{s.t}</span><span class="cm">  ; {s.c}</span>
      </div>
    {/each}
  </div>
</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={step}>Step ▸</button>
  <button on:click={runToTail}>Run to tail jump ⏭</button>
  <button on:click={dump}>Dump at OEP ⤓</button>
</div>
{#if out}<div class="verdict {out.kind === 'hl' ? 'ok' : 'no'}" style="margin-top:8px">{out.text}</div>{/if}
<div class="objbox" style="margin-top:14px">
  <h4>Submit & reason</h4>
  <div class="findform"><div class="full"><label>OEP address</label><input placeholder="0x...." bind:value={unp_oep}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={checkOep}>Check OEP</button></div>
  <p style="color:var(--ash);font-size:14px;margin:14px 0 8px">After dumping from memory, why must you rebuild the IAT?</p>
  <button class="opt" data-state={mcq.iat} on:click={() => answer('iat', true)}><b>A</b>The dump has the loader's runtime-resolved addresses, not a static import table — it won't re-load without one</button>
  <button class="opt" data-state={mcq.iat} on:click={() => answer('iat', false)}><b>B</b>To make the file smaller</button>
  <button class="opt" data-state={mcq.iat} on:click={() => answer('iat', false)}><b>C</b>To strip debug symbols</button>
  <p style="color:var(--ash);font-size:14px;margin:14px 0 8px">A license check guards the unpacked code. Click the conditional jump to patch it so the check always passes.</p>
  <div class="asm" style="max-width:340px">
    <div class="row"><span class="a">0x401300</span><span class="mn">cmp byte [license_ok], 0</span></div>
    <div class="row" data-jmp="1" data-patched={licensePatched ? 1 : 0} on:click={patchLicense} style="cursor:pointer"><span class="a">0x401304</span><span class="mn">{licensePatched ? 'nop ; nop' : 'jne fail'}</span></div>
    <div class="row"><span class="a">0x401306</span><span class="mn">mov eax, 1  ; licensed</span></div>
  </div>
</div>
<div class="hintbox"><b>Pipeline:</b> break at OEP (hardware bp on execute of the freshly-written region) → dump → fix entry point → rebuild imports (IAT) → fix section sizes → validate it loads.</div>

<style>
  .opt[data-state="correct"] { border-color: var(--jade); color: var(--jade); }
  .opt[data-state="wrong"] { border-color: var(--blood); color: var(--blood); }
</style>
