<script>
  import { nav, progress, labDoneCount, labTotal } from '../stores/progress.js';
  import { LABS, LABOBJ } from '../data/curriculum.js';
  import { RANGE_CHAPTER_COVERS, RANGE_SKILL_COVERS, imageUrl } from '../data/images.js';

  import MemLab from '../labs/MemLab.svelte';
  import ReLab from '../labs/ReLab.svelte';
  import PcapLab from '../labs/PcapLab.svelte';
  import LogLab from '../labs/LogLab.svelte';
  import CryptoLab from '../labs/CryptoLab.svelte';
  import WebLab from '../labs/WebLab.svelte';
  import PeLab from '../labs/PeLab.svelte';
  import StegoLab from '../labs/StegoLab.svelte';
  import PwnLab from '../labs/PwnLab.svelte';
  import PrivescLab from '../labs/PrivescLab.svelte';
  import HashLab from '../labs/HashLab.svelte';
  import EmailLab from '../labs/EmailLab.svelte';
  import IntelLab from '../labs/IntelLab.svelte';
  import DiskLab from '../labs/DiskLab.svelte';
  import AsmLab from '../labs/AsmLab.svelte';
  import BinfmtLab from '../labs/BinfmtLab.svelte';
  import StaticLab from '../labs/StaticLab.svelte';
  import GhidraLab from '../labs/GhidraLab.svelte';
  import DynamicLab from '../labs/DynamicLab.svelte';
  import UnpackLab from '../labs/UnpackLab.svelte';
  import MemoryLab from '../labs/MemoryLab.svelte';
  import NetworkLab from '../labs/NetworkLab.svelte';
  import ProtocolLab from '../labs/ProtocolLab.svelte';
  import RootkitLab from '../labs/RootkitLab.svelte';
  import CapstoneLab from '../labs/CapstoneLab.svelte';

  const LAB_COMPONENTS = {
    mem: MemLab, re: ReLab, pcap: PcapLab, log: LogLab, crypto: CryptoLab,
    web: WebLab, pe: PeLab, stego: StegoLab, pwn: PwnLab, privesc: PrivescLab,
    hash: HashLab, email: EmailLab, intel: IntelLab,
    disk: DiskLab, asm: AsmLab, binfmt: BinfmtLab, static: StaticLab, ghidra: GhidraLab,
    dynamic: DynamicLab, unpack: UnpackLab, memory: MemoryLab, network: NetworkLab,
    protocol: ProtocolLab, rootkit: RootkitLab, capstone: CapstoneLab,
  };

  $: chapterLabs = LABS.filter(l => l.group === 'chapter').sort((a, b) => a.phase - b.phase);
  $: skillLabs = LABS.filter(l => !l.group);

  $: activeLabId = $nav.labId;
  $: meta = LABS.find(l => l.id === activeLabId);

  function openLab(id) { nav.update(s => ({ ...s, labId: id })); }
  function backToIndex() { nav.update(s => ({ ...s, labId: null })); }

  function done(id) { return labDoneCount(id, $progress); }
  function total(id) { return labTotal(id); }
</script>

{#if !activeLabId}
  <div class="modehead">
    <div class="eyebrow" style="color:var(--volt)">Hands-on · cyber range</div>
    <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">The Range</h1>
    <p class="lede">No definitions — just artifacts and tools. <b style="color:var(--bone)">Chapter labs</b> map 1:1 to the 12 phases on the Map; <b style="color:var(--bone)">Skill labs</b> are cross-cutting drills. Scored objectives, everything runs in your browser, progress saves locally.</p>
  </div>

  <div class="sec__h">Chapter labs — one per Map phase (1–12)</div>
  <div class="labgrid">
    {#each chapterLabs as l, idx}
      {@const d = done(l.id)}
      {@const t = total(l.id)}
      {@const pc = t ? Math.round(d / t * 100) : 0}
      {@const img = RANGE_CHAPTER_COVERS[idx % RANGE_CHAPTER_COVERS.length]}
      <div class="labcard" data-done={d === t ? 1 : 0} on:click={() => openLab(l.id)} role="button" tabindex="0" on:keydown={e => e.key === 'Enter' && openLab(l.id)}>
        <div class="labcard__cover">
          <img src={imageUrl(img)} alt="" loading="lazy" />
          <div class="labcard__cover-overlay"></div>
        </div>
        <div class="labcard__body">
          <div class="labcard__meta">
            <span class="chip t-{l.track}">{l.track}</span>
            <span class="prog">· CH {l.phase} · {l.tool}</span>
          </div>
          <h3>{l.name}</h3>
          <p>{l.blurb}</p>
          <div class="prog">{d}/{t} objectives {d === t ? '· ✓ CLEARED' : ''}</div>
          <div class="pbar"><i style="width:{pc}%"></i></div>
        </div>
      </div>
    {/each}
  </div>

  <div class="sec__h" style="margin-top:28px">Skill labs — cross-cutting</div>
  <div class="labgrid">
    {#each skillLabs as l, idx}
      {@const d = done(l.id)}
      {@const t = total(l.id)}
      {@const pc = t ? Math.round(d / t * 100) : 0}
      {@const img = RANGE_SKILL_COVERS[idx % RANGE_SKILL_COVERS.length]}
      <div class="labcard" data-done={d === t ? 1 : 0} on:click={() => openLab(l.id)} role="button" tabindex="0" on:keydown={e => e.key === 'Enter' && openLab(l.id)}>
        <div class="labcard__cover">
          <img src={imageUrl(img)} alt="" loading="lazy" />
          <div class="labcard__cover-overlay"></div>
        </div>
        <div class="labcard__body">
          <div class="labcard__meta">
            <span class="chip t-{l.track}">{l.track}</span>
            <span class="prog"> · {l.tool}</span>
          </div>
          <h3>{l.name}</h3>
          <p>{l.blurb}</p>
          <div class="prog">{d}/{t} objectives {d === t ? '· ✓ CLEARED' : ''}</div>
          <div class="pbar"><i style="width:{pc}%"></i></div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="labtop">
    <button class="btn" on:click={backToIndex}>‹ Range</button>
    <div>
      <div class="eyebrow" style="color:var(--volt)">{meta?.tool || ''}</div>
      <b style="font-size:20px;letter-spacing:-.01em">{meta?.name || activeLabId}</b>
    </div>
    <span class="prog" style="margin-left:auto;font-family:var(--mono);color:var(--ash)">{done(activeLabId)}/{total(activeLabId)} objectives</span>
  </div>
  <div class="lab-workspace">
    <div class="objbox">
      <h4>Objectives</h4>
      {#each LABOBJ[activeLabId] || [] as x}
        {@const on = !!($progress.labs?.[activeLabId]?.[x.k])}
        <div class="obj" data-on={on ? 1 : 0}>
          <span class="tick">{on ? '[✓]' : '[ ]'}</span>
          <span>{x.t}</span>
        </div>
      {/each}
    </div>
    <div class="lab-workspace-right">
      {#if LAB_COMPONENTS[activeLabId]}
        <svelte:component this={LAB_COMPONENTS[activeLabId]} />
      {:else}
        <p style="color:var(--ash)">Lab "{activeLabId}" not found.</p>
      {/if}
    </div>
  </div>
{/if}
