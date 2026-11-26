import {chromium} from 'playwright';import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const out='out/video-workspace';await mkdir(out,{recursive:true});const app=spawn('npm',['run','dev'],{stdio:'inherit',shell:false,detached:true});let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break;}catch{}if(i===79)throw Error('Vite did not start');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'영상 작업 공간',exact:true}).click();
 await page.getByRole('heading',{name:'오늘은 어떤 영상을 만들까요?'}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'단계별 영상 제작'}).isVisible(),false);
 assert.equal(await page.getByLabel('원본 대본').isVisible(),false);
 await page.screenshot({path:out+'/home.png',fullPage:true});
 await page.getByRole('button',{name:'AI 영상 제작 시작',exact:true}).click();
 assert.ok(await page.getByRole('button',{name:'다음 단계',exact:true}).isDisabled());
 await page.getByLabel('영상 주제',{exact:true}).fill('반도체 제조');
 await page.getByRole('button',{name:'다음 단계',exact:true}).click();
 await page.getByRole('heading',{name:'영상의 컬러를 선택하세요.'}).waitFor();assert.equal(await page.getByLabel('영상 주제',{exact:true}).isVisible(),false);
 await page.getByRole('button',{name:'다음 단계',exact:true}).click();await page.getByRole('heading',{name:'목소리를 선택하세요.'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'영상 만들기',exact:true}).isVisible(),false);
 await page.getByRole('button',{name:'이전',exact:true}).click();await page.getByRole('heading',{name:'영상의 컬러를 선택하세요.'}).waitFor();
 await page.getByRole('button',{name:'내 영상',exact:true}).click();await page.getByRole('button',{name:'데모 영상 보기',exact:true}).click();
 const nav=page.getByTestId('scene-navigator');await nav.waitFor();await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();
 await nav.getByTestId('scene-position').filter({hasText:'2 / 3 장면'}).waitFor();
 await page.getByRole('button',{name:'데모로 시작하기',exact:true}).click();await page.waitForFunction(()=>Array.from(document.querySelectorAll('input')).some(el=>el.value==='데모 복제'));
 await page.getByRole('button',{name:'사이버 틸',exact:true}).click();await page.getByText('미리보기 중 · 아직 저장하지 않았어요.',{exact:true}).waitFor();assert.ok(await page.getByRole('button',{name:'저장',exact:true}).isDisabled());
 await page.getByRole('button',{name:'원래 컬러 보기',exact:true}).click();
 await page.getByRole('button',{name:'사이버 틸',exact:true}).click();
 const before=await page.evaluate(async()=>{const id=document.querySelector('main select[aria-label="기존 영상 프로젝트"]').value;return await(await fetch('/api/project?id='+id)).json();});
 await page.getByRole('button',{name:'컬러 적용',exact:true}).click();await page.getByRole('button',{name:/^저장/}).click();await page.getByText('저장했어요.',{exact:true}).filter({visible:true}).waitFor();
 const after=await page.evaluate(async id=>await(await fetch('/api/project?id='+id)).json(),before.id);
 assert.equal(after.theme.background,'#071E26');assert.deepEqual(after.scenes,before.scenes);assert.deepEqual(after.captions,before.captions);assert.equal(after.audio,before.audio);assert.equal(after.durationMs,before.durationMs);
 await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();await nav.getByRole('button',{name:'이 장면 편집',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement?.id==='focused-scene-title');assert.equal(await page.locator('#focused-scene-title').inputValue(),after.scenes[1].headline);
 await page.screenshot({path:out+'/editor.png',fullPage:true});
 await page.getByRole('button',{name:'고급 작업 도구',exact:true}).click();await page.getByRole('heading',{name:'단계별 영상 제작'}).waitFor();
 await page.getByRole('button',{name:'내 영상',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({home:true,guided:true,focusedEditor:true,palettePreservesData:true,advancedReachable:true,mobile:true,errors},null,2));
 console.log('Video workspace UX, guided navigation, actual palette persistence and advanced access PASS');
}finally{await browser?.close();if(app.pid)try{process.kill(-app.pid,'SIGTERM');}catch{}}
