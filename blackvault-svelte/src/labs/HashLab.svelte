<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const HASHL = {
    rows: [['5f4dcc3b5aa765d61d8327deb882cf99', 'MD5'], ['d033e22ae348aeb5660fc2140aec35850c4da997', 'SHA-1'], ['1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032', 'SHA-256'], ['$2b$12$KIXxPfnK3p9aF7s.eQ8Z8u', 'bcrypt'], ['8846f7eaee8fb117ad06bdd830b7586c', 'NTLM']],
    types: ['MD5', 'SHA-1', 'SHA-256', 'bcrypt', 'NTLM'],
    target: '5f4dcc3b5aa765d61d8327deb882cf99',
    wl: [['e10adc3949ba59abbe56e057f20f883e', '123456'], ['5f4dcc3b5aa765d61d8327deb882cf99', 'password'], ['21232f297a57a5a743894a0e4a801fc3', 'admin'], ['0d107d09f5bbe40cade3de5c71e9e9b7', 'letmein']],
  };

  let idSel = {};
  let crackLines = null;
  let saltLines = null;

  function checkIds() {
    let ok = true;
    HASHL.rows.forEach((r, i) => { if (idSel[i] !== r[1]) ok = false; });
    if (ok) setObj('hash', 'idtype', progress); else toast('not all correct — length (32/40/64 hex) and the $2b$ prefix are the tells');
  }
  function crack() {
    let found = '';
    crackLines = [{ kind: '', text: 'running md5 over the wordlist against ' + HASHL.target.slice(0, 12) + '…' }];
    HASHL.wl.forEach(p => {
      const hit = p[0] === HASHL.target;
      crackLines.push({ kind: hit ? 'hl' : '', text: '  ' + p[1].padEnd(10) + '→ ' + p[0].slice(0, 8) + '  ' + (hit ? '✓ MATCH' : '✗') });
      if (hit) found = p[1];
    });
    crackLines.push({ kind: 'hl', text: '[+] cracked: ' + found });
    setObj('hash', 'crack', progress);
  }
  function showSalt() {
    saltLines = [
      { kind: '', text: 'md5("password")            = 5f4dcc3b…cf99' },
      { kind: '', text: 'md5("x7Gk" + "password")    = b9c1a4…    (different)' },
      { kind: '', text: 'md5("qZ2p" + "password")    = 0f7e22…    (different)' },
      { kind: 'hl', text: '[+] same password, unique per-user salts → unique hashes. The precomputed wordlist/rainbow table no longer lines up: you must brute each salt separately.' },
    ];
    setObj('hash', 'salt', progress);
  }
</script>

<p class="lede" style="margin-top:0">Three skills: identify the algorithm by shape, crack an unsalted hash with a wordlist, and see why salting wrecks the attack.</p>
<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em">1 · IDENTIFY</h4>
<table class="kv">
  <thead><tr><th>hash</th><th>your call</th></tr></thead>
  <tbody>
  {#each HASHL.rows as r, i}
    <tr><td style="word-break:break-all">{r[0]}</td>
      <td><select class="lab-sel" bind:value={idSel[i]}><option value="">—</option>{#each HASHL.types as t}<option value={t}>{t}</option>{/each}</select></td>
    </tr>
  {/each}
  </tbody>
</table>
<div style="margin-top:10px"><button class="btn" on:click={checkIds}>Check types</button></div>

<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">2 · CRACK</h4>
<p style="color:var(--ash);font-size:13.5px;margin:0">Target: <code>{HASHL.target}</code> · wordlist of 4. <button class="btn" style="margin-left:8px" on:click={crack}>Run dictionary attack</button></p>
<div class="pktdetail" style="margin-top:10px">{#if crackLines}{#each crackLines as l}<div class={l.kind}>{l.text}</div>{/each}{:else}—{/if}</div>

<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">3 · WHY SALT</h4>
<p style="margin:0"><button class="btn" on:click={showSalt}>Show salted vs unsalted</button></p>
<div class="pktdetail" style="margin-top:10px">{#if saltLines}{#each saltLines as l}<div class={l.kind}>{l.text}</div>{/each}{:else}—{/if}</div>
