<script>
  import { page } from '$app/stores';
  import { LABS } from '$lib/data';
  import { labs, showToast } from '$lib/stores';
  import { SIM } from '$lib/lab-sim.js';
  import TermSim from '$lib/components/TermSim.svelte';

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
    threat_hunt:[{k:'beaconing',t:'Identify the beaconing process by inter-arrival analysis'},{k:'lsass_access',t:'Find the LSASS dump — rundll32 accessing lsass.exe'},{k:'lotl',t:'Identify LotL commands: net.exe, whoami.exe, ping.exe'},{k:'process_tree',t:'Trace the full process tree: explorer to powershell to cmd to net'}],
    crypt_re:   [{k:'entropy',t:'Entropy scan shows two high-entropy regions'},{k:'sbox',t:'Identify AES S-box bytes: 63 7c 77 7b ef c5 30 01'},{k:'keysched',t:'Key schedule: 176 bytes allocated (11 x 16-byte round keys)'},{k:'rc4',t:'RC4 KSA: double-loop with swap pattern confirms algorithm'}],
  };

  $: objectives = OBJS[labId] ?? [];
  $: labSim = SIM[labId] ?? {};

  let termExpanded = null;
  let walkthroughActive = false;
  let walkthroughStep = 0;
  let celebrated = false;

  $: if (labId) { termExpanded = null; walkthroughActive = false; walkthroughStep = 0; celebrated = false; }

  function toggleTerm(k) {
    if (walkthroughActive) return;
    termExpanded = termExpanded === k ? null : k;
  }

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
      const allDone = next.length === objectives.length;
      if (allDone && !celebrated) {
        celebrated = true;
        showToast('Lab cleared! All objectives complete.', 'badge', 4000);
      } else if (!allDone) {
        showToast('Objective complete!', 'success');
      }
    }
  }

  function startWalkthrough() {
    walkthroughActive = true;
    walkthroughStep = 0;
    const first = objectives.find(o => !isDone(o.k) && labSim[o.k]);
    if (first) {
      termExpanded = first.k;
      walkthroughStep = objectives.indexOf(first);
    } else {
      walkthroughActive = false;
      showToast('All objectives already complete.', 'success');
    }
  }

  function stopWalkthrough() {
    walkthroughActive = false;
    termExpanded = null;
  }

  function onTermComplete(k) {
    if (!isDone(k)) toggleObj(k);
    if (!walkthroughActive) return;
    // Advance to next incomplete objective with a sim
    setTimeout(() => {
      let next = null;
      for (let i = walkthroughStep + 1; i < objectives.length; i++) {
        if (!isDone(objectives[i].k) && labSim[objectives[i].k]) {
          next = { obj: objectives[i], idx: i };
          break;
        }
      }
      if (next) {
        walkthroughStep = next.idx;
        termExpanded = next.obj.k;
      } else {
        walkthroughActive = false;
        termExpanded = null;
      }
    }, 1000);
  }

  $: progress = lab ? Math.round((objectives.filter(o => isDone(o.k)).length / objectives.length) * 100) : 0;
  $: allDone = progress === 100;
</script>

<svelte:head><title>{lab?.name ?? 'Lab'} — BLACKVAULT</title></svelte:head>

