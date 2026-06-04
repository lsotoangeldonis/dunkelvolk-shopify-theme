const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const wantFrom = +(process.argv[3]||1), wantTo = +(process.argv[4]||999);
const buf = fs.readFileSync(file); const s = buf.toString('latin1');
const objIndex = {};
const objRe = /(\d+)\s+(\d+)\s+obj/g; let m; const starts = [];
while ((m = objRe.exec(s)) !== null) starts.push({ num:+m[1], hdrAt:m.index+m[0].length });
for (const o of starts) {
  const endObj = s.indexOf('endobj', o.hdrAt);
  const seg = s.slice(o.hdrAt, endObj);
  const sIdx = seg.indexOf('stream');
  let header = sIdx>=0?seg.slice(0,sIdx):seg, streamBuf=null;
  if (sIdx>=0){let abs=o.hdrAt+sIdx+'stream'.length;if(s[abs]==='\r')abs++;if(s[abs]==='\n')abs++;streamBuf=buf.slice(abs,s.indexOf('endstream',abs));}
  objIndex[o.num]={header,streamBuf};
}
const pageNums=[];
for(const o of starts){const h=objIndex[o.num].header;if(/\/Type\s*\/Page\b/.test(h)&&!/\/Type\s*\/Pages\b/.test(h))pageNums.push(o.num);}
function inflate(o){try{return zlib.inflateSync(o.streamBuf).toString('latin1');}catch(e){return null;}}

for(let p=0;p<pageNums.length;p++){
  const pageNo=p+1; if(pageNo<wantFrom||pageNo>wantTo)continue;
  const pn=pageNums[p]; const h=objIndex[pn].header;
  // contents
  let contents=[];
  const cs=h.match(/\/Contents\s+(\d+)\s+\d+\s+R/);
  const csArr=h.match(/\/Contents\s*\[([^\]]*)\]/);
  if(cs)contents.push(+cs[1]);
  else if(csArr){const r=/(\d+)\s+\d+\s+R/g;let mm;while((mm=r.exec(csArr[1]))!==null)contents.push(+mm[1]);}
  let txt='';
  for(const cn of contents){const c=inflate(objIndex[cn]);if(c)txt+=c;}
  console.log('\n========== PAGE '+pageNo+' (obj '+pn+') ==========');
  // extract text show operators: (..)Tj, [..]TJ, <..>Tj, and ' "
  const ops=txt.match(/(\((?:\\.|[^()\\])*\)|\[(?:[^\]\\]|\\.)*\]|<[0-9A-Fa-f\s]*>)\s*(TJ|Tj|'|")/g)||[];
  const out=[];
  for(const op of ops){
    let body='';
    const parts=op.match(/\((?:\\.|[^()\\])*\)|<[0-9A-Fa-f\s]*>/g)||[];
    for(const pt of parts){
      if(pt[0]==='('){ body+=pt.slice(1,-1).replace(/\\([()\\])/g,'$1'); }
      else { const hex=pt.slice(1,-1).replace(/\s/g,''); for(let i=0;i+1<hex.length;i+=2){body+=String.fromCharCode(parseInt(hex.substr(i,2),16));} }
    }
    out.push(body);
  }
  console.log('TEXT OPS:',out.length);
  console.log(out.join(' | '));
}
