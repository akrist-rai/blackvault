<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const CAP = [
    { obj: 'access', title: 'Stage 1 · Initial access',
      lede: 'A phishing email landed. Click the attachment that actually delivered the intrusion.',
      meta: 'From: billing@inv0ice-corp.com   Subject: Overdue invoice — please review',
      options: [
        { label: 'invoice_2026.xlsm — macro-enabled spreadsheet', correct: true },
        { label: 'readme.txt — plain text', correct: false },
        { label: 'logo.png — image', correct: false },
      ],
      fb: 'Macro-enabled Office doc → user-enabled macros = initial access.' },
    { obj: 'exec', title: 'Stage 2 · Execution',
      lede: "Click the process in this lineage that actually ran the attacker's payload.",
      meta: 'Process tree, most recent at the bottom:',
      options: [
        { label: 'excel.exe — opened the document', correct: false },
        { label: 'cmd.exe — spawned by excel.exe', correct: false },
        { label: "powershell.exe -nop -w hidden -enc SUVYIChOZXct... — spawned by cmd.exe", correct: true },
        { label: 'conhost.exe — console host', correct: false },
      ],
      fb: 'Macro spawned PowerShell with a download cradle — living off the land.' },
    { obj: 'c2', title: 'Stage 3 · Command & control',
      lede: 'Three destinations from the host. Click the one showing a C2 beacon.',
      meta: 'Outbound connections observed over 20 minutes:',
      options: [
        { label: '142.250.72.196:443 — one connection, then nothing', correct: false },
        { label: '185.220.101.47:443 — every ~60s, low jitter, for hours', correct: true },
        { label: '10.0.2.3:53 — a handful of ordinary DNS lookups', correct: false },
      ],
      fb: 'Periodic beacon to a hardcoded IP = C2 channel.' },
    { obj: 'impact', title: 'Stage 4 · Impact',
      lede: 'Click the file that shows what the attacker actually did to this host.',
      meta: 'Files on the desktop, most recently modified:',
      options: [
        { label: 'Q3_report.docx — unchanged', correct: false },
        { label: 'Q3_report.docx.vault — renamed, contents now high-entropy', correct: true },
        { label: 'READ_ME.vault.txt — a ransom note (a symptom, not the mechanism)', correct: false },
      ],
      fb: 'Mass encryption + ransom note = ransomware. Chain reconstructed.' },
  ];

  let stage = 0;
  let pickState = {};
  let fb = null;

  function pick(i) {
    const st = CAP[stage];
    const opt = st.options[i];
    if (opt.correct) {
      pickState[i] = 'correct';
      setObj('capstone', st.obj, progress);
      fb = { kind: 'hl', text: '[+] ' + st.fb };
      setTimeout(() => { stage++; pickState = {}; fb = null; }, 900);
    } else {
      pickState[i] = 'wrong';
      toast('not that one — re-read the artifact');
    }
  }
  function restart() { stage = 0; pickState = {}; fb = null; }
</script>

{#if stage >= CAP.length}
  <div class="objbox">
    <h4>Case closed</h4>
    <p style="color:var(--ash)">You reconstructed the full chain: <b style="color:var(--bone)">phishing → PowerShell execution → C2 beacon (185.220.101.47) → ransomware</b>. Every Map phase shows up in one real intrusion.</p>
    <div class="pktdetail" style="margin-top:10px"><span class="hl">BV{'{'}capst0ne_cl0s3d{'}'}</span></div>
    <button class="btn" style="margin-top:10px" on:click={restart}>Run it again ↺</button>
  </div>
{:else}
  {@const st = CAP[stage]}
  <p class="lede" style="margin-top:0">Stage {stage + 1} of {CAP.length}. Click the correct artifact at each step to advance.</p>
  <div class="casebar"><span>STAGE: <b>{stage + 1}/{CAP.length}</b></span><span><a style="cursor:pointer;color:var(--volt)" on:click={restart}>↺ Restart</a></span></div>
  <div class="repane">
    <h5>{st.title}</h5>
    <div class="pktdetail" style="border:0">{st.lede}
{st.meta}</div>
  </div>
  <div style="margin-top:12px">
    {#each st.options as opt, i}
      <button class="pickrow" data-state={pickState[i]} disabled={pickState[i] === 'correct'} on:click={() => pick(i)}>{opt.label}</button>
    {/each}
  </div>
  {#if fb}<div class="verdict" style="margin-top:10px"><span class={fb.kind}>{fb.text}</span></div>{/if}
  <div class="hintbox"><b>Capstone:</b> this is the whole track fused — disk/format/asm skills read the artifacts, static/dynamic/memory/network skills produce the findings, and you narrate the kill chain end to end.</div>
{/if}
