<script>
  const TOOLS = [
    { cat: 'Memory Forensics', color: 'volt', items: [
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.pslist', desc:'Process listing from memory image' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.malfind', desc:'Find injected code / RWX regions' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.netscan', desc:'Active and historical network connections' },
      { name:'Volatility 3', cmd:'vol3 -f mem.raw windows.cmdline', desc:'Command-line arguments per process' },
    ]},
    { cat: 'Disk Forensics', color: 'amber', items: [
      { name:'Sleuth Kit', cmd:'mmls disk.img', desc:'Partition table (offset in sectors)' },
      { name:'Sleuth Kit', cmd:'fls -o 2048 disk.img', desc:'File listing (deleted files marked *)' },
      { name:'Sleuth Kit', cmd:'icat -o 2048 disk.img 14', desc:'Recover inode 14 contents' },
      { name:'xxd', cmd:'xxd disk.img | head -32', desc:'Hex dump — MBR magic check' },
    ]},
    { cat: 'Network Forensics', color: 'blue', items: [
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'dns' -T fields -e dns.qry.name", desc:'Extract all DNS queries' },
      { name:'tshark', cmd:"tshark -r cap.pcap -Y 'tcp.flags.syn==1' -T fields -e ip.dst", desc:'SYN scan targets' },
      { name:'tcpdump', cmd:"tcpdump -nr cap.pcap 'tcp[tcpflags] & tcp-syn != 0'", desc:'SYN packets only' },
      { name:'NetworkMiner', cmd:'NetworkMiner.exe -r cap.pcap', desc:'Extract files and credentials from pcap' },
    ]},
    { cat: 'Static Analysis', color: 'volt', items: [
      { name:'strings', cmd:'strings -n6 sample.exe | grep -E "http|cmd|powershell"', desc:'Printable strings filter' },
      { name:'FLOSS', cmd:'floss sample.exe', desc:'Decoded/obfuscated strings + stack strings' },
      { name:'capa', cmd:'capa sample.exe', desc:'MITRE ATT&CK capability map' },
      { name:'YARA', cmd:'yara rule.yar sample.exe', desc:'Pattern match against custom/community rules' },
    ]},
    { cat: 'Reverse Engineering', color: 'volt', items: [
      { name:'Ghidra', cmd:'analyzeHeadless . proj -import sample.exe -postScript PrintAST.java', desc:'Headless analysis' },
      { name:'radare2', cmd:'r2 -A sample.exe; afl; s main; pdf', desc:'Analysis + function listing + disasm' },
      { name:'objdump', cmd:'objdump -d -M intel sample.elf | less', desc:'AT&T→Intel syntax disassembly' },
      { name:'readelf', cmd:'readelf -a sample.elf', desc:'ELF headers, sections, symbols, dynamic' },
    ]},
    { cat: 'Dynamic Analysis', color: 'blood', items: [
      { name:'strace', cmd:'strace -f -e trace=network ./sample', desc:'Network syscalls only' },
      { name:'strace', cmd:'strace -f -o trace.log ./sample', desc:'Full syscall log to file' },
      { name:'gdb', cmd:'gdb ./sample; break main; run; stepi', desc:'Step through from main' },
      { name:'ltrace', cmd:'ltrace ./sample letmein', desc:'Library call trace (visible strcmp args)' },
    ]},
    { cat: 'Unpacking', color: 'blood', items: [
      { name:'upx', cmd:'upx -d packed.exe -o unpacked.exe', desc:'UPX decompress' },
      { name:'strings', cmd:'strings unpacked.exe | grep BV', desc:'Visible strings post-unpack' },
      { name:'PEiD / Detect-It-Easy', cmd:'die sample.exe', desc:'Packer/compiler identification' },
      { name:'entropy', cmd:"python3 -c \"import math,collections; d=open('s.exe','rb').read(); p={b:d.count(b)/len(d) for b in set(d)}; print(-sum(p[b]*math.log2(p[b]) for b in p))\"", desc:'Entropy check (>7.2 = packed)' },
    ]},
    { cat: 'Credential & Hash', color: 'amber', items: [
      { name:'hashcat', cmd:'hashcat -m 0 -a 0 hashes.txt wordlist.txt', desc:'MD5 dictionary attack' },
      { name:'john', cmd:'john --format=raw-md5 --wordlist=wordlist.txt hashes.txt', desc:'MD5 with john-jumbo' },
      { name:'mimikatz', cmd:'sekurlsa::logonpasswords', desc:'Dump LSASS credentials (test/lab only)' },
      { name:'impacket', cmd:'secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL', desc:'Offline NTDS extract' },
    ]},
  ];

  let search = '';
  $: filtered = TOOLS.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.cmd.toLowerCase().includes(search.toLowerCase()) ||
      i.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  function copy(cmd) {
    navigator.clipboard?.writeText(cmd);
  }
</script>

<svelte:head><title>Arsenal — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>TOOL ARSENAL</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>Tool Arsenal</h1>
    <p>Command reference for every tool used across the BLACKVAULT curriculum. Click any command to copy.</p>
    <input class="search-input" bind:value={search} placeholder="Search tools and commands…" type="search" />
  </div>

  {#each filtered as cat}
    <section class="tool-section">
      <h2 class="ts-hd">
        <span class="ts-dot ts-{cat.color}"></span>
        {cat.cat}
      </h2>
      <div class="tool-grid">
        {#each cat.items as item}
          <button class="tool-card" on:click={() => copy(item.cmd)} title="Click to copy">
            <div class="tc-name">{item.name}</div>
            <code class="tc-cmd">{item.cmd}</code>
            <div class="tc-desc">{item.desc}</div>
          </button>
        {/each}
      </div>
    </section>
  {/each}
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    z-index: 10;
  }
  .page { padding: 28px; flex: 1; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 32px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .search-input {
    width: 100%; max-width: 440px;
    background: var(--panel2); border: 1px solid var(--line2);
    color: var(--bone); padding: 9px 14px; border-radius: var(--rad);
    font-family: var(--font); font-size: 13px; outline: none;
  }
  .search-input:focus { border-color: var(--volt); }

  .tool-section { margin-bottom: 32px; }
  .ts-hd {
    font-size: 13px; font-weight: 700; color: var(--bone);
    letter-spacing: .08em; text-transform: uppercase;
    margin-bottom: 12px; display: flex; align-items: center; gap: 10px;
  }
  .ts-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .ts-volt  { background: var(--volt); }
  .ts-amber { background: var(--amber); }
  .ts-blood { background: var(--blood); }
  .ts-blue  { background: var(--blue); }

  .tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .tool-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 14px 16px;
    text-align: left; cursor: copy;
    transition: border-color .15s, background .15s;
    width: 100%;
  }
  .tool-card:hover { border-color: var(--volt); background: var(--panel2); }
  .tc-name { font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: .06em; margin-bottom: 6px; }
  .tc-cmd { display: block; font-size: 12px; color: var(--volt); font-family: var(--mono); margin-bottom: 6px; word-break: break-all; }
  .tc-desc { font-size: 12px; color: var(--dim); }

  @media (max-width: 800px) { .tool-grid { grid-template-columns: 1fr; } }
</style>
