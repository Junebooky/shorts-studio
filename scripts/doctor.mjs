import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {parseEnv} from 'node:util';
import path from 'node:path';
const cwd=process.cwd(),req=createRequire(path.join(cwd,'package.json')),checks=[];
const add=(id,name,ok,required,detail)=>checks.push({id,name,status:ok?'ready':required?'missing':'optional',required,detail});
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:5000,windowsHide:true,stdio:['ignore','pipe','pipe']});return r.status===0&&!r.error;};
add('node','Node.js 22+',Number(process.versions.node.split('.')[0])>=22,true,'현재 '+process.versions.node+' · Node.js 22 이상 필요');
const npmCli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules','npm','bin','npm-cli.js');
const npmOk=existsSync(npmCli)?run(process.execPath,[npmCli,'--version']):process.platform!=='win32'&&run('npm',['--version']);
add('npm','npm',npmOk,true,'Node.js와 함께 설치하고 npm run doctor로 다시 확인하세요.');
const deps=['vite','react','remotion','@remotion/renderer','tsx','zod'];const missing=deps.filter(d=>{try{req.resolve(d);return false;}catch{return true;}});
add('deps','프로젝트 의존성',!missing.length,true,missing.length?'npm ci 실행 필요: '+missing.join(', '):'필수 모듈 해석 가능');
add('ffprobe','FFprobe',run('ffprobe',['-version']),true,'MP4/WAV/MP3 소재 등록·저장·복구에 필요. FFmpeg 설치 후 PATH 설정.');
add('ffmpeg','FFmpeg',run('ffmpeg',['-version']),false,'로컬 변환 및 테스트 소재 생성에 사용.');
add('python','Python 3',run('python3',['--version'])||run('python',['--version']),false,'로컬 Whisper를 사용할 경우 별도 Python 환경 필요.');
const env={};let envReadable=true;for(const name of ['.env','.env.local','.env.development','.env.development.local']){try{if(existsSync(path.join(cwd,name)))Object.assign(env,parseEnv(readFileSync(path.join(cwd,name),'utf8')));}catch{envReadable=false;}}
const configured=(key)=>!!String(process.env[key]??env[key]??'').trim();
add('elevenlabs','ElevenLabs 키 설정',envReadable&&configured('ELEVENLABS_API_KEY'),false,'설정 존재 여부만 확인. 실제 인증·크레딧·음성 품질은 검사하지 않음. .env.local에 재발급 키를 설정하세요.');
add('voice','기본 Voice ID',envReadable&&configured('ELEVENLABS_VOICE_ID'),false,'선택 사항. 웹에서 음성을 선택할 수 있습니다.');
for(const [id,dir] of [['remotion-skills','vendor/skills/remotion-official'],['motion-skills','vendor/skills/motion-graphics-upstream']]){let found=false;try{found=readdirSync(path.join(cwd,dir)).some(x=>x!=='.git');}catch{}add(id,dir,found,false,'git submodule update --init '+dir);}
const report={version:1,ready:checks.every(c=>!c.required||c.status==='ready'),checks,limitations:['오프라인 설치/설정 점검입니다. 실제 렌더링, ElevenLabs 인증, IDE 자동 실행은 검사하지 않습니다.','키나 환경변수 값은 출력하지 않습니다.']};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));else{for(const c of checks)console.log('['+c.status+'] '+c.name+' — '+c.detail);console.log(report.ready?'기본 로컬 제작 환경 확인 완료':'필수 설치 항목을 확인하세요.');for(const s of report.limitations)console.log(s);}
if(!report.ready)process.exitCode=1;
