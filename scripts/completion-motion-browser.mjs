import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='out/completion-motion';await mkdir(out,{recursive:true});
const app=spawn('npm',['run','dev'],{stdio:'inherit',detached:true});let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5173/motion-lab.html')).ok)break;}catch{}if(i===79)throw Error('Vite did not start');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/motion-lab.html');await page.getByRole('heading',{name:'Motion Graphic Design Lab'}).waitFor();
 const all=page.locator('[data-motion-graphic]');assert.equal(await all.count(),4);const video=all.first();const enter=video.locator('.ss-mg-enter');assert.equal(await enter.evaluate(e=>getComputedStyle(e).animationName),'mg-enter');
 await page.getByLabel('재생 속도').selectOption('2');assert.equal(await enter.evaluate(e=>getComputedStyle(e).animationDuration),'0.325s');
 await page.getByRole('button',{name:'일시 정지',exact:true}).click();assert.equal(await enter.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
 await page.getByRole('button',{name:'모두 다시 재생'}).click();assert.equal(await enter.evaluate(e=>getComputedStyle(e).animationPlayState),'running');
 await page.getByLabel('컬러 테마').selectOption('sunset');assert.equal(await video.locator('linearGradient stop').nth(1).getAttribute('stop-color'),'#EE6548');
 await page.getByLabel('숏츠 색상',{exact:true}).fill('#123456');assert.equal(await video.locator('linearGradient stop').nth(1).getAttribute('stop-color'),'#123456');
 const combined=all.last();await page.getByRole('checkbox',{name:'카드뉴스',exact:true}).uncheck();assert.equal(await combined.locator('.ss-mg-assemble').count(),2);
 await page.getByLabel('재생 방식').selectOption('loop');const firstClock=await video.locator('.ss-mg-loop-clock').elementHandle();await page.waitForFunction(el=>!el.isConnected,firstClock,{timeout:6000});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await enter.evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByLabel('애니메이션 사용').uncheck();assert.equal(await video.getAttribute('data-play'),'none');
 await page.screenshot({path:out+'/desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));await page.screenshot({path:out+'/mobile.png',fullPage:true});
 await page.reload();assert.equal(await page.getByLabel('숏츠 색상',{exact:true}).inputValue(),'#123456');assert.deepEqual(errors,[]);
}finally{await browser?.close();try{process.kill(-app.pid,'SIGTERM');}catch{app.kill();}}
