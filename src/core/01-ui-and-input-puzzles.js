/* ================= MODALS ================= */
function openModal(id,keyfn){
  if(modal)$(modal.id).classList.remove('on');
  $(id).classList.add('on');modal={id,key:keyfn};mode='modal';
  for(const k in keys)keys[k]=false;
}
function closeModal(){if(modal&&modal.id==='note'&&noteCb){const f=noteCb;noteCb=null;setTimeout(f,300)}
  if(modal){$(modal.id).classList.remove('on');modal=null}
  if(mode==='modal')mode='play';
}
function showNote(title,text,cb){noteCb=cb||null;
  $('noteT').textContent=title;$('noteB').textContent=text;
  openModal('note',c=>{if(c==='KeyE'||c==='Escape'||c==='Enter'||c==='Space')closeModal()});
}
function openJournal(){
  $('jInv').textContent='Carrying: '+([S.brass&&'brass key',S.iron&&'iron key'].filter(Boolean).join(', ')||'nothing but a lantern');
  const box=$('jNotes');box.innerHTML='';
  if(!notes.length){const p=document.createElement('p');p.className='small';p.textContent='No notes yet. Search the rooms.';box.appendChild(p)}
  notes.forEach(n=>{const d=document.createElement('div');d.className='n';const b=document.createElement('b');b.textContent=n.title;const t=document.createElement('div');t.textContent=n.text;d.appendChild(b);d.appendChild(t);box.appendChild(d)});
  openModal('journal',c=>{if(c==='KeyJ'||c==='Escape'||c==='KeyE'||c==='Tab')closeModal()});
}

/* clock */
let clkH=12;
function drawClockSvg(){
  let s='<circle cx="100" cy="100" r="92" fill="#e8dfc8" stroke="#6b4a22" stroke-width="8"/>';
  for(let i=1;i<=12;i++){
    const a=i*Math.PI/6,x=100+Math.sin(a)*74,y=100-Math.cos(a)*74+6;
    s+='<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" font-size="19" font-family="Georgia,serif" fill="#2b2117">'+i+'</text>';
  }
  const ha=(clkH%12)*30*Math.PI/180;
  s+='<line x1="100" y1="100" x2="'+(100+Math.sin(ha)*46).toFixed(1)+'" y2="'+(100-Math.cos(ha)*46).toFixed(1)+'" stroke="#1a120c" stroke-width="7" stroke-linecap="round"/>';
  s+='<line x1="100" y1="100" x2="100" y2="22" stroke="#1a120c" stroke-width="4" stroke-linecap="round"/>';
  s+='<circle cx="100" cy="100" r="6" fill="#8a1f1f"/>';
  $('clk').innerHTML=s;
  $('clkTxt').textContent=clkH+' o\u2019clock';
}
function clkTurn(d){clkH=((clkH-1+d+12)%12)+1;sfx.light();drawClockSvg()}
function openClock(){openClockFace()}
function setClock(){
  S.clockHour=clkH;closeModal();
  const n=clkH;
  for(let i=0;i<n;i++)setTimeout(sfx.bell,i*420);
  if(n===7){
    setTimeout(()=>{
      S.clock=true;S.brass=true;heal();updateHUD();sfx.solve();shake=.3;
      say('After the seventh chime the case clicks. A hidden drawer slides open. Inside: a brass key. You take it.',6);
    },n*420+300);
  }else{
    setTimeout(()=>{lightsOut=.35;say('The clock strikes '+n+'. The lights gutter... then nothing else happens.',4)},n*420+200);
  }
}

