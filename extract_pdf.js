const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');
const pages = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log('approx pages:', pages);

const reg = /stream\r?\n([\s\S]*?)endstream/g;
let m, count = 0, out = [];
while ((m = reg.exec(s)) !== null && count < 8000) {
  count++;
  const raw = Buffer.from(m[1], 'latin1');
  let t = null;
  try { t = zlib.inflateSync(raw).toString('latin1'); }
  catch (e) { continue; }
  // text inside ( ) followed by Tj, and TJ arrays
  const tj = t.match(/\(((?:\\.|[^()\\])*)\)\s*Tj/g) || [];
  const TJ = t.match(/\[((?:\\.|[^\]])*)\]\s*TJ/g) || [];
  const all = tj.concat(TJ);
  if (all.length) {
    // strip out the operators, keep parenthesized text
    const txt = all.map(x => {
      const pieces = x.match(/\(((?:\\.|[^()\\])*)\)/g) || [];
      return pieces.map(p => p.slice(1, -1)).join('');
    }).join(' ');
    out.push(txt);
  }
}
console.log('--- TEXT CHUNKS:', out.length);
console.log(out.join('\n'));
