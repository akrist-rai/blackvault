<script>
  import { progress, setObj } from '../stores/progress.js';

  const XENC = [0x43, 0x44, 0x5d, 0x52, 0x54, 0x56];
  const CRACK = [
    { tag: 'plaintext', fn: 'auth_check', obj: 'l0', sol: 'letmein',
      test: s => s === 'letmein',
      hint: 'The comparison string is loaded into rsi from .rodata right before the call to strcmp. Whatever it points at is the password — read it literally.',
      asm: [
        { a: '0x1149', by: '55', mn: 'push rbp' },
        { a: '0x114a', by: '48 89 e5', mn: 'mov rbp, rsp' },
        { a: '0x114d', by: '48 89 7d f8', mn: 'mov [rbp-0x8], rdi', cm: 'input' },
        { a: '0x1151', by: '48 8d 35 ..', mn: 'lea rsi, [rip+0xeac]', cm: '"letmein"' },
        { a: '0x1158', by: '48 8b 7d f8', mn: 'mov rdi, [rbp-0x8]' },
        { a: '0x115c', by: 'e8 cf fe ..', mn: 'call strcmp' },
        { a: '0x1161', by: '85 c0', mn: 'test eax, eax' },
        { a: '0x1163', by: '75 07', mn: 'jne 0x116c', pj: 'nop ; nop', jmp: 1, cm: 'strcmp!=0 → fail. patch to fall through' },
        { a: '0x1165', by: 'b8 01 ..', mn: 'mov eax, 1', cm: 'return 1  (GRANTED)' },
        { a: '0x116a', by: 'eb 05', mn: 'jmp 0x1171' },
        { a: '0x116c', by: 'b8 00 ..', mn: 'mov eax, 0', cm: 'return 0  (DENIED)' },
        { a: '0x1171', by: '5d', mn: 'pop rbp' },
        { a: '0x1172', by: 'c3', mn: 'ret' },
      ],
      pseudo: `int auth_check(char *input) {
    if (strcmp(input, "letmein") == 0)
        return 1;   // access granted
    return 0;       // access denied
}` },
    { tag: 'XOR gate', fn: 'xor_gate', obj: 'l1', sol: 'pwnage',
      test: s => s.length === 6 && XENC.every((b, i) => (s.charCodeAt(i) ^ 0x33) === b),
      hint: 'Each input byte is XORed with 0x33, then compared to a 6-byte table {43 44 5d 52 54 56}. XOR is its own inverse: plaintext[i] = table[i] ^ 0x33. Decode the six bytes.',
      asm: [
        { a: '0x1170', by: '55', mn: 'push rbp' },
        { a: '0x1171', by: '48 89 e5', mn: 'mov rbp, rsp' },
        { a: '0x1174', by: '48 89 7d e8', mn: 'mov [rbp-0x18], rdi', cm: 'input' },
        { a: '0x1178', by: 'c7 45 fc 00', mn: 'mov dword [rbp-0x4], 0', cm: 'i = 0' },
        { a: '0x117f', by: 'eb 1f', mn: 'jmp 0x11a0', cm: '→ loop condition' },
        { a: '0x1181', by: '8b 45 fc', mn: 'mov eax, [rbp-0x4]' },
        { a: '0x1184', by: '48 03 ..', mn: 'movzx ecx, byte [rdi+rax]', cm: 'input[i]' },
        { a: '0x1188', by: '83 f1 33', mn: 'xor ecx, 0x33', cm: 'input[i] ^ 0x33' },
        { a: '0x118b', by: '48 8d 15', mn: 'lea rdx, [rip+key]', cm: 'key = {43 44 5d 52 54 56}' },
        { a: '0x1192', by: '3a 0c 02', mn: 'cmp cl, [rdx+rax]', cm: '== key[i] ?' },
        { a: '0x1195', by: '74 07', mn: 'je 0x119e', pj: 'jmp 0x119e', jmp: 1, cm: 'equal → next. patch to always pass' },
        { a: '0x1197', by: 'b8 00 ..', mn: 'mov eax, 0', cm: 'mismatch → return 0' },
        { a: '0x119c', by: 'eb 0e', mn: 'jmp 0x11ae' },
        { a: '0x119e', by: '83 45 fc 01', mn: 'add dword [rbp-0x4], 1', cm: 'i++' },
        { a: '0x11a0', by: '83 7d fc 06', mn: 'cmp dword [rbp-0x4], 6' },
        { a: '0x11a4', by: '7c db', mn: 'jl 0x1181', cm: 'i < 6 → loop' },
        { a: '0x11a6', by: 'b8 01 ..', mn: 'mov eax, 1', cm: 'all matched → return 1' },
        { a: '0x11ae', by: '5d c3', mn: 'pop rbp ; ret' },
      ],
      pseudo: `char key[6] = { 0x43,0x44,0x5d,0x52,0x54,0x56 };

int xor_gate(char *input) {
    for (int i = 0; i < 6; i++) {
        if ((input[i] ^ 0x33) != key[i])
            return 0;        // wrong
    }
    return 1;                // input[i] == key[i] ^ 0x33
}` },
    { tag: 'keygen', fn: 'validate_serial', obj: 'l2', sol: '40000008',
      test: s => { if (!/^[0-9]{8}$/.test(s)) return false; let sum = 0; for (let i = 0; i < 8; i++) sum += (s.charCodeAt(i) - 48) * (i + 1); return sum % 17 === 0 && s[0] === '4'; },
      hint: "No fixed password — you must MAKE a serial that passes. Rules from the pseudo-C: exactly 8 digits, first digit must be '4', and the position-weighted sum  Σ digit[i]*(i+1)  must be divisible by 17. Set most digits to 0 and solve the last one: 4·1 + d·8 ≡ 0 (mod 17).",
      asm: [
        { a: '0x11c0', by: '55 48 89 e5', mn: 'push rbp ; mov rbp, rsp' },
        { a: '0x11c4', by: '48 89 7d e8', mn: 'mov [rbp-0x18], rdi', cm: 'serial' },
        { a: '0x11c8', by: 'e8 .. ..', mn: 'call strlen' },
        { a: '0x11cd', by: '48 83 f8 08', mn: 'cmp rax, 8' },
        { a: '0x11d1', by: '75 33', mn: 'jne 0x1206', cm: 'len != 8 → fail' },
        { a: '0x11d3', by: '45 31 c0', mn: 'xor r8d, r8d', cm: 'sum = 0' },
        { a: '0x11d6', by: '31 c9', mn: 'xor ecx, ecx', cm: 'i = 0' },
        { a: '0x11d8', by: '0f b6 ..', mn: 'movzx eax, byte [rdi+rcx]', cm: 'serial[i]' },
        { a: '0x11dc', by: '83 e8 30', mn: 'sub eax, 0x30', cm: "- '0'" },
        { a: '0x11df', by: '83 f8 09', mn: 'cmp eax, 9' },
        { a: '0x11e2', by: '77 22', mn: 'ja 0x1206', cm: 'not 0-9 → fail' },
        { a: '0x11e4', by: '8d 51 01', mn: 'lea edx, [rcx+1]', cm: 'weight = i+1' },
        { a: '0x11e7', by: '0f af c2', mn: 'imul eax, edx', cm: 'digit * (i+1)' },
        { a: '0x11ea', by: '41 01 c0', mn: 'add r8d, eax', cm: 'sum += ...' },
        { a: '0x11ed', by: '48 ff c1', mn: 'inc rcx ; cmp rcx,8 ; jl 0x11d8' },
        { a: '0x11f5', by: '.. 6b .. 17', mn: 'mod = sum % 17' },
        { a: '0x11f9', by: '85 c0', mn: 'test mod, mod' },
        { a: '0x11fb', by: '75 09', mn: 'jne 0x1206', cm: 'sum % 17 != 0 → fail' },
        { a: '0x11fd', by: '80 3f 34', mn: "cmp byte [rdi], '4'" },
        { a: '0x1200', by: '75 04', mn: 'jne 0x1206', pj: 'nop ; nop', jmp: 1, cm: "serial[0] != '4' → fail. patch the last gate" },
        { a: '0x1202', by: 'b8 01 ..', mn: 'mov eax, 1', cm: 'valid!' },
        { a: '0x1206', by: '31 c0 c3', mn: 'xor eax, eax ; ret', cm: 'invalid' },
      ],
      pseudo: `int validate_serial(char *s) {
    if (strlen(s) != 8) return 0;
    int sum = 0;
    for (int i = 0; i < 8; i++) {
        if (s[i] < '0' || s[i] > '9') return 0;
        sum += (s[i] - '0') * (i + 1);   // position-weighted
    }
    return (sum % 17 == 0) && (s[0] == '4');
}` },
  ];

  let lvl = 0;
  let patched = { 0: false, 1: false, 2: false };
  let input = '';
  let verdict = null; // { ok, txt }

  $: c = CRACK[lvl];

  function pick(i) { lvl = i; input = ''; verdict = null; }
  function togglePatch(i) {
    if (!c.asm[i]?.jmp) return;
    patched[lvl] = !patched[lvl];
    verdict = null;
  }
  function runCheck() {
    const p = patched[lvl];
    const ok = p ? input.length > 0 : c.test(input);
    verdict = { ok, txt: ok ? ('>>> ACCESS GRANTED' + (p ? '  (check bypassed via patch)' : '')) : '>>> ACCESS DENIED' };
    if (ok) setObj('re', p ? 'patch' : c.obj, progress);
  }
  let revealed = false;
