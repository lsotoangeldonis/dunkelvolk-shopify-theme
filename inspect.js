const fs = require('fs');
const file = process.argv[2];
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');
const wantObjs = process.argv.slice(3).map(Number);
const objRe = /(\d+)\s+(\d+)\s+obj/g; let m; const starts = [];
while ((m = objRe.exec(s)) !== null) starts.push({ num: +m[1], hdrAt: m.index + m[0].length });
for (const o of starts) {
  if (!wantObjs.includes(o.num)) continue;
  const endObj = s.indexOf('endobj', o.hdrAt);
  const seg = s.slice(o.hdrAt, endObj);
  const sIdx = seg.indexOf('stream');
  const header = sIdx >= 0 ? seg.slice(0, sIdx) : seg;
  console.log('=== obj', o.num, '===');
  console.log(header.trim().slice(0, 600));
}
