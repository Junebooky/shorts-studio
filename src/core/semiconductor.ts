import type {Project} from './project';
import {compileStoryboard} from './storyboard';
import {isCurrent,normalizeSpeech} from './timing';
import type {ProcessOperation} from './semantic-motion';
export const PROCESS_STAGES:{operation:ProcessOperation;name:string;aliases:string[];actions:string[];purpose:string;description:string}[]=[
 {operation:'wafer',name:'웨이퍼 제조',aliases:['웨이퍼'],actions:['잘라','자르','얇게','슬라이스'],purpose:'실리콘 원기둥을 얇은 원판으로 절단',description:'실리콘 원기둥 → 얇은 원판'},
 {operation:'oxidation',name:'산화',aliases:['산화'],actions:['산소','산화막','보호막','입혀','입힙'],purpose:'표면에 절연 산화막 형성',description:'표면에 산화막 형성'},
 {operation:'lithography',name:'포토',aliases:['포토','노광','사진'],actions:['빛','노광','비춰','새겨'],purpose:'마스크를 통과한 빛으로 감광막 패턴 형성',description:'빛과 마스크로 패턴 전사'},
 {operation:'etch',name:'식각',aliases:['식각','에칭'],actions:['깎','제거','파내'],purpose:'노출된 부분을 선택적으로 제거',description:'필요 없는 부분만 제거'},
 {operation:'deposition',name:'증착·이온주입',aliases:['증착','박막','이온주입','이온'],actions:['쌓','입혀','박막','증착'],purpose:'박막을 형성하고 이온을 주입해 전기적 특성 조절',description:'박막 형성 · 이온 주입'},
 {operation:'interconnect',name:'금속 배선',aliases:['금속','배선'],actions:['연결','이어','전기','길'],purpose:'소자 사이를 금속선으로 연결',description:'전기가 흐를 연결 경로'},
 {operation:'eds',name:'EDS 검사',aliases:['eds','이디에스','전기적검사','전기검사','전기적','검사'],actions:['검사','측정','선별','불량'],purpose:'웨이퍼 상태에서 칩의 전기적 특성 검사 및 선별',description:'칩별 전기 검사와 선별'},
 {operation:'packaging',name:'패키징',aliases:['패키징','패키지','포장'],actions:['감싸','보호','포장','연결'],purpose:'다이를 기판에 연결하고 외부 환경에서 보호',description:'기판 연결 · 보호 패키지'}
];
export const isEightProcessTopic=(topic:string)=>{const s=normalizeSpeech(topic);return s.includes('반도체')&&(s.includes('8대공정')||s.includes('팔대공정')||s.includes('8개공정'));};
const matches=(text:string,aliases:string[])=>aliases.some(a=>normalizeSpeech(text).startsWith(normalizeSpeech(a)));
export const semiconductorScriptGuide='For this eight-process explainer use exactly eight concise Korean sentences, each beginning with these exact terms in order: 웨이퍼, 산화, 포토, 식각, 증착, 금속 배선, EDS, 패키징 (write EDS as 이디에스 for TTS). No introductory list or extra section. Describe respectively slicing a silicon ingot, forming oxide, exposure through a mask, selective removal, thin-film deposition AND ion implantation, metal interconnect, electrical die testing, and package protection/connection. Front-end operations repeat in reality; this is a simplified educational overview. Each sentence should be concise, preferably 20–38 Korean characters. Only spoken text.';
export function checkProcessScript(script:string){
 const sentences=script.split(/[.!?。！？\n]+/u).map(s=>s.trim()).filter(Boolean);
 if(sentences.length!==8||PROCESS_STAGES.some((s,i)=>!matches(sentences[i],s.aliases)))throw new Error('반도체 8대 공정 대본에는 순서대로 여덟 공정의 설명이 필요합니다. 음성을 생성하기 전에 대본을 다시 확인해 주세요.');
 if(!/이온\s*주입|이온을|이온을?\s*넣/u.test(sentences[4]))throw new Error('증착 및 이온주입 설명이 모두 필요합니다.');
}
export function processStoryboard(p:Project){
 if(!p.audio||!isCurrent(p.analysis,p)||p.analysis?.status!=='matched'||!p.analysis.words.length)throw new Error('기존 음성과 실제 어절 타이밍이 필요합니다. 음성을 다시 생성하지 말고 먼저 자막을 정렬해 주세요.');
 const words=p.analysis.words;let cursor=0,prevCap=-1;
 const anchors=PROCESS_STAGES.map(s=>{
  let found=-1,cap=-1;
  for(let i=cursor;i<words.length;i++){const w=words[i];if(!matches(w.text,s.aliases)||w.confidence!==undefined&&w.confidence<.5)continue;const k=p.captions.findIndex(c=>c.startMs<=w.startMs&&c.endMs>=w.endMs);if(k<=prevCap)continue;found=i;cap=k;break;}
  if(found<0)throw new Error('기존 대본에서 '+s.name+' 발화 근거를 별도 자막 구간으로 찾지 못했습니다. 원본은 변경하지 않았습니다.');
  cursor=found+1;prevCap=cap;return {wordIndex:found,cap};
 });
 const beats=PROCESS_STAGES.map((s,i)=>{
  const start=i===0?0:anchors[i].cap,end=anchors[i+1]?.cap??p.captions.length;
  const first=anchors[i].wordIndex,limit=anchors[i+1]?.wordIndex??words.length;
  const range=words.slice(first,limit);const lastMs=end<p.captions.length?p.captions[end].startMs:p.durationMs;
  const action=range.findIndex(w=>matches(w.text,s.actions)&&w.endMs<=lastMs&&(w.confidence===undefined||w.confidence>=.5));
  const wi=first+Math.max(0,action),w=words[wi];
  const cues=[{slot:0,wordIndex:wi,expectedWord:w.text}];
  if(s.operation==='deposition'){const j=range.findIndex((v,k)=>first+k>wi&&matches(v.text,['이온주입','이온'])&&v.endMs<=lastMs&&(v.confidence===undefined||v.confidence>=.5));if(j>=0)cues.push({slot:1,wordIndex:first+j,expectedWord:words[first+j].text});}
  return {captionIds:p.captions.slice(start,end).map(c=>c.id),purpose:s.purpose,metaphor:'공정의 실제 물리적 변화 도식',headline:s.name,kicker:String(i+1).padStart(2,'0')+' / 08',detail:s.description,visual:{type:'semiconductor',operation:s.operation},cues};
 });
 const q=compileStoryboard(p,{version:1,projectId:p.id,baseRevision:p.revision,styleId:p.styleId??'auto',direction:{concept:'실리콘에서 완성 칩까지: 여덟 공정의 물리적 변화',audience:p.creativeBrief?.audience||'일반인',style:'공정 도식',author:'agent',plan:{message:'각 공정에서 무엇이 바뀌는지 이해하기',narrative:'웨이퍼에서 패키징까지 여덟 단계',visualApproach:'공정별로 다른 물리적 변화를 실제 발화 시점에 맞춰 도식화',constraints:'원본 음성과 시간 보존, 실제 공정은 반복될 수 있는 교육용 단순화, 임의 수치 없음',referenceDecisions:(p.assets??[]).filter(a=>a.role==='reference').map(a=>({assetId:a.id,decision:'not_used',notes:'이번 내장 공정 도식은 해당 파일을 사용하지 않음'}))}},theme:p.theme,music:p.music,beats});
 return q;
}
