<script>
  import { page } from '$app/stores';
  import { LABS } from '$lib/data';
  import { labs, showToast } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  $: labId = $page.params.labId;
  $: lab   = LABS.find(l => l.id === labId);

  const OBJS = {
    disk:       [{k:'mount',t:'Identify the partition offset with mmls'},{k:'mmls',t:'List the filesystem type and sector start'},{k:'fls',t:'Run fls — find the deleted file (marked *)'},{k:'icat',t:'Recover the inode with icat'},{k:'flag',t:'Read the flag BV{...}'}],
    asm:        [{k:'break',t:'Set a breakpoint on the compute() function'},{k:'stepi',t:'Step one instruction and watch rax change'},{k:'regs',t:'Read rax after all operations complete'},{k:'result',t:'Confirm the return value matches ./trace exit code'}],
    peelf:      [{k:'magic',t:'Confirm ELF magic bytes (7f 45 4c 46)'},{k:'sections',t:'List all section headers with readelf -S'},{k:'entry',t:'Find the entry point address (e_entry)'},{k:'iat',t:'Identify the imported functions from libc'}],
    static:     [{k:'hash',t:'SHA-256 the sample — check against reputation'},{k:'strings',t:'Run strings -n6 and grep for http/cmd'},{k:'imports',t:'Identify the network import library'},{k:'entropy',t:'Confirm the entropy > 7.2 (packed)'},{k:'yara',t:'Write a YARA rule that matches only this sample'}],
    ghidra:     [{k:'open',t:'Open crackme2 in Ghidra and auto-analyse'},{k:'rename',t:'Rename the XOR key variable to something meaningful'},{k:'xorkey',t:'Identify the XOR constant used in the decode loop'},{k:'decode',t:'Confirm the decoded output matches the expected string'}],
    dynamic:    [{k:'strace',t:'Run strace and identify the connect() call'},{k:'file_drop',t:'Find the open() call that writes the dropped file'},{k:'c2',t:'Note the destination IP and port from connect()'},{k:'registry',t:'Identify the registry persistence write (if Windows)'}],
    unpack:     [{k:'entropy',t:'Measure entropy: > 7.2 confirms packing'},{k:'stub',t:'Identify the UPX! stub strings in the header'},{k:'oep',t:'Run upx -d to unpack to the OEP'},{k:'strings',t:'Re-run strings — confirm the hidden content is now visible'}],
    memory:     [{k:'pslist',t:'Run windows.pslist — note any duplicate svchost PIDs'},{k:'malfind',t:'Run malfind — find the RWX region with MZ header'},{k:'rwx',t:'Confirm PAGE_EXECUTE_READWRITE protection on the region'},{k:'netscan',t:'Run netscan — confirm ESTABLISHED C2 connection'}],
    network:    [{k:'beacon',t:'Find the SYN packets ~60s apart to 185.220.101.47'},{k:'ja3',t:'Extract the JA3 hash from the TLS ClientHello'},{k:'carve',t:'Carve the executable from the HTTP stream (MZ header)'},{k:'dns',t:'Decode the DNS exfil subdomain labels to ASCII'}],
    protocol:   [{k:'magic',t:'Identify the BE EF frame magic in xxd output'},{k:'framing',t:'Determine the frame structure: magic + length + opcode + payload'},{k:'xorkey',t:'Find the XOR key (0x5A) by testing on a known string'},{k:'decode',t:'Decode all three commands (BEACON, EXEC, EXFIL)'}],
    rootkit:    [{k:'runkey',t:'Find the malicious Run key in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'},{k:'timestomp',t:'Compare $SI and $FN timestamps — identify the discrepancy'},{k:'service',t:'Find the Event ID 7045 service install in the System log'},{k:'ssdt',t:'Confirm the SSDT hook by comparing expected vs actual function pointers'}],
    capstone:   [{k:'phishing',t:'Identify the initial access vector from mail logs'},{k:'exec',t:'Find the macro execution and child process spawn'},{k:'c2',t:'Confirm the C2 beacon in network captures'},{k:'impact',t:'Document the final action: ransomware/exfil/destruction'}],
    yara:       [{k:'strings',t:'Run strings and identify unique candidates'},{k:'entropy',t:'Confirm no high-entropy packing'},{k:'imports',t:'Identify the suspicious import library'},{k:'pe_header',t:'Confirm PE (MZ) magic is present'},{k:'rule',t:'Write a YARA rule with zero false positives'},{k:'test',t:'Test the rule — fires on emotet_sample.bin only'}],
    timeline:   [{k:'run',t:'Run log2timeline.py to build the plaso store'},{k:'filter',t:'Filter the timeline to the attacker window (03:11–03:15)'},{k:'first_action',t:'Identify the first attacker action after initial access'},{k:'correlate',t:'Correlate sshd/apache/kernel events for the full sequence'},{k:'csv',t:'Export the timeline to CSV for reporting'}],
    threat_hunt:[{k:'beaconing',t:'Identify the beaconing process by inter-arrival analysis'},{k:'lsass_access',t:'Find the LSASS dump — rundll32 accessing lsass.exe'},{k:'lotl',t:'Identify LotL commands: net.exe, whoami.exe, ping.exe'},{k:'process_tree',t:'Trace the full process tree: explorer→powershell→cmd→net'}],
    crypt_re:   [{k:'entropy',t:'Entropy scan shows two high-entropy regions'},{k:'sbox',t:'Identify AES S-box bytes: 63 7c 77 7b ef c5 30 01'},{k:'keysched',t:'Key schedule: 176 bytes allocated (11 × 16-byte round keys)'},{k:'rc4',t:'RC4 KSA: double-loop with swap pattern confirms algorithm'}],
  };

  $: objectives = OBJS[labId] ?? [];

  function isDone(k) {
    return !!$labs[labId]?.done?.includes(k);
  }

  function toggleObj(k) {
    const current = $labs[labId]?.done ?? [];
    let next;
    if (current.includes(k)) {
      next = current.filter(x => x !== k);
    } else {
      next = [...current, k];
    }
    labs.update(l => ({ ...l, [labId]: { done: next } }));
    if (!current.includes(k)) {
      showToast('Objective complete!', 'success');
    }
    if (next.length === objectives.length) {
      showToast('Lab cleared! 🎯', 'badge');
    }
  }

  $: progress = lab ? Math.round(((objectives.filter(o => isDone(o.k)).length) / objectives.length) * 100) : 0;
