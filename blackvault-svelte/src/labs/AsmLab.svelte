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

  function answer(key, correct) {
    mcq[key] = correct ? 'correct' : 'wrong';
    if (correct) setObj('asm', key, progress); else toast('not quite — re-read it');
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
    <h5>registers</h5>
    <div class="stack">
      {#each Object.entries(regs) as [k, v]}
        <div class="srow"><span>{k}</span><b>{v} <span style="color:var(--ash)">0x{(v >>> 0).toString(16)}</span></b></div>
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
  <p style="color:var(--ash);font-size:14px;margin:0 0 8px">1st integer argument is passed in…</p>
  <button class="opt" data-state={mcq.argreg} on:click={() => answer('argreg', false)}><b>A</b>rax</button>
  <button class="opt" data-state={mcq.argreg} on:click={() => answer('argreg', true)}><b>B</b>rdi</button>
  <button class="opt" data-state={mcq.argreg} on:click={() => answer('argreg', false)}><b>C</b>rsp</button>
  <p style="color:var(--ash);font-size:14px;margin:12px 0 8px">The return value comes back in…</p>
  <button class="opt" data-state={mcq.retreg} on:click={() => answer('retreg', true)}><b>A</b>rax</button>
  <button class="opt" data-state={mcq.retreg} on:click={() => answer('retreg', false)}><b>B</b>rbx</button>
  <button class="opt" data-state={mcq.retreg} on:click={() => answer('retreg', false)}><b>C</b>rdi</button>
</div>
<div class="hintbox"><b>Convention:</b> System V (Linux) passes integer args in rdi, rsi, rdx, rcx, r8, r9 and returns in rax. Windows x64 uses rcx, rdx, r8, r9.</div>

<style>
  .opt[data-state="correct"] { border-color: var(--jade); color: var(--jade); }
  .opt[data-state="wrong"] { border-color: var(--blood); color: var(--blood); }
</style>
