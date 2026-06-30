<script>
  import { ctf, showToast } from '$lib/stores';

  const TOOLS = [
    { cat: 'Memory Forensics', color: 'volt', items: [
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.info', desc:'OS build, arch, time — confirm before analysis' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.pslist', desc:'Process list from EPROCESS linked list' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.psscan', desc:'Pool-tag process scan (finds hidden/unlinked processes)' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.malfind', desc:'RWX anonymous regions with PE headers (injection)' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.netscan', desc:'Active and historical network connections' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.cmdline', desc:'Command-line arguments per process' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.dlllist --pid 1234', desc:'DLLs loaded by specific PID' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.handles --pid 1234', desc:'Open handles: files, registry keys, mutants' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.dumpfiles --pid 1234 -o /dumps/', desc:'Dump all memory-mapped files for process' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.registry.printkey --key "Software\\Microsoft\\Windows\\CurrentVersion\\Run"', desc:'Read Run key persistence from memory' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.registry.userassist', desc:'UserAssist entries — GUI program execution history' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.mftscan.MFTScan', desc:'MFT records in memory pool (file timestamps)' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.ssdt', desc:'SSDT hooks: expected vs actual kernel function pointers' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.svcscan', desc:'Windows service list from memory' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw linux.pslist', desc:'Linux process list from task_struct linked list' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw linux.bash', desc:'Bash command history from memory' },
      { name:'PE-sieve', cmd:'pe-sieve.exe /pid 1234 /dump 1 /shellc 1', desc:'Dump modified/injected PEs from process' },
      { name:'Hollows Hunter', cmd:'hollows_hunter.exe /dir dumps/ /json report.json', desc:'Scan all processes, dump hollowed/injected' },
    ]},
    { cat: 'Disk Forensics', color: 'amber', items: [
      { name:'Sleuth Kit', cmd:'mmls disk.img', desc:'Partition table — start offsets in sectors' },
      { name:'Sleuth Kit', cmd:'fsstat -o 2048 disk.img', desc:'Filesystem type, block size, inode range' },
      { name:'Sleuth Kit', cmd:'fls -r -o 2048 disk.img', desc:'Recursive file listing; * = deleted inode' },
      { name:'Sleuth Kit', cmd:'icat -o 2048 disk.img 42 > recovered.bin', desc:'Extract inode 42 content to file' },
      { name:'Sleuth Kit', cmd:'ils -o 2048 disk.img', desc:'All inodes: allocated + unallocated' },
      { name:'Sleuth Kit', cmd:'blkls -A -o 2048 disk.img > unalloc.raw', desc:'Dump all unallocated blocks for carving' },
      { name:'Sleuth Kit', cmd:'ifind -o 2048 -n "/etc/passwd" disk.img', desc:'Find inode number by path' },
      { name:'Sleuth Kit', cmd:'blkcat -o 2048 disk.img 1024 > block.bin', desc:'Extract specific block by number' },
      { name:'xxd', cmd:'xxd disk.img | head -4', desc:'Verify MBR magic: bytes 510-511 = 55 AA' },
      { name:'dd', cmd:'dd if=disk.img of=partition.img bs=512 skip=2048 count=204800', desc:'Extract partition by offset+count' },
      { name:'MFTECmd', cmd:'MFTECmd.exe -f $MFT --csv output/ --csvf mft.csv', desc:'Parse NTFS MFT to CSV for timeline analysis' },
      { name:'MFTECmd', cmd:'MFTECmd.exe -f $J --csv output/ --csvf usn.csv', desc:'Parse USN Journal ($J) — file operation log' },
      { name:'analyzeMFT', cmd:'python3 analyzeMFT.py -f $MFT -o mft.csv -e', desc:'Alternative MFT parser with $SI/$FN timestamps' },
      { name:'photorec', cmd:'photorec /d /home/user/recovered/ disk.img', desc:'Signature-based file carving from raw image' },
      { name:'bulk_extractor', cmd:'bulk_extractor -o output/ -E email,url,domain disk.img', desc:'Extract emails, URLs, domains from raw image' },
      { name:'log2timeline', cmd:'log2timeline.py /out/dump.plaso /mnt/evidence/', desc:'Build super-timeline from evidence directory' },
      { name:'psort', cmd:"psort.py -o l2tcsv /out/dump.plaso 'date > \"2024-03-15 03:00\"' > tl.csv", desc:'Filter plaso timeline to time range' },
    ]},
    { cat: 'Network Forensics', color: 'blue', items: [
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'dns' -T fields -e dns.qry.name -e dns.qry.type | sort | uniq -c | sort -rn", desc:'Top DNS queries with count' },
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'dns.qry.name matches \".{40,}\"' -T fields -e dns.qry.name", desc:'Long DNS queries (tunnelling indicator >40 chars)' },
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'tls.handshake.type==1' -T fields -e ip.dst -e tls.handshake.ja3", desc:'JA3 fingerprints from TLS ClientHellos' },
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'http.response.code==200' --export-objects http,exported/", desc:'Export all HTTP 200 response objects to disk' },
      { name:'tshark', cmd:"tshark -r cap.pcap -z io,stat,60,'ip.dst==185.220.101.47' -q", desc:'60-second beacon rate to specific C2 IP' },
      { name:'tshark', cmd:"tshark -r cap.pcap -q -z conv,tcp | sort -k3 -rn | head -20", desc:'Top TCP conversations by bytes transferred' },
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'smtp or imap or pop' -T fields -e smtp.auth.username", desc:'Email auth credentials in cleartext' },
      { name:'tcpdump', cmd:"tcpdump -nr cap.pcap 'tcp[13] == 0x02' -c 100", desc:'SYN-only packets (port scan detection)' },
      { name:'Zeek', cmd:'zeek -r cap.pcap', desc:'Full protocol analysis: conn.log, dns.log, http.log, ssl.log' },
      { name:'Zeek', cmd:"cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p duration | awk '$4>60' | sort -k4 -rn", desc:'Long-duration connections (C2 beacon candidates)' },
      { name:'NetworkMiner', cmd:'NetworkMiner.exe -r cap.pcap -o extracted/', desc:'GUI: extract files, credentials, images from PCAP' },
      { name:'JA3', cmd:'python3 ja3.py cap.pcap', desc:'Extract JA3/JA3S hashes from all TLS sessions' },
      { name:'Suricata', cmd:'suricata -c /etc/suricata/suricata.yaml -r cap.pcap -l /logs/', desc:'Run Suricata IDS rules against offline PCAP' },
      { name:'nfdump', cmd:'nfdump -r netflow.nfcap -s dstip/bytes -n 20', desc:'Top 20 destinations by bytes from NetFlow data' },
    ]},
    { cat: 'Static Analysis', color: 'volt', items: [
      { name:'strings', cmd:'strings -n8 sample.exe | grep -iE "http|cmd|powershell|\\\\.exe|\\\\.dll|pass"', desc:'Printable strings filtered for IOCs' },
      { name:'strings', cmd:'strings -n8 -e l sample.exe', desc:'UTF-16 LE strings (common in Windows malware)' },
      { name:'FLOSS', cmd:'floss sample.exe', desc:'Static + stack + decoded strings in one pass' },
      { name:'FLOSS', cmd:'floss sample.exe --no-static-strings -j | python3 -m json.tool', desc:'Decoded-only strings as JSON' },
      { name:'capa', cmd:'capa sample.exe', desc:'MITRE ATT&CK + MBC capability map (static)' },
      { name:'capa', cmd:'capa sample.exe -j | python3 -c "import sys,json; d=json.load(sys.stdin); [print(t) for r in d[\"rules\"].values() for t in r[\"meta\"].get(\"attack\",[]) ]"', desc:'Extract ATT&CK techniques only' },
      { name:'YARA', cmd:'yara -r rules/ sample.exe', desc:'Run YARA ruleset recursively against sample' },
      { name:'YARA', cmd:'yara -s malware_rule.yar sample.exe', desc:'Show matching strings (-s) in rule hits' },
      { name:'DIE', cmd:'die sample.exe', desc:'Packer, compiler, language identification' },
      { name:'pefile', cmd:"python3 -c \"import pefile; pe=pefile.PE('s.exe'); [print(s.Name.decode(),round(s.get_entropy(),2)) for s in pe.sections]\"", desc:'Per-section entropy (>7.2 = packed)' },
      { name:'pefile', cmd:"python3 -c \"import pefile; pe=pefile.PE('s.exe'); print(pe.get_imphash())\"", desc:'ImpHash for malware family clustering' },
      { name:'pefile', cmd:"python3 -c \"import pefile; pe=pefile.PE('s.exe'); [[print(e.dll_name.decode(),i.name) for i in e.imports] for e in pe.DIRECTORY_ENTRY_IMPORT]\"", desc:'Full IAT dump: dll + function name' },
      { name:'ssdeep', cmd:'ssdeep sample.exe; ssdeep -m known_hashes.txt sample.exe', desc:'Fuzzy hash — measure similarity between samples' },
      { name:'binwalk', cmd:'binwalk -e firmware.bin', desc:'Firmware extraction: finds and extracts embedded filesystems' },
      { name:'readelf', cmd:'readelf -h sample.elf', desc:'ELF header: magic, type, arch, entry point' },
      { name:'readelf', cmd:'readelf -S sample.elf', desc:'Section headers with sizes and flags (X=execute, W=write)' },
      { name:'readelf', cmd:'readelf -d sample.elf', desc:'Dynamic section: NEEDED libraries, RPATH' },
      { name:'objdump', cmd:'objdump -d -M intel sample | grep -A30 "<decode_payload>"', desc:'Disassemble specific function in Intel syntax' },
    ]},
    { cat: 'Reverse Engineering', color: 'volt', items: [
      { name:'Ghidra', cmd:'analyzeHeadless ~/proj crackme -import sample.exe -postScript PrintAST.java', desc:'Headless analysis + custom post-script' },
      { name:'Ghidra', cmd:'# Search → For Strings (Shift+S)', desc:'Find all printable strings embedded in binary' },
      { name:'Ghidra', cmd:'# Window → Script Manager → FindCryptoConstants', desc:'Identify AES S-box, RC4, SHA-1 constants automatically' },
      { name:'Ghidra', cmd:'# Right-click → References → Show References to Address', desc:'Find all XREFs (callers) for a function or constant' },
      { name:'radare2', cmd:'r2 -A sample.exe', desc:'Open and auto-analyse binary' },
      { name:'radare2', cmd:'r2 -A sample.exe; afl; s sym.main; pdf', desc:'List functions, seek to main, disassemble' },
      { name:'radare2', cmd:"r2 -q -c 'aaa; afn decode_xor 0x401234; pdf @0x401234' sample.exe", desc:'Non-interactive: rename + disassemble function' },
      { name:'radare2', cmd:'r2 -d sample.exe; db 0x401000; dc; dr', desc:'Debug mode: breakpoint, continue, show regs' },
      { name:'Binary Ninja', cmd:'bn sample.exe --headless -s analysis.py', desc:'Headless analysis with Python script' },
      { name:'objdump', cmd:'objdump -d -M intel sample.elf | less', desc:'Full disassembly in Intel syntax' },
      { name:'objdump', cmd:'objdump -t sample.elf | grep -v "0x0 "', desc:'Symbol table: function names and addresses' },
      { name:'gdb + pwndbg', cmd:'gdb -q ./sample; run; bt full', desc:'Full backtrace on crash (finding vuln location)' },
      { name:'gdb', cmd:'(gdb) x/32xb $rsp', desc:'Hex dump 32 bytes at stack pointer' },
      { name:'gdb', cmd:'(gdb) watch *0x601234', desc:'Hardware watchpoint: break when address value changes' },
      { name:'ltrace', cmd:'ltrace -f -e strcmp ./crackme letmein', desc:'Library call trace — strcmp args reveal password' },
      { name:'checksec', cmd:'checksec --file=sample.exe', desc:'Check NX, ASLR, PIE, stack canary, RELRO' },
    ]},
    { cat: 'Dynamic Analysis', color: 'blood', items: [
      { name:'strace', cmd:'strace -f -e trace=network ./sample', desc:'Network syscalls: connect, bind, recv, send' },
      { name:'strace', cmd:'strace -f -o trace.log -tt -e trace=openat,write,connect ./sample', desc:'File + network trace with timestamps to file' },
      { name:'strace', cmd:"strace -f ./sample 2>&1 | grep -E 'connect|bind|recvfrom|sendto'", desc:'Inline filter for network activity' },
      { name:'strace', cmd:"strace -f -e trace=execve ./sample 2>&1 | grep execve", desc:'Child process spawning (pivot chains)' },
      { name:'ltrace', cmd:'ltrace -f -e "strcmp,strcasecmp,memcmp" ./crackme password', desc:'String comparison functions (password reveal)' },
      { name:'gdb', cmd:'gdb -q ./sample; break *0x401234; run; stepi 50', desc:'Break at function, step 50 instructions' },
      { name:'Procmon', cmd:'# Filter: Process Name = sample.exe AND Operation = RegSetValue', desc:'Windows: registry write monitoring' },
      { name:'Process Hacker', cmd:'# Right-click process → Properties → Memory tab', desc:'View all memory regions and their protections' },
      { name:'API Monitor', cmd:'# File → Monitor Process → select sample.exe', desc:'Windows API call capture with args + return values' },
      { name:'Fakenet-NG', cmd:'fakenet-ng -l output.pcap -c config.ini', desc:'Network simulation + PCAP capture without internet' },
      { name:'tcpdump', cmd:'tcpdump -w capture.pcap -i any not port 22 &', desc:'Background capture excluding SSH during execution' },
      { name:'x64dbg', cmd:'# Run to OEP after unpack, then Scylla → IAT Autosearch → Dump', desc:'Windows: unpack + IAT reconstruction workflow' },
      { name:'frida', cmd:"frida -f ./sample --no-pause -l hook_strcmp.js", desc:'Dynamic instrumentation: hook strcmp at runtime' },
      { name:'frida', cmd:"frida -l ssl_log.js -f ./sample", desc:'SSL key logging via OpenSSL hook (decrypt TLS in Wireshark)' },
    ]},
    { cat: 'Unpacking & Patching', color: 'blood', items: [
      { name:'upx', cmd:'upx -d packed.exe -o unpacked.exe', desc:'UPX decompress (requires intact UPX! header)' },
      { name:'strings + grep', cmd:'strings packed.exe | grep -E "UPX!|This program"', desc:'Confirm UPX packing by stub strings' },
      { name:'DIE', cmd:'die packed.exe', desc:'Identify packer/crypter type and version' },
      { name:'entropy', cmd:"python3 -c \"import math; d=open('s.exe','rb').read(); p={b:d.count(b)/len(d) for b in set(d)}; print(round(-sum(p[b]*math.log2(p[b]) for b in p),2))\"", desc:'Whole-file Shannon entropy (>7.2 = packed/encrypted)' },
      { name:'pefile entropy', cmd:"python3 -c \"import pefile; pe=pefile.PE('s.exe'); [print(s.Name,round(s.get_entropy(),2)) for s in pe.sections]\"", desc:'Per-section entropy — find encrypted section' },
      { name:'x64dbg', cmd:'# BP on VirtualAlloc return → F9 → dump allocated buffer', desc:'OEP hunt: break after allocation, trace to JMP OEP' },
      { name:'Scylla', cmd:'# Scylla → IAT Autosearch → Get Imports → Dump → Fix Dump', desc:'IAT reconstruction post-OEP dump in x64dbg' },
      { name:'PE-sieve', cmd:'pe-sieve.exe /pid 1234 /dump 1 /shellc 1 /dir dumps/', desc:'Automated dump of all modified sections' },
      { name:'hollows_hunter', cmd:'hollows_hunter.exe /dir dumps/ /json report.json', desc:'Batch process scan + dump report' },
      { name:'radare2 patch', cmd:"r2 -w sample.exe -c 's 0x401234; wx 9090; q'", desc:'NOP out 2 bytes at address (inline patch)' },
      { name:'xxd + dd', cmd:"xxd sample.exe | grep -n 'UPX!'", desc:'Find UPX magic offset for manual header manipulation' },
      { name:'binwalk', cmd:'binwalk -e --dd=".*" packed.bin', desc:'Extract all embedded file types (PE, zip, ELF)' },
    ]},
    { cat: 'Credential & Hash', color: 'amber', items: [
      { name:'hashcat', cmd:'hashcat -m 1000 -a 0 ntlm.txt rockyou.txt', desc:'NTLM dictionary attack (mode 1000)' },
      { name:'hashcat', cmd:'hashcat -m 0 -a 3 md5.txt ?u?l?l?l?d?d --increment', desc:'MD5 brute-force with incremental mask' },
      { name:'hashcat', cmd:'hashcat -m 13100 -a 0 kerb.txt wordlist.txt -r rules/best64.rule', desc:'Kerberoast TGS-REP cracking with rules' },
      { name:'john', cmd:'john --format=NT --wordlist=rockyou.txt hashes.txt', desc:'NTLM hashes with John the Ripper' },
      { name:'john', cmd:'john --format=raw-md5 hashes.txt --wordlist=wordlist.txt', desc:'MD5 hashes (web app breach format)' },
      { name:'impacket', cmd:'secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL', desc:'Extract all hashes from offline NTDS.dit' },
      { name:'impacket', cmd:'secretsdump.py administrator:Password1@192.168.1.10', desc:'Remote secretsdump via DRSUAPI (DCSync)' },
      { name:'impacket', cmd:'GetUserSPNs.py corp.local/user:pass -dc-ip 10.0.0.1 -request', desc:'Kerberoast: get TGS tickets for cracking' },
      { name:'impacket', cmd:'psexec.py administrator@192.168.1.10 cmd.exe', desc:'PsExec-style lateral movement' },
      { name:'crackmapexec', cmd:'crackmapexec smb 192.168.1.0/24 -u admin -H <NT_HASH> --shares', desc:'Pass-the-hash spray across subnet' },
      { name:'LaZagne', cmd:'python3 laZagne.py all', desc:'Extract credentials from all installed applications' },
      { name:'pypykatz', cmd:'pypykatz lsa minidump lsass.dmp', desc:'Parse LSASS minidump for credentials (offline)' },
      { name:'pypykatz', cmd:'pypykatz registry --sam SAM --system SYSTEM', desc:'Offline SAM database credential extraction' },
      { name:'certipy', cmd:'certipy find -u user@corp.local -p pass -dc-ip 10.0.0.1', desc:'Enumerate AD CS misconfigurations (ESC1-ESC8)' },
    ]},
    { cat: 'YARA & Detection', color: 'volt', items: [
      { name:'YARA', cmd:'yara -r rules/ /suspicious/files/', desc:'Recursive scan directory with all rules' },
      { name:'YARA', cmd:'yara -s -m rule.yar sample.exe', desc:'Show matching strings and metadata in output' },
      { name:'YARA', cmd:'yara --no-warnings rule.yar /proc/*/mem', desc:'Scan all running process memory (Linux, root req)' },
      { name:'yaraGen', cmd:'python3 yarGen.py -m /malware/ -o new_rules.yar', desc:'Auto-generate YARA rules from malware samples' },
      { name:'CAPE', cmd:'curl -X POST http://cape:8000/tasks/create/file -F file=@sample.exe', desc:'Submit to CAPE sandbox for automated analysis' },
      { name:'Sigma', cmd:'sigma convert -t splunk sigma_rule.yml', desc:'Convert Sigma rule to Splunk SPL query' },
      { name:'Sigma', cmd:'sigma convert -t elastic sigma_rule.yml', desc:'Convert Sigma rule to Elasticsearch query' },
      { name:'Suricata', cmd:'suricata -T -c suricata.yaml', desc:'Test Suricata config and rule syntax' },
      { name:'Suricata', cmd:'suricata -r capture.pcap -l /var/log/suricata/ -c suricata.yaml', desc:'Run IDS rules against offline PCAP' },
      { name:'VirusTotal', cmd:'curl --request GET "https://www.virustotal.com/api/v3/files/<SHA256>" -H "x-apikey: <KEY>"', desc:'Query VT for existing analysis of SHA-256' },
      { name:'strings + capa', cmd:'capa -j sample.exe | python3 -m json.tool > capa_report.json', desc:'Full capa output as structured JSON for parsing' },
    ]},
    { cat: 'Windows Investigation', color: 'amber', items: [
      { name:'wevtutil', cmd:'wevtutil qe Security /q:"*[System[EventID=4688]]" /f:text | grep -E "Process Name|Process ID|Creator"', desc:'All process creation events (4688)' },
      { name:'wevtutil', cmd:'wevtutil qe Security /q:"*[System[EventID=4698]]" /f:text', desc:'Scheduled task creation events' },
      { name:'wevtutil', cmd:'wevtutil qe System /q:"*[System[EventID=7045]]" /f:text', desc:'Service install events (7045) — malware persistence' },
      { name:'wevtutil', cmd:'wevtutil qe Security /q:"*[System[EventID=1102]]" /f:text', desc:'Security log cleared event (attacker cleanup)' },
      { name:'reg query', cmd:'reg query HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', desc:'User-level Run key persistence' },
      { name:'reg query', cmd:'reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', desc:'System-wide Run key persistence' },
      { name:'schtasks', cmd:'schtasks /query /fo LIST /v', desc:'All scheduled tasks with full detail' },
      { name:'wmic', cmd:'wmic service where "StartMode=\'Auto\'" get Name,PathName,StartName', desc:'Auto-start services: name, binary path, account' },
      { name:'netstat', cmd:'netstat -ano', desc:'Active connections with PIDs — cross-reference with tasklist' },
      { name:'netstat', cmd:'netstat -ano | findstr ESTABLISHED', desc:'Established connections only' },
      { name:'Autoruns', cmd:'autorunsc.exe -a * -c -h -s -v > autoruns.csv', desc:'All persistence locations to CSV with VirusTotal check' },
      { name:'wmic', cmd:'wmic /namespace:\\\\root\\subscription path __EventFilter get Name,Query /format:list', desc:'WMI event filter persistence enumeration' },
    ]},
    { cat: 'Linux Investigation', color: 'volt', items: [
      { name:'bash', cmd:'cat /etc/crontab; ls /etc/cron.*/', desc:'System cron jobs — attacker persistence location' },
      { name:'bash', cmd:'cat /var/spool/cron/crontabs/*', desc:'Per-user crontabs' },
      { name:'bash', cmd:"find / -name '*.so' -newer /tmp -ls 2>/dev/null", desc:'Shared objects newer than /tmp (LD_PRELOAD hijack candidates)' },
      { name:'bash', cmd:'cat /proc/1234/maps | grep rwx', desc:'RWX memory regions in process 1234 (shellcode)' },
      { name:'bash', cmd:'ls -la /proc/1234/fd | grep deleted', desc:'Open file descriptors to deleted files (fileless persistence)' },
      { name:'bash', cmd:'find /tmp /var/tmp /dev/shm -type f -ls', desc:'Executables dropped to world-writable directories' },
      { name:'bash', cmd:'last -20; lastb -20', desc:'Last 20 successful/failed logins (auth audit)' },
      { name:'bash', cmd:'cat /var/log/auth.log | grep "Accepted publickey" | tail -50', desc:'SSH public key auth events' },
      { name:'bash', cmd:"cat ~/.bash_history; cat /root/.bash_history", desc:'Shell command history — attacker command record' },
      { name:'bash', cmd:"grep -r 'AUTHORIZED_KEYS\|ssh-rsa\|ssh-ed25519' /home/ /root/ 2>/dev/null", desc:'Backdoor SSH public keys planted' },
      { name:'ss', cmd:'ss -tnp', desc:'TCP connections with process info (modern netstat)' },
      { name:'lsof', cmd:'lsof -i TCP -n -P | grep ESTABLISHED', desc:'All established TCP connections with process names' },
      { name:'chkrootkit', cmd:'chkrootkit', desc:'Basic rootkit scanner for common Linux rootkits' },
    ]},
  ];

  const RECALL_CHALS = [
    { q: 'Which Volatility 3 plugin finds RWX anonymous regions containing PE headers (process injection)?', flag: 'malfind' },
    { q: 'Which Sleuth Kit command extracts the raw content of a specific inode to a file?', flag: 'icat' },
    { q: 'Which hashcat mode number is used for Kerberoast TGS-REP cracking?', flag: '13100' },
    { q: 'Which Windows Event ID indicates a new service was installed (common ransomware deployment artifact)?', flag: '7045' },
    { q: 'Which strace trace category isolates connect/bind/recv/send syscalls?', flag: 'network' },
  ];

  $: solvedFlags = $ctf;
  let chalInputs = {};
  let chalWrong = {};

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function submitChal(i, flag) {
    const key = `tools_${i}`;
    const val = normalizeFlag(chalInputs[key]);
    if (val === flag.toLowerCase()) {
      chalWrong = { ...chalWrong, [key]: false };
      ctf.update(s => ({ ...s, [key]: true }));
      showToast('Flag captured', 'success');
    } else {
      chalWrong = { ...chalWrong, [key]: true };
    }
  }

  let search = '';
  $: filtered = TOOLS.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.cmd.toLowerCase().includes(search.toLowerCase()) ||
      i.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  let copied = '';
  function copy(cmd) {
    navigator.clipboard?.writeText(cmd);
    copied = cmd;
    setTimeout(() => { copied = ''; }, 1200);
  }
