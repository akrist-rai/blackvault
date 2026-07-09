<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const ASM = [
    { t: 'mov rax, 5', f: r => r.rax = 5 },
    { t: 'mov rbx, 3', f: r => r.rbx = 3 },
    { t: 'add rax, rbx', f: r => r.rax += r.rbx },
    { t: 'imul rax, rax', f: r => r.rax *= r.rax },
    { t: 'sub rax, 4', f: r => r.rax -= 4 },
    { t: 'mov rdi, rax', f: r => r.rdi = r.rax },
    { t: 'ret  ; returns rax', f: () => {} },
  ];

  function freshRegs() { return { rax: 0, rbx: 0, rcx: 0, rdi: 0 }; }
  let regs = freshRegs();
  let pc = 0;
  let ret = '';
  let mcq = {}; // key -> 'correct' | 'wrong'

  function step() { if (pc < ASM.length) { ASM[pc].f(regs); regs = regs; pc++; } }
  function runAll() { regs = freshRegs(); ASM.forEach(i => i.f(regs)); regs = regs; pc = ASM.length; }
  function reset() { regs = freshRegs(); pc = 0; }
  function check() { if (ret.trim() === '60') setObj('asm', 'ret', progress); else if (ret) toast('run to the end and read rax (5+3=8, ²=64, −4)'); }

  let pendingQ = 'argreg';
  function clickReg(k) {
    if (!pendingQ) return;
    const correct = (pendingQ === 'argreg' && k === 'rdi') || (pendingQ === 'retreg' && k === 'rax');
    if (correct) {
      mcq[pendingQ] = 'correct';
      setObj('asm', pendingQ, progress);
      pendingQ = pendingQ === 'argreg' ? 'retreg' : null;
    } else {
      toast('not that one — re-read the calling convention');
    }
  }
</script>

<p class="lede" style="margin-top:0">Single-step the routine and watch the registers. What is in <code>rax</code> when it returns?</p>
<div class="rebench">
  <div class="repane">
    <h5>&lt;compute&gt;</h5>
    <div class="asm">
      {#each ASM as ins, i}
        <div class="row" style={i === pc ? 'background:rgba(45,226,230,.14)' : ''}><span class="a">{i === pc ? '▶' : ' '}</span><span class="mn">{ins.t}</span></div>
      {/each}
    </div>
  </div>
  <div class="repane">
    <h5>registers{pendingQ ? ' — click to answer below' : ''}</h5>
    <div class="stack">
      {#each Object.entries(regs) as [k, v]}
        <div class="srow" style="cursor:pointer" data-hit={mcq.argreg === 'correct' && k === 'rdi' ? 1 : (mcq.retreg === 'correct' && k === 'rax' ? 1 : 0)} on:click={() => clickReg(k)}><span>{k}</span><b>{v} <span style="color:var(--ash)">0x{(v >>> 0).toString(16)}</span></b></div>
      {/each}
    </div>
  </div>
</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={step}>Step ▸</button>
  <button on:click={runAll}>Run to end ⏭</button>
  <button on:click={reset}>Reset ↺</button>
  <input class="lab-sel" style="width:100px" placeholder="returns?" bind:value={ret}>
  <button class="btn" style="padding:6px 12px" on:click={check}>Check</button>
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Calling convention (System V x64)</h4>
  {#if pendingQ === 'argreg'}
    <p style="color:var(--bone);font-size:14px;margin:0">Click the register above that holds the <b>1st integer argument</b>.</p>
  {:else if pendingQ === 'retreg'}
    <p style="color:var(--bone);font-size:14px;margin:0">✓ arg1 is rdi. Now click the register above that holds the <b>return value</b>.</p>
  {:else}
    <p style="color:var(--jade);font-size:14px;margin:0">✓ Both answered directly from the live register panel — rdi for arg1, rax for the return value.</p>
  {/if}
</div>
<div class="hintbox"><b>Convention:</b> System V (Linux) passes integer args in rdi, rsi, rdx, rcx, r8, r9 and returns in rax. Windows x64 uses rcx, rdx, r8, r9.</div>

<style>
  .stack .srow:hover { border-color: var(--volt); }
  .stack .srow[data-hit="1"] { background: rgba(45, 232, 154, 0.12); border-color: var(--jade); }
</style>
