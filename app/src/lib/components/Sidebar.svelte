<script>
  import { page } from '$app/stores';
  import { mastery } from '$lib/stores';
  import { goto } from '$app/navigation';

  const NAV = [
    { group: 'HOME',      items: [
      { href: '/',          label: 'Landing',    icon: '◈' },
      { href: '/console',   label: 'Dashboard',  icon: '⬡' },
    ]},
    { group: 'LEARN',     items: [
      { href: '/console/study',   label: 'Study',       icon: '▣' },
      { href: '/console/drill',   label: 'Flashcards',  icon: '◧' },
      { href: '/console/quiz',    label: 'Quiz',         icon: '◉' },
      { href: '/console/exam',    label: 'Exam',         icon: '◈' },
    ]},
    { group: 'REFERENCE', items: [
      { href: '/intel',    label: 'Intel',        icon: '◈' },
      { href: '/tools',    label: 'Arsenal',      icon: '◧' },
      { href: '/console/attack', label: 'ATT&CK', icon: '◉' },
    ]},
    { group: 'OPS',       items: [
      { href: '/console/range',  label: 'Range Labs',  icon: '▣' },
      { href: '/console/case',   label: 'Cases',        icon: '◉' },
      { href: '/console/badges', label: 'Badges',       icon: '◈' },
      { href: '/playbook',       label: 'Playbooks',    icon: '◧' },
    ]},
  ];

  $: pct = $mastery;
  $: meterColor = pct >= 75 ? 'var(--volt)' : pct >= 40 ? 'var(--amber)' : 'var(--blood)';

  function active(href) {
    if (href === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(href);
  }
</script>

<aside class="sidebar">
  <a class="brand" href="/">
    <div class="brand-logo">BLACK<em>VAULT</em></div>
    <div class="brand-sub">Security Training Range</div>
  </a>

  <div class="meter-wrap">
    <div class="meter-bar">
      <div class="meter-fill" style="width:{pct}%; background:{meterColor}"></div>
    </div>
    <div class="meter-label">
      <strong>{pct}%</strong> MASTERY
    </div>
  </div>

  <nav>
    {#each NAV as section}
      <div class="nav-group-lbl">{section.group}</div>
      {#each section.items as item}
        <a
          href={item.href}
          class="nav-item"
          class:active={active(item.href)}
          aria-current={active(item.href) ? 'page' : undefined}
        >
          <span class="nav-icon">{item.icon}</span>
          {item.label}
        </a>
      {/each}
    {/each}
  </nav>

  <div class="sb-foot">
    <div class="sb-foot-links">
      <a href="/tools">Tools</a>
      <a href="/intel">Intel</a>
      <a href="/playbook">Playbooks</a>
    </div>
    <div class="sb-version">BLACKVAULT v0.2</div>
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sb);
    min-width: var(--sb);
    background: var(--panel);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    height: 100dvh;
    position: sticky;
    top: 0;
    overflow-y: auto;
    flex-shrink: 0;
    z-index: 100;
  }

  .brand {
    display: block;
    padding: 20px 16px 14px;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
  }
  .brand-logo {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: .12em;
    color: var(--bone);
  }
  .brand-logo em {
    font-style: normal;
    color: var(--volt);
  }
  .brand-sub {
    font-size: 10px;
    color: var(--ash);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .meter-wrap {
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }
  .meter-bar {
    height: 3px;
    background: var(--line2);
    border-radius: 2px;
    overflow: hidden;
  }
  .meter-fill {
    height: 100%;
    border-radius: 2px;
    transition: width .6s ease, background .4s ease;
  }
  .meter-label {
    font-size: 10px;
    letter-spacing: .08em;
    color: var(--ash);
    text-transform: uppercase;
    margin-top: 5px;
  }
  .meter-label strong { color: var(--bone); }

  nav {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
  }
  .nav-group-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .14em;
    color: var(--dim);
    padding: 10px 16px 4px;
    text-transform: uppercase;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ash);
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: color .15s, background .15s, border-color .15s;
    letter-spacing: .02em;
  }
  .nav-item:hover {
    color: var(--bone);
    background: var(--panel2);
    text-decoration: none;
  }
  .nav-item.active {
    color: var(--volt);
    border-left-color: var(--volt);
    background: color-mix(in srgb, var(--volt) 6%, transparent);
  }
  .nav-icon {
    font-size: 10px;
    opacity: .5;
    flex-shrink: 0;
  }
  .nav-item.active .nav-icon { opacity: 1; }

  .sb-foot {
    padding: 12px 16px;
    border-top: 1px solid var(--line);
    font-size: 11px;
  }
  .sb-foot-links {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .sb-foot-links a { color: var(--ash); font-size: 11px; }
  .sb-foot-links a:hover { color: var(--volt); text-decoration: none; }
  .sb-version { font-size: 10px; color: var(--dim); letter-spacing: .06em; }
</style>
