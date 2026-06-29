// ── Phase definitions ────────────────────────────────────────────────────────
export const PHASES = [
  { id:'p01', n:1,  name:'Disk & Filesystems',         track:'DF', tools:'mmls · fls · icat · xxd' },
  { id:'p02', n:2,  name:'x86/x64 Assembly',            track:'RE', tools:'gdb · objdump · info reg' },
  { id:'p03', n:3,  name:'PE & ELF Binary Format',       track:'RE', tools:'readelf · pefile · PE-bear' },
  { id:'p04', n:4,  name:'Static Malware Analysis',      track:'MA', tools:'strings · FLOSS · capa · YARA' },
  { id:'p05', n:5,  name:'Ghidra Decompiler',            track:'RE', tools:'Ghidra · radare2 · pdc' },
  { id:'p06', n:6,  name:'Dynamic Malware Analysis',     track:'MA', tools:'strace · API Monitor · x64dbg' },
  { id:'p07', n:7,  name:'Unpacking & Patching',         track:'RE', tools:'upx · x64dbg · radare2' },
  { id:'p08', n:8,  name:'Memory Forensics',             track:'DF', tools:'Volatility 3 · malfind · netscan' },
  { id:'p09', n:9,  name:'Network Forensics',            track:'DF', tools:'Wireshark · tshark · NetworkMiner' },
  { id:'p10', n:10, name:'Protocol RE & C2',             track:'RE', tools:'xxd · Scapy · Wireshark' },
  { id:'p11', n:11, name:'Rootkits & Artifacts',         track:'MA', tools:'Autoruns · RegExplorer · evtx' },
  { id:'p12', n:12, name:'Full Investigation',           track:'DF', tools:'end-to-end reconstruction' },
];

