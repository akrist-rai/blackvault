# BLACKVAULT

Self-directed security training range covering Digital Forensics, Reverse Engineering, and Malware Analysis. No VMs to configure, no accounts to create — open `console.html` and start.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page — curriculum overview, feature grid, cert alignment, learning paths |
| `console.html` | Main training console — all study, lab, case, and CTF content |
| `playbook.html` | IR runbooks — 4 interactive incident response playbooks |
| `tools.html` | Tool arsenal reference — 10 tool categories, live search, click-to-copy |
| `intel.html` | Threat intelligence reference — ATT&CK cards, actor profiles, detection templates |
| `challenge.html` | CTF challenge bank |

All pages share the same design system (Space Grotesk + Space Mono, CSS variables, no framework).

---

## Curriculum — 12 Phases

| # | Phase | Track | Key Tools |
|---|---|---|---|
| 01 | Disk & Filesystems | DF | mmls, fls, icat, xxd |
| 02 | x86/x64 Assembly | RE | gdb, objdump |
| 03 | PE & ELF Binary Format | RE | readelf, pefile, PE-bear |
| 04 | Static Malware Analysis | MA | strings, FLOSS, capa, YARA |
| 05 | Ghidra Decompiler | RE | Ghidra, radare2 |
| 06 | Dynamic Malware Analysis | MA | strace, API Monitor, x64dbg |
| 07 | Unpacking & Patching | RE/MA | upx, x64dbg, radare2 |
| 08 | Memory Forensics | DF | Volatility 3, malfind, netscan |
| 09 | Network Forensics | DF | Wireshark, tshark, NetworkMiner |
| 10 | Protocol RE & C2 | RE | xxd, Scapy, Wireshark |
| 11 | Rootkits & Artifacts | DF/MA | Autoruns, Registry Explorer, evtx |
| 12 | Full Investigation | DF | end-to-end reconstruction |

Phase guides live in `phases/` as standalone Markdown references with concept breakdowns, lab walkthroughs, flashcards, and common traps.

---

## Console — What's Inside

**Study** — phase-by-phase reading material, flashcard drill, quiz, review, and chapter exam

**Range** — browser-based labs with simulated tool output and scored objectives:

| Lab | Track | Focus |
|---|---|---|
| Disk Forensics | DF | partition tables, deleted file recovery, icat |
| Assembly Trace | RE | gdb step-through, register reads |
| PE & ELF | RE | headers, sections, IAT/GOT |
| Static Analysis | MA | strings, FLOSS, imports, entropy |
| Ghidra RE | RE | decompiler workflow, xrefs, struct recovery |
| Dynamic Analysis | MA | strace, API monitor, behavior triage |
| Unpacking | MA | UPX detection, OEP finding, patching |
| Memory Forensics | DF | Volatility malfind, netscan, DKOM |
| Network Forensics | DF | beacon detection, JA3, pcap carving |
| Protocol RE | RE | magic bytes, XOR key recovery, framing |
| Rootkit Hunting | MA | Run keys, SSDT hooks, timestomping |
| Capstone | DF | full kill chain reconstruction |
| **YARA Writing** | MA | strings/entropy analysis, rule authoring, sample testing |
| **Super-timeline** | DF | log2timeline/plaso simulation, brute-force→C2→ransomware chain |
| **Threat Hunting** | DF | beacon periodicity, LSASS access, LotL, process tree |
| **Crypto in Malware** | RE | entropy scan, AES S-box, key schedule, RC4 KSA |

**Cases** — 4 full investigation scenarios (HERMES-07 ransomware, NItro fileless, SOLAR-TRACE supply chain, EXODUS-9 insider threat)

**CTF** — 30 challenges across DF, RE, and MA tracks

**ATT&CK** — MITRE ATT&CK technique reference mapped to 70+ techniques

**Badges** — 22 achievement badges tracking mastery progression

---

## IR Playbooks (`playbook.html`)

Four interactive incident response runbooks with localStorage-persisted checklists, decision matrices, command references, and MITRE ATT&CK tags:

- **Ransomware** — detect → triage → contain → investigate → recover → harden; negotiation decision matrix; OFAC warning
- **Data Breach** — regulatory notification timelines (GDPR 72h, HIPAA 60d, PCI DSS 24h, SEC 4 days)
- **Supply Chain Compromise** — dormancy-aware triage, sinkholing, XZ Utils/SolarWinds/3CX TTPs
- **BEC / Email Fraud** — wire recall urgency, OAuth consent audit, M365 Conditional Access hardening

---

## Real Artifacts (`range/`)

The console simulates tools. `range/` has the real artifacts — crack them with actual tools installed on your machine.

```
range/
├── crackmes/    crackme1-3 (stripped ELF + source)    → radare2 / gdb / objdump
├── disk/        disk.img (MBR + ext4, deleted file)   → mmls / fls / icat
├── malware/     packed.exe (real UPX-packed ELF)      → upx / strings / entropy
├── network/     capture.pcap (DNS exfil + C2 + MZ)   → tcpdump / Wireshark
├── protocol/    c2_capture.bin (BE-EF framed C2)      → xxd / python
├── memory/      memory-sample.raw (planted IOCs)      → strings / Volatility 3
├── crypto/      ciphertexts.txt                       → CyberChef / python
├── hashcrack/   hashes.txt + wordlist.txt             → hashcat / john
├── stego/       photo.png, carve_me.bin               → strings / binwalk
├── logs/        auth.log, access.log                  → grep / awk
└── asm/         trace.c + trace (ELF)                 → gdb
```

All artifacts are synthetic and defensive — fabricated samples, planted IOCs, a hand-built pcap. No live malware. Flags are `BV{...}`.

See `range/README.md` for verified commands on every artifact.

---

## Learning Paths

| Path | Time | Focus |
|---|---|---|
| DFIR Fast Track | ~40h | Phases 1, 8, 9, 11, 12 + DF labs + Cases |
| Full Curriculum | ~120h | All 12 phases + all labs + CTF + Cases |
| Malware Analyst | ~60h | Phases 3–7 + MA labs + YARA + Crypto RE |

---

## Cert Alignment

GREM · GCFE · GCFA · OSCP/OSED · CySA+ · BTL1/BTLO

---

## Design System

Pure HTML/CSS/JS — no build step, no framework, no accounts. Progress persists in `localStorage`. Open any `.html` file directly in a browser or serve with any static file server:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
