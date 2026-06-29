# 🦠 ⚙️ Phase 7 — Unpacking & Binary Patching

**Track:** Malware Analysis + Reverse Engineering · **Prereqs:** Phase 5 (Ghidra), Phase 6 (dynamic) · **Feeds:** Phase 8 (memory), Phase 10 (protocol RE)
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. You already did this once: `fake_malware.c` packed with UPX, OEP via hardware breakpoints in GDB, memory dump, Ghidra. Mirai source on the external drive.

> **The whole phase in one sentence:** packers wrap the real program in a shell that unwraps itself at runtime; unpacking is catching the moment the mask comes off and photographing the real face underneath.

---

## 0 · The single idea everything here rests on

The packed file on disk is **never what runs**. At one instant the unpacking stub finishes and jumps to the **Original Entry Point (OEP)** — the real code, now decrypted in memory. Your entire job is to be standing at that instant with a memory dump in hand. Everything else — breakpoints, entropy, IAT fixes — is just *finding that instant* and *making the dump usable*.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 Packing concepts
- [ ] **What a packer does** — compress/encrypt the original + prepend a stub that restores it at runtime.
- [ ] **Why most real malware is packed** — it's the wall that made Phase 4 static analysis hit a dead end.
- [ ] **Packer families** — UPX (trivial), ASPack/PECompact (moderate), Themida/VMProtect (virtualized, brutal), custom crypters. Know the difficulty ladder.
- [ ] **Entropy as a tell** — callback to Phase 3; a packed section reads near-random.

### 1.2 Finding the OEP
- [ ] **The tail jump** — the stub's final jump into unpacked code; recognize it.
- [ ] **`pushad`/`popad` heuristic** — classic stack-balance trick for OEP on many Windows packers.
- [ ] **Hardware breakpoints** — break on execute in the region the stub just wrote to (write-then-execute).
- [ ] **Memory/access breakpoints** — catch first execution of freshly-unpacked memory.

### 1.3 Dumping & reconstruction
- [ ] **Memory dump at OEP** — pull the now-decrypted image out of RAM.
- [ ] **IAT reconstruction** — why imports break in a raw dump and how they're rebuilt (Scylla on Windows; manual reasoning on ELF).
- [ ] **Making the dump analyzable** — fix headers/offsets so Ghidra (and ideally execution) is happy.

### 1.4 Binary patching
- [ ] **NOP patching** — neutralize a check (anti-debug, license gate) by replacing it with no-ops.
- [ ] **Conditional-jump inversion** — flip `jz`↔`jnz` to take the other branch.
- [ ] **Live vs on-disk patching** — debugger patch (temporary) vs persisted file patch (and keeping the file valid: size, alignment, offsets).

### 1.5 Anti-unpacking defenses
- [ ] **Anti-debug during unpack** — checks that fire mid-unpacking (ties to Phase 6 §1.6).
- [ ] **Stolen bytes / IAT obfuscation** — why your dump's imports look mangled.
- [ ] **Multi-layer packing** — stubs under stubs.
- [ ] **Knowing when to stop** — recognize a virtualized packer (Themida/VMProtect) and switch to emulation/automation instead of burning days.

---

## 2 · Where to learn it — let these do the teaching

**Courses / channels**
- OALabs (best unpacking content) · MalwareAnalysisForHedgehogs (Karsten Hahn) · Guided Hacking (game-hacking roots, superb patching tutorials).

**Books (references)**
- *Practical Malware Analysis* — packing & anti-disassembly chapters. *Practical Reverse Engineering* — Dang et al.

**Docs / tools**
- UPX · Scylla · x64dbg · GDB · Ghidra · `ent`/`binwalk -E` for entropy.

**Search queries**
- `manual unpacking UPX find OEP`
- `IAT reconstruction Scylla tutorial`
- `pushad popad OEP heuristic`
- `NOP patch anti-debug x64dbg`
- `ELF unpacking gdb dump memory segment`

> **Sample sourcing:** you already packed `fake_malware.c` with UPX — that's your dummy. UPX is the on-ramp; then graduate to a manually-packed or crypted sample. **crackmes.one** has legal, packed/protected RE targets perfect for this phase.

---

## 3 · Practice — drills on Hermes (grip happens here)

You've done a version of this once; redo from muscle memory so it's *yours*.

### Drill 0 — Snapshot reflex
```bash
virsh snapshot-create-as hermes clean-pre-detonation   # before
virsh snapshot-revert hermes clean-pre-detonation       # after
```

### Drill 1 — UPX round-trip (own the easy case)
```bash
upx -o fake_packed fake_malware            # pack
ent fake_packed ; ent fake_malware         # see the entropy jump
upx -d fake_packed -o fake_unpacked        # the trivial unpack
cmp fake_unpacked fake_malware             # prove it round-trips
```

### Drill 2 — Manual unpack (the actual skill)
Unpack the same UPX binary **without `upx -d`**: in GDB, hardware-breakpoint the unpack region, run to the tail jump, read the OEP, dump the unpacked image from memory. Compare your dump to the `upx -d` output to confirm you nailed the OEP.

### Drill 3 — Patch a crackme
Pull a check-based crackme from crackmes.one. Find the gate in Ghidra → in GDB, **NOP** it or **invert** the conditional → then **persist** the patch on disk and run the file unaided. Do it both live and on-disk so you feel the difference.

### Drill 4 — IAT reasoning
After a manual dump, inspect why the imports are broken. Explain (in writing) exactly what the stub did that your raw dump lost, and what Scylla automates. You don't need Windows — the *reasoning* is the deliverable.

### Drill 5 — Full chain on a real sample
Compile the Mirai bot from your source (or use another sample you hold), pack it, then **unpack → feed the payload into your Phase 6 dynamic harness**. Unpack-then-analyze, end to end.

### Drill 6 — Write-up
Packer identified · OEP address · dump method · patches applied · before/after behavior.

---

## 4 · Ground-up self-check (your words, no rote)

1. Why is the on-disk file "never what runs" for a packed binary?
2. What physically happens at the OEP, and how does the tail jump betray it?
3. After dumping unpacked memory to a file, why are the imports broken — what did the stub do that the dump lost?
4. NOP vs jump-inversion to defeat a check — when do you pick each?
5. Why does entropy spike on a packed section, and why does that *not* prove malware?
6. Your hardware breakpoint never reaches the OEP and the sample exits. Two hypotheses?

---

## 5 · Phase 7 is done when…
- [ ] You can **manually** unpack a UPX sample (no `upx -d`) and dump at OEP.
- [ ] You can reconstruct or fully explain a broken IAT.
- [ ] You can patch a crackme's check both live and on-disk and have it run.
- [ ] You've chained unpack → Phase 6 harness on one real sample.
- [ ] You have one unpacking write-up.

→ Next: **Phase 8 — Memory Forensics** (the dump-at-OEP instinct becomes "the truth lives in RAM").

---

## 6 · Traps that bite everyone
- **Treating `upx -d` as "unpacking skill."** It's the trivial case; the skill is the manual path.
- **Dumping before OEP** — you capture still-encrypted code and analyze noise.
- **Breaking offsets/alignment** when patching on disk → corrupt, non-running binary.
- **"High entropy = malware."** Plenty of benign software is packed/compressed.
- **Grinding manually on Themida/VMProtect.** Recognize virtualized packers and change strategy.

---

*One file per phase · Phase 7 of 12.*
