# 📦 Phase 3 — PE & ELF Binary Format

**Track:** Reverse Engineering · Malware Analysis · **Prereqs:** Phase 2 (assembly) · **Feeds:** Static analysis (4), Ghidra typing (5), unpacking IAT rebuild (7)
**Your artifact:** `range/crackmes/crackme1` — a simple ELF binary. Inspect every structural layer before reversing the logic.

> **The whole phase in one sentence:** an executable is a structured container telling the loader how to map code and data into memory and wire up imports — and every packing, injection, and import-table attack lives in this format.

---

## 0 · The single idea everything here rests on

Follow what the loader does with a dynamically-linked binary: it maps the PT_LOAD segments, walks the dynamic section to find needed libraries, maps them, resolves imported symbols by filling the IAT (PE) / GOT (ELF). That IAT/GOT is the seam between "the binary" and "the system" — it reveals capability statically, breaks when you dump a packed process (the loader's fix-ups are gone), and must be reconstructed to make a dump runnable. Understanding this one seam ties Phases 3, 7, and 10 together.

---

## 1 · Topics to learn

### 1.1 ELF (Executable and Linkable Format)
- [ ] **ELF header** — magic bytes (7F 45 4C 46), class (32/64-bit), endianness, OS ABI, type (ET_EXEC/ET_DYN/ET_CORE), machine, entry point, ph_off (program header offset), sh_off (section header offset).
- [ ] **Program headers (segments)** — used by the OS loader to map the file into memory. PT_LOAD segments specify virtual address, file offset, file size, and memory size. The loader maps file bytes into virtual memory and zero-fills any gap (p_memsz > p_filesz).
- [ ] **Section headers** — used by linkers and analysis tools. .text (code), .data (initialized globals), .bss (zero-initialized globals, size 0 on disk), .rodata (read-only strings), .dynamic (GOT/PLT info), .symtab/.dynsym (symbol tables).
- [ ] **p_filesz vs p_memsz** — the difference is zero-filled at load. This is how .bss works (zero bytes on disk, nonzero in memory) and a favorite spot for runtime data injection.
- [ ] **Dynamic linking: GOT and PLT** — the PLT contains a stub per imported function; the GOT is a table of resolved addresses the dynamic linker fills in (lazily or at load). Calls to printf go: `call printf@plt` → PLT stub → GOT entry → resolved libc address. ltrace hooks this mechanism.
- [ ] **RPATH and interpreter** — the `.interp` section names the dynamic linker (`/lib64/ld-linux-x86-64.so.2`). Changing it is one method to load a rogue library.

### 1.2 PE (Portable Executable) — Windows
- [ ] **DOS header** — legacy 512-byte stub starting with "MZ" (4D 5A). Contains `e_lfanew` — the offset to the PE signature. Everything before it is the MS-DOS stub (prints "This program cannot be run in DOS mode").
- [ ] **NT headers** — PE signature ("PE\0\0"), Machine (x86 = 014C, x64 = 8664), NumberOfSections, TimeDateStamp (often zeroed by packers), Characteristics. The Optional Header has ImageBase, AddressOfEntryPoint (RVA), SizeOfImage, and the DataDirectory.
- [ ] **Section table** — up to 96 sections: .text (code), .rdata (read-only data + imports/exports), .data (writable globals), .idata (import table), .reloc (relocations). VirtualAddress is an RVA; PointerToRawData is the file offset.
- [ ] **Import Address Table (IAT)** — the DataDirectory[1] (IMAGE_DIRECTORY_ENTRY_IMPORT) points to the import descriptors. Each descriptor names a DLL and an array of entries; the loader fills each entry with the resolved function address. If you see only 4–5 entries covering LoadLibrary and GetProcAddress, the binary resolves the rest dynamically (packed).
- [ ] **Relocations** — the DataDirectory[5] (IMAGE_DIRECTORY_ENTRY_BASERELOC) lists which addresses to patch when the binary loads at a different ImageBase than preferred. ASLR relies on this mechanism.
- [ ] **Exports** — malware rarely exports, but DLLs always do. The Export Directory lists exported function names, ordinals, and RVAs. Important for understanding injection targets and sideloading candidates.
- [ ] **Overlay data** — bytes after the last section are not mapped into memory by the PE loader. Packers and self-extracting archives use this space. High entropy overlay = suspicious.

### 1.3 Entropy and packing tells
- [ ] **Why entropy matters** — compressed or encrypted data looks random: near-8.0 bits/byte. An unpacked .text section is typically 5.5–6.5 bits/byte. Combining high entropy with a tiny import table is the classic packing signature.
- [ ] **Section name anomalies** — UPX0/UPX1 (UPX packer), .nsp0/.nsp1 (NSIS installer), CODE/BSS (Delphi compiler). Unusual or renamed section names don't prove malice but warrant investigation.
- [ ] **Virtual size >> raw size** — if VirtualSize is much larger than SizeOfRawData, the section is partly zero-filled at load — potentially filled by a decompression stub. The inverse (SizeOfRawData > VirtualSize) is unusual and suspicious.
- [ ] **No .reloc section in an executable** — binaries compiled without position-independent code can't be relocated, so they always load at ImageBase. This means ASLR doesn't protect them — and it means the IAT addresses are predictable.

### 1.4 ASLR, PIE, and PIC
- [ ] **ASLR (Address Space Layout Randomization)** — the OS chooses a random load address for the binary, the stack, the heap, and libraries each run. Relocations allow the binary to work at any base.
- [ ] **PIE (Position-Independent Executable)** — an ET_DYN ELF that can load at any address. Required for full ASLR protection. If `-no-pie`, the binary always loads at its link-time address.
- [ ] **Implications for analysis** — when analyzing a dumped memory image, the virtual addresses in the dump are the runtime addresses (post-ASLR). When analyzing a file, you deal with RVAs. Getting these mixed up is a common source of confusion.

---

## 2 · The artifact — `range/crackmes/crackme1`

A 64-bit ELF binary. Before reversing any logic, read the format:

```bash
# 1. Verify the file type
file range/crackmes/crackme1

# 2. ELF header — architecture, entry point, type
readelf -h range/crackmes/crackme1

# 3. Segments (what the loader uses)
readelf -l range/crackmes/crackme1

# 4. Sections (for analysis)
readelf -S range/crackmes/crackme1

# 5. Dynamic section — linked libraries + GOT address
readelf -d range/crackmes/crackme1

# 6. Symbols — function names
readelf -s range/crackmes/crackme1

# 7. Imports (via radare2/rabin2)
rabin2 -I range/crackmes/crackme1   # binary identity
rabin2 -i range/crackmes/crackme1   # imports
rabin2 -S range/crackmes/crackme1   # sections with sizes + entropy

# 8. Disassembly
objdump -d -M intel range/crackmes/crackme1 | head -60

# 9. Strings — before reversing any logic
strings range/crackmes/crackme1
```

**What to notice:** one or two imported functions (strcmp, puts), a .text section with ~5 entropy, the PLT stubs that wrap the libc calls, and the entry point (usually `_start` → `__libc_start_main` → `main`).

---

## 3 · Key commands

| Command | What it does |
|---|---|
| `file binary` | Quick format identification |
| `readelf -h binary` | ELF header (arch, entry, type) |
| `readelf -l binary` | Program headers / segments |
| `readelf -S binary` | Section headers with flags, sizes |
| `readelf -d binary` | Dynamic section (NEEDED, GOT, init) |
| `readelf -s binary` | Symbol table (often stripped) |
| `readelf -a binary` | Everything (very verbose) |
| `rabin2 -I binary` | Binary identity + properties |
| `rabin2 -i binary` | Import table |
| `rabin2 -e binary` | Exports |
| `rabin2 -S binary` | Sections with entropy values |
| `rabin2 -z binary` | Strings in data sections |
| `objdump -h binary` | Section headers (quick) |
| `objdump -d -M intel binary` | Disassembly in Intel syntax |
| `objdump -R binary` | Dynamic relocation entries |
| `ent binary` | Full file entropy (bits/byte) |

---

## 4 · Flashcard targets

- **ELF magic bytes?** `7F 45 4C 46` (0x7F + "ELF")
- **PE magic bytes?** `4D 5A` ("MZ")
- **p_filesz vs p_memsz — what fills the gap?** Zeros, at load time (how .bss works)
- **What does the IAT contain at runtime?** Resolved virtual addresses of imported functions
- **Which ELF structure does the OS loader use: segments or sections?** Segments (program headers)
- **What is AddressOfEntryPoint in a PE?** An RVA (relative to ImageBase, not an absolute address)
- **Near-8.0 bits/byte entropy in a section suggests?** Compression or encryption — likely packed
- **Only LoadLibrary + GetProcAddress in the import table means?** Dynamic import resolution at runtime (common in packed/shellcode-style code)
- **What is the PLT/GOT pair for?** PLT = per-import call stub; GOT = table the dynamic linker fills with resolved addresses

---

## 5 · Common traps

- **Reading sections when you should read segments** — for understanding what gets mapped, look at PT_LOAD segments. Sections are for linkers and analysis, not the loader.
- **Confusing RVAs and file offsets** — an RVA (Relative Virtual Address) is relative to ImageBase; a file offset is from byte 0 of the file. A PE header with PointerToRawData 0x400 maps to file offset 0x400, which becomes RVA (0x400 - optional_header.SizeOfHeaders) after mapping.
- **Assuming a small on-disk size means a small in-memory footprint** — packed images decompress in memory, making the mapped size potentially 10× larger.
- **Ignoring the overlay** — high-entropy bytes after the last section header range may be encrypted payload, not padding. Check with `ent` on the file slice.
- **Missing the IAT in a memory dump** — after unpacking, the loader's runtime-resolved IAT exists in memory but the original import structure doesn't — you must rebuild it before the dump is usable.

---

## 6 · Reflection questions

1. Explain the full path of a `printf("hello")` call in a dynamically-linked ELF from the `call` instruction through the PLT stub to the actual libc code.
2. Why does a packed PE with only four imports and a near-8.0 entropy .text section not prove malice? What legitimate software has these properties?
3. A memory dump of a packed process has a broken import table. Walk through the four steps needed to make it analyzable and (ideally) runnable again.

---

## 7 · Feeds into

- **Phase 4 (Static Analysis)** — every static triage decision references the format: section entropy, import count, section names, strings.
- **Phase 5 (Ghidra)** — Ghidra's analysis is entirely format-aware; wrong format assumptions break xrefs and type inference.
- **Phase 7 (Unpacking)** — the "dump-then-rebuild" pipeline is all about PE structure: entry point fix, section alignment, IAT reconstruction.
