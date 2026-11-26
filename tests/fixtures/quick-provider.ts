import {pcmToWav} from '../../server/elevenlabs';
export const fixtureScript='작은 회로를 만들어요. 빛으로 모양을 새겨요.';
export function mockQuickRequest(options:{badTiming?:boolean;badBoard?:boolean}={}){
 const calls:string[]=[];
 const request:typeof fetch=async(input,init)=>{
 const url=String(input),body=JSON.parse(String(init?.body??'{}'));
 if(url.includes('/v2/voices')){return Response.json({voices:[{voice_id:'fixture-voice',name:'테스트 성우',labels:{language:'ko'},preview_url:'https://example.test/sample.wav'},{voice_id:'fixture-alt',name:'샘플 없는 성우',labels:{language:'ko'},preview_url:null}],has_more:false});}
 if(url.includes('/chat/completions')){
 const d=JSON.parse(body.messages[1].content);
 if(!d.draft){calls.push('script');return Response.json({choices:[{message:{content:JSON.stringify({title:'반도체 공정 테스트',script:fixtureScript})}}]});}
 calls.push('storyboard');const captions=d.draft.captionEvidence;
 const result={direction:{concept:'회로를 만드는 빛',audience:'일반인',style:'간결한 설명',plan:{message:'빛으로 회로 모양 만들기',narrative:'회로에서 빛으로',visualApproach:'도식과 핵심 단어',constraints:'테스트 대본만 사용',referenceDecisions:[]}},theme:{background:'#F5F0E6',foreground:'#24342F',accent:'#17665B'},beats:captions.map((c:{id:string},i:number)=>({captionIds:[options.badBoard?'missing':c.id],purpose:'개념 전달',metaphor:'회로 모양',headline:i?'빛으로 새기기':'작은 회로',kicker:'반도체',detail:'공정 설명',visual:i?{type:'path',labels:['빛','모양','회로']}:{type:'focus',word:'회로'}}))};
 return Response.json({choices:[{message:{content:JSON.stringify(result)}}]});
 }
 if(url.includes('/with-timestamps')){calls.push('voice');if(body.text!==fixtureScript)throw new Error('Wrong script');const chars=Array.from(fixtureScript),step=.12,pcm=Buffer.alloc(4*24000*2);for(let i=0;i<pcm.length/2;i++)pcm.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/24000)*2500),i*2);return Response.json({audio_base64:pcm.toString('base64'),alignment:options.badTiming?null:{characters:chars,character_start_times_seconds:chars.map((_,i)=>i*step),character_end_times_seconds:chars.map((_,i)=>(i+1)*step)}});}
 throw new Error('Unexpected request');
 };return {request,calls};
}
