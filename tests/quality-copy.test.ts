import {test} from 'node:test';import assert from 'node:assert/strict';
import {checkLabel,checkStatusLabel,findingLabel} from '../src/editor/quality/copy';
test('quality copy preserves unknown check names and distinct outcomes',()=>{
 assert.equal(checkLabel('fps','프레임률'),'초당 프레임 수');
 assert.equal(checkLabel('future','새 검사'),'새 검사');
 assert.equal(checkStatusLabel('pass'),'통과');
 assert.equal(checkStatusLabel('fail'),'실패');
 assert.equal(checkStatusLabel('not_checked'),'미확인');
});
test('layout candidates remain uncertain rather than confirmed errors',()=>{
 assert.match(findingLabel('clipped'),/수 있어요/);
 assert.match(findingLabel('overlap'),/수 있어요/);
 assert.match(findingLabel('missing'),/확인하지 못했어요/);
});
