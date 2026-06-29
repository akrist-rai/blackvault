# 🔍 Phase 4 — Static Malware Analysis

**Track:** Malware Analysis · **Prereqs:** Phase 3 (PE/ELF format) · **Feeds:** Dynamic analysis (6), Ghidra deep-dive (5), YARA hunting (cross-phase)
**Your artifact:** `range/packed.exe` — a Windows PE with suspicious characteristics. Triage it without running a single instruction.

> **The whole phase in one sentence:** static analysis is everything you can learn about a binary *without executing it* — format structure, embedded strings, cryptographic fingerprints, behavioral capability clusters, and packing indicators — and most malware tells you exactly what it does if you ask the right questions first.

---

## 0 · The single idea everything here rests on

Every piece of malware reveals itself through the gap between what it *claims* to be and what its structure *actually shows*: a legitimate Word document doesn't need to import `VirtualAllocEx`; a photo viewer doesn't embed Base64-encoded PE headers; an updater with a 7.9 bits/byte .text section isn't running unencrypted code. Static analysis is the systematic process of surfacing those contradictions before you ever hand the binary to a sandbox.

---

## 1 · Topics to learn

### 1.1 Hashing and identification
- [ ] **MD5 / SHA-1 / SHA-256** — cryptographic hashes identify a file uniquely. SHA-256 is the current standard for threat intel sharing. Same hash = same bytes; a single flipped bit produces a completely different hash. Malware authors change one byte to evade hash-based detection — hence the Pyramid of Pain.
- [ ] **Import hash (imphash)** — a hash of the normalized import table (DLL names + function names, in order). Binaries compiled from the same source with the same linker settings share an imphash even when the bytes differ. Pivoting on imphash finds related samples.
- [ ] **ssdeep / TLSH (fuzzy hashing)** — produce a hash that degrades gracefully as content changes. Two samples with 70% ssdeep similarity are likely variants of the same family. Critical when malware repackages its payload.
- [ ] **Threat intel lookups** — submit hashes to VirusTotal, MalwareBazaar, or MWDB for AV engine verdicts, YARA rule hits, network IOCs, and family attribution before investing hours in manual analysis.

### 1.2 String analysis
- [ ] **`strings` basics** — extracts sequences of printable ASCII (default ≥4 chars). Looks for: URLs, registry keys, file paths, mutex names, error messages, command templates, hard-coded credentials, Base64 blobs.
- [ ] **`strings -el`** — extracts little-endian 16-bit (UTF-16LE) strings, required for Windows UNICODE strings. Malware using `wprintf`/wide-char APIs stores strings in UTF-16; plain `strings` misses them entirely.
- [ ] **FLOSS (FLARE Obfuscated String Solver)** — runs the binary's string-decryption stubs statically using emulation to recover obfuscated strings that `strings` can't see. Also recovers stack-constructed strings and tight loops building byte arrays.
- [ ] **What strings tell you** — imported DLL names from a stub loader (e.g., `kernel32.dll`, `ws2_32.dll`), API function names resolved at runtime (`InternetOpenA`, `CreateRemoteThread`), C2 URLs or IPs, mutex names for infection markers, ransom note templates, registry key paths for persistence.
- [ ] **What to ignore** — version info strings (FileVersion, ProductName), locale strings, copyright notices, and compiler-injected runtime strings (`Microsoft Visual C++ Runtime Library`, `__except_handler`). Filter these out to focus on novel strings.

### 1.3 Import table analysis
- [ ] **Capability mapping from imports** — every imported function is a behavioral claim. Group by subsystem: network (ws2_32, winhttp), process injection (VirtualAllocEx, WriteProcessMemory, CreateRemoteThread), evasion (IsDebuggerPresent, NtQueryInformationProcess), persistence (RegSetValueEx, CreateServiceA), crypto (CryptEncrypt or BCryptEncrypt), keylogging (SetWindowsHookEx, GetAsyncKeyState).
- [ ] **Packed import table tells** — if the import table contains *only* LoadLibrary and GetProcAddress (±GetModuleHandle), the binary resolves all real imports at runtime. This is the strongest single static indicator of packing or custom loaders.
- [ ] **Delay-loaded imports** — listed in a separate delay-load directory. The DLL loads only when the first call to one of its functions occurs. Legitimate for startup performance; used by malware to hide capability from quick static triage.
- [ ] **Export table** — DLLs export by name or ordinal. Malware DLLs sometimes export a minimal interface (DllRegisterServer for regsvr32 abuse, or a plausible export name for sideloading). An injected DLL with no exports that's not in a standard system path is suspicious.

