/* ================= STAGE 5: THE MIRROR REALM ================= */
const FJ='The Journal of the Observer\n\nEntry 1: "The dining room clock had to show seven."\nEntry 2: "Wren was Aldric\u2019s eldest child, born in 1802."\nEntry 3: "The escaped patient was Ames, photograph four."\nEntry 4: "The lullaby ended on the fifth step, SOL."\n\nSome entries are lies the house wrote for you. Only the truths open the glass.';
const OBS='Observation log, Subject 07:\n\n"The copy is nearly complete. It has absorbed her memories of the manor: the clock, the safe, the tapes, the drawing.\n\nShe was not the first to arrive. Her friend met an earlier version of her at the door, and that version did not know it was a copy."';
const hallPaint=(c,m)=>{paintBase(c,m?{floor:'#1f3236',floor2:'#25393d',wall:'#17262a',wall2:'#111d20',trim:'#0b1517'}:{floor:'#34261e',floor2:'#3b2b22',wall:'#2a2029',wall2:'#221a22',trim:'#171016'});rect(c,210,150,220,150,m?'#1a3a3a':'#3a1a24');c.strokeStyle=m?'#6ab0b0':'#8a6a3a';c.strokeRect(222.5,162.5,195,125);if(m)doorLR(c,0,'#2a4a4a')};
const paintStudy=c=>{paintBase(c,{floor:'#2a2630',floor2:'#302a38',wall:'#221c2a',wall2:'#1a1522',trim:'#120e18'});doorLR(c,608,'#2a4a4a')};
function drawMirror(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#8a7a5a');rect(c,o.x+5,o.y+5,o.w-10,o.h-10,'#1c2c32');
  const turn=T.refl>0,rx=turn?o.x+o.w/2:o.x+o.w/2-(player.x-320)*.15,ry=o.y+o.h-8;
  c.globalAlpha=.8;rect(c,rx-8,ry-26,16,18,'#4a3b5c');c.fillStyle='#d6b79c';c.beginPath();c.arc(rx+(turn?3:0),ry-32,7,0,6.3);c.fill();c.fillStyle='#3a2418';c.beginPath();c.arc(rx+(turn?3:0),ry-34,7.2,Math.PI,0);c.fill();
  rect(c,rx+(turn?3:0)+(turn?2:-3),ry-33,2,2,'#111');c.globalAlpha=1;
}
const STAGE5={
  hallR:{name:'The Hall',paint:c=>hallPaint(c,0),lights:()=>[{x:320,y:90,r:170,a:.6},{x:320,y:230,r:120,a:.5}],objs:[
    {x:270,y:4,w:100,h:56,label:'Touch the mirror',draw:drawMirror,act:()=>switchWorld()},
    {x:150,y:150,w:44,h:56,solid:true,label:'Turn the statue',draw:(c,o)=>{rect(c,o.x,o.y+36,o.w,20,'#6a6a70');c.fillStyle=T.moved?'#8a8a92':'#a0a0a8';c.beginPath();c.arc(o.x+22,o.y+14,10,0,6.3);c.fill();rect(c,o.x+12+(T.moved?6:0),o.y+22,20,16,'#a0a0a8')},
      act:()=>{if(T.moved){say('The statue stands aside on its pedestal.');return}T.moved=true;sfx.door();say('The statue grinds around on its pedestal, a quarter turn.',4)}}]},
  hallM:{name:'The Hall, Reversed',paint:c=>hallPaint(c,1),lights:()=>[{x:320,y:90,r:170,a:.6},{x:430,y:210,r:90,a:.7}],objs:[
    {x:270,y:4,w:100,h:56,label:'Touch the mirror',draw:drawMirror,act:()=>switchWorld()},
    {x:400,y:200,w:70,h:40,solid:true,label:'Take the silver key',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a4a4a');if(!T.key){rect(c,o.x+20,o.y+10,26,4,'#d8d8e8');c.fillStyle='#d8d8e8';c.beginPath();c.arc(o.x+18,o.y+12,6,0,6.3);c.fill()}},
      act:()=>{if(T.key){say('Only a faint outline of the key remains.');return}T.key=true;sfx.pick();updateHUD();say('A silver key lies on a table that does not exist in the real hall. You take it.',5)}},
    {x:40,y:165,w:50,h:70,solid:true,when:()=>!T.moved,label:'Examine the statue',draw:(c,o)=>{rect(c,o.x,o.y+40,o.w,30,'#5a7a7a');c.fillStyle='#8ab0b0';c.beginPath();c.arc(o.x+25,o.y+18,12,0,6.3);c.fill();rect(c,o.x+14,o.y+28,22,16,'#8ab0b0')},act:()=>say('A statue blocks the door. In the real hall, one like it stands on a pedestal that turns.',5)},
    D(32,170,22,60,'study',550,210,()=>!T.key,'The door is locked. The keyhole is silver-bright.')]},
  study:{name:'The Observer\u2019s Study',paint:paintStudy,lights:()=>[{x:200,y:210,r:130,a:.8}],objs:[
    {x:150,y:190,w:110,h:50,solid:true,label:'Read the journal',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3040');rect(c,o.x+30,o.y+10,40,26,'#d9ccab')},
      act:()=>{if(T.truth){say('The glass is already open.');return}addNote('The false journal',FJ);showNote('The false journal',FJ,()=>openSortJournal(()=>{T.truth=true;heal();sfx.solve();addNote('Observation log',OBS);showNote('Observation log',OBS,stageEnd)},'Four entries: 1 if true, 0 if false.'))}},
    D(586,170,22,60,'hallM',70,210)]}
};
function switchWorld(){
  roomId=roomId==='hallR'?'hallM':'hallR';fade=.8;roomT=1.5;sfx.door();
  if(blocked(player.x,player.y)){player.x=320;player.y=310}
  if(!T.fals){T.fals=1;T.dop=1;notes.forEach(n=>{n.text=n.text.replace('born in 1889','born in 1809').replace('the first step','the second step')});
    say('Something in your journal has changed. And across the hall, someone is copying your every move.',6)}
  saveGame();
}
function beginStage5(){
  chapter=5;T={h:[]};redMode=false;hearts=3;updateHUD();roomId='hallR';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('You climb out of the nursery into a hall you almost recognise. Everything is slightly wrong. The mirror on the far wall is the only way to tell.',7);
}
function hint5(){
  let t;
  if(!T.moved)t='Turn the statue in the real hall, then touch the mirror to cross over.';
  else if(!T.plates)t='In the reversed hall, stand on one glowing floor plate. Your copy mirrors you, one second late, and must stand on the other.';
  else if(!T.key)t='The mirror hall holds things the real one does not. Take the key from the table.';
  else if(!T.truth)t='Take the silver key to the locked door in the reversed hall. In the study, judge each journal entry against what you remember (1 true, 0 false). Your own notes may have changed.';
  else t='Read the observation log.';
  say('Hint: '+t,6);
}

