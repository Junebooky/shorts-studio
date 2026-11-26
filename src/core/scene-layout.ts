import {z} from 'zod';
import type {SceneData} from './project';
import {PRESETS,type PresetId} from './styles';
// Layout IDs are intentionally independent of the identically named legacy palette IDs.
export const SceneLayout=z.enum(['editorial','kinetic','data','cinematic','minimal','illustrated']);
export type SceneLayout=z.infer<typeof SceneLayout>;
export function sceneLayout(scene:Pick<SceneData,'visual'|'layout'|'media'|'kind'>):SceneLayout{
 if(scene.layout)return scene.layout;
 if(scene.media)return 'cinematic';
 switch(scene.visual?.type){
 case 'path':case 'contrast':return 'data';
 case 'cycle':return 'editorial';
 case 'focus':return 'minimal';
 case 'typography':return 'kinetic';
 case 'vector':return 'editorial';
 case 'mechanism':return 'illustrated';
 case 'semiconductor':return 'editorial';
 default:return scene.kind==='steps'||scene.kind==='compare'?'data':'editorial';
 }
}
// Existing layout metrics are reused as independent scene presets, never read via project.styleId.
export const sceneProfile=(scene:Pick<SceneData,'visual'|'layout'|'media'|'kind'>)=>PRESETS[sceneLayout(scene) as PresetId];
export const sceneLayoutGuide='Choose layout independently for each scene: editorial (narrative hierarchy), kinetic (spoken keyword), data (relation/comparison), cinematic (subject-first), minimal (single idea), illustrated (objects). Optional beat.layout uses one of these IDs. Specialized mechanism and semiconductor graphics always render their physical subject. The selected palette is never a layout restriction. Mix appropriate layouts and motion types according to the narration, not random variety.';
