# 🔧 Phase 2 — x86 / x64 Assembly

**Track:** Reverse Engineering · **Prereqs:** Phase 1 (hex fluency) · **Feeds:** Every later phase — Ghidra (5), unpacking (7), shellcode in memory (8) all bottom out here.
**Your artifact:** `range/asm/trace` — compiled ELF binary from `trace.c`. Use gdb to step through the `compute` function, watch registers change, and capture the return value.

> **The whole phase in one sentence:** every program — any source language — becomes machine instructions over registers and memory; reverse engineering is reading that lowest layer fluently.

---

## 0 · The single idea everything here rests on

A function call at the machine level: arguments go into registers (rdi, rsi, rdx… on Linux x64), `call target` pushes the return address onto the stack and jumps, the prologue saves rbp and carves space for locals, the body does work, the epilogue tears the frame down, and `ret` pops the return address back into rip. Once you can see that mechanism clearly — the return address sitting on the stack — stack overflows, ROP chains, OEP hunting, and "why does this crash" all become legible from the same mental model.

---

## 1 · Topics to learn

### 1.1 Registers
- [ ] **General-purpose registers** — rax, rbx, rcx, rdx, rsi, rdi, r8–r15. Their 32-bit (eax), 16-bit (ax), and 8-bit (al/ah) sub-registers are views into the same storage; writing eax zero-extends into rax.
- [ ] **Special-purpose registers** — rsp (stack pointer, always points to the top = lowest in-use address), rbp (frame pointer, base of the current frame), rip (instruction pointer, the next instruction), rflags (condition flags).
- [ ] **Caller-saved vs callee-saved** — System V AMD64: callee must preserve rbx, rbp, r12–r15. Everything else is caller's problem. This determines what you see on the stack around a call.

### 1.2 Calling conventions
- [ ] **System V AMD64 (Linux)** — integer/pointer args: rdi, rsi, rdx, rcx, r8, r9, then stack. Return value: rax (rdx:rax for 128-bit). Floating-point: xmm0–xmm7.
- [ ] **Windows x64** — integer args: rcx, rdx, r8, r9 (+32-byte shadow space allocated by caller). Return: rax. The shadow space is 32 bytes the *callee* may use but doesn't have to — a frequent source of confusion.
- [ ] **32-bit cdecl (awareness)** — all args on stack, pushed right-to-left, caller cleans up. Still used in 32-bit malware.

### 1.3 The stack and stack frames
- [ ] **Stack direction** — grows downward (toward lower addresses). push decrements rsp then writes; pop reads then increments rsp.
- [ ] **Standard prologue** — `push rbp ; mov rbp, rsp ; sub rsp, N` saves the caller's frame pointer and allocates N bytes of local variable space.
- [ ] **Standard epilogue** — `leave` (= `mov rsp, rbp ; pop rbp`) then `ret` (= `pop rip`). Tear the frame down and return to the saved address.
- [ ] **Locals and arguments on the stack** — locals accessed via `[rbp-N]`; stack arguments (past the 6th) via `[rbp+16]` and above.
- [ ] **Return address location** — right after the prologue's push rbp, the stack looks like: [rbp-N .. rbp-8] locals | [rbp] saved rbp | [rbp+8] return address. A buffer overflow that reaches [rbp+8] controls rip.

### 1.4 Instruction set essentials
- [ ] **Data movement** — `mov`, `movzx` (zero-extend), `movsx` (sign-extend), `lea` (load effective address — computes address without dereferencing). `lea rax, [rbp-8]` gives a pointer; `mov rax, [rbp-8]` dereferences it.
- [ ] **Arithmetic** — `add`, `sub`, `imul`, `idiv`, `inc`, `dec`, `neg`. `imul` sets overflow flag; `idiv` requires `cdq` to sign-extend rax into rdx:rax first.
- [ ] **Bitwise** — `and`, `or`, `xor`, `not`, `shl`, `shr`. XOR with itself zeroes a register: `xor rax, rax` is idiomatic zero.
- [ ] **Comparison and branches** — `cmp a, b` computes a-b and sets flags; `test a, b` computes a&b and sets flags. Conditional jumps (jz/jnz/jg/jl/jge/jle/ja/jb) read those flags.
- [ ] **Addressing modes** — immediate (`mov rax, 5`), register (`mov rax, rbx`), memory direct (`mov rax, [0x601020]`), memory indirect with displacement (`mov rax, [rbp-8]`), indexed (`mov al, [rdi+rcx*1]`).

### 1.5 Endianness
- [ ] **x86/x64 is little-endian** — the least-significant byte is stored at the lowest address. `0x12345678` in memory: `78 56 34 12`. Get this wrong and every multi-byte field you read is reversed.
- [ ] **Pointer size** — 8 bytes on x64 (64-bit addresses). Reading a pointer from memory: `0x00007fff5fbfe8a0` is stored as `a0 e8 bf 5f ff 7f 00 00`.

### 1.6 Using gdb
- [ ] **Basic workflow** — open with `-q`, set a breakpoint, run with arguments, step one instruction at a time with `stepi`, inspect state.
- [ ] **Intel vs AT&T syntax** — `set disassembly-flavor intel` in `.gdbinit`. Intel: `instruction dest, src`. AT&T: `instruction src, dest` — operands reversed and registers prefixed with `%`.
- [ ] **pwndbg / peda** — plugins that replace gdb's default display with a register panel, stack view, and disassembly pane. Install pwndbg for much better UX.
- [ ] **Hardware vs software breakpoints** — `break`/`b` plants a 0xCC (software); `hbreak` uses a debug register (hardware). Anti-tamper code detects 0xCC; hardware breakpoints are invisible to the target.

