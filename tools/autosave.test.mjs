// Regression tests for room autosaves and legacy checkpoint compatibility.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/core/06-intro-and-menu.js', import.meta.url), 'utf8');
const begin = source.indexOf('/* ===== AUTOSAVE V2:');
const end = source.indexOf('function openMenu(', begin);
assert.ok(begin !== -1 && end > begin, 'Autosave implementation could not be found');
const implementation = source.slice(begin, end);

function harness() {
  const storage = new Map();
  let writes = 0;
  const controls = new Map();
  const state = {
    chapter:3,roomId:'lab',player:{x:340,y:220,dir:'left'},mode:'play',
    S:{brass:true,clock:true},T:{pk:[1,1,1],ink:true,mix:[0,2]},
    notes:[{title:'Experiment log',text:'A + C'}],hearts:2,
    lit:[true,false,false,false],seq:['red','blue'],redMode:true,
    time:123,playTime:42,eventT:12,beatT:3,
    corr:{xs:[90,310,530],good:1},dollSlots:['wardrobe',null,null],
    clkH:7,C2CK:{hour:40,minute:120},JB:[{title:'Old Journal',text:'Memory'}],
    ghost:{on:true,timer:1},GH:['lab'],invuln:0,fade:0,roomT:0,doorCool:0,near:{label:'Object'},
    ROOMS:{
      foyer:{name:'Entrance Hall'},lab:{name:'The Laboratory'},
      corr:{name:'Corridor'},hallM:{name:'The Mirror Hall'},
      foyer2:{name:'Changed Entrance Hall'},m4:{name:'Maze Room'}
    },
    STN:['The Hollow Manor','Forgotten Wing','Underground Laboratory','Nursery','Mirror Realm','Heart'],
    localStorage:{
      getItem(key){return storage.get(key)??null},
      setItem(key,value){writes++;storage.set(key,value)},
      removeItem(key){storage.delete(key)}
    },
    $(id){
      if(!controls.has(id))controls.set(id,{hidden:false,textContent:'',classList:{remove(){}}});
      return controls.get(id);
    },
    refreshTitleExtras(){},updateHUD(){},initAudio(){},unstick(){},say(){},
    reset(){
      state.chapter=1;state.roomId='foyer';state.player={x:320,y:250,dir:'up'};
      state.S={};state.T={};state.notes=[];state.hearts=3;
      state.lit=[];state.seq=[];state.redMode=false;state.mode='title';
    },
    start(){state.started=true},startCycle2(){state.legacyCycle=true},
    startMaze(){state.legacyMaze=true},beginStage(n){state.legacyStage=n}
  };
  const api = new Function('state','with(state){'+implementation+
    '\nreturn {saveGame,validSnapshot,restoreSnapshot,continueGame,refreshContinue}}')(state);
  return {state,storage,controls,api,writes:()=>writes};
}

test('autosave persists room, position, inventory, lighting and puzzle progress',()=>{
  const h=harness();
  assert.equal(h.api.saveGame(),true);
  const data=JSON.parse(h.storage.get('hm'));
  assert.equal(data.v,2);
  assert.equal(data.room,'lab');
  assert.equal(data.player.x,340);
  assert.equal(data.stage.ink,true);
  assert.deepEqual(data.stage.pk,[1,1,1]);
  assert.equal(data.state.brass,true);
  assert.equal(data.red,true);
  assert.equal(data.hp,2);
  assert.equal(data.elapsed,123);
  assert.deepEqual(data.corridor.xs,[90,310,530]);
});

test('Continue restores the same puzzle and location after a reset',()=>{
  const h=harness();
  h.api.saveGame();
  h.state.T={ink:false};h.state.roomId='foyer';h.state.S={};
  h.state.player={x:80,y:90,dir:'up'};
  h.api.continueGame();
  assert.equal(h.state.chapter,3);
  assert.equal(h.state.roomId,'lab');
  assert.equal(h.state.player.x,340);
  assert.equal(h.state.player.y,220);
  assert.equal(h.state.T.ink,true);
  assert.equal(h.state.S.brass,true);
  assert.equal(h.state.redMode,true);
  assert.equal(h.state.ghost.on,false);
  assert.equal(h.state.mode,'play');
});

test('Stage 1 snapshots make Continue available',()=>{
  const h=harness();h.state.chapter=1;h.state.roomId='foyer';
  h.api.saveGame();h.api.refreshContinue();
  const b=h.controls.get('bContinue');
  assert.equal(b.hidden,false);
  assert.match(b.textContent,/Stage 1/);
});

test('unchanged snapshots are not written twice',()=>{
  const h=harness();h.api.saveGame();h.api.saveGame();
  assert.equal(h.writes(),1);
  h.state.T.ink=false;h.api.saveGame();
  assert.equal(h.writes(),2);
});

test('legacy checkpoints still load through their stage path',()=>{
  const h=harness();h.storage.set('hm',JSON.stringify({c:2,n:[{title:'Legacy',text:'Note'}]}));
  h.api.continueGame();
  assert.equal(h.state.legacyStage,2);
  assert.equal(h.state.notes[0].title,'Legacy');
});

test('invalid or stale snapshots cannot restore arbitrary rooms',()=>{
  const h=harness();h.api.saveGame();
  const bad=JSON.parse(h.storage.get('hm'));bad.room='no-such-room';
  assert.equal(h.api.validSnapshot(bad),false);
  bad.room='lab';bad.player={x:Infinity,y:100};
  assert.equal(h.api.validSnapshot(bad),false);
});

test('autosave never overwrites the game from the title or ending',()=>{
  const h=harness();h.api.saveGame();const first=h.storage.get('hm');
  h.state.mode='title';h.state.T.ink=false;
  assert.equal(h.api.saveGame(),false);
  assert.equal(h.storage.get('hm'),first);
});