### 1.4 PE header anomalies
- [ ] **TimeDateStamp** — the compile timestamp in the PE header. Packers zero it or set it to a fixed epoch. Legitimate binaries generally have timestamps matching their claimed version. Timestamps in the future or in 1970 = manipulated.
- [ ] **Section characteristics** — each section has flags (read/write/execute). A section that is both writable AND executable (IMAGE_SCN_MEM_WRITE | IMAGE_SCN_MEM_EXECUTE) is suspicious; it can be both modified at runtime and executed. Legitimate code sections are read+execute only.
- [ ] **Section entropy** — use `rabin2 -S` or `pecheck` to compute per-section entropy. .text: normally 5.5–6.5. Encrypted payload sections: 7.5–8.0. A .text section at 7.8 bits/byte is not running native code — it's ciphertext or compressed data.
- [ ] **VirtualSize vs SizeOfRawData** — if VirtualSize >> SizeOfRawData, the section expands in memory (will be filled by a decompression stub). If SizeOfRawData > VirtualSize, the section contains more on-disk than it exposes in memory — common with overlay data.
- [ ] **Overlay** — bytes after the last section header range. Packers, installers, and polyglot files use this. Compute entropy of the overlay with `ent`; encrypted payloads show near-8.0.

### 1.5 YARA rules
- [ ] **YARA rule anatomy** — `rule Name { meta: ... strings: $s1 = "value" condition: $s1 }`. The `strings` block defines patterns (byte strings, hex patterns with wildcards, regex); the `condition` block is a Boolean expression over those patterns plus file size, PE imports, PE sections, and more.
- [ ] **Writing a targeted rule** — start with two or three unique strings from the sample (not version strings or common library output). Add a PE import condition for a suspicious combination. Test against a clean set to verify precision.
- [ ] **YARA PE module** — `import "pe"` unlocks `pe.imphash()`, `pe.number_of_sections`, `pe.sections[i].name`, `pe.sections[i].entropy`, `pe.timestamp`, `pe.is_dll()`. Combine structural and string conditions for high-fidelity rules.
- [ ] **Running YARA** — `yara -r rules.yar /path/to/scan` (recursive scan). `yara -s rules.yar sample.exe` shows which strings matched. Useful for hunting across a malware corpus or a live system (with proper privilege).
- [ ] **Community rules** — YARA-Rules on GitHub, Elastic Security detection rules, Florian Roth's Neo23x0 repo. Never run untrusted community rules in production without review — malformed rules can cause panics in the scanning engine.

### 1.6 capa — automated capability detection
- [ ] **What capa does** — maps binary code to MITRE ATT&CK techniques and CAPE/MBC behavioral categories by matching against a library of ~750 rules. Faster than manual import analysis for getting a capability summary.
- [ ] **Reading capa output** — look at the ATT&CK column first for high-level TTPs; then the MBC (Malware Behavior Catalog) column for malware-specific behaviors (e.g., "encrypt data using XOR", "persist via run key"). Each matched rule shows which function triggered it.
- [ ] **capa limitations** — works best on x86/x64 PE and ELF; struggles with heavily-packed samples (only sees the loader stub, not the payload). Run it after unpacking if the initial result is sparse.

### 1.7 Pyramid of Pain — static tier
- [ ] **Hash tier (trivial)** — exact hash match. Blocked instantly if you have the hash, evaded by changing one byte.
- [ ] **Artifacts tier (annoying)** — mutexes, registry keys, file paths, embedded strings. Harder to change without breaking functionality — mutexes must match for infection-marker logic to work.
- [ ] **Tools tier (challenging)** — imphash, code similarity, YARA rules targeting code structure. Evaded by recompiling, but recompilation changes more than a byte flip.
- [ ] **Why static analysis primarily hits hashes and artifacts** — you can't see TTPs without executing or deeply reversing the binary. Static gives you hashes, strings, and import clusters; dynamic and Ghidra give you TTPs.

---

## 2 · The artifact — `range/packed.exe`

A Windows PE binary. Triage it completely before touching a sandbox.

```bash
# 1. Hash and identify
sha256sum range/packed.exe
md5sum range/packed.exe
file range/packed.exe

# 2. Strings — ASCII and Unicode
strings range/packed.exe | sort -u
strings -el range/packed.exe | sort -u   # UTF-16LE

# 3. Obfuscated strings — FLOSS
floss range/packed.exe 2>/dev/null | grep -v "^FLOSS" | head -80

# 4. PE structure and sections with entropy
rabin2 -I range/packed.exe   # identity: arch, compiler, canary, nx, pic
rabin2 -i range/packed.exe   # import table
rabin2 -e range/packed.exe   # export table
rabin2 -S range/packed.exe   # sections — size, entropy, flags

# 5. Overlay check
python3 -c "
import pefile, math, collections
pe = pefile.PE('range/packed.exe')
overlay = pe.get_overlay()
if overlay:
    freq = collections.Counter(overlay)
    ent = -sum(c/len(overlay)*math.log2(c/len(overlay)) for c in freq.values())
    print(f'Overlay: {len(overlay)} bytes, entropy={ent:.2f}')
else:
    print('No overlay detected')
"

# 6. Capability detection
capa range/packed.exe

# 7. YARA rule test (with community rules)
yara -r range/yara/rules.yar range/packed.exe

# 8. ssdeep — fuzzy hash for variant clustering
ssdeep range/packed.exe
```