// ── Lab definitions ──────────────────────────────────────────────────────────
export const LABS = [
  // Chapter labs
  { id:'disk',       phase:1,  track:'DF', name:'Disk Forensics',        tool:'mmls · fls · icat',        blurb:'Recover a deleted file from a real ext4 image.' },
  { id:'asm',        phase:2,  track:'RE', name:'Assembly Trace',         tool:'gdb · stepi · info reg',   blurb:'Step through a function in gdb, watch rax accumulate the result.' },
  { id:'peelf',      phase:3,  track:'RE', name:'PE & ELF Headers',       tool:'readelf · objdump',        blurb:'Parse section headers, find the entry point, map the IAT.' },
  { id:'static',     phase:4,  track:'MA', name:'Static Analysis',        tool:'strings · capa · YARA',    blurb:'Triage a packed binary without running it.' },
  { id:'ghidra',     phase:5,  track:'RE', name:'Ghidra RE Bench',        tool:'Ghidra · radare2',         blurb:'Decompile crackme2, recover the XOR key from the loop.' },
  { id:'dynamic',    phase:6,  track:'MA', name:'Dynamic Analysis',       tool:'strace · API Monitor',     blurb:'Trace syscalls, identify C2 connect and file-drop behaviour.' },
  { id:'unpack',     phase:7,  track:'MA', name:'Unpacking',              tool:'upx · radare2',            blurb:'Find the OEP after UPX unpacking, read the hidden strings.' },
  { id:'memory',     phase:8,  track:'DF', name:'Memory Forensics',       tool:'Volatility 3',             blurb:'Run malfind, spot an RWX region hiding injected shellcode.' },
  { id:'network',    phase:9,  track:'DF', name:'Network Forensics',      tool:'tshark · JA3',             blurb:'Identify a beacon by periodicity, match a bad JA3.' },
  { id:'protocol',   phase:10, track:'RE', name:'Protocol RE',            tool:'xxd · python',             blurb:'Decode a custom XOR-keyed C2 protocol from raw bytes.' },
  { id:'rootkit',    phase:11, track:'MA', name:'Rootkit Artifacts',      tool:'evtx · reg · MFT',         blurb:'Find timestomping, a Run key backdoor, and an SSDT hook.' },
  { id:'capstone',   phase:12, track:'DF', name:'Full Investigation',     tool:'all tools',                blurb:'Chain phishing→exec→C2→impact across the full kill chain.' },
  // Skill labs
  { id:'yara',       phase:4,  track:'MA', name:'YARA Rule Writing',      tool:'yara · strings · entropy', blurb:'Author a rule targeting an Emotet sample with zero FPs.' },
  { id:'timeline',   phase:8,  track:'DF', name:'Super-timeline',         tool:'log2timeline · plaso',     blurb:'Build a full event timeline across a brute-force→ransomware chain.' },
  { id:'threat_hunt',phase:9,  track:'DF', name:'Threat Hunting',         tool:'pslist · conns · beacon',  blurb:'Hunt beacon periodicity, LSASS dumping, and LotL commands.' },
  { id:'crypt_re',   phase:7,  track:'RE', name:'Crypto in Malware',      tool:'entropy · AES · RC4',      blurb:'Identify AES and RC4 from S-box bytes and key schedule disasm.' },
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
    blurb: 'A LockBit 3.0 affiliate breached a hospital network via an unpatched Citrix CVE, moved laterally using Cobalt Strike, and deployed ransomware across 200 endpoints. Memory artifacts and network captures available.',
  },
  {
    id: 'nitro',
    codename: 'NItro',
    title: 'Fileless Intrusion',
    actor: 'APT-41 cluster',
    sector: 'Defense Industrial',
    severity: 'HIGH',
    tracks: ['MA','RE'],
    blurb: 'A nation-state actor delivered a fileless Emotet variant via a macro-laced XLS attachment. The payload ran entirely in memory via PowerShell, exfiltrating credentials before detection.',
  },
  {
    id: 'solar_trace',
    codename: 'SOLAR-TRACE',
    title: 'Supply Chain Compromise',
    actor: 'Cozy Bear / APT29',
    sector: 'Technology',
    severity: 'CRITICAL',
    tracks: ['DF','RE'],
    blurb: 'A trojanized build of a popular IT monitoring tool delivered a stealthy backdoor with a 14-day dormancy period. Inspired by the SolarWinds SUNBURST and 3CX supply chain attacks.',
  },
  {
    id: 'exodus9',
    codename: 'EXODUS-9',
    title: 'Insider Threat / BEC',
    actor: 'Malicious Insider',
    sector: 'Finance',
    severity: 'HIGH',
    tracks: ['DF'],
    blurb: 'A privileged employee used legitimate access to exfiltrate customer PII over six months via DNS tunnelling and cloud sync. Email artefacts, access logs, and endpoint timeline provided.',
  },
];

// ── Threat intel feed ─────────────────────────────────────────────────────────
export const FEED = [
  { id:'f1', tag:'RANSOMWARE', color:'blood', title:'LockBit 3.0 targets VMware ESXi', detail:'New variant uses AES-256+RSA-2048 hybrid; disables VSS snapshots via vssadmin before encryption. Affiliate TTPs include Cobalt Strike for lateral movement (T1021.002).' },
  { id:'f2', tag:'C2',         color:'volt',  title:'Cobalt Strike 4.x malleable C2 observed', detail:'JA3 fingerprint 72a7c4d879f23a2c3d643ee09e1dce61 tied to active Cobalt Strike team server. DNS over HTTPS and legitimate cloud infra used for traffic blending.' },
  { id:'f3', tag:'MALWARE',    color:'amber', title:'Emotet wave via Excel 4.0 macros', detail:'TA542 resumed distribution via XLS 4.0 macro droppers evading AMSI. Initial access T1566.001; drops IcedID as second-stage. Persistence via Run key (T1547.001).' },
  { id:'f4', tag:'TECHNIQUE',  color:'blue',  title:'DNS tunnelling for exfil (T1048.003)', detail:'Threat actors encoding data in DNS TXT queries (32-byte hex chunks). Detectable by high NXDOMAIN rate + query length entropy. Baseline: > 40 chars/query is anomalous.' },
  { id:'f5', tag:'FORENSICS',  color:'amber', title:'Prefetch artifacts after living-off-the-land', detail:'Even brief executions of net.exe, whoami.exe, and ping.exe leave C:\\Windows\\Prefetch\\*.pf entries. Timestamps survive reboots; reliable IOCs for LotL detection.' },
  { id:'f6', tag:'TECHNIQUE',  color:'volt',  title:'Process hollowing via NtUnmapViewOfSection', detail:'Malware unmaps legit svchost.exe image, writes shellcode, resumes thread. Detectable by VAD gap (malfind) and PEB module list mismatch (psscan vs pslist).' },
];

