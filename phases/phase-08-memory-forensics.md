# 🗂️ Phase 8 — Memory Forensics

**Track:** Digital Forensics · **Prereqs:** Phase 3 (PE/ELF), Phase 6 (dynamic) · **Feeds:** Phase 11 (rootkits), Phase 12 (capstone)
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. You've started this: EPROCESS internals, pslist vs psscan cross-view, Volatility installed. (Your Linux VM is the *analysis workstation*; the *targets* are often Windows memory images.)

> **The whole phase in one sentence:** a RAM capture is a frozen crime scene with every process, secret, and hidden intruder still standing where they were — memory forensics is walking that scene reading the chalk outlines.

---

## 0 · The single idea everything here rests on

Disk lies; memory doesn't (much). Malware that's fileless, packed, or rootkitted on disk is **fully decrypted and resident in RAM** while it runs. A memory image freezes that truth at one instant. The catch: the image is just raw bytes — turning bytes into "here are the processes" requires knowing the kernel's data structures (**EPROCESS, VAD**, …). Volatility encodes that knowledge; you supply the judgment about what's anomalous.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 Acquisition
- [ ] **When/why you capture RAM** — order of volatility; memory before disk.
- [ ] **Acquisition tools** — WinPmem, LiME (Linux), AVML; and **VM snapshots as images** (`.vmem`/`.raw`).
- [ ] **Profiles / symbols** — why Volatility must know the exact OS build (Vol2 *profiles* vs Vol3 *symbol tables / ISF*).

### 1.2 The structures (the ground-up part)
- [ ] **EPROCESS** — the kernel's process record; the `ActiveProcessLinks` doubly-linked list.
- [ ] **Why `pslist` is spoofable** — it *walks the list*; DKOM unlinks an entry to hide it.
- [ ] **Why `psscan` catches it** — it *scans for pool tags*, finding processes that were unlinked → **cross-view detection**.
- [ ] **VAD tree** — Virtual Address Descriptors; how regions are described; spotting **RX private** regions (injected code).
- [ ] **PEB / handles / tokens** — at a high level, what each can reveal.

### 1.3 Core Volatility workflow
- [ ] **`pslist` / `psscan` / `pstree`** — process landscape + cross-view + parentage.
- [ ] **`dlllist` / `ldrmodules`** — loaded modules; the three-list cross-view for injection.
- [ ] **`malfind`** — auto-locate injected / suspicious RX private memory.
- [ ] **`handles` / `netscan` / `cmdline` / `filescan`** — context, network, args, on-disk refs.
- [ ] **`procdump` / `memdump`** — pull a process's memory for static/dynamic follow-up.

### 1.4 Injection & fileless tells
- [ ] **Injection styles** — CreateRemoteThread, reflective DLL, process hollowing, raw shellcode in RX VADs.
- [ ] **What each looks like** — in `malfind` / `ldrmodules` output.
- [ ] **Extract → disassemble** — pull injected shellcode and take it back to Ghidra (Phase 5).

### 1.5 Linux memory (Hermes-native)
- [ ] **LiME capture** + Volatility linux plugins; banner/symbol building.
- [ ] **`linux_pslist` / `linux_psscan`** analogues and the same cross-view logic.

---

## 2 · Where to learn it — let these do the teaching

**Channels / courses**
- **13Cubed** — *the* memory-forensics channel (Volatility playlists). · Volatility Foundation docs/wiki. · SANS FOR508 free talks/posters.

**Book (definitive)**
- *The Art of Memory Forensics* — Ligh, Case, Levy, Walters. Do its exercises.

**Search queries**
- `Volatility 3 cheat sheet`
- `EPROCESS ActiveProcessLinks DKOM hiding`
- `VAD RX private injected code malfind`
- `pslist vs psscan difference`
- `extract shellcode Volatility memdump disassemble`

> **Sample sourcing (you need memory *images*, not the malware itself):** **MemLabs** (GitHub: stuxnet999) — guided memory CTF. **CyberDefenders.org** — free memory blue-team challenges. Volatility Foundation sample images; Ali Hadi (ashemery) challenges. **Or make your own:** snapshot Hermes mid-detonation of your Phase 6 Encoder run — that `.raw` *is* a memory image to analyze.

---

## 3 · Practice — drills on Hermes (grip happens here)

### Drill 0 — Confirm Volatility works
```bash
vol -f image.raw windows.info          # Vol3; or `vol.py -f image.raw imageinfo` for Vol2
```

### Drill 1 — Cross-view by hand (the EPROCESS idea, made real)
Run `pslist` **and** `psscan` on a MemLabs/CyberDefenders image and diff them. Anything in `psscan` but **not** `pslist` = your prime suspect (an unlinked EPROCESS).

### Drill 2 — Parentage story
`pstree` and hunt the anomaly: a child with a parent it shouldn't have (e.g., `explorer → cmd → something-weird`).

### Drill 3 — malfind hunt
Run `malfind`, find an RX private region, dump it, and disassemble the shellcode in Ghidra. You've now pulled injected code straight out of RAM.

### Drill 4 — Roll your own image
Snapshot Hermes during your Phase 6 Encoder detonation, convert the QEMU memory to a raw dump, and run the **Linux** Volatility plugins. Find the encoder process resident in RAM.

### Drill 5 — Network from memory
`netscan` on a challenge image, pull the C2 endpoints, and note how you'd corroborate them in a pcap (bridge to Phase 9).

### Drill 6 — Write-up
Image profile · suspicious processes (with the cross-view evidence) · injected regions · extracted IOCs · one-paragraph reconstruction.

---

## 4 · Ground-up self-check (your words, no rote)

1. Why can memory reveal malware that disk analysis completely misses?
2. `pslist` walks a linked list; `psscan` scans pool tags. Why does that difference catch a DKOM-hidden process?
3. What is a VAD, and why does an **RX private** region scream "injected"?
4. You dumped a process with `procdump` but it won't run/disassemble cleanly. Why might a memory-dumped image differ from the on-disk original?
5. Why does Volatility need the exact OS build/symbols, and what breaks if it's wrong?
6. A process appears in both `pslist` and `psscan` and looks normal — does that prove it's clean? Why not?

---

## 5 · Phase 8 is done when…
- [ ] You can cross-view (`pslist` vs `psscan`) and explain any delta as EPROCESS unlinking.
- [ ] You can use `malfind` to locate and dump injected code, then disassemble it.
- [ ] You've generated **and** analyzed your own memory image from Hermes.
- [ ] You can pull network IOCs from a memory image.
- [ ] You have one memory-forensics report.

→ Next: **Phase 9 — Network Forensics** (those `netscan` endpoints become beacons you watch on the wire).

---

## 6 · Traps that bite everyone
- **Wrong profile/symbols** → garbage output you might trust.
- **`malfind` hits ≠ automatically malicious** — legit JIT/.NET trips it.
- **Imaging after a reboot** — the evidence is gone (order of volatility).
- **A clean `pslist` proves nothing on its own** — always cross-view.
- **Vol2 vs Vol3 syntax confusion** — know which you installed.

---

*One file per phase · Phase 8 of 12.*
