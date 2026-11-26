import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {readFile,readdir,stat} from 'node:fs/promises';import path from 'node:path';
import {inspectStreams,QualityReport,type QualityReport as Report} from '../src/core/quality';import {FPS,frames,type Project} from '../src/core/project';import {root} from './storage';
import {fullDecode,fingerprint} from './quality/integrity';
const exec=promisify(execFile);
export async function probe(file:string){const cli=path.join(root,'node_modules','@remotion','cli','remotion-cli.js');const {stdout}=await exec(process.execPath,[cli,'ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,avg_frame_rate:format=duration','-of','json',file],{cwd:root,timeout:60000,maxBuffer:1024*1024,windowsHide:true});return JSON.parse(stdout);}
export function pngDimensions(b:Buffer){if(b.length<33||!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||b.readUInt32BE(8)!==13||b.toString('ascii',12,16)!=='IHDR')throw new Error('PNG header invalid');return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}
export async function inspectQuality(p:Project,file:string,dir?:string,mode:Report['mode']='preview',getProbe=probe,decode=fullDecode):Promise<Report>{
 const checks:Report['checks']=[];const marks:number[]=[];let integrity:Report['integrity'];
 try{if(!(await stat(file)).size)throw new Error('빈 MP4');checks.push(...inspectStreams(await getProbe(file),{width:mode==='preview'?540:1080,height:mode==='preview'?960:1920,fps:FPS,durationMs:frames(p)/FPS*1000,audio:!!p.audio||!!p.music}));}catch(e){checks.push({id:'probe',name:'MP4 기술 검사',required:true,status:'not_checked',detail:e instanceof Error?e.message.slice(0,300):'검사 불가'});}
 if(mode==='final'){
  try{
   const before=await fingerprint(file);
   const decoded=await decode(file);const after=await fingerprint(file);
   if(before.sha256!==after.sha256||before.bytes!==after.bytes)throw new Error('디코딩 중 영상 파일이 변경됐어요.');
   integrity={...after,decodedFrames:decoded};
   checks.push({id:'decode',name:'전체 영상 디코딩',required:true,status:decoded===frames(p)?'pass':'fail',detail:decoded+' / '+frames(p)+' 프레임 · 영상 및 존재하는 오디오 스트림 디코딩'});
  }catch(e){checks.push({id:'decode',name:'전체 영상 디코딩',required:true,status:'not_checked',detail:e instanceof Error?e.message.slice(0,300):'디코딩 검사 불가'});}
 }
 if(mode==='preview'){try{if(!dir)throw new Error('프레임 폴더 없음');const names=(await readdir(dir)).filter(x=>/^\d+\.png$/.test(x));if(!names.length)throw new Error('대표 프레임 없음');for(const n of names){const i=Number(n.slice(0,-4));const d=pngDimensions(await readFile(path.join(dir,n)));if(i>=frames(p)||d.width!==1080||d.height!==1920)throw new Error('프레임 번호 또는 해상도 오류: '+n);marks.push(i);}marks.sort((a,b)=>a-b);checks.push({id:'frames',name:'대표 프레임 파일',required:true,status:'pass',detail:marks.length+'개 · PNG 헤더 및 해상도 검사'});}catch(e){marks.length=0;checks.push({id:'frames',name:'대표 프레임 파일',required:true,status:'fail',detail:e instanceof Error?e.message:'파일 오류'});}}
 for(const [id,name] of [['legibility','한글 가독성·잘림·겹침'],['sync','실제 음성 및 모션 싱크'],['art','디자인·연출 품질']])checks.push({id,name,required:false,status:'not_checked',detail:'실제 재생 및 시각 검수 필요'});
 return QualityReport.parse({version:1,mode,checks,frames:marks,integrity});
}
