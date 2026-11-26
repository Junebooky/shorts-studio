import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {load,root,ready} from './storage';
import {createMasterContent,masterCardProps,type MasterSize} from '../src/workspace/master-content';
// Local deterministic rendering, never a new provider request or a mutation of the video.
export async function renderMasterCard(id:string,revision:number,sceneId:string,size:MasterSize){
 if(id==='demo'||!Number.isInteger(revision)||!['portrait','square'].includes(size))throw Error('저장된 원본과 카드 비율을 확인해 주세요.');
 const p=await load(id);if(p.revision!==revision)throw Error('원본 영상이 변경되었어요. 최신 원본을 다시 선택해 주세요.');
 await ready(p);
 const inputProps=masterCardProps(createMasterContent(p),sceneId,size);
 const dir=await mkdtemp(path.join(tmpdir(),'shorts-master-card-'));
 try{
  const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/master-index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(dir,'bundle')});
  const composition=await selectComposition({serveUrl,id:'MasterCard',inputProps});
  const output=path.join(dir,'card.png');
  await renderStill({serveUrl,composition,inputProps,frame:inputProps.entry.frame,output});
  return await readFile(output);
 }finally{await rm(dir,{recursive:true,force:true});}
}
