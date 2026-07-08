<script>
  import { progress, setObj } from '../stores/progress.js';

  const STG = { appendFlag: 'BV{4pp3nd3d_z1p}', metaFlag: 'BV{m3ta_h1des}', lsbFlag: 'BV{lsb_b1ts}' };
  let lines = null;

  function run(w) {
    if (w === 'append') {
      lines = [
        { kind: '', text: '$ binwalk photo.jpg' },
        { kind: '', text: '  0x0     JPEG image data' },
        { kind: 'hl', text: '  0x4F1A  Zip archive (data AFTER the FF D9 end-of-image marker)' },
        { kind: '', text: '$ unzip -p photo.jpg' },
        { kind: 'hl', text: '  secret.txt: ' + STG.appendFlag },
      ];
      setObj('stego', 'append', progress);
    } else if (w === 'meta') {
      lines = [
        { kind: '', text: '$ exiftool photo.jpg' },
        { kind: '', text: '  Make            : Canon' },
        { kind: '', text: '  Software        : GIMP 2.10' },
        { kind: 'hl', text: '  User Comment    : ' + STG.metaFlag },
      ];
      setObj('stego', 'meta', progress);
    } else if (w === 'lsb') {
      let bits = [];
      for (const ch of STG.lsbFlag) { const b = ch.charCodeAt(0).toString(2).padStart(8, '0'); for (const x of b) bits.push(+x); }
      let s = ''; for (let i = 0; i < bits.length; i += 8) s += String.fromCharCode(parseInt(bits.slice(i, i + 8).join(''), 2));
      lines = [
        { kind: '', text: '$ extract LSB of each pixel byte → regroup into bytes:' },
        { kind: '', text: '  bits: ' + bits.join('') },
        { kind: 'hl', text: '  ascii: ' + s },
      ];
      setObj('stego', 'lsb', progress);
    }
  }
</script>

<p class="lede" style="margin-top:0">One file, three hiding spots. Run each tool and carve out the flag.</p>
<pre class="pcode"><span class="cm">// photo.jpg structure</span>
FF D8 FF E0  JFIF header
...          image scan data
FF D9        &lt;-- JPEG end-of-image (EOF)
50 4B 03 04  &lt;-- ??? bytes living past the EOF</pre>
<div class="qchips" style="margin-top:12px">
  <button on:click={() => run('append')}>binwalk / carve trailing bytes</button>
  <button on:click={() => run('meta')}>exiftool (read metadata)</button>
  <button on:click={() => run('lsb')}>extract pixel LSBs</button>
</div>
<div class="pktdetail" style="margin-top:12px">
  {#if lines}{#each lines as l}<div class={l.kind}>{l.text}</div>{/each}{:else}run a tool above…{/if}
</div>
<div class="hintbox"><b>Real reflexes:</b> always check for data after the format's EOF marker (<code>binwalk</code>, <code>foremost</code>), read metadata (<code>exiftool</code>), and for images suspect the least-significant bits when file size looks off vs. content.</div>
