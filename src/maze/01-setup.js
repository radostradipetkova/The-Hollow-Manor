/* ===== THE MAZE BENEATH (the Destroy path): ten rooms, ten parts of the Unwinder ===== */
const DESTROY_CARDS=[
  ['YOU CHOOSE TO DESTROY IT','The machine hums, patient, almost amused. "You cannot. It is not here. It is beneath the house, and the house is a maze that keeps what it loves."',null,40],
  ['THE MANOR','Ten mechanisms. Ten parts. Find them all, and the stairs will open.',null,45]];
const UNWIND_CARDS=[['THE MACHINE','No. Not that song. Not backwards.',null,50],['THE MACHINE','You do not understand what you are unwinding. It has been asleep inside me for so long.',null,40],['THE MACHINE','...thank you.',null,80]];
const UWTXT='You fit the casing around the cylinder. The comb meshes with the cylinder, the spring winds around the gear, the bell hangs from the key, the crank slides onto the axle, and the lullaby sheet curls in last.\n\nA music box. Ten parts. Somewhere inside it, a tune you know by heart is waiting.';
const MZP=[
  ['the casing','A warm brass casing, ticking as the current returns.','A dead switchboard. Collect the four loose cables and plug them back in. Sparks cross the floor in bands.'],
  ['the cylinder','A pinned brass cylinder, still hot from the furnace.','A boiler room. Carry three loads of coal to the furnace without crossing the steam.'],
  ['the comb','A steel comb, with teeth like tiny notes.','A hall of searchlights. Cross it to reach the locker at the far end.'],
  ['the spring','A coiled spring, tight with old hymns.','A chapel with a scale. Find three stone weights and balance the statue\u2019s offering.'],
  ['the gear','A small brass gear, still wet from the developer.','A darkroom. Develop three prints, taking each from its tray at the right moment.'],
  ['the bell','A tiny silver bell that rings when you breathe.','A greenhouse. Water the three plants exactly as much as the chart says. The can holds two.'],
  ['the crank','A worn wooden crank, shaped by a child\u2019s hand.','A hall of weeping statues. They move whenever you do not face them. Fetch the crank.'],
  ['the axle','A steel axle, cold and smooth.','A vault. Pick its lock by stopping the tumblers in the bright zone, three times running.'],
  ['the key','A winding key, heavy for its size.','An elevator shaft. Find the counterweight and a fuse, then run the lift. Debris falls in columns.'],
  ['the lullaby sheet','A single sheet of music, in Wren\u2019s handwriting.','A hall where something walks behind you. The sheet is at its far end.']];
const MZSIDE={W:{z:[32,170,22,60],sp:[70,210],d:c=>doorLR(c,0,'#3a3a44')},E:{z:[586,170,22,60],sp:[550,210],d:c=>doorLR(c,608,'#3a3a44')},N:{z:[292,64,56,20],sp:[320,110],d:c=>doorTop(c,'#3a3a44')},S:{z:[296,336,48,16],sp:[320,310],d:c=>doorBottom(c,'#3a3a44',false)}};
const MZE=[['m0','N','m2','S'],['m0','W','m4','E'],['m0','E','m5','W'],['m0','S','m7','N'],['m2','W','m1','E'],['m2','E','m3','W'],['m1','S','m4','N'],['m3','S','m5','N'],['m4','S','m6','N'],['m5','S','m8','N'],['m6','E','m7','W'],['m6','S','m9','N'],['m7','E','m8','W'],['m7','S','m10','N'],['m9','E','m10','W']];
const MZD={},HAZ={};
MZE.forEach(([a,sa,b,sb])=>{(MZD[a]=MZD[a]||[]).push({side:sa,to:b,ts:sb});(MZD[b]=MZD[b]||[]).push({side:sb,to:a,ts:sa})});
const pulse=(per,on,ph)=>{const t=(time+ph)%per;return t<on?2:(t>per-.7?1:0)};
const mzDoor=(room,d)=>{const z=MZSIDE[d.side].z,sp=MZSIDE[d.ts].sp;
  return {...D(z[0],z[1],z[2],z[3],d.to,sp[0],sp[1]),
    fn:()=>{(T.vis=T.vis||{})[room+d.side]=1;changeRoom(d.to,sp[0],sp[1]);T.sp=[sp[0],sp[1]];invuln=1.3},
    draw:c=>{if((T.vis||{})[room+d.side]){const p={W:[40,150],E:[598,150],N:[316,72],S:[320,326]}[d.side];c.strokeStyle='rgba(235,235,225,.75)';c.lineWidth=2;c.beginPath();c.moveTo(p[0]-6,p[1]-6);c.lineTo(p[0]+6,p[1]+6);c.moveTo(p[0]+6,p[1]-6);c.lineTo(p[0]-6,p[1]+6);c.stroke()}}}};
