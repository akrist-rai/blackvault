<script>
  import { nav, mastery } from '../stores/progress.js';

  const MODES = [
    { group: 'Learn',    items: [['map','Map'],['study','Study'],['arsenal','Arsenal'],['threads','Threads']] },
    { group: 'Practice', items: [['drill','Drill'],['case','Case'],['range','Range']] },
    { group: 'Test',     items: [['quiz','Quiz'],['exam','Exam'],['review','Review']] },
  ];

  function go(mode) { nav.update(s => ({ ...s, mode })); }
</script>

<div class="topbar">
  <div class="topbar__in">
    <div class="brand" on:click={() => go('map')}>
      <b>BLACK<i>VAULT</i></b>
      <span>Study Console · 12 Phases</span>
    </div>

    <div class="meter" title="Overall mastery">
      <span>MASTERY</span>
      <div class="meter__bar">
        <div class="meter__fill" style="width:{$mastery}%"></div>
      </div>
      <span>{$mastery}%</span>
    </div>

    <nav class="nav">
      {#each MODES as grp}
        <div class="nav-group">
          <span class="nav-label">{grp.group}</span>
          {#each grp.items as [mode, label]}
            <button
              data-active={$nav.mode === mode}
              style={mode === 'range' ? 'color:var(--volt)' : ''}
              on:click={() => go(mode)}
            >{mode === 'range' ? '⚡ ' : ''}{label}</button>
          {/each}
        </div>
      {/each}
    </nav>
  </div>
</div>
