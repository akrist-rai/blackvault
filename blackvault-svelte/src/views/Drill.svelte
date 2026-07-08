<script>
  import { nav, progress, toast } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';
  import { onMount } from 'svelte';

  let deck = 'all';
  let cardIdx = 0;
  let flipped = false;

  $: allCards = PHASES.flatMap(p => p.cards.map(c => ({ ...c, id: p.id, n: p.n, title: p.title })));
  $: cards = (() => {
    if (deck === 'weak') return allCards.filter(c => !$progress.cards?.[c.id + ':' + c.f]);
    if (deck === 'all') return allCards;
    const p = PHASES[+deck];
    return p ? p.cards.map(c => ({ ...c, id: p.id, n: p.n, title: p.title })) : [];
  })();
  $: if (cardIdx >= cards.length) cardIdx = 0;
  $: card = cards[cardIdx] || null;
  $: known = card ? !!$progress.cards?.[card.id + ':' + card.f] : false;

  function prev() { flipped = false; cardIdx = (cardIdx - 1 + cards.length) % cards.length; }
  function next() { flipped = false; cardIdx = (cardIdx + 1) % cards.length; }
  function flip() { flipped = !flipped; }

  function markKnown() {
    if (!card) return;
    const key = card.id + ':' + card.f;
    progress.update(p => ({ ...p, cards: { ...p.cards, [key]: p.cards?.[key] ? 0 : 1 } }));
    toast(known ? 'removed from known' : '✓ marked known');
  }

  function shuffle() {
    cardIdx = Math.floor(Math.random() * cards.length);
    flipped = false;
  }

  function setDeck(d) { deck = d; cardIdx = 0; flipped = false; }

  onMount(() => {
    const handler = (e) => {
      if (e.key === ' ') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'k' || e.key === 'K') markKnown();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
</script>

<div class="modehead">
  <div class="eyebrow">Active recall</div>
  <h1 class="h1" style="font-size:clamp(24px,4vw,34px)">Flashcards</h1>
  {#if cards.length > 0}
    <p class="lede">Read the prompt, answer in your head, THEN flip. <span style="color:var(--ash)">Keys: Space flip · ← → move · K know</span></p>
  {/if}
</div>

<div class="deckpick">
  <button data-deck="all" aria-current={deck === 'all'} on:click={() => setDeck('all')}>
    All decks ({allCards.length})
  </button>
  {#each PHASES as p, i}
    <button data-deck={i} aria-current={deck == String(i)} on:click={() => setDeck(String(i))}>P{p.n}</button>
  {/each}
  <button data-deck="weak" aria-current={deck === 'weak'} on:click={() => setDeck('weak')}>★ Unknown only</button>
</div>

{#if cards.length === 0}
  <div class="emptybox">
    <b>Nothing here</b>
    {deck === 'weak' ? "You've marked every card known. Switch decks or reset known flags from a card." : 'This deck is empty.'}
  </div>
{:else if card}
  <div class="cardstage">
    {#if cards.length > 2}<div class="card-stack-bg-2"></div>{/if}
    {#if cards.length > 1}<div class="card-stack-bg"></div>{/if}
    <div class="flashcard" data-flip={flipped ? 1 : 0} on:click={flip} tabindex="0"
      on:keydown={e => e.key === 'Enter' && flip()}>
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
      <button class="iconbtn" on:click={prev}>◂ Prev</button>
      <span class="counter">{cardIdx + 1} / {cards.length}</span>
      <button class="iconbtn" on:click={next}>Next ▸</button>
      <button class="iconbtn iconbtn--know" on:click={markKnown}>{known ? '✓ Known' : 'Mark known'}</button>
      <button class="iconbtn" on:click={shuffle}>⤨ Shuffle</button>
    </div>
  </div>
{/if}
