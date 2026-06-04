const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const wantFrom = parseInt(process.argv[3] || '1', 10);
const wantTo = parseInt(process.argv[4] || '999', 10);
const outDir = process.argv[5] || 'pdf_pages';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const buf = fs.readFileSync(file);
const s = buf.toString('latin1');

const objIndex = {};
const objRe = /(\d+)\s+(\d+)\s+obj/g;
let m; const starts = [];
while ((m = objRe.exec(s)) !== null) starts.push({ num: +m[1], at: m.index, hdrAt: m.index + m[0].length });
for (let i = 0; i < starts.length; i++) {
  const o = starts[i];
  const endObj = s.indexOf('endobj', o.hdrAt);
  const seg = s.slice(o.hdrAt, endObj);
  const sIdx = seg.indexOf('stream');
  let header = sIdx >= 0 ? seg.slice(0, sIdx) : seg;
  let streamBuf = null;
  if (sIdx >= 0) {
    let abs = o.hdrAt + sIdx + 'stream'.length;
    if (s[abs] === '\r') abs++;
    if (s[abs] === '\n') abs++;
    const endStream = s.indexOf('endstream', abs);
    streamBuf = buf.slice(abs, endStream);
  }
  objIndex[o.num] = { header, streamBuf };
}

const pageNums = [];
for (const o of starts) {
  const h = objIndex[o.num].header;
  if (/\/Type\s*\/Page\b/.test(h) && !/\/Type\s*\/Pages\b/.test(h)) pageNums.push(o.num);
}

function getXObjects(resHeader) {
  const out = {};
  const xm = resHeader.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (!xm) return out;
  const r = /\/(\w+)\s+(\d+)\s+\d+\s+R/g; let mm;
  while ((mm = r.exec(xm[1])) !== null) out[mm[1]] = +mm[2];
  return out;
}

// ---- minimal PNG writer ----
const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function writePNG(path, width, height, channels, pixels) {
  // channels: 1 gray, 3 rgb, 4 rgba
  const colorType = channels === 1 ? 0 : channels === 3 ? 2 : channels === 4 ? 6 : 2;
  const bytesPerRow = width * channels;
  const raw = Buffer.alloc((bytesPerRow + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (bytesPerRow + 1)] = 0; // filter none
    pixels.copy(raw, y * (bytesPerRow + 1) + 1, y * bytesPerRow, (y + 1) * bytesPerRow);
  }
  const idat = zlib.deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = colorType; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(path, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
}

function chans(header) {
  const bpc = +(header.match(/\/BitsPerComponent\s+(\d+)/) || [])[1] || 8;
  let cs = (header.match(/\/ColorSpace\s*\/(\w+)/) || [])[1] || '';
  if (/DeviceRGB|RGB/.test(cs)) return { c: 3, bpc };
  if (/DeviceGray|Gray|CalGray/.test(cs)) return { c: 1, bpc };
  if (/DeviceCMYK/.test(cs)) return { c: 4, bpc, cmyk: true };
  return { c: 3, bpc };
}

for (let p = 0; p < pageNums.length; p++) {
  const pageNo = p + 1;
  if (pageNo < wantFrom || pageNo > wantTo) continue;
  const pn = pageNums[p];
  let header = objIndex[pn].header;
  let resHeader = header;
  const resRef = header.match(/\/Resources\s+(\d+)\s+\d+\s+R/);
  if (resRef) resHeader = objIndex[+resRef[1]].header;
  const xobjs = getXObjects(resHeader);
  console.log(`PAGE ${pageNo} (obj ${pn}) xobjects: ${Object.keys(xobjs).length}`);
  for (const nm of Object.keys(xobjs)) {
    const on = xobjs[nm]; const o = objIndex[on];
    if (!o || !/\/Subtype\s*\/Image/.test(o.header)) continue;
    const w = +(o.header.match(/\/Width\s+(\d+)/) || [])[1];
    const h = +(o.header.match(/\/Height\s+(\d+)/) || [])[1];
    const base = `${outDir}/p${String(pageNo).padStart(2,'0')}_${nm}_obj${on}_${w}x${h}`;
    if (/DCTDecode/.test(o.header)) { fs.writeFileSync(base + '.jpg', o.streamBuf); console.log('  jpg', base + '.jpg'); continue; }
    if (/FlateDecode/.test(o.header)) {
      let data; try { data = zlib.inflateSync(o.streamBuf); } catch (e) { console.log('  inflate fail', nm); continue; }
      const { c, bpc, cmyk } = chans(o.header);
      if (bpc !== 8) { console.log('  skip bpc', bpc, nm); continue; }
      let px = data, channels = c;
      if (cmyk) {
        // convert CMYK -> RGB
        const rgb = Buffer.alloc(w * h * 3);
        for (let i = 0, j = 0; i < w * h * 4; i += 4, j += 3) {
          const C = data[i], M = data[i+1], Y = data[i+2], K = data[i+3];
          rgb[j] = 255 - Math.min(255, C + K);
          rgb[j+1] = 255 - Math.min(255, M + K);
          rgb[j+2] = 255 - Math.min(255, Y + K);
        }
        px = rgb; channels = 3;
      }
      const expected = w * h * channels;
      if (px.length < expected) { console.log('  size mismatch', nm, px.length, 'vs', expected); continue; }
      try { writePNG(base + '.png', w, h, channels, px); console.log('  png', base + '.png', `${w}x${h} c${channels}`); }
      catch (e) { console.log('  png fail', nm, e.message); }
    }
  }
}
