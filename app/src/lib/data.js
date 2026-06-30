// ── Phase definitions ────────────────────────────────────────────────────────
export const PHASES = [
  { id:'p01', n:1,  name:'Disk & Filesystems',         track:'DF', tools:'mmls · fls · icat · xxd · The Sleuth Kit' },
  { id:'p02', n:2,  name:'x86/x64 Assembly',            track:'RE', tools:'gdb · objdump · info reg · pwndbg' },
  { id:'p03', n:3,  name:'PE & ELF Binary Format',       track:'RE', tools:'readelf · pefile · PE-bear · CFF Explorer' },
  { id:'p04', n:4,  name:'Static Malware Analysis',      track:'MA', tools:'strings · FLOSS · capa · YARA · DIE' },
  { id:'p05', n:5,  name:'Ghidra Decompiler',            track:'RE', tools:'Ghidra · radare2 · Binary Ninja · pdc' },
  { id:'p06', n:6,  name:'Dynamic Malware Analysis',     track:'MA', tools:'strace · API Monitor · x64dbg · Procmon' },
  { id:'p07', n:7,  name:'Unpacking & Patching',         track:'RE', tools:'upx · x64dbg · Scylla · PE-sieve' },
  { id:'p08', n:8,  name:'Memory Forensics',             track:'DF', tools:'Volatility 3 · malfind · netscan · pslist' },
  { id:'p09', n:9,  name:'Network Forensics',            track:'DF', tools:'Wireshark · tshark · NetworkMiner · Zeek' },
  { id:'p10', n:10, name:'Protocol RE & C2',             track:'RE', tools:'xxd · Scapy · Wireshark · impacket' },
  { id:'p11', n:11, name:'Rootkits & Artifacts',         track:'MA', tools:'Autoruns · RegExplorer · evtx · MFT parser' },
  { id:'p12', n:12, name:'Full Investigation',           track:'DF', tools:'end-to-end reconstruction · timeline · ATT&CK' },
];

// ── Lab definitions ──────────────────────────────────────────────────────────
export const LABS = [
  // Chapter labs
  { id:'disk',       phase:1,  track:'DF', name:'Disk Forensics',        tool:'mmls · fls · icat',        blurb:'Recover a deleted file from a real ext4 image using The Sleuth Kit. Identify partition offsets, list deleted inodes, and carve the flag.' },
  { id:'asm',        phase:2,  track:'RE', name:'Assembly Trace',         tool:'gdb · stepi · info reg',   blurb:'Step through a handwritten x64 function in gdb, watch rax accumulate the result across arithmetic and bitwise ops.' },
  { id:'peelf',      phase:3,  track:'RE', name:'PE & ELF Headers',       tool:'readelf · objdump',        blurb:'Parse section headers, find the e_entry entry point, map the IAT, and diff PE vs ELF calling conventions.' },
  { id:'static',     phase:4,  track:'MA', name:'Static Analysis',        tool:'strings · capa · YARA',    blurb:'Triage a packed binary: measure entropy, extract FLOSS decoded strings, map capa capabilities, then write a YARA hit rule.' },
  { id:'ghidra',     phase:5,  track:'RE', name:'Ghidra RE Bench',        tool:'Ghidra · radare2',         blurb:'Decompile crackme2, rename the XOR key variable, recover the 4-byte constant, and confirm the decoded output equals the license string.' },
  { id:'dynamic',    phase:6,  track:'MA', name:'Dynamic Analysis',       tool:'strace · API Monitor',     blurb:'Trace syscalls on a live sample. Identify the connect() C2 call, the open() file-drop, and any fork/exec persistence mechanism.' },
  { id:'unpack',     phase:7,  track:'MA', name:'Unpacking',              tool:'upx · radare2',            blurb:'Detect UPX packing via entropy and stub strings, unpack to the original entry point, then re-run strings to find the hidden C2 domain.' },
  { id:'memory',     phase:8,  track:'DF', name:'Memory Forensics',       tool:'Volatility 3',             blurb:'Run windows.malfind on a Cobalt Strike beacon dump. Identify the RWX region with an MZ header hiding shellcode, confirm via netscan.' },
  { id:'network',    phase:9,  track:'DF', name:'Network Forensics',      tool:'tshark · JA3',             blurb:'Isolate a beacon by inter-arrival time analysis (~60 s jitter). Extract the JA3 hash, carve the EXE from the HTTP stream.' },
  { id:'protocol',   phase:10, track:'RE', name:'Protocol RE',            tool:'xxd · python',             blurb:'Decode a custom XOR-keyed C2 protocol. Identify the BE EF frame magic, determine the opcode table, decode BEACON/EXEC/EXFIL commands.' },
  { id:'rootkit',    phase:11, track:'MA', name:'Rootkit Artifacts',      tool:'evtx · reg · MFT',         blurb:'Find $SI vs $FN timestamp discrepancies, a HKCU Run key backdoor, a 7045 service install event, and a tampered SSDT pointer.' },
  { id:'capstone',   phase:12, track:'DF', name:'Full Investigation',     tool:'all tools',                blurb:'End-to-end incident reconstruction: phishing email → macro exec → Cobalt Strike → LSASS dump → lateral movement → ransomware.' },
  // Skill labs
  { id:'yara',       phase:4,  track:'MA', name:'YARA Rule Writing',      tool:'yara · strings · entropy', blurb:'Author a production-quality YARA rule targeting Emotet: string candidates, entropy check, PE header anchor, zero false positives on a clean corpus.' },
  { id:'timeline',   phase:8,  track:'DF', name:'Super-timeline',         tool:'log2timeline · plaso',     blurb:'Build a plaso-backed super-timeline across a brute-force→lateral→ransomware chain, then psort to isolate the 4-minute attacker window.' },
  { id:'threat_hunt',phase:9,  track:'DF', name:'Threat Hunting',         tool:'pslist · conns · beacon',  blurb:'Hunt beacon periodicity via inter-arrival entropy, catch LSASS access from rundll32, map the full process tree for LotL commands.' },
  { id:'crypt_re',   phase:7,  track:'RE', name:'Crypto in Malware',      tool:'entropy · AES · RC4',      blurb:'Identify AES-256 (S-box scan, 176-byte key schedule) and RC4 (KSA double-loop) in a single packed dropper using entropy maps and Ghidra.' },
];

