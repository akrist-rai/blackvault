# ⚙️ 🦠 Phase 10 — Protocol RE & C2 Analysis

**Track:** Reverse Engineering + Malware Analysis · **Prereqs:** Phase 5 (Ghidra), Phase 6 (dynamic + Frida intro), Phase 9 (pcaps) · **Feeds:** Phase 12 (capstone)
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. Mirai source on the external drive (its CNC protocol is a free lab). Your Phase 9 pcaps + the matching binaries.

> **The whole phase in one sentence:** when malware speaks its own private language, you reverse the dictionary — pairing the bytes on the wire with the code that wrote them until you can read, and even speak, the protocol yourself.

---

## 0 · The single idea everything here rests on

This is where Phase 6's traffic and Phase 5's disassembly **fuse**. A captured C2 packet is meaningless bytes until you find the function in the binary that *built* it. Two halves of one puzzle: the **pcap** shows you *what* was sent; the **binary** shows you *how* it was made. **Frida** is the bridge — hook the encrypt-before-send function and watch plaintext become ciphertext in real time. Master that pairing and you can decode C2, write a parser, even impersonate the implant.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 Custom protocol structure
- [ ] **Framing** — length-prefix vs delimiter vs fixed-size. Tell which from a pcap.
- [ ] **Message anatomy** — headers, opcodes/command IDs, sequence numbers, magic bytes, checksums.
- [ ] **Serialization** — raw structs, TLV, protobuf-like, and XOR/RC4/AES-wrapped payloads.
- [ ] **Endianness & alignment** — callback to assembly/ELF phases; get this wrong and frames turn to garbage.

### 1.2 Pairing wire ↔ code
- [ ] **Find send/recv** — `send`/`recv`/`WSASend` imports or socket syscalls, then xref back to the builder.
- [ ] **Find the crypto routine** — the function that wraps the payload right before it's sent.
- [ ] **Map opcodes** — match command IDs in the binary to message types on the wire.

### 1.3 Frida for live protocol RE (the deep dive promised in Phase 6)
- [ ] **Attach + enumerate** — modules, exports; hook by name or address.
- [ ] **Hook encrypt/decrypt** — capture plaintext on the way in/out.
- [ ] **Dump keys/buffers** — read function arguments out of memory.
- [ ] **`Interceptor.attach`, memory read/write, function replacement** — the core Frida moves.

### 1.4 Decoding & reproduction
- [ ] **Write a decoder** — Python: parse frames, decrypt, dump the commands.
- [ ] **Recognize frameworks** — Cobalt Strike beacon (malleable C2, named pipes), Metasploit, AsyncRAT, **Mirai CNC**.
- [ ] **Mirai as lab** — its protocol is in your source; predict from source, confirm on the wire.

### 1.5 Emulation & active analysis
- [ ] **Fake C2 server** — stand one up in the lab to elicit/observe client behavior (sinkhole-style).
- [ ] **Replay + fuzz** — replay captured traffic; fuzz the parser for robustness/bugs.
- [ ] **Decrypt live vs offline** — Frida (per-session) vs static keys (offline). Know which the sample forces.

---

## 2 · Where to learn it — let these do the teaching

**Channels**
- OALabs (config extraction, protocol RE) · MalwareAnalysisForHedgehogs · Frida talks/streams · "Cobalt Strike beacon analysis" content. · Mandiant / Unit 42 C2 teardown blogs.

**Books**
- *Practical Malware Analysis* (network signatures) · *Black Hat Python* (instrumentation) · **Frida docs (frida.re)** — the handbook.

**Search queries**
- `Frida hook encryption function arguments`
- `reverse engineer custom C2 protocol`
- `Mirai CNC protocol analysis`
- `cobalt strike beacon config extraction`
- `write C2 decoder python frames decrypt`

> **Sample sourcing:** **Mirai-Source-Code** (you have it) — bot↔CNC protocol is right there to RE against. Combined RE+network CTF challenges (CyberDefenders). Your own Phase 6/9 captures + the matching binary.

---

## 3 · Practice — drills on Hermes (grip happens here)

### Drill 0 — Frida sanity
Attach to a benign networked process, hook `send()`, print the buffer hex. Today's win: it attaches and prints.

### Drill 1 — Mirai protocol from source (predict first)
Read the bot↔CNC protocol in your Mirai source. Document the framing + opcodes **before** touching any binary.

### Drill 2 — Compile & confirm
Build the Mirai bot in your lab, run it against a local fake CNC, capture the pcap, and verify the wire matches your Drill-1 reading.

### Drill 3 — Hook the crypto
Pick a sample (or a crackme that XOR/AES-wraps a message). Frida-hook the encrypt function and capture **plaintext in → ciphertext out**. You now hold the key/algo by observation.

### Drill 4 — Write the decoder
In Python, parse one captured C2 stream into frames, decrypt, and print the commands. The artifact is a working parser.

### Drill 5 — Fake C2
Stand up a minimal server that speaks the protocol back; observe how the client reacts to different commands (lab-contained only).

### Drill 6 — Write-up
Protocol spec (framing, opcodes, crypto) · the wire↔code mapping · your decoder · one sentence on detection (what Suricata/JA3/behavior rule would catch it?).

---

## 4 · Ground-up self-check (your words, no rote)

1. A captured C2 packet is just bytes. What two artifacts do you pair to give them meaning, and why does neither alone suffice?
2. Length-prefix vs delimiter framing — how would you tell which a protocol uses from a pcap?
3. Why is Frida-hooking the encrypt function more powerful than attacking the crypto offline?
4. You have Mirai's source — why still capture and disassemble instead of just reading the code?
5. Your decoder parses 90% of a stream then desyncs. Usual culprits? (framing, padding, key rotation…)
6. Why does building a fake C2 reveal behavior passive pcap analysis can't?

---

## 5 · Phase 10 is done when…
- [ ] You can document a custom protocol's framing + opcodes from source **and** confirm it on the wire.
- [ ] You can Frida-hook a crypto routine and capture plaintext.
- [ ] You can write a working Python C2 decoder for a captured stream.
- [ ] You can map at least part of the protocol to the code that generates it.
- [ ] You have one protocol-RE report with a detection note.

→ Next: **Phase 11 — Rootkits & Forensic Artifacts** (the adversary stops talking and starts *hiding*).

---

## 6 · Traps that bite everyone
- **Guessing structure from the wire** when the binary would tell you exactly.
- **Forgetting endianness** on length fields → garbage frames.
- **Hooking too early/late** in the call chain → you capture not-yet-built or already-encrypted data.
- **Assuming static keys** when the implant derives/rotates them per session.
- **Active analysis (fake C2, replay) against anything reachable outside the lab.** Contain it.

---

*One file per phase · Phase 10 of 12.*