/* dials (safe, frames, hidden lock) */
let dig=[],selD=0,dialCfg=null;
function renderSafe(){
  const w=$('wheels');w.innerHTML='';
  dig.forEach((d,i)=>{
    const el=document.createElement('div');el.className='wheel'+(i===selD?' sel':'');
    const up=document.createElement('button'),dn=document.createElement('button'),dd=document.createElement('div');
    up.className=dn.className='btn';up.type=dn.type='button';up.textContent='\u25B2';dn.textContent='\u25BC';dd.className='d';dd.textContent=d;
    up.setAttribute('aria-label','Increase dial '+(i+1));dn.setAttribute('aria-label','Decrease dial '+(i+1));
    up.onclick=()=>{selD=i;safeTurn(1)};dn.onclick=()=>{selD=i;safeTurn(-1)};
    el.appendChild(up);el.appendChild(dd);el.appendChild(dn);w.appendChild(el);
  });
}
function safeTurn(d){dig[selD]=(dig[selD]+d+10)%10;sfx.light();renderSafe()}
function openDial(title,n,target,ok,intro){
  dialCfg={target,ok};dig=Array(n).fill(0);selD=0;
  $('safe').querySelector('h2').textContent=title;$('safe').querySelector('p').textContent=intro;
  $('safeMsg').textContent='';renderSafe();
  openModal('safe',c=>{
    if(c==='KeyA'||c==='ArrowLeft'){selD=(selD+n-1)%n;renderSafe()}
    else if(c==='KeyD'||c==='ArrowRight'){selD=(selD+1)%n;renderSafe()}
    else if(c==='KeyW'||c==='ArrowUp')safeTurn(1);
    else if(c==='KeyS'||c==='ArrowDown')safeTurn(-1);
    else if(/^(Digit|Numpad)\d$/.test(c)){dig[selD]=+c.slice(-1);selD=Math.min(n-1,selD+1);renderSafe()}
    else if(c==='Enter')trySafe();
    else if(c==='Escape')closeModal();
  });
}
function trySafe(){
  if(dig.join('')===dialCfg.target){closeModal();dialCfg.ok()}
  else{sfx.bad();$('safeMsg').textContent='The dials click. Nothing moves.'}
}
function openSafe(){openRotary('The iron safe','763',safeOpened)}
const RHYME='First the blood that stained these stones,\nThen the bone that lies below,\nThen the moon that watched alone,\nLast the ash where embers go.';
function safeOpened(){
  S.safe=true;heal();sfx.solve();addNote('Vellum scrap',RHYME);shake=.25;
  showNote('Vellum scrap','The safe swings open. Inside lies a single scrap of vellum, written in a shaking hand:\n\n'+RHYME+'\n\nBelow the altar stand four candles, waiting.');
}


/* ================= CYCLE 02: CELL KEYPADS ================= */
let cellAnswer='',cellSuccess=null;
function openCellEntry(k,success){
  cellAnswer=CODES[k];cellSuccess=success;
  $('cellTitle').textContent='Cell '+ 'ABCD'[k];
  $('cellEntry').value='';$('cellFeedback').textContent='';
  openModal('cellEntryModal',code=>{
    if(code==='Escape'||code==='KeyE'){closeModal();return}
    if(code==='Enter'){tryCellEntry();return}
    if(/^(Digit|Numpad)[0-9]$/.test(code)) $('cellEntry').focus();
  });
  $('cellEntry').focus();
}
function tryCellEntry(){
  const val=$('cellEntry').value;
  if(val===cellAnswer){const fn=cellSuccess;closeModal();fn()}
  else{sfx.bad();$('cellFeedback').textContent=val.length!==3?'Enter the three-digit timestamp.':'ACCESS DENIED';}
}
$('cellSubmit').onclick=tryCellEntry;
$('cellCancel').onclick=closeModal;