// ── Case definitions ──────────────────────────────────────────────────────────
export const CASES = [
  {
    id: 'hermes07',
    codename: 'HERMES-07',
    title: 'Ransomware Deployment',
    actor: 'LockBit 3.0 affiliate',
    sector: 'Healthcare',
    severity: 'CRITICAL',
    tracks: ['DF','MA'],
    blurb: 'A LockBit 3.0 affiliate breached a hospital network via Citrix Bleed (CVE-2023-4966), moved laterally with Cobalt Strike over SMB, and deployed ransomware across 200 endpoints in under 4 hours.',
    iocs: ['185.220.101.47:443 (C2)', 'SHA256: a3f1b2c4...', 'HKCU\\Run\\WindowsDefender32', 'JA3: 72a7c4d8...'],
    artifacts: ['memory/DESKTOP-01.vmem', 'network/capture_day2.pcapng', 'disk/C_drive.E01'],
    ttps: ['T1190','T1021.002','T1003.001','T1486','T1490'],
    chals: [
      { q: 'Initial access exploited a critical, actively-exploited Citrix vulnerability. Submit the CVE ID (format: cve_yyyy_nnnn).', flag: 'cve_2023_4966' },
      { q: 'How many endpoints had ransomware deployed across before the affiliate finished?', flag: '200_endpoints' },
      { q: 'Lateral movement happened over SMB admin shares. Submit the ATT&CK technique ID (lowercase).', flag: 't1021.002' },
    ],
  },
  {
    id: 'nitro',
    codename: 'NITRO-X',
    title: 'Fileless Intrusion',
    actor: 'APT-41 cluster',
    sector: 'Defense Industrial',
    severity: 'HIGH',
    tracks: ['MA','RE'],
    blurb: 'A nation-state actor delivered a fileless Emotet variant via a macro-laced XLS attachment. The payload ran entirely in memory via PowerShell, exfiltrating design documents before detection at T+72h.',
    iocs: ['cdn-telemetry[.]xyz (C2)', 'SHA256: f8e3a9b1...', 'svchost32.exe (dropper)', 'PowerShell -enc JAB...'],
    artifacts: ['email/phish_original.eml', 'memory/WS-ENGR-04.raw', 'logs/powershell_scriptblock.evtx'],
    ttps: ['T1566.001','T1059.001','T1055.012','T1041','T1027.002'],
    chals: [
      { q: 'Exfiltration of design documents was first detected how many hours after compromise? (format: Nh)', flag: '72h' },
      { q: 'Submit the ATT&CK technique ID for the initial access vector (macro-laced XLS attachment).', flag: 't1566.001' },
      { q: 'The payload ran entirely in memory via a scripting engine. Submit that engine\'s ATT&CK technique ID.', flag: 't1059.001' },
    ],
  },
  {
    id: 'solar_trace',
    codename: 'SOLAR-TRACE',
    title: 'Supply Chain Compromise',
    actor: 'Cozy Bear / APT29',
    sector: 'Technology',
    severity: 'CRITICAL',
    tracks: ['DF','RE'],
    blurb: 'A trojanized build of a popular IT monitoring tool delivered a stealthy backdoor with a 14-day dormancy period. The implant blended into legitimate traffic using HTTP subprotocol mimicry.',
    iocs: ['update.orion-telemetry[.]com (C2)', 'SHA256: 9cb1c8d2...', 'SolarWinds.BusinessLayerHost.exe (trojanized)', 'CNAME: avsvmcloud[.]com'],
    artifacts: ['disk/build_server.E01', 'network/corp_traffic_week3.pcapng', 'logs/siem_export.json'],
    ttps: ['T1195.002','T1071.001','T1027','T1036.005','T1070.004'],
    chals: [
      { q: 'The trojanized build remained dormant for how many days before activating?', flag: '14_days' },
      { q: 'Submit the ATT&CK technique ID for this supply-chain compromise vector.', flag: 't1195.002' },
      { q: 'What DNS record type pointed to avsvmcloud[.]com to mimic legitimate traffic?', flag: 'cname' },
    ],
  },
  {
    id: 'exodus9',
    codename: 'EXODUS-9',
    title: 'Insider Threat / Data Exfil',
    actor: 'Malicious Insider',
    sector: 'Finance',
    severity: 'HIGH',
    tracks: ['DF'],
    blurb: 'A privileged employee exfiltrated customer PII over six months via DNS tunnelling and cloud sync abuse. Subtle anomalies in DNS query length and NXDOMAIN rates were the only early indicators.',
    iocs: ['avg DNS query length >52 chars', 'NXDOMAIN rate 340% above baseline', 'OneDrive sync to personal tenant', 'User: jsmith / workstation WS-FIN-07'],
    artifacts: ['dns/dns_logs_6mo.json', 'disk/WS-FIN-07.E01', 'email/hr_comms.pst', 'logs/dlp_alerts.csv'],
    ttps: ['T1048.003','T1567.002','T1078','T1560.001','T1070.004'],
    chals: [
      { q: 'NXDOMAIN rates spiked to what percentage above baseline?', flag: '340_percent' },
      { q: 'Submit the ATT&CK technique ID for the DNS-based exfiltration channel.', flag: 't1048.003' },
      { q: 'Over how many months did the insider exfiltrate data?', flag: '6_months' },
    ],
  },
];