</script>

<div class="relevels">
  {#each CRACK as cc, i}
    <button aria-current={i === lvl} on:click={() => pick(i)}>#{i + 1} · {cc.tag}</button>
  {/each}
</div>
<div class="rebench">
  <div class="repane">
    <h5>disassembly — &lt;{c.fn}&gt;{patched[lvl] ? ' · PATCHED' : ''}</h5>
    <div class="asm">
      {#each c.asm as r, i}
        <div class="row" data-jmp={r.jmp ? 1 : 0} data-patched={r.jmp && patched[lvl] ? 1 : 0} on:click={() => togglePatch(i)}>
          <span class="a">{r.a}</span><span class="by">{r.by || ''}</span><span class="mn">{r.jmp && patched[lvl] ? r.pj : r.mn}</span>{#if r.cm}<span class="cm">  ; {r.cm}</span>{/if}
        </div>
      {/each}
    </div>
  </div>
  <div class="repane"><h5>decompiler — pseudo-C</h5><pre class="pcode">{c.pseudo}</pre></div>
</div>
<div class="retry">
  <input autocomplete="off" spellcheck="false" placeholder={lvl === 2 ? 'enter an 8-digit serial' : 'enter the password'} bind:value={input} on:keydown={e => e.key === 'Enter' && runCheck()}>
  <button class="btn" on:click={runCheck}>Run check ▸</button>
  <span class="prog" style="color:var(--ash);font-family:var(--mono)">{patched[lvl] ? '⚠ jump patched — any input passes' : 'tip: click the highlighted red jump to patch it'}</span>
</div>
{#if verdict}<div class="verdict {verdict.ok ? 'ok' : 'no'}">{verdict.txt}</div>{/if}
<div class="hintbox"><b>Hint:</b> {c.hint} <a style="color:var(--volt);cursor:pointer" on:click={() => revealed = true}>[ reveal answer ]</a>{#if revealed} — <code>{c.sol}</code>{/if}</div>

<style>
  .asm .row[data-jmp="1"] { cursor: pointer; }
</style>
