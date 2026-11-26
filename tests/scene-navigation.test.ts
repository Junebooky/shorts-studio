import {test} from 'node:test';import assert from 'node:assert/strict';
import {demo,type Project} from '../src/core/project';
import {boundedFrame,sceneIndexAtFrame,sceneStartFrame,sceneCaptions,captionSeekFrame,formatSceneTime} from '../src/editor/scene-navigation';
test('scene navigation uses the same ceil boundaries as the renderer',()=>{
 const p:Project={...demo,scenes:[{...demo.scenes[0],endMs:4001},{...demo.scenes[1],startMs:4001},demo.scenes[2]]};
 assert.equal(sceneStartFrame(p,1),121);
 assert.equal(sceneIndexAtFrame(p,120),0);
 assert.equal(sceneIndexAtFrame(p,121),1);
 assert.equal(sceneIndexAtFrame(p,240),2);
 assert.equal(boundedFrame(p,9999),359);assert.equal(boundedFrame(p,-1),0);
 assert.equal(sceneStartFrame(p,3),null);
 assert.equal(sceneIndexAtFrame({...p,scenes:[]},0),-1);
 assert.equal(formatSceneTime(61321),'01:01.32');
});
test('scene caption list uses interval overlap; seek cannot jump into a previous or next scene',()=>{
 const p:Project={...demo,captions:[{id:'overlap',text:'겹치는 자막',startMs:3900,endMs:4100},{id:'end',text:'경계',startMs:3500,endMs:4000},{id:'tiny',text:'짧음',startMs:4001,endMs:4002}]};
 assert.deepEqual(sceneCaptions(p,1).map(c=>c.id),['overlap','tiny']);
 assert.equal(captionSeekFrame(p,1,'overlap'),120);
 assert.equal(captionSeekFrame(p,1,'end'),null);
 assert.equal(captionSeekFrame(p,1,'tiny'),null);
 assert.deepEqual(sceneCaptions(p,-1),[]);
});
