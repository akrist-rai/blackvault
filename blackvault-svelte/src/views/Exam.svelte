<script>
  import { progress, toast } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';
  import { onMount } from 'svelte';

  // Build a shuffled exam set from all quiz questions
  let examSet = null;
  let examPicks = {};
  let submitted = false;

  function buildExam() {
    const all = PHASES.flatMap(p => p.quiz.map((q, i) => ({ ...q, phase: p, key: p.id + ':' + i })));
    // Shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    examSet = all.slice(0, Math.min(all.length, 30)); // cap at 30 for exam
    examPicks = {};
    submitted = false;
  }

  onMount(buildExam);

  function pick(key, i) {
    if (submitted) return;
    examPicks = { ...examPicks, [key]: i };
  }

  function submitExam() {
    if (!examSet) return;
    progress.update(p => {
      if (!p.quiz) p.quiz = {};
      if (!p.quizPick) p.quizPick = {};
      examSet.forEach(q => {
        if (examPicks[q.key] !== undefined) {
          p.quiz[q.key] = examPicks[q.key] === q.a ? 1 : 0;
          p.quizPick[q.key] = examPicks[q.key];
        }
      });
      return p;
    });
    submitted = true;
    toast('Exam submitted');
  }

  $: score = examSet ? examSet.filter(q => examPicks[q.key] === q.a).length : 0;
  $: total = examSet?.length || 0;
</script>

<div class="modehead">
  <div class="eyebrow">Cumulative test</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Exam Mode</h1>
  <p class="lede">Up to 30 randomised questions from all phases. Answer all, then submit.</p>
</div>

{#if !examSet}
  <p style="color:var(--ash)">Building exam…</p>
{:else}
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:24px;flex-wrap:wrap">
    <button class="btn" on:click={buildExam}>New exam set ↻</button>
    {#if submitted}
      <span style="font-family:var(--mono);font-size:14px">
        Score: <b style="color:{score/total > 0.7 ? 'var(--jade)' : 'var(--blood)'}">{score} / {total}</b>
        ({Math.round(score/total*100)}%)
      </span>
    {:else}
      <span style="font-family:var(--mono);font-size:12px;color:var(--ash)">
        {Object.keys(examPicks).length} / {total} answered
      </span>
    {/if}
  </div>

  {#each examSet as q, qi}
    <div class="qcard" style="margin-bottom:20px">
      <div class="qcard__meta">
        <span>{qi + 1}. Phase {q.phase.n} · {q.phase.title}</span>
        {#if submitted}
          {#if examPicks[q.key] === q.a}
            <span style="color:var(--jade)">✓ Correct</span>
          {:else if examPicks[q.key] !== undefined}
            <span style="color:var(--blood)">✗ Wrong</span>
          {:else}
            <span style="color:var(--ash)">— Skipped</span>
          {/if}
        {/if}
      </div>
      <div class="qcard__q">{q.q}</div>
      <div class="opts">
        {#each q.o as opt, i}
          <button class="opt"
            class:correct={submitted && i === q.a}
            class:wrong={submitted && examPicks[q.key] === i && i !== q.a}
            class:selected={!submitted && examPicks[q.key] === i}
            on:click={() => pick(q.key, i)}>
            <b>{String.fromCharCode(65 + i)}</b> {opt}
          </button>
        {/each}
      </div>
      {#if submitted && q.e}
        <div class="hintbox" style="margin-top:10px">{q.e}</div>
      {/if}
    </div>
  {/each}

  {#if !submitted}
    <button class="btn" style="margin-bottom:40px" on:click={submitExam}>Submit exam</button>
  {:else}
    <button class="btn--ghost btn" style="margin-bottom:40px" on:click={buildExam}>Retake with new set ↻</button>
  {/if}
{/if}

<style>
  .opt { display:block; width:100%; text-align:left; padding:10px 14px; margin-bottom:8px;
    background:var(--surface-2); border:1.5px solid var(--line); color:var(--bone); cursor:pointer; font-size:14px; }
  .opt:hover { border-color:var(--volt); }
  .opt.selected { border-color:var(--volt); background:rgba(29,227,232,.08); }
  .opt.correct  { border-color:var(--jade); background:rgba(45,232,154,.12); color:var(--jade); }
  .opt.wrong    { border-color:var(--blood); background:rgba(248,50,72,.1); color:var(--blood); }
</style>