// ── Threat intel feed ─────────────────────────────────────────────────────────
export const FEED = [
  {
    id:'f1', tag:'RANSOMWARE', color:'blood',
    title:'LockBit 3.0 ESXi variant — new encryption mode',
    detail:'New ESXi variant disables VMFS datastores before AES-256-CTR encryption. Affiliate TTPs include Cobalt Strike for lateral movement (T1021.002), then vssadmin delete shadows /all /quiet to destroy VSS (T1490). Observed dwell time before encryption: 4–6 hours.',
    iocs:['185.220.101.47:443','JA3: 72a7c4d8...','HKCU\\Run\\svchost32'],
  },
  {
    id:'f2', tag:'C2', color:'volt',
    title:'Cobalt Strike 4.9 malleable C2 — new HTTP malleable profile',
    detail:'JA3 fingerprint 72a7c4d879f23a2c3d643ee09e1dce61 tied to active team server on port 443. Traffic blending via Cloudflare Workers acting as a redirector. Beacon interval 60s ±15s jitter. Payload delivered via DLL side-loading (T1574.002).',
    iocs:['cdn-update[.]workers.dev','JA3: 72a7c4d8...','pipe: \\\\\\\\.*\\\\MSSE-.*-server'],
  },
  {
    id:'f3', tag:'MALWARE', color:'amber',
    title:'Emotet wave via OneNote .one attachments',
    detail:'TA542 shifted from XLS 4.0 macros to OneNote .one files containing embedded .lnk shortcuts that call cmd.exe to download Emotet DLL. AMSI bypass observed via in-memory patch of AmsiScanBuffer. Drops IcedID second-stage at C:\\Users\\Public\\svchost.dll.',
    iocs:['cdncloud-telemetry[.]xyz','SHA256: f8e3a9b1c5d2...','C:\\Users\\Public\\svchost.dll'],
  },
  {
    id:'f4', tag:'TECHNIQUE', color:'blue',
    title:'DNS tunnelling for exfil (T1048.003) — detection signatures',
    detail:'Actors encoding data as base32 in subdomain labels (32-char chunks). Detectable by: avg query length >40 chars, NXDOMAIN rate spike >300% above baseline, single authoritative server receiving >500 req/min. Iodine and DNScat2 tool signatures observed.',
    iocs:['*.exfil-domain[.]xyz (wildcard)','TXT query count >1000/hr','base32 encoded subdomain pattern'],
  },
  {
    id:'f5', tag:'FORENSICS', color:'amber',
    title:'Prefetch as post-incident LotL evidence',
    detail:'Even 1-second executions of net.exe, whoami.exe, nltest.exe, ping.exe leave C:\\Windows\\Prefetch\\*.pf entries with embedded run timestamps. Entries survive 10 most-recent-runs limit. WinPrefetchView or Volatility windows.prefetch will surface them, even across reboots.',
    iocs:['C:\\Windows\\Prefetch\\NET.EXE-*.pf','C:\\Windows\\Prefetch\\NLTEST.EXE-*.pf','C:\\Windows\\Prefetch\\MIMIKATZ.EXE-*.pf'],
  },
  {
    id:'f6', tag:'TECHNIQUE', color:'volt',
    title:'Process hollowing via NtUnmapViewOfSection (T1055.012)',
    detail:'Malware unmaps legit svchost.exe image with NtUnmapViewOfSection, writes shellcode via NtWriteVirtualMemory, sets entry point via SetThreadContext, resumes thread. Detectable via Volatility malfind (VAD gap, MZ in non-module-backed region) and PEB LDR list/psscan discrepancy.',
    iocs:['MZ header at non-base-image VAD','RWX protection on shellcode region','PEB module list mismatch vs psscan'],
  },
  {
    id:'f7', tag:'VULNERABILITY', color:'blood',
    title:'CVE-2024-3400 — Palo Alto PAN-OS OS Command Injection',
    detail:'Critical (CVSS 10.0) OS command injection in GlobalProtect Gateway. Exploited by UTA0218 (Volt Typhoon nexus) before patch. Attacker creates /var/log/pan/sslvpn/SESSID file via crafted cookie, then injects commands via SESSID value containing shell metacharacters.',
    iocs:['Unusual files in /var/log/pan/sslvpn/','Unexpected outbound connections from firewall','glibc-2.31 reverse shell signatures'],
  },
  {
    id:'f8', tag:'THREAT ACTOR', color:'purple',
    title:'Volt Typhoon — pre-positioned in US critical infrastructure',
    detail:'PRC state actor living off the land across energy, water, and comms sectors. Uses built-in tools: netsh portproxy, wmic, ntdsutil, and scheduled tasks. No custom malware — entirely LotL (T1218, T1053). Persistence via legitimate admin accounts, not new malware.',
    iocs:['netsh interface portproxy commands','wmic /node: process call create','ntdsutil ac in ntds ifm cr full C:\\temp\\'],
  },
  {
    id:'f9', tag:'MALWARE', color:'blood',
    title:'Black Basta — QakBot-free after FBI takedown',
    detail:'Black Basta pivoted from QakBot to DarkGate and Pikabot loaders post-FBI Operation Duck Hunt (Aug 2023). New chain: Teams phishing → VBScript dropper → DarkGate DLL → Cobalt Strike → Black Basta ransomware. Dwell time reduced to <24h in recent intrusions.',
    iocs:['dargate[.]io C2','SHA256: 3c9f1b2e...','Teams external message with .vbs attachment'],
  },
  {
    id:'f10', tag:'FORENSICS', color:'amber',
    title:'MFT timestamp forensics — $SI vs $FN mismatch',
    detail:'NTFS MFT entry contains two timestamp sets: $STANDARD_INFORMATION (easily modified via SetFileTime/timestomp) and $FILE_NAME (requires kernel access to modify). A mismatch where $SI is older than $FN indicates timestomping. Tools: MFTECmd, analyzeMFT, Volatility mftparser.',
    iocs:['$SI Created < $FN Created','$SI Modified before $FN Created','TimeZone discrepancies in $SI vs $FN'],
  },
  {
    id:'f11', tag:'C2', color:'volt',
    title:'Sliver C2 framework — open-source Cobalt Strike alternative rising',
    detail:'BishopFox Sliver C2 increasingly seen in post-exploitation after Cobalt Strike license crackdowns. Supports mTLS, HTTP, DNS, WireGuard transports. Implants compiled per-op (unique SHA256). Detection via memory strings: "github.com/bishopfox/sliver" and protobuf struct layouts.',
    iocs:['mTLS C2 on port 8888','strings: github.com/bishopfox/sliver','protobuf encoded beacon traffic'],
  },
  {
    id:'f12', tag:'TECHNIQUE', color:'blue',
    title:'DCOM lateral movement — MMC20 Application (T1021.003)',
    detail:'Attackers use DCOM MMC20.Application to execute commands on remote hosts without SMB or WMI. Command: [Activator]::CreateInstance([type]::GetTypeFromProgID("MMC20.Application","TARGET")).Document.ActiveView.ExecuteShellCommand(). Leaves minimal logs; no 4648 auth event.',
    iocs:['DCOM connections to port 135','mmc.exe spawning unexpected child processes','Event 4697 service install on target'],
  },
];

