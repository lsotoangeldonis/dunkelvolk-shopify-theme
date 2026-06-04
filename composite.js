const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const wantFrom = +(process.argv[3] || 1), wantTo = +(process.argv[4] || 999);
const outDir = process.argv[5] || 'pdf_pages';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const buf = fs.readFileSync(file); const s = buf.toString('latin1');

const objIndex = {};
const objRe = /(\d+)\s+(\d+)\s+obj/g; let m; const starts = [];
while ((m = objRe.exec(s)) !== null) starts.push({ num: +m[1], hdrAt: m.index + m[0].length });
for (const o of starts) {
  const endObj = s.indexOf('endobj', o.hdrAt);
  const seg = s.slice(o.hdrAt, endObj);
  const sIdx = seg.indexOf('stream');
  let header = sIdx >= 0 ? seg.slice(0, sIdx) : seg;
  let streamBuf = null;
  if (sIdx >= 0) {
    let abs = o.hdrAt + sIdx + 'stream'.length;
    if (s[abs] === '\r') abs++; if (s[abs] === '\n') abs++;
    streamBuf = buf.slice(abs, s.indexOf('endstream', abs));
  }
  objIndex[o.num] = { header, streamBuf };
}
const pageNums = [];
for (const o of starts) { const h = objIndex[o.num].header; if (/\/Type\s*\/Page\b/.test(h) && !/\/Type\s*\/Pages\b/.test(h)) pageNums.push(o.num); }

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const t = Buffer.from(type, 'latin1'); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0); return Buffer.concat([len, t, data, crc]); }
function writePNG(path, w, h, pixels) { // rgb
  const bpr = w * 3; const raw = Buffer.alloc((bpr + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (bpr + 1)] = 0; pixels.copy(raw, y * (bpr + 1) + 1, y * bpr, (y + 1) * bpr); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
function inflate(o) { try { return zlib.inflateSync(o.streamBuf); } catch (e) { return null; } }
function getXObjects(rh) { const out = {}; const xm = rh.match(/\/XObject\s*<<([\s\S]*?)>>/); if (!xm) return out; const r = /\/(\w+)\s+(\d+)\s+\d+\s+R/g; let mm; while ((mm = r.exec(xm[1])) !== null) out[mm[1]] = +mm[2]; return out; }

for (let p = 0; p < pageNums.length; p++) {
  const pageNo = p + 1; if (pageNo < wantFrom || pageNo > wantTo) continue;
  const pn = pageNums[p]; let header = objIndex[pn].header; let rh = header;
  const rr = header.match(/\/Resources\s+(\d+)\s+\d+\s+R/); if (rr) rh = objIndex[+rr[1]].header;
  const xobjs = getXObjects(rh);
  for (const nm of Object.keys(xobjs)) {
    const on = xobjs[nm]; const o = objIndex[on];
    if (!o || !/\/Subtype\s*\/Image/.test(o.header)) continue;
    const w = +(o.header.match(/\/Width\s+(\d+)/) || [])[1];
    const h = +(o.header.match(/\/Height\s+(\d+)/) || [])[1];
    const base = `${outDir}/p${String(pageNo).padStart(2,'0')}_${nm}_${w}x${h}`;
    if (/DCTDecode/.test(o.header)) { fs.writeFileSync(base + '.jpg', o.streamBuf); console.log('jpg', base + '.jpg'); continue; }
    if (!/FlateDecode/.test(o.header)) continue;
    const bpc = +(o.header.match(/\/BitsPerComponent\s+(\d+)/) || [])[1] || 8;
    if (bpc !== 8) { console.log('skip bpc', bpc, base); continue; }
    let data = inflate(o); if (!data) { console.log('inflate fail', base); continue; }
    // determine channels: ICCBased N -> need component count; assume 3 if data ~ w*h*3 else 1
    let channels = 3;
    if (data.length === w * h) channels = 1; else if (data.length === w * h * 3) channels = 3; else if (data.length === w * h * 4) channels = 4;
    else { console.log('unknown size', base, data.length, 'wh=', w * h); continue; }
    // build RGB
    const rgb = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      if (channels === 1) { rgb[i*3]=rgb[i*3+1]=rgb[i*3+2]=data[i]; }
      else { rgb[i*3]=data[i*channels]; rgb[i*3+1]=data[i*channels+1]; rgb[i*3+2]=data[i*channels+2]; }
    }
    // SMask?
    const sm = o.header.match(/\/SMask\s+(\d+)\s+\d+\s+R/);
    if (sm) {
      const so = objIndex[+sm[1]];
      const sw = +(so.header.match(/\/Width\s+(\d+)/) || [])[1];
      const sh = +(so.header.match(/\/Height\s+(\d+)/) || [])[1];
      let adata = inflate(so);
      if (adata && sw === w && sh === h && adata.length >= w * h) {
        for (let i = 0; i < w * h; i++) {
          const a = adata[i] / 255;
          rgb[i*3]   = Math.round(rgb[i*3]   * a + 255 * (1 - a));
          rgb[i*3+1] = Math.round(rgb[i*3+1] * a + 255 * (1 - a));
          rgb[i*3+2] = Math.round(rgb[i*3+2] * a + 255 * (1 - a));
        }
      } else console.log('  (smask mismatch)', base, sw+'x'+sh, adata && adata.length);
    }
    writePNG(base + '.png', w, h, rgb); console.log('png', base + '.png');
  }
}
