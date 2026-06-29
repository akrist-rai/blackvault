# 💾 Phase 1 — Disk & File Systems

**Track:** Digital Forensics · **Prereqs:** None (foundational phase) · **Feeds:** Phase 8 (same structures in RAM), Phase 11 (MFT artifacts), Phase 12 (disk evidence in the capstone)
**Your artifact:** `range/disk/disk.img` — a 7 MB DOS-partitioned image with two partitions: ext4 (Partition 1, offset 2048) and FAT32 (Partition 2). A file was deleted from the ext4 partition — recover it.

> **The whole phase in one sentence:** a file system is the agreed map saying which bytes belong to which file — and forensics lives *below* that map, where deleted and hidden data still sit unchanged until the OS reuses them.

---

## 0 · The single idea everything here rests on

When a file is "deleted," the OS makes three changes: it removes the directory entry (the filename-to-inode link), marks the inode as free, and marks the data blocks as reusable. It does **not** overwrite the content. Until those blocks are actually reused, the full file — metadata plus bytes — is recoverable. This is why forensic imaging must happen before continued use, and why "delete" is never "erase" without explicit secure-wipe tooling.

Internalize this and disk recovery, anti-forensics, secure delete, and the purpose of file carving all follow immediately.

---

## 1 · Topics to learn

Tick these off when you can *do* them, not just recognize them.

### 1.1 Partition tables and disk geometry
- [ ] **MBR (Master Boot Record)** — 512-byte boot sector, holds the partition table for up to 4 primary partitions. Max addressable capacity ≈ 2 TiB with 32-bit LBA × 512-byte sectors.
- [ ] **GPT (GUID Partition Table)** — GUID-based, paired with UEFI, primary + backup headers at disk start/end. Up to 128 partitions by default, no practical size ceiling on modern hardware.
- [ ] **Sector offsets** — Every partition starts at a sector offset (e.g. 2048 × 512 = 1 MiB from disk start). Every Sleuth Kit command needs this offset to address the right filesystem.
- [ ] **Reading raw partition structures** — `xxd -l 512 disk.img` to see the MBR; partition entries start at byte 446.

### 1.2 Filesystem internals — ext4
- [ ] **Inodes** — each file has one inode holding metadata (permissions, timestamps, size) and pointers to data blocks. The filename lives in the directory entry, not the inode. `rm` unlinks the name; the inode lingers until reused.
- [ ] **Superblock and block groups** — ext4 divides the partition into block groups; the superblock tracks global filesystem state. A corrupt superblock can be replaced from a backup copy.
- [ ] **Extent trees** — ext4 uses extent trees (not simple block pointers) to describe where a file's data lives on disk. Knowing this helps you understand what `istat` reports.
- [ ] **Journal (`journal_inum`)** — ext4 journals metadata changes for crash recovery. The journal is a forensics artifact in its own right — it may hold remnants of recently-deleted metadata.

### 1.3 Filesystem internals — NTFS (awareness)
- [ ] **$MFT** — Master File Table: one 1 KB record per file, resident data for small files, non-resident runs for large ones. A "deleted" file's MFT record is simply flagged "not in use" — the record itself persists.
- [ ] **$STANDARD_INFORMATION vs $FILE_NAME timestamps** — $SI is what Windows Explorer shows; $FN is kernel-maintained and harder to fake. Mismatch = likely timestomping (Phase 11).
- [ ] **$Bitmap and $LogFile** — $Bitmap tracks allocated clusters; $LogFile is the journal. The USN change journal ($UsnJrnl:$J) records every file create/modify/delete — a gold mine for timelines.
- [ ] **Alternate Data Streams (ADS)** — NTFS allows files to carry hidden named streams (file.exe:hidden). Often abused for data hiding.

### 1.4 Deleted data recovery and carving
- [ ] **Why unallocated space matters** — deleted content in unallocated space persists until blocks are reused. This is the target for carving.
- [ ] **Inode recovery** — when a deleted inode is still intact, `icat` can extract the content directly.
- [ ] **File carving by signature** — `photorec` and `foremost` scan raw bytes for magic headers/footers (MZ, PNG, ZIP, JPEG) to recover files with no file system map. Works even on highly fragmented images.
- [ ] **File slack** — the tail of a file's last cluster may contain remnants of the previous file that occupied that cluster.