**What to find:** tiny import table (LoadLibrary + GetProcAddress only), high entropy .text section (>7.5), FLOSS recovering a hidden URL or mutex name, capa flagging "self-inject" or "anti-analysis" techniques.

---

## 3 · Key commands

| Command | What it does |
|---|---|
| `sha256sum file` | SHA-256 hash for threat intel lookup |
| `md5sum file` | MD5 hash (legacy but ubiquitous in AV) |
| `strings -n 6 file` | ASCII strings ≥6 chars |
| `strings -el file` | UTF-16LE (Windows wide-char) strings |
| `floss file` | FLOSS: recover obfuscated/stack strings |
| `rabin2 -I file` | Binary identity: arch, PIC, NX, canary, stripped |
| `rabin2 -i file` | Import table |
| `rabin2 -S file` | Sections with entropy values |
| `rabin2 -z file` | Strings in data sections (alternative to strings) |
| `capa file` | ATT&CK + MBC capability mapping |
| `yara -r rules.yar file` | Match YARA rules against file or directory |
| `yara -s rules.yar file` | Show which strings matched |
| `ssdeep file` | Fuzzy hash for similarity comparison |
| `ssdeep -m known.ssdeep unknown.exe` | Match against a set of known hashes |
| `ent file` | Full-file Shannon entropy |
| `pecheck file` | Detailed PE anomaly report (Python pefile) |

---

## 4 · Flashcard targets

- **imphash vs ssdeep — what does each track?** imphash = import table structure (linker fingerprint); ssdeep = overall byte similarity (variant clustering)
- **What does FLOSS find that `strings` misses?** Stack-constructed strings, XOR-decrypted strings, strings assembled in tight loops — anything built at runtime that strings never lands in static storage
- **Import table with only LoadLibrary + GetProcAddress means?** The binary resolves all real imports at runtime — strong packing/loader indicator
- **How does YARA's PE module help over plain string rules?** It can condition on import hashes, section entropy, section count, compiler timestamps — structural properties, not just string content
- **Section with RWX flags (read+write+execute) implies?** Memory is both modifiable and executable at the same point — common in shellcode loaders and runtime-decrypting stubs
- **What is the Pyramid of Pain tier for mutex names?** Artifacts tier — annoying for the attacker to change because the mutex logic must remain consistent across infection markers
- **capa reports sparse results on a packed binary — why?** capa only analyzes the visible code; the loader stub is tiny and the real payload is encrypted — unpack first
- **Near-8.0 bits/byte full-file entropy but normal section entropy?** High-entropy overlay — encrypted/compressed payload appended after the PE sections

---

## 5 · Common traps

- **Trusting AV verdict as a family name** — AV family names are inconsistent across engines (Emotet is "Heodo" on one engine, "Geodo" on another). Use them as signals to pivot, not as definitive attribution.
- **Stopping at ASCII strings** — Windows malware overwhelmingly uses wide-char (UTF-16LE) strings. Always run `strings -el` alongside `strings`.
- **Missing the overlay** — `rabin2 -S` shows section entropy but not the overlay. Check explicitly with pefile or compute `stat --printf="%s" file` vs the last section's `PointerToRawData + SizeOfRawData`.
- **Running capa on a packed sample and declaring "no capability"** — capa on a packed stub shows loader primitives only. Run it on the unpacked payload; otherwise you miss all capability evidence.
- **Writing YARA rules on strings alone** — strings are easy to randomize. Combine string conditions with structural conditions (pe.imphash(), section count, timestamp anomaly) for rules that survive minor obfuscation.
- **Ignoring delay-loaded imports** — `rabin2 -i` may not display delay-load entries by default. Inspect the PE DataDirectory[13] (IMAGE_DIRECTORY_ENTRY_DELAY_IMPORT) for hidden capability.

---

## 6 · Reflection questions

1. A sample imports only `LoadLibraryA` and `GetProcAddress` and has a .text section entropy of 7.82. Walk through the three-step triage process you'd use to (a) confirm it's packed, (b) identify the packer family if possible, and (c) plan the unpacking approach for Phase 7.
2. You write a YARA rule targeting a unique URL string found in a malware sample. The next variant XOR-encodes that URL with a single byte key. How do you update your rule to catch both variants without generating false positives on clean software?
3. Explain why two malware samples with completely different SHA-256 hashes could still share the same imphash. What does that tell an analyst, and what could an attacker do to break that correlation?

---

## 7 · Feeds into

- **Phase 5 (Ghidra)** — static triage identifies which functions to prioritize in Ghidra (the import-resolution stub, the decryption loop, the network-connect routine).
- **Phase 6 (Dynamic Analysis)** — FLOSS-recovered strings become candidate IOCs to watch for in strace/ltrace output; import clusters suggest which syscalls to filter.
- **Phase 7 (Unpacking)** — high-entropy section + minimal imports is the exact trigger for unpacking workflow; static triage *is* the go/no-go decision for Phase 7.
