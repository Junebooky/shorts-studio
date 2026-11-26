import {frameAt,validate,type Project,type SceneData} from '../core/project';
import {effectiveTheme} from '../core/styles';
import type {Asset} from '../core/assets';
export type MasterScene={scene:SceneData;asset?:Asset;captionText:string;frame:number;durationInFrames:number};
export type MasterContent={projectId:string;revision:number;title:string;script:string;theme:Project['theme'];scenes:MasterScene[]};
export type MasterSize='portrait'|'square';
export const masterSizes={portrait:{width:1080,height:1350},square:{width:1080,height:1080}} as const;
export function createMasterContent(p:Project):MasterContent{
 const qa=validate(p);if(qa.errors.length||!p.scenes.length)throw Error('원본 장면과 소재를 확인해 주세요: '+qa.errors.join('; '));
 // Assign each caption once, to the scene at its start; never duplicate across cuts.
 const scenes=p.scenes.map(scene=>{
  const asset=p.assets?.find(a=>a.id===scene.media?.assetId&&a.role==='production'&&a.kind!=='audio');
  const durationInFrames=Math.max(1,frameAt(scene.endMs)-frameAt(scene.startMs));
  return {scene:structuredClone(scene),...(asset?{asset:structuredClone(asset)}:{}),captionText:p.captions.filter(c=>c.startMs>=scene.startMs&&c.startMs<scene.endMs).map(c=>c.text).join(' '),frame:durationInFrames-1,durationInFrames};
 });
 return {projectId:p.id,revision:p.revision,title:p.title,script:p.script,theme:effectiveTheme(p),scenes};
}
export function masterScene(master:MasterContent,id:string){const entry=master.scenes.find(x=>x.scene.id===id);if(!entry)throw Error('원본 장면을 찾지 못했어요.');return entry;}
export function threadDraft(master:MasterContent){
 return master.scenes.map(({scene,captionText})=>({sceneId:scene.id,text:[scene.headline,captionText||scene.detail].filter(Boolean).join('\n\n')}));
}
export type MasterCardProps={entry:MasterScene;theme:Project['theme'];size:MasterSize};
export function masterCardProps(master:MasterContent,id:string,size:MasterSize):MasterCardProps{return {entry:masterScene(master,id),theme:master.theme,size};}