{#if !lab}
  <div style="padding:40px;color:var(--ash)">Lab not found. <a href="/console/range">Back to Range</a></div>
{:else}
  <div class="topstrip">
    <span><a href="/console/range">Range</a> / {lab.name}</span>
    <div class="ts-right-group">
      {#if walkthroughActive}
        <span class="wt-badge">WALKTHROUGH — Step {walkthroughStep + 1}/{objectives.length}</span>
        <button class="ts-btn ts-stop" on:click={stopWalkthrough}>Stop</button>
      {:else}
        <span class="ts-pct">{progress}% complete</span>
        {#if !allDone}
          <button class="ts-btn ts-wt" on:click={startWalkthrough}>▶ Walkthrough</button>
        {/if}
      {/if}
    </div>
  </div>

  {#if allDone}
    <div class="celebrate-bar">
      <span class="cel-icon">★</span>
      Lab cleared! All {objectives.length} objectives complete.
      <a href="/console/range" class="cel-link">Back to Range</a>
    </div>
  {/if}

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
        <div class="lh-pfill" style="width:{progress}%" class:done={allDone}></div>
      </div>
      <div class="lh-pmeta">{progress}% · {objectives.filter(o => isDone(o.k)).length}/{objectives.length} objectives</div>
    </div>

    <div class="lab-body">
      <div class="obj-list">
        <div class="obj-hd">
          <span>Objectives</span>
          {#if !walkthroughActive && !allDone}
            <button class="wt-inline-btn" on:click={startWalkthrough}>▶ Start Walkthrough</button>
          {/if}
        </div>

        {#each objectives as obj, i}
          {@const done = isDone(obj.k)}
          {@const sim = labSim[obj.k]}
          {@const termOpen = termExpanded === obj.k}
          {@const isWtStep = walkthroughActive && walkthroughStep === i}

          <div class="obj-wrap" class:wt-active={isWtStep}>
            <div class="obj-row" class:done>
              <button
                class="obj-check"
                class:checked={done}
                on:click={() => toggleObj(obj.k)}
                aria-label="Toggle {obj.k}"
              >
                {#if done}✓{:else}<span class="obj-num">{i + 1}</span>{/if}
              </button>

              <div class="obj-info">
                <span class="obj-key">{obj.k}</span>
                <span class="obj-text" class:strike={done}>{obj.t}</span>
              </div>

              {#if sim && !walkthroughActive}
                <button
                  class="obj-run"
                  class:active={termOpen}
                  on:click={() => toggleTerm(obj.k)}
                >
                  {termOpen ? '▼ Hide' : '▶ Run'}
                </button>
              {/if}
              {#if isWtStep}
                <span class="wt-step-badge">NOW</span>
              {/if}
            </div>

            {#if termOpen && sim}
              <div class="obj-term">
                <TermSim
                  cmd={sim.cmd}
                  out={sim.out}
                  autoRun={walkthroughActive && isWtStep}
                  onComplete={() => onTermComplete(obj.k)}
                />
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="lab-sidebar">
        <div class="lab-hint">
          <div class="hint-hd">How to use</div>
          <ol class="hint-steps">
            <li>Click <strong>▶ Walkthrough</strong> for guided auto-run through every step</li>
            <li>Or click <strong>▶ Run</strong> per objective to simulate manually</li>
            <li>Read the output — understand what each tool reveals</li>
            <li>Repeat on real artifacts in <code>range/{labId}/</code></li>
          </ol>
        </div>

        <div class="lab-meta">
          <div class="hint-hd">Lab Info</div>
          <div class="meta-row">
            <span class="meta-lbl">Track</span>
            <span class="chip chip-{lab.track==='DF'?'df':lab.track==='RE'?'re':'ma'}">{lab.track}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Tool</span>
            <code class="meta-val">{lab.tool}</code>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Phase</span>
            <span class="meta-val">{lab.phase}</span>
          </div>
          <div class="meta-row">
            <span class="meta-lbl">Progress</span>
            <span class="meta-val" style="color:var(--volt)">{progress}%</span>
          </div>
          <a href="/console/study?phase=p{String(lab.phase).padStart(2,'0')}" class="study-link">
            Open Study Guide for Phase {lab.phase} →
          </a>
          <a href="/console/range" class="back-link">← Back to Range Hub</a>
        </div>
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
    padding: 8px 24px; font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--ash);
    display: flex; justify-content: space-between; align-items: center; z-index: 10; gap: 12px;
    flex-wrap: wrap;
  }
  .topstrip a { color: var(--ash); }
  .topstrip a:hover { color: var(--volt); text-decoration: none; }
  .ts-right-group { display: flex; align-items: center; gap: 8px; }
  .ts-pct { color: var(--volt); }
  .ts-btn {
    font-size: 10px; font-weight: 700; padding: 4px 12px;
    border-radius: 4px; cursor: pointer;
    border: 1px solid; min-height: 28px; letter-spacing: .06em;
  }
  .ts-wt { border-color: color-mix(in srgb,var(--volt) 35%,transparent); color: var(--volt); background: color-mix(in srgb,var(--volt) 8%,transparent); }
  .ts-wt:hover { background: color-mix(in srgb,var(--volt) 16%,transparent); }
  .ts-stop { border-color: color-mix(in srgb,var(--blood) 35%,transparent); color: var(--blood); background: color-mix(in srgb,var(--blood) 8%,transparent); }
  .ts-stop:hover { background: color-mix(in srgb,var(--blood) 16%,transparent); }
  .wt-badge { font-size: 10px; color: var(--amber); letter-spacing: .08em; }

  .celebrate-bar {
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    padding: 10px 24px;
    font-size: 13px; font-weight: 600; color: var(--volt);
    display: flex; align-items: center; gap: 12px;
  }
  .cel-icon { font-size: 16px; }
  .cel-link { margin-left: auto; font-size: 12px; color: var(--ash); }
  .cel-link:hover { color: var(--volt); text-decoration: none; }

  .lab-main { padding: 20px; flex: 1; }

  .lab-header {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 22px 26px; margin-bottom: 18px;
  }
  .lh-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .lh-phase { font-size: 11px; color: var(--ash); font-family: var(--mono); }
  .lh-tool  { font-size: 11px; color: var(--volt); font-family: var(--mono); margin-left: auto; }
  .lh-title { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .lh-blurb { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 14px; }
  .lh-pbar  { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 5px; }
  .lh-pfill { height: 100%; background: var(--amber); border-radius: 2px; transition: width .4s ease, background .4s; }
  .lh-pfill.done { background: var(--volt); }
  .lh-pmeta { font-size: 10px; color: var(--ash); font-family: var(--mono); }

  .lab-body { display: grid; grid-template-columns: 1fr 270px; gap: 16px; }

  /* objective list */
  .obj-list {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .obj-hd {
    padding: 11px 18px;
    background: var(--panel2); border-bottom: 1px solid var(--line);
    font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: .1em; text-transform: uppercase;
    display: flex; justify-content: space-between; align-items: center;
  }
  .wt-inline-btn {
    font-size: 10px; font-weight: 700; padding: 3px 10px;
    border-radius: 4px; cursor: pointer; letter-spacing: .06em;
    border: 1px solid color-mix(in srgb,var(--volt) 30%,transparent);
    color: var(--volt); background: color-mix(in srgb,var(--volt) 7%,transparent);
    min-height: 26px;
  }
  .wt-inline-btn:hover { background: color-mix(in srgb,var(--volt) 15%,transparent); }

  .obj-wrap { border-bottom: 1px solid var(--line); transition: background .15s; }
  .obj-wrap:last-child { border-bottom: none; }
  .obj-wrap.wt-active { background: color-mix(in srgb, var(--amber) 4%, transparent); }

  .obj-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; transition: background .1s; min-height: 50px;
  }
  .obj-row:hover { background: var(--panel2); }
  .obj-row.done { opacity: .6; }

  .obj-check {
    width: 26px; height: 26px; border-radius: 50%;
    border: 2px solid var(--line2); background: transparent;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--dim);
    transition: border-color .15s, background .15s, color .15s;
  }
  .obj-check:hover { border-color: var(--volt); color: var(--volt); }
  .obj-check.checked {
    border-color: var(--volt);
    background: color-mix(in srgb, var(--volt) 15%, transparent);
    color: var(--volt);
  }
  .obj-num { font-family: var(--mono); font-size: 10px; }

  .obj-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .obj-key  { font-family: var(--mono); font-size: 9px; color: var(--volt); text-transform: uppercase; letter-spacing: .08em; }
  .obj-text { font-size: 13px; color: var(--ash); line-height: 1.4; }
  .obj-text.strike { text-decoration: line-through; }

  .obj-run {
    font-size: 10px; font-weight: 700;
    padding: 5px 10px; border-radius: 4px;
    border: 1px solid var(--line2); background: transparent; color: var(--ash);
    cursor: pointer; flex-shrink: 0; transition: all .15s; white-space: nowrap; min-height: 30px;
  }
  .obj-run:hover, .obj-run.active {
    border-color: var(--volt); color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
  }

  .wt-step-badge {
    font-size: 9px; font-weight: 700; letter-spacing: .1em;
    color: var(--amber); border: 1px solid color-mix(in srgb,var(--amber) 30%,transparent);
    padding: 2px 6px; border-radius: 3px; flex-shrink: 0;
    background: color-mix(in srgb,var(--amber) 8%,transparent);
  }

  .obj-term { padding: 0 18px 14px; }

  /* sidebar */
  .lab-sidebar { display: flex; flex-direction: column; gap: 14px; }

  .lab-hint, .lab-meta {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .hint-hd { font-size: 10px; font-weight: 700; color: var(--bone); letter-spacing: .08em; text-transform: uppercase; }
  .hint-steps { padding-left: 14px; margin: 0; display: flex; flex-direction: column; gap: 7px; }
  .hint-steps li { font-size: 12px; color: var(--ash); line-height: 1.5; }
  .hint-steps strong { color: var(--bone); }
  .hint-steps code { font-family: var(--mono); color: var(--volt); font-size: 11px; }

  .meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .meta-lbl { font-size: 11px; color: var(--dim); }
  .meta-val { font-family: var(--mono); font-size: 11px; color: var(--ash); }

  .study-link { font-size: 12px; color: var(--volt); }
  .study-link:hover { text-decoration: underline; }
  .back-link { font-size: 12px; color: var(--ash); }
  .back-link:hover { color: var(--volt); text-decoration: none; }

  @media (max-width: 860px) {
    .lab-main { padding: 14px; }
    .lab-body { grid-template-columns: 1fr; }
    .lab-sidebar { order: -1; }
    .lh-title { font-size: 17px; }
  }
  @media (max-width: 540px) {
    .obj-row { padding: 10px 12px; gap: 8px; }
    .obj-run { font-size: 9px; padding: 4px 8px; }
    .obj-term { padding: 0 12px 10px; }
    .lab-header { padding: 16px 18px; }
  }
</style>
