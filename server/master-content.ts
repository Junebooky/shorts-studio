import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {load,root,projectPath} from './storage';
import {verifyAssets} from './assets';
import {ProjectSchema} from '../src/core/project';
import {createMasterContent,masterCardProps,type MasterSize} from '../src/workspace/master-content';
// Resolve the captured immutable revision, not the mutable latest project.
export async function loadMasterContent(id:string,revision:number){
 if(id==='demo'||!Number.isSafeInteger(revision)||revision<1)throw Error('저장된 원본 리비전을 확인해 주세요.');
 let p=await load(id);
 if(p.revision!==revision){
  if(revision>p.revision)throw Error('저장된 원본 리비전을 찾지 못했어요.');
  try{p=ProjectSchema.parse(JSON.parse(await readFile(path.join(path.dirname(projectPath(id)),'history',revision+'.json'),'utf8')));}
  catch{throw Error('저장된 원본 리비전을 찾지 못했어요.');}
 }
 if(p.id!==id||p.revision!==revision)throw Error('공통 원본과 프로젝트 리비전이 일치하지 않아요.');
 const source=createMasterContent(p);
 const assets=source.scenes.flatMap(s=>s.asset?[s.asset]:[]);
 await verifyAssets(id,[...new Map(assets.map(a=>[a.id,a])).values()]);
 return source;
}
let rendering=false;
export async function renderMasterCard(id:string,revision:number,sceneId:string,size:MasterSize){
 if(!['portrait','square'].includes(size))throw Error('카드 비율을 확인해 주세요.');
 if(rendering)throw Error('다른 카드 이미지를 만들고 있어요. 완료 후 다시 시도해 주세요.');
 rendering=true;
 try{
  const inputProps=masterCardProps(await loadMasterContent(id,revision),sceneId,size);
  const dir=await mkdtemp(path.join(tmpdir(),'shorts-master-card-'));
  try{
   const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/master-index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(dir,'bundle')});
   const composition=await selectComposition({serveUrl,id:'MasterCard',inputProps});
   const output=path.join(dir,'card.png');
   await renderStill({serveUrl,composition,inputProps,frame:inputProps.entry.frame,output});
   return await readFile(output);
  }finally{await rm(dir,{recursive:true,force:true});}
 }finally{rendering=false;}
}
