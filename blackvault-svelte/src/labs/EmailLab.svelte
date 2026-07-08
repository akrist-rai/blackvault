<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const MAIL = {
    headers: [
      ['From', '"PayPaI Service" <service@paypa1-secure.com>', 1],
      ['Return-Path', '<bounce@mailer-xyz.ru>', 1],
      ['Reply-To', 'support@paypa1-secure.com', 1],
      ['Received-SPF', 'fail (domain of paypal.com does not designate 45.133.1.88 as permitted sender)', 1],
      ['Authentication-Results', 'dkim=none; dmarc=fail (p=reject)', 1],
      ['Subject', 'Your account is limited — verify within 24h', 0],
    ],
    url: 'http://paypa1-secure.com/verify/login.php',
    attB64: 'PGh0bWw+PHNjcmlwdD5zdGVhbCgpPC9zY3JpcHQ+PC9odG1sPg==',
  };

  let defanged = null;
  let decoded = null;
  let m_spf = '', m_dom = '', m_url = '';

  function defang() { defanged = MAIL.url.replace(/^http/, 'hxxp').replace(/\./g, '[.]'); }
  function decodeAttachment() { decoded = atob(MAIL.attB64); setObj('email', 'payload', progress); }
  function checkFindings() {
    if (/fail/i.test(m_spf)) setObj('email', 'spf', progress); else if (m_spf) toast('look at Received-SPF / DMARC');
    if (/paypa1/i.test(m_dom)) setObj('email', 'spoof', progress); else if (m_dom) toast('compare the From domain to real paypal.com — note the digit 1');
    if (/paypa1-secure\.com/i.test(m_url)) setObj('email', 'url', progress); else if (m_url) toast('the body link points where?');
  }
</script>

<div class="repane">
  <h5>raw headers</h5>
  <table class="kv">
    <tbody>
    {#each MAIL.headers as h}<tr><td style="color:var(--ash)">{h[0]}</td><td class={h[2] ? 'tag-bad' : ''}>{h[1]}</td></tr>{/each}
    </tbody>
  </table>
</div>
<div class="pcode" style="margin-top:12px">
  <span class="cm">// body link</span>  {MAIL.url}   <button class="btn" style="padding:3px 9px;box-shadow:2px 2px 0 var(--volt)" on:click={defang}>defang</button>
</div>
<div class="pktdetail" style="margin-top:8px">{defanged ?? 'defang the URL before sharing it…'}</div>
<div style="margin-top:12px"><button class="btn" on:click={decodeAttachment}>Decode attachment (base64)</button></div>
<div class="pktdetail" style="margin-top:8px">
  {#if decoded}attachment "invoice.html" (base64) decoded:
  <div class="hl">{decoded}</div>
  → an HTML file that runs script the moment it is opened.{:else}—{/if}
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Auth result (spf/dmarc)</label><input placeholder="pass/fail" bind:value={m_spf}></div>
    <div><label>Sender domain</label><input placeholder="lookalike domain" bind:value={m_dom}></div>
    <div class="full"><label>Phishing URL</label><input placeholder="http://..." bind:value={m_url}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>The tells:</b> SPF/DKIM/DMARC all fail, the From domain is a homoglyph of <code>paypal.com</code> (digit <code>1</code> for letter <code>l</code>), Return-Path is an unrelated <code>.ru</code>, and the "invoice" attachment is active HTML. Any one is suspicious; together it's a phish.</div>