/* ================= CYCLE 02: THREE ROTARY RADIO KNOBS ================= */
let radioDigits=[0,0,0],radioDrag=null,radioSuccess=null;
function radioKnobAngle(value){return (value/10)*Math.PI*2}
function drawRadio(){
  $('radioFrequency').textContent=radioDigits[0]+''+radioDigits[1]+'.'+radioDigits[2]+' MHz';
  for(let i=0;i<3;i++){
    const el=$('radioKnob'+i);
    el.style.setProperty('--rotation',(radioDigits[i]*36)+'deg');
    el.setAttribute('aria-valuenow',radioDigits[i]);
    el.setAttribute('aria-valuetext','Digit '+radioDigits[i]);
    el.querySelector('.radio-knob-number').textContent=radioDigits[i];
  }
}
function openRadioTuner(success){
  radioSuccess=success;radioDigits=[0,0,0];radioDrag=null;
  $('radioFeedback').textContent='';drawRadio();
  openModal('radioTuner',code=>{
    if(code==='Escape'||code==='KeyE')closeModal();
    else if(code==='Enter')tryRadioTuner();
  });
}
function updateRadioKnob(e,i){
  const box=$('radioKnob'+i).getBoundingClientRect();
  const x=e.clientX-(box.left+box.width/2),y=e.clientY-(box.top+box.height/2);
  const a=(Math.atan2(x,-y)+Math.PI*2)%(Math.PI*2);
  const digit=Math.round(a/(Math.PI*2)*10)%10;
  if(radioDigits[i]!==digit){radioDigits[i]=digit;sfx.light();drawRadio()}
}
for(let i=0;i<3;i++){
  const knob=$('radioKnob'+i);
  knob.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    radioDrag=i;knob.setPointerCapture(e.pointerId);updateRadioKnob(e,i);
  });
  knob.addEventListener('pointermove',e=>{if(radioDrag===i)updateRadioKnob(e,i)});
  knob.addEventListener('pointerup',()=>{radioDrag=null});
  knob.addEventListener('pointercancel',()=>{radioDrag=null});
  knob.addEventListener('keydown',e=>{
    if(e.key==='ArrowUp'||e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='ArrowLeft'){
      e.preventDefault();e.stopPropagation();
      radioDigits[i]=(radioDigits[i]+(e.key==='ArrowUp'||e.key==='ArrowRight'?1:9))%10;
      sfx.light();drawRadio();
    }
  });
}
function tryRadioTuner(){
  if(radioDigits.join('')==='917'){
    const fn=radioSuccess;closeModal();fn();
  }else{sfx.bad();$('radioFeedback').textContent='Only static answers.'}
}
$('radioSubmit').onclick=tryRadioTuner;
$('radioCancel').onclick=closeModal;

/* ================= TAPE LOCKER: TYPE PHOTO NUMBER ================= */
function openTapeLocker(){
  const input=$('tapeNumber');
  input.value='';
  $('tapeMsg').textContent='';
  openModal('tapeLocker',code=>{
    if(code==='Escape'||code==='KeyE'){closeModal();return}
    if(code==='Enter'){tryTapeLocker();return}
    if(/^(Digit|Numpad)[0-9]$/.test(code)) input.focus();
  });
  input.focus();
}
function tryTapeLocker(){
  const answer=$('tapeNumber').value.trim();
  if(answer==='4'){
    closeModal();
    T.tape=true;heal();sfx.solve();
    addNote('The tapes',TAPE);
    showNote('The tapes',TAPE,stageEnd);
  }else{
    $('tapeMsg').textContent=answer?'RECORD NOT FOUND':'ENTER A PHOTOGRAPH NUMBER';
    sfx.bad();
  }
}
$('tapeTry').addEventListener('click',tryTapeLocker);
$('tapeX').addEventListener('click',closeModal);

