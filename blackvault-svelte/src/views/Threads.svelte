<script>
  import { THREADS } from '../data/curriculum.js';

  let openPyramid = {};
  let openKC = {};

  const T = THREADS;

  const IMAGES = [
    '_ (21).jpeg', '_ - 2026-05-30T131710.853.jpeg', '(1) Home _ X.jpeg',
    '(4) Instagram.jpeg', 'LS (@LS182_520) on X.jpeg',
    'm a i k ⚡ comms (@maik_check) on X.jpeg', '彡 by budkalon – twt.jpeg',
    '_ (70).jpeg', '_ (80).jpeg',
  ];
  const STRIP = [...IMAGES, ...IMAGES];
</script>

<div class="modehead">
  <div class="eyebrow">Cross-cutting principles</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Threads</h1>
  <p class="lede">The ideas that run through every phase. Memorizing tools is fragile; these principles are what actually transfer to an unknown sample.</p>
</div>

<div class="imgstrip-wrap" aria-hidden="true">
  <div class="imgstrip">
    {#each STRIP as img}
      <div class="imgstrip__tile">
        <img src="/images/{encodeURIComponent(img)}" alt="" loading="lazy" />
      </div>
    {/each}
  </div>
</div>

<div class="threadgrid">

  <!-- Pain Pyramid -->
  <div class="thread">
    <div class="thread__h">
      <span class="dot" style="background:{T.pyramid.accent}"></span>
      <h3>{T.pyramid.name}</h3>
    </div>
    <p class="thread__blurb">{T.pyramid.blurb}</p>
    <div class="pyramid">
      {#each T.pyramid.tiers as t, i}
        <div class="ptier" data-open={openPyramid[i] ? 1 : 0}
          style="width:{t.w}%;border-color:{t.c};color:{t.c}"
          on:click={() => openPyramid = { ...openPyramid, [i]: !openPyramid[i] }}>
          <b>{t.b}</b>{t.pain}
          <div class="note">{t.note}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Cross-view table -->
  <div class="thread">
    <div class="thread__h">
      <span class="dot" style="background:{T.crossview.accent}"></span>
      <h3>{T.crossview.name}</h3>
    </div>
    <p class="thread__blurb">{T.crossview.blurb}</p>
    <table class="xv">
      <thead>
        <tr><th>To expose…</th><th>View A</th><th>vs View B</th><th>Phase</th></tr>
      </thead>
      <tbody>
        {#each T.crossview.rows as r}
          <tr><td>{r[0]}</td><td><code>{r[1]}</code></td><td><code>{r[2]}</code></td><td>{r[3]}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- SBD Loop -->
  <div class="thread">
    <div class="thread__h">
      <span class="dot" style="background:{T.sbd.accent}"></span>
      <h3>{T.sbd.name}</h3>
    </div>
    <p class="thread__blurb">{T.sbd.blurb}</p>
    <div class="loop">
      {#each T.sbd.loop as s, i}
        <span class="loopstep" style="--accent:{T.sbd.accent}">{s}</span>
        {#if i < T.sbd.loop.length - 1}
          <span class="looparr">→</span>
        {:else}
          <span class="looparr">↺</span>
        {/if}
      {/each}
    </div>
  </div>

  <!-- OIL Loop -->
  <div class="thread">
    <div class="thread__h">
      <span class="dot" style="background:{T.oil.accent}"></span>
      <h3>{T.oil.name}</h3>
    </div>
    <p class="thread__blurb">{T.oil.blurb}</p>
    <div class="loop">
      {#each T.oil.loop as s, i}
        <span class="loopstep" style="--accent:{T.oil.accent}">{s}</span>
        {#if i < T.oil.loop.length - 1}<span class="looparr">→</span>{/if}
      {/each}
    </div>
  </div>

  <!-- Kill Chain -->
  <div class="thread">
    <div class="thread__h">
      <span class="dot" style="background:{T.killchain.accent}"></span>
      <h3>{T.killchain.name}</h3>
    </div>
    <p class="thread__blurb">{T.killchain.blurb}</p>
    <div class="kc">
      {#each T.killchain.stages as s, i}
        <div class="kcstage" data-open={openKC[i] ? 1 : 0}
          on:click={() => openKC = { ...openKC, [i]: !openKC[i] }}>
          <b>{s.b}</b><span>{s.s}</span>
          <div class="map">→ {s.m}</div>
        </div>
      {/each}
    </div>
  </div>

</div>