---

## 2 · The artifact — `range/asm/trace`

`trace.c` implements:
```c
int compute(int a, int b) {
    int sum = a + b;       // 5 + 3 = 8
    return sum * sum - 4;  // 64 - 4 = 60
}
```

The binary calls `compute(5, 3)` and should return 60. Use gdb to watch this happen at the register level.

### Lab walkthrough

```bash
# Disassemble without running
objdump -d -M intel range/asm/trace

# Open in gdb
gdb -q range/asm/trace
(gdb) set disassembly-flavor intel
(gdb) break compute
(gdb) run
# Execution stops at compute's first instruction

# At the prologue — frame is being set up
(gdb) info registers rdi rsi rsp rbp
# rdi = 5 (first arg), rsi = 3 (second arg)

(gdb) disas /r compute   # show the full function with bytes
(gdb) layout asm         # side-by-side asm view (Ctrl-x 2 to toggle)

# Step through instruction by instruction
(gdb) stepi              # push rbp
(gdb) stepi              # mov rbp, rsp
(gdb) stepi              # ...

# After the add instruction — check the sum
(gdb) info registers rax

# Step to the ret instruction, then check the return value
(gdb) finish             # run until function returns
(gdb) info registers rax
# rax should be 60
```

**What to observe:** how rdi/rsi hold the arguments on entry, how rbp/rsp change at the prologue, how rax holds the return value at the epilogue.

---

## 3 · Key commands

| Command | Context | What it does |
|---|---|---|
| `gdb -q ./binary` | gdb | Open without banner |
| `break funcname` | gdb | Breakpoint at function entry |
| `hbreak *0xADDR` | gdb | Hardware breakpoint (no 0xCC) |
| `stepi` / `si` | gdb | Single machine instruction (into calls) |
| `nexti` / `ni` | gdb | Single instruction, step over calls |
| `info registers` | gdb | All register values |
| `info registers rax rbp rsp` | gdb | Specific registers |
| `x/20i $rip` | gdb | Next 20 instructions |
| `x/32xb $rsp` | gdb | 32 bytes of stack in hex bytes |
| `p/x $rax` | gdb | Print rax in hex |
| `set $rax = 1` | gdb | Modify a register |
| `finish` | gdb | Run until current function returns |
| `layout asm` | gdb | Split-screen assembly view |
| `objdump -d -M intel bin` | shell | Quick disassembly, Intel syntax |
| `ndisasm -b64 file.bin` | shell | Flat binary (shellcode) disassembly |

---

## 4 · Flashcard targets

- **System V AMD64 arg registers, in order?** rdi, rsi, rdx, rcx, r8, r9
- **Where does a function's return value go?** rax (lower 32 bits: eax)
- **Standard x64 function prologue?** `push rbp ; mov rbp, rsp ; sub rsp, N`
- **What does `leave` do?** `mov rsp, rbp ; pop rbp` — tear down the frame
- **What does `call` physically do?** Push return address to stack, jump to target
- **Is x86/x64 big or little endian?** Little-endian (0x12345678 → 78 56 34 12)
- **Where is the return address relative to rbp after the prologue?** At [rbp+8]
- **What is `xor rax, rax` doing?** Zeroing rax — idiomatic and slightly smaller than `mov rax, 0`
- **Windows x64 first 4 args?** rcx, rdx, r8, r9

---

## 5 · Common traps

- **AT&T syntax operand order** — `mov %rsi, %rdi` means `rdi = rsi` in AT&T but reads backward. Use Intel syntax (`set disassembly-flavor intel`) to avoid confusion.
- **eax writes zero-extend rax** — writing to eax clears the upper 32 bits of rax. Writing to ax or al does NOT. A common source of subtle bugs in manual analysis.
- **Forgetting the shadow space on Windows x64** — the caller always allocates 32 bytes of shadow space above the return address, even if only 1 argument is passed. Windows x64 ABI compliance requires this.
- **Confusing `lea` with `mov [mem]`** — `lea rax, [rbp-8]` loads the *address* rbp-8, not the *value at* rbp-8. Many decompiler errors stem from misreading this.
- **Missing implicit operands for `idiv`** — `idiv rcx` divides rdx:rax by rcx. The dividend is always the 128-bit pair, not just rax.

---

## 6 · Reflection questions

1. Sketch the stack layout (as a diagram) at the moment right after the prologue of a function that takes three arguments and has two local variables. Label rsp, rbp, the saved return address, the saved rbp, the locals, and the arguments.
2. If a local buffer is at `[rbp-24]` and the return address is at `[rbp+8]`, how many bytes must overflow the buffer to reach the return address?
3. Why does the same C function produce different assembly under System V vs Windows x64, and what does that mean for writing portable shellcode?

---

## 7 · Feeds into

- **Phase 5 (Ghidra)** — every decompiler output is a reconstruction of exactly these mechanisms. Knowing the ABI lets you correct decompiler errors.
- **Phase 7 (Unpacking)** — the OEP tail-jump and the dump-then-rebuild pipeline require reading assembly fluently to find the critical instructions.
- **Phase 8 (Memory)** — shellcode analysis in Volatility's `disasm` output is just raw bytes → assembly → understanding what the code does.
- **Phase 10 (Protocol RE)** — finding the encrypt-before-send routine requires following the call graph at the assembly level.
