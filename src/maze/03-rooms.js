/* ---- the ten rooms ---- */
mz('m0','The Maze Entrance',['#26282c','#212327','#1a1c20','#141619','#0d0f12'],[
  {x:270,y:8,w:100,h:50,label:'Read the notice',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8cdb0');c.fillStyle='#3a2a1a';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('TEN ROOMS',o.x+50,o.y+22);c.font='9px Georgia';c.fillText('TEN PARTS',o.x+50,o.y+36)},
    act:()=>showNote('A notice, pinned to the wall','TEN ROOMS. TEN PARTS.\n\nEach room holds a mechanism that guards one part of the Unwinder. Complete the task, take the part.\n\nWhite chalk will mark the doors you have used. When all ten parts are yours, the way down will open.')}]);
const CAB=[['red',90,86,'#c0392b'],['blue',520,86,'#4a7ad0'],['green',90,306,'#2f8a4a'],['yellow',520,306,'#d8b83a']];
mz('m1','The Dead Switchboard',['#2a2c30','#25272b','#1c1f24','#15181c','#0e1013'],[
  ...CAB.map(([n,x,y,col],k)=>gl(x,y,'Take the '+n+' cable',()=>!(T.cab||[])[k],()=>{(T.cab=T.cab||[])[k]=1;sfx.pick();say('You take the '+n+' cable. '+T.cab.filter(Boolean).length+' of 4.',3)},col)),
  {x:270,y:8,w:100,h:50,label:'Fix the panel',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e52');for(let i=0;i<4;i++){rect(c,o.x+10+i*22,o.y+12,12,22,'#222');c.fillStyle=T.p1||(T.wire&&T.wire.includes(i))?'#5fd35f':'#a03030';c.fillRect(o.x+13+i*22,o.y+16,6,6)}},
    act:()=>{const n=(T.cab||[]).filter(Boolean).length;
      if(T.p1){say('The panel hums, whole again.',3);return}
      if(n<4){say('The panel is missing '+(4-n)+' cable'+(4-n>1?'s':'')+'. Loose ends hang from the sockets.',4);return}
      openWires(()=>{if(T.p1)return;T.p1=1;sfx.light();say('The last plug seats with a click. The lights shudder, then hold.',4);setTimeout(()=>givePart(0),700)})}}
],{haz:()=>[{x:34,y:128,w:572,h:30,a:pulse(2.6,1.0,0)},{x:34,y:228,w:572,h:30,a:pulse(2.6,1.0,1.3)}]});
mz('m2','The Boiler Room',['#3a2a24','#33251f','#2a1d19','#201512','#150d0b'],[
  {x:60,y:280,w:70,h:40,solid:true,label:'Shovel coal',draw:(c,o)=>{c.fillStyle='#111';c.beginPath();c.moveTo(o.x,o.y+o.h);c.lineTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w,o.y+o.h);c.fill()},act:()=>{if(T.coal){say('Your shovel is already full.',2);return}T.coal=1;say('You shovel a load of coal. Keep it clear of the steam.',3)}},
  {x:270,y:8,w:100,h:56,label:'Feed the furnace',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3e');rect(c,o.x+20,o.y+16,60,34,'#0a0605');const g=T.p2?1:(T.fed||0)/3;c.fillStyle='rgba(255,'+(90+60*g)+',40,'+(.25+.6*g)+')';c.fillRect(o.x+24,o.y+24,52,22)},
    act:()=>{if(T.p2){say('The furnace roars.',2);return}if(!T.coal){say('The furnace is hungry. Fetch coal from the pile.',3);return}T.coal=0;T.fed=(T.fed||0)+1;sfx.light();say('You feed the furnace. '+T.fed+' of 3.',3);if(T.fed>=3){T.p2=1;setTimeout(()=>givePart(1),600)}}}
],{haz:()=>[{x:176,y:66,w:44,h:286,a:pulse(2.4,1.1,0)},{x:298,y:66,w:44,h:286,a:pulse(2.4,1.1,.8)},{x:420,y:66,w:44,h:286,a:pulse(2.4,1.1,1.6)}]});
mz('m3','The Searchlight Hall',['#262a30','#20242a','#191d22','#13161a','#0c0e11'],[
  {x:548,y:110,w:36,h:56,solid:true,label:'Open the locker',draw:drawLocker,act:()=>{if(T.p3){say('The locker is empty.',2);return}T.p3=1;givePart(2)}}
],{haz:()=>[{x:320+Math.sin(time*.36)*240-25,y:64,w:50,h:288,a:2},{x:320+Math.sin(time*.36+3.14)*240-25,y:64,w:50,h:288,a:2}]});
const WT=[1,2,4],sumPan=()=>WT.reduce((a,w,k)=>a+((T.pan||[])[k]?w:0),0);
mz('m4','The Chapel',['#2c2a34','#26242e','#1f1d28','#181620','#100f16'],[
  ...[[80,300],[540,300],[540,110]].map(([x,y],k)=>gl(x,y,'Take the stone weight',()=>!(T.wt||[])[k],()=>{(T.wt=T.wt||[])[k]=1;sfx.pick();say('A stone weight, marked '+WT[k]+'.',3)},'#8a8a92')),
  {x:80,y:90,w:60,h:70,solid:true,label:'Read the plinth',draw:(c,o)=>{rect(c,o.x,o.y+30,o.w,40,'#6a6a70');c.fillStyle='#9a9aa2';c.beginPath();c.arc(o.x+30,o.y+14,12,0,6.3);c.fill();rect(c,o.x+18,o.y+22,24,14,'#9a9aa2')},act:()=>say('On the plinth: "THE OFFERING WEIGHS SIX." The statue holds out a scale, waiting for its other pan to match.',6)},
  {x:400,y:90,w:100,h:56,solid:true,label:'Study the scales',draw:(c,o)=>{const t=Math.max(-1,Math.min(1,(sumPan()-6)*.25));c.save();c.translate(o.x+50,o.y+18);c.rotate(t*.35);rect(c,-46,-3,92,6,'#c9a24a');c.restore();rect(c,o.x+46,o.y+18,8,38,'#6a6a70');c.fillStyle=T.p4?'#5fd35f':'#c9a24a';c.fillRect(o.x+4,o.y+24-t*14,28,6);c.fillRect(o.x+68,o.y+24+t*14,28,6)},
    act:()=>{const s=sumPan();say(T.p4?'The scales rest, perfectly level.':(s<6?'The offering side sinks. You need more weight.':s>6?'Your side sinks. Too much.':'Level.'),4)}},
  ...[0,1,2].map(k=>({x:230+k*70,y:200,w:36,h:30,solid:true,label:'Place or remove a stone weight',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,16,'#4a4a50');if((T.pan||[])[k]){c.fillStyle='#9a9aa2';c.fillRect(o.x+6,o.y,24,16);c.fillStyle='#222';c.font='bold 12px Georgia';c.textAlign='center';c.fillText(WT[k],o.x+18,o.y+13)}},
    act:()=>{if(T.p4){say('The scales are balanced.',2);return}if(!(T.wt||[])[k]){say('You have not found the weight marked '+WT[k]+' yet.',3);return}(T.pan=T.pan||[])[k]=!T.pan[k];sfx.light();if(sumPan()===6){T.p4=1;say('The scales settle, level. Something in the altar clicks.',4);setTimeout(()=>givePart(3),700)}}}))
]);
const TRW=[[4,6],[7,9],[2,3.5]];
mz('m5','The Darkroom',['#3a1f24','#33191e','#2a1318','#200d11','#15070a'],[
  {x:200,y:8,w:170,h:50,label:'Read the chart',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8cdb0');c.fillStyle='#3a2a1a';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('A: 4 to 6 seconds',o.x+85,o.y+16);c.fillText('B: 7 to 9 seconds',o.x+85,o.y+30);c.fillText('C: 2 to 3.5 seconds',o.x+85,o.y+44)},act:()=>say('A chart pinned over the sink: how long each print must stay in its tray. Any longer or shorter and the picture is lost.',6)},
  {x:420,y:8,w:80,h:50,label:'Read the clock',draw:(c,o)=>{c.fillStyle='#e8dfc8';c.beginPath();c.arc(o.x+40,o.y+26,22,0,6.3);c.fill();const a=((time%12)/12)*Math.PI*2;c.strokeStyle='#1a120c';c.lineWidth=2;c.beginPath();c.moveTo(o.x+40,o.y+26);c.lineTo(o.x+40+Math.sin(a)*18,o.y+26-Math.cos(a)*18);c.stroke();for(let i=0;i<12;i++){const b=i/12*Math.PI*2;c.fillStyle='#1a120c';c.fillRect(o.x+40+Math.sin(b)*20-1,o.y+26-Math.cos(b)*20-1,2,2)}},act:()=>say('A clock with one long hand that sweeps a full turn every twelve seconds. A tick for every second.',5)},
  ...[0,1,2].map(k=>({x:110+k*190,y:170,w:70,h:40,solid:true,label:'Use tray '+'ABC'[k],draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3e');rect(c,o.x+6,o.y+6,o.w-12,o.h-12,((T.tr||[])[k]||{}).ok?'#5a8a5a':'#6a3030');const t=(T.tr||[])[k];if(t&&t.s!=null){c.fillStyle='rgba(255,230,170,.7)';c.fillRect(o.x+10,o.y+12,o.w-20,8)}},
    act:()=>{
      const tr=T.tr=T.tr||[{},{},{}],t=tr[k];
      if(t.ok){say('Print '+'ABC'[k]+' is developed and drying.',3);return}
      if(t.s==null){t.s=time;sfx.light();say('You slide the paper into tray '+'ABC'[k]+'. The image begins to surface. Watch the clock.',4);return}
      const e=time-t.s,w=TRW[k];t.s=null;
      if(e>=w[0]&&e<=w[1]){t.ok=1;sfx.pick();say('Print '+'ABC'[k]+' is perfect. '+tr.filter(x=>x.ok).length+' of 3.',3);if(tr.every(x=>x.ok)){T.p5=1;setTimeout(()=>givePart(4),700)}}
      else say(e<w[0]?'Pulled too soon. The image is a grey blur. Start again.':'Left too long. The paper has gone black. Start again.',4);
    }}))
]);
const NEEDW=[1,3,2];
mz('m6','The Greenhouse',['#1f3226','#1a2a20','#16241b','#101c14','#0b130e'],[
  {x:200,y:8,w:200,h:50,label:'Read the chart',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8e0c8');for(let k=0;k<3;k++)for(let j=0;j<NEEDW[k];j++){c.fillStyle='#3a7ac0';c.beginPath();c.arc(o.x+34+k*66+j*12,o.y+28,4,0,6.3);c.fill()}},act:()=>say('A chart of water drops, one group per plant, left to right. The can holds only two.',5)},
  {x:60,y:290,w:44,h:44,solid:true,label:'Fill the watering can',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,30,'#4a4a50');rect(c,o.x+18,o.y,8,16,'#6a6a70')},act:()=>{T.can=2;sfx.light();say('You fill the can. Two measures.',3)}},
  ...[0,1,2].map(k=>({x:230+k*130,y:90,w:44,h:50,solid:true,label:'Water the plant',draw:(c,o)=>{rect(c,o.x+6,o.y+30,32,20,'#6a4a30');c.fillStyle='#2f8a4a';const h=((T.pw||[])[k]||0)*8+8;c.fillRect(o.x+20,o.y+30-h,4,h);c.beginPath();c.arc(o.x+22,o.y+30-h,8,0,6.3);c.fill()},
    act:()=>{
      if(T.p6){say('The plants are thriving.',2);return}
      if(!T.can){say('The can is empty. Fill it at the pump.',3);return}
      const pw=T.pw=T.pw||[0,0,0];T.can--;pw[k]++;sfx.light();
      if(pw[k]>NEEDW[k]){pw[k]=0;say('Too much. The roots rot and the pot resets.',4);return}
      say('You water the plant. The can has '+T.can+' left.',3);
      if(pw.every((v,i)=>v===NEEDW[i])){T.p6=1;setTimeout(()=>givePart(5),700)}
    }}))
],{haz:()=>[{x:34,y:178,w:572,h:30,a:pulse(3,1.2,0)}]});
mz('m7','The Weeping Statues',['#2a2a2e','#242428','#1d1d21','#16161a','#0e0e11'],[
  ...[0,1,2,3].map(k=>({get x(){return (T.st||STI)[k][0]-14},get y(){return (T.st||STI)[k][1]-22},w:28,h:44,
    draw:(c,o)=>{c.fillStyle='#9a9aa2';c.beginPath();c.arc(o.x+14,o.y+8,8,0,6.3);c.fill();rect(c,o.x+4,o.y+16,20,26,'#8a8a92');c.fillStyle='rgba(120,180,255,.7)';c.fillRect(o.x+9,o.y+10,2,6);c.fillRect(o.x+17,o.y+10,2,6)}})),
  gl(560,300,'Take the crank',()=>!T.cranked,()=>{T.cranked=1;T.st=null;givePart(6);say('You take the crank. The statues stop. For now.',4)},'#8a6a3a')
]);
mz('m8','The Vault',['#2e2a24','#28241f','#201d18','#181612','#100e0b'],[
  {x:270,y:8,w:100,h:60,label:'Pick the vault lock',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a5a5e');rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#3a3a3e');c.strokeStyle=T.p8?'#5fd35f':'#c9a24a';c.lineWidth=3;c.beginPath();c.arc(o.x+50,o.y+30,14,0,6.3);c.stroke()},act:()=>{if(T.p8){say('The vault stands open and empty.',3);return}openTiming('The vault lock',3,()=>{T.p8=1;givePart(7)})}},
  ...[0,1,2].map(k=>({x:90+k*60,y:70,w:44,h:30,solid:true,label:'Open the lockbox',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4a50');rect(c,o.x+18,o.y+10,8,8,'#c9a24a')},act:()=>say(['Empty. Only dust and one bent key.','Empty. A single tooth, pulled long ago.','Empty. Someone scratched "NOT HERE" inside the lid.'][k],4)})),
  {...D(296,336,48,16,'mstairs',320,110),when:()=>(T.parts||[]).filter(Boolean).length>=10,draw:c=>doorBottom(c,'#2a2a30',true)}
]);
mz('m9','The Elevator Shaft',['#2a2d2a','#242724','#1c1f1c','#151815','#0d0f0d'],[
  gl(80,300,'Take the counterweight',()=>!T.cw,()=>{T.cw=1;sfx.pick();say('A heavy iron counterweight. It drags at your arm.',3)},'#6a6a70'),
  gl(520,110,'Take the fuse',()=>!T.fuse,()=>{T.fuse=1;sfx.pick();say('A ceramic fuse, still intact.',3)},'#d8d0c0'),
  {x:270,y:8,w:100,h:56,label:'Run the lift',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3e');rect(c,o.x+10,o.y+10,80,36,'#10181a');c.fillStyle=T.p9?'#5fd35f':'#a03030';c.fillRect(o.x+40,o.y+20,20,16)},
    act:()=>{if(T.p9){say('The lift is down at the bottom of the shaft.',3);return}if(!T.cw||!T.fuse){say('The lift needs '+(!T.cw&&!T.fuse?'a counterweight and a fuse':!T.cw?'a counterweight':'a fuse')+'.',4);return}T.p9=1;sfx.door();say('The counterweight settles, the fuse sparks, and the lift drops away into the dark.',5);setTimeout(()=>givePart(8),900)}}
],{haz:()=>[{x:116,y:64,w:50,h:288,a:pulse(2.8,.9,0)},{x:290,y:64,w:50,h:288,a:pulse(2.8,.9,.9)},{x:464,y:64,w:50,h:288,a:pulse(2.8,.9,1.8)}]});
mz('m10','The Hall of Footsteps',['#22222a','#1d1d25','#17171e','#121217','#0b0b0f'],[
  lockerO(44,250),lockerO(560,110),lureO(180,100,'Drop the bucket','A bucket clatters across the stone. The footsteps turn toward the sound.'),
  gl(560,300,'Take the lullaby sheet',()=>!T.p10,()=>{T.p10=1;givePart(9)},'#e8dfc8')
],{lights:()=>[]});
/* the staircase down and the basement */
const paintStairs=c=>{paintBase(c,{floor:'#1c1d22',floor2:'#17181c',wall:'#121317',wall2:'#0d0e11',trim:'#08090b',stone:true});doorTop(c,'#2a2a30');
  for(let i=0;i<10;i++){const g=60-i*5;c.fillStyle='rgb('+g+','+g+','+(g+8)+')';c.fillRect(150+i*24,84+i*19,340-i*48,230-i*36);c.fillStyle='rgba(0,0,0,.45)';c.fillRect(150+i*24,84+i*19+(230-i*36)-6,340-i*48,6)}
  c.fillStyle='#050508';c.fillRect(260,260,120,10);c.strokeStyle='#6a6a72';c.lineWidth=3;c.beginPath();c.moveTo(150,84);c.lineTo(150,314);c.moveTo(490,84);c.lineTo(490,314);c.stroke()};
ROOMS.mstairs={name:'The Way Down',paint:paintStairs,lights:()=>[{x:320,y:230,r:200,a:.5}],objs:[
  {x:260,y:250,w:120,h:70,label:'Go down the staircase',act:()=>{changeRoom('base',320,310);say('The stairs go down, and down, and down. At the bottom, the air hums.',6)}},
  D(292,64,56,20,'m8',320,310)]};
ROOMS.base={name:'The Basement',paint:paintX(0,0),lights:()=>[{x:320,y:110,r:240,a:.65,col:'60,200,200'},{x:130,y:230,r:90,a:.6}],objs:[
  {...mach,act:()=>{
    if(!T.asm){say('The machine hums, almost amused. Bare hands will not hurt it. You have ten parts and a workbench.',6);return}
    openKeys('The Unwinder','1513',()=>playCards(UNWIND_CARDS,startReveal),'Crank the Unwinder. Play Wren\u2019s lullaby backwards: the last note first. Press 1 to 8 or click the keys.');
  }},
  {x:80,y:200,w:100,h:50,solid:true,label:'Assemble the Unwinder',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a2a');rect(c,o.x,o.y,o.w,5,'#6a5a40');if(T.asm){rect(c,o.x+30,o.y+12,40,26,'#c9a24a');rect(c,o.x+36,o.y+16,28,6,'#6a4a1a')}},
    act:()=>{if(T.asm){say('The Unwinder sits on the bench, ready.',3);return}if((T.parts||[]).filter(Boolean).length<10){say('You are still missing parts of the Unwinder.',4);return}T.asm=true;sfx.solve();addNote('The Unwinder',UWTXT);showNote('The Unwinder',UWTXT,()=>say('Face the machine and play the lullaby backwards.',6))}}]};
function startMaze(keep){
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  if(keep===true&&chapter===8&&T.parts){hearts=3;T.sp=[320,300];T.coal=0;T.st=null}
  else{T={vis:{},parts:[],sp:[320,300]}}
  chapter=8;mode='play';roomId='m0';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;hearts=3;invuln=0;updateHUD();
  say('The machine is not here. It is beneath the house, and the house has built a maze around the stairs. Ten rooms. Ten parts.',8);
  saveGame();
}
function hint8(){
  const p=T.parts||[],n=p.filter(Boolean).length;let t;
  if(roomId==='base'||roomId==='mstairs')t='Use the workbench. Fit the four mechanism parts, then play Wren\u2019s whole lullaby backwards on the eight keys: ten notes, the last one first. The first four notes are the scraps you found in the nursery; the other six you found in the maze. Check your journal (J).';
  else if(n<10){const k=[0,1,2,3,4,5,6,7,8,9].find(j=>!p[j]);t='A part is still missing: '+MZP[k][0]+'. '+MZP[k][2]+' Chalk marks show the doors you have already used.'}
  else t='All ten parts are yours. A staircase has opened in the south-east of the maze, in the vault.';
  say('Hint: '+t,9);
}
