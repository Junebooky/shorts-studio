import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='out/completion-motion';await mkdir(out,{recursive:true});
const app=spawn('npm',['run','dev'],{stdio:'inherit',detached:true});let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break;}catch{}if(i===79)throw Error('Vite did not start');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];let paid=0;
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(quick\/create|elevenlabs|render)/.test(r.url()))paid++;});
 const id='00000000-0000-4000-8000-000000000001',pid='00000000-0000-4000-8000-000000000002';
 const brand={version:1,name:'',primary:'#1E60F3',accent:'#1346D8',background:'#F8FAFC',foreground:'#0F172A',font:'sans',tone:'professional',style:'minimal',guidelines:'',logo:null};
 const seed={record:{version:1,id,plan:{topic:'완성 검증 테스트',formats:['card','thread']},brand,source:null},card:{version:1,name:'카드 테스트',size:'portrait',brand,planId:id,pages:[{id:pid,layout:'cover',title:'첫 카드',body:'짧은 본문'}]},thread:{version:1,name:'스레드 테스트',source:{kind:'topic',planId:id},posts:[{id:pid,text:'첫 게시글'}]}};
 await page.addInitScript(seed=>{if(sessionStorage.getItem('completion-fixture'))return;sessionStorage.setItem('completion-fixture','1');localStorage.setItem('shorts-studio.shared-content.v1',JSON.stringify(seed.record));localStorage.setItem('shorts-studio.card-news.v1',JSON.stringify(seed.card));localStorage.setItem('shorts-studio.threads.v1',JSON.stringify(seed.thread));},seed);
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'제작 결과',exact:true}).click();
 const panel=page.getByTestId('completion-panel'),graphic=panel.locator('[data-motion-graphic]');await panel.waitFor();assert.equal(await graphic.count(),0);
 await panel.getByRole('button',{name:'카드뉴스 완성 확인',exact:true}).click();await panel.getByRole('heading',{name:'카드뉴스 제작 완성!',exact:true}).waitFor();assert.equal(await graphic.getAttribute('data-motion-graphic'),'card-news-complete');
 await panel.getByRole('button',{name:'스레드 완성 확인',exact:true}).click();await panel.getByRole('heading',{name:'모든 선택 콘텐츠 제작 완성!',exact:true}).waitFor();assert.equal(await graphic.getAttribute('data-motion-graphic'),'all-content-complete');assert.equal(await graphic.locator('.ss-mg-assemble').count(),2);assert.equal(await graphic.locator('linearGradient').count(),0);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await graphic.locator('.ss-mg-check').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.screenshot({path:out+'/result-complete.png',fullPage:true});
 await page.getByRole('button',{name:'카드뉴스 확인 및 편집',exact:true}).click();await page.getByLabel('페이지 제목',{exact:true}).fill('수정 중');
 await page.getByRole('button',{name:'제작 결과',exact:true}).click();await panel.waitFor();assert.equal(await graphic.count(),0);assert.ok(await panel.getByRole('button',{name:'카드뉴스 완성 확인',exact:true}).isDisabled());
 assert.equal(paid,0);assert.deepEqual(errors,[]);
}finally{await browser?.close();try{process.kill(-app.pid,'SIGTERM');}catch{app.kill();}}
