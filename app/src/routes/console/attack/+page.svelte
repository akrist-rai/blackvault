<script>
  import { ATTACK } from '$lib/data';
  import { ctf, showToast } from '$lib/stores';

  const TACTICS = [...new Set(ATTACK.map(t => t.tactic))];
  let search = '';
  $: filtered = ATTACK.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.tactic.toLowerCase().includes(search.toLowerCase())
  );
  let selected = null;

  const ID_CHALS = [
    { q: 'Malware spawns a suspended svchost.exe, unmaps the image, writes shellcode via NtWriteVirtualMemory, then redirects the entry point with SetThreadContext. Submit the technique ID.', flag: 't1055.012' },
    { q: 'An attacker requests a TGS for an SPN-configured service account, then cracks the RC4-encrypted ticket offline. Submit the technique ID.', flag: 't1558.003' },
    { q: 'Wiper malware overwrites the MBR and partition tables with no ransom demand — pure sabotage. Submit the technique ID.', flag: 't1485' },
    { q: 'Commands are sent as DNS TXT queries with responses returned in A/CNAME records, at roughly 3 KB/s. Submit the technique ID.', flag: 't1071.004' },
    { q: 'An attacker abuses DCOM\'s MMC20.Application to execute commands on a remote host without touching SMB or WMI. Submit the technique ID.', flag: 't1021.003' },
    { q: 'A trojanized build pipeline inserts a backdoor before distribution, signed with a legitimate certificate. Submit the technique ID.', flag: 't1195.002' },
  ];

  $: solvedFlags = $ctf;
  let inputs = {};
  let wrong = {};

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function submitChal(i, flag) {
    const key = `attack_${i}`;
    const val = normalizeFlag(inputs[key]);
    if (val === flag.toLowerCase()) {
      wrong = { ...wrong, [key]: false };
      ctf.update(s => ({ ...s, [key]: true }));
      showToast('Flag captured', 'success');
    } else {
      wrong = { ...wrong, [key]: true };
    }
  }
</script>

<svelte:head><title>ATT&amp;CK — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>MITRE ATT&amp;CK</span>
  <span class="ts-right">{ATTACK.length} techniques</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>MITRE ATT&amp;CK Reference</h1>
    <p>Techniques covered across the BLACKVAULT curriculum, mapped to tactics. Click any technique for details and detection guidance, then identify techniques from real scenarios in the flag challenges below.</p>
    <input class="search-input" bind:value={search} placeholder="Search techniques…" type="search" />
    <div class="intro-pbar"><div class="intro-pfill" style="width:{Math.round(ID_CHALS.filter((_, i) => solvedFlags[`attack_${i}`]).length / ID_CHALS.length * 100)}%"></div></div>
    <div class="intro-plabel">{ID_CHALS.filter((_, i) => solvedFlags[`attack_${i}`]).length}/{ID_CHALS.length} flags captured</div>
  </div>

  <div class="attack-grid">
    {#each filtered as t}
      <button class="att-card" class:active={selected?.id === t.id} on:click={() => selected = selected?.id === t.id ? null : t}>
        <div class="att-id">{t.id}</div>
        <div class="att-tactic">{t.tactic}</div>
        <div class="att-name">{t.name}</div>
        {#if selected?.id === t.id}
          <div class="att-detail">{t.detail}</div>
        {/if}
      </button>
    {/each}
  </div>

  <div class="id-challenges">
    <h2 class="ic-hd">Flag Challenges — identify the technique</h2>
    <p class="ic-sub">Read the scenario, search the matrix above for the matching technique, then submit its ID as the flag.</p>
    <div class="ic-list">
      {#each ID_CHALS as chal, i}
        {@const key = `attack_${i}`}
        {@const got = !!solvedFlags[key]}
        <div class="chal" class:chal-solved={got}>
          <div class="chal-q"><span class="chal-num">{i + 1}.</span> {chal.q}</div>
          {#if got}
            <div class="chal-solved-row">
              <span class="chal-icon">✓</span>
              <code class="chal-flag">BV{'{'}{chal.flag}{'}'}</code>
            </div>
          {:else}
            <form class="chal-form" on:submit|preventDefault={() => submitChal(i, chal.flag)}>
              <input
                class="chal-input"
                type="text"
                placeholder={'BV{...}'}
                autocomplete="off"
                spellcheck="false"
                bind:value={inputs[key]}
              />
              <button class="chal-submit" type="submit">Submit</button>
            </form>
            {#if wrong[key]}<div class="chal-wrong">Incorrect — search the matrix above and try again.</div>{/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }
  .page { padding: 28px; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 28px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .intro-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; margin-top: 16px; }
  .intro-pfill { height: 100%; background: var(--volt); border-radius: 2px; transition: width .5s ease; box-shadow: var(--glow-volt); }
  .intro-plabel { font-size: 11px; color: var(--ash); letter-spacing: .04em; }
  .search-input {
    width: 100%; max-width: 400px;
    background: var(--panel2); border: 1px solid var(--line2);
    color: var(--bone); padding: 9px 14px; border-radius: var(--rad);
    font-family: var(--font); font-size: 13px; outline: none;
  }
  .search-input:focus { border-color: var(--volt); }

  .attack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .att-card {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 16px; text-align: left; cursor: pointer;
    transition: border-color .15s, background .15s;
    width: 100%;
  }
  .att-card:hover { border-color: var(--line2); background: var(--panel2); }
  .att-card.active { border-color: var(--volt); background: color-mix(in srgb, var(--volt) 5%, var(--panel)); }
  .att-id { font-family: var(--mono); font-size: 11px; color: var(--volt); margin-bottom: 4px; }
  .att-tactic { font-size: 10px; color: var(--ash); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 6px; }
  .att-name { font-size: 13px; font-weight: 600; color: var(--bone); }
  .att-detail { font-size: 12px; color: var(--ash); line-height: 1.5; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }

  @media (max-width: 800px) { .attack-grid { grid-template-columns: 1fr 1fr; } }

  .id-challenges { margin-top: 28px; }
  .ic-hd { font-size: 16px; font-weight: 700; color: var(--bone); margin-bottom: 6px; }
  .ic-sub { font-size: 13px; color: var(--ash); margin-bottom: 16px; }
  .ic-list {
    background: color-mix(in srgb, var(--amber) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
    border-radius: var(--rad); padding: 16px 18px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .chal { border-top: 1px solid color-mix(in srgb, var(--amber) 14%, transparent); padding-top: 12px; }
  .chal:first-of-type { border-top: none; padding-top: 0; }
  .chal-q { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 8px; }
  .chal-num { color: var(--amber); font-weight: 700; margin-right: 2px; }

  .chal-form { display: flex; gap: 8px; }
  .chal-input {
    flex: 1; min-width: 0;
    background: var(--void); border: 1px solid var(--line);
    color: var(--bone); font-family: var(--mono); font-size: 12px;
    padding: 8px 10px; border-radius: var(--rad);
    transition: border-color .15s;
  }
  .chal-input:focus { outline: none; border-color: var(--volt); }
  .chal-submit {
    padding: 8px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s; flex-shrink: 0;
  }
  .chal-submit:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }
  .chal-wrong { font-size: 12px; color: var(--blood); margin-top: 6px; }

  .chal-solved-row { display: flex; align-items: center; gap: 8px; }
  .chal-icon { color: var(--volt); font-weight: 700; }
  .chal-flag {
    font-family: var(--mono); font-size: 12px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 4px 10px; border-radius: 3px;
  }
</style>
