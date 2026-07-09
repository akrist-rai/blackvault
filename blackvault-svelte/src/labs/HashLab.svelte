<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const HASHL = {
    rows: [['5f4dcc3b5aa765d61d8327deb882cf99', 'MD5'], ['d033e22ae348aeb5660fc2140aec35850c4da997', 'SHA-1'], ['1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032', 'SHA-256'], ['$2b$12$KIXxPfnK3p9aF7s.eQ8Z8u', 'bcrypt'], ['8846f7eaee8fb117ad06bdd830b7586c', 'NTLM']],
    types: ['MD5', 'SHA-1', 'SHA-256', 'bcrypt', 'NTLM'],
    target: '5f4dcc3b5aa765d61d8327deb882cf99',
    wl: [['e10adc3949ba59abbe56e057f20f883e', '123456'], ['5f4dcc3b5aa765d61d8327deb882cf99', 'password'], ['21232f297a57a5a743894a0e4a801fc3', 'admin'], ['0d107d09f5bbe40cade3de5c71e9e9b7', 'letmein']],
  };
  const SALTED = [
    { salt: 'x7Gk', hash: 'b9c1a4d2e0f3a1c5b7d9e2f4a6c8b0d2' },
    { salt: 'qZ2p', hash: '0f7e22a9c4b6d8e0f2a4c6b8d0e2f4a6' },
  ];

  let idSel = {};
  let crackLog = [];
  let cracked = false;

  function checkIds() {
    let ok = true;
    HASHL.rows.forEach((r, i) => { if (idSel[i] !== r[1]) ok = false; });
    if (ok) setObj('hash', 'idtype', progress); else toast('not all correct — length (32/40/64 hex) and the $2b$ prefix are the tells');
  }

  function tryWord(word, hashVal) {
    const hit = hashVal === HASHL.target;
    crackLog = [...crackLog, { kind: hit ? 'hl' : '', text: word.padEnd(10) + '→ ' + hashVal.slice(0, 8) + '…  ' + (hit ? '✓ MATCH' : '✗') }];
    if (hit && !cracked) { cracked = true; setObj('hash', 'crack', progress); }
  }

  let saltTried = { 0: new Set(), 1: new Set() };
  let saltLog = { 0: [], 1: [] };
  let saltDone = false;
  function trySalt(ti, word) {
    saltTried[ti].add(word);
    saltLog[ti] = [...saltLog[ti], { text: 'md5("' + SALTED[ti].salt + '" + "' + word + '") → no match' }];
    if (saltTried[0].size >= 4 && saltTried[1].size >= 4 && !saltDone) {
      saltDone = true;
      setObj('hash', 'salt', progress);
      toast('✓ same wordlist, zero hits — that\'s what unique salts buy you');
    }
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
<p style="color:var(--ash);font-size:13.5px;margin:0 0 8px">Target: <code>{HASHL.target}</code> — click each wordlist candidate to test it.</p>
<div class="qchips">
  {#each HASHL.wl as p}<button on:click={() => tryWord(p[1], p[0])}>{p[1]}</button>{/each}
</div>
<div class="pktdetail" style="margin-top:10px">{#if crackLog.length}{#each crackLog as l}<div class={l.kind}>{l.text}</div>{/each}{:else}click a candidate above to test it against the target…{/if}</div>

<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">3 · WHY SALT</h4>
<p style="color:var(--ash);font-size:13.5px;margin:0 0 8px">Same password, two different per-user salts. Try the same wordlist against each — watch it fail both times.</p>
{#each SALTED as s, ti}
  <div class="repane" style="margin-bottom:10px">
    <h5>salt "{s.salt}" · target {s.hash.slice(0, 12)}…</h5>
    <div class="qchips" style="padding:10px 12px 0">
      {#each HASHL.wl as p}<button on:click={() => trySalt(ti, p[1])}>{p[1]}</button>{/each}
    </div>
    <div class="pktdetail" style="margin:10px 12px">{#if saltLog[ti].length}{#each saltLog[ti] as l}<div>{l.text}</div>{/each}{:else}try a candidate…{/if}</div>
  </div>
{/each}
{#if saltDone}<div class="hintbox"><b>Why:</b> same password, unique per-user salts → unique hashes. The precomputed wordlist no longer lines up — you must brute each salt separately.</div>{/if}
