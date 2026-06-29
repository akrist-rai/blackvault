<script>
  import { browser } from '$app/environment';

  const PLAYBOOKS = [
    {
      id: 'ransomware',
      title: 'Ransomware Response',
      severity: 'CRITICAL',
      color: 'blood',
      target: '72h',
      phases: [
        {
          name: 'Detect & Alert',
          steps: [
            'Alert fires: EDR detects vssadmin.exe delete shadows — confirm it\'s not a scheduled task',
            'Identify affected host, user context, and timestamp of initial vssadmin execution',
            'Query SIEM for lateral movement: 4648 auth events from host in last 2h',
            'Identify encrypted files by extension (.lockbit, .blackcat) or ransom note drop',
          ],
        },
        {
          name: 'Triage',
          steps: [
            'Capture memory image of affected host BEFORE reimaging',
            'Preserve disk image (dd or FTK Imager)',
            'Check for lateral spread: SMB traffic to other hosts (Event 5140/5145)',
            'Identify Patient Zero — earliest encrypted file timestamp',
          ],
        },
        {
          name: 'Contain',
          steps: [
            'Isolate affected hosts at the network level (VLAN / firewall ACL)',
            'Revoke Kerberos TGTs for compromised accounts (krbtgt reset if DCSync detected)',
            'Block C2 IOCs at perimeter firewall and DNS sinkholes',
            'Suspend or disable compromised service accounts',
          ],
        },
        {
          name: 'Investigate',
          steps: [
            'Volatility malfind on memory image — find injected PE in RWX region',
            'Run vol3 windows.netscan — confirm C2 connections and destination IPs',
            'Recover initial access vector: check Exchange/VPN/RDP logs for T1190/T1133',
            'Identify persistence: Run keys, scheduled tasks, WMI subscriptions',
          ],
        },
        {
          name: 'Recover',
          steps: [
            'Restore from clean backup — verify backup integrity BEFORE restoring',
            'Reimage affected endpoints rather than attempting decryption of OS drives',
            'Rotate all credentials — not just compromised accounts',
            'Enable Windows VSS on recovered systems',
          ],
        },
        {
          name: 'Harden',
          steps: [
            'Patch initial access vector (CVE or credential compromise)',
            'Enable MFA on all remote access and admin interfaces',
            'Deploy EDR rule blocking vssadmin.exe, wbadmin.exe from non-admin processes',
            'Review backup architecture — offline/immutable backups required',
          ],
        },
      ],
      commands: [
        'vol3 -f mem.raw windows.malfind',
        'vol3 -f mem.raw windows.netscan',
        'Get-WinEvent -FilterHashtable @{LogName="Security";Id=4648} | Where-Object {$_.TimeCreated -gt (Get-Date).AddHours(-4)}',
      ],
      mitre: ['T1486','T1490','T1055.012','T1021.002','T1547.001'],
    },
    {
      id: 'breach',
      title: 'Data Breach',
      severity: 'HIGH',
      color: 'amber',
      target: '96h',
      phases: [
        {
          name: 'Detect',
          steps: [
            'Identify the alert source: DLP, UEBA anomaly, threat intel IOC match, or external notification',
            'Determine data classification of potentially exposed data (PII, PHI, PCI, IP)',
            'Identify the exfiltration vector: email, cloud sync, USB, DNS, HTTP/S',
            'Preserve all logs from the affected system immediately',
          ],
        },
        {
          name: 'Assess Scope',
          steps: [
            'Run query on SIEM for data movement from affected host in last 90 days',
            'Identify all accounts with access to the affected data store',
            'Review DLP and proxy logs for large or anomalous transfers',
            'Check DNS query logs for high-volume or long-query DNS exfil patterns',
          ],
        },
        {
          name: 'Notify',
          steps: [
            'GDPR: notify supervisory authority within 72 hours if risk to individuals',
            'HIPAA: notify HHS within 60 days; notify affected individuals without unreasonable delay',
            'PCI DSS: notify card brands within 24 hours of compromise confirmation',
            'SEC (public company): material cybersecurity incident disclosure within 4 business days',
          ],
        },
        {
          name: 'Contain & Remediate',
          steps: [
            'Revoke access tokens and sessions for all accounts with data access',
            'Block exfiltration channel (DNS sink, proxy block, mail rule)',
            'Reset credentials for all service accounts with data access',
            'Engage legal counsel and document all investigative steps',
          ],
        },
      ],
      commands: [
        'tcpdump -nr capture.pcap "udp port 53" -T fields -e dns.qry.name | awk "length>40"',
        'Get-MgAuditLogSignIn | Where-Object {$_.RiskLevelDuringSignIn -ne "none"}',
        'grep "POST\\|PUT" /var/log/nginx/access.log | awk \'$10 > 1000000\'',
      ],
      mitre: ['T1048.003','T1041','T1567','T1078'],
    },
    {
      id: 'supply_chain',
      title: 'Supply Chain Compromise',
      severity: 'CRITICAL',
      color: 'blood',
      target: '120h',
      phases: [
        {
          name: 'Detect',
          steps: [
            'Identify affected software version — match against vendor advisory or CISA KEV',
            'Check internal inventory for all installations of affected package/version',
            'Note: dormancy period may be 2–14 days — look back further than the alert',
            'Collect EDR telemetry from all hosts running the compromised software',
          ],
        },
        {
          name: 'Triage',
          steps: [
            'Compare file hash of installed binary against known-good hash from vendor',
            'Look for anomalous child processes spawned by the compromised service',
            'Check network connections from the service process — C2 beacon check',
            'Look for staged data and compression tools (7z, rar, xcopy) near the binary',
          ],
        },
        {
          name: 'Contain',
          steps: [
            'Block C2 domains/IPs at firewall and DNS — consider sinkholing',
            'Isolate or shut down affected instances (staged containment)',
            'Revoke API keys, tokens, and certificates accessible to the compromised service',
            'Audit all secrets the service had access to — rotate all of them',
          ],
        },
        {
          name: 'Investigate',
          steps: [
            'Pivot from known C2 to hunt for other implants in the environment',
            'Review authentication logs for service-account lateral movement',
            'Check for persistence mechanisms planted during dormancy window',
            'Correlate with SUNBURST/3CX/XZ Utils TTPs — similar dormancy and C2 patterns',
          ],
        },
      ],
      commands: [
        'sha256sum /opt/vendor/app.bin',
        'lsof -p <service_pid> -n | grep -i "ESTABLISHED"',
        'find / -newer /opt/vendor/app.bin -name "*.zip" -o -name "*.rar" 2>/dev/null',
      ],
      mitre: ['T1195.002','T1027.002','T1071.001','T1547'],
    },
    {
      id: 'bec',
      title: 'BEC / Email Fraud',
      severity: 'HIGH',
      color: 'amber',
      target: '48h',
      phases: [
        {
          name: 'Detect',
          steps: [
            'Finance team reports suspected fraudulent wire instruction via email',
            'Review message headers — check for domain spoofing or homograph attack',
            'Check O365 Audit Log for sign-in from unexpected geo/IP for the sending account',
            'Determine if mailbox rules were created to forward or hide emails',
          ],
        },
        {
          name: 'Wire Recall',
          steps: [
            'Contact sending bank\'s fraud line IMMEDIATELY — time is critical (< 24h window)',
            'File recall request: include wire amount, date/time, destination account',
            'Contact destination bank fraud team (FBI IC3 can assist cross-border)',
            'Open FBI IC3 complaint: ic3.gov — provides jurisdiction for bank cooperation',
          ],
        },
        {
          name: 'Investigate Account',
          steps: [
            'Audit OAuth consent grants — look for malicious app with Mail.Read/Send',
            'Review inbox rules: Get-InboxRule -Mailbox user@domain.com',
            'Check MFA status — BEC often follows MFA bypass (AiTM phishing)',
            'Review conditional access sign-in logs for legacy auth bypass',
          ],
        },
        {
          name: 'Harden',
          steps: [
            'Enforce MFA with phishing-resistant methods (FIDO2/hardware key)',
            'Enable Conditional Access: block legacy authentication protocols',
            'Deploy DMARC (p=reject), DKIM, and SPF for all sending domains',
            'Require dual-approval for wire transfers above threshold',
          ],
        },
      ],
      commands: [
        'Get-MgUserOAuth2PermissionGrant -UserId user@domain.com | Select-Object ClientId,Scope',
        'Get-InboxRule -Mailbox user@domain.com | Select-Object Name,ForwardTo,DeleteMessage',
        'Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-30) -EndDate (Get-Date) -UserIds user@domain.com -Operations "MailboxLogin"',
      ],
      mitre: ['T1566.002','T1078','T1114','T1534'],
    },
  ];

  let activeId = PLAYBOOKS[0].id;
  $: active = PLAYBOOKS.find(p => p.id === activeId);

  const STORAGE_KEY = 'bv_playbook_done';
  function loadDone() {
    if (!browser) return {};
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  function saveDone(d) {
    if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }

  let done = loadDone();

  function toggle(key) {
    done = { ...done, [key]: !done[key] };
    saveDone(done);
  }

  function stepKey(pbId, phIdx, stepIdx) { return `${pbId}_ph${phIdx}_s${stepIdx}`; }

  $: pbProgress = PLAYBOOKS.map(pb => {
    const keys = pb.phases.flatMap((ph, pi) => ph.steps.map((_, si) => stepKey(pb.id, pi, si)));
    const checked = keys.filter(k => done[k]).length;
    return { id: pb.id, pct: keys.length ? Math.round(checked / keys.length * 100) : 0 };
  });
  $: activePct = pbProgress.find(p => p.id === activeId)?.pct ?? 0;
</script>

<svelte:head><title>Playbooks — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>IR PLAYBOOKS</span>
  <span class="ts-right">{activePct}% complete</span>
</div>

<main class="pb-page">
  <!-- Tab bar -->
  <div class="tab-bar">
    {#each PLAYBOOKS as pb}
      <button class="tab" class:active={pb.id === activeId} on:click={() => activeId = pb.id}>
        <span class="tab-sev tab-{pb.color}">{pb.severity}</span>
        {pb.title}
      </button>
    {/each}
  </div>

  <!-- Content -->
  {#if active}
    <div class="pb-content">
      <div class="pb-header">
        <div class="pb-title-row">
          <h1 class="pb-title">{active.title}</h1>
          <span class="pb-sev pb-{active.color}">{active.severity}</span>
        </div>
        <div class="pb-meta">Target containment: <strong>{active.target}</strong></div>
        <div class="pb-pbar">
          <div class="pb-pfill" style="width:{activePct}%"></div>
        </div>
        <div class="pb-pmeta">
          <span>{activePct}% complete</span>
          <div class="pb-mitre">
            {#each active.mitre as t}
              <span class="att-tag">{t}</span>
            {/each}
          </div>
        </div>
      </div>

      <div class="phases-grid">
        {#each active.phases as phase, pi}
          <div class="phase-block">
            <div class="phase-hd">
              <span class="phase-n">Phase {pi+1}</span>
              {phase.name}
            </div>
            <div class="phase-steps">
              {#each phase.steps as step, si}
                {@const key = stepKey(active.id, pi, si)}
                <label class="step" class:checked={done[key]}>
                  <input type="checkbox" checked={done[key]} on:change={() => toggle(key)} />
                  <span>{step}</span>
                </label>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="cmd-block">
        <div class="cmd-hd">Key Commands</div>
        {#each active.commands as cmd}
          <div class="cmd-line">
            <span class="cmd-pmt">$</span>
            <code>{cmd}</code>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .pb-page { padding: 0; flex: 1; display: flex; flex-direction: column; }

  .tab-bar {
    display: flex; gap: 1px;
    border-bottom: 1px solid var(--line);
    background: var(--line);
    flex-wrap: wrap;
  }
  .tab {
    padding: 12px 20px; background: var(--panel);
    border: none; cursor: pointer;
    font-size: 13px; font-weight: 500; color: var(--ash);
    display: flex; align-items: center; gap: 8px;
    transition: background .15s, color .15s;
    white-space: nowrap;
  }
  .tab:hover { background: var(--panel2); color: var(--bone); }
  .tab.active { background: var(--panel2); color: var(--bone); }
  .tab-sev { font-size: 9px; font-weight: 700; letter-spacing: .08em; }
  .tab-blood { color: var(--blood); }
  .tab-amber { color: var(--amber); }

  .pb-content { padding: 28px; flex: 1; overflow-y: auto; }

  .pb-header {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 24px 28px; margin-bottom: 24px;
  }
  .pb-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .pb-title { font-size: 22px; font-weight: 700; color: var(--bone); }
  .pb-sev { font-size: 11px; font-weight: 700; letter-spacing: .08em; }
  .pb-blood { color: var(--blood); }
  .pb-amber { color: var(--amber); }
  .pb-meta { font-size: 13px; color: var(--ash); margin-bottom: 14px; }
  .pb-meta strong { color: var(--bone); }
  .pb-pbar { height: 3px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
  .pb-pfill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .4s ease; }
  .pb-pmeta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--ash); }
  .pb-mitre { display: flex; gap: 6px; flex-wrap: wrap; }
  .att-tag {
    font-family: var(--mono); font-size: 10px;
    background: color-mix(in srgb, var(--blue) 10%, transparent);
    color: var(--blue); border: 1px solid color-mix(in srgb, var(--blue) 25%, transparent);
    padding: 2px 7px; border-radius: 3px;
  }

  .phases-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
  .phase-block {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .phase-hd {
    padding: 12px 16px;
    background: var(--panel2); border-bottom: 1px solid var(--line);
    font-size: 13px; font-weight: 600; color: var(--bone);
    display: flex; align-items: center; gap: 10px;
  }
  .phase-n { font-family: var(--mono); font-size: 10px; color: var(--volt); }

  .phase-steps { padding: 12px 0; }
  .step {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background .1s;
  }
  .step:hover { background: var(--panel2); }
  .step.checked { opacity: .6; }
  .step input[type="checkbox"] {
    flex-shrink: 0; margin-top: 2px;
    accent-color: var(--volt);
    width: 14px; height: 14px; cursor: pointer;
  }
  .step span { font-size: 12px; color: var(--ash); line-height: 1.5; }
  .step.checked span { text-decoration: line-through; }

  .cmd-block {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .cmd-hd {
    padding: 12px 18px;
    background: var(--panel2); border-bottom: 1px solid var(--line);
    font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: .08em; text-transform: uppercase;
  }
  .cmd-line {
    display: flex; align-items: baseline; gap: 10px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--line);
    font-family: var(--mono);
  }
  .cmd-line:last-child { border-bottom: none; }
  .cmd-pmt { color: var(--volt); flex-shrink: 0; }
  .cmd-line code { font-size: 12px; color: var(--bone); font-family: var(--mono); word-break: break-all; }

  @media (max-width: 800px) { .phases-grid { grid-template-columns: 1fr; } }
</style>
