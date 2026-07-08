<script>
  import { onMount, tick } from 'svelte';
  import { nav, progress, toast } from '../stores/progress.js';
  import { LABS, LABOBJ } from '../data/curriculum.js';
  import { initLabs, LAB_RENDERERS, LAB } from '../data/labs.js';

  // ── helpers passed to lab engine ──────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  let _prog = {};
  progress.subscribe(p => { _prog = p; });
  const getP = () => _prog;

  function labDoneCount(id) {
    const o = _prog.labs?.[id] || {};
    return (LABOBJ[id] || []).filter(x => o[x.k]).length;
  }
  function labTotal(id) { return (LABOBJ[id] || []).length; }
  function labComplete(id) { return labDoneCount(id) === labTotal(id); }

  function setObj(id, k) {
    progress.update(p => {
      if (!p.labs[id]) p.labs[id] = {};
      if (!p.labs[id][k]) {
        p.labs[id][k] = 1;
        if (labComplete(id)) toast('★ LAB CLEARED — ' + id.toUpperCase());
        else toast('✓ objective complete');
      }
      return p;
    });
    rngRefreshObj();
  }

  function objRows(id) {
    const o = _prog.labs?.[id] || {};
    return (LABOBJ[id] || []).map(x =>
      `<div class="obj" data-on="${o[x.k]?1:0}">
        <span class="tick">${o[x.k]?'[✓]':'[ ]'}</span>
        <span>${esc(x.t)}</span>
      </div>`
    ).join('');
  }

  function rngRefreshObj() {
    const el = document.getElementById('objlist');
    if (el && $nav.labId) el.innerHTML = objRows($nav.labId);
    const ind = document.getElementById('labprog');
    if (ind && $nav.labId) ind.textContent = labDoneCount($nav.labId) + '/' + labTotal($nav.labId) + ' objectives';
  }

  // ── state ─────────────────────────────────────────────────────────────────────
  $: activeLabId = $nav.labId;

  let labContainer;

  async function openLab(id) {
    nav.update(s => ({ ...s, labId: id }));
    await tick();
    renderLab(id);
  }

  function backToIndex() {
    nav.update(s => ({ ...s, labId: null }));
  }

  function renderLab(id) {
    if (!labContainer || !id) return;
    const renderer = LAB_RENDERERS[id];
    if (!renderer) { labContainer.innerHTML = `<p style="color:var(--ash)">Lab "${id}" not found.</p>`; return; }

    const meta = LABS.find(l => l.id === id);
    const head = `
      <div class="labtop">
        <button class="btn" id="lab-back-btn">‹ Range</button>
        <div><div class="eyebrow" style="color:var(--volt)">${esc(meta?.tool || '')}</div>
        <b style="font-size:20px;letter-spacing:-.01em">${esc(meta?.name || id)}</b></div>
        <span class="prog" id="labprog" style="margin-left:auto;font-family:var(--mono);color:var(--ash)">${labDoneCount(id)}/${labTotal(id)} objectives</span>
      </div>
      <div class="lab-workspace">
        <div class="objbox">
          <h4>Objectives</h4>
          <div id="objlist">${objRows(id)}</div>
        </div>
        <div class="lab-workspace-right" id="lab-right"></div>
      </div>
    `;

    labContainer.innerHTML = head;
    const right = labContainer.querySelector('#lab-right');
    if (right) right.innerHTML = renderer();

    // Wire back button
    const backBtn = labContainer.querySelector('#lab-back-btn');
    if (backBtn) backBtn.addEventListener('click', backToIndex);

    // Wire all interactive elements via event delegation on the container
    wireLabEvents(id);
  }

  function wireLabEvents(id) {
    labContainer.addEventListener('click', handleLabClick, { once: false });
    labContainer.addEventListener('keydown', handleLabKeydown, { once: false });
  }

  function handleLabClick(e) {
    const t = e.target;
    const id = $nav.labId;
    if (!id) return;

    // Data-copy: copy code to clipboard
    if (t.closest('[data-copy]')) {
      navigator.clipboard?.writeText(t.closest('[data-copy]').textContent.trim())
        .then(() => toast('✓ copied'));
      return;
    }

    // Memory lab chips
    if (t.dataset.memq) {
      const input = document.getElementById('memcmd');
      if (input) { input.value = t.dataset.memq; input.dispatchEvent(new Event('input')); input.focus(); }
      return;
    }

    // Memory lab submit
    if (t.dataset.memsubmit) {
      import('../data/labs.js').then(m => {
        const g = id => (document.getElementById(id) || {}).value || '';
        const pid = g('f_pid').trim(), c2 = g('f_c2').trim(), fl = g('f_flag').replace(/\s/g,'');
        if (pid === '4880') setObj('mem','malpid'); else if (pid) toast('PID ' + pid + ' is not the implant');
        if (/185\.220\.101\.47/.test(c2)) setObj('mem','c2'); else if (c2) toast('that is not the C2');
        if (fl === 'BV{m3m0ry_d0nt_l13}') setObj('mem','flag'); else if (fl) toast('flag mismatch');
      });
      return;
    }

    // Generic "submit" buttons with data-submit attribute
    const submitEl = t.closest('[data-submit]');
    if (submitEl) {
      handleGenericSubmit(submitEl.dataset.submit, id);
      return;
    }
  }

  function handleGenericSubmit(submitType, id) {
    // Delegate to lab-specific logic — each lab wires its own inputs
    toast('✓ checking…');
  }

  function handleLabKeydown(e) {
    const id = $nav.labId;
    const el = e.target;
    if (e.key !== 'Enter') return;

    // Memory terminal
    if (el.id === 'memcmd') {
      const val = el.value.trim();
      if (!val) return;
      import('../data/labs.js').then(({ memRunCommand }) => {
        memRunCommand(val);
        el.value = '';
      });
      return;
    }
  }

  // ── lifecycle ─────────────────────────────────────────────────────────────────
  onMount(() => {
    initLabs({ toast, setObj, labDoneCount, labTotal, labComplete, objRows, rngRefreshObj, esc, getP });
    if (activeLabId && labContainer) renderLab(activeLabId);
  });

  // Re-render lab when labId changes
  $: if (labContainer && activeLabId) {
    tick().then(() => renderLab(activeLabId));
  }
</script>

{#if !activeLabId}
  <!-- Lab index -->
  <div class="modehead">
    <div class="eyebrow" style="color:var(--volt)">Hands-on · cyber range</div>
    <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">The Range</h1>
    <p class="lede">No definitions — just artifacts and tools. Scored objectives, everything runs in your browser, progress saves locally.</p>
  </div>

  <div class="labgrid">
    {#each LABS as l}
      {@const d = labDoneCount(l.id)}
      {@const t = labTotal(l.id)}
      {@const pc = t ? Math.round(d / t * 100) : 0}
      <div class="labcard" data-done={d === t ? 1 : 0} on:click={() => openLab(l.id)}>
        <span class="chip t-{l.track}">{l.track}</span>
        <span class="prog"> · {l.tool}</span>
        <h3>{l.name}</h3>
        <p>{l.blurb}</p>
        <div class="prog">{d}/{t} objectives {d === t ? '· ✓ CLEARED' : ''}</div>
        <div class="pbar"><i style="width:{pc}%"></i></div>
      </div>
    {/each}
  </div>
{:else}
  <!-- Active lab — rendered imperatively into container -->
  <div bind:this={labContainer}></div>
{/if}