// ── Badge definitions ─────────────────────────────────────────────────────────
export const BADGES = [
  { id:'first_blood',  name:'First Blood',        icon:'⚡', desc:'Complete your first lab',              cond: l => Object.keys(l).length >= 1 },
  { id:'analyst',      name:'Analyst',            icon:'🔍', desc:'Complete 5 labs',                     cond: l => Object.keys(l).length >= 5 },
  { id:'operator',     name:'Operator',           icon:'🛠', desc:'Complete all 12 chapter labs',        cond: l => Object.keys(l).length >= 12 },
  { id:'df_cert',      name:'DFIR Certified',     icon:'📁', desc:'Pass all DF-track phases',            cond: (_, p) => ['p01','p08','p09','p11','p12'].every(id => p[id]?.pass) },
  { id:'re_cert',      name:'RE Certified',       icon:'🔬', desc:'Pass all RE-track phases',            cond: (_, p) => ['p02','p03','p05','p07','p10'].every(id => p[id]?.pass) },
  { id:'ma_cert',      name:'MA Certified',       icon:'🦠', desc:'Pass all MA-track phases',            cond: (_, p) => ['p04','p06','p11'].every(id => p[id]?.pass) },
  { id:'threat_hunter',name:'Threat Hunter',      icon:'🎯', desc:'Complete the Threat Hunting skill lab', cond: l => !!l['threat_hunt'] },
  { id:'cryptanalyst', name:'Cryptanalyst',       icon:'🔐', desc:'Complete the Crypto RE skill lab',    cond: l => !!l['crypt_re'] },
  { id:'elite',        name:'Elite Operator',     icon:'💀', desc:'Complete all 16 labs',               cond: l => Object.keys(l).length >= 16 },
  { id:'case_closer',  name:'Case Closer',        icon:'🗂', desc:'Solve all 12 case-file flag challenges', cond: (_l, _p, _ctf, cf={}) => Object.values(cf).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0) >= 12 },
  { id:'playbook_pro', name:'Playbook Pro',       icon:'📘', desc:'Solve all 8 IR playbook flag challenges', cond: (_l, _p, _ctf, _cf, pf={}) => Object.values(pf).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0) >= 8 },
  { id:'intel_analyst',name:'Intel Analyst',      icon:'🛰', desc:'Capture all 12 Intel Feed flags',      cond: (_l, _p, ctf={}) => Object.keys(ctf).filter(k => k.startsWith('intel_') && ctf[k]).length >= 12 },
  { id:'attack_master',name:'ATT&CK Master',      icon:'🧩', desc:'Identify all 12 ATT&CK techniques',     cond: (_l, _p, ctf={}) => Object.keys(ctf).filter(k => k.startsWith('attack_') && ctf[k]).length >= 12 },
  { id:'arsenal_master',name:'Arsenal Master',    icon:'🧰', desc:'Recall all 10 tool/command flags',      cond: (_l, _p, ctf={}) => Object.keys(ctf).filter(k => k.startsWith('tools_') && ctf[k]).length >= 10 },
  { id:'field_analyst',name:'Field Analyst',      icon:'🧪', desc:'Clear the NIGHTGLASS live-artifact field exercise', cond: (_l, _p, ctf={}) => [0,1,2].every(i => ctf['field_nightglass_'+i]) },
  { id:'static_hunter',name:'Static Hunter',      icon:'🦠', desc:'Clear the VENOMQUILL live-artifact field exercise', cond: (_l, _p, ctf={}) => [0,1,2].every(i => ctf['field_venomquill_'+i]) },
  { id:'completionist',name:'Completionist',      icon:'🏆', desc:'Capture all 136 flags platform-wide',  cond: (_l, _p, ctf={}, cf={}, pf={}) => {
      const flat = Object.values(ctf).filter(Boolean).length;
      const nested = obj => Object.values(obj).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0);
      return flat + nested(cf) + nested(pf) >= 136;
    } },
];

