import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='out/scene-navigation';await mkdir(out,{recursive:true});
const app=spawn('npm',['run','dev'],{stdio:'inherit',shell:false,detached:true});let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break;}catch{}if(i===79)throw new Error('Vite did not start');await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:'데모 영상 보기',exact:true}).click();
 const nav=page.getByTestId('scene-navigator');await nav.waitFor();
 await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();
 await nav.getByTestId('scene-position').filter({hasText:'2 / 3 장면'}).waitFor();
 assert.equal(await nav.getByRole('button',{name:'타임라인 장면 2',exact:true}).getAttribute('aria-current'),'step');
 await page.getByTestId('project-preview').getByText('한 걸음씩',{exact:true}).waitFor();
 await nav.getByRole('button',{name:'자막 위치로 이동: 오늘의 한 걸음이 내일의 방향을 만듭니다.',exact:true}).click();
 assert.equal(await nav.getByRole('button',{name:'자막 위치로 이동: 오늘의 한 걸음이 내일의 방향을 만듭니다.',exact:true}).getAttribute('aria-current'),'true');
 await nav.getByRole('button',{name:'다음 장면',exact:true}).click();
 await nav.getByTestId('scene-position').filter({hasText:'3 / 3 장면'}).waitFor();assert.ok(await nav.getByRole('button',{name:'다음 장면',exact:true}).isDisabled());
 assert.ok(await nav.getByRole('button',{name:'이 장면 편집',exact:true}).isDisabled());
 await page.getByRole('button',{name:'데모로 시작하기',exact:true}).click();
 await page.getByRole('heading',{name:'데모 복제',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('main input')!==null&&Array.from(document.querySelectorAll('input')).some(el=>el.value==='데모 복제'));
 await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();
 await nav.getByRole('button',{name:'이 장면 편집',exact:true}).click();
 const field=page.locator('#focused-scene-title');await field.waitFor();await page.waitForFunction(()=>document.activeElement?.id==='focused-scene-title');
 await nav.getByRole('button',{name:'장면 1로 이동',exact:true}).click();const original=await field.inputValue();await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();
 await field.fill('두 번째 장면 수정');await nav.getByTestId('current-scene-detail').getByRole('heading',{name:'두 번째 장면 수정',exact:true}).waitFor();
 await nav.getByRole('button',{name:'장면 1로 이동',exact:true}).click();assert.equal(await field.inputValue(),original);await nav.getByRole('button',{name:'장면 2로 이동',exact:true}).click();
 await page.getByRole('button',{name:/^저장/}).click();await page.getByText('저장했어요.',{exact:true}).filter({visible:true}).waitFor();
 const persisted=await page.evaluate(async()=>{const id=document.querySelector('main select').value;return await(await fetch('/api/project?id='+id)).json();});
 assert.equal(persisted.scenes[1].headline,'두 번째 장면 수정');assert.equal(persisted.scenes[0].headline,original);assert.equal(persisted.captions.length,3);
 await page.screenshot({path:out+'/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await nav.getByRole('button',{name:'이전 장면',exact:true}).click();await nav.getByTestId('scene-position').filter({hasText:'1 / 3 장면'}).waitFor();await page.screenshot({path:out+'/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);await writeFile(out+'/report.json',JSON.stringify({demoFixture:true,sceneSeek:true,captionSeek:true,editFocus:true,persistence:true,mobile:true,errors},null,2));
 console.log('Scene navigation, caption seek, precise edit, saved project and mobile PASS');
}finally{await browser?.close();if(app.pid)try{process.kill(-app.pid,'SIGTERM');}catch{}}