</script>

<svelte:head><title>{lab?.name ?? 'Lab'} — BLACKVAULT</title></svelte:head>

{#if !lab}
  <div style="padding:40px;color:var(--ash)">Lab not found. <a href="/console/range">← Back to Range</a></div>
{:else}
  <div class="topstrip">
    <span><a href="/console/range">Range</a> / {lab.name}</span>
    <span class="ts-right">{progress}% complete</span>
  </div>

  <main class="lab-main">
    <div class="lab-header">
      <div class="lh-top">
        <span class="chip chip-{lab.track==='DF'?'df':lab.track==='RE'?'re':'ma'}">{lab.track}</span>
        <span class="lh-phase">Phase {lab.phase}</span>
        <span class="lh-tool">{lab.tool}</span>
      </div>
      <h1 class="lh-title">{lab.name}</h1>
      <p class="lh-blurb">{lab.blurb}</p>
      <div class="lh-pbar">
        <div class="lh-pfill" style="width:{progress}%"></div>
      </div>
      <div class="lh-pmeta">{progress}% · {objectives.filter(o => isDone(o.k)).length}/{objectives.length} objectives</div>
    </div>

    <div class="lab-body">
      <div class="obj-list">
        <h2 class="obj-hd">Objectives</h2>
        {#each objectives as obj}
          {@const done = isDone(obj.k)}
          <label class="obj-item" class:done>
            <input type="checkbox" checked={done} on:change={() => toggleObj(obj.k)} />
            <div class="obj-info">
              <span class="obj-key">{obj.k}</span>
              <span class="obj-text">{obj.t}</span>
            </div>
          </label>
        {/each}
      </div>

      <div class="lab-hint">
        <div class="hint-hd">Real Tool Practice</div>
        <p>Complete this lab in the browser, then repeat on the actual artifacts in <code>range/{labId}/</code> using the real tools. That's the double-rep that builds muscle memory.</p>
        <a href="/console/range" class="back-link">← Back to Range Hub</a>
      </div>
    </div>
  </main>
{/if}

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .topstrip a { color: var(--ash); }
  .topstrip a:hover { color: var(--volt); text-decoration: none; }
  .ts-right { color: var(--volt); }

  .lab-main { padding: 28px; flex: 1; }

  .lab-header {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 28px 32px; margin-bottom: 24px;
  }
  .lh-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .lh-phase { font-size: 11px; color: var(--ash); font-family: var(--mono); }
  .lh-tool { font-size: 11px; color: var(--volt); font-family: var(--mono); margin-left: auto; }
  .lh-title { font-size: 22px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .lh-blurb { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .lh-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
  .lh-pfill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .4s ease; }
  .lh-pmeta { font-size: 11px; color: var(--ash); font-family: var(--mono); }

  .lab-body { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }

  .obj-list {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .obj-hd {
    padding: 14px 20px;
    background: var(--panel2); border-bottom: 1px solid var(--line);
    font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: .1em; text-transform: uppercase;
  }
  .obj-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--line);
    cursor: pointer; transition: background .1s;
  }
  .obj-item:last-child { border-bottom: none; }
  .obj-item:hover { background: var(--panel2); }
  .obj-item.done { opacity: .55; }
  .obj-item input[type="checkbox"] {
    flex-shrink: 0; margin-top: 2px;
    accent-color: var(--volt); width: 15px; height: 15px; cursor: pointer;
  }
  .obj-info { display: flex; flex-direction: column; gap: 3px; }
  .obj-key { font-family: var(--mono); font-size: 10px; color: var(--volt); text-transform: uppercase; }
  .obj-text { font-size: 13px; color: var(--ash); line-height: 1.4; }
  .obj-item.done .obj-text { text-decoration: line-through; }

  .lab-hint {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 22px;
    display: flex; flex-direction: column; gap: 12px;
    height: fit-content;
  }
  .hint-hd { font-size: 12px; font-weight: 700; color: var(--bone); letter-spacing: .06em; text-transform: uppercase; }
  .lab-hint p { font-size: 13px; color: var(--ash); line-height: 1.6; }
  .lab-hint code { font-family: var(--mono); color: var(--volt); font-size: 12px; }
  .back-link { font-size: 13px; color: var(--ash); }
  .back-link:hover { color: var(--volt); text-decoration: none; }

  @media (max-width: 800px) { .lab-body { grid-template-columns: 1fr; } }
</style>
