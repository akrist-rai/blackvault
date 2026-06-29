# 🏛️ Phase 5 — Ghidra & Decompiler Analysis

**Track:** Reverse Engineering · **Prereqs:** Phase 2 (assembly), Phase 3 (PE/ELF), Phase 4 (static triage) · **Feeds:** Unpacking OEP recovery (7), crypto identification (10), rootkit driver analysis (11)
**Your artifact:** `range/crackmes/crackme2` — a stripped 64-bit ELF. Recover the password-checking logic using Ghidra without running the binary.

> **The whole phase in one sentence:** Ghidra's decompiler reconstructs C-like pseudocode from raw bytes, but that pseudocode is only as good as the type information and variable names you provide — the analyst's job is to iteratively annotate until the reconstructed logic matches what the code actually does.

---

## 0 · The single idea everything here rests on

The decompiler lifts assembly into an intermediate representation (P-code / SLEIGH), propagates types forward through the call graph, and emits C-like pseudocode. Every wrong variable name, missing struct definition, and misidentified calling convention degrades that output. The workflow is: *run auto-analysis → find the interesting function → rename variables → define structs → fix types → read the cleaned pseudocode*. One pass of annotation typically clarifies 80% of the logic; the remaining 20% requires cross-referencing the disassembly directly.

---

## 1 · Topics to learn

### 1.1 Ghidra project and import basics
- [ ] **Creating a project** — `File → New Project → Non-Shared Project`. Import binaries with `File → Import File`; Ghidra auto-detects ELF, PE, raw binary, firmware images. Always let the auto-analyzer run before touching anything manually.
- [ ] **Auto-analysis options** — the default set covers disassembly, function boundary detection, calling convention inference, string detection, and stack-variable recovery. For stripped malware, also enable "Aggressive Instruction Finder" and "Decompiler Parameter ID."
- [ ] **Code browser layout** — Listing window (disassembly + bytes), Decompiler window (C pseudocode, synced with Listing), Symbol Tree (functions, labels, namespaces), Data Type Manager (type library), References panel (xrefs). Learn to keep Listing and Decompiler side-by-side.
- [ ] **Bookmarks and comments** — use `B` to bookmark interesting addresses; `; ` (semicolon) to add end-of-line comments; `Ctrl+Shift+;` for plate comments (block headers). Comments propagate to the decompiler output.

### 1.2 Navigating and finding things
- [ ] **Symbol Tree navigation** — `Functions` folder shows all identified functions; double-click to navigate. Stripped binaries show `FUN_<addr>` names — your job is to rename them to something meaningful.
- [ ] **xrefs (cross-references)** — press `X` on any symbol or address to see everything that references it. This is how you trace: "which function calls strcmp?" → find all callers → find the password check.
- [ ] **String search** — `Search → For Strings` (or `Window → Defined Strings`) lists all detected strings with their addresses and xrefs. Click a suspicious string to jump to its reference, then navigate up to the enclosing function.
- [ ] **Memory map** — `Window → Memory Map` shows segment layout (mirrors readelf -l output). Useful for orienting within the binary, especially after Ghidra remaps the file to its load addresses.
- [ ] **SLEIGH disassembler** — Ghidra uses its own ISA specification language (SLEIGH) to decode instructions. For x86-64, this is transparent; for custom or obscure architectures (MIPS, ARM Thumb, ARC), understanding SLEIGH helps debug incorrect disassembly.

### 1.3 The decompiler and P-code
- [ ] **P-code intermediate representation** — every instruction is lifted to primitive operations on "varnodes" (virtual registers). The decompiler applies data-flow analysis over P-code to produce pseudocode. Understanding this explains why the decompiler sometimes produces surprising output: it's reporting exactly what P-code analysis reveals about data flow.
- [ ] **Reading decompiler output** — treat it as a first draft. Variable names (`uVar1`, `param_1`) are placeholders; types (`undefined8`, `int`) are inferred and may be wrong. An `undefined8` that gets compared to a string is almost certainly a `char *`.
- [ ] **Decompiler sync** — clicking a line in the Listing pane highlights the corresponding pseudocode in the Decompiler pane and vice versa. Use this to correlate "this C expression" with "that assembly sequence" whenever the pseudocode is confusing.
- [ ] **Function signature editing** — right-click the function name in the Decompiler → "Edit Function Signature" to set the correct return type, parameter count, and types. Fixing the signature propagates corrected types throughout the function body immediately.

### 1.4 Renaming and retyping
- [ ] **Renaming variables and functions** — press `L` on any symbol in the Listing or Decompiler to rename it. Use meaningful names: `input_buffer`, `xor_key`, `check_password`, `decrypt_string`. Every rename immediately improves the pseudocode for all functions that reference it.
- [ ] **Retyping variables** — press `Ctrl+L` (or right-click → "Retype Variable") to change a variable's type. Changing `undefined8` to `char *` makes a dereference resolve as a string operation. Changing a `long` to a struct pointer unfolds the struct's fields.
- [ ] **Auto-create struct** — if a function accesses `param_1` with multiple offsets (`*(param_1 + 0)`, `*(param_1 + 8)`, `*(param_1 + 0x10)`), that parameter is a struct pointer. Use `Data Type Manager → New → Structure` to define the struct, then retype `param_1` to that struct type.
- [ ] **Enum types for constants** — when you see `if (iVar1 == 3)` and you know 3 means `SOCK_RAW` from socket.h, create or import an enum and retype the variable. The pseudocode becomes `if (socket_type == SOCK_RAW)`.

