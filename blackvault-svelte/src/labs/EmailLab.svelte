<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const MAIL = {
    headers: [
      { name: 'From', value: '"PayPaI Service" <service@paypa1-secure.com>', key: 'spoof' },
      { name: 'Return-Path', value: '<bounce@mailer-xyz.ru>' },
      { name: 'Reply-To', value: 'support@paypa1-secure.com' },
      { name: 'Received-SPF', value: 'fail (domain of paypal.com does not designate 45.133.1.88 as permitted sender)', key: 'spf' },
      { name: 'Authentication-Results', value: 'dkim=none; dmarc=fail (p=reject)', key: 'spf' },
      { name: 'Subject', value: 'Your account is limited — verify within 24h' },
    ],
    url: 'http://paypa1-secure.com/verify/login.php',
    attB64: 'PGh0bWw+PHNjcmlwdD5zdGVhbCgpPC9zY3JpcHQ+PC9odG1sPg==',
  };

  let flagged = {};
  let defanged = null;
  let decoded = null;
  let urlFlagged = false;

  function clickHeader(h, i) {
    if (h.key) {
      flagged[i] = 'correct';
      setObj('email', h.key, progress);
    } else {
      flagged[i] = 'wrong';
      toast('suspicious, maybe — but not the finding for either objective here');
    }
    flagged = flagged;
  }
  function defang() { defanged = MAIL.url.replace(/^http/, 'hxxp').replace(/\./g, '[.]'); }
  function flagUrl() { urlFlagged = true; setObj('email', 'url', progress); }
  function decodeAttachment() { decoded = atob(MAIL.attB64); setObj('email', 'payload', progress); }
</script>

<p class="lede" style="margin-top:0">Click the headers, link, and attachment yourself — nothing is pre-flagged.</p>
<div class="repane">
  <h5>raw headers — click a row to flag it</h5>
  <table class="kv">
    <tbody>
    {#each MAIL.headers as h, i}
      <tr class="hexbyte" data-hit={flagged[i] === 'correct' ? 1 : 0} on:click={() => clickHeader(h, i)}>
        <td style="color:var(--ash);width:180px">{h.name}</td>
        <td class={flagged[i] === 'correct' ? 'tag-bad' : ''}>{h.value}</td>
      </tr>
    {/each}
    </tbody>
  </table>
</div>
<div class="pcode" style="margin-top:12px">
  <span class="cm">// body link — click to flag as the phishing URL</span><br>
  <span class="xreflink" on:click={flagUrl}>{urlFlagged ? '🚩 ' : ''}{MAIL.url}</span>
  <button class="btn" style="padding:3px 9px;box-shadow:2px 2px 0 var(--volt);margin-left:10px" on:click={defang}>defang</button>
</div>
<div class="pktdetail" style="margin-top:8px">{defanged ?? 'defang the URL before sharing it…'}</div>
<div style="margin-top:12px"><button class="btn" on:click={decodeAttachment}>Decode attachment (base64)</button></div>
<div class="pktdetail" style="margin-top:8px">
  {#if decoded}attachment "invoice.html" (base64) decoded:
  <div class="hl">{decoded}</div>
  → an HTML file that runs script the moment it is opened.{:else}—{/if}
</div>
<div class="hintbox"><b>The tells:</b> SPF/DKIM/DMARC all fail, the From domain is a homoglyph of <code>paypal.com</code> (digit <code>1</code> for letter <code>l</code>), Return-Path is an unrelated <code>.ru</code>, and the "invoice" attachment is active HTML. Any one is suspicious; together it's a phish.</div>