</script>

<svelte:head><title>Arsenal — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>TOOL ARSENAL</span>
  <span class="ts-right">{TOOLS.reduce((a,c) => a + c.items.length, 0)} commands</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>Tool Arsenal</h1>
    <p>Command reference for every tool used across the BLACKVAULT curriculum. Click any command to copy it to the clipboard, then test recall with the flag challenges at the bottom of the page.</p>
    <input class="search-input" bind:value={search} placeholder="Search tools, commands, and descriptions…" type="search" />
    <div class="intro-pbar"><div class="intro-pfill" style="width:{Math.round(RECALL_CHALS.filter((_, i) => solvedFlags[`tools_${i}`]).length / RECALL_CHALS.length * 100)}%"></div></div>
    <div class="intro-plabel">{RECALL_CHALS.filter((_, i) => solvedFlags[`tools_${i}`]).length}/{RECALL_CHALS.length} flags captured</div>
  </div>

  {#each filtered as cat}
    <section class="tool-section">
      <h2 class="ts-hd">
        <span class="ts-dot ts-{cat.color}"></span>
        {cat.cat}
        <span class="ts-count">{cat.items.length}</span>
      </h2>
      <div class="tool-grid">
        {#each cat.items as item}
          {@const isCopied = copied === item.cmd}
          <button class="tool-card" class:copying={isCopied} on:click={() => copy(item.cmd)} title="Click to copy">
            <div class="tc-top">
              <div class="tc-name">{item.name}</div>
              {#if isCopied}<span class="tc-copied">✓ copied</span>{/if}
            </div>
            <code class="tc-cmd">{item.cmd}</code>
            <div class="tc-desc">{item.desc}</div>
          </button>
        {/each}
      </div>
    </section>
  {/each}

  <section class="tool-section">
    <h2 class="ts-hd"><span class="ts-dot ts-volt"></span>Flag Challenges — command recall</h2>
    <p class="rc-sub">Recall the right tool/value from the cheat sheet above, then submit it as the flag.</p>
    <div class="rc-list">
      {#each RECALL_CHALS as chal, i}
        {@const key = `tools_${i}`}
        {@const got = !!solvedFlags[key]}
        <div class="chal" class:chal-solved={got}>
          <div class="chal-q"><span class="chal-num">{i + 1}.</span> {chal.q}</div>
          {#if got}
            <div class="chal-solved-row">
              <span class="chal-icon">✓</span>
              <code class="chal-flag">BV{'{'}{chal.flag}{'}'}</code>
            </div>
          {:else}
            <form class="chal-form" on:submit|preventDefault={() => submitChal(i, chal.flag)}>
              <input
                class="chal-input"
                type="text"
                placeholder={'BV{...}'}
                autocomplete="off"
                spellcheck="false"
                bind:value={chalInputs[key]}
              />
              <button class="chal-submit" type="submit">Submit</button>
            </form>
            {#if chalWrong[key]}<div class="chal-wrong">Incorrect — re-check the cheat sheet above.</div>{/if}
          {/if}
        </div>
      {/each}
    </div>
  </section>
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
  .page { padding: 28px; flex: 1; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 32px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .intro-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; margin-top: 16px; }
  .intro-pfill { height: 100%; background: var(--amber); border-radius: 2px; transition: width .5s ease; box-shadow: var(--glow-amber); }
  .intro-plabel { font-size: 11px; color: var(--ash); letter-spacing: .04em; }
  .search-input {
    width: 100%; max-width: 480px;
    background: var(--panel2); border: 1px solid var(--line2);
    color: var(--bone); padding: 9px 14px; border-radius: var(--rad);
    font-family: var(--font); font-size: 13px; outline: none;
  }
  .search-input:focus { border-color: var(--volt); }

  .tool-section { margin-bottom: 32px; }
  .ts-hd {
    font-size: 12px; font-weight: 700; color: var(--bone);
    letter-spacing: .08em; text-transform: uppercase;
    margin-bottom: 10px; display: flex; align-items: center; gap: 10px;
  }
  .ts-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .ts-volt   { background: var(--volt); }
  .ts-amber  { background: var(--amber); }
  .ts-blood  { background: var(--blood); }
  .ts-blue   { background: var(--blue); }
  .ts-count  { margin-left: auto; font-size: 10px; color: var(--ash); font-weight: 400; }

  .tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .tool-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 12px 14px;
    text-align: left; cursor: copy;
    transition: border-color .12s, background .12s;
    width: 100%;
  }
  .tool-card:hover { border-color: var(--volt); background: var(--panel2); }
  .tool-card.copying { border-color: var(--volt); background: color-mix(in srgb, var(--volt) 8%, transparent); }
  .tc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .tc-name { font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: .06em; text-transform: uppercase; }
  .tc-copied { font-size: 10px; color: var(--volt); font-weight: 700; }
  .tc-cmd { display: block; font-size: 11px; color: var(--volt); font-family: var(--mono); margin-bottom: 5px; word-break: break-all; line-height: 1.5; }
  .tc-desc { font-size: 11px; color: var(--dim); line-height: 1.4; }

  @media (max-width: 900px) { .tool-grid { grid-template-columns: 1fr; } }

  .rc-sub { font-size: 13px; color: var(--ash); margin: -2px 0 14px; }
  .rc-list {
    background: color-mix(in srgb, var(--amber) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
    border-radius: var(--rad); padding: 16px 18px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .chal { border-top: 1px solid color-mix(in srgb, var(--amber) 14%, transparent); padding-top: 12px; }
  .chal:first-of-type { border-top: none; padding-top: 0; }
  .chal-q { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 8px; }
  .chal-num { color: var(--amber); font-weight: 700; margin-right: 2px; }

  .chal-form { display: flex; gap: 8px; }
  .chal-input {
    flex: 1; min-width: 0;
    background: var(--void); border: 1px solid var(--line);
    color: var(--bone); font-family: var(--mono); font-size: 12px;
    padding: 8px 10px; border-radius: var(--rad);
    transition: border-color .15s;
  }
  .chal-input:focus { outline: none; border-color: var(--volt); }
  .chal-submit {
    padding: 8px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s; flex-shrink: 0;
  }
  .chal-submit:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }
  .chal-wrong { font-size: 12px; color: var(--blood); margin-top: 6px; }

  .chal-solved-row { display: flex; align-items: center; gap: 8px; }
  .chal-icon { color: var(--volt); font-weight: 700; }
  .chal-flag {
    font-family: var(--mono); font-size: 12px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 4px 10px; border-radius: 3px;
  }
</style>