### 1.5 Timestamps and timelines
- [ ] **MACB timestamps** — Modified, Accessed, Changed (metadata), Born (created). Different tools report different subsets; different filesystems provide different guarantees.
- [ ] **Filesystem timeline** — `fls -r -m / disk.img` produces a body file; `mactime` turns it into a sorted timeline. Used in Phase 12 to establish when events happened.
- [ ] **Anti-forensic timestamp manipulation** — `touch -t` on Linux; `SetFileTime` on Windows. Which attribute it modifies depends on the tool and access level (Phase 11).

---

## 2 · The artifact — `range/disk/disk.img`

```
range/disk/disk.img    7 MB DOS-partitioned image
  Partition 1: ext4   offset 2048 sectors (2048 × 512 = 1,048,576 bytes)
    Normal file: readme.txt
    Deleted file: secret.txt   (inode 14 — still recoverable)
  Partition 2: FAT32  offset (check mmls output)
```

### Lab walkthrough

```bash
# 1. Identify the partition layout
mmls range/disk/disk.img

# 2. List all files at the ext4 partition (use offset from mmls)
fls -o 2048 range/disk/disk.img

# 3. List with deleted files shown explicitly
fls -o 2048 -d range/disk/disk.img    # -d shows deleted entries

# 4. Get inode metadata for inode 14 (the deleted file)
istat -o 2048 range/disk/disk.img 14

# 5. Recover the content — still readable despite deletion
icat -o 2048 range/disk/disk.img 14

# 6. Build a timeline body file
fls -r -m / -o 2048 range/disk/disk.img > body.txt
mactime -b body.txt > timeline.txt
```

**Expected output from icat:** the contents of `secret.txt`, proving recovery from a deleted inode.

---

## 3 · Key commands

| Command | What it does |
|---|---|
| `mmls disk.img` | List partitions with sector offsets |
| `fls -o OFFSET disk.img` | List files (including deleted) at partition offset |
| `istat -o OFFSET disk.img INODE` | Inode metadata, timestamps, data block addresses |
| `icat -o OFFSET disk.img INODE` | Extract file content by inode number |
| `blkstat -o OFFSET disk.img BLOCK` | Block allocation status |
| `fsstat -o OFFSET disk.img` | Filesystem statistics (type, size, block count) |
| `fls -r -m / -o OFFSET disk.img` | Recursive list → timeline body file |
| `photorec disk.img` | Signature-based file carving (GUI wizard) |
| `xxd -l 512 disk.img` | Inspect MBR / partition table in hex |
| `fdisk -l disk.img` | Quick partition table listing |

---

## 4 · Flashcard targets

- **MBR max capacity?** ~2 TiB (32-bit LBA × 512-byte sectors)
- **What does `rm` actually do on ext4?** Unlinks the directory entry; the inode and data blocks persist until reused.
- **Resident NTFS file?** Content small enough to live inside the 1 KB MFT record itself — no separate data run.
- **Magic bytes of an ELF binary?** `7F 45 4C 46` ("\\x7FELF")
- **Why does file carving work?** Headers/footers in unallocated space remain until overwritten.
- **Why must you image before continued use?** Every write risks reusing freed blocks and overwriting recoverable deleted data.
- **USN journal ($UsnJrnl:$J) gives what?** A change log of file creates/modifies/deletes with timestamps — a ready-made timeline source.

---

## 5 · Common traps

- **Analyzing a live disk in place** — mounting read-write alters atime and risks reusing freed space. Image first with `dd if=/dev/sdX of=image.dd bs=4M status=progress`.
- **Forgetting the sector offset** — every TSK command needs `-o OFFSET` matching the partition's start sector from `mmls`. Wrong offset = wrong filesystem = garbage output.
- **Trusting a single timestamp** — $SI is editable; corroborate with $FN (NTFS) and the journal.
- **Treating photorec filenames as original** — carving loses filenames; it only recovers content by signature.

---

## 6 · Reflection questions

1. Trace exactly what changes on disk when you `rm secret.txt` on ext4 vs. delete a file on NTFS — what is and isn't recoverable in each case, and at what point does it become unrecoverable?
2. If an attacker runs `shred -n 3 secret.txt` instead of `rm`, what changes about your recovery options?
3. Why does order of volatility apply even to a "dead" disk image that isn't changing?

---

## 7 · Feeds into

- **Phase 8** — the same inode/MFT structures exist in RAM as memory-mapped files. Memory forensics is disk forensics applied to volatile storage.
- **Phase 11** — MFT timestamps ($SI vs $FN) and the USN journal are the primary disk artifacts for rootkit/timestomping detection.
- **Phase 12** — disk evidence (deleted files, MFT timeline, shimcache execution proof) is one of the four pillars of the capstone reconstruction.
