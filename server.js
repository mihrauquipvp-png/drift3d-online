// DRIFT 3D — servidor multiplayer (Node.js 16+, sem dependências)
// Uso: node server.js   →  abra http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os');
const PORT=process.env.PORT||3000,MAX=8,FILE=path.join(__dirname,'index.html');
const srv=http.createServer((q,r)=>{
  if(q.url==='/health'){r.end('ok');return}
  fs.readFile(FILE,(e,d)=>{
    if(e){r.writeHead(500);r.end('index.html não encontrado ao lado do server.js');return}
    r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});r.end(d)})});
const rooms=new Map();let nextId=1;
function frame(data,op=1){const p=Buffer.isBuffer(data)?data:Buffer.from(data),n=p.length;let h;
  if(n<126)h=Buffer.from([128|op,n]);
  else if(n<65536){h=Buffer.alloc(4);h[0]=128|op;h[1]=126;h.writeUInt16BE(n,2)}
  else{h=Buffer.alloc(10);h[0]=128|op;h[1]=127;h.writeBigUInt64BE(BigInt(n),2)}
  return Buffer.concat([h,p])}
const send=(c,d,op)=>{if(!c.sock.destroyed)c.sock.write(frame(d,op||1))};
function parse(c){for(;;){const b=c.buf;if(b.length<2)return;let len=b[1]&127,off=2;
  if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);off=4}
  else if(len===127){if(b.length<10)return;len=Number(b.readBigUInt64BE(2));off=10}
  const masked=b[1]&128;if(masked)off+=4;if(b.length<off+len)return;
  const op=b[0]&15,pl=Buffer.from(b.subarray(off,off+len));
  if(masked){const mk=b.subarray(off-4,off);for(let i=0;i<pl.length;i++)pl[i]^=mk[i&3]}
  c.buf=b.subarray(off+len);
  if(op===8){c.sock.end();return}
  if(op===9){send(c,pl,10);continue}
  if(op===1)onMsg(c,pl.toString('utf8'))}}
function onMsg(c,t){let m;try{m=JSON.parse(t)}catch(e){return}
  if(m.t==='join'&&!c.room){
    const k=String(m.k|0);let r=rooms.get(k);if(!r){r=new Map();rooms.set(k,r)}
    if(r.size>=MAX){send(c,JSON.stringify({t:'full'}));c.sock.end();return}
    const used=new Set([...r.values()].map(x=>x.slot));let slot=0;while(used.has(slot))slot++;
    Object.assign(c,{room:r,slot,n:String(m.n||'Piloto').replace(/[<>&"'`]/g,'').slice(0,14)||'Piloto',c:m.c|0,
      p:/^#[0-9a-f]{6}$/i.test(m.p)?m.p:'#ffffff',st:null});
    r.set(c.id,c);send(c,JSON.stringify({t:'id',id:c.id,slot}));
    console.log(`+ ${c.n} entrou na sala ${k} (${r.size}/${MAX})`)}
  else if(m.t==='u'&&c.room){const n=v=>Number.isFinite(v)?v:0;
    c.st={x:n(m.x),z:n(m.z),h:n(m.h),v:n(m.v),w:n(m.w),l:m.l|0,ix:m.ix|0}}}
function drop(c){if(c.gone)return;c.gone=true;
  if(c.room){c.room.delete(c.id);console.log(`- ${c.n} saiu`);if(!c.room.size)for(const[k,r]of rooms)if(r===c.room)rooms.delete(k)}}
srv.on('upgrade',(req,sock)=>{
  const key=req.headers['sec-websocket-key'];
  if(!key||String(req.headers.upgrade).toLowerCase()!=='websocket'){sock.destroy();return}
  const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  sock.setNoDelay(true);
  const c={id:nextId++,sock,room:null,buf:Buffer.alloc(0)};
  sock.on('data',d=>{c.buf=Buffer.concat([c.buf,d]);if(c.buf.length>1<<20){sock.destroy();return}parse(c)});
  sock.on('close',()=>drop(c));sock.on('error',()=>drop(c))});
// 20 envios por segundo: posição de todos os pilotos de cada sala (pista)
setInterval(()=>{for(const r of rooms.values()){const p=[];
  for(const c of r.values())if(c.st)p.push({i:c.id,n:c.n,c:c.c,p:c.p,...c.st});
  if(!p.length)continue;const m=JSON.stringify({t:'s',p});for(const c of r.values())send(c,m)}},50);
srv.listen(PORT,'0.0.0.0',()=>{
  console.log('\nDRIFT 3D multiplayer rodando!\n  Neste PC:  http://localhost:'+PORT);
  for(const l of Object.values(os.networkInterfaces()))for(const a of l)if(a.family==='IPv4'&&!a.internal)console.log('  Na rede:   http://'+a.address+':'+PORT);
  console.log('')});
