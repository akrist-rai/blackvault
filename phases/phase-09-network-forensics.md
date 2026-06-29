# 🗂️ Phase 9 — Network Forensics

**Track:** Digital Forensics · **Prereqs:** Phase 6 (you captured pcaps), Phase 8 (`netscan` endpoints) · **Feeds:** Phase 10 (protocol RE), Phase 12 (capstone)
**Your rig:** *Hermes* — QEMU/KVM, Ubuntu 24.04, `10.10.10.189`. You already have `~/detonation/run1.pcap` from Phase 6 — reuse it.

> **The whole phase in one sentence:** malware has to talk to get paid — network forensics is wiretapping that conversation and proving who said what to whom, even when it's whispered in code.

---

## 0 · The single idea everything here rests on

Code can be obfuscated and memory can be wiped, but **bytes on the wire are bytes on the wire**. A pcap is ground truth about communication. The skill is pattern recognition — separating the malware's heartbeat from the noise of normal traffic, and pulling *structure* (beacon intervals, JA3 fingerprints, DNS tunnels) out of what looks like static.

---

## 1 · Topics to learn — your syllabus

`concept — the bar you're aiming for`

### 1.1 PCAP fundamentals
- [ ] **Reading a capture** — Wireshark/`tshark`: display filters, Follow Stream, Statistics.
- [ ] **Flow vs packet view** — conversations, endpoints, protocol hierarchy.
- [ ] **Reassembly / object export** — recover transferred files (HTTP → Export Objects).

### 1.2 C2 traffic patterns
- [ ] **Beaconing** — periodicity + jitter; spotting a heartbeat on a time-plot.
- [ ] **Connection shape** — one long session vs many short check-ins.
- [ ] **Domains** — hardcoded vs DGA; recognizing algorithmically-generated names.
- [ ] **HTTP(S) C2 profile** — the "low and slow" look.

### 1.3 TLS without decryption
- [ ] **JA3 / JA3S** — fingerprint the client/server TLS handshake to ID tooling *even when encrypted*.
- [ ] **SNI + cert anomalies** — self-signed, odd CN, very short validity.
- [ ] **Why fingerprints work** — known frameworks (e.g., Cobalt Strike profiles) have stable handshakes.

### 1.4 DNS abuse
- [ ] **DNS tunneling** — C2/exfil in TXT/subdomain queries; entropy + volume tells.
- [ ] **Fast-flux / DGA** — rotating infrastructure; pattern recognition.
- [ ] **Spotting tunneling** vs ordinary lookups.

### 1.5 Extraction & enrichment
- [ ] **Carve → hash → analyze** — pull a dropped payload from a pcap and chain it into Phase 4/6.
- [ ] **IOC set** — IPs, domains, JA3, URIs, certs.
- [ ] **Zeek / Suricata** — protocol logs + signatures as force multipliers.
- [ ] **Map to ATT&CK** — C2 and exfil techniques.

---

## 2 · Where to learn it — let these do the teaching

**Sites / channels**
- **malware-traffic-analysis.net** (Brad Duncan) — *the* resource: real pcaps + exercises *with answers*. Grind these. · 13Cubed (network/DFIR). · Chris Greer (Wireshark deep-dives).

**Books**
- *Practical Packet Analysis* — Sanders. · *Applied Network Security Monitoring* (Zeek/Suricata).

**Docs / tools**
- Wireshark · `tshark` · Zeek · Suricata · Salesforce **JA3** (GitHub).

**Search queries**
- `Wireshark malware traffic analysis walkthrough`
- `C2 beaconing detection pcap IO graph`
- `JA3 fingerprint cobalt strike`
- `DNS tunneling detection entropy`
- `extract files from pcap Wireshark export objects`

> **Sample sourcing (you need pcaps):** malware-traffic-analysis.net (huge free archive), Wireshark sample captures, NETRESEC's pcap list, CyberDefenders network challenges. **And your own:** `run1.pcap` from Phase 6 Drill 2 — analyze *your* sample's traffic.

---

## 3 · Practice — drills on Hermes (grip happens here)

### Drill 0 — Tooling
Open a malware-traffic-analysis.net pcap → Statistics → Protocol Hierarchy + Conversations. Get the lay of the land before touching packets.

### Drill 1 — Find the beacon
Load a C2 pcap, isolate the suspicious host, open an **IO graph** (packets over time), and measure the **interval and jitter**. State the cadence in one line.

### Drill 2 — Your own traffic
Analyze `~/detonation/run1.pcap` from Phase 6. What did Encoder actually send? Confirm or kill your earlier C2 hypothesis from the wire.

### Drill 3 — JA3 it
Compute JA3 on a TLS C2 capture (`tshark`/Zeek), look the fingerprint up, and identify the likely tooling **without decrypting**.

### Drill 4 — DNS tunnel
Grab a DNS-tunneling sample pcap; eyeball query volume + subdomain entropy; prove it's tunneling vs normal resolution.

### Drill 5 — Carve & chain
Export an HTTP object (a dropped payload) from a pcap, hash it, then run it through your Phase 6 harness. Network → sample → behavior, full loop.

### Drill 6 — Write-up
IOC table (IPs/domains/JA3/URIs) · beacon profile · ATT&CK C2 techniques · one line on what the comms reveal about the operator.

---

## 4 · Ground-up self-check (your words, no rote)

1. Why is a pcap "ground truth" even when the malware is obfuscated and memory was wiped?
2. How do you spot a beacon **without any signature** — what's the statistical/visual tell?
3. JA3 fingerprints *encrypted* TLS — what is it actually hashing, and why does that survive encryption?
4. What makes DNS tunneling visible despite DNS being normal traffic everywhere?
5. You carved a file from HTTP but its hash matches nothing on VirusTotal. Does that make it safe? Why not?
6. Beacon at exactly 60s, zero jitter vs 60s ±30%. What does each imply about the implant?

---

## 5 · Phase 9 is done when…
- [ ] You can identify a beacon and state its cadence/jitter from a raw pcap.
- [ ] You can fingerprint encrypted C2 with JA3 and attribute likely tooling.
- [ ] You can detect DNS tunneling from query patterns.
- [ ] You can carve a payload from a pcap and chain it into dynamic analysis.
- [ ] You've analyzed your own Encoder pcap.
- [ ] You have one network-forensics report.

→ Next: **Phase 10 — Protocol RE & C2 Analysis** (stop reading the wire, start reading the *code* that wrote it).

---

## 6 · Traps that bite everyone
- **Drowning in packets.** Start at Statistics, drill down — don't scroll.
- **"HTTPS = opaque."** JA3, SNI, cert, and timing still talk.
- **Calling periodic traffic malicious** without ruling out legit beacons (updates, telemetry).
- **Ignoring jitter** and missing modern, randomized C2.
- **Trusting an empty VirusTotal result** as "benign."

---

*One file per phase · Phase 9 of 12.*
