const fs = require('fs');
const file = process.argv[2];
const outDir = process.argv[3] || 'pdf_imgs';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');

// Find all object headers with DCTDecode (JPEG) and dump the raw stream bytes.
let count = 0;
const objRe = /(\d+)\s+(\d+)\s+obj([\s\S]*?)stream\r?\n/g;
let m;
const found = [];
while ((m = objRe.exec(s)) !== null) {
  const header = m[3];
  if (!/DCTDecode/.test(header)) continue;
  const streamStart = m.index + m[0].length;
  // find endstream
  const end = s.indexOf('endstream', streamStart);
  if (end < 0) continue;
  let len = end - streamStart;
  // trim trailing EOL before endstream
  const slice = buf.slice(streamStart, streamStart + len);
  // dims
  const w = (header.match(/\/Width\s+(\d+)/) || [])[1];
  const h = (header.match(/\/Height\s+(\d+)/) || [])[1];
  found.push({ obj: m[1], w: +w || 0, h: +h || 0, start: streamStart, buf: slice });
}
console.log('JPEG images found:', found.length);
found.forEach((f, i) => {
  const name = `${outDir}/img_${String(i + 1).padStart(2, '0')}_obj${f.obj}_${f.w}x${f.h}.jpg`;
  fs.writeFileSync(name, f.buf);
  console.log(name, Math.round(f.buf.length / 1024) + 'KB');
});
