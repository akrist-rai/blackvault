# 🦠 🗂️ Phase 11 — Rootkits & Forensic Artifacts

**Track:** Malware Analysis + Digital Forensics · **Prereqs:** Phase 8 (memory), Phase 1 (disk/filesystem), Phase 6 (dynamic) · **Feeds:** Phase 12 (capstone)
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. Windows artifacts (MFT/registry/EVTX) come from disk images; Linux rootkit drills run on Hermes itself. (TDL4/LoJax were on your "to-cover" list — this is the phase for them.)

> **The whole phase in one sentence:** rootkits exist to make you look in the wrong place — this phase is learning to cross-check reality from three angles at once so the lie can't hold in all of them.

---

## 0 · The single idea everything here rests on

A rootkit's entire job is to **corrupt your sources of truth** — hide a process from the API, unlink a driver, scrub a log. The counter is **cross-view**: no rootkit lies *consistently everywhere*. The kernel list says one thing, the pool scan says another; the registry says one thing, the MFT timestamps say another. You catch rootkits — and reconstruct attacker activity — by triangulating sources that *should* agree and finding where they don't.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 What rootkits do
- [ ] **Goal** — stealth + persistence at high privilege.
- [ ] **User-mode vs kernel-mode** — IAT/inline API hooks vs SSDT hooks, DKOM, malicious drivers.
- [ ] **Bootkits** — TDL4, **LoJax** (UEFI) — surviving *below* the OS.
- [ ] **The key insight** — each hiding technique creates a *detectable inconsistency*.

### 1.2 DKOM & kernel detection (builds on Phase 8)
- [ ] **DKOM** — Direct Kernel Object Manipulation: unlinking EPROCESS, hiding drivers/modules.
- [ ] **Detection** — `psscan` vs `pslist`, `modscan` vs `modules`, SSDT/driver-IRP checks in Volatility.
- [ ] **Hook detection** — inline + SSDT hook discovery.

### 1.3 Windows forensic artifacts (the DFIR core)
- [ ] **MFT (`$MFT`)** — every file's metadata; deleted-file traces; **timestomping** detection via `$STANDARD_INFO` vs `$FILE_NAME` timestamps.
- [ ] **Registry hives** — Run keys, services, **ShimCache/AppCompatCache**, **AmCache** (execution evidence), USB history, user activity.
- [ ] **Event logs (EVTX)** — logons (4624/4625), process creation (4688), service install (7045), PowerShell; and **log-clear (1102)**.
- [ ] **Other artifacts** — Prefetch, ShellBags, Jump Lists, SRUM, `$UsnJrnl` (USN journal).

### 1.4 Timelining & anti-forensics
- [ ] **Super-timeline** — `log2timeline`/plaso fuses all artifacts into one chronology.
- [ ] **Anti-forensics residue** — timestomping, log clearing, secure delete each leave their *own* trace.
- [ ] **Correlation** — defeat a single tampered source by cross-referencing the others.

### 1.5 Linux equivalents (Hermes-native)
- [ ] **LKM rootkits** — `/proc` hiding, syscall-table hooking.
- [ ] **Artifacts** — `auth.log`, `bash_history`, systemd persistence, `auditd`.
- [ ] **Cross-view with memory** — Phase 8 Linux plugins vs live `ps`.

---

## 2 · Where to learn it — let these do the teaching

**Channels / tools**
- **13Cubed** (registry, MFT, EVTX, ShimCache — outstanding) · DFIR Science · SANS DFIR posters/cheatsheets. · **Eric Zimmerman tools** + his talks: MFTECmd, Registry Explorer, EvtxECmd, AmcacheParser.

**Books**
- *The Art of Memory Forensics* (rootkit chapters) · *Windows Forensic Analysis* — Harlan Carvey · **_Rootkits and Bootkits_ — Matrosov** (for the TDL4/LoJax depth you flagged).

**Search queries**
- `DKOM detection Volatility psscan modscan`
- `timestomping $STANDARD_INFO $FILE_NAME MFT`
- `ShimCache AmCache execution evidence`
- `EVTX 4688 4624 7045 1102 hunting`
- `log2timeline plaso super timeline tutorial`

> **Sample sourcing:** CyberDefenders / DFIR-CTF disk **and** memory images (registry, MFT, EVTX included). Eric Zimmerman's sample data; Ali Hadi challenges; MemLabs. For rootkit *code*, public LKM-teaching repos — read them **to understand detection**, run only in the lab.

---

## 3 · Practice — drills on Hermes (grip happens here)

### Drill 0 — Tooling
Load MFTECmd / Registry Explorer / EvtxECmd against sample artifacts from a CyberDefenders image.

### Drill 1 — DKOM cross-view
On a memory image with a hidden process, prove the hide via `psscan` − `pslist`, and (if present) `modscan` vs `modules`. Name the structure being manipulated.

### Drill 2 — Timestomp hunt
Parse `$MFT`; find a file whose `$STANDARD_INFO` and `$FILE_NAME` timestamps disagree → flag the timestomp.

### Drill 3 — Execution evidence
From registry (ShimCache/AmCache) + Prefetch, build the list of *what ran and when* — independent of whether the binaries still exist on disk.

### Drill 4 — Log story + tamper
From EVTX, reconstruct a logon → process-create → service-install chain, and find the **1102** clear (or the gap that implies one).

### Drill 5 — Catch your own rootkit (Linux, on Hermes)
Load a **benign teaching LKM** that hides a PID, then expose it: `/proc` vs `ps` vs your Phase 8 memory image. Detect the rootkit you just installed.

### Drill 6 — Super-timeline
Run plaso over a sample image, then write the 5-line attacker narrative the timeline supports.

---

## 4 · Ground-up self-check (your words, no rote)

1. Why is cross-view the master technique against rootkits — what assumption does *every* rootkit violate?
2. `$STANDARD_INFO` vs `$FILE_NAME` timestamps — why does the discrepancy expose timestomping?
3. ShimCache/AmCache can prove a binary executed even after deletion. Why does that evidence survive?
4. Event ID 1102 means logs were cleared — but the attacker cleared them to hide. Why is the clear itself a finding?
5. A process is hidden from `ps` on your Linux box. Name two independent sources you'd cross-check to expose it.
6. DKOM unlinks EPROCESS from the active list. Why does the pool scan still find it?

---

## 5 · Phase 11 is done when…
- [ ] You can detect a DKOM-hidden process via cross-view and name the manipulated structure.
- [ ] You can identify a timestomp from MFT attribute comparison.
- [ ] You can prove execution from registry/Prefetch with the binary gone.
- [ ] You can reconstruct an activity chain from EVTX and spot tampering.
- [ ] You've caught a rootkit you loaded yourself on Hermes.
- [ ] You have one artifact-driven timeline report.

→ Next: **Phase 12 — Full Investigation Scenario** (every instrument so far, played at once).

---

## 6 · Traps that bite everyone
- **Trusting any single source a rootkit could have touched.** Always triangulate.
- **Reading only `$STANDARD_INFO` times** (the ones malware edits) and missing `$FILE_NAME`.
- **Absence of logs ≠ absence of activity** — clearing/tamper *is* the signal.
- **Confusing ShimCache "presence" with "execution"** — the semantics differ by Windows version; know the nuance.
- **Deploying rootkit code outside the lab.** Study for detection, contain everything.

---

*One file per phase · Phase 11 of 12.*
