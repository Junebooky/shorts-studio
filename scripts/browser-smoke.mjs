import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='out/browser';await mkdir(out,{recursive:true});
const app=spawn('npm',['run','dev'],{stdio:'inherit',shell:false,detached:true});
let browser;const observations=[];
function wavFixture(){const rate=16000,count=rate*4,b=Buffer.alloc(44+count*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);for(let i=0;i<count;i++){const s=i/rate;const active=(s>.3&&s<1.6)||(s>2&&s<3.5);b.writeInt16LE(active?Math.round(Math.sin(i*2*Math.PI*220/rate)*5000):0,44+i*2);}return b;}
try {
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break;}catch{}if(i===79)throw new Error('Vite did not start');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.getByRole('heading',{name:'Shorts Studio'}).waitFor();
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
 const style=await page.locator('main > section').first().evaluate(el=>({border:getComputedStyle(el).borderTopWidth,shadow:getComputedStyle(el).boxShadow}));assert.equal(style.border,'0px');assert.notEqual(style.shadow,'none');observations.push('Card border 0px and shadow present');
 await page.screenshot({path:out+'/desktop-demo.png',fullPage:true});
 await page.getByRole('button',{name:'새 프로젝트'}).click();await page.getByLabel('프로젝트 이름').fill('브라우저 테스트');
 await page.getByLabel('원본 대본').fill('작은 선택. 오늘 시작합니다.');
 await page.getByLabel('성우 음성').setInputFiles({name:'test-tone.wav',mimeType:'audio/wav',buffer:wavFixture()});
 await page.getByText('음성 가져오기 완료. 실제 타임스탬프와 장면을 준비하세요.',{exact:true}).waitFor();
 const srt='1\n00:00:00,300 --> 00:00:01,600\n작은선택\n\n2\n00:00:02,000 --> 00:00:03,500\n오늘 시작합니다\n';
 await page.getByLabel('실제 타임스탬프 (SRT / Whisper JSON)').setInputFiles({name:'test.srt',mimeType:'application/x-subrip',buffer:Buffer.from(srt)});
 await page.getByText('원문 텍스트 일치',{exact:true}).waitFor();await page.getByText('100%',{exact:true}).waitFor();
 observations.push('WAV import, SRT import, original Korean text alignment and Master Timeline UI');
 await page.getByRole('button',{name:/^저장/}).click();await page.getByText('로컬 저장 완료',{exact:true}).waitFor();
 await page.screenshot({path:out+'/desktop-timing.png',fullPage:true});
 await page.getByRole('button',{name:'직접 편집'}).click();await page.getByRole('heading',{name:'속성 편집'}).waitFor();
 assert.equal(await page.locator('textarea').nth(1).inputValue(),'작은 선택.');
 await page.getByRole('button',{name:'AI 자동 제작'}).click();await page.getByLabel('원본 대본').fill('수정된 대본');
 await page.getByText('Master Timeline · 음성 및 타임스탬프 등록 후 분석됩니다.',{exact:true}).waitFor();observations.push('Script edits invalidate stale timing');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile-timing.png',fullPage:true});
 assert.deepEqual(errors,[]);observations.push('No uncaught page errors');
 console.log(observations.join('\n'));
}finally{await writeFile(out+'/report.json',JSON.stringify({observations},null,2));await browser?.close();if(app.pid)try{process.kill(-app.pid,'SIGTERM');}catch{}}
