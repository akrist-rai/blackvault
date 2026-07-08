<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const flag = 'BV{dns_7unnel}', victim = '10.0.2.15', dnssrv = '10.0.2.3', dom = 'cdn-telemetry.xyz';
  let hex = ''; for (const ch of flag) hex += ch.charCodeAt(0).toString(16).padStart(2, '0');
  const chunks = []; for (let i = 0; i < hex.length; i += 4) chunks.push(hex.slice(i, i + 4));

  const pk = [];
  let no = 1;
  const add = o => { o.no = no++; pk.push(o); };
  const dnsDetail = q => `Domain Name System (query)\n    Transaction ID: 0x${(0x1000 + q.no).toString(16)}\n    Flags: 0x0100 Standard query\n    Questions: 1\n    Queries:\n        ${q.qname}: type A, class IN`;
  add({ t: '0.000000', proto: 'DNS', src: victim, dst: dnssrv, info: 'Standard query A www.google.com', qname: 'www.google.com' });
  add({ t: '0.013442', proto: 'DNS', src: dnssrv, dst: victim, info: 'Standard query response A 142.250.72.196', qname: 'www.google.com' });
  add({ t: '0.241006', proto: 'TLS', src: victim, dst: '142.250.72.196', info: 'Client Hello (SNI=www.google.com)' });
  add({ t: '1.004221', proto: 'HTTP', src: victim, dst: '93.184.216.34', info: 'GET /index.html HTTP/1.1' });
  let exfilNo = 0;
  const interleave = [
    { extra: { proto: 'DNS', src: victim, dst: dnssrv, info: 'Standard query A pool.ntp.org', qname: 'pool.ntp.org' } },
    { extra: { proto: 'HTTP', src: victim, dst: '93.184.216.34', info: 'GET /style.css HTTP/1.1' } },
    { extra: { proto: 'TLS', src: victim, dst: '13.107.42.14', info: 'Application Data' } },
  ];
  chunks.forEach((c, i) => {
    const q = `s${i}-${c}.${dom}`;
    add({ t: (2.5 + i * 0.9).toFixed(6), proto: 'DNS', src: victim, dst: dnssrv, info: 'Standard query A ' + q, qname: q, exfil: true, seq: i, chunk: c });
    if (interleave[exfilNo] && i % 2 === 1) { add(interleave[exfilNo].extra); exfilNo++; }
  });
  add({ t: '12.660000', proto: 'DNS', src: victim, dst: dnssrv, info: 'Standard query A update.microsoft.com', qname: 'update.microsoft.com' });
  pk.forEach(q => {
    if (q.proto === 'DNS' && !q.detail) q.detail = dnsDetail(q) + (q.exfil ? `\n\n[ note: ${q.qname.split('.')[0]} is not a hostname — it is base16 data smuggled in the subdomain ]` : '');
  });
  const pcapMeta = { dom, victim, flag, count: chunks.length };

  let filter = '';
  let selected = null;

  function match(q, f) {
    f = f.trim().toLowerCase();
    if (!f) return true;
    if (f === 'dns') return q.proto === 'DNS';
    if (f === 'http') return q.proto === 'HTTP';
    if (f === 'tls') return q.proto === 'TLS';
    let m = f.match(/^ip\.addr\s*==\s*(.+)$/); if (m) return q.src.includes(m[1].trim()) || q.dst.includes(m[1].trim());
    m = f.match(/^dns\.qry\.name\s+contains\s+(.+)$/); if (m) return (q.qname || '').toLowerCase().includes(m[1].trim());
    return (q.info + ' ' + (q.qname || '') + ' ' + q.src + ' ' + q.dst + ' ' + q.proto).toLowerCase().includes(f);
  }
  $: rows = pk.filter(q => match(q, filter));

  let detailText = 'click a packet to inspect it. The exfil hides in DNS A queries whose left-most label is not a hostname — it is hex-encoded data.';

  function selectRow(q) {
    selected = q.no;
    detailText = q.detail || `Frame ${q.no}: ${q.proto}\n  ${q.src} → ${q.dst}\n  ${q.info}`;
  }
  function reassemble() {
    const ex = pk.filter(q => q.exfil).sort((a, b) => a.seq - b.seq);
    const hx = ex.map(q => q.chunk).join('');
    let s = ''; for (let i = 0; i < hx.length; i += 2) s += String.fromCharCode(parseInt(hx.substr(i, 2), 16));
    detailText = 'Reassembling ' + ex.length + ' exfil subdomains, sorted by seq:\n  ' + ex.map(q => q.chunk).join(' ') + '\n  hex → ' + hx + '\n\n  DECODED: ' + s;
    setObj('pcap', 'flag', progress);
  }

  let p_dom = '', p_vic = '', p_cnt = '';
  function checkFindings() {
    let any = false;
    if (p_dom.trim().toLowerCase() === 'cdn-telemetry.xyz') { setObj('pcap', 'dom', progress); any = true; } else if (p_dom) toast('not the exfil domain — look for long random subdomains');
    if (p_vic.trim() === '10.0.2.15') { setObj('pcap', 'victim', progress); any = true; } else if (p_vic) toast('that host is not the source of the exfil queries');
    if (p_cnt.trim() === String(pcapMeta.count)) { setObj('pcap', 'count', progress); any = true; } else if (p_cnt) toast('recount — filter to just the exfil queries');
    if (any) toast('findings logged');
  }
</script>

<div class="filterbar">
  <input autocomplete="off" spellcheck="false" placeholder="display filter:  dns   ·   ip.addr == 10.0.2.15   ·   dns.qry.name contains telemetry" bind:value={filter}>
</div>
<div class="repane">
  <table class="pkts">
    <thead><tr><th>No.</th><th>Time</th><th>Proto</th><th>Source</th><th>Destination</th><th>Info</th></tr></thead>
    <tbody>
      {#each rows as q}
        <tr data-sel={selected === q.no ? 1 : 0} on:click={() => selectRow(q)}>
          <td>{q.no}</td><td>{q.t}</td><td class="pr-{q.proto}">{q.proto}</td><td>{q.src}</td><td>{q.dst}</td><td>{q.info}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<div class="pktdetail">{detailText}</div>
<div class="qchips" style="margin-top:12px"><button class="btn" style="box-shadow:3px 3px 0 var(--amber)" on:click={reassemble}>⛓ Reassemble exfil →</button></div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Exfil domain</label><input autocomplete="off" placeholder="e.g. evil.example" bind:value={p_dom}></div>
    <div><label>Victim host (IP)</label><input autocomplete="off" placeholder="e.g. 10.0.0.5" bind:value={p_vic}></div>
    <div class="full"><label># of exfil DNS queries</label><input autocomplete="off" placeholder="count them" bind:value={p_cnt}></div>
  </div>
  <div style="margin-top:12px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>Why this matters for your DNS filter:</b> DNS is rarely blocked, so attackers tunnel data out one query at a time — each subdomain is a chunk of base16/base32. The tells: one host firing many A-record lookups to the same parent domain, long high-entropy labels, and a sequence counter. That cadence is exactly what a good resolver policy should flag.</div>
