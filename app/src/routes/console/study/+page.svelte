<script>
  import { PHASES } from '$lib/data';
  import { phases } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  $: selectedId = $page.url.searchParams.get('phase') ?? 'p01';
  $: selected   = PHASES.find(p => p.id === selectedId) ?? PHASES[0];

  // Drill mode
  let mode = 'read'; // 'read' | 'drill'
  let cardIdx = 0;
  let flipped = false;
  let gotIt = new Set();
  let reviewAgain = new Set();

  $: drillCards = content?.concepts ?? [];
  $: drillTotal = drillCards.length;
  $: drillCard  = drillCards[cardIdx] ?? null;

  function nextCard() {
    flipped = false;
    setTimeout(() => { cardIdx = (cardIdx + 1) % drillTotal; }, 100);
  }
  function prevCard() {
    flipped = false;
    setTimeout(() => { cardIdx = (cardIdx - 1 + drillTotal) % drillTotal; }, 100);
  }
  function markGot() {
    gotIt.add(cardIdx);
    reviewAgain.delete(cardIdx);
    gotIt = gotIt;
    nextCard();
  }
  function markReview() {
    reviewAgain.add(cardIdx);
    gotIt.delete(cardIdx);
    reviewAgain = reviewAgain;
    nextCard();
  }
  function resetDrill() {
    cardIdx = 0; flipped = false; gotIt = new Set(); reviewAgain = new Set();
  }

  $: if (selectedId) { resetDrill(); }

  const CONTENT = {
    p01: {
      overview: `The Sleuth Kit (TSK) is the foundation of open-source disk forensics. Every disk analysis starts with understanding the partition layout, then navigating to the filesystem, then extracting specific files — even deleted ones.`,
      concepts: [
        { term:'MBR / GPT', def:'Master Boot Record (first 512 bytes, sector 0) or GUID Partition Table. mmls reads both. Partition start offsets (in sectors) are the key output — multiply by sector size (512 or 4096) to get byte offset for dd or icat.' },
        { term:'Inode', def:'Data structure in ext2/3/4 containing file metadata (timestamps, permissions, size, block pointers) but NOT the filename. Names are in directory entries. A deleted file has its inode flagged as unallocated but block content may persist.' },
        { term:'MFT (NTFS)', def:'Master File Table — a structured database where every file/dir is a record. $STANDARD_INFORMATION holds user-visible timestamps; $FILE_NAME holds filesystem-level timestamps. Both sets needed for timestomping detection.' },
        { term:'Slack Space', def:'Unused space between the end of file data and the end of its last allocated cluster. Can contain fragments of previously deleted files. dcfldd/dd with block-level extraction needed to recover.' },
        { term:'Unallocated Space', cmd:'blkls -A -o 2048 disk.img > unalloc.raw', def:'All unallocated blocks concatenated — the graveyard for deleted file content. Carve with photorec or bulk_extractor.' },
        { term:'$MFT Record Flags', def:'0x0001 = file in use; 0x0000 = deleted. fls marks deleted files with * prefix. Recovering deleted data requires the inode number still be readable and blocks not yet rewritten.' },
      ],
      commands: [
        { cmd:'mmls disk.img', note:'List partitions and start offsets (in sectors)' },
        { cmd:'fsstat -o 2048 disk.img', note:'Filesystem type, block size, inode range' },
        { cmd:'fls -r -o 2048 disk.img', note:'Recursive file listing; * = deleted' },
        { cmd:'icat -o 2048 disk.img 42', note:'Extract inode 42 content to stdout' },
        { cmd:'ils -o 2048 disk.img', note:'List all inodes (allocated + unallocated)' },
        { cmd:'blkls -A -o 2048 disk.img > unalloc.raw', note:'Dump all unallocated blocks' },
        { cmd:'ifind -o 2048 -n "secret.txt" disk.img', note:'Find inode number by filename' },
        { cmd:'xxd disk.img | head -4', note:'Verify MBR magic: last 2 bytes = 55 AA' },
        { cmd:'MFTECmd.exe -f $MFT --csv out/', note:'Parse NTFS MFT to CSV for timeline' },
      ],
      traps: [
        'Always convert sector offset to byte offset before dd: sector 2048 × 512 bytes = byte 1,048,576.',
        'fls shows inode numbers without the -r flag too, but only at the top level.',
        'icat will output binary to terminal — pipe to xxd or redirect to a file.',
        '$SI timestamps are updated by the OS on read/write/access; $FN timestamps are not. A mismatch is timestomping.',
      ],
      refs: ['The Sleuth Kit wiki', 'SANS FOR508 Disk Forensics cheatsheet', 'Brian Carrier "File System Forensic Analysis"'],
    },
    p02: {
      overview: `x86-64 assembly is the language that malware actually runs in. You don't need to write it — you need to read it well enough to understand what a function does, even when the decompiler output is misleading.`,
      concepts: [
        { term:'Calling Convention (System V AMD64)', def:'Arguments in RDI, RSI, RDX, RCX, R8, R9; return value in RAX. Caller saves RAX/RCX/RDX/RSI/RDI/R8/R9/R10/R11; callee saves RBX/RBP/R12–R15. Stack aligned to 16 bytes before CALL.' },
        { term:'Calling Convention (Windows x64)', def:'Arguments in RCX, RDX, R8, R9; rest on stack with 32-byte shadow space. Return in RAX. Different from Linux — critical when reversing Windows malware on Linux tools.' },
        { term:'Stack Frame', def:'RBP points to saved caller RBP; RSP points to current stack top. Local vars at RBP-N; function args beyond 6 at RBP+16 (above saved RIP). Prologue: push rbp; mov rbp,rsp; sub rsp,0x30.' },
        { term:'RFLAGS', def:'Zero Flag (ZF), Carry Flag (CF), Sign Flag (SF), Overflow Flag (OF). Set by arithmetic/comparison; tested by Jcc (conditional jumps). Malware checks ZF after CMP/TEST to branch on success/failure.' },
        { term:'LEA vs MOV', def:'MOV rax,[rbp-0x8] dereferences the pointer (loads value at that address). LEA rax,[rbp-0x8] computes the address itself without dereferencing. A common confusion in decompiler output.' },
        { term:'CALL vs JMP', def:'CALL pushes return address (RIP+5) to stack then jumps. JMP just jumps. Malware sometimes uses CALL+POP to get own address (PIC shellcode pattern). Also: indirect call via register (CALL RAX) for polymorphic dispatch.' },
      ],
      commands: [
        { cmd:'gdb -q ./sample', note:'Start GDB (quiet mode, no banner)' },
        { cmd:'(gdb) disas main', note:'Disassemble main function (AT&T syntax by default)' },
        { cmd:'(gdb) set disassembly-flavor intel', note:'Switch to Intel syntax' },
        { cmd:'(gdb) break *0x401234', note:'Breakpoint at absolute address' },
        { cmd:'(gdb) run arg1 arg2', note:'Run with arguments' },
        { cmd:'(gdb) stepi', note:'Step one machine instruction (follows calls)' },
        { cmd:'(gdb) nexti', note:'Step over — does not follow CALL' },
        { cmd:'(gdb) info registers', note:'Print all general-purpose registers' },
        { cmd:'(gdb) x/16xb $rsp', note:'Hex dump 16 bytes at current stack pointer' },
        { cmd:'(gdb) x/s $rdi', note:'Print string at address in RDI' },
        { cmd:'objdump -d -M intel ./sample | grep -A20 "<compute>"', note:'Disassemble compute() without GDB' },
      ],
      traps: [
        'AT&T syntax: source first, destination second (MOV $0x1, %rax). Intel syntax: destination first (MOV rax, 1). Always set Intel syntax in GDB for sanity.',
        'stepi follows into library calls. nexti steps over them. Use nexti unless you want to trace libc internals.',
        'RFLAGS are not printed by info registers — use "info registers eflags" or "p $eflags".',
        'XOR eax, eax is the idiomatic zero-register instruction (2 bytes vs MOV eax,0 which is 5 bytes). Malware uses it heavily.',
      ],
      refs: ['Intel 64 and IA-32 Architectures Software Developer Manual Vol. 2', 'pwndbg cheatsheet', 'CS:APP Chapter 3'],
    },
    p03: {
      overview: `PE (Windows) and ELF (Linux) are the binary container formats. Understanding their structure lets you parse any executable without a tool, and catch anomalies that indicate packing, injection, or tampering.`,
      concepts: [
        { term:'PE Magic', def:'DOS header starts with MZ (4D 5A). e_lfanew DWORD at offset 0x3C points to PE signature (50 45 00 00 = "PE\\0\\0"). After that: COFF FileHeader + OptionalHeader. Any tool that identifies PE files does exactly this check.' },
        { term:'Section Headers', def:'.text = code (execute, read). .data = initialized data (read, write). .rdata = read-only data (strings, vtables). .rsrc = resources. .reloc = base relocation table. High entropy in .text means packed/encrypted code.' },
        { term:'Import Address Table (IAT)', def:'Array of pointers filled by the Windows loader at load time. Each entry corresponds to an imported function. Malware minimises IAT to avoid static detection; runtime API resolution via GetProcAddress is the evasion pattern.' },
        { term:'ELF Magic', def:'7F 45 4C 46 (7F + "ELF"). e_type: ET_EXEC=2 (executable), ET_DYN=3 (shared lib/PIE). e_entry = virtual address of _start. e_phoff = program header table offset; e_shoff = section header table offset.' },
        { term:'PLT/GOT', def:'Procedure Linkage Table (PLT) + Global Offset Table (GOT) implement lazy binding in ELF. First call to puts() hits PLT stub → resolver → fills GOT[puts] → subsequent calls go direct. GOT overwrite = classic exploitation technique.' },
        { term:'Base Relocation', def:'.reloc section contains RVAs that the loader patches when the image loads at a non-preferred base. Missing .reloc in non-PIE EXE is an anomaly (fixed base required, ASLR disabled for that image).' },
      ],
      commands: [
        { cmd:'readelf -h sample.elf', note:'ELF header: magic, type, architecture, entry point' },
        { cmd:'readelf -S sample.elf', note:'Section headers: name, type, offset, size, flags' },
        { cmd:'readelf -d sample.elf', note:'Dynamic section: NEEDED libs, RPATH, RUNPATH' },
        { cmd:'readelf -r sample.elf', note:'Relocations (.rel.plt, .rel.dyn)' },
        { cmd:'objdump -d -M intel sample.elf', note:'Disassemble .text with Intel syntax' },
        { cmd:'python3 -c "import pefile; pe=pefile.PE(\'s.exe\'); pe.print_info()"', note:'Full PE parse via pefile' },
        { cmd:'python3 -c "import pefile; pe=pefile.PE(\'s.exe\'); [print(s.Name,s.get_entropy()) for s in pe.sections]"', note:'Per-section entropy' },
        { cmd:'python3 -c "import pefile; pe=pefile.PE(\'s.exe\'); [print(e.dll_name,e.name) for e in pe.DIRECTORY_ENTRY_IMPORT for e in e.imports]"', note:'Full IAT dump' },
        { cmd:'xxd sample.exe | head -4', note:'Confirm MZ magic and e_lfanew at offset 0x3C' },
      ],
      traps: [
        'RVA (Relative Virtual Address) is NOT a file offset. File offset = RVA − section VirtualAddress + section PointerToRawData.',
        'A PE with no .reloc section is fine if it always loads at its preferred base (non-ASLR). Many malware drop the .reloc to save space AND disable ASLR.',
        'readelf -S and objdump -h show sections; readelf -l shows segments. Segments are for the loader; sections are for the linker. Both matter forensically.',
        'A DLL exporting nothing from its export table but imported by a legit process is a DLL side-loading red flag.',
      ],
      refs: ['Microsoft PE Format spec (learn.microsoft.com)', 'ELF-64 Object File Format (SCO)', 'pefile documentation'],
    },
    p04: {
      overview: `Static analysis means characterising a malware sample WITHOUT executing it. The goal is answering: what does this thing do, what network infrastructure does it use, and how do I detect it?`,
      concepts: [
        { term:'Entropy', def:'Shannon entropy ranges 0 (all same byte) to 8 (perfectly random). Compressed/encrypted sections score 7.5–8.0. UPX packed .text hits 7.8+. Measure per-section, not whole-file — legitimate code has entropy around 5.5–6.5.' },
        { term:'FLOSS (FLARE Obfuscated String Solver)', def:'Extracts: (1) printable strings (like strings.exe), (2) stack-constructed strings (char-by-char assignment), (3) decoded strings (XOR loops with recognised patterns). Replaces strings + manual XOR recovery in one pass.' },
        { term:'capa (FLARE Capability Detection)', def:'Maps binary capabilities to MITRE ATT&CK and MBC (Malware Behaviour Catalogue). Signatures cover >900 capabilities: process injection, credential access, network comms, persistence. Run on static binary; no execution needed.' },
        { term:'Packer Detection (DIE)', def:'Detect-It-Easy uses entropy + magic signatures + heuristics. Reports: UPX 3.96, VMProtect 3.x, Themida, MPRESS, custom crypter. Combined with section entropy gives confident packing verdict.' },
        { term:'Import Hashing (ImpHash)', def:'MD5 of the sorted import table — stable across compiler changes, useful for clustering malware families. Two samples with same ImpHash likely from same code base. VirusTotal pivots on ImpHash.' },
        { term:'Rich Header', def:'Optional PE artefact inserted by Visual Studio linker. Contains compiler version and linker ID. Not stripped by most packers. Useful for attribution — APT28 reused Rich headers across campaigns for years.' },
      ],
      commands: [
        { cmd:'strings -n8 sample.exe | grep -iE "http|cmd|powershell|\\\\\\\\|pass"', note:'Printable strings filtered for IOCs' },
        { cmd:'floss sample.exe --no-static-strings', note:'Only decoded + stack strings (skip raw printable)' },
        { cmd:'capa sample.exe -j | python3 -m json.tool | grep "attack"', note:'ATT&CK technique list only' },
        { cmd:'die sample.exe', note:'Packer/compiler/language identification' },
        { cmd:'python3 -c "import pefile,hashlib; pe=pefile.PE(\'s.exe\'); print(pe.get_imphash())"', note:'Compute ImpHash' },
        { cmd:'yara rules/ sample.exe', note:'Run YARA ruleset against sample' },
        { cmd:'python3 entropy.py sample.exe', note:'Per-section entropy chart' },
        { cmd:'xxd sample.exe | head -256', note:'Manual inspection: strings, XOR keys, magic in first 4KB' },
      ],
      traps: [
        'strings output is noisy — always grep for meaningful patterns (http://, .exe, cmd.exe, powershell) rather than reading everything.',
        'capa will NOT fire on packed samples — unpack first or use the --format pe option with dynamic trace.',
        'Entropy > 7.2 in .text means you probably cannot read strings or import meaningful disassembly without unpacking first.',
        'FLOSS stack strings can be wrong on RISC architectures or heavily obfuscated code. Always validate a decoded string by tracing the loop manually.',
      ],
      refs: ['FLARE capa rules repo (GitHub)', 'YARA documentation (virustotal.github.io)', 'Practical Malware Analysis ch.1–4'],
    },
    p05: {
      overview: `Ghidra is the NSA-developed free decompiler. It converts machine code back to pseudo-C, letting you understand algorithms, recover keys, and map the full control flow without running the binary.`,
      concepts: [
        { term:'Auto Analysis', def:'On first import Ghidra runs ~30 analysers: disassembly, function detection, type propagation, string identification, reference graph. For unknown malware always run analysis before exploring. Enable "Aggressive Instruction Finder" for shellcode.' },
        { term:'Decompiler Window', def:'Shows pseudo-C for the selected function. Accuracy depends on type information — importing function signatures (Ghidra Data Type Archives) dramatically improves output. Windows API calls read as "FUN_00401234" until signatures are applied.' },
        { term:'Cross-References (XREFs)', def:'Right-click any function/variable → References → Show References. Critical for finding all callers of a suspicious function, or all places a constant (XOR key) is used.' },
        { term:'Data Types & Structures', def:'Define structs in the Data Type Manager to type a void* pointer as a specific structure. Ghidra will then show named fields in the decompiler — transforms gibberish pointer arithmetic into readable struct access.' },
        { term:'Scripting (Ghidra API)', def:'Python (Jython) or Java scripts via Script Manager. SearchStrings, FindCryptoConstants (finds AES S-box etc.), DecompileAST. headless mode (-postScript) for batch analysis.' },
        { term:'Function Signatures / BSim', def:'BSim compares function bytecode using locality-sensitive hashing. Identifies known library functions (OpenSSL, zlib, custom CRT) even when statically linked — critical for isolating malware-unique logic from boilerplate.' },
      ],
      commands: [
        { cmd:'analyzeHeadless ~/proj crackme -import sample.exe -postScript PrintAST.java', note:'Headless import + analysis' },
        { cmd:'# In Ghidra: Window → Decompiler (Ctrl+E)', note:'Open decompiler for current function' },
        { cmd:'# Search: Search → For Strings (Shift+S)', note:'Find all printable strings in binary' },
        { cmd:'# XREFs: Right-click symbol → References → Show References to Address', note:'Find all callers' },
        { cmd:'# Rename: Right-click → Rename Variable (L)', note:'Rename local variable in decompiler' },
        { cmd:'# Script: Window → Script Manager → FindCryptoConstants', note:'Identify AES, RC4, etc.' },
        { cmd:'# Patch: Right-click → Patch Instruction (Ctrl+Shift+G)', note:'NOP out a check inline' },
        { cmd:'# Export: File → Export Program → C/C++ (decompiled source)', note:'Export decompiled pseudo-C' },
      ],
      traps: [
        'The decompiler output is pseudo-C — it is NOT compilable C. Types and pointer casts are best-effort. Always verify against disassembly for critical logic.',
        'Ghidra labels functions FUN_00401234 until you rename them. Name everything as you discover it — spatial memory in a huge binary is fragile.',
        'Dynamic loading (GetProcAddress, dlsym) hides APIs from the IAT. The string passed to GetProcAddress will appear in strings output. Trace the resolve → call chain manually.',
        'The first Ghidra analysis on a large binary can take 5–20 minutes. Do not interrupt it — a partial analysis produces unreliable results.',
      ],
      refs: ['NSA Ghidra documentation (ghidra.re)', 'Ghidra Book (No Starch Press)', 'Ghidra Data Type Archives for Windows APIs'],
    },
    p06: {
      overview: `Dynamic analysis executes the sample in a controlled environment and records what it does: system calls, network connections, file operations, registry changes. Real behaviour, not static inference.`,
      concepts: [
        { term:'strace', def:'Linux syscall interceptor. Every file open, network connect, process fork captured. Key filter flags: -e trace=network (connect/bind/recv/send), -e trace=file (open/unlink/rename), -e trace=process (fork/execve/exit). Output goes to stderr by default.' },
        { term:'API Monitor (Windows)', def:'Hooks Windows API calls via DLL injection. Captures parameters and return values for each API call with thread context. Covers CreateFile, RegSetValue, WinInet, WSASend. Far richer than strace for Windows malware.' },
        { term:'Procmon (Sysinternals)', def:'Real-time file system, registry, and process/thread activity monitor for Windows. Filter: Process Name = sample.exe; Operation = RegSetValue OR WriteFile. Produces PML log files importable into timeline tools.' },
        { term:'Fakenet-NG', def:'Simulates network services (HTTP/S, DNS, FTP, SMTP) to capture malware network traffic without real internet access. Sample connects, Fakenet responds with configurable content, and PCAP is captured.' },
        { term:'Cuckoo / CAPE Sandbox', def:'Automated dynamic analysis sandbox. Runs sample in a Windows VM, hooks NTAPI, captures: behaviour report, network PCAP, dropped files, memory dumps, screenshots. CAPE specialises in payload extraction from packed samples.' },
        { term:'Behaviour Signatures', def:'Post-analysis rule system matching specific API call sequences: CreateProcessHollowed (CreateProcess SUSPENDED + WriteProcessMemory + ResumeThread), PersistRunKey, LSASS_Access. Maps directly to ATT&CK techniques.' },
      ],
      commands: [
        { cmd:'strace -f -e trace=network ./sample', note:'Trace all network syscalls (connect, bind, recv, send)' },
        { cmd:'strace -f -o trace.log -e trace=file,process,network ./sample', note:'Full trace saved to file' },
        { cmd:'ltrace -f ./crackme arg1', note:'Library call trace — reveals strcmp arguments in cleartext' },
        { cmd:'strace -f -e trace=openat ./sample 2>&1 | grep "\.txt\|\.log\|\.cfg"', note:'File opens filtered to data files' },
        { cmd:'python3 -c "import subprocess; subprocess.run([\'strace\',\'-f\',\'-e\',\'trace=network\',\'./sample\'],capture_output=True)"', note:'Capture strace output in Python' },
        { cmd:'fakenet-ng -l sample_network.pcap', note:'Simulate network on Linux before running sample' },
        { cmd:'tcpdump -w capture.pcap -i lo &; sleep 1; ./sample; kill %1', note:'Capture loopback during execution' },
      ],
      traps: [
        'strace output is to STDERR — use 2>&1 to redirect to file, or use -o flag. Many analysts miss output because they only redirect stdout.',
        'Environment checks: modern malware checks username, hostname, MAC address, running processes for sandbox indicators. Some samples do nothing in a VM — use a bare-metal analysis host or patch the checks.',
        'ltrace reveals library call arguments (strcmp plaintext!) but misses direct syscalls. Use both strace + ltrace for full coverage.',
        'Network traffic may be encrypted (TLS). Fakenet returns generic responses. For TLS interception you need a MITM proxy with the sample patched or configured to accept a custom CA.',
      ],
      refs: ['CAPE Sandbox (github.com/kevoreilly/CAPEv2)', 'Fakenet-NG documentation', 'Practical Malware Analysis ch.7–9'],
    },
    p07: {
      overview: `Most distributed malware is packed or encrypted to evade static detection. Unpacking reveals the true payload, restoring strings, imports, and disassemblable code.`,
      concepts: [
        { term:'Packer vs Crypter', def:'Packer compresses code (UPX, MPRESS) — reduces size, incidentally defeats signatures. Crypter encrypts code with per-build key — specifically designed to defeat AV. A crypter stub decrypts in memory then jumps to OEP.' },
        { term:'OEP (Original Entry Point)', def:'The entry point of the unpacked payload, contrasted with the packer stub\'s entry point. OEP is where the original binary starts executing. Dumping the process at OEP + fixing the IAT yields a usable unpacked copy.' },
        { term:'UPX Header', def:'UPX leaves "UPX!" magic at several offsets in the packed binary. Detectable by strings alone. upx -d decompresses in place. If UPX header is stripped: OEP-hunting in debugger (hardware BP on write to unpacked region, then single-step to JMP EAX).' },
        { term:'IAT Reconstruction', def:'After dumping a process at OEP, the IAT contains resolved addresses (not thunks). Scylla (x64dbg plugin) or LordPE walk the IAT, resolve addresses back to function names, and rebuild the import directory.' },
        { term:'POEP Pattern', def:'Most packers end with PUSHAD/PUSHA at stub start (save registers), then POPAD/POPA at stub end (restore), then JMP EAX/RCX to OEP. Hardware breakpoint on ESP after PUSHAD → run → stops at POPAD → step into JMP.' },
        { term:'PE-sieve / Hollows Hunter', def:'Scans all running processes for PE anomalies: modified entry points, injected modules, replaced headers. Dumps suspicious processes automatically. Essential for extracting injected payloads that never touch disk.' },
      ],
      commands: [
        { cmd:'strings packed.exe | grep UPX', note:'Confirm UPX packing by stub strings' },
        { cmd:'upx -d packed.exe -o unpacked.exe', note:'UPX decompress (only if header intact)' },
        { cmd:'strings unpacked.exe | grep -iE "http|cmd|.dll|.exe"', note:'Post-unpack strings — should be much richer' },
        { cmd:'python3 -c "import math,collections; d=open(\'s.exe\',\'rb\').read(); p={b:d.count(b)/len(d) for b in set(d)}; print(round(-sum(p[b]*math.log2(p[b]) for b in p),2))"', note:'Whole-file entropy' },
        { cmd:'die packed.exe', note:'Packer identification' },
        { cmd:'pe-sieve.exe /pid 1234 /dump 1 /shellc 1', note:'Dump all modified/injected PEs from process' },
        { cmd:'hollows_hunter.exe /dir dumps/', note:'Scan all processes, dump hollowed ones to dir' },
      ],
      traps: [
        'upx -d only works if the UPX magic is intact. Many malware authors strip the "UPX!" header after packing to defeat trivial string detection. You must unpack in-debugger in that case.',
        'Dumping at OEP leaves the IAT as resolved addresses. A reconstructed IAT is required before the dumped PE can be loaded/analysed. Scylla does this automatically from within x64dbg.',
        'High section entropy after "unpacking" means there is a second stage (crypter inside a packer). Apply entropy analysis iteratively — each layer reveals the next.',
        'PE-sieve dumps are named <pid>_<base>_<type>.exe. Cross-reference with the process list to know which process each dump came from.',
      ],
      refs: ['The Art of Unpacking (Mark Vincent Yason, IBM X-Force)', 'Scylla IAT Reconstruction (github.com/NtQuery/Scylla)', 'x64dbg documentation'],
    },
    p08: {
      overview: `Memory forensics analyses a raw RAM dump to find running processes, network connections, injected code, and encryption keys that never touch disk. Volatility 3 is the primary framework.`,
      concepts: [
        { term:'Memory Image Formats', def:'Raw (.raw, .mem, .bin): flat byte-for-byte dump. LiME (.lime): Linux memory acquisition format with segment headers. Crash dump (.dmp): Windows BSOD or Task Manager dump — requires Volatility --mode crash. Hibernation (hiberfil.sys): compressed, Volatility decompresses.' },
        { term:'EPROCESS / _PROC', def:'Kernel structure per process. Contains: PID, PPID, ImageFileName, CreateTime, ExitTime, ActiveProcessLinks (doubly-linked list). pslist walks this linked list. psscan scans raw memory for EPROCESS signatures — finds hiding/unlinking rootkits.' },
        { term:'VAD (Virtual Address Descriptor)', def:'Red-black tree per process mapping virtual address ranges to their backing (file, pagefile, anonymous). malfind uses VADs to find MZ-signed anonymous private regions with Execute permission — the hollowing/injection fingerprint.' },
        { term:'malfind Output', def:'Reports: PID, process name, virtual address, VAD flags (PAGE_EXECUTE_READWRITE). Then hex dump showing MZ header or shellcode. Must manually triage — not every hit is malicious (some JIT-compiled code, game anti-cheat also triggers).' },
        { term:'Network Artefacts', def:'netscan recovers TCP/UDP connection objects (TCPEndpoint, UDPEndpoint) even after the connection closes (structure remains in pool until overwritten). State: ESTABLISHED = live; CLOSE_WAIT/TIME_WAIT = recently closed.' },
        { term:'Cobalt Strike in Memory', def:'Specific patterns: reflective DLL beacon, named pipe \\\\\\\\.\\\\ pipe\\\\MSSE-*-server, sleep_mask XOR pattern in beacon config, HTTPS JA3 fingerprint. Detect via malfind (RWX MZ region) + strings on dump (*.cobaltstrike config bytes).' },
      ],
      commands: [
        { cmd:'vol3 -f mem.raw windows.info', note:'OS version, build, architecture — confirm profile' },
        { cmd:'vol3 -f mem.raw windows.pslist', note:'Process list from EPROCESS linked list' },
        { cmd:'vol3 -f mem.raw windows.psscan', note:'Process scan (finds unlinked/hidden processes)' },
        { cmd:'vol3 -f mem.raw windows.malfind', note:'Find RWX regions with PE headers (injection indicator)' },
        { cmd:'vol3 -f mem.raw windows.netscan', note:'Network connections — live and historical' },
        { cmd:'vol3 -f mem.raw windows.cmdline', note:'Command-line arguments per process' },
        { cmd:'vol3 -f mem.raw windows.dlllist --pid 1234', note:'DLLs loaded by PID 1234' },
        { cmd:'vol3 -f mem.raw windows.handles --pid 1234', note:'Open handles (files, registry, mutants)' },
        { cmd:'vol3 -f mem.raw windows.dumpfiles --pid 1234 -o /dumps/', note:'Dump all memory-mapped files for process' },
        { cmd:'vol3 -f mem.raw windows.registry.userassist', note:'UserAssist entries — recently run programs' },
        { cmd:'vol3 -f mem.raw windows.mftscan.MFTScan', note:'Scan for MFT records in memory (file timestamps)' },
      ],
      traps: [
        'pslist can miss rootkit-hidden processes that unlink themselves from the EPROCESS chain. Always run BOTH pslist AND psscan and diff the results.',
        'malfind produces false positives from JIT engines (.NET, V8, Java). Check the hex dump — legitimate JIT code usually lacks the PE MZ/DOS stub.',
        'netscan timestamps are in UTC. Always confirm your analysis system timezone and convert consistently.',
        'Memory dumps from live systems may have timing inconsistencies (kernel structures partially written during acquisition). Critical findings should be corroborated by a second artefact.',
      ],
      refs: ['Volatility Foundation Documentation', 'The Art of Memory Forensics (Ligh, Case, Levy, Walters)', 'SANS FOR508 Memory Forensics cheatsheet'],
    },
    p09: {
      overview: `Network forensics analyses packet captures (PCAP) to reconstruct communication, identify C2 channels, extract transferred files, and decode exfiltration. Wireshark, tshark, and Zeek are the primary tools.`,
      concepts: [
        { term:'PCAP vs PCAPng', def:'PCAP: legacy libpcap format. PCAPng: modern format supporting multiple interfaces, per-packet comments, nanosecond timestamps. Wireshark reads both. tshark with -F pcap converts PCAPng to old format.' },
        { term:'JA3 / JA3S', def:'MD5 of TLS ClientHello fields (version, ciphers, extensions, elliptic curves, EC formats). Fingerprints TLS clients regardless of IP/domain. JA3S fingerprints the ServerHello. Cobalt Strike default JA3: 72a7c4d879f23a2c3d643ee09e1dce61.' },
        { term:'Beacon Periodicity', def:'C2 beacons check in at regular intervals (Cobalt Strike default: 60s ±10% jitter). Plot inter-arrival times of connections to a single IP — periodic clustering at 54–66s (for 60s beacon with 10% jitter) is a strong indicator.' },
        { term:'DNS Anomalies', def:'DGA: high-entropy short domains (kdsjfhksdf.com). DNS tunnelling: long subdomain labels (>40 chars), high NXDOMAIN rate, repeated TXT queries. Baseline domain stats over 24h then alert on 3σ deviations.' },
        { term:'File Carving from PCAP', def:'NetworkMiner or tshark exports reassembled TCP streams. HTTP GET responses containing MZ header → executable. SMTP attachments, FTP data channels, SMB file transfers all recoverable. Use Wireshark → File → Export Objects → HTTP.' },
        { term:'Encrypted Traffic Analysis', def:'Even with TLS, certificate metadata (CN, SAN, issuer), ALPN negotiation, byte length patterns, and timing are analysable. Self-signed certs or Let\'s Encrypt certs for C2 infrastructure are common red flags.' },
      ],
      commands: [
        { cmd:"tshark -r cap.pcap -Y 'dns' -T fields -e dns.qry.name -e dns.qry.type | sort | uniq -c | sort -rn | head -30", note:'Top 30 DNS queries' },
        { cmd:"tshark -r cap.pcap -Y 'dns.qry.name matches \".{40,}\"' -T fields -e dns.qry.name", note:'Long DNS queries (tunnelling indicator)' },
        { cmd:"tshark -r cap.pcap -Y 'tls.handshake.type == 1' -T fields -e ip.dst -e tls.handshake.ja3", note:'JA3 fingerprints of all TLS ClientHellos' },
        { cmd:"tshark -r cap.pcap -z io,stat,60,'ip.dst==185.220.101.47' -q", note:'60-second connection rate to specific IP' },
        { cmd:"tshark -r cap.pcap -Y 'http.response.code == 200' --export-objects http,exported/", note:'Export all HTTP 200 response objects' },
        { cmd:"tshark -r cap.pcap -q -z conv,tcp | sort -k3 -rn | head -20", note:'Top TCP conversations by bytes' },
        { cmd:"zeek -r cap.pcap", note:'Run Zeek against PCAP, produce conn.log, dns.log, http.log, ssl.log' },
        { cmd:"cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p proto duration | sort -k5 -rn | head -20", note:'Longest connections (beacon dwell)' },
      ],
      traps: [
        'tshark display filters (-Y) are applied post-capture. They filter display but read all packets. Use -R for read filter (applied during read, faster on large files).',
        'JA3 hashes vary slightly between TLS library versions. A known-bad JA3 is high-confidence but absence doesn\'t clear a host — use JA3 as one signal among many.',
        'Large PCAPs (>1GB) are slow in Wireshark. Use tshark for filtering first, then load the subset in Wireshark for interactive analysis.',
        'DNS over HTTPS (DoH) tunnelling is invisible in DNS logs. Look for HTTPS traffic to known DoH resolvers (1.1.1.1, 8.8.8.8, 9.9.9.9) at anomalous volumes.',
      ],
      refs: ['tshark man page', 'Zeek documentation (zeek.org)', 'NetworkMiner packet analysis tool'],
    },
    p10: {
      overview: `Protocol reverse engineering decodes proprietary or undocumented C2 communication protocols from raw packet captures — identifying framing, encryption keys, and command opcodes.`,
      concepts: [
        { term:'Frame Magic Bytes', def:'Most custom protocols start with a magic sequence that identifies the protocol version or frame type. Look for a constant 2–4 byte prefix in all messages (e.g., BE EF, DE AD BE EF). xxd column alignment helps spot repeating patterns.' },
        { term:'Length-Value Encoding', def:'After magic: a length field (1, 2, or 4 bytes, big- or little-endian) indicating payload length. Validate by checking if length value + header size = total packet size across all samples.' },
        { term:'Opcode Table', def:'After length: a 1-byte opcode indicating command type (0x01=BEACON, 0x02=EXEC, 0x03=EXFIL). Reconstruct by correlating opcode values with payload content patterns. BEACON payloads often contain hostname/PID; EXEC contains a command string.' },
        { term:'XOR Key Recovery', def:'If payload is XOR-encrypted with known plaintext available (e.g., BEACON responses always start with hostname), XOR known plaintext against ciphertext to recover key bytes. Test key on subsequent packets to confirm.' },
        { term:'Scapy for Protocol Parsing', def:'Python library for packet crafting and parsing. Define custom protocol layers as Python classes with field definitions. Scapy handles endianness, bit fields, and checksums. Ideal for scripting automated protocol decode.' },
        { term:'Impacket', def:'Python library implementing many Windows protocols (SMB, MSRPC, Kerberos, LDAP, NTLM). Used for DCSync, PtH, PsExec reimplementation. Also useful for analysing captured SMB/DCE-RPC traffic — match captured opcodes to impacket\'s definitions.' },
      ],
      commands: [
        { cmd:"tshark -r c2.pcap -Y 'tcp.len > 0' -T fields -e data.data | xxd", note:'Raw payload bytes of all non-empty TCP segments' },
        { cmd:"tshark -r c2.pcap -Y 'tcp.dstport==4444' -w filtered.pcap", note:'Isolate C2 traffic to port 4444' },
        { cmd:"python3 -c \"d=bytes.fromhex('beefXXXX'); key=0x5a; print(bytes([b^key for b in d[4:]]))\"", note:'XOR decode with key 0x5A from byte offset 4' },
        { cmd:"python3 -c \"import socket,struct; hdr=bytes.fromhex('BEEF0010'); magic,length=struct.unpack('>HH',hdr); print(magic,length)\"", note:'Parse big-endian magic+length frame header' },
        { cmd:"scapy: hexdump(rdpcap('c2.pcap')[5].load)", note:'Hexdump payload of 6th packet in scapy' },
        { cmd:"strings -n4 -e l c2_payload.bin | head -20", note:'Extract 16-bit little-endian strings from payload' },
        { cmd:"python3 decode_c2.py c2.pcap --key 0x5a --skip-header 4", note:'Custom decoder script' },
      ],
      traps: [
        'Endianness matters. A 0x0010 in big-endian is length=16; in little-endian it\'s length=4096. Verify by cross-referencing with actual payload size.',
        'XOR key recovery requires known-plaintext. Identify a field that must contain a predictable value (hostname in registration beacon, null padding, or a string like "BBBB" for testing).',
        'C2 protocols often have different message formats for client→server vs server→client. Separate streams before decoding.',
        'If the first 4 bytes don\'t look like magic (high entropy), the whole frame including header may be encrypted. Look for a session key exchange packet first.',
      ],
      refs: ['Scapy documentation (scapy.net)', 'Impacket (github.com/fortra/impacket)', 'C2 Matrix (thec2matrix.com)'],
    },
    p11: {
      overview: `Rootkits and persistence artefacts hide attacker presence. This phase covers Windows-specific persistence mechanisms, the artefacts they leave, and how to find them even after the attacker attempts cleanup.`,
      concepts: [
        { term:'Registry Run Keys', def:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run executes per-user on logon. HKLM equivalent is system-wide. Both persist across reboots. Value name chosen to blend in (WindowsDefender32, AdobeUpdate). Autoruns.exe enumerates all 200+ persistence locations.' },
        { term:'Scheduled Tasks', def:'C:\\Windows\\System32\\Tasks\\ XML files. Event 4698 (task created), 4702 (modified), 4699 (deleted), 4700/4701 (enabled/disabled). schtasks /query /fo LIST /v shows full details. Task XML contains full command line and trigger.' },
        { term:'Event ID Cheatsheet', def:'4624=logon, 4625=failed logon, 4648=explicit cred logon, 4688=process create, 4697=service install, 4698=scheduled task, 4720=user created, 5140=share access, 7045=service install (System log), 1102=security log cleared.' },
        { term:'SSDT Hooks', def:'System Service Descriptor Table maps syscall numbers to kernel function addresses. A rootkit replaces entries with pointers to its own code to intercept NtOpenProcess, NtQuerySystemInformation etc. Detectable by comparing expected vs actual addresses (Volatility ssdt plugin).' },
        { term:'WMI Persistence', def:'__EventFilter + __EventConsumer + __FilterToConsumerBinding defines a WMI subscription. Survives reboots; invisible to tasklist/services. Repository stored in C:\\Windows\\System32\\wbem\\Repository. Forensically parsed by WMI-Forensics tool.' },
        { term:'Timestomping ($SI vs $FN)', def:'$STANDARD_INFORMATION timestamps in MFT are user-mode accessible and easily modified by malware (SetFileTime). $FILE_NAME timestamps require direct MFT manipulation (kernel mode). A file where $SI timestamps predate $FN timestamps indicates timestomping.' },
      ],
      commands: [
        { cmd:'reg query HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', note:'User-mode Run key persistence check' },
        { cmd:'reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', note:'System-wide Run key' },
        { cmd:'schtasks /query /fo LIST /v | findstr "Task Name\\|Run As User\\|Task To Run"', note:'All scheduled tasks summary' },
        { cmd:'wevtutil qe Security /q:"*[System[EventID=7045]]" /f:text', note:'Service install events (Event 7045)' },
        { cmd:'wevtutil qe Security /q:"*[System[EventID=4698]]" /f:text', note:'Scheduled task creation (Event 4698)' },
        { cmd:'vol3 -f mem.raw windows.registry.printkey --key "Software\\Microsoft\\Windows\\CurrentVersion\\Run"', note:'Run key from memory image' },
        { cmd:'MFTECmd.exe -f $MFT --csv output.csv', note:'Parse full MFT to CSV for timestamp analysis' },
        { cmd:'python3 analyzeMFT.py -f $MFT -o mft_analysis.csv', note:'Alternative MFT parser' },
        { cmd:'wmic /namespace:\\\\root\\subscription path __EventFilter get Name,Query /format:list', note:'WMI event filter enumeration' },
        { cmd:'vol3 -f mem.raw windows.ssdt', note:'SSDT hook detection (compare expected vs actual)' },
      ],
      traps: [
        'Autoruns.exe requires admin rights to show all startup locations. Always run elevated, or check HKLM keys separately.',
        'WMI persistence is entirely invisible to standard tools (tasklist, services). Always run wmic __EventFilter enumeration and check the WMI repository file.',
        'Event log analysis requires knowing which logs were NOT deleted. Always check for Event 1102 (Security log cleared) and 104 (System log cleared) first.',
        '$FN timestamps can be in the future relative to $SI if the clock was wrong during file creation. Correlation with other filesystem activity in the same timeframe is required for confident timestomping verdict.',
      ],
      refs: ['Autoruns for Windows (Sysinternals)', 'SANS Windows Forensic Analysis cheatsheet', 'Volatility rootkit detection plugins'],
    },
    p12: {
      overview: `The capstone integrates all prior skills. Given a set of artefacts spanning email, disk, memory, and network, reconstruct the complete attack timeline, attribute TTPs to ATT&CK, and produce an IR report.`,
      concepts: [
        { term:'Attack Timeline Reconstruction', def:'Anchor events: initial email timestamp, first process creation on endpoint, first C2 connection, lateral movement auth events, final impact (encryption start). Build a unified timeline combining EVTX, disk timestamps, PCAP, and memory artefacts.' },
        { term:'Kill Chain Mapping', def:'Every evidence item maps to one or more kill chain phases and ATT&CK techniques. A phishing email = Initial Access (T1566.001). PowerShell execution = Execution (T1059.001). Registry Run key = Persistence (T1547.001). Map systematically.' },
        { term:'Evidence Correlation', def:'The same attacker action produces multiple evidence items across different sources. A file dropped by malware appears in: EVTX (4663 file create), Prefetch, MFT (timestamp), and possibly memory (mapped file). Corroboration across sources increases confidence.' },
        { term:'IOC Extraction', def:'From the full investigation: extract IP addresses, domain names, file hashes (SHA-256 preferred), file paths, registry keys, scheduled task names, service names, email sender addresses, user-agents. Package as STIX 2.1 for sharing.' },
        { term:'IR Report Structure', def:'Executive Summary (1 page, business impact), Technical Narrative (chronological TTPs), IOC Table, ATT&CK Matrix heat map, Evidence Index (artefact→finding map), Recommendations (immediate + strategic). Audience is both CISO and SOC.' },
        { term:'Lessons Learned', def:'Post-incident: detection gap analysis (what SIEM rules would have fired vs what actually fired), dwell time measurement (initial compromise to detection), containment time (detection to full remediation), recommended control improvements.' },
      ],
      commands: [
        { cmd:'log2timeline.py /output/dump.plaso /mnt/evidence/', note:'Build full plaso super-timeline from evidence dir' },
        { cmd:"psort.py -o l2tcsv /output/dump.plaso 'date > \"2024-03-15 03:00:00\" AND date < \"2024-03-15 04:00:00\"' > timeline.csv", note:'Filter plaso to 1-hour attacker window' },
        { cmd:'vol3 -f mem.raw windows.netscan | grep ESTABLISHED', note:'Live C2 connections from memory' },
        { cmd:"tshark -r cap.pcap -Y 'ip.dst==185.220.101.47' -T fields -e frame.time -e ip.len | awk '{print $1}' | sort > beacon_times.txt", note:'Extract beacon timestamps for periodicity analysis' },
        { cmd:'python3 beacon_detect.py beacon_times.txt --threshold 5', note:'Statistical beacon detection (custom script)' },
        { cmd:"grep -r 'EventID=4648\\|EventID=4624\\|EventID=4625' /evtx_exports/ | grep '2024-03-15'", note:'Authentication events on incident date' },
        { cmd:'MFTECmd.exe -f $MFT --csv timeline.csv; Import-Csv timeline.csv | Where-Object {$_.Created0x10 -gt "2024-03-15"} | Export-Csv filtered.csv', note:'MFT timeline filtered to incident window' },
      ],
      traps: [
        'Dwell time calculations require the EARLIEST evidence of compromise, not when the attacker was first detected. This is often much earlier — check email logs and proxy logs for initial access.',
        'Plaso super-timeline includes hundreds of thousands of events. Narrow to a ±2 hour window around the incident before exporting or you will be overwhelmed.',
        'Never report a finding without multiple corroborating artefacts. A single event log entry could be a false positive or coincidental. Minimum two independent evidence sources per ATT&CK technique claimed.',
        'IOCs extracted from a specific intrusion have short shelf life — IPs and domains change. Behavioral detections (process injection pattern, beacon periodicity) are longer-lived and more valuable.',
      ],
      refs: ['SANS FOR508 course materials', 'NIST SP 800-86 Guide to Integrating Forensic Techniques', 'MITRE ATT&CK Navigator (attack.mitre.org/navigator)'],
    },
  };

  $: content = CONTENT[selectedId] ?? CONTENT['p01'];
</script>

<svelte:head><title>Study — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>STUDY</span>
  <div class="ts-right">
    <button class="mode-btn" class:active={mode==='read'} on:click={() => mode='read'}>READ</button>
    <button class="mode-btn" class:active={mode==='drill'} on:click={() => { mode='drill'; resetDrill(); }}>DRILL</button>
  </div>
</div>

{#if mode === 'drill'}
  <div class="drill-layout">
    <nav class="phase-nav">
      {#each PHASES as p}
        <button
          class="pn-item"
          class:active={p.id === selectedId}
          on:click={() => goto('/console/study?phase='+p.id)}
        >
          <span class="pn-n">{p.n}</span>
          <span class="pn-name">{p.name}</span>
          <span class="chip chip-{p.track==='DF'?'df':p.track==='RE'?'re':'ma'}" style="font-size:9px;padding:1px 5px">{p.track}</span>
        </button>
      {/each}
    </nav>

    <main class="drill-main">
      <div class="drill-header">
        <h2 class="drill-phase-title">{selected.name}</h2>
        <div class="drill-progress">
          <span class="dp-card">Card {cardIdx + 1} / {drillTotal}</span>
          <span class="dp-got">✓ {gotIt.size} got it</span>
          <span class="dp-review">↺ {reviewAgain.size} review</span>
        </div>
        <div class="drill-bar">
          <div class="drill-bar-fill" style="width:{drillTotal ? Math.round(((gotIt.size)/drillTotal)*100) : 0}%"></div>
        </div>
      </div>

      {#if drillCard}
        <div class="flashcard-wrap">
          <button class="flashcard" class:flipped on:click={() => (flipped = !flipped)} aria-label="Flip card">
            <div class="fc-front">
              <div class="fc-label">TERM</div>
              <div class="fc-term">{drillCard.term}</div>
              <div class="fc-tap-hint">tap to reveal definition</div>
            </div>
            <div class="fc-back">
              <div class="fc-label">DEFINITION</div>
              <div class="fc-def">{drillCard.def}</div>
              {#if drillCard.cmd}
                <code class="fc-cmd">{drillCard.cmd}</code>
              {/if}
            </div>
          </button>

          <div class="drill-actions">
            <button class="da-btn da-prev" on:click={prevCard} title="Previous">←</button>
            {#if flipped}
              <button class="da-btn da-review" on:click={markReview}>↺ Review Again</button>
              <button class="da-btn da-got" on:click={markGot}>✓ Got It</button>
            {:else}
              <button class="da-btn da-flip" on:click={() => (flipped = true)}>Flip Card</button>
            {/if}
            <button class="da-btn da-next" on:click={nextCard} title="Next">→</button>
          </div>

          <div class="drill-deck-row">
            {#each drillCards as _, i}
              <button
                class="deck-dot"
                class:dot-current={i === cardIdx}
                class:dot-got={gotIt.has(i)}
                class:dot-review={reviewAgain.has(i)}
                on:click={() => { cardIdx = i; flipped = false; }}
                aria-label="Go to card {i+1}"
              ></button>
            {/each}
          </div>

          <button class="reset-drill" on:click={resetDrill}>Reset Deck</button>
        </div>
      {:else}
        <div class="drill-empty">No concepts for this phase yet.</div>
      {/if}
    </main>
  </div>
{/if}

{#if mode === 'read'}
<div class="study-layout">
  <nav class="phase-nav">
    {#each PHASES as p}
      <button
        class="pn-item"
        class:active={p.id === selectedId}
        on:click={() => goto('/console/study?phase='+p.id)}
      >
        <span class="pn-n">{p.n}</span>
        <span class="pn-name">{p.name}</span>
        <span class="chip chip-{p.track==='DF'?'df':p.track==='RE'?'re':'ma'}" style="font-size:9px;padding:1px 5px">{p.track}</span>
      </button>
    {/each}
  </nav>

  <main class="study-main">
    <div class="study-card">
      <div class="sc-header">
        <div class="sc-eyebrow">Phase {selected.n} · {selected.track}</div>
        <h1 class="sc-title">{selected.name}</h1>
        <div class="sc-tools">{selected.tools}</div>
      </div>

      <div class="sc-section">
        <p class="sc-overview">{content.overview}</p>
      </div>

      <div class="sc-section">
        <h2 class="sc-h2">Key Concepts</h2>
        <div class="concept-list">
          {#each content.concepts as c}
            <div class="concept-item">
              <div class="ci-term">{c.term}</div>
              <div class="ci-def">{c.def}</div>
              {#if c.cmd}<code class="ci-cmd">{c.cmd}</code>{/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="sc-section">
        <h2 class="sc-h2">Command Reference</h2>
        <div class="cmd-list">
          {#each content.commands as c}
            <div class="cmd-item">
              <code class="cmd-code">{c.cmd}</code>
              <span class="cmd-note">{c.note}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="sc-section">
        <h2 class="sc-h2">Common Traps</h2>
        <ul class="trap-list">
          {#each content.traps as t}
            <li class="trap-item">{t}</li>
          {/each}
        </ul>
      </div>

      <div class="sc-section sc-footer">
        <h2 class="sc-h2">References</h2>
        <ul class="ref-list">
          {#each content.refs as r}
            <li class="ref-item">{r}</li>
          {/each}
        </ul>
        <a href="/console/range" class="btn-primary" style="display:inline-block;margin-top:24px">
          Open Lab for Phase {selected.n} →
        </a>
      </div>
    </div>
  </main>
</div>
{/if}

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 8px 20px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; align-items: center; z-index: 10;
  }
  .ts-right { display: flex; gap: 4px; }
  .mode-btn {
    font-size: 10px; font-weight: 700; letter-spacing: .08em;
    padding: 4px 12px; border-radius: 4px; cursor: pointer;
    border: 1px solid var(--line2); background: transparent; color: var(--ash);
    transition: all .15s;
    min-height: 28px;
  }
  .mode-btn.active { border-color: var(--volt); color: var(--volt); background: color-mix(in srgb,var(--volt) 8%,transparent); }
  .mode-btn:hover:not(.active) { border-color: var(--ash); color: var(--bone); }

  /* drill layout mirrors study layout */
  .drill-layout { display: flex; flex: 1; overflow: hidden; }
  .drill-main { flex: 1; padding: 28px; overflow-y: auto; }

  .drill-header {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 20px 24px; margin-bottom: 24px;
  }
  .drill-phase-title { font-size: 18px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .drill-progress { display: flex; gap: 16px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .dp-card   { font-family: var(--mono); font-size: 11px; color: var(--ash); }
  .dp-got    { font-size: 11px; color: var(--volt); font-weight: 700; }
  .dp-review { font-size: 11px; color: var(--amber); font-weight: 700; }
  .drill-bar { height: 3px; background: var(--line2); border-radius: 2px; overflow: hidden; }
  .drill-bar-fill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .4s ease; }

  .flashcard-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    max-width: 560px; margin: 0 auto;
  }

  .flashcard {
    width: 100%; min-height: 220px;
    background: var(--panel); border: 1px solid var(--line2);
    border-radius: 10px; cursor: pointer;
    perspective: 1000px;
    position: relative;
    transition: border-color .2s, box-shadow .2s;
    padding: 0; /* button reset */
  }
  .flashcard:hover { border-color: var(--volt); box-shadow: 0 0 20px color-mix(in srgb,var(--volt) 12%,transparent); }

  .fc-front, .fc-back {
    position: absolute; inset: 0;
    padding: 28px 32px;
    display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
    border-radius: 10px;
    backface-visibility: hidden;
    transition: opacity .18s, transform .18s;
  }
  .fc-front { background: var(--panel); }
  .fc-back  { background: var(--panel2); opacity: 0; transform: rotateY(10deg); pointer-events: none; }
  .flashcard.flipped .fc-front { opacity: 0; transform: rotateY(-10deg); pointer-events: none; }
  .flashcard.flipped .fc-back  { opacity: 1; transform: rotateY(0); pointer-events: auto; }
  /* keep card height consistent */
  .fc-front, .fc-back { min-height: 220px; }

  .fc-label { font-size: 9px; font-weight: 700; letter-spacing: .12em; color: var(--dim); text-transform: uppercase; margin-bottom: 16px; }
  .fc-term  { font-size: 22px; font-weight: 700; color: var(--volt); font-family: var(--mono); }
  .fc-tap-hint { font-size: 11px; color: var(--dim); margin-top: 14px; }
  .fc-def   { font-size: 14px; color: var(--ash); line-height: 1.7; }
  .fc-cmd   { display: block; margin-top: 12px; font-size: 11px; color: var(--bone); font-family: var(--mono); background: var(--panel3); padding: 5px 10px; border-radius: 4px; text-align: left; }

  .drill-actions { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .da-btn {
    font-size: 12px; font-weight: 700;
    padding: 8px 18px; border-radius: var(--rad); cursor: pointer;
    border: 1px solid var(--line2); background: transparent; color: var(--ash);
    transition: all .15s; min-height: 40px;
  }
  .da-btn:hover { border-color: var(--ash); color: var(--bone); }
  .da-prev, .da-next { padding: 8px 14px; }
  .da-got    { border-color: color-mix(in srgb,var(--volt) 40%,transparent); color: var(--volt); }
  .da-got:hover { background: color-mix(in srgb,var(--volt) 12%,transparent); border-color: var(--volt); }
  .da-review { border-color: color-mix(in srgb,var(--amber) 40%,transparent); color: var(--amber); }
  .da-review:hover { background: color-mix(in srgb,var(--amber) 10%,transparent); border-color: var(--amber); }
  .da-flip   { border-color: color-mix(in srgb,var(--blue) 40%,transparent); color: var(--blue); }
  .da-flip:hover { background: color-mix(in srgb,var(--blue) 10%,transparent); border-color: var(--blue); }

  .drill-deck-row { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
  .deck-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--line2); background: transparent; cursor: pointer;
    padding: 0; transition: background .15s, border-color .15s;
  }
  .deck-dot.dot-current  { border-color: var(--bone);  background: var(--bone); }
  .deck-dot.dot-got      { border-color: var(--volt);  background: var(--volt); }
  .deck-dot.dot-review   { border-color: var(--amber); background: var(--amber); }

  .reset-drill {
    font-size: 11px; color: var(--dim); background: none; border: none; cursor: pointer;
    text-decoration: underline; padding: 4px;
  }
  .reset-drill:hover { color: var(--ash); }

  .drill-empty { color: var(--ash); padding: 40px; text-align: center; }

  .study-layout { display: flex; flex: 1; overflow: hidden; }

  .phase-nav {
    width: 220px; min-width: 220px;
    border-right: 1px solid var(--line);
    overflow-y: auto; padding: 8px 0;
  }
  .pn-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 9px 16px; border: none;
    background: none; text-align: left; cursor: pointer;
    border-left: 2px solid transparent;
    transition: background .15s, border-color .15s;
  }
  .pn-item:hover { background: var(--panel2); }
  .pn-item.active { border-left-color: var(--volt); background: color-mix(in srgb, var(--volt) 6%, transparent); }
  .pn-n { font-family: var(--mono); font-size: 11px; color: var(--volt); width: 16px; flex-shrink: 0; }
  .pn-name { flex: 1; font-size: 12px; color: var(--ash); }
  .pn-item.active .pn-name { color: var(--bone); }

  .study-main { flex: 1; padding: 28px; overflow-y: auto; }
  .study-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden; max-width: 820px;
  }
  .sc-header {
    padding: 28px 32px;
    border-bottom: 1px solid var(--line);
    background: var(--panel2);
  }
  .sc-eyebrow { font-size: 11px; color: var(--volt); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
  .sc-title { font-size: 22px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .sc-tools { font-family: var(--mono); font-size: 12px; color: var(--ash); }

  .sc-section { padding: 24px 32px; border-bottom: 1px solid var(--line); }
  .sc-section:last-child { border-bottom: none; }
  .sc-footer { background: var(--panel2); }
  .sc-h2 { font-size: 12px; font-weight: 700; color: var(--bone); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 14px; }
  .sc-overview { font-size: 14px; color: var(--ash); line-height: 1.75; }

  .concept-list { display: flex; flex-direction: column; gap: 14px; }
  .concept-item { padding: 14px 16px; background: var(--panel2); border: 1px solid var(--line); border-radius: var(--rad); }
  .ci-term { font-size: 12px; font-weight: 700; color: var(--volt); margin-bottom: 5px; font-family: var(--mono); }
  .ci-def { font-size: 13px; color: var(--ash); line-height: 1.65; }
  .ci-cmd { display: block; margin-top: 8px; font-size: 11px; color: var(--bone); font-family: var(--mono); background: var(--panel3); padding: 4px 8px; border-radius: 3px; }

  .cmd-list { display: flex; flex-direction: column; gap: 6px; }
  .cmd-item { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; background: var(--panel3); border-radius: var(--rad); border: 1px solid var(--line); }
  .cmd-code { font-family: var(--mono); font-size: 12px; color: var(--volt); word-break: break-all; }
  .cmd-note { font-size: 11px; color: var(--ash); }

  .trap-list { padding-left: 18px; display: flex; flex-direction: column; gap: 10px; }
  .trap-item { font-size: 13px; color: var(--ash); line-height: 1.65; }
  .trap-item::marker { color: var(--blood); }

  .ref-list { padding-left: 18px; display: flex; flex-direction: column; gap: 6px; }
  .ref-item { font-size: 13px; color: var(--ash); }
  .ref-item::marker { color: var(--volt); }

  .btn-primary {
    background: var(--volt); color: var(--void); font-weight: 700;
    font-size: 13px; padding: 10px 20px; border-radius: var(--rad);
    text-decoration: none; transition: opacity .15s;
  }
  .btn-primary:hover { opacity: .85; text-decoration: none; }
</style>
