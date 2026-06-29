# BLACKVAULT // Range — real-tool field guide

The **Range** tab inside `../console.html` is a trainer: it simulates the tools in your browser so you
learn the moves with zero setup. This folder is the **real thing** — genuine artifacts you crack with
the actual tools you'll use on the job. Every command below was verified to work on these files.

> All artifacts are **synthetic and defensive**: crackmes, fabricated samples, a hand-built pcap, a
> forensic image with planted files. Nothing here is live malware. Flags are `BV{...}`.

```
range/
├── crackmes/    crackme1-3 (.c + stripped ELF) + Makefile      → radare2 / gdb / objdump
├── disk/        disk.img  (real MBR + ext4 w/ deleted file)    → mmls / fls / icat
├── malware/     packed.exe (real UPX) + sample.c               → upx / strings / entropy
├── network/     capture.pcap (DNS exfil + C2 beacon + MZ)      → tcpdump / Wireshark
├── protocol/    c2_capture.bin (custom BE-EF framed protocol)  → xxd / python
├── memory/      memory-sample.raw (planted IOCs)               → strings / Volatility 3
├── crypto/      ciphertexts.txt                                → CyberChef / python
├── hashcrack/   hashes.txt + wordlist.txt                      → hashcat / john-jumbo
├── stego/       photo.png, carve_me.bin                        → strings / unzip / binwalk
├── logs/        auth.log, access.log                           → grep / awk
└── asm/         trace.c + trace                                → gdb
```

---

## 01 · Disk & File Systems → Sleuthkit
A real DOS-partitioned image: partition 1 is an **ext4** filesystem holding a normal file and a
**deleted-but-recoverable** `secret.txt`.
```bash
cd disk
mmls disk.img                      # partition table: Linux(0x83) @2048, FAT32 @10240
fdisk -l disk.img                  # same, the other way
fls -o 2048 disk.img               # files in p1 — secret.txt shows "* " = deleted
icat -o 2048 disk.img 14           # recover inode 14  ->  BV{d3l3t3d_but_n0t_g0n3}
xxd disk.img | less                # raw hex spelunking
```

## 02 · Assembly → gdb
```bash
cd asm && gcc -O0 -g -o trace trace.c     # (already built)
gdb ./trace
  (gdb) break compute
  (gdb) run
  (gdb) stepi          # step one instruction; watch rax build: 5 +3 →8, ²→64, −4 →60
  (gdb) info registers rax
./trace; echo $?       # 60   (the return value)
```

## 03 · PE & ELF Formats → readelf / objdump
```bash
cd crackmes
readelf -h crackme1                # ELF magic, class, type (DYN/PIE), e_entry
readelf -S crackme1                # section headers
objdump -d -M intel crackme1 | less # disassembly
```

## 04 · Static Analysis → strings / entropy
`malware/packed.exe` is a real UPX-packed ELF; the readable strings are hidden until you unpack.
```bash
cd malware
strings packed.exe | grep -E 'cdn-telemetry|BV\{'   # nothing — it's packed
strings packed.exe | grep UPX                       # UPX! stub strings = packing tell
sha256sum packed.exe                                # hash → reputation lookup
```

## 05 · Ghidra & Decompiler → radare2
```bash
cd crackmes
r2 -A crackme2        # then:  afl  (list funcs) · s main · pdf  (disasm) · pdc  (pseudo-C)
```
`pdc` is radare2's decompiler view — the open-source Ghidra stand-in. Recover the XOR key from the
loop, same as the browser RE Bench.

## 06 · Dynamic Analysis → strace
```bash
strace ./crackmes/crackme1 letmein    # watch the syscalls/library calls as it runs
# ltrace ./crackmes/crackme1 letmein  # if ltrace is installed: see strcmp(input,"letmein")
```

## 07 · Unpacking & Patching → upx / radare2
```bash
cd malware
cp packed.exe unpacked && upx -d unpacked     # real unpack to the OEP
strings unpacked | grep BV                     # BV{unp4ck3d_w1th_upx}  ← now visible
r2 -w ../crackmes/crackme1   # then s <addr of jne> ; "wa nop;nop"  to patch a check
```

