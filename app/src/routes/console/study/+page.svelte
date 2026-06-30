<script>
  import { PHASES } from '$lib/data';
  import { phases, ctf } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  $: selectedId = $page.url.searchParams.get('phase') ?? 'p01';
  $: selected   = PHASES.find(p => p.id === selectedId) ?? PHASES[0];

  let mode = 'read'; // 'read' | 'challenges'

  // Flag challenges
  let challengeIdx = 0;
  let flagInput = '';
  let solved = new Set();
  let feedback = null; // 'correct' | 'wrong' | null
  let showHint = false;

  // Command challenge (post-clear quiz)
  let chalMode = false;
  let chalIdx = 0;
  let chalSelected = null;
  let chalAnswered = false;
  let chalScore = 0;
  let chalTotal = 0;
  let challengeQs = [];

  $: challenges = content?.challenges ?? [];
  $: challengeTotal = challenges.length;
  $: challenge = challenges[challengeIdx] ?? null;
  $: allSolved = challengeTotal > 0 && solved.size === challengeTotal;

  function ctfKey(i) { return `${selectedId}_${i}`; }

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function loadSolved() {
    solved = new Set();
    challenges.forEach((c, i) => { if ($ctf[ctfKey(i)]) solved.add(i); });
    challengeIdx = 0; flagInput = ''; feedback = null; showHint = false;
    chalMode = false; chalIdx = 0; chalSelected = null; chalAnswered = false; chalScore = 0;
  }

  function saveProgress() {
    phases.update(p => ({ ...p, [selectedId]: { score: solved.size, total: challengeTotal, pass: solved.size === challengeTotal } }));
  }

  $: if (selectedId) { loadSolved(); }

  function submitFlag() {
    if (!challenge) return;
    if (normalizeFlag(flagInput) === normalizeFlag(challenge.flag)) {
      feedback = 'correct';
      solved.add(challengeIdx);
      solved = solved;
      ctf.update(c => ({ ...c, [ctfKey(challengeIdx)]: true }));
      saveProgress();
    } else {
      feedback = 'wrong';
    }
  }

  function gotoChallenge(i) {
    challengeIdx = i; flagInput = ''; feedback = null; showHint = false;
  }
  function nextChallenge_() { gotoChallenge((challengeIdx + 1) % challengeTotal); }
  function prevChallenge_() { gotoChallenge((challengeIdx - 1 + challengeTotal) % challengeTotal); }

  // Build command challenges: show note, pick correct command from 4 options
  function buildChallenges(cmds) {
    if (!cmds || cmds.length < 2) return [];
    return cmds.map((c, i) => {
      const pool = cmds.filter((_, j) => j !== i);
      const wrong = pool.sort(() => Math.random() - .5).slice(0, 3).map(w => w.cmd);
      const opts = [...wrong, c.cmd].sort(() => Math.random() - .5);
      return { note: c.note, answer: c.cmd, opts };
    });
  }

  function startChallenge() {
    const cmds = content?.commands ?? [];
    challengeQs = buildChallenges(cmds);
    chalIdx = 0; chalSelected = null; chalAnswered = false; chalScore = 0; chalTotal = challengeQs.length;
    chalMode = true;
  }

  function pickAnswer(opt) {
    if (chalAnswered) return;
    chalSelected = opt;
    chalAnswered = true;
    if (opt === challengeQs[chalIdx]?.answer) chalScore++;
  }

  function nextChallenge() {
    if (chalIdx + 1 < challengeQs.length) {
      chalIdx++; chalSelected = null; chalAnswered = false;
    } else {
      chalIdx = challengeQs.length; // show results
    }
  }

  const CONTENT = {
    p01: {
      overview: `The Sleuth Kit (TSK) is the foundation of open-source disk forensics. Every disk analysis starts with understanding the partition layout, then navigating to the filesystem, then extracting specific files — even deleted ones.`,
      challenges: [
        { scenario: 'mmls on disk.img reports the only Linux partition starts at sector 2048 in an image using 512-byte sectors. Before running icat, what byte offset must you pass to -o?', hint: 'byte offset = sector × sector size', flag: 'BV{1048576}' },
        { scenario: "fls -r -o 2048 disk.img lists secret_document.txt at inode 13 with a * prefix. In TSK output, what single word describes that inode's allocation status?", hint: 'fls marks deleted-but-readable inodes this way', flag: 'BV{unallocated}' },
        { scenario: "A forensic exam finds $STANDARD_INFORMATION shows file creation 2023-01-15, while $FILE_NAME (kernel-only, far harder to fake) shows creation 2024-03-15. Name the anti-forensic technique that produced this 14-month gap.", hint: '$SI is user-mode writable; $FN is not', flag: 'BV{timestomping}' },
        { scenario: 'icat -o 2048 disk.img 13 recovers 412 bytes from a deleted inode whose data blocks were never overwritten. What general term describes this recoverable region outside the live filesystem allocation table?', hint: 'blkls -A dumps all of it at once', flag: 'BV{unallocated_space}' },
        { scenario: 'ifind -n "secret.txt" disk.img resolves a filename straight to inode 13. What filesystem structure maps a human-readable name to an inode number?', hint: 'lives inside a directory, not the inode itself', flag: 'BV{directory_entry}' },
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
      challenges: [
        { scenario: "GDB breaks at compute() and info registers rdi rsi shows the function's first integer argument. Per the System V AMD64 ABI, which register holds it?", hint: 'RDI, RSI, RDX, RCX, R8, R9 — in that order', flag: 'BV{rdi}' },
        { scenario: 'x64dbg shows 32 bytes reserved on the stack below the return address before any stack-passed arguments, on a Windows x64 binary. What is this reserved region called?', hint: 'Windows x64 calling convention only', flag: 'BV{shadow_space}' },
        { scenario: 'Decompiler output shows lea rax,[rbp-0x8] in one line and mov rax,[rbp-0x8] later. Which of the two instructions computes an address without dereferencing memory?', hint: 'one loads a value, one loads a pointer', flag: 'BV{lea}' },
        { scenario: 'A CALL instruction at 0x401130 transfers control AND pushes one 8-byte value onto the stack before jumping. What value does it push?', hint: 'where execution resumes after the callee returns', flag: 'BV{return_address}' },
        { scenario: 'Malware repeatedly uses xor eax,eax instead of mov eax,0 to zero a register — both reach the same result. What property of the XOR idiom do malware authors exploit here?', hint: 'count the bytes each instruction takes', flag: 'BV{smaller_encoding}' },
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
      challenges: [
        { scenario: 'xxd on a binary shows the byte pair 4D 5A at offset 0. What two ASCII characters does this hex pair spell?', hint: 'the DOS header magic', flag: 'BV{mz}' },
        { scenario: 'e_lfanew at offset 0x3C in a PE points to offset 0xF8, where the bytes 50 45 00 00 begin. What do those four bytes spell?', hint: 'follows "MZ" deeper into the file', flag: 'BV{pe}' },
        { scenario: "pefile reports a section named .text with entropy 7.81, well above the ~6.5 ceiling for normal compiled code. What single English word describes a section this dense with disorder?", hint: 'the word forensic analysts use for "probably compressed or encrypted"', flag: 'BV{packed}' },
        { scenario: 'readelf -h reports e_type = 2 for sample.elf. What ELF type constant name corresponds to value 2?', hint: 'ET_ prefix, then the type', flag: 'BV{et_exec}' },
        { scenario: 'A PE file is missing its .reloc section, meaning it can only load correctly at one fixed base address. What OS exploit-mitigation feature does this absence disable for the image?', hint: 'randomizes load addresses each run', flag: 'BV{aslr}' },
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
      challenges: [
        { scenario: "MalwareBazaar returns a match for a queried SHA-256: family 'Emotet', tags 'loader, macro-dropper', first seen 2024-02-15. Submit the family name, lowercase.", hint: 'a long-running banking-trojan-turned-loader family', flag: 'BV{emotet}' },
        { scenario: 'FLOSS decodes 7 strings from a sample, every one prefixed [XOR 0x22], including the C2 URL http://185.220.101.47/update/check. Submit the single-byte XOR key as 2 lowercase hex digits, no 0x prefix.', hint: 'literally printed next to every decoded string', flag: 'BV{22}' },
        { scenario: 'pefile reports .text section entropy of 7.81 against a packed-vs-clean threshold of 7.2. Is this sample packed? Answer yes or no.', hint: 'compare 7.81 to 7.2', flag: 'BV{yes}' },
        { scenario: 'capa maps a capability to ATT&CK technique T1547.001 (registry run key). What parent ATT&CK tactic does T1547.001 belong to?', hint: 'surviving reboot/logoff', flag: 'BV{persistence}' },
        { scenario: 'ImpHash (MD5 of the sorted import table) is identical between two samples that look completely different on the surface. What does a shared ImpHash strongly suggest about their relationship?', hint: 'ImpHash is stable across recompiles of the same source', flag: 'BV{same_codebase}' },
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
      challenges: [
        { scenario: "Ghidra's auto-analysis on crackme2 finds decode_license at 0x00401136. A local variable used as a single-byte XOR key is renamed from local_18 to xor_key. Checking XREFs to the constant, what hex value is that key?", hint: "renamed variable's literal value, shown in the XREF list", flag: 'BV{0x5a}' },
        { scenario: 'The XOR loop at 0x401158-0x40117E decodes 24 bytes of a license string in .rdata using key 0x5A. After running the decode in Ghidra\'s Python console, what license string is produced? (lowercase, hyphens to underscores)', hint: 'matches an expected license format, confirmed by the crackme', flag: 'BV{bvlt_2024_gold_elite}' },
        { scenario: 'Ghidra labels every unnamed function FUN_00401234 until a human renames it. What single habit keeps you oriented while reverse engineering a large, unfamiliar binary?', hint: 'do it as you discover each function, not at the end', flag: 'BV{rename_as_you_go}' },
        { scenario: 'A function calls GetProcAddress with a string argument that never appears anywhere in the IAT. Where does that string still show up, letting you trace the resolve-then-call chain manually?', hint: 'it has to exist as plaintext data somewhere in the binary', flag: 'BV{strings_output}' },
        { scenario: 'BSim compares function bytecode using locality-sensitive hashing to identify statically-linked library code (OpenSSL, zlib) versus the malware\'s unique logic. What is this Ghidra feature called?', hint: 'the name of the Ghidra plugin itself', flag: 'BV{bsim}' },
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
      challenges: [
        { scenario: 'strace -f -e trace=network,file,process ./sample shows an openat() call creating /tmp/.x1729 with mode 0755, followed by a connect() to 185.220.101.47:443. Submit the dropped file\'s full path as the flag, slashes replaced with underscores (e.g. tmp_x1729).', hint: 'drop the leading slash too', flag: 'BV{tmp_x1729}' },
        { scenario: 'ltrace reveals a strcmp() call comparing user input against a literal password string in plaintext — strace alone would miss this entirely. What category of calls does ltrace trace that strace does not?', hint: 'not system calls — the other kind', flag: 'BV{library_calls}' },
        { scenario: 'A sample does absolutely nothing when run inside a VM but behaves normally on bare metal. What general capability caused this?', hint: 'checks for VM artifacts before acting', flag: 'BV{sandbox_evasion}' },
        { scenario: 'Fakenet-NG simulates HTTP, DNS, FTP, and SMTP services so a sample believes it has internet access. What does this let an analyst capture without any real C2 infrastructure involved?', hint: "it's literally in the tool's purpose", flag: 'BV{network_traffic}' },
        { scenario: 'A CreateProcess call uses CREATE_SUSPENDED, followed by WriteProcessMemory and ResumeThread. Name this classic process-injection technique.', hint: 'the target process is "hollowed" out first', flag: 'BV{process_hollowing}' },
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
      challenges: [
        { scenario: "strings packed.exe reveals the literal text 'UPX 3.96' and the marker UPX!. Submit the packer name and version as the flag, lowercase, spaces/dots as underscores.", hint: 'name_major_minor', flag: 'BV{upx_3_96}' },
        { scenario: 'Whole-file entropy on packed.exe measures 7.82, above the 7.2 packed/clean threshold. After upx -d, what specific PE field does "unpacking" restore execution control to?', hint: 'three-letter acronym, the unpacked entry point', flag: 'BV{oep}' },
        { scenario: "After dumping a hollowed process at OEP, every import-table entry is a resolved address rather than the original thunk — the dump won't run as-is. What process, automated by Scylla, fixes this?", hint: 'rebuilds the import directory', flag: 'BV{iat_reconstruction}' },
        { scenario: 'After "unpacking" a sample, .text entropy is still 7.7 — far above clean-code levels. What does a second high-entropy layer after the first unpack usually indicate?', hint: 'one packer wrapped inside another, encrypting layer', flag: 'BV{second_stage_crypter}' },
        { scenario: 'pe-sieve scans live processes for PE anomalies and dumps suspicious ones automatically, named <pid>_<base>_<type>.exe. What category of technique is pe-sieve specifically built to catch — payloads that never touch disk?', hint: 'code placed into another process\'s memory', flag: 'BV{process_injection}' },
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
      challenges: [
        { scenario: 'windows.pslist shows PID 2448 svchost.exe with PPID 1832, also svchost.exe — anomalous for that process name. windows.malfind on PID 2448 finds a PAGE_EXECUTE_READWRITE region containing an MZ header. Submit the PID hosting the injected PE.', hint: 'the duplicate-looking svchost from pslist', flag: 'BV{2448}' },
        { scenario: 'windows.netscan on the same image shows PID 2448 with an ESTABLISHED connection to 185.220.101.47:443. What plugin recovered this, even though the connection object normally only persists transiently in memory?', hint: 'name of the Volatility 3 plugin itself', flag: 'BV{netscan}' },
        { scenario: 'pslist walks the EPROCESS doubly-linked list and misses a process that unlinked itself. What plugin scans raw memory pool tags instead of following pointers, defeating this kind of hiding?', hint: 'sibling plugin to pslist, scan-based', flag: 'BV{psscan}' },
        { scenario: 'malfind flags a VAD region as Type: Private, Tag: VadS — anonymous memory, not backed by any file on disk. What does an MZ header inside such a region strongly indicate?', hint: 'a full executable living somewhere it shouldn\'t', flag: 'BV{injected_pe}' },
        { scenario: 'A Cobalt Strike beacon in memory shows a named-pipe pattern \\\\.\\pipe\\MSSE-*-server combined with a sleep_mask XOR pattern. What\'s this overall detection approach called — matching known byte/structure patterns of a specific toolkit?', hint: 'fingerprinting the beacon\'s own configuration bytes', flag: 'BV{beacon_config_signature}' },
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
      challenges: [
        { scenario: 'tshark extracts JA3 hash 72a7c4d879f23a2c3d643ee09e1dce61 from every TLS ClientHello to 185.220.101.47. This exact hash is a known default fingerprint for which C2 toolkit (two words, underscore)?', hint: 'a very common red-team/post-exploitation framework', flag: 'BV{cobalt_strike}' },
        { scenario: 'Inter-arrival times between connections to 185.220.101.47 cluster tightly around 60.09 seconds with only 0.19s standard deviation. What attacker behavior produces this kind of regular, low-jitter timing?', hint: 'C2 check-ins on a fixed sleep timer', flag: 'BV{beaconing}' },
        { scenario: 'DNS queries show 24-character hex subdomain labels under exfil-tunnel.xyz, a different label every query. What technique uses DNS queries themselves as a covert exfiltration channel?', hint: 'data smuggled inside the queries, not the responses', flag: 'BV{dns_tunneling}' },
        { scenario: 'Wireshark\'s File > Export Objects > HTTP recovers a PE32+ DLL carved directly out of an HTTP response stream — no disk write ever occurred on the wire. What artifact type was carved?', hint: 'a runnable Windows binary', flag: 'BV{executable}' },
        { scenario: "Even though a session is fully TLS-encrypted, JA3, JA3S, certificate metadata, and byte-length timing patterns remain analyzable. What's this general analysis approach called when you can't decrypt the payload itself?", hint: 'analyzing traffic you cannot decrypt', flag: 'BV{encrypted_traffic_analysis}' },
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
      challenges: [
        { scenario: 'Every captured C2 frame begins with the same two-byte sequence BE EF before any length or opcode field. What\'s the general term for this kind of fixed identifying prefix?', hint: 'two words, "magic ___"', flag: 'BV{magic_bytes}' },
        { scenario: 'Frame structure analysis determines: 2 bytes magic, 2 bytes big-endian length, 1 byte opcode, then payload. Opcode 0x01 carries hostname/PID data on check-in. What\'s this opcode 0x01 traffic category called?', hint: 'same term used for periodic C2 check-ins', flag: 'BV{beacon}' },
        { scenario: 'XORing a known plaintext command string "whoami" against its corresponding ciphertext bytes recovers a key. What\'s the general cryptanalysis technique called when you XOR known plaintext against ciphertext to recover a key or keystream?', hint: 'you already know part of the plaintext going in', flag: 'BV{known_plaintext_attack}' },
        { scenario: 'Testing shows the recovered key applies only to opcode 0x03 frames (EXFIL), while BEACON and EXEC frames are sent in plaintext. Submit the single-byte key as 2 lowercase hex digits, no 0x prefix.', hint: 'same byte that decoded the credential dump frame', flag: 'BV{5a}' },
        { scenario: 'Scapy lets you define a custom protocol as a Python class with explicit field definitions, handling endianness and checksums automatically. What\'s the general term for parsing raw bytes into a structured representation using a schema like this?', hint: 'breaking a byte stream into named fields', flag: 'BV{protocol_parsing}' },
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
      challenges: [
        { scenario: 'reg query finds a value named "WindowsSecurityHealth" under HKCU\\...\\CurrentVersion\\Run pointing to C:\\ProgramData\\MicrosoftUpdate\\svchost32.exe — a path matching no legitimate Windows directory. What Windows Event ID logs the creation of this kind of service via Service Control Manager?', hint: 'logged to the System log, four digits', flag: 'BV{7045}' },
        { scenario: 'MFT analysis on svchost32.exe shows $STANDARD_INFORMATION creation dated 14 months before $FILE_NAME creation. Submit the name of this anti-forensic technique.', hint: 'manipulating file timestamps to mislead investigators', flag: 'BV{timestomping}' },
        { scenario: 'vol3 windows.ssdt finds NtQuerySystemInformation and NtOpenKey pointing to addresses outside ntoskrnl.exe/win32k.sys — both expected to live in the kernel image. What\'s this kernel-level interception technique called?', hint: 'two words, table-based kernel hooking', flag: 'BV{ssdt_hook}' },
        { scenario: 'A WMI subscription combining __EventFilter, __EventConsumer, and __FilterToConsumerBinding survives reboots and is invisible to tasklist or services.msc. Where is this subscription\'s data physically stored on disk?', hint: 'under C:\\Windows\\System32\\wbem\\', flag: 'BV{wbem_repository}' },
        { scenario: 'Event ID 1102 appears in the Security log right before all other suspicious entries disappear. What did the attacker do?', hint: 'wiping the evidence trail itself', flag: 'BV{cleared_security_log}' },
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
      challenges: [
        { scenario: 'Correlating evidence: phishing delivered 02:58, macro execution 03:01, first C2 beacon 03:02, lateral movement begins 03:11, ransomware encryption completes 03:22. Submit the total dwell time in minutes from delivery to encryption complete, as a plain number.', hint: '03:22 minus 02:58', flag: 'BV{24}' },
        { scenario: 'A phishing sender domain is miicrosof-t.com, mimicking a trusted brand by inserting one extra letter. What\'s the name for this domain-spoofing technique?', hint: 'visually-similar fake domains', flag: 'BV{typosquatting}' },
        { scenario: 'vssadmin.exe delete shadows /all /quiet runs immediately before ransomware deployment via PsExec. What is the attacker trying to prevent by destroying volume shadow copies?', hint: 'the built-in Windows recovery mechanism', flag: 'BV{system_restore}' },
        { scenario: 'The full kill chain maps to ATT&CK: T1566.001 (initial access), T1059.001 (execution), T1547.001 (persistence), T1490 (data destruction/recovery inhibition). What MITRE ATT&CK tactic name covers T1490 specifically?', hint: 'the final stage of the kill chain', flag: 'BV{impact}' },
        { scenario: 'An IR report packages every IP, domain, hash, and registry key from this investigation into a standard sharing format for other defenders. Name that standard (initialism, version 2.1).', hint: 'Structured Threat Information eXpression', flag: 'BV{stix}' },
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

<svelte:head><title>Challenges — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>CHALLENGES</span>
  <div class="ts-right">
    <button class="mode-btn" class:active={mode==='read'} on:click={() => mode='read'}>BRIEFING</button>
    <button class="mode-btn" class:active={mode==='challenges'} on:click={() => { mode='challenges'; loadSolved(); }}>FLAGS</button>
  </div>
</div>

{#if mode === 'challenges'}
  <div class="drill-layout">
    <nav class="phase-nav">
      {#each PHASES as p}
        <button
          class="pn-item"
          class:active={p.id === selectedId}
          on:click={() => goto(base + '/console/study?phase='+p.id)}
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
          <span class="dp-card">Flag {challengeIdx + 1} / {challengeTotal}</span>
          <span class="dp-got">✓ {solved.size} captured</span>
        </div>
        <div class="drill-bar">
          <div class="drill-bar-fill" style="width:{challengeTotal ? Math.round((solved.size/challengeTotal)*100) : 0}%"></div>
        </div>
      </div>

      {#if challenge}
        <div class="scn-wrap">
          <div class="scn-card" class:scn-solved={solved.has(challengeIdx)}>
            <div class="scn-label">SCENARIO</div>
            <p class="scn-text">{challenge.scenario}</p>

            {#if solved.has(challengeIdx)}
              <div class="scn-flag-captured">
                <span class="fc-icon">✓</span>
                <code>{challenge.flag}</code>
                <span class="fc-tag">CAPTURED</span>
              </div>
            {:else}
              <form class="scn-form" on:submit|preventDefault={submitFlag}>
                <input
                  class="flag-input"
                  type="text"
                  placeholder={'BV{...}'}
                  bind:value={flagInput}
                  autocomplete="off"
                  spellcheck="false"
                />
                <button class="flag-submit" type="submit">Submit</button>
              </form>
              {#if feedback === 'wrong'}
                <div class="scn-feedback fb-wrong">✗ Incorrect — try again.</div>
              {/if}
              <button class="hint-toggle" on:click={() => showHint = !showHint}>
                {showHint ? '▼ Hide hint' : '▶ Show hint'}
              </button>
              {#if showHint}
                <div class="scn-hint">{challenge.hint}</div>
              {/if}
            {/if}
          </div>

          <div class="drill-actions">
            <button class="da-btn da-prev" on:click={prevChallenge_} title="Previous">←</button>
            <button class="da-btn da-next" on:click={nextChallenge_} title="Next">→</button>
          </div>

          <div class="drill-deck-row">
            {#each challenges as _, i}
              <button
                class="deck-dot"
                class:dot-current={i === challengeIdx}
                class:dot-got={solved.has(i)}
                on:click={() => gotoChallenge(i)}
                aria-label="Go to flag {i+1}"
              ></button>
            {/each}
          </div>
        </div>

        {#if allSolved && !chalMode}
          <div class="all-done-banner">
            <span class="adb-icon">★</span>
            All {challengeTotal} flags captured! Ready for the command drill?
            <button class="adb-cta" on:click={startChallenge}>Command Drill →</button>
          </div>
        {:else if !chalMode && challengeTotal > 0 && content?.commands?.length >= 2}
          <button class="challenge-start-btn" on:click={startChallenge}>
            Switch to Command Drill ({content.commands.length} questions)
          </button>
        {/if}

        {#if chalMode}
          <div class="challenge-wrap">
            <div class="chal-header">
              <span class="chal-title">COMMAND DRILL</span>
              <span class="chal-prog">{Math.min(chalIdx + 1, challengeQs.length)} / {challengeQs.length}</span>
              <button class="chal-exit" on:click={() => chalMode = false}>← Back to Flags</button>
            </div>

            {#if chalIdx < challengeQs.length}
              {@const q = challengeQs[chalIdx]}
              <div class="chal-card">
                <div class="chal-q-label">What command does this?</div>
                <div class="chal-q-note">{q.note}</div>
                <div class="chal-opts">
                  {#each q.opts as opt}
                    {@const isCorrect = opt === q.answer}
                    {@const isSelected = opt === chalSelected}
                    <button
                      class="chal-opt"
                      class:opt-correct={chalAnswered && isCorrect}
                      class:opt-wrong={chalAnswered && isSelected && !isCorrect}
                      class:opt-dim={chalAnswered && !isSelected && !isCorrect}
                      on:click={() => pickAnswer(opt)}
                      disabled={chalAnswered}
                    >
                      <code>{opt}</code>
                    </button>
                  {/each}
                </div>
                {#if chalAnswered}
                  <div class="chal-feedback" class:fb-correct={chalSelected === q.answer} class:fb-wrong={chalSelected !== q.answer}>
                    {chalSelected === q.answer ? '✓ Correct!' : '✗ Wrong — correct: ' + q.answer}
                  </div>
                  <button class="chal-next" on:click={nextChallenge}>
                    {chalIdx + 1 < challengeQs.length ? 'Next Question →' : 'See Results'}
                  </button>
                {/if}
              </div>
            {:else}
              <div class="chal-results">
                <div class="cr-score">{chalScore}/{chalTotal}</div>
                <div class="cr-label">{chalScore === chalTotal ? 'Perfect score!' : chalScore >= chalTotal * .7 ? 'Good work!' : 'Keep practicing.'}</div>
                <div class="cr-actions">
                  <button class="cr-btn" on:click={startChallenge}>Retry Drill</button>
                  <button class="cr-btn cr-back" on:click={() => chalMode = false}>Back to Flags</button>
                </div>
              </div>
            {/if}
          </div>
        {/if}

      {:else}
        <div class="drill-empty">No flags for this phase yet.</div>
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
        on:click={() => goto(base + '/console/study?phase='+p.id)}
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
        <a href="{base}/console/study?phase={selectedId}" class="briefing-cta" on:click={() => { mode='challenges'; loadSolved(); }}>
          ▶ {content.challenges?.length ?? 0} flag challenges waiting — start capturing →
        </a>
      </div>

      <div class="sc-section">
        <h2 class="sc-h2">Command Reference</h2>
        <div class="cmd-list">
          {#each content.commands as c}
            <button
              class="cmd-item"
              on:click={async () => { await navigator.clipboard.writeText(c.cmd); }}
              title="Click to copy"
            >
              <code class="cmd-code">{c.cmd}</code>
              <span class="cmd-note">{c.note}</span>
              <span class="cmd-copy-icon">⎘</span>
            </button>
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
        <a href="{base}/console/range" class="btn-primary" style="display:inline-block;margin-top:24px">
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
  .drill-bar { height: 3px; background: var(--line2); border-radius: 2px; overflow: hidden; }
  .drill-bar-fill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .4s ease; }

  .scn-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    max-width: 600px; margin: 0 auto;
  }

  .scn-card {
    width: 100%; background: var(--panel); border: 1px solid var(--line2);
    border-radius: 10px; padding: 26px 30px;
    transition: border-color .2s;
  }
  .scn-card.scn-solved { border-color: color-mix(in srgb,var(--volt) 40%,transparent); background: color-mix(in srgb,var(--volt) 4%,var(--panel)); }
  .scn-label { font-size: 9px; font-weight: 700; letter-spacing: .12em; color: var(--dim); text-transform: uppercase; margin-bottom: 12px; }
  .scn-text { font-size: 14px; color: var(--bone); line-height: 1.7; margin-bottom: 18px; }

  .scn-flag-captured {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    font-family: var(--mono); font-size: 13px; color: var(--volt);
  }
  .fc-icon { font-weight: 700; }
  .scn-flag-captured code { background: var(--panel3); padding: 4px 10px; border-radius: 4px; }
  .fc-tag { font-size: 9px; letter-spacing: .1em; color: var(--dim); margin-left: auto; }

  .scn-form { display: flex; gap: 8px; }
  .flag-input {
    flex: 1; font-family: var(--mono); font-size: 13px; color: var(--bone);
    background: var(--panel3); border: 1px solid var(--line2); border-radius: var(--rad);
    padding: 10px 14px; outline: none; transition: border-color .15s;
  }
  .flag-input:focus { border-color: var(--volt); }
  .flag-submit {
    font-size: 12px; font-weight: 700; padding: 10px 18px;
    background: var(--volt); color: var(--void); border: none; border-radius: var(--rad);
    cursor: pointer;
  }
  .scn-feedback { margin-top: 10px; font-size: 12px; font-weight: 700; }
  .scn-feedback.fb-wrong { color: var(--blood); }

  .hint-toggle {
    margin-top: 14px; font-size: 11px; color: var(--dim); background: none; border: none;
    cursor: pointer; padding: 0;
  }
  .hint-toggle:hover { color: var(--ash); }
  .scn-hint { margin-top: 8px; font-size: 12px; color: var(--amber); line-height: 1.6; }

  .drill-actions { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .da-btn {
    font-size: 12px; font-weight: 700;
    padding: 8px 18px; border-radius: var(--rad); cursor: pointer;
    border: 1px solid var(--line2); background: transparent; color: var(--ash);
    transition: all .15s; min-height: 40px;
  }
  .da-btn:hover { border-color: var(--ash); color: var(--bone); }

  .drill-deck-row { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
  .deck-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--line2); background: transparent; cursor: pointer;
    padding: 0; transition: background .15s, border-color .15s;
  }
  .deck-dot.dot-current  { border-color: var(--bone);  background: var(--bone); }
  .deck-dot.dot-got      { border-color: var(--volt);  background: var(--volt); }

  .drill-empty { color: var(--ash); padding: 40px; text-align: center; }

  .all-done-banner {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 25%, transparent);
    border-radius: var(--rad); padding: 14px 18px;
    font-size: 13px; color: var(--volt); font-weight: 600;
    max-width: 600px; margin: 0 auto;
  }
  .adb-icon { font-size: 18px; }
  .adb-cta {
    margin-left: auto; background: var(--volt); color: var(--void);
    border: none; border-radius: 4px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; cursor: pointer;
  }

  .challenge-start-btn {
    display: block; margin: 0 auto;
    background: transparent; border: 1px solid var(--line2); color: var(--ash);
    border-radius: var(--rad); padding: 8px 16px; font-size: 12px; cursor: pointer;
    transition: all .15s;
  }
  .challenge-start-btn:hover { border-color: var(--blue); color: var(--blue); }

  .challenge-wrap {
    max-width: 600px; margin: 0 auto;
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .chal-header {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 18px; background: var(--panel2);
    border-bottom: 1px solid var(--line);
    flex-wrap: wrap;
  }
  .chal-title { font-size: 10px; font-weight: 700; color: var(--volt); letter-spacing: .1em; }
  .chal-prog  { font-family: var(--mono); font-size: 11px; color: var(--ash); }
  .chal-exit  { margin-left: auto; font-size: 11px; color: var(--ash); background: none; border: none; cursor: pointer; }
  .chal-exit:hover { color: var(--volt); }

  .chal-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .chal-q-label { font-size: 10px; font-weight: 700; color: var(--dim); letter-spacing: .1em; text-transform: uppercase; }
  .chal-q-note  { font-size: 14px; color: var(--bone); line-height: 1.5; }

  .chal-opts { display: flex; flex-direction: column; gap: 6px; }
  .chal-opt {
    padding: 10px 14px; border-radius: var(--rad); cursor: pointer;
    background: var(--panel2); border: 1px solid var(--line2); text-align: left;
    transition: border-color .15s, background .15s;
  }
  .chal-opt:not(:disabled):hover { border-color: var(--blue); }
  .chal-opt code { font-family: var(--mono); font-size: 11px; color: var(--ash); }
  .chal-opt.opt-correct { border-color: var(--volt); background: color-mix(in srgb,var(--volt) 8%,transparent); }
  .chal-opt.opt-correct code { color: var(--volt); }
  .chal-opt.opt-wrong   { border-color: var(--blood); background: color-mix(in srgb,var(--blood) 8%,transparent); }
  .chal-opt.opt-wrong code  { color: var(--blood); }
  .chal-opt.opt-dim code    { color: var(--dim); }

  .chal-feedback {
    font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 4px;
  }
  .chal-feedback.fb-correct { color: var(--volt); background: color-mix(in srgb,var(--volt) 8%,transparent); }
  .chal-feedback.fb-wrong   { color: var(--blood); background: color-mix(in srgb,var(--blood) 8%,transparent); }
  .chal-next {
    align-self: flex-end; padding: 8px 18px; border-radius: var(--rad);
    background: var(--volt); color: var(--void); border: none; font-weight: 700;
    font-size: 12px; cursor: pointer;
  }

  .chal-results {
    padding: 32px 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .cr-score { font-size: 48px; font-weight: 700; color: var(--volt); font-family: var(--mono); }
  .cr-label { font-size: 14px; color: var(--ash); }
  .cr-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
  .cr-btn {
    padding: 8px 18px; border-radius: var(--rad);
    background: color-mix(in srgb,var(--volt) 12%,transparent);
    border: 1px solid color-mix(in srgb,var(--volt) 28%,transparent);
    color: var(--volt); font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .cr-back { background: transparent; border-color: var(--line2); color: var(--ash); }

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

  .briefing-cta {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
    font-size: 13px; font-weight: 700; color: var(--volt);
  }
  .briefing-cta:hover { text-decoration: underline; }

  .cmd-list { display: flex; flex-direction: column; gap: 6px; }
  .cmd-item {
    display: flex; flex-direction: column; gap: 4px;
    padding: 10px 14px; background: var(--panel3); border-radius: var(--rad); border: 1px solid var(--line);
    cursor: pointer; text-align: left; position: relative; width: 100%;
    transition: border-color .15s;
  }
  .cmd-item:hover { border-color: var(--volt); }
  .cmd-copy-icon {
    position: absolute; top: 8px; right: 10px;
    font-size: 12px; color: var(--dim); opacity: 0; transition: opacity .15s;
  }
  .cmd-item:hover .cmd-copy-icon { opacity: 1; color: var(--volt); }
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
