<script>
  import { nav, progress, toast } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';

  // Phase filter: null = all phases
  $: phaseFilter = $nav.quizPhase;
  $: questions = (() => {
    const list = phaseFilter != null ? [PHASES[phaseFilter]] : PHASES;
    return list.flatMap(p => p.quiz.map((q, i) => ({ ...q, phase: p, key: p.id + ':' + i, idx: i })));
  })();

  let qIdx = 0;
  let picked = null;
  let submitted = false;

  $: q = questions[qIdx] || null;
  $: answer = q ? ($progress.quiz?.[q.key] ?? null) : null;

  function pick(i) {
    if (submitted) return;
    picked = i;
  }

  function submit() {
    if (picked === null || !q) return;
    const correct = picked === q.a;
    progress.update(p => {
      if (!p.quiz) p.quiz = {};
      if (!p.quizPick) p.quizPick = {};
      p.quiz[q.key] = correct ? 1 : 0;
      p.quizPick[q.key] = picked;
      return p;
    });
    submitted = true;
    toast(correct ? '✓ Correct!' : '✗ Incorrect');
  }

  function advance() {
    if (qIdx < questions.length - 1) { qIdx++; picked = null; submitted = false; }
  }
  function back() {
    if (qIdx > 0) { qIdx--; picked = null; submitted = false; }
  }

  function setPhase(v) {
    nav.update(s => ({ ...s, quizPhase: v }));
    qIdx = 0; picked = null; submitted = false;
  }

  $: score = questions.filter(q => $progress.quiz?.[q.key] === 1).length;
</script>

<div class="modehead">
  <div class="eyebrow">Knowledge check</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Quiz</h1>
  <p class="lede">Multiple choice — choose the best answer, then submit.</p>
</div>

<!-- Phase picker -->
<div class="deckpick" style="margin-bottom:20px">
  <button aria-current={phaseFilter === null} on:click={() => setPhase(null)}>
    All phases ({questions.length} questions)
  </button>
  {#each PHASES as p, i}
    <button aria-current={phaseFilter === i} on:click={() => setPhase(i)}>P{p.n}</button>
  {/each}
</div>

<!-- Score bar -->
<div style="font-family:var(--mono);font-size:12px;color:var(--ash);margin-bottom:16px">
  Score: <b style="color:var(--jade)">{score}</b> / {questions.length} &nbsp;·&nbsp;
  Question {qIdx + 1} of {questions.length}
</div>

{#if q}
  <div class="qcard">
    <div class="qcard__meta">
      <span>Phase {q.phase.n} · {q.phase.title}</span>
      {#if $progress.quiz?.[q.key] === 1}
        <span style="color:var(--jade)">✓ Correct</span>
      {:else if $progress.quiz?.[q.key] === 0}
        <span style="color:var(--blood)">✗ Missed</span>
      {/if}
    </div>
    <div class="qcard__q">{q.q}</div>

    <div class="opts">
      {#each q.o as opt, i}
        <button class="opt"
          class:correct={submitted && i === q.a}
          class:wrong={submitted && picked === i && i !== q.a}
          class:selected={picked === i && !submitted}
          on:click={() => pick(i)}>
          <b>{String.fromCharCode(65 + i)}</b> {opt}
        </button>
      {/each}
    </div>

    {#if submitted && q.e}
      <div class="hintbox" style="margin-top:14px">{q.e}</div>
    {/if}

    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      {#if !submitted}
        <button class="btn" on:click={submit} disabled={picked === null}>Submit answer</button>
      {:else}
        <button class="btn" on:click={advance} disabled={qIdx >= questions.length - 1}>Next →</button>
      {/if}
      <button class="iconbtn" on:click={back} disabled={qIdx === 0}>◂ Prev</button>
    </div>
  </div>
{/if}

<style>
  .opt { display:block; width:100%; text-align:left; padding:10px 14px; margin-bottom:8px;
    background:var(--surface-2); border:1.5px solid var(--line); color:var(--bone); cursor:pointer; font-size:14px; }
  .opt:hover { border-color:var(--volt); }
  .opt.selected { border-color:var(--volt); background:rgba(29,227,232,.08); }
  .opt.correct  { border-color:var(--jade); background:rgba(45,232,154,.12); color:var(--jade); }
  .opt.wrong    { border-color:var(--blood); background:rgba(248,50,72,.1); color:var(--blood); }
</style>
