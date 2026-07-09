<script>
  import { progress, setObj } from '../stores/progress.js';

  const TABS = [['sqli', 'SQL injection'], ['lfi', 'Path traversal'], ['cmdi', 'Command injection'], ['xss', 'Reflected XSS']];
  const HINTS = {
    sqli: "Classic payloads: ' OR '1'='1 in the password, or admin'-- in the username to comment out the rest.",
    lfi: 'Climb out of the web root with ../ repeated, e.g. ../../../../etc/passwd.',
    cmdi: 'The host is concatenated into a shell command. Append ; id or | cat /etc/passwd.',
    xss: 'The input is reflected unescaped. Try <scr' + 'ipt>alert(1)<' + '/script> or <img src=x onerror=alert(1)>.',
  };

  let tab = 'sqli';
  let user = '', pass = '', path = '', host = '', xss = '';
  let logs = { sqli: [], lfi: [], cmdi: [], xss: [] };

  function resolvePath(p) {
    const st = [];
    p.split('/').forEach(x => { if (x === '' || x === '.') return; if (x === '..') st.pop(); else st.push(x); });
    return '/' + st.join('/');
  }
  function push(t, ok, lines) { logs[t] = [...logs[t], { ok, lines }]; }

  function runSql() {
    const blob = user + ' ' + pass;
    const q = "SELECT * FROM users WHERE user='" + user + "' AND pass='" + pass + "'";
    const hasQuote = /['"]/.test(blob);
    const taut = /\bor\b\s+('?\w+'?\s*=\s*'?\w+'?)/i.test(blob);
    const comment = /(--|#|\/\*)/.test(blob);
    const ok = hasQuote && (taut || comment);
    push('sqli', ok, [q, ok ? '[+] row returned → logged in as admin. Authentication bypassed.' : '[-] 0 rows. Invalid credentials.']);
    if (ok) setObj('web', 'sqli', progress);
  }
  function runLfi() {
    const full = resolvePath('/var/www/html/' + path);
    const win = full === '/etc/passwd';
    push('lfi', win, ['GET /view?file=' + path, win ? '[+] traversal escaped the web root → /etc/passwd read.' : '[-] resolves to ' + full + ' — still inside the web root or missing.']);
    if (win) setObj('web', 'lfi', progress);
  }
  function runCmdi() {
    const injected = /[;&|`]|\$\(/.test(host);
    let res = '';
    if (/\bid\b/.test(host)) res = 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
    else if (/whoami/.test(host)) res = 'www-data';
    else if (/cat\s+\/etc\/passwd/.test(host)) res = 'root:x:0:0:root:/root:/bin/bash ...';
    else if (injected) res = '(command executed, no stdout)';
    push('cmdi', injected, ['$ ping -c1 ' + host, injected ? '[+] shell metacharacter broke out → ' + res : '[-] ' + host + ' treated as a hostname (no injection).']);
    if (injected) setObj('web', 'cmdi', progress);
  }
  function runXss() {
    const fire = /<script|onerror\s*=|onload\s*=|javascript:|<svg[^>]*on|<img[^>]*onerror/i.test(xss);
    push('xss', fire, ['reflected: ' + xss, fire ? '[+] in a real unescaped sink this executes → alert(1) fires.' : '[-] inert — no script/handler context.']);
    if (fire) setObj('web', 'xss', progress);
  }
</script>

<div class="logtabs">
  {#each TABS as [id, label]}<button aria-current={tab === id} on:click={() => tab = id}>{label}</button>{/each}
</div>

{#if tab === 'sqli'}
  <div class="pcode"><span class="cm">// server:</span> "SELECT * FROM users WHERE user='" + user + "' AND pass='" + pass + "'"</div>
  <div class="findform" style="margin-top:10px">
    <div><label>username</label><input placeholder="admin" bind:value={user}></div>
    <div><label>password</label><input placeholder="try: ' OR '1'='1" bind:value={pass}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={runSql}>Login ▸</button></div>
{:else if tab === 'lfi'}
  <div class="pcode"><span class="cm">// server:</span> readFile("/var/www/html/" + req.query.file)</div>
  <div class="findform" style="margin-top:10px"><div class="full"><label>file</label><input placeholder="../../../../etc/passwd" bind:value={path}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={runLfi}>Fetch ▸</button></div>
{:else if tab === 'cmdi'}
  <div class="pcode"><span class="cm">// server:</span> exec("ping -c1 " + req.query.host)</div>
  <div class="findform" style="margin-top:10px"><div class="full"><label>host to ping</label><input placeholder="127.0.0.1; id" bind:value={host}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={runCmdi}>Ping ▸</button></div>
{:else}
  <div class="pcode"><span class="cm">// server:</span> render("&lt;p&gt;Results for: " + req.query.q + "&lt;/p&gt;")  <span class="cm">// unescaped</span></div>
  <div class="findform" style="margin-top:10px"><div class="full"><label>search query</label><input placeholder="<script>alert(1)</script>" bind:value={xss}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={runXss}>Search ▸</button></div>
{/if}

<div class="attemptlog" style="margin-top:12px">
  {#if logs[tab].length === 0}
    <div class="pktdetail">craft a payload and submit — every attempt is logged below so you can iterate…</div>
  {:else}
    {#each logs[tab] as a, i}
      <div class="attempt" data-ok={a.ok ? 1 : 0}>#{i + 1}: {#each a.lines as l}<div>{l}</div>{/each}</div>
    {/each}
  {/if}
</div>
<div class="hintbox"><b>Hint:</b> {HINTS[tab]} <span class="dim">— all endpoints are simulated; nothing is actually executed.</span></div>