### 1.5 Recovering struct layouts
- [ ] **Identifying struct access patterns** — multiple offsets from the same base pointer in a single function, combined with consistent stride (e.g., always multiples of 8), indicates a struct. The field at offset 0 is usually an ID or type; consecutive fields follow.
- [ ] **Alignment padding** — structs pad fields to their natural alignment (int to 4 bytes, pointer to 8 bytes on x64). A `undefined4` gap between two fields is usually alignment padding, not a real field.
- [ ] **Importing C headers** — `File → Parse C Source` lets you import a C header file to populate Ghidra's type library. Import `windows.h`, `winnt.h`, or POSIX headers to get `PROCESS_INFORMATION`, `sockaddr_in`, etc., then retype parameters accordingly.
- [ ] **VTABLE recovery** — in C++ code, a pointer at offset 0 of a class object often points to a vtable. `Right-click → Auto Create Structure` then retype the first field as a pointer-to-array-of-function-pointers to recover the vtable layout.

### 1.6 Cross-referencing and call graphs
- [ ] **Incoming xrefs** — "who calls this function?" Use `X` in the function body or on its name in the Symbol Tree. Essential for finding the caller of a crypto routine or the main dispatch loop.
- [ ] **Outgoing xrefs** — "what does this function call?" The Listing shows all `CALL` instructions; the Decompiler shows function call expressions. Building a mental (or annotated) call graph is the core of malware logic reconstruction.
- [ ] **Call graph visualization** — `Graph → Show Call Graph` generates an interactive call graph rooted at the current function. Use this to find the shortest path from `main` to the interesting behavior.
- [ ] **Dead code vs live code** — Ghidra may highlight unreferenced functions (no incoming xrefs, not at the entry point). These could be: library functions Ghidra misidentified as code, dead code from the compiler, or functions only reached through indirect calls (function pointers). Don't ignore them.

### 1.7 Script automation and batch analysis
- [ ] **Ghidra Script Manager** — `Window → Script Manager` lists available Java and Python scripts. Run scripts to automate repetitive tasks: rename all functions matching a pattern, compute entropy of each function, find all xrefs to a specific API.
- [ ] **analyzeHeadless** — Ghidra's headless analyzer runs auto-analysis from the command line without the GUI. Used in batch pipelines to pre-analyze many samples: `analyzeHeadless /path/project MyProject -import sample.exe -postScript ExportFunctions.java`.
- [ ] **pyhidra / Ghidrathon** — Python 3 bridge allowing full Ghidra API access from Python scripts. Lets you query the flat program API, iterate functions, export decompiled code, or run custom analysis programmatically.

---

## 2 · The artifact — `range/crackmes/crackme2`

A stripped 64-bit ELF. The goal: find the password without running the binary.

### Lab walkthrough

```bash
# Pre-Ghidra orientation
file range/crackmes/crackme2
readelf -h range/crackmes/crackme2     # entry point address
strings range/crackmes/crackme2        # any obvious strings?
rabin2 -i range/crackmes/crackme2     # imports — what library functions does it use?
objdump -d -M intel range/crackmes/crackme2 | head -80
```

**In Ghidra:**

1. **Import** `range/crackmes/crackme2` → let auto-analysis complete (1–2 min).

2. **Find the interesting function** — `Window → Defined Strings`. Look for strings like "Correct", "Wrong", or a prompt. Double-click the string → navigate to its reference → navigate to the enclosing function.

3. **Rename the function** — press `L` on the function entry, name it `check_password`.

4. **Read the decompiler** — look for a comparison (typically `strcmp`, `strncmp`, or a manual byte-by-byte loop). If it's a strcmp call, the second argument is likely the expected password — trace that argument.

5. **Trace constants** — if the expected password is a hard-coded string, it appears as a pointer to `.rodata`. Navigate to that address to read the value.

6. **Handle XOR obfuscation** — if the comparison is a loop with XOR operations (common in simple crackmes), note the key byte and the encrypted buffer. Write a quick Python decryption:

```python
enc = bytes([0x41, 0x17, 0x05, 0x13, 0x04, 0x51])  # example bytes from .rodata
key = 0x22  # XOR key from the loop constant
print(bytes(b ^ key for b in enc).decode())
```

7. **Verify** — once you've identified the password statically, run the binary to confirm:
```bash
echo "your_found_password" | ./range/crackmes/crackme2
```

**What to observe:** how the decompiler collapses the comparison into a single readable condition, how renaming `param_1` to `user_input` makes the logic immediately clear, and how struct recovery reveals the argc/argv handling in `main`.

