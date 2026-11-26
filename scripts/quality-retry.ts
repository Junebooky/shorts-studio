import {retrySavedDraft} from '../server/quality/retry';
const [id,revision,...rest]=process.argv.slice(2);
if(!id||!revision||!/^\d+$/.test(revision)||rest.length||!Number.isSafeInteger(Number(revision)))throw new Error('사용법: npx tsx scripts/quality-retry.ts PROJECT_ID REVISION');
const controller=new AbortController();const stop=()=>controller.abort();process.once('SIGINT',stop);process.once('SIGTERM',stop);
try{console.log(JSON.stringify(await retrySavedDraft(id,Number(revision),n=>console.error('재렌더링 '+Math.floor(n*100)+'%'),controller.signal),null,2));}finally{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
