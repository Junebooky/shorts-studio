import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {demo,type Project} from '../src/core/project';
import {audioUpload,root,save} from '../server/storage';
const id='fleurs-fixture',dir=path.join(root,'workspace','fixtures');
const meta=JSON.parse(await readFile(path.join(dir,id+'.json'),'utf8'));
const audio=await audioUpload(id,'wav',await readFile(path.join(dir,id+'.wav')));
const p:Project={...demo,id,revision:0,title:'FLEURS 한국어 발화 테스트',script:meta.script,durationMs:meta.durationMs,audio,timingSource:'unverified',captions:[],scenes:[]};
await save(p);
