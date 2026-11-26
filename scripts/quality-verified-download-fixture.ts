import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {QualityReport} from '../src/core/quality';
import {sendVerifiedMp4} from '../server/quality/verified-download';
import {root} from '../server/storage';
const out=path.join(root,'out','quality-retry-fixture');
const report=JSON.parse(await readFile(path.join(out,'report.json'),'utf8'));assert.equal(report.testOnly,true);assert.equal(report.finalReady,false);
const quality=QualityReport.parse(report.quality),original=await readFile(path.join(out,'retry.mp4')),source=path.join(out,'mutable-source.mp4');
const digest={bytes:original.length,sha256:createHash('sha256').update(original).digest('hex')};
assert.equal(quality.integrity?.sha256,digest.sha256);
const changed=Buffer.from(original);changed[Math.floor(changed.length/2)]^=1;
await writeFile(source,original);
const server=createServer((req,res)=>{void(async()=>{
 try{
  const u=req.url;
  await sendVerifiedMp4(res,source,u==='/legacy'?{...quality,integrity:undefined}:quality,{
   download:true,manifest:u==='/bad-manifest'?{...digest,sha256:'0'.repeat(64)}:digest,
   beforeSend:async()=>{if(u==='/stale')throw new Error('synthetic stale revision');if(u==='/replace-after-verify')await writeFile(source,changed);}
  });
 }catch(e){if(!res.headersSent&&!res.destroyed){res.writeHead(409,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e instanceof Error?e.message:'verification failure'}));}else res.destroy();}
 })();});
try{
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const addr=server.address();assert.ok(addr&&typeof addr!=='string');const base='http://127.0.0.1:'+addr.port;
 for(const route of ['/legacy','/bad-manifest','/stale']){
  const r=await fetch(base+route);assert.equal(r.status,409);assert.equal(r.headers.get('content-type'),'application/json');await r.text();
 }
 const good=await fetch(base+'/replace-after-verify');assert.equal(good.status,200);assert.equal(good.headers.get('content-type'),'video/mp4');assert.equal(good.headers.get('content-length'),String(digest.bytes));assert.match(good.headers.get('content-disposition')??'',/attachment/);
 const received=Buffer.from(await good.arrayBuffer());assert.deepEqual(received,original);assert.deepEqual(await readFile(source),changed);
 const bad=await fetch(base+'/tampered');assert.equal(bad.status,409);await bad.text();
 await writeFile(source,original.subarray(0,Math.floor(original.length/2)));const truncated=await fetch(base+'/truncated');assert.equal(truncated.status,409);await truncated.text();
 await writeFile(path.join(out,'verified-download-report.json'),JSON.stringify({testOnly:true,decodedFrames:quality.integrity?.decodedFrames,...digest,receivedOriginalAfterReplacement:true,sameSizeTamperRejected:true,truncationRejected:true,legacyRejected:true,manifestMismatchRejected:true,staleRevisionCallbackRejected:true,approved:false},null,2));
 console.log('Actual verified MP4 HTTP transfer PASS: '+quality.integrity?.decodedFrames+' decoded frames, verified copy served despite source replacement, tamper/truncation/legacy/manifest/stale rejected before headers');
}finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await rm(source,{force:true});}