// ── ATT&CK techniques (70+) ──────────────────────────────────────────────────
export const ATTACK = [
  // ── Initial Access ──
  { id:'T1566.001', name:'Spearphishing Attachment',       tactic:'Initial Access',       detail:'Malicious email with weaponised attachment: XLS 4.0 macro, PDF exploit (CVE-2023-36884), or OneNote .one with embedded .lnk. Most common initial access vector — 41% of intrusions per M-Trends 2024.' },
  { id:'T1566.002', name:'Spearphishing Link',             tactic:'Initial Access',       detail:'Email contains link to credential harvesting page or drive-by download. Often combined with EvilGinx2 reverse proxy to bypass MFA by cloning legitimate login portals.' },
  { id:'T1566.004', name:'Spearphishing Voice',            tactic:'Initial Access',       detail:'Vishing / deepfake audio calls impersonating IT helpdesk to obtain VPN credentials or MFA codes. Increasingly used by Scattered Spider / UNC3944.' },
  { id:'T1190',     name:'Exploit Public-Facing App',      tactic:'Initial Access',       detail:'Citrix Bleed (CVE-2023-4966), MOVEit SQLi (CVE-2023-34362), Exchange ProxyShell (CVE-2021-34473). Session token hijacking or unauthenticated RCE without user interaction.' },
  { id:'T1078',     name:'Valid Accounts',                 tactic:'Initial Access',       detail:'Credentials purchased from initial access brokers (IABs) on dark web markets. Includes dormant admin accounts, service accounts, and O365 accounts without MFA.' },
  { id:'T1195.002', name:'Compromise Software Supply Chain', tactic:'Initial Access',    detail:'Trojanised build pipeline (SUNBURST/SolarWinds), tampered npm package (node-ipc), poisoned CI/CD pipeline. Backdoor inserted pre-distribution; signed by legitimate cert.' },
  { id:'T1133',     name:'External Remote Services',       tactic:'Initial Access',       detail:'VPN, RDP, Citrix, Pulse Secure exploitation or credential abuse. Often the first pivot after IAB purchase. Brute force or credential stuffing common against OWA and VPN portals.' },
  { id:'T1091',     name:'Removable Media',                tactic:'Initial Access',       detail:'USB drop attacks (rubber ducky, BadUSB). Autorun.inf or LNK files. Seen in airgap-targeting campaigns (Stuxnet, agent.btz) and red team physical assessments.' },

  // ── Execution ──
  { id:'T1059.001', name:'PowerShell',                     tactic:'Execution',            detail:'AMSI bypass via in-memory patch of AmsiScanBuffer. Encoded commands (-enc), IEX(New-Object Net.WebClient).DownloadString(), Invoke-Mimikatz. ScriptBlock logging (4104) detects even obfuscated PS.' },
  { id:'T1059.003', name:'Windows Command Shell',          tactic:'Execution',            detail:'cmd.exe /c for one-liner execution. Used for net.exe discovery, certutil base64 decode, bitsadmin download. Evades PS logging but leaves 4688 process creation events.' },
  { id:'T1059.005', name:'VBScript',                       tactic:'Execution',            detail:'wscript.exe / cscript.exe running .vbs or .js (JScript). Common in phishing droppers. Produces Event 4688; parent-child relationship (winword.exe→wscript.exe) is high-fidelity detection.' },
  { id:'T1059.006', name:'Python',                         tactic:'Execution',            detail:'Python3 one-liners for reverse shells, credential extraction, lateral movement. Increasingly seen on Linux endpoints. Detected via process name python3/py.exe with suspicious args.' },
  { id:'T1106',     name:'Native API',                     tactic:'Execution',            detail:'Direct syscall invocation bypassing user-mode hooks (NtCreateProcess, NtAllocateVirtualMemory). Used by Cobalt Strike BOFs, Metasploit reflective DLL injection to evade EDR hooking.' },
  { id:'T1204.002', name:'Malicious File — User Execution', tactic:'Execution',          detail:'User double-clicks weaponised document, PDF, or executable. Macros (T1564.009), DDE, or embedded OLE objects. Security awareness training is the primary control.' },
  { id:'T1053.005', name:'Scheduled Task',                 tactic:'Execution / Persistence', detail:'schtasks /create for persistence or lateral execution. Common living-off-the-land technique. Event 4698 (task created), 4702 (task modified). Logon-trigger tasks survive reboots.' },
  { id:'T1569.002', name:'Service Execution',              tactic:'Execution',            detail:'PsExec, SC.exe create remote service. Event 7045 (service installed) on target. Used by ransomware for mass deployment: PsExec64.exe \\\\* -s cmd.exe /c start /b locker.exe.' },

  // ── Persistence ──
  { id:'T1547.001', name:'Run Key / Startup Folder',       tactic:'Persistence',          detail:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run or HKLM equivalent. Also %APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\. Survives reboots; queried by Autoruns, reg query.' },
  { id:'T1547.009', name:'Shortcut Modification',          tactic:'Persistence',          detail:'LNK files in startup folder or on desktop modified to chain to malware before launching the legitimate target. Difficult to detect without file integrity monitoring on LNK contents.' },
  { id:'T1543.003', name:'Windows Service',                tactic:'Persistence',          detail:'sc create + sc start for persistent service. Malware often uses legitimate-sounding service names (svchost, Windows Update). Event 7045 on creation; 7036 on state change.' },
  { id:'T1546.003', name:'WMI Event Subscription',        tactic:'Persistence',          detail:'ActiveScriptEventConsumer or CommandLineEventConsumer. Survives reboots, invisible to most EDR. PowerShell module Get-WMIObject __EventFilter. Almost exclusively used by sophisticated actors.' },
  { id:'T1574.002', name:'DLL Side-Loading',               tactic:'Persistence / Privilege Escalation', detail:'Legitimate signed EXE with search-order hijacked DLL. Common in AV/EDR tools. Technique used by APT41, Lazarus, FIN7. Detected by monitoring for unsigned DLLs loaded by signed processes.' },
  { id:'T1053.001', name:'At (Linux)',                     tactic:'Persistence',          detail:'at command schedules one-time execution. /var/spool/cron/atjobs forensic artifact. Cron (T1053.003) used for repeating persistence on Linux endpoints.' },
  { id:'T1505.003', name:'Web Shell',                      tactic:'Persistence',          detail:'ASPX/PHP web shell uploaded post-exploitation of public web server. China Chopper (22 bytes), simple cmd.aspx. Detectable by monitoring web root for new file creation and anomalous HTTP POST→exec patterns.' },

  // ── Privilege Escalation ──
  { id:'T1548.002', name:'Bypass UAC — FodHelper',         tactic:'Privilege Escalation', detail:'fodhelper.exe auto-elevates; reads HKCU:\\Software\\Classes\\ms-settings\\Shell\\Open\\command before elevation. Write malicious payload there → UAC bypassed. Classic red team technique.' },
  { id:'T1134.001', name:'Token Impersonation',            tactic:'Privilege Escalation', detail:'Impersonate tokens with SeImpersonatePrivilege (service accounts). JuicyPotato, PrintSpoofer, RoguePotato — exploit impersonation to elevate to SYSTEM from service context.' },
  { id:'T1068',     name:'Exploitation for Privilege Escalation', tactic:'Privilege Escalation', detail:'Local kernel exploits: CVE-2021-34527 PrintNightmare, CVE-2022-37969 Win32k, CVE-2023-28252 CLFS. Detected by WHQL violation events and unexpected SYSTEM-context child processes.' },
  { id:'T1484.001', name:'Group Policy Modification',      tactic:'Privilege Escalation / Defense Evasion', detail:'Modify GPO to push malware or disable defenses across domain. Requires DA or delegated GPO edit rights. Detected via 5136 (AD object modified) and GPO replication anomalies.' },

  // ── Defense Evasion ──
  { id:'T1055.012', name:'Process Hollowing',              tactic:'Defense Evasion',      detail:'Spawn suspended legit process (svchost.exe), unmap image (NtUnmapViewOfSection), write shellcode (NtWriteVirtualMemory), redirect entrypoint (SetThreadContext), resume. VAD gap is the forensic artifact.' },
  { id:'T1055.001', name:'DLL Injection',                  tactic:'Defense Evasion',      detail:'OpenProcess→VirtualAllocEx→WriteProcessMemory→CreateRemoteThread(LoadLibraryA). Classic injection. Detected by monitoring for cross-process memory writes and remote thread creation.' },
  { id:'T1036.005', name:'Masquerading — Match Legitimate Name', tactic:'Defense Evasion', detail:'svchost32.exe, lsas.exe (one s), explorer32.exe in unusual paths. Compare process image path against expected path for process name. Any svchost.exe outside System32 is suspicious.' },
  { id:'T1027.002', name:'Software Packing',               tactic:'Defense Evasion',      detail:'UPX, Themida, VMProtect, MPRESS. .text entropy >7.2 confirms packing. Detect-It-Easy (DIE) identifies packer signatures. Many AV heuristics fire on high-entropy PE sections.' },
  { id:'T1027.010', name:'Command Obfuscation',            tactic:'Defense Evasion',      detail:'PowerShell -enc, Invoke-Obfuscation, string concatenation, char arrays, environment variable substitution. AMSI (when not bypassed) and ScriptBlock logging (4104) are primary detections.' },
  { id:'T1070.001', name:'Clear Windows Event Logs',       tactic:'Defense Evasion',      detail:'wevtutil cl System; wevtutil cl Security; wevtutil cl Application. Event 1102 (Security log cleared) or 104 (System log cleared) — if you see these, the attacker was in. Check SIEM forwarding.' },
  { id:'T1070.004', name:'File Deletion / Timestomping',   tactic:'Defense Evasion',      detail:'$SI timestamps modified via SetFileTime (user mode) or via FltSetFileContext in kernel. $FN timestamps require direct MFT manipulation. Mismatch is a reliable forensic indicator.' },
  { id:'T1112',     name:'Modify Registry',                tactic:'Defense Evasion',      detail:'reg add for persistence; modify ETW provider keys to blind logging; disable Defender via registry. Event 4657 (registry value modified) with Sysmon key monitoring catches this.' },
  { id:'T1562.001', name:'Disable Security Tools',         tactic:'Defense Evasion',      detail:'net stop "Windows Defender", sc stop WdNisSvc, Set-MpPreference -DisableRealtimeMonitoring $true, WDAC policy tamper. Often the first post-exploitation action.' },
  { id:'T1218.011', name:'Signed Binary Proxy — Rundll32', tactic:'Defense Evasion',    detail:'rundll32.exe for DLL execution, comsvcs.dll MiniDump for LSASS. Legitimate MS binary; whitelisting won\'t block it. Parent process and DLL path are the detection pivots.' },
  { id:'T1497.001', name:'Virtualization/Sandbox Evasion', tactic:'Defense Evasion',      detail:'Check CPUID for hypervisor bit, RDTSC timing attacks, registry keys (VBOX, VMWARE), running process list for analysis tools. Sleep+wake tricks to exhaust sandbox timeout.' },

  // ── Credential Access ──
  { id:'T1003.001', name:'LSASS Memory Dump',              tactic:'Credential Access',    detail:'MiniDumpWriteDump via custom loader, procdump.exe -ma lsass.exe, comsvcs.dll MiniDump. Sysmon Event 10 (process access to lsass) or LSA Protection (RunAsPPL) mitigates most attacks.' },
  { id:'T1003.003', name:'NTDS.dit Extraction',            tactic:'Credential Access',    detail:'ntdsutil IFM, Volume Shadow Copy + reg save HKLM\\SYSTEM, DCSync (Mimikatz lsadump::dcsync). Requires DA or replication rights. Detected by 4662 (DS-Replication-Get-Changes).' },
  { id:'T1110.003', name:'Password Spraying',              tactic:'Credential Access',    detail:'Single password across many accounts to avoid lockout. kerbrute, Spray, RoadRecon for O365. Detected by low-frequency 4625 failures across many usernames from single source.' },
  { id:'T1558.003', name:'Kerberoasting',                  tactic:'Credential Access',    detail:'Request TGS for service accounts (SPN set), crack RC4-encrypted ticket offline. GetUserSPNs.py, Rubeus kerberoast. Detection: 4769 with Encryption Type 0x17 (RC4) for service accounts.' },
  { id:'T1555.003', name:'Credentials from Web Browsers',  tactic:'Credential Access',    detail:'Chrome/Edge DPAPI-encrypted credential store: AppData\\Local\\Google\\Chrome\\User Data\\Default\\Login Data. Decrypt via CryptUnprotectData in user context. SharpChrome, LaZagne.' },
  { id:'T1649',     name:'Steal or Forge Authentication Certs', tactic:'Credential Access', detail:'ESC1–ESC8 Active Directory Certificate Services misconfigurations. ESC8: NTLM relay to AD CS HTTP endpoint. Certipy, Certify for enumeration. Certificates are long-lived persistence.' },

  // ── Discovery ──
  { id:'T1087.002', name:'Domain Account Discovery',       tactic:'Discovery',            detail:'net user /domain, net group "Domain Admins" /domain, Get-ADUser. BloodHound (SharpHound ingestor) automates domain graph collection for attack path analysis.' },
  { id:'T1018',     name:'Remote System Discovery',        tactic:'Discovery',            detail:'net view, ping sweep, nmap from compromised host, arp -a. Netscan / ADIdns enumeration. Event: process creation of ping.exe, nmap with child network sockets.' },
  { id:'T1049',     name:'System Network Connections',     tactic:'Discovery',            detail:'netstat -ano, Get-NetTCPConnection. Used to enumerate existing connections and identify C2 beaconing from other hosts. Leaves netstat.exe 4688 events in verbose logging.' },
  { id:'T1083',     name:'File and Directory Discovery',   tactic:'Discovery',            detail:'dir /s /b *.xlsx *.docx *.pfx, Get-ChildItem -Recurse, find for credential files. Precedes staging and exfiltration. Patterns of recursive file enumeration are anomalous.' },
  { id:'T1069.002', name:'Domain Group Discovery',         tactic:'Discovery',            detail:'net group /domain, Get-ADGroupMember "Privileged Users". BloodHound queries for shortest path to DA. Kerberoasting follows SPN enumeration (T1558.003).' },
  { id:'T1057',     name:'Process Discovery',              tactic:'Discovery',            detail:'tasklist.exe, Get-Process, wmic process. Used to identify AV/EDR products and security tools before tampering. Also identifies LSASS PID for direct handle open.' },

  // ── Lateral Movement ──
  { id:'T1021.001', name:'Remote Desktop Protocol',        tactic:'Lateral Movement',     detail:'Legitimate RDP with stolen credentials. Leaves 4624 (logon type 10) on target, 4648 on source. RDP hijacking: tscon.exe to steal existing sessions without credentials.' },
  { id:'T1021.002', name:'SMB / Windows Admin Shares',     tactic:'Lateral Movement',     detail:'net use \\\\host\\C$ with stolen creds, PsExec, Impacket\'s psexec.py. Creates 5140 (share access) and 7045 (service install) events. IPC$ access precedes most PsExec moves.' },
  { id:'T1021.006', name:'Windows Remote Management',      tactic:'Lateral Movement',     detail:'winrm, evil-winrm, Enter-PSSession. Logon Type 3 event; WsmPrvSE.exe spawns child processes. Requires WinRM service enabled (default on DCs and servers in enterprise environments).' },
  { id:'T1550.002', name:'Pass the Hash',                  tactic:'Lateral Movement',     detail:'Use NT hash without cracking: Impacket pth-winexe, Mimikatz sekurlsa::pth, CrackMapExec --hash. Appears as NTLM auth (Type 3) in event logs; KerberosOnly policy mitigates.' },
  { id:'T1550.003', name:'Pass the Ticket',                tactic:'Lateral Movement',     detail:'Inject Kerberos TGT/TGS into LSASS with Mimikatz kerberos::ptt or Rubeus ptt. Golden ticket (krbtgt hash), silver ticket (service account hash). Invisible to event log without Kerberos debug logging.' },
  { id:'T1534',     name:'Internal Spearphishing',         tactic:'Lateral Movement',     detail:'Send phishing from compromised internal mailbox to colleagues. High trust in corporate email. Used by BEC actors and in second-stage lateral moves after initial compromise.' },

  // ── Collection ──
  { id:'T1560.001', name:'Archive via Utility',            tactic:'Collection',           detail:'7za.exe a -p<password> archive.7z *.xlsx, tar czf, WinRAR. Precedes exfiltration. Detectable by monitoring 7zip/WinRAR spawned from unusual parents with suspicious path arguments.' },
  { id:'T1074.001', name:'Local Data Staging',             tactic:'Collection',           detail:'Files aggregated to C:\\Windows\\Temp\\, C:\\Users\\Public\\, or %PROGRAMDATA% before exfil. Monitor for large file creation or compressed archives in world-writable directories.' },
  { id:'T1114.002', name:'Email Collection — Remote',      tactic:'Collection',           detail:'O365 PowerShell (Search-MailboxAuditLog, New-ComplianceSearch) or EWS API to export mailboxes. OAuth app consent abuse to gain persistent mailbox access without user credentials.' },
  { id:'T1056.001', name:'Keylogging',                     tactic:'Collection',           detail:'SetWindowsHookEx(WH_KEYBOARD_LL), raw input API, or driver-level filter. Output typically to %TEMP%\\log.txt or exfiltrated inline. Detected by anomalous SetWindowsHookEx calls from non-accessibility processes.' },

  // ── Exfiltration ──
  { id:'T1041',     name:'Exfiltration Over C2 Channel',   tactic:'Exfiltration',         detail:'Data staged in TEMP, compressed (7z -p), then chunked and transmitted over existing Cobalt Strike or Sliver beacon. Beacon traffic is already approved through egress — difficult to block without TLS inspection.' },
  { id:'T1048.003', name:'Exfiltration via DNS',           tactic:'Exfiltration',         detail:'Base32/hex-encoded data in subdomain labels (avg >40 chars/query). Iodine, DNScat2. Detection: monitor for DNS queries to single authoritative server >500/min, NXDOMAIN spike >300% baseline, query length entropy.' },
  { id:'T1567.002', name:'Exfiltration to Cloud Storage',  tactic:'Exfiltration',         detail:'rclone.exe to S3/GCS/Azure Blob, OneDrive or Dropbox sync, MEGAcmd. Legitimate cloud services bypass most egress filtering. DLP sensors on cloud sync clients are the primary detection.' },
  { id:'T1020',     name:'Automated Exfiltration',         tactic:'Exfiltration',         detail:'Scripts auto-exfiltrate newly created files matching pattern (*.xlsx, *.pfx). Often paired with recursive directory watch. Exfil volume anomalies (>1GB/hr) detectable by DLP or proxy.' },

  // ── Command and Control ──
  { id:'T1071.001', name:'Web Protocols — HTTPS C2',       tactic:'Command & Control',    detail:'Cobalt Strike, Sliver, Havoc all support HTTPS C2. Malleable profiles allow mimicking CDN, O365, or Akamai traffic. JA3/JA3S fingerprints and HTTP header order are reliable signatures.' },
  { id:'T1071.004', name:'DNS C2',                         tactic:'Command & Control',    detail:'Commands encoded in DNS TXT queries; responses in A/CNAME records. Low bandwidth (~3 KB/s) but nearly universal egress. Detection via query frequency, length entropy, and TXT record anomalies.' },
  { id:'T1090.003', name:'Multi-hop Proxy',                tactic:'Command & Control',    detail:'TOR, socks5 chains, Cloudflare Workers redirectors. Obscures true C2 server IP. Infrastructure rotates every 24–48h. JA3 fingerprint is more stable than IP for detection.' },
  { id:'T1132.001', name:'Standard Encoding',              tactic:'Command & Control',    detail:'Base64, XOR, or custom encoding for C2 traffic. Often layer 1 encoding with HTTPS as transport (layer 2). HTTPS inspection decodes the layer; pattern matching then applies to decoded content.' },
  { id:'T1573.001', name:'Encrypted Channel — Symmetric',  tactic:'Command & Control',    detail:'Custom C2 protocols using AES-128/256 for framing. Key hardcoded or derived from C2 handshake. Requires payload decryption to inspect; heuristic: encrypted traffic to unknown IP on port 443.' },
  { id:'T1219',     name:'Remote Access Software',         tactic:'Command & Control',    detail:'AnyDesk, TeamViewer, ScreenConnect installed post-compromise for persistent access. Legitimate software; bypasses most controls. Detection: unsigned remote-access processes, anomalous process parent chains.' },

  // ── Impact ──
  { id:'T1486',     name:'Data Encrypted for Impact',      tactic:'Impact',               detail:'LockBit: AES-256-CTR per-file + RSA-4096 protected key in note. ALPHV/BlackCat: AES-128-CTR + ChaCha20. Files renamed with random extension; ransom note dropped in every directory.' },
  { id:'T1490',     name:'Inhibit System Recovery',        tactic:'Impact',               detail:'vssadmin delete shadows /all /quiet, wbadmin delete catalog, bcdedit /set {default} recoveryenabled No. Prevents VSS restore. Event 524 (shadow copy deleted) is a high-confidence detection.' },
  { id:'T1489',     name:'Service Stop',                   tactic:'Impact',               detail:'Ransomware stops backup agents (BackupExecAgentAccelerator), AV services (WinDefend, MBAMService), and SQL/Exchange to unlock files for encryption. net stop commands via PsExec batch.' },
  { id:'T1485',     name:'Data Destruction',               tactic:'Impact',               detail:'Wiper malware (HermeticWiper, Whispergate, DoubleZero) overwrites MBR and partition tables. No ransom — pure sabotage. Detected post-hoc by partition table corruption and total disk unreadability.' },
  { id:'T1491.001', name:'Defacement — Internal',          tactic:'Impact',               detail:'Wallpaper change (ransomware), intranet defacement via injected JS, or internal email sent from compromised account announcing breach. Sometimes used as distraction (fire drill) during exfil.' },
];
