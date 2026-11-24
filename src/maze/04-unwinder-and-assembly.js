/* ===== The Unwinder is played, not assembled: nine parts are instruments, played in reverse ===== */
const SONG=[5,6,2,8,3,7,4,1,0],UNW_TARGET=SONG.slice().reverse(),UNW_F=[262,294,330,349,392,440,494,523,587];
const SHEET='Wren\u2019s Lullaby, in her own hand. Each line is one instrument, to be played in this order:\n\n'+SONG.map((p,k)=>(k+1)+'. '+MZP[p][0]).join('\n')+'\n\nAt the bottom, in pencil: "To unwind it, play it the other way."';
const UW={s:[]};
function uwShow(){$('uOut').textContent=UW.s.map(i=>MZP[i][0].replace('the ','')).join('  >  ')}
function uwPress(i){
  tone(UNW_F[i],.9,'triangle',.22);UW.s.push(i);if(UW.s.length>9)UW.s.shift();uwShow();
  if(UW.s.length===9){
    if(UW.s.every((v,k)=>v===UNW_TARGET[k])){setTimeout(()=>{closeModal();playCards(UNWIND_CARDS,startReveal)},900)}
    else $('uHint').textContent='That is not the lullaby, forwards or backwards. Clear it and try again.';
  }
}
function openUnwinder(){
  let el=$('unw');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='unw';
    el.innerHTML='<div class="card" style="text-align:center"><h2>The Unwinder</h2><p class="small">Nine of the ten parts are instruments. Wren\u2019s sheet lists them in the order she played them. Play them the other way round. You can also press 1 to 9.</p><div class="row" id="uRow"></div><div id="uOut" style="min-height:2.4em;font:700 15px system-ui,sans-serif;letter-spacing:.04em;color:var(--gold)"></div><div id="uHint" class="small" style="min-height:1.4em"></div><div class="row"><button class="btn" id="uClear" type="button">Clear</button><button class="btn" id="uX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    const row=el.querySelector('#uRow');
    for(let i=0;i<9;i++){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=(i+1)+' '+MZP[i][0].replace('the ','');b.onclick=()=>uwPress(i);row.appendChild(b)}
    el.querySelector('#uClear').onclick=()=>{UW.s=[];uwShow();$('uHint').textContent=''};el.querySelector('#uX').onclick=closeModal;
  }
  UW.s=[];uwShow();$('uHint').textContent='';
  openModal('unw',c=>{if(c==='Escape')closeModal();else if(c==='Backspace'){UW.s=[];uwShow();$('uHint').textContent=''}else if(/^(Digit|Numpad)[1-9]$/.test(c))uwPress(+c.slice(-1)-1)});
}
{const bo=ROOMS.base.objs;
 const mc=bo.find(o=>o.label==='Face the machine');mc.act=()=>say('The machine hums, almost amused. The Unwinder on the bench is the only thing in this room that can hurt it.',6);
 const wb=bo.find(o=>o.label==='Assemble the Unwinder');
 wb.label='Play the Unwinder';
 wb.draw=(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a2a');rect(c,o.x,o.y,o.w,5,'#6a5a40');rect(c,o.x+14,o.y+10,72,30,'#8a6a2a');rect(c,o.x+18,o.y+14,64,22,'#2a1c0a');for(let i=0;i<10;i++){c.fillStyle=(T.parts||[])[i]?'#e5c279':'#4a3a20';c.beginPath();c.arc(o.x+23+i*6,o.y+25,2,0,6.3);c.fill()}};
 wb.act=()=>{
   const n=(T.parts||[]).filter(Boolean).length;
   if(n<10){say('The Unwinder is still missing parts. You have '+n+' of 10.',4);return}
   openUnwinder();
 }}
/* ===== The maze finishes the lullaby: 4 mechanism parts + the notes 5 to 10 of Wren's song ===== */
/* notes 1-4 (mi, do, sol, do) are the scraps from the nursery; the maze holds the second verse */
const VERSE2=[['LA, the sixth step of the ladder'],['SOL, the fifth step'],['MI, the third step'],['RE, the second step'],['DO, the first step'],['high DO, the eighth step']];
VERSE2.forEach((v,k)=>{const i=4+k;MZP[i]=['note '+(i+1)+' of the lullaby','Wren\u2019s lullaby has a second verse. Note '+(i+1)+' of the whole song is '+v[0]+'.',MZP[i][2]]});
/* the whole song is 3 1 5 1 | 6 5 3 2 1 8, so played backwards it is 8 1 2 3 5 6 1 5 1 3 (high do counts as do) */
const UW2='You fit the casing around the cylinder, set the comb against its pins, and wind the spring behind them. A music box with eight keys, one for each step of the ladder.\n\nIt is waiting for a song. Wren\u2019s song. Played the other way.';
{const wb=ROOMS.base.objs.find(o=>o.label==='Play the Unwinder');
 wb.label='Use the Unwinder';
 wb.draw=(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a2a');rect(c,o.x,o.y,o.w,5,'#6a5a40');rect(c,o.x+14,o.y+10,72,30,T.asm?'#8a6a2a':'#3a3024');rect(c,o.x+18,o.y+14,64,22,'#2a1c0a');for(let i=0;i<10;i++){c.fillStyle=(T.parts||[])[i]?(i<4?'#e5c279':'#7ad8e0'):'#4a3a20';c.beginPath();c.arc(o.x+23+i*6,o.y+25,2,0,6.3);c.fill()}};
 wb.act=()=>{
   const p=T.parts||[],mech=[0,1,2,3].filter(i=>p[i]).length,nts=[4,5,6,7,8,9].filter(i=>p[i]).length;
   if(mech+nts<10){say('The Unwinder needs its four mechanism parts and the six notes of the second verse. You have '+mech+' of 4 parts and '+nts+' of 6 notes.',6);return}
   if(!T.asm){openAssemble(()=>{if(T.asm)return;T.asm=true;sfx.solve();addNote('The Unwinder',UW2);showNote('The Unwinder',UW2,()=>say('Use the Unwinder again to play the lullaby. Nothing here plays itself.',6))});return}
   openKeys('The Unwinder','1123561513',()=>playCards(UNWIND_CARDS,startReveal),'Eight keys, one for each step of the ladder: 1 do, 2 re, 3 mi, 4 fa, 5 sol, 6 la, 7 ti, 8 high do. Play Wren\u2019s whole lullaby backwards: ten notes, the last one first. Your journal has the first four notes from the nursery and the other six from the maze.');
 }}
/* ===== Assembling the Unwinder by hand: four mechanism parts, then the six notes pinned to its rack ===== */
const AW=640,AH=380;
const ASM_PARTS=[ /* name, target centre, tray centre, why it must wait */
  ['casing',[300,212],[86,88],''],
  ['cylinder',[300,176],[86,162],'The cylinder has nothing to sit in yet. The casing goes down first.'],
  ['comb',[300,222],[86,228],'The comb has to sit against the cylinder’s pins. Fit the cylinder first.'],
  ['spring',[396,250],[86,290],'The spring winds behind the comb. Fit the comb first.']];
const ASM_NOTE=[['LA',440],['SOL',392],['MI',330],['RE',294],['DO',262],['high DO',523]];
const asmSlot=k=>[468+(k%2)*84,96+(k/2|0)*64];
const AS={el:null,cv:null,cx:null,raf:0,ok:null,held:null,px:0,py:0,sx:0,sy:0,drag:false,moved:false,pile:[],snap:[],done:0,bounce:null};
function asmPilePos(j){const i=AS.pile.indexOf(j);return [222+i*68,346]}
function asmDrawPart(c,k,x,y,s,ghost){
  c.save();c.translate(x,y);c.scale(s,s);
  if(ghost){c.setLineDash([5,4]);c.strokeStyle='rgba(229,194,121,.35)';c.lineWidth=1.5}
  const brass=(a,b)=>{const g=c.createLinearGradient(0,a,0,b);g.addColorStop(0,'#f0d08a');g.addColorStop(.45,'#c9a24a');g.addColorStop(1,'#6a4a1a');return g};
  if(k===0){ /* casing: open brass box */
    if(ghost){c.strokeRect(-100,-62,200,124);c.restore();return}
    c.fillStyle='#3a2410';c.fillRect(-100,-62,200,124);
    c.fillStyle=brass(-62,62);c.fillRect(-100,-62,200,10);c.fillRect(-100,52,200,10);c.fillRect(-100,-62,10,124);c.fillRect(90,-62,10,124);
    c.fillStyle='#1d1208';c.fillRect(-90,-52,180,104);
    c.fillStyle='#8a6a2a';for(const [fx,fy] of [[-94,-56],[94,-56],[-94,56],[94,56]]){c.beginPath();c.arc(fx,fy,3,0,6.3);c.fill()}
  }else if(k===1){ /* cylinder with pins */
    if(ghost){c.strokeRect(-66,-17,132,34);c.restore();return}
    c.fillStyle=brass(-17,17);c.beginPath();c.roundRect(-66,-17,132,34,8);c.fill();
    c.fillStyle='#4a3010';c.fillRect(-74,-4,8,8);c.fillRect(66,-4,8,8);
    c.fillStyle='#fff3c8';for(let i=0;i<22;i++){c.beginPath();c.arc(-58+i*5.5,-10+((i*7)%5)*5,1.3,0,6.3);c.fill()}
  }else if(k===2){ /* steel comb */
    if(ghost){c.strokeRect(-66,-9,132,18);c.restore();return}
    const g=c.createLinearGradient(0,-9,0,9);g.addColorStop(0,'#e8eef2');g.addColorStop(1,'#6a7478');
    c.fillStyle=g;c.fillRect(-66,0,132,9);
    for(let i=0;i<18;i++)c.fillRect(-64+i*7.3,-9,4.5,10);
  }else{ /* spring: spiral */
    if(ghost){c.beginPath();c.arc(0,0,20,0,6.3);c.stroke();c.restore();return}
    c.fillStyle='#2a2a2e';c.beginPath();c.arc(0,0,21,0,6.3);c.fill();
    c.strokeStyle='#c8ced2';c.lineWidth=2;c.beginPath();for(let a=0;a<6.3*4;a+=.15){const r=2+a*.7;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.stroke();
  }
  c.restore();
}
function asmDrawScrap(c,j,x,y,lift){
  c.save();c.translate(x,y);c.rotate(lift?0:((j*37)%9-4)*.02);
  if(lift){c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=12;c.shadowOffsetY=6}
  c.fillStyle='#dccda6';c.beginPath();c.moveTo(-30,-20);c.lineTo(28,-21);c.lineTo(31,19);c.lineTo(-29,21);c.closePath();c.fill();c.shadowColor='transparent';
  c.strokeStyle='rgba(43,33,23,.25)';c.lineWidth=1;for(let i=-10;i<=10;i+=5){c.beginPath();c.moveTo(-24,i);c.lineTo(24,i);c.stroke()}
  c.fillStyle='#2b2117';c.textAlign='center';c.font='bold 14px Georgia';c.fillText(ASM_NOTE[j][0],0,3);
  c.font='9px Georgia';c.fillText('note '+(j+5),0,15);
  c.restore();
}
function asmDraw(){
  const c=AS.cx,t=performance.now()/1000,P=T.asmP,N=T.asmN;
  c.clearRect(0,0,AW,AH);
  /* workbench wood */
  let g=c.createLinearGradient(0,0,0,AH);g.addColorStop(0,'#3a2818');g.addColorStop(1,'#20150c');c.fillStyle=g;c.fillRect(0,0,AW,AH);
  c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;for(let y=8;y<AH;y+=22){c.beginPath();c.moveTo(0,y);c.bezierCurveTo(200,y+6,420,y-6,AW,y+3);c.stroke()}
  /* parts tray */
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.roundRect(12,24,148,300,10);c.fill();
  c.fillStyle='rgba(229,194,121,.45)';c.font='bold 10px system-ui,sans-serif';c.textAlign='center';c.fillText('PARTS',86,40);
  c.fillText('THE UNWINDER',300,40);c.fillText('SONG RACK',510,40);
  /* ghost outlines for the next missing parts */
  for(let k=0;k<4;k++)if(!P[k]){const [x,y]=ASM_PARTS[k][1];asmDrawPart(c,k,x,y,1,true)}
  /* placed parts, in build order */
  for(let k=0;k<4;k++)if(P[k]){const [x,y]=ASM_PARTS[k][1],sn=AS.snap[k]||0;asmDrawPart(c,k,x,y-sn*6,1)}
  /* tray parts */
  for(let k=0;k<4;k++)if(!P[k]&&AS.held!==k){const [x,y]=ASM_PARTS[k][2];asmDrawPart(c,k,x,y,k===0?.6:.9)}
  /* rack with six numbered pins */
  c.fillStyle='#2a1c10';c.beginPath();c.roundRect(436,50,170,214,8);c.fill();c.strokeStyle='#6a5a40';c.lineWidth=2;c.stroke();
  for(let s=0;s<6;s++){const [x,y]=asmSlot(s);
    if(N[s])asmDrawScrap(c,s,x,y);
    else{c.setLineDash([4,3]);c.strokeStyle=AS.held!==null&&AS.held>=4&&Math.hypot(AS.px-x,AS.py-y)<34?'rgba(255,240,190,.9)':'rgba(229,194,121,.3)';c.lineWidth=1.5;c.strokeRect(x-30,y-21,60,42);c.setLineDash([]);
      c.fillStyle='rgba(229,194,121,.5)';c.font='bold 16px Georgia';c.textAlign='center';c.fillText(s+5,x,y+6)}
    c.fillStyle='#b48a3e';c.beginPath();c.arc(x,y-17,2.5,0,6.3);c.fill()}
  /* loose note scraps along the front of the bench */
  for(const j of AS.pile)if(AS.held!==j+4){const [x,y]=asmPilePos(j);asmDrawScrap(c,j,x,y)}
  /* bounce-back animation */
  if(AS.bounce){const b=AS.bounce,f=Math.min(1,(t-b.t)/.35),x=b.x+(b.tx-b.x)*f,y=b.y+(b.ty-b.y)*f-Math.sin(f*3.14)*24;
    if(b.k<4)asmDrawPart(c,b.k,x,y,b.k===0?.6:.9);else asmDrawScrap(c,b.k-4,x,y);if(f>=1)AS.bounce=null}
  /* held piece */
  if(AS.held!==null){const k=AS.held;if(k<4)asmDrawPart(c,k,AS.px,AS.py,k===0?.75:1);else asmDrawScrap(c,k-4,AS.px,AS.py,true)}
  if(AS.done){c.fillStyle='rgba(255,230,160,'+(.1+.06*Math.sin(t*14)).toFixed(2)+')';c.fillRect(0,0,AW,AH)}
}
function asmLoop(){
  if(!modal||modal.id!=='asm'){AS.raf=0;AS.held=null;return}
  for(let k=0;k<4;k++)if(AS.snap[k]>0)AS.snap[k]=Math.max(0,AS.snap[k]-.08);
  asmDraw();AS.raf=requestAnimationFrame(asmLoop);
}
function asmMsg(s){$('aOut').textContent=s}
function asmNextPart(){return [0,1,2,3].find(k=>!T.asmP[k])}
function asmPos(e){const r=AS.cv.getBoundingClientRect();AS.px=(e.clientX-r.left)*AW/r.width;AS.py=(e.clientY-r.top)*AH/r.height}
function asmHome(k){return k<4?ASM_PARTS[k][2]:asmPilePos(k-4)}
function asmPick(k){if(AS.done)return;AS.held=k;sfx.step();asmMsg(k<4?'You pick up the '+ASM_PARTS[k][0]+'.':'You pick up the scrap marked '+ASM_NOTE[k-4][0]+'.')}
function asmBack(k,msg){const [x,y]=asmHome(k);AS.bounce={k,x:AS.px,y:AS.py,tx:x,ty:y,t:performance.now()/1000};AS.held=null;if(msg)asmMsg(msg)}
function asmDrop(){
  const k=AS.held;if(k===null)return;
  if(k<4){const [x,y]=ASM_PARTS[k][1];
    if(Math.hypot(AS.px-x,AS.py-y)>(k===0?110:60)&&!(AS.px>200&&AS.px<410&&AS.py>140&&AS.py<285)){asmBack(k,'You set the '+ASM_PARTS[k][0]+' back down.');return}
    asmPlacePart(k);return}
  const j=k-4;let s=-1;for(let i=0;i<6;i++){const [x,y]=asmSlot(i);if(Math.abs(AS.px-x)<36&&Math.abs(AS.py-y)<28)s=i}
  if(s<0){asmBack(k,'You put the scrap back on the bench.');return}
  asmPinNote(j,s);
}
function asmPlacePart(k){
  const nx=asmNextPart();
  if(k!==nx){sfx.bad();asmBack(k,ASM_PARTS[k][3]||'That does not fit yet.');return}
  AS.held=null;T.asmP[k]=1;AS.snap[k]=1;sfx.door();sfx.light();
  asmMsg(['The casing settles onto the bench.','The cylinder drops into the casing and turns, once.','The comb slides home. Its teeth catch on the pins.','You wind the spring. It ticks, tight with old hymns.'][k]);
  asmCheck();
}
function asmPinNote(j,s){
  if(T.asmN[s]){asmBack(j+4,'Another scrap is already pinned there.');return}
  if(s!==j){sfx.bad();asmBack(j+4,'The pin will not take it. That is not note '+(s+5)+'.');return}
  AS.held=null;T.asmN[s]=1;AS.pile=AS.pile.filter(v=>v!==j);tone(ASM_NOTE[j][1],.9,'triangle',.2);
  asmMsg('You pin note '+(j+5)+', '+ASM_NOTE[j][0]+'. It hums faintly.');asmCheck();
}
function asmCheck(){
  if(T.asmP.every(Boolean)&&T.asmN.every(Boolean)){
    AS.done=1;asmMsg('The last piece is in. Somewhere inside the box, a tune you know is waiting.');
    setTimeout(()=>{const f=AS.ok;closeModal();if(f)setTimeout(f,200)},1500);
  }else if(T.asmP.every(Boolean)&&!T.asmN.some(Boolean))setTimeout(()=>{if(!AS.done&&!T.asmN.some(Boolean))asmMsg('The mechanism is whole. Now pin the six notes of the second verse to the rack.')},1600);
}
function openAssemble(ok){
  let el=$('asm');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='asm';
    el.innerHTML='<div class="card" style="max-width:720px;text-align:center;padding:clamp(12px,2.4vw,24px)"><h2 style="margin:0 0 .2em">The workbench</h2><canvas id="aCv" style="display:block;width:100%;aspect-ratio:640/380;margin:8px 0;border-radius:10px;touch-action:none;cursor:grab"></canvas><div id="aOut" role="status" aria-live="polite" style="min-height:1.6em;font-family:var(--ui)"></div><p class="small" style="margin:.3em 0 .6em">Drag the parts into the Unwinder, or tap a part and then tap where it goes. Build it from the bottom up. Then pin each note to its number on the rack. Keys: 1–4 for the parts, 5–9 and 0 for the notes.</p><div class="row"><button class="btn" id="aX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    const cv=AS.cv=el.querySelector('#aCv'),dpr=Math.min(2,window.devicePixelRatio||1);
    cv.width=AW*dpr;cv.height=AH*dpr;AS.cx=cv.getContext('2d');AS.cx.setTransform(dpr,0,0,dpr,0,0);
    el.querySelector('#aX').onclick=closeModal;
    cv.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;asmPos(e);
      if(AS.held!==null){asmDrop();return}
      let hit=null;
      for(let k=0;k<4;k++)if(!T.asmP[k]){const [x,y]=ASM_PARTS[k][2];if(Math.abs(AS.px-x)<66&&Math.abs(AS.py-y)<32)hit=k}
      for(const j of AS.pile){const [x,y]=asmPilePos(j);if(Math.abs(AS.px-x)<32&&Math.abs(AS.py-y)<24)hit=j+4}
      if(hit===null)return;
      asmPick(hit);AS.drag=true;AS.moved=false;AS.sx=AS.px;AS.sy=AS.py;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';
    });
    cv.addEventListener('pointermove',e=>{asmPos(e);if(AS.drag&&Math.hypot(AS.px-AS.sx,AS.py-AS.sy)>10)AS.moved=true});
    cv.addEventListener('pointerup',e=>{if(!AS.drag)return;AS.drag=false;cv.style.cursor='grab';asmPos(e);if(AS.moved)asmDrop()});
    cv.addEventListener('pointercancel',()=>{AS.drag=false;AS.held=null});
  }
  if(!T.asmP)T.asmP=[0,0,0,0];
  if(!T.asmN)T.asmN=[0,0,0,0,0,0];
  AS.pile=[0,1,2,3,4,5].filter(j=>!T.asmN[j]);
  for(let i=AS.pile.length-1;i>0;i--){const r=Math.random()*(i+1)|0;[AS.pile[i],AS.pile[r]]=[AS.pile[r],AS.pile[i]]}
  AS.ok=ok;AS.held=null;AS.done=0;AS.bounce=null;AS.drag=false;AS.snap=[0,0,0,0];
  asmMsg(T.asmP.some(Boolean)||T.asmN.some(Boolean)?'The half-built Unwinder waits where you left it.':'Ten pieces lie on the bench. Start with the one everything else sits inside.');
  openModal('asm',code=>{
    if(code==='Escape'){closeModal();return}
    const m=/^(?:Digit|Numpad)(\d)$/.exec(code);if(!m||AS.done)return;const d=+m[1];
    AS.held=null;
    if(d>=1&&d<=4){const k=d-1;if(T.asmP[k]){asmMsg('The '+ASM_PARTS[k][0]+' is already in.');return}[AS.px,AS.py]=ASM_PARTS[k][2];asmPlacePart(k)}
    else{const j=d===0?5:d-5;if(T.asmN[j]){asmMsg('Note '+(j+5)+' is already pinned.');return}[AS.px,AS.py]=asmPilePos(j);asmPinNote(j,j)}
  });
  if(!AS.raf)AS.raf=requestAnimationFrame(asmLoop);
}