/* ================= DOLLHOUSE: DRAG THE FURNITURE INTO THE CORNERS ================= */
const DOLL_ITEMS=[{id:'cradle',name:'Cradle'},{id:'wardrobe',name:'Wardrobe'},{id:'bed',name:'Bed'}];
const DHW=560,DHH=400;
/* corner 1: hall by the stairs, corner 2: room with the window, corner 3: room under the roof */
const DROOM=[{x:122,y:178,w:156,h:116},{x:282,y:178,w:156,h:116},{x:206,y:96,w:148,h:66}];
const DTRAY=[[160,358],[280,358],[400,358]];
let dollSlots=[null,null,null];
const DH={cv:null,cx:null,raf:0,held:null,px:0,py:0,sx:0,sy:0,drag:false,moved:false,from:null,snap:[0,0,0],bounce:null};
function dollLabel(id){return DOLL_ITEMS.find(x=>x.id===id)?.name||''}
function dhDrawPiece(c,id,x,y,s,lift){
  c.save();c.translate(x,y);c.scale(s,s);
  if(lift){c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=12;c.shadowOffsetY=6}
  if(id==='wardrobe'){
    c.fillStyle='#6a4228';c.fillRect(-20,-58,40,58);c.shadowColor='transparent';
    c.fillStyle='#8a5a36';c.fillRect(-17,-54,16,50);c.fillRect(1,-54,16,50);
    c.fillStyle='#4a2c18';c.fillRect(-22,-62,44,6);c.fillRect(-20,-2,4,4);c.fillRect(16,-2,4,4);
    c.fillStyle='#e5c279';c.beginPath();c.arc(-4,-28,1.8,0,6.3);c.arc(4,-28,1.8,0,6.3);c.fill();
  }else if(id==='cradle'){
    c.strokeStyle='#5a3a22';c.lineWidth=4;c.beginPath();c.arc(0,-40,34,.9,2.24);c.stroke();c.shadowColor='transparent';
    c.fillStyle='#d8c8b0';c.beginPath();c.moveTo(-24,-30);c.quadraticCurveTo(0,-4,24,-30);c.closePath();c.fill();
    c.fillStyle='#b88a9a';c.beginPath();c.moveTo(-24,-30);c.quadraticCurveTo(-30,-52,-6,-50);c.lineTo(-6,-30);c.closePath();c.fill();
    c.fillStyle='#efe6ef';c.fillRect(-4,-36,24,6);
    c.fillStyle='#5a3a22';c.fillRect(-14,-14,3,9);c.fillRect(11,-14,3,9);
  }else{
    c.fillStyle='#5a3a22';c.fillRect(-36,-34,6,34);c.fillRect(30,-20,5,20);c.shadowColor='transparent';
    c.fillStyle='#7a5a3a';c.fillRect(-30,-16,64,8);
    c.fillStyle='#efe6ef';c.fillRect(-29,-24,16,8);
    c.fillStyle='#8a6aa0';c.fillRect(-13,-26,46,12);c.fillStyle='#a888c0';c.fillRect(-13,-26,46,3);
  }
  c.restore();
}
function dhDraw(){
  const c=DH.cx,t=performance.now()/1000;c.clearRect(0,0,DHW,DHH);
  /* nursery wall behind the toy */
  let g=c.createLinearGradient(0,0,0,DHH);g.addColorStop(0,'#2a2030');g.addColorStop(1,'#18121c');c.fillStyle=g;c.fillRect(0,0,DHW,DHH);
  /* roof */
  c.fillStyle='#6a3a3a';c.beginPath();c.moveTo(96,170);c.lineTo(280,22);c.lineTo(464,170);c.closePath();c.fill();
  c.strokeStyle='#4a2626';c.lineWidth=3;c.stroke();
  for(let i=1;i<7;i++){c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=1;c.beginPath();c.moveTo(96+i*14,170-i*11.3);c.lineTo(464-i*14,170-i*11.3);c.stroke()}
  /* house body */
  c.fillStyle='#8a7a9a';c.fillRect(110,166,340,138);
  /* room interiors */
  const wall=['#c8b8a0','#b8c4c8','#d0b8c4'];
  DROOM.forEach((r,i)=>{c.fillStyle=wall[i];c.fillRect(r.x,r.y,r.w,r.h);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(r.x,r.y+r.h-14,r.w,14);c.fillStyle='#6a4a30';c.fillRect(r.x,r.y+r.h-4,r.w,4)});
  /* attic sits inside the roof: dark slopes around it */
  c.fillStyle='#4a2828';c.beginPath();c.moveTo(206,96);c.lineTo(280,60);c.lineTo(354,96);c.closePath();c.fill();
  /* stairs in the hall (corner 1) */
  c.fillStyle='#7a5a3a';for(let s=0;s<6;s++)c.fillRect(126+s*10,286-s*14,12,6+s*14);
  /* window in the room on the right (corner 2) */
  c.fillStyle='#2a3a5a';c.fillRect(392,194,34,40);c.strokeStyle='#efe6ef';c.lineWidth=3;c.strokeRect(392,194,34,40);c.beginPath();c.moveTo(409,194);c.lineTo(409,234);c.moveTo(392,214);c.lineTo(426,214);c.stroke();
  c.fillStyle='rgba(200,220,255,.25)';c.fillRect(394,196,14,17);
  /* little round window in the attic (corner 3) */
  c.fillStyle='#2a3a5a';c.beginPath();c.arc(280,116,9,0,6.3);c.fill();c.strokeStyle='#efe6ef';c.lineWidth=2;c.stroke();
  /* number plaques + drop highlight */
  DROOM.forEach((r,i)=>{
    const hot=DH.held!==null&&dhRoomAt(DH.px,DH.py)===i;
    if(hot){c.strokeStyle='rgba(255,240,190,.9)';c.lineWidth=3;c.strokeRect(r.x+2,r.y+2,r.w-4,r.h-4)}
    c.fillStyle='#e5c279';c.beginPath();c.roundRect(r.x+6,r.y+6,20,18,3);c.fill();
    c.fillStyle='#3a2410';c.font='bold 13px Georgia';c.textAlign='center';c.fillText(i+1,r.x+16,r.y+20);
  });
  /* walls between rooms */
  c.fillStyle='#6a5a7a';c.fillRect(278,166,4,138);c.fillRect(110,166,340,12);
  /* placed furniture */
  dollSlots.forEach((id,i)=>{if(!id||DH.held===id)return;const r=DROOM[i],sn=DH.snap[i]||0;dhDrawPiece(c,id,r.x+r.w/2+(i===0?20:i===1?-20:0),r.y+r.h-4-sn*8,i===2?.85:1)});
  /* felt tray */
  c.fillStyle='#2a3a2a';c.beginPath();c.roundRect(96,318,368,74,10);c.fill();c.strokeStyle='#4a5a3a';c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(229,194,121,.45)';c.font='bold 10px system-ui,sans-serif';c.textAlign='center';c.fillText('WREN’S FURNITURE',280,333);
  DOLL_ITEMS.forEach((it,k)=>{if(dollSlots.includes(it.id)||DH.held===it.id)return;if(DH.bounce&&DH.bounce.id===it.id)return;const [x,y]=DTRAY[k];dhDrawPiece(c,it.id,x,y+28,.8)});
  /* bounce back to the tray */
  if(DH.bounce){const b=DH.bounce,f=Math.min(1,(t-b.t)/.3),x=b.x+(b.tx-b.x)*f,y=b.y+(b.ty-b.y)*f-Math.sin(f*3.14)*20;dhDrawPiece(c,b.id,x,y,.8);if(f>=1)DH.bounce=null}
  /* piece in hand */
  if(DH.held!==null)dhDrawPiece(c,DH.held,DH.px,DH.py+26,1,true);
}
function dhLoop(){
  if(!modal||modal.id!=='dollhouse'){DH.raf=0;if(DH.held!==null)dhCancel();return}
  for(let i=0;i<3;i++)if(DH.snap[i]>0)DH.snap[i]=Math.max(0,DH.snap[i]-.1);
  dhDraw();DH.raf=requestAnimationFrame(dhLoop);
}
function dhRoomAt(x,y){for(let i=0;i<3;i++){const r=DROOM[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y-10&&y<=r.y+r.h+10)return i}return -1}
function dhPieceAt(x,y){
  for(let i=0;i<3;i++){const id=dollSlots[i];if(!id)continue;const r=DROOM[i];if(x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)return {id,from:i}}
  for(let k=0;k<3;k++){const id=DOLL_ITEMS[k].id;if(dollSlots.includes(id))continue;const [tx,ty]=DTRAY[k];if(Math.abs(x-tx)<50&&Math.abs(y-ty)<34)return {id,from:null}}
  return null;
}
function dhPos(e){const r=DH.cv.getBoundingClientRect();DH.px=(e.clientX-r.left)*DHW/r.width;DH.py=(e.clientY-r.top)*DHH/r.height}
function dhPick(id,from){DH.held=id;DH.from=from;if(from!=null)dollSlots[from]=null;sfx.step();$('dollMsg').textContent='You lift the little '+dollLabel(id).toLowerCase()+'.'}
function dhCancel(){const id=DH.held;if(id===null)return;if(DH.from!=null&&!dollSlots[DH.from])dollSlots[DH.from]=id;DH.held=null;DH.from=null}
function dhToTray(id){const k=DOLL_ITEMS.findIndex(x=>x.id===id);DH.bounce={id,x:DH.px,y:DH.py+26,tx:DTRAY[k][0],ty:DTRAY[k][1]+28,t:performance.now()/1000}}
function dhDropAt(i){
  const id=DH.held;if(id===null)return;
  if(i<0){DH.held=null;DH.from=null;dhToTray(id);sfx.light();$('dollMsg').textContent='You set the '+dollLabel(id).toLowerCase()+' back on the felt.';return}
  const displaced=dollSlots[i];
  dollSlots[i]=id;DH.snap[i]=1;
  if(displaced){if(DH.from!=null)dollSlots[DH.from]=displaced;else{DH.px=DROOM[i].x+DROOM[i].w/2;DH.py=DROOM[i].y+40;dhToTray(displaced)}}
  DH.held=null;DH.from=null;sfx.light();
  $('dollMsg').textContent='The '+dollLabel(id).toLowerCase()+' goes into corner '+(i+1)+'.'+(dollSlots.every(Boolean)?' Turn the key when you are ready.':'');
}
function renderDollhouse(){
  if(DH.cv)return;
  const host=$('dollSlots');host.innerHTML='';host.className='';
  const cv=DH.cv=document.createElement('canvas');
  cv.style.cssText='display:block;width:100%;aspect-ratio:560/400;margin:10px 0;border-radius:10px;touch-action:none;cursor:grab';
  host.appendChild(cv);const tray=$('dollTray');if(tray)tray.style.display='none';
  const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=DHW*dpr;cv.height=DHH*dpr;DH.cx=cv.getContext('2d');DH.cx.setTransform(dpr,0,0,dpr,0,0);
  cv.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;dhPos(e);
    if(DH.held!==null){dhDropAt(dhRoomAt(DH.px,DH.py));return}
    const p=dhPieceAt(DH.px,DH.py);if(!p)return;
    dhPick(p.id,p.from);DH.drag=true;DH.moved=false;DH.sx=DH.px;DH.sy=DH.py;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';
  });
  cv.addEventListener('pointermove',e=>{dhPos(e);if(DH.drag&&Math.hypot(DH.px-DH.sx,DH.py-DH.sy)>10)DH.moved=true});
  cv.addEventListener('pointerup',e=>{if(!DH.drag)return;DH.drag=false;cv.style.cursor='grab';dhPos(e);if(DH.moved)dhDropAt(dhRoomAt(DH.px,DH.py))});
  cv.addEventListener('pointercancel',()=>{DH.drag=false;dhCancel()});
}
function openDollhouse(){
  dollSlots=[null,null,null];DH.held=null;DH.from=null;DH.bounce=null;DH.snap=[0,0,0];
  $('dollMsg').textContent='Three tiny pieces of furniture, three empty corners.';
  renderDollhouse();
  openModal('dollhouse',c=>{
    if(c==='Escape'){closeModal();return}
    if(c==='Enter'){tryDollhouse();return}
    const m=/^(?:Digit|Numpad)([1-3])$/.exec(c);if(!m)return;const i=+m[1]-1;
    if(DH.held===null){const id=DOLL_ITEMS[i].id,from=dollSlots.indexOf(id);dhPick(id,from>=0?from:null);DH.px=DTRAY[i][0];DH.py=DTRAY[i][1]-40}
    else{DH.px=DROOM[i].x+DROOM[i].w/2;DH.py=DROOM[i].y+DROOM[i].h/2;dhDropAt(i)}
  });
  if(!DH.raf)DH.raf=requestAnimationFrame(dhLoop);
}
function tryDollhouse(){
  if(DH.held!==null)dhCancel();
  if(dollSlots.some(x=>!x)){$('dollMsg').textContent='Place all three pieces first.';sfx.bad();return}
  if(dollSlots.join(',')!=='wardrobe,cradle,bed'){
    $('dollMsg').textContent='The miniature lock refuses to turn. Try rearranging the furniture.';
    sfx.bad();return;
  }
  closeModal();T.house=true;heal();sfx.solve();
  say('Click. Across the room, the painted door in the east wall has become a real one.',6);
}
$('dollTry').addEventListener('click',tryDollhouse);
$('dollX').addEventListener('click',closeModal);

