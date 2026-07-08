<script>
  import { nav, mastery } from '../stores/progress.js';

  const NAV = [
    { group: 'Learn',  items: [['map','Map'],['study','Study'],['arsenal','Arsenal'],['threads','Intel']] },
    { group: 'Labs',   items: [['case','Case'],['range','⚡ Range']] },
  ];

  function go(mode) { nav.update(s => ({ ...s, mode })); }
</script>

<div class="topbar">
  <div class="topbar__in">
    <div class="brand" role="button" tabindex="0"
      onclick={() => go('map')}
      onkeydown={e => e.key === 'Enter' && go('map')}>
      <b>SANC<i>TION</i></b>
      <span>Operator Console</span>
    </div>

    <div class="meter" title="Overall mastery">
      <span>MASTERY</span>
      <div class="meter__bar">
        <div class="meter__fill" style="width:{$mastery}%"></div>
      </div>
      <span>{$mastery}%</span>
    </div>

    <nav class="nav">
      {#each NAV as grp}
        <div class="nav-group">
          <span class="nav-label">{grp.group}</span>
          {#each grp.items as [mode, label]}
            <button
              aria-current={$nav.mode === mode ? 'true' : undefined}
              class={mode === 'range' ? 'nav-range' : ''}
              onclick={() => go(mode)}
            >{label}</button>
          {/each}
        </div>
      {/each}
      <div class="nav-group">
        <span class="nav-label">Tracks</span>
        <a class="nav-web" href="/web-security/blackvault-study-console.html">⬡ Web</a>
      </div>
    </nav>
  </div>
</div>
