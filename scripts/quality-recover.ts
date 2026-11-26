import path from 'node:path';
import {root} from '../server/storage';
import {inspectRenderLock,recoverRender} from '../server/quality/render-recovery';
const [id,rev,mode,...flags]=process.argv.slice(2);
if(!id||!/^[a-zA-Z0-9-]{1,64}$/.test(id)||!rev||!/^(0|[1-9]\d*)$/.test(rev)||!Number.isSafeInteger(Number(rev))||!['preview','final'].includes(mode)||flags.some(f=>!['--apply','--offline-confirmed'].includes(f)))throw new Error('사용법: npx tsx scripts/quality-recover.ts PROJECT_ID REVISION preview|final [--apply --offline-confirmed]');
const dest=path.join(root,'out',id,'r'+rev+(mode==='preview'?'-preview':'')+'.mp4');
if(flags.includes('--apply'))console.log(await recoverRender(dest,flags.includes('--offline-confirmed')));
else console.log(await inspectRenderLock(dest));