function drawHaz(id,c){for(const h of HAZ[id]()){if(!h.a)continue;c.fillStyle=h.a===1?'rgba(255,200,80,.10)':'rgba(255,'+(90+Math.floor(40*Math.sin(time*30)))+',60,.5)';c.fillRect(h.x,h.y,h.w,h.h)}}
function mz(id,name,col,objs,opt){
  opt=opt||{};const ds=MZD[id]||[];if(opt.haz)HAZ[id]=opt.haz;
  ROOMS[id]={name,paint:c=>{paintBase(c,{floor:col[0],floor2:col[1],wall:col[2],wall2:col[3],trim:col[4],stone:true});ds.forEach(d=>MZSIDE[d.side].d(c))},
    lights:()=>[{x:320,y:200,r:190,a:.5},...(opt.lights?opt.lights():[])],
    objs:[...(opt.haz?[{x:0,y:0,w:0,h:0,draw:c=>drawHaz(id,c)}]:[]),...objs,...ds.map(d=>mzDoor(id,d))]};
}
const gl=(x,y,label,when,act,col)=>({x,y,w:28,h:18,label,when,draw:(c,o)=>{rect(c,o.x,o.y+6,o.w,8,col||'#c9a24a');const g=.35+.35*Math.sin(time*4+x);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+o.w-4,o.y+5,2+g*1.5,0,6.3);c.fill()},act});
const slab=(c,o,col,top)=>{rect(c,o.x,o.y,o.w,o.h,col);rect(c,o.x,o.y,o.w,4,top||'#6a7478')};
function givePart(i){
  const p=T.parts=T.parts||[];if(p[i])return;p[i]=1;
  const n=p.filter(Boolean).length;heal();sfx.solve();shake=.3;updateHUD();addNote(i<4?'Unwinder part: '+MZP[i][0]:'Lullaby note '+(i+1),MZP[i][1]);
  say((i<4?'You take '+MZP[i][0]:'You find a note of Wren\u2019s lullaby')+'. '+n+' of 10.',5);
  if(i>=4)setTimeout(()=>showNote('Lullaby note '+(i+1),MZP[i][1]),900);
  if(n===10)setTimeout(()=>say('Deep in the maze, stone grinds against stone. A staircase has opened somewhere to the south-east.',9),2600);
}
function hurt(){
  if(invuln>0)return;
  hearts--;updateHUD();invuln=1.8;flash=.8;shake=.5;sfx.scare();T.coal=0;T.st=null;
  if(hearts<=0){mode='over';$('over').classList.add('on');return}
  const sp=T.sp||[320,300];player.x=sp[0];player.y=sp[1];unstick();
}
const STI=[[130,170],[260,270],[420,150],[520,240]];
function mazeUpdate(dt){
  const hz=HAZ[roomId];
  if(hz&&invuln<=0){const L=player.x-9,R=player.x+9,Tp=player.y-12,B=player.y;for(const h of hz()){if(h.a===2&&L<h.x+h.w&&R>h.x&&Tp<h.y+h.h&&B>h.y){hurt();return}}}
  if(roomId==='m7'&&!T.cranked){
    const st=T.st=T.st||STI.map(a=>a.slice()),fv={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[player.dir]||[0,1];
    for(const q of st){const dx=player.x-q[0],dy=player.y-14-q[1],d=Math.hypot(dx,dy)||1,looked=d<320&&(fv[0]*dx+fv[1]*dy)/d>.55;if(!looked){q[0]+=dx/d*42*dt;q[1]+=dy/d*42*dt}if(d<24&&invuln<=0){hurt();return}}
  }
}
/* timing mini-game for the vault lock */
const TM={i:null,hits:0,need:3,ok:null,z:40,p:0};
function tmZone(){TM.z=10+Math.random()*60;$('tZone').style.left=TM.z+'%';$('tZone').style.width='20%'}
function tmPress(){
  if(TM.p>=TM.z-3&&TM.p<=TM.z+20){TM.hits++;sfx.light();$('tOut').textContent='Click. '+TM.hits+' of '+TM.need+'.';
    if(TM.hits>=TM.need){clearInterval(TM.i);const f=TM.ok;closeModal();setTimeout(f,200);return}tmZone()}
  else{TM.hits=0;sfx.bad();$('tOut').textContent='Slipped. The tumblers reset.';tmZone()}
}
function openTiming(title,need,ok){
  let el=$('tim');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='tim';
    el.innerHTML='<div class="card" style="text-align:center"><h2></h2><p class="small">Press the button, or Space, when the white marker is inside the green zone. Do it three times in a row. The marker speeds up.</p><div style="position:relative;height:34px;background:#0b080d;border:1px solid var(--line);border-radius:8px;margin:16px 0;overflow:hidden"><div id="tZone" style="position:absolute;top:0;bottom:0;background:rgba(95,211,95,.45)"></div><div id="tMark" style="position:absolute;top:0;bottom:0;width:6px;background:#fff"></div></div><div id="tOut" style="min-height:1.6em;font-family:var(--ui)"></div><div class="row"><button class="btn primary" id="tGo" type="button">Set the tumbler</button><button class="btn" id="tX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);el.querySelector('#tGo').onclick=tmPress;el.querySelector('#tX').onclick=closeModal;
  }
  el.querySelector('h2').textContent=title;TM.need=need;TM.ok=ok;TM.hits=0;tmZone();$('tOut').textContent='';
  clearInterval(TM.i);
  TM.i=setInterval(()=>{if(!modal||modal.id!=='tim'){clearInterval(TM.i);return}TM.p=(1+Math.sin(performance.now()/1000*(2.8+TM.hits*.7)))/2*94;$('tMark').style.left=TM.p+'%'},16);
  openModal('tim',c=>{if(c==='Escape')closeModal();else if(c==='Space'||c==='Enter'||c==='KeyE')tmPress()});
}
