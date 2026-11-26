import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaultWorkspace,findWorkspace,toggleGroup,workspaceGroups,type WorkspaceItem} from '../src/workspace/navigation';
test('marketing groups and child routes are unique and identify real vs planned features',()=>{
 const groups=workspaceGroups.map(g=>g.id),items=workspaceGroups.flatMap(g=>[...g.items] as WorkspaceItem[]);
 assert.equal(new Set(groups).size,groups.length);assert.equal(new Set(items.map(i=>i.id)).size,items.length);
 assert.equal(findWorkspace(defaultWorkspace).item.ready,true);
 assert.equal(findWorkspace('trending-videos').item.ready,false);
 assert.equal(findWorkspace('card-create').group.id,'card-news');
 assert.deepEqual(items.filter(i=>i.ready).map(i=>i.id),['marketing-home','video-studio','video-guide','card-create','brand-kit']);
});
test('planned routes describe upcoming features and card news is available',()=>{
 for(const group of workspaceGroups)for(const item of group.items)if(!item.ready)assert.match(item.description,/준비하고 있어요/);
 assert.equal(findWorkspace('card-create').item.ready,true);
 assert.equal(defaultWorkspace,'marketing-home');
 assert.equal(findWorkspace('trending-videos').item.label,'인기 영상 찾기');
});
test('groups expand independently and collapse without changing other groups',()=>{
 assert.deepEqual(toggleGroup(['video'],'card-news'),['video','card-news']);
 assert.deepEqual(toggleGroup(['video','card-news'],'video'),['card-news']);
});
