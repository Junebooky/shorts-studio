import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {readFile,readdir,stat} from 'node:fs/promises';import path from 'node:path';
import {inspectStreams,QualityReport,type QualityReport as Report} from '../src/core/quality';import {FPS,SAFE,frameAt,frames,type Project} from '../src/core/project';import {root} from './storage';
import {createHash} from 'node:crypto';import {LayoutSample,inspectLayout,type LayoutEvidence} from '../src/core/quality/layout';
import {fullDecode,fingerprint} from './quality/integrity';
import {measureReadability,readabilityStatus,type ReadabilityEvidence} from '../src/core/quality/readability';
const exec=promisify(execFile);
export async function probe(file:string){const cli=path.join(root,'node_modules','@remotion','cli','remotion-cli.js');const {stdout}=await exec(process.execPath,[cli,'ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,avg_frame_rate:format=duration','-of','json',file],{cwd:root,timeout:60000,maxBuffer:1024*1024,windowsHide:true});return JSON.parse(stdout);}
export function pngDimensions(b:Buffer){if(b.length<33||!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||b.readUInt32BE(8)!==13||b.toString('ascii',12,16)!=='IHDR')throw new Error('장면 이미지의 PNG 파일 형식을 확인할 수 없어요.');return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}
export async function inspectQuality(p:Project,file:string,dir?:string,mode:Report['mode']='preview',getProbe=probe,decode=fullDecode):Promise<Report>{
 const checks:Report['checks']=[];const marks:number[]=[];let layout:LayoutEvidence|undefined;let integrity:Report['integrity'];let readability:ReadabilityEvidence|undefined;
 try{if(!(await stat(file)).size)throw new Error('영상 파일이 비어 있어요.');checks.push(...inspectStreams(await getProbe(file),{width:mode==='preview'?540:1080,height:mode==='preview'?960:1920,fps:FPS,durationMs:frames(p)/FPS*1000,audio:!!p.audio||!!p.music}));}catch(e){checks.push({id:'probe',name:'MP4 기술 검사',required:true,status:'not_checked',detail:e instanceof Error?e.message.slice(0,300):'검사 불가'});}
 if(mode==='final'){
  try{
   const before=await fingerprint(file);
   const decoded=await decode(file);const after=await fingerprint(file);
   if(before.sha256!==after.sha256||before.bytes!==after.bytes)throw new Error('영상을 읽어 검사하는 중 파일이 바뀌었어요.');
   integrity={...after,decodedFrames:decoded};
   checks.push({id:'decode',name:'전체 영상 디코딩',required:true,status:decoded===frames(p)?'pass':'fail',detail:decoded+' / '+frames(p)+' 프레임 · 영상 및 존재하는 오디오 스트림 디코딩'});
  }catch(e){checks.push({id:'decode',name:'전체 영상 디코딩',required:true,status:'not_checked',detail:e instanceof Error?e.message.slice(0,300):'디코딩 검사 불가'});}
 }
 if(mode==='preview'){try{if(!dir)throw new Error('검수 장면 이미지 폴더가 없어요. 검수용 영상을 다시 만들어 주세요.');const names=(await readdir(dir)).filter(x=>/^\d+\.png$/.test(x));if(!names.length)throw new Error('검수할 장면 이미지가 없어요. 검수용 영상을 다시 만들어 주세요.');for(const n of names){const i=Number(n.slice(0,-4));const d=pngDimensions(await readFile(path.join(dir,n)));if(i>=frames(p)||d.width!==1080||d.height!==1920)throw new Error('검수 장면의 번호나 해상도가 올바르지 않아요: '+n);marks.push(i);}marks.sort((a,b)=>a-b);checks.push({id:'frames',name:'대표 프레임 파일',required:true,status:'pass',detail:marks.length+'개 · PNG 헤더 및 해상도 검사'});}catch(e){marks.length=0;checks.push({id:'frames',name:'대표 프레임 파일',required:true,status:'fail',detail:e instanceof Error?e.message:'파일 오류'});}}
 if(mode==='preview'&&dir&&marks.length){
  layout={version:1,sampled:[],missing:[],findings:[]};
  readability={version:1,items:[],missingFrames:[],contrastThreshold:4.5,mobileWidth:360,minMobilePx:12};
  const canvas={left:0,top:0,right:1080,bottom:1920},safe={left:SAFE.left,top:SAFE.top,right:1080-SAFE.right,bottom:1920-SAFE.bottom};
  for(const frame of marks){
   try{
    const raw=JSON.parse(await readFile(path.join(dir,frame+'.layout.json'),'utf8'));
    const hash=createHash('sha256').update(await readFile(path.join(dir,frame+'.png'))).digest('hex');
    if(raw.sha256!==hash)throw new Error('Frame evidence mismatch');
    const sample=LayoutSample.parse(raw.sample);if(sample.frame!==frame)throw new Error('Frame mismatch');
    const scene=p.scenes.find(s=>frame>=frameAt(s.startMs)&&frame<frameAt(s.endMs));
    const ms=frame*1000/FPS,caption=p.captions.find(c=>ms>=c.startMs&&ms<c.endMs);
    const expected=[...(scene?.headline.trim()?['headline']:[]),...(caption?.text.trim()?['caption']:[])];
    const findings=inspectLayout(sample,safe,canvas,expected);
    layout.findings.push(...findings);layout.sampled.push(frame);
    readability.items.push(...sample.elements.map(e=>measureReadability(frame,e.role,e.appearance)));
    if(findings.some(f=>f.code==='missing'))layout.missing.push(frame);
   }catch{layout.missing.push(frame);}
  }
  readability.missingFrames=[...layout.missing];
  for(const [kind,name] of [['contrast','텍스트 색상 대비 후보'],['size','모바일 글자 크기 후보']] as const){const r=readabilityStatus(readability,kind);checks.push({id:'readability-'+kind,name,required:false,status:r.status,detail:'측정 '+r.measured+'개 · 미확인 '+r.unknown+'개 · 후보 '+r.candidates.length+'개 · 누락 프레임 '+readability.missingFrames.length+'개'});}
  for(const [code,name] of [['unsafe','텍스트 안전영역'],['clipped','텍스트 잘림 후보'],['overlap','텍스트 겹침 후보']] as const){
   const count=layout.findings.filter(f=>f.code===code).length;
   checks.push({id:'layout-'+code,name,required:false,status:count?'fail':layout.missing.length||!layout.sampled.length?'not_checked':'pass',detail:count?count+'건 · 측정된 텍스트 경계 확인 필요':layout.missing.length?'측정 누락 '+layout.missing.length+'프레임':'대표 프레임 내 표시된 중요 텍스트 경계 검사'});
  }
 }
 for(const [id,name] of [['legibility','한글 가독성·잘림·겹침'],['sync','실제 음성 및 모션 싱크'],['art','디자인·연출 품질']])checks.push({id,name,required:false,status:'not_checked',detail:'영상을 직접 재생해 화면과 음성을 확인해 주세요.'});
 return QualityReport.parse({version:1,mode,checks,frames:marks,layout,integrity,readability});
}
