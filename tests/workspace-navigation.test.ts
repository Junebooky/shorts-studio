import {test} from 'node:test';import assert from 'node:assert/strict';
import {defaultWorkspace,findWorkspace,toggleGroup,workspaceGroups} from '../src/workspace/navigation';
test('marketing groups and child routes are unique and identify real vs planned features',()=>{
 const groups=workspaceGroups.map(g=>g.id),items=workspaceGroups.flatMap(g=>Array.from(g.items, item=>item));
 assert.equal(new Set(groups).size,groups.length);assert.equal(new Set(items.map(i=>i.id)).size,items.length);
 assert.equal(findWorkspace(defaultWorkspace).item.ready,true);
 assert.equal(findWorkspace('trending-videos').item.ready,false);
 assert.equal(findWorkspace('card-create').group.id,'card-news');
 assert.deepEqual(items.filter(i=>i.ready).map(i=>i.id),['video-studio','video-guide']);
});
test('groups expand independently and collapse without changing other groups',()=>{
 assert.deepEqual(toggleGroup(['video'],'card-news'),['video','card-news']);
 assert.deepEqual(toggleGroup(['video','card-news'],'video'),['card-news']);
});