---

## 3 · Key commands

| Action | How |
|---|---|
| Navigate to address | `G` → type address or symbol name |
| Rename symbol | `L` on symbol in Listing or Decompiler |
| Retype variable | `Ctrl+L` or right-click → Retype Variable |
| Show xrefs | `X` on symbol or address |
| Add comment | `;` (EOL comment) or `Ctrl+Shift+;` (plate) |
| Bookmark address | `B` |
| Show all strings | `Window → Defined Strings` |
| Show memory map | `Window → Memory Map` |
| Show call graph | `Graph → Show Call Graph` |
| Edit function signature | Right-click function name → Edit Function Signature |
| Search for instruction | `Search → For Instruction Patterns` |
| Undo | `Ctrl+Z` (unlimited undo — use freely) |
| Export decompiled C | `File → Export Program` → C/C++ |
| Headless analysis | `analyzeHeadless /proj ProjName -import file.exe` |

---

## 4 · Flashcard targets

- **What is P-code?** Ghidra's architecture-neutral intermediate representation; all ISAs lift to P-code before the decompiler emits pseudocode
- **What does pressing `X` do?** Shows all cross-references (xrefs) to/from the selected symbol or address
- **Why is `undefined8` not a final answer?** It means Ghidra inferred "8-byte unknown type" — likely a pointer or struct; retype it to propagate correct semantics through the function
- **How do you recover a struct Ghidra doesn't know about?** Observe the access pattern (base pointer + multiple fixed offsets), define the struct in Data Type Manager, retype the variable
- **What does "Auto Create Structure" do?** Ghidra infers a struct definition from observed field accesses in the current function and creates a named struct type
- **How do you find what calls a function?** `X` on the function entry point → shows all call sites (incoming xrefs)
- **What does `analyzeHeadless` enable?** Batch headless analysis without the GUI — scriptable, suitable for CI pipelines and large malware corpus processing
- **Why does fixing a function's signature matter?** Ghidra propagates types from the signature into the function body — wrong parameter types produce garbled pseudocode; correct types resolve field accesses and pointer arithmetic

---

## 5 · Common traps

- **Accepting auto-analysis results without review** — Ghidra's auto-analyzer is good but makes mistakes on hand-crafted assembly, obfuscated entry points, and non-standard calling conventions. Always sanity-check the entry point and any function at a suspicious address.
- **Reading decompiler output as if it's source code** — the decompiler is a reconstruction, not the original C. Variable names, control flow structure, and type accuracy depend entirely on what you've told Ghidra. Treat it as a high-quality first draft requiring annotation.
- **Ignoring the Listing window** — when pseudocode looks wrong, switch to the Listing window to see the raw instructions. The decompiler sometimes misses indirect jumps, self-modifying code, or tail calls; the disassembly is always authoritative.
- **Missing indirect calls (function pointers)** — `(*pfnTarget)(arg1, arg2)` in the decompiler is an indirect call. Ghidra may not show xrefs from it. Trace where `pfnTarget` is loaded and what value it holds at runtime to identify the actual target.
- **Defining structs with wrong alignment** — if a struct's fields don't match their natural alignment (ints at offsets divisible by 4, pointers at offsets divisible by 8 on x64), the decompiler will produce wrong field accesses everywhere the struct is used. Get alignment right first.
- **Running analysis on a packed binary** — Ghidra analyzes what it sees; if the binary is packed, it sees only the loader stub. Unpack first (Phase 7), then import the unpacked payload for meaningful analysis.

---

## 6 · Reflection questions

1. You open a stripped malware sample in Ghidra. The only imported functions are `VirtualAlloc`, `memcpy`, and a few string functions. Describe the sequence of steps you'd take to locate the main payload decryption loop and rename/retype everything needed to make the decompiler output readable.
2. Ghidra shows a function with parameter `param_1` accessed as `*(param_1 + 0)`, `*(param_1 + 8)`, `*(param_1 + 0x14)`, and `*(param_1 + 0x18)`. The accesses at +0x14 and +0x18 read 4-byte integers. Draw the struct definition and explain how you determined field types and sizes.
3. A loop in the decompiler reads: `bVar = *(byte *)(buf + i) ^ key; *(byte *)(out + i) = bVar;`. What is this routine doing, and how would you extract the full decrypted output as a Python script without running the binary?

---

## 7 · Feeds into

- **Phase 7 (Unpacking)** — OEP recovery and import table reconstruction use Ghidra to identify the tail jump, fix the entry point, and verify the dumped payload is correctly analyzed.
- **Phase 10 (Protocol RE)** — decoding a custom protocol requires identifying the encrypt-before-send function in Ghidra, recovering the key schedule, and documenting the wire format.
- **Phase 11 (Rootkits)** — kernel driver analysis requires Ghidra with the Windows kernel type library imported; struct recovery of DRIVER_OBJECT, DEVICE_OBJECT, and IRP structures is the foundation of driver RE.
