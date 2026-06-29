# 🗂️ 🦠 ⚙️ Phase 12 — Full Investigation Scenario

**Track:** Digital Forensics + Malware Analysis + Reverse Engineering (all three) · **Prereqs:** everything (1–11) · **Feeds:** real casework + your portfolio
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. Your own Phase 6–11 artifacts (Encoder binary, its memory image, its pcap) make a ready-made capstone case.

> **The whole phase in one sentence:** the capstone — you're handed a breach with no narration and you walk out with the full story: how they got in, what they ran, where they hid, who they called, and what they took — proven from artifacts.

---

## 0 · The single idea everything here rests on

Every prior phase was one instrument; this is the **orchestra**. No single tool tells the story — you pivot disk → memory → network → binary and back, each finding generating the next question. The deliverable isn't a tool output; it's a **defensible narrative**: a timeline where every claim is backed by an artifact, mapped to ATT&CK, with IOCs that would actually help a defender. This is what the job *is*.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 The investigation method
- [ ] **Triage & scoping** — what do you have (disk, RAM, pcap, alerts), what's the question.
- [ ] **Evidence handling** — order of volatility, chain of custody, hash everything.
- [ ] **Hypothesis-driven pivoting** — your observation→inference→skill loop, run at *case* scale.

### 1.2 The kill chain you're reconstructing
- [ ] **The stages** — initial access → execution → persistence → priv-esc → defense evasion → C2 → lateral movement → collection → exfil.
- [ ] **Evidence → ATT&CK** — map each found artifact to a technique; build the matrix *from* the evidence.

### 1.3 Cross-source correlation (the whole point)
- [ ] **Pivot across sources** — memory (Ph8) ↔ disk artifacts (Ph11) ↔ network (Ph9) ↔ behavior (Ph6) ↔ binary internals (Ph5/7/10).
- [ ] **Confirm/refute** — use one source to verify another; resolve conflicts.
- [ ] **IOC pivot** — chase one indicator everywhere (an IP in memory → find it in the pcap → find the binary that beacons to it → RE its protocol).

### 1.4 The super-timeline & narrative
- [ ] **Fuse** — plaso super-timeline + your memory/network findings into one chronology.
- [ ] **Two audiences** — technical appendix (evidence, IOCs) + executive summary (what happened, impact).
- [ ] **IOC provenance discipline** — every indicator traceable to exactly where you found it.

### 1.5 Reporting & defense
- [ ] **Structured IOC export** — STIX-ish; detection recommendations.
- [ ] **Author detections** — Sigma + Suricata + YARA you would actually deploy.
- [ ] **Lessons → hardening** — what would have caught this earlier.
- [ ] **Honest limits** — state clearly what the evidence does *not* support.

---

## 2 · Where to learn it — let these do the teaching

**Channels / sites**
- **13Cubed** (full investigations) · **The DFIR Report (thedfirreport.com)** — real end-to-end intrusion reports; *this is the template for your write-ups*. · SANS DFIR.

**Books**
- *Incident Response & Computer Forensics* — Luttgens/Mandia · *Intelligence-Driven Incident Response* · revisit *The Art of Memory Forensics*.

**Platforms (full scenarios)**
- **CyberDefenders** blue-team labs · **Splunk Boss of the SOC (BOTS)** datasets · DFIR CTFs · Magnet Virtual Summit CTF.

**Search queries**
- `full DFIR investigation walkthrough`
- `attack reconstruction timeline ATT&CK`
- `thedfirreport intrusion analysis`
- `build IOC report from forensic evidence`
- `write Sigma rule from incident`

> **Sample sourcing:** CyberDefenders full incident challenges (disk + memory + pcap together); BOTS v1–v3; public Unit 42 / DFIR Report cases to emulate. **Best capstone:** chain *your own* artifacts — your Encoder detonation already produced a memory image (Ph8), a pcap (Ph9), and the binary (Ph6/7). Investigate it as if you'd never seen it.

---

## 3 · Practice — drills on Hermes (grip happens here)

### Drill 0 — Inventory
Pick a multi-evidence CyberDefenders/BOTS scenario (or your own Encoder artifacts). Hash everything; write the case question in one sentence.

### Drill 1 — Triage pass
Quick wins across each source — `pslist`/`malfind` on RAM, suspicious EVTX, beacon in the pcap — to form your first hypothesis.

### Drill 2 — Pivot chain
Take **one** IOC and chase it through all sources: suspicious process (memory) → its file (MFT) → its persistence (registry) → its C2 (pcap) → its protocol (binary RE). Document every pivot.

### Drill 3 — Super-timeline
Run plaso/log2timeline over the disk, fold in your memory + network findings, produce one chronological story.

### Drill 4 — Map to ATT&CK
Turn the timeline into a technique matrix — **each cell backed by a specific, cited artifact** (with provenance).

### Drill 5 — Write detections
Author one **Sigma**, one **Suricata**, and one **YARA** rule that would have caught a step in this attack. Bridge to defense.

### Drill 6 — The report (your portfolio capstone)
Executive summary (1 paragraph: what + impact) · technical findings (timeline, IOC table *with provenance*, ATT&CK matrix, detections, honest limits). Publish it to GitHub.

---

## 4 · Ground-up self-check (your words, no rote)

1. Why does no single source ever tell the whole story — give a concrete case where two are needed to prove one fact.
2. What is "IOC provenance," and why does an indicator without it weaken the whole report?
3. Walk one IOC across four evidence types — what question does each pivot answer?
4. Two sources contradict (timestomped MFT vs the USN journal). How do you handle it?
5. Why write the same case for both an exec and an analyst — what changes, what stays?
6. The evidence is consistent with two different intrusion stories. How do you report that honestly?

---

## 5 · Phase 12 is done when…
- [ ] You can take a multi-evidence scenario from inventory → full reconstructed timeline.
- [ ] You can pivot a single IOC across memory, disk, network, and binary.
- [ ] You can produce an ATT&CK matrix where every technique cites an artifact.
- [ ] You can write deployable detections (Sigma + Suricata + YARA) tied to findings.
- [ ] You can deliver one report with exec summary + technical appendix + honest limits.
- [ ] You've published one capstone investigation (your Encoder case or a CTF) to your portfolio.

→ After this: you're doing the job. Re-run on real CTFs/cases, and feed the best write-ups straight into your GitHub and resume.

---

## 6 · Traps that bite everyone
- **Tool-driven instead of question-driven** — running every plugin and drowning instead of pivoting on hypotheses.
- **Claims without provenance** — "the attacker did X" with no artifact cited.
- **Forcing one neat story** when the evidence supports two (overfitting the narrative).
- **Skipping the exec summary** — a report only analysts can read fails half its job.
- **Never closing the loop to defense** — an investigation that yields no detections is incomplete.

---

*One file per phase · Phase 12 of 12 — capstone. That's the full path, 6 → 12.*