// ── Badge definitions ─────────────────────────────────────────────────────────
export const BADGES = [
  { id:'first_blood', name:'First Blood',       icon:'⚡', desc:'Complete your first lab',           cond: l => Object.keys(l).length >= 1 },
  { id:'analyst',     name:'Analyst',           icon:'🔍', desc:'Complete 5 labs',                   cond: l => Object.keys(l).length >= 5 },
  { id:'operator',    name:'Operator',          icon:'🛠', desc:'Complete all 12 chapter labs',      cond: l => Object.keys(l).length >= 12 },
  { id:'df_cert',     name:'DFIR Certified',    icon:'📁', desc:'Pass all DF-track phases',          cond: (_, p) => ['p01','p08','p09','p11','p12'].every(id => p[id]?.pass) },
  { id:'re_cert',     name:'RE Certified',      icon:'🔬', desc:'Pass all RE-track phases',          cond: (_, p) => ['p02','p03','p05','p07','p10'].every(id => p[id]?.pass) },
  { id:'ma_cert',     name:'MA Certified',      icon:'🦠', desc:'Pass all MA-track phases',          cond: (_, p) => ['p04','p06','p11'].every(id => p[id]?.pass) },
];

// ── ATT&CK techniques ─────────────────────────────────────────────────────────
export const ATTACK = [
  { id:'T1566.001', name:'Spearphishing Attachment', tactic:'Initial Access',       detail:'Malicious email attachment (XLS macro, PDF exploit, weaponised Office doc).' },
  { id:'T1190',     name:'Exploit Public-Facing App', tactic:'Initial Access',      detail:'Citrix CVE-2023-4966, MOVEit CVE-2023-34362, Exchange ProxyShell.' },
  { id:'T1059.001', name:'PowerShell',                tactic:'Execution',           detail:'AMSI bypass, encoded commands, in-memory execution via IEX+DownloadString.' },
  { id:'T1055.012', name:'Process Hollowing',         tactic:'Defense Evasion',     detail:'Unmap legit process image, write shellcode, resume thread — VAD gap artifact.' },
  { id:'T1547.001', name:'Run Key Persistence',       tactic:'Persistence',         detail:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run backdoor entry.' },
  { id:'T1003.001', name:'LSASS Memory Dump',         tactic:'Credential Access',   detail:'MiniDumpWriteDump / procdump / comsvcs.dll MiniDump — Event 10 in Sysmon.' },
  { id:'T1021.002', name:'SMB/Admin Shares',          tactic:'Lateral Movement',    detail:'Net use \\\\host\\C$ or PsExec — auth events 4624/4648 on destination.' },
  { id:'T1041',     name:'Exfil over C2 Channel',     tactic:'Exfiltration',        detail:'Data staged in TEMP, then compressed and streamed over existing Beacon.' },
  { id:'T1486',     name:'Data Encrypted for Impact', tactic:'Impact',              detail:'LockBit/ALPHV: hybrid AES+RSA, VSS deletion, ransom note drop, icon swap.' },
  { id:'T1048.003', name:'DNS Exfiltration',          tactic:'Exfiltration',        detail:'Base32/hex-encoded data in subdomain labels; avg query > 40 chars is anomalous.' },
  { id:'T1027.002', name:'Software Packing',          tactic:'Defense Evasion',     detail:'UPX, custom packers, high-entropy sections (.text entropy > 7.2 = packed).' },
  { id:'T1070.004', name:'File Deletion',             tactic:'Defense Evasion',     detail:'Timestomping ($SI vs $FN mismatch), Prefetch deletion, USN journal rollover.' },
];
