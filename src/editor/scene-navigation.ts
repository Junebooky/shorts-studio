import {FPS,frameAt,frames,type Project} from '../core/project';

export function boundedFrame(project:Project,frame:number):number{
 return Math.max(0,Math.min(frames(project)-1,Number.isFinite(frame)?Math.floor(frame):0));
}
export function sceneIndexAtFrame(project:Project,frame:number):number{
 const f=boundedFrame(project,frame);
 return project.scenes.findIndex(s=>f>=frameAt(s.startMs)&&f<frameAt(s.endMs));
}
export function sceneStartFrame(project:Project,index:number):number|null{
 const scene=project.scenes[index];return scene?boundedFrame(project,frameAt(scene.startMs)):null;
}
export function sceneCaptions(project:Project,index:number){
 const scene=project.scenes[index];
 return scene?project.captions.filter(c=>c.startMs<scene.endMs&&c.endMs>scene.startMs):[];
}
export function captionSeekFrame(project:Project,index:number,captionId:string):number|null{
 const scene=project.scenes[index],caption=sceneCaptions(project,index).find(c=>c.id===captionId);
 if(!scene||!caption)return null;
 const start=Math.max(scene.startMs,caption.startMs),end=Math.min(scene.endMs,caption.endMs);
 const frame=frameAt(start);
 return frame<frameAt(end)&&frame<frames(project)?boundedFrame(project,frame):null;
}
export function formatSceneTime(ms:number){
 const n=Math.max(0,Math.round(ms)),minutes=Math.floor(n/60000),seconds=Math.floor(n/1000)%60;
 return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+String(Math.floor(n%1000/10)).padStart(2,'0');
}
export function frameTime(frame:number){return frame*1000/FPS;}
