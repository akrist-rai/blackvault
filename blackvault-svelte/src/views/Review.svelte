<script>
  import { progress, toast } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';

  $: missedQuiz = PHASES.flatMap(p =>
    p.quiz.map((q, i) => ({ ...q, phase: p, key: p.id + ':' + i, idx: i }))
  ).filter(q => $progress.quiz?.[q.key] === 0 && $progress.quizPick?.[q.key] != null);

  $: unknownCards = PHASES.flatMap(p =>
    p.cards.map(c => ({ ...c, pid: p.id, n: p.n, title: p.title }))
  ).filter(c => !$progress.cards?.[c.pid + ':' + c.f]);

  let picked = {};
  let submitted = {};

  function pick(key, i) {
    if (submitted[key]) return;
    picked = { ...picked, [key]: i };
  }

  function submitQ(q) {
    const correct = picked[q.key] === q.a;
    progress.update(p => {
      p.quiz[q.key] = correct ? 1 : 0;
      p.quizPick[q.key] = picked[q.key];
      return p;
    });
    submitted = { ...submitted, [q.key]: true };
    toast(correct ? '✓ Correct!' : '✗ Incorrect');
  }

  let cardIdx = 0;
  let flipped = false;
  $: card = unknownCards[cardIdx] || null;

  function nextCard() { flipped = false; cardIdx = (cardIdx + 1) % unknownCards.length; }
  function markKnown() {
    if (!card) return;
    const key = card.pid + ':' + card.f;
    progress.update(p => ({ ...p, cards: { ...p.cards, [key]: 1 } }));
    toast('✓ marked known');
  }
</script>

<div class="modehead">
  <div class="eyebrow">Targeted remediation</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Review</h1>
  <p class="lede">Only your missed questions and unknown flashcards. Nothing else.</p>
</div>

{#if missedQuiz.length === 0 && unknownCards.length === 0}
  <div class="emptybox">
    <b>Nothing to review!</b> You've answered every quiz question correctly and marked all cards known.
  </div>
{/if}

<!-- Missed quiz questions -->
{#if missedQuiz.length > 0}
  <div class="sec__h" style="margin:24px 0 16px">Missed quiz questions ({missedQuiz.length})</div>
  {#each missedQuiz as q}
    <div class="qcard" style="margin-bottom:16px">
      <div class="qcard__meta">
        <span>Phase {q.phase.n} · {q.phase.title}</span>
        {#if submitted[q.key]}
          {#if picked[q.key] === q.a}
            <span style="color:var(--jade)">✓ Correct this time</span>
          {:else}
            <span style="color:var(--blood)">✗ Still wrong</span>
          {/if}
        {:else}
          <span style="color:var(--blood)">Previously missed</span>
        {/if}
      </div>
      <div class="qcard__q">{q.q}</div>
      <div class="opts">
        {#each q.o as opt, i}
          <button class="opt"
            class:correct={submitted[q.key] && i === q.a}
            class:wrong={submitted[q.key] && picked[q.key] === i && i !== q.a}
            class:selected={!submitted[q.key] && picked[q.key] === i}
            on:click={() => pick(q.key, i)}>
            <b>{String.fromCharCode(65 + i)}</b> {opt}
          </button>
        {/each}
      </div>
      {#if submitted[q.key] && q.e}
        <div class="hintbox" style="margin-top:10px">{q.e}</div>
      {/if}
      {#if !submitted[q.key]}
        <button class="btn" style="margin-top:12px" on:click={() => submitQ(q)} disabled={picked[q.key] === undefined}>
          Submit
        </button>
      {/if}
    </div>
  {/each}
{/if}

<!-- Unknown flashcards -->
{#if unknownCards.length > 0}
  <div class="sec__h" style="margin:32px 0 16px">Unknown flashcards ({unknownCards.length})</div>
  {#if card}
    <div class="cardstage">
      <div class="flashcard" data-flip={flipped ? 1 : 0} on:click={() => flipped = !flipped} tabindex="0">
        <div class="flashcard__in">
          <div class="face face--front">
            <small>Phase {card.n} · {card.title}</small>
            <div class="q">{card.f}</div>
            <div class="hint">tap to reveal</div>
          </div>
          <div class="face face--back">
            <small>Answer</small>
            <div class="a">{card.b}</div>
            <div class="hint">tap to flip back</div>
          </div>
        </div>
      </div>
      <div class="cardctl">
        <span class="counter">{cardIdx + 1} / {unknownCards.length}</span>
        <button class="iconbtn" on:click={nextCard}>Next ▸</button>
        <button class="iconbtn iconbtn--know" on:click={markKnown}>Mark known</button>
      </div>
    </div>
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