## 08 · Memory Forensics → strings / Volatility 3
`memory/memory-sample.raw` is a blob with planted artifacts (a real RAM image needs a VM capture).
```bash
cd memory
strings -n6 memory-sample.raw | grep -Ei 'svch0st|185\.220|telemetry|exfil'
echo 'QlZ7bTNtMHJ5X2QwbnRfbDEzfQ==' | base64 -d        # BV{m3m0ry_d0nt_l13}
# the real deal on an actual image:  pip install volatility3
#   vol -f image.raw windows.pslist / windows.malfind / windows.netscan
```

## 09 · Network Forensics → tcpdump / Wireshark
A real capture: DNS exfil, a 60-second C2 beacon, and an executable downloaded over HTTP.
```bash
cd network
tcpdump -nr capture.pcap                                   # all packets
tcpdump -nr capture.pcap 'tcp[tcpflags] & tcp-syn != 0'    # 5 SYNs to 185.220.101.47, ~60s apart = beacon
tcpdump -nr capture.pcap 'udp port 53'                     # DNS exfil to *.exfil.cdn-telemetry.xyz
strings capture.pcap | grep -E 'MZ|BV\{|DOS mode'          # carve the downloaded PE → BV{c4rv3d_fr0m_http}
# decode the exfil: take the hex labels (s0-…, s1-…) in order → hex → ascii → BV{pcap_dn5_3xf1l}
```

## 10 · Protocol RE & C2 → xxd / python
```bash
cd protocol
xxd c2_capture.bin                # spot the repeating BE EF frame magic
python3 - <<'PY'
b=open('c2_capture.bin','rb').read(); i=0; k=0x5a; names={1:'BEACON',2:'EXEC',3:'EXFIL'}
while i<len(b):
    if b[i]==0xBE and b[i+1]==0xEF:
        ln=b[i+2]|(b[i+3]<<8); op=b[i+4]
        pl=bytes(x^k for x in b[i+5:i+5+ln]).decode()
        print(f"[{names.get(op,op)}] {pl}"); i+=5+ln
    else: i+=1
PY
# → [BEACON] ID=BV01|os=win10   [EXEC] whoami   [EXFIL] BV{pr0t0_byt3s}
```

## 11 · Rootkits & Artifacts → grep
The persistence / abuse story lives across the logs + memory artifacts.
```bash
grep -E 'Accepted|Failed' logs/auth.log    # brute force from 45.133.1.88, then success as admin
grep cmd= logs/access.log                   # the web shell: /uploads/av4t4r.php?cmd=...
```

## 12 · Full Investigation → all of it
Chain it into one timeline: `disk.img` (what was dropped) → `capture.pcap` (C2 + exfil) →
`memory-sample.raw` (the injected process) → `logs/` (how they got in). Write the kill chain.

---

## Skill-lab artifacts

```bash
# CRYPTO
cat crypto/ciphertexts.txt        # decode each to a BV{...} (CyberChef or the browser workbench)

# HASH CRACKING  (this john lacks raw-md5; use hashcat or john-jumbo)
hashcat -m 0 -a 0 hashcrack/hashes.txt hashcrack/wordlist.txt --potfile-disable
#   5f4dcc…:password   21232f…:admin   0d107d…:letmein
python3 -c 'import hashlib;w=[x.strip() for x in open("hashcrack/wordlist.txt")];[print(h[:8],"->",p) for h in (l.strip() for l in open("hashcrack/hashes.txt")) for p in w if hashlib.md5(p.encode()).hexdigest()==h]'

# STEGO / CARVING
file stego/photo.png                       # a real PNG…
strings stego/photo.png | grep BV          # …with BV{4ft3r_1end} hidden past the IEND marker
unzip -p stego/carve_me.bin                # a ZIP appended to a text file → BV{4pp3nd3d_z1p}

# REVERSE ENGINEERING
cd crackmes && make
./crackme1 letmein     # ACCESS GRANTED   (pwd in .rodata)
./crackme2 pwnage      # ACCESS GRANTED   (XOR 0x33 of a key table)
./crackme3 40000008    # VALID SERIAL     (weighted checksum keygen)
```

---

### Suggested loop
1. Do the lab in the **browser console** (fast feedback, hints, scored objectives).
2. Redo the **same lab here with the real tool** — no hints.
3. When the real tool feels natural, you've actually learned it, not just read about it.
