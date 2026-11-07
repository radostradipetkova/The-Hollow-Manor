(()=>{
'use strict';
const W=640,H=384;
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const dk=document.createElement('canvas');dk.width=W;dk.height=H;
const dx=dk.getContext('2d');
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rdist=(px,py,o)=>Math.hypot(Math.max(o.x-px,0,px-(o.x+o.w)),Math.max(o.y-py,0,py-(o.y+o.h)));
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= AUDIO ================= */
let AC=null,master=null,muted=false,vol=.8;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=muted?0:vol;master.connect(AC.destination);
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=170;lp.connect(master);
    const g=AC.createGain();g.gain.value=0.07;g.connect(lp);
    [43,43.7,64.5].forEach((f,i)=>{const o=AC.createOscillator();o.type=i<2?'sawtooth':'triangle';o.frequency.value=f;o.connect(g);o.start()});
    const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=0.07;lg.gain.value=0.035;lfo.connect(lg);lg.connect(g.gain);lfo.start();
  }catch(e){AC=null}
}
function tone(f,d,type='sine',v=0.2,slide=0){
  if(!AC||muted)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+d+0.03);
}
function noise(d,v=0.2,freq=800){
  if(!AC||muted)return;
  const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource();s.buffer=b;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;
  const g=AC.createGain();g.gain.value=v;
  s.connect(f);f.connect(g);g.connect(master);s.start();
}
const sfx={
  door(){noise(.5,.25,500);tone(90,.4,'sawtooth',.06,-30)},
  pick(){tone(660,.5,'sine',.15);tone(990,.7,'sine',.08)},
  solve(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>tone(f,.8,'triangle',.12),i*140))},
  bad(){tone(120,.5,'sawtooth',.12,-60)},
  scare(){noise(.9,.5,3000);tone(70,1,'sawtooth',.25,-40);tone(900,.5,'square',.08,-600)},
  beat(){tone(62,.16,'sine',.5,-25);setTimeout(()=>tone(54,.18,'sine',.4,-20),170)},
  light(){noise(.25,.12,2500)},
  step(){tone(60+Math.random()*25,.05,'square',.025)},
  bell(){tone(520,.7,'sine',.16);tone(1040,.5,'sine',.05)}
};
function toggleMute(){
  muted=!muted;if(muted)stopVoice();if(master)master.gain.value=muted?0:vol;
  $('bSound').textContent='Sound: '+(muted?'off':'on');
}

/* ================= STATE ================= */
let mode='title',time=0,playTime=0,chapter=1,T={},redMode=false,noteCb=null;
let S,notes,hearts,lit,seq,roomId,player,ghost,invuln,shake,flash,fade,roomT,lightsOut,eventT,beatT,stepT,doorCool,near,msgT,modal;
const keys={};
const STANDS=[{col:'gray',c:'#8a8a92'},{col:'red',c:'#c0392b'},{col:'blue',c:'#6fa0e0'},{col:'white',c:'#ebe6d8'}];
const SOL=['red','white','blue','gray'];

function reset(){chapter=1;T={};redMode=false;
  S={diary:false,page:false,brass:false,safe:false,iron:false,clock:false,altar:false,clockHour:12};
  notes=[];hearts=3;lit=[false,false,false,false];seq=[];
  roomId='foyer';player={x:320,y:250,dir:'up',step:0,moving:false};
  ghost={on:false,x:0,y:0,a:0,ph:0,life:0,timer:Infinity};
  invuln=0;shake=0;flash=0;fade=1;roomT=2.5;lightsOut=0;eventT=30;beatT=0;stepT=0;doorCool=0;near=null;msgT=0;modal=null;playTime=0;
  updateHUD();refreshContinue();
}

/* ================= HUD & MESSAGES ================= */
const STN=['The Hollow Manor','The Forgotten Wing','The Underground Laboratory','The Nursery','The Mirror Realm','The Heart of the Manor'];
function updateHUD(){$('stageName').textContent=chapter===8?'The Maze Beneath':chapter===7?'Cycle 02: The Changed Hall':'Stage '+chapter+' of 6: '+STN[chapter-1];
  $('hearts').innerHTML=[0,1,2].map(i=>'<span class="heart'+(i<hearts?'':' off')+'">&#9829;</span>').join('');
  let h='';
  if(S.brass)h+='<span class="chip key">Brass key</span>';
  if(S.iron)h+='<span class="chip key">Iron key</span>';
  {const fc=notes.filter(n=>n.title.startsWith('Fragment')).length;if(fc)h+='<span class="chip key">Fragments '+fc+'/8</span>'}
  if(typeof T!=='undefined'&&T&&T.tags)h+='<span class="chip key">Name tags '+T.tags+'/4</span>';
  if(typeof T!=='undefined'&&T&&T.lp&&!T.lpDone&&T.lp.some(Boolean))h+='<span class="chip key">Letter '+T.lp.filter(Boolean).length+'/4</span>';
  if(typeof T!=='undefined'&&T&&T.dolls&&!T.dollsDone&&T.dolls.some(Boolean))h+='<span class="chip key">Dolls '+T.dolls.filter(Boolean).length+'/5</span>';
  if(typeof T!=='undefined'&&T&&T.obj)h+='<span class="chip key">Objective: '+T.obj+'</span>';
  if(typeof T!=='undefined'&&T&&T.parts&&T.parts.filter(Boolean).length)h+='<span class="chip key">Maze finds '+T.parts.filter(Boolean).length+'/10</span>';
  if(typeof T!=='undefined'&&T&&chapter===3&&T.held!=null)h+='<span class="chip key">Holding: bottle '+'ABC'[T.held]+'</span>';
  if(notes.length)h+='<span class="chip">'+notes.length+(notes.length>1?' notes':' note')+'</span>';
  $('inv').innerHTML=h;
}
function say(t,sec=4){const m=$('msg');m.textContent=t;m.classList.add('show');msgT=sec}
function heal(){if(hearts<3){hearts++;updateHUD()}}
function addNote(title,text){if(!notes.some(n=>n.title===title))notes.push({title,text});updateHUD()}

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
    if(/^(Digit|Numpad)[0-9]$/.test(code)){
      const field=$('cellEntry');field.value=(field.value+code.slice(-1)).slice(0,3);
    }else if(code==='Backspace')$('cellEntry').value=$('cellEntry').value.slice(0,-1);
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
    if(/^Digit[0-9]$/.test(code)||/^Numpad[0-9]$/.test(code)){
      input.value=code.slice(-1);
      return;
    }
    if(code==='Backspace'||code==='Delete')input.value='';
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

/* ================= TEXT ================= */
const PORTRAIT_TEXT=[
  'A stern man in a black coat. The plate reads: Aldric Vane, master of the house. His eyes seem to follow you.',
  'A woman with a sad smile. Elara Vane. Dust covers every frame in the hall except hers.',
  'A little girl clutching a doll. The nameplate has been scraped away with something sharp.'
];
const DIARY='Aldric has lit the dining table again, candle after candle, as if a feast were coming.\n\nWhen the clock strikes the hour that matches their number, the house will listen. I have hidden the cellar key where time itself is kept.\n\nThe hearth remembers the order of the colored books beside it. Press them as it says, and the shelf will show you what I hid.\n\nIf you read this, do not let it see you hesitate.';
const PAGE='The vault beneath the house answers to three numbers, in this order:\n\nI. The hour the clock must show.\nII. The chairs that wait at the table.\nIII. The portraits in the entrance hall.\n\nSet them true and the iron safe will open.';
const WHISPERS=['"...stay..."','"She is still here."','"Count them. Count them all."','"It is so cold down here."','"Behind you."'];

function hint(){if(chapter===2)return hint2();if(chapter===3)return hint3();if(chapter===4)return hint4();if(chapter===5)return hint5();if(chapter===6)return hint6();if(chapter===7)return hint7();if(chapter===8)return hint8();
  let t;
  if(!S.brass){
    t=!S.diary?'Search the library. Desks and shelves keep secrets.':'The diary speaks of candles and a clock. Both are in the dining room. Count carefully.';
  }else if(!S.safe){
    t=!S.page?(S.books?'A book in the library now sticks out from the shelf. Look for a glint.':'The library hearth has a rhyme about the colored books on the left shelf. Press them in order.'):'Three numbers in order: the clock hour, the chairs, the portraits. The safe is in the cellar.';
  }else if(!S.iron){
    t='Read the vellum scrap in your journal (J). Light the four candles in the order of the rhyme.';
  }else{
    t='The iron key fits the front door in the entrance hall.';
  }
  say('Hint: '+t,6);
}

/* ================= ROOM PAINTING ================= */
function paintBase(c,o){
  rect(c,0,0,W,H,'#000');
  if(o.stone){
    for(let y=64;y<352;y+=32)for(let x=32;x<608;x+=32){
      c.fillStyle=((x/32+y/32)%2)?o.floor:o.floor2;c.fillRect(x,y,32,32);
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.strokeRect(x+.5,y+.5,31,31);
    }
  }else{
    for(let r=0,y=64;y<352;y+=24,r++){
      c.fillStyle=r%2?o.floor:o.floor2;c.fillRect(32,y,576,24);
      c.fillStyle='rgba(0,0,0,.35)';c.fillRect(32,y,576,1);
      for(let x=32+(r*37)%96;x<608;x+=96)c.fillRect(x,y,1,24);
    }
  }
  rect(c,0,0,W,64,o.wall);
  c.fillStyle='rgba(0,0,0,.28)';
  for(let y=0;y<64;y+=16){c.fillRect(0,y,W,1);for(let x=((y/16)%2)*20;x<W;x+=40)c.fillRect(x,y,1,16)}
  rect(c,0,58,W,6,o.trim);
  rect(c,0,0,32,H,o.wall2);rect(c,608,0,32,H,o.wall2);rect(c,0,352,W,32,o.wall2);
  c.fillStyle='rgba(0,0,0,.35)';
  for(let y=0;y<H;y+=16){c.fillRect(0,y,32,1);c.fillRect(608,y,32,1)}
  for(let x=0;x<W;x+=40)c.fillRect(x,352+16,1,16);
  c.fillRect(0,368,W,1);
  const g=c.createLinearGradient(0,64,0,96);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(32,64,576,32);
  const gl=c.createLinearGradient(32,0,60,0);gl.addColorStop(0,'rgba(0,0,0,.45)');gl.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gl;c.fillRect(32,64,28,288);
  const gr=c.createLinearGradient(608,0,580,0);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gr;c.fillRect(580,64,28,288);
}
function doorLR(c,x,col){
  rect(c,x,164,32,72,'#150c08');
  rect(c,x+2,168,28,64,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+6,174,20,22);c.fillRect(x+6,204,20,22);
  c.fillStyle='#c9a24a';c.beginPath();c.arc(x?x+8:x+24,202,2.6,0,6.3);c.fill();
}
function doorTop(c,col){
  rect(c,286,6,68,58,'#150c08');rect(c,290,10,60,54,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(296,16,20,34);c.fillRect(324,16,20,34);
  c.fillStyle='#c9a24a';c.beginPath();c.arc(344,44,2.6,0,6.3);c.fill();
}
function doorBottom(c,col,iron){
  rect(c,286,352,68,32,'#150c08');rect(c,290,352,60,28,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(296,356,20,18);c.fillRect(324,356,20,18);
  if(iron){c.fillStyle='#2a2a2e';c.fillRect(290,360,60,4);c.fillRect(290,370,60,4);c.fillStyle='#6a6a70';c.beginPath();c.arc(320,367,4,0,6.3);c.fill()}
  else{c.fillStyle='#c9a24a';c.beginPath();c.arc(344,366,2.6,0,6.3);c.fill()}
}
function shelf(c,x,w,seed){
  const r=rng(seed);rect(c,x,4,w,54,'#2b1b11');
  const cols=['#5b2a2a','#2c4a3b','#3b3a5c','#6b5a2a','#4a2f4a','#2b2b2b','#6a3f23'];
  for(let row=0;row<3;row++){
    const by=6+row*17;rect(c,x+3,by+14,w-6,3,'#1a0f09');
    let bx=x+4;
    while(bx<x+w-10){
      const bw=4+Math.floor(r()*5),bh=9+Math.floor(r()*5);
      c.fillStyle=cols[Math.floor(r()*cols.length)];c.fillRect(bx,by+14-bh,bw,bh);
      bx+=bw+(r()<.15?3:1);
    }
  }
}

function paintFoyer(c){
  paintBase(c,{floor:'#34261e',floor2:'#3b2b22',wall:'#2a2029',wall2:'#221a22',trim:'#171016'});
  rect(c,210,150,220,150,'#3a1a24');rect(c,216,156,208,138,'#2a131b');
  c.strokeStyle='#8a6a3a';c.lineWidth=1.5;c.strokeRect(222.5,162.5,195,125);
  c.fillStyle='#4a2230';c.beginPath();c.moveTo(320,176);c.lineTo(380,225);c.lineTo(320,274);c.lineTo(260,225);c.closePath();c.fill();
  rect(c,420,8,60,50,'#241a14');rect(c,424,12,52,42,'#0b1424');
  c.fillStyle='#cfe0f5';c.beginPath();c.arc(452,28,9,0,6.3);c.fill();
  c.fillStyle='#0b1424';c.beginPath();c.arc(456,26,8,0,6.3);c.fill();
  rect(c,449,12,3,42,'#241a14');rect(c,424,32,52,3,'#241a14');
  doorLR(c,0,'#4a2e1a');doorLR(c,608,'#4a2e1a');doorTop(c,'#3d2616');doorBottom(c,'#2a1a12',true);
}
function paintLibrary(c){
  paintBase(c,{floor:'#2d2118',floor2:'#34271c',wall:'#241c1c',wall2:'#1e1717',trim:'#150f0f'});
  shelf(c,48,200,11);shelf(c,392,200,23);
  rect(c,130,150,380,150,'#2e1620');rect(c,136,156,368,138,'#3a1c28');
  c.strokeStyle='#7a5a32';c.lineWidth=1.5;c.strokeRect(142.5,162.5,355,125);
  rect(c,272,14,96,50,'#3b3436');rect(c,280,22,80,42,'#2f292b');rect(c,288,28,64,36,'#0a0607');
  doorLR(c,608,'#4a2e1a');
}
function paintDining(c){
  paintBase(c,{floor:'#33241f',floor2:'#3a2923',wall:'#2b1c20',wall2:'#241619',trim:'#170e11'});
  c.fillStyle='rgba(120,40,50,.18)';for(let x=32;x<608;x+=24)c.fillRect(x,6,10,50);
  rect(c,170,130,300,170,'#241216');rect(c,176,136,288,158,'#2f171c');
  c.strokeStyle='#6a4a30';c.lineWidth=1.2;c.strokeRect(182.5,142.5,275,145);
  doorLR(c,0,'#4a2e1a');
}
function paintCellar(c){
  paintBase(c,{floor:'#2b2d30',floor2:'#25272a',wall:'#1b1d20',wall2:'#16181a',trim:'#101113',stone:true});
  c.strokeStyle='#3a3c40';c.lineWidth=2;
  for(const x of [100,180,460,540]){c.beginPath();c.moveTo(x,0);c.lineTo(x,20+((x*7)%14));c.stroke();c.fillStyle='#3a3c40';for(let k=0;k<4;k++)c.fillRect(x-3,4+k*5,6,3)}
  c.fillStyle='rgba(60,10,12,.55)';c.beginPath();c.ellipse(320,150,90,22,0,0,6.3);c.fill();
  c.strokeStyle='rgba(220,220,220,.14)';c.lineWidth=1;
  for(let i=1;i<6;i++){c.beginPath();c.moveTo(32,64);c.lineTo(32+i*9,64+(6-i)*7);c.stroke();c.beginPath();c.moveTo(608,64);c.lineTo(608-i*9,64+(6-i)*7);c.stroke()}
  c.fillStyle='#cfc8b4';c.beginPath();c.arc(90,312,9,0,6.3);c.fill();c.fillRect(85,318,10,5);
  c.fillStyle='#16181a';c.fillRect(86,309,3,4);c.fillRect(92,309,3,4);
  c.strokeStyle='#cfc8b4';c.lineWidth=3;c.beginPath();c.moveTo(106,322);c.lineTo(130,316);c.moveTo(110,330);c.lineTo(138,334);c.stroke();
  doorBottom(c,'#3a2f24',false);
}

/* ================= OBJECT DRAWING ================= */
function flame(c,x,y,s,col){
  const f=Math.sin(time*18+x*3)*.8;
  c.fillStyle=col||'rgba(255,165,60,.95)';
  c.beginPath();c.ellipse(x,y-4*s+f*.3,2.4*s,4.6*s+f*.5,0,0,6.3);c.fill();
  c.fillStyle='rgba(255,240,170,.95)';
  c.beginPath();c.ellipse(x,y-3*s,1.2*s,2.4*s,0,0,6.3);c.fill();
}
function drawPortrait(c,o,i){
  const{x,y,w,h}=o;
  rect(c,x,y,w,h,'#6b4a22');rect(c,x+3,y+3,w-6,h-9,'#2a1f14');
  rect(c,x+6,y+6,w-12,h-15,['#1d2230','#2a1d2b','#1f2a22','#2a2018','#1c2430','#1f1f2a'][i]);
  const cx=x+w/2,cy=y+h/2-2;
  c.fillStyle=['#161616','#3b1f33','#c9bfae','#3b3020','#2a3a4a','#4a3b5c'][i];c.fillRect(cx-14,cy+10,28,12);
  c.fillStyle=['#8a8a8a','#2a1a12','#6a4a2a','#5a5a5a','#c9a24a','#3a2418'][i];
  if(i===1)c.fillRect(cx-11,cy-4,22,18);
  c.beginPath();c.arc(cx,cy-4,11,0,6.3);c.fill();
  c.fillStyle='#d9cdb8';c.beginPath();c.ellipse(cx,cy-1,8,10,0,0,6.3);c.fill();
  const ex=clamp((player.x-cx)/80,-1.4,1.4),ey=clamp((player.y-cy)/160,-1,1);
  for(const s of[-3.5,3.5]){
    c.fillStyle='#fff';c.beginPath();c.arc(cx+s,cy-3,2.2,0,6.3);c.fill();
    c.fillStyle='#000';c.beginPath();c.arc(cx+s+ex,cy-3+ey,1.1,0,6.3);c.fill();
  }
  c.strokeStyle='#5a3a30';c.lineWidth=1;c.beginPath();c.moveTo(cx-3,cy+4);c.lineTo(cx+3,cy+4);c.stroke();
  rect(c,cx-8,y+h-6,16,3,'#c9a24a');
}
function drawRocker(c,o){
  c.save();c.translate(o.x+22,o.y+40);c.rotate(Math.sin(time*1.4)*.035);
  rect(c,-14,-38,28,24,'#3a2415');rect(c,-16,-14,32,12,'#4b2f1c');
  c.strokeStyle='#2a170d';c.lineWidth=3;c.beginPath();c.moveTo(-18,2);c.quadraticCurveTo(0,8,18,2);c.stroke();
  c.restore();
}
function drawPlant(c,o){
  rect(c,o.x,o.y+14,o.w,26,'#3b2618');rect(c,o.x,o.y+14,o.w,4,'#4e3322');
  c.fillStyle='#4a5a66';c.beginPath();c.ellipse(o.x+20,o.y+14,9,10,0,0,6.3);c.fill();
  c.strokeStyle='#3a2a22';c.lineWidth=1.5;
  for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(o.x+20,o.y+6);c.lineTo(o.x+20+i*9,o.y-8+Math.abs(i)*4);c.stroke();c.fillStyle='#5a1a22';c.beginPath();c.arc(o.x+20+i*9,o.y-8+Math.abs(i)*4,3,0,6.3);c.fill()}
  const py=((time*14)%26);c.fillStyle='#5a1a22';c.fillRect(o.x+26,o.y-4+py,2,2);
}
function drawFire(c){
  c.fillStyle='#2a1810';c.fillRect(292,56,56,6);
  for(let i=0;i<4;i++){
    const fx=300+i*14+Math.sin(time*9+i*2)*1.5,fh=15+Math.sin(time*11+i*1.7)*5+(i%2?5:0);
    c.fillStyle=i%2?'#ffb347':'#ff6a2a';
    c.beginPath();c.moveTo(fx-6,58);c.quadraticCurveTo(fx-3,58-fh*.6,fx,58-fh);c.quadraticCurveTo(fx+3,58-fh*.6,fx+6,58);c.fill();
  }
}
function drawBook(c,o){
  if(S.page){rect(c,o.x,o.y+2,o.w-4,o.h-8,'#0a0604');return}
  rect(c,o.x+1,o.y+2,o.w-4,o.h-6,'#5a1220');rect(c,o.x+1,o.y+8,o.w-4,3,'#c9a24a');rect(c,o.x+1,o.y+o.h-14,o.w-4,3,'#c9a24a');
  const g=.35+.35*Math.sin(time*3);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';
  c.beginPath();c.arc(o.x+16,o.y+10,2.5+g,0,6.3);c.fill();
}
function drawDesk(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#4a3020');rect(c,o.x,o.y,o.w,7,'#5e3f2a');rect(c,o.x,o.y+o.h-8,o.w,8,'#33201a');
  rect(c,o.x+28,o.y+12,26,18,'#6a1f24');rect(c,o.x+31,o.y+15,20,12,'#d9ccab');
  c.strokeStyle='rgba(43,33,23,.5)';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(o.x+33,o.y+18+i*3);c.lineTo(o.x+49,o.y+18+i*3);c.stroke()}
  rect(c,o.x+88,o.y+22,6,12,'#6a5a2a');c.fillStyle='rgba(255,210,120,.9)';c.beginPath();c.arc(o.x+91,o.y+18,7,0,6.3);c.fill();
}
function drawArmchair(c,o){
  rect(c,o.x,o.y+8,o.w,o.h-8,'#4a2a2a');rect(c,o.x,o.y,o.w,18,'#3a1f20');rect(c,o.x+4,o.y+20,o.w-8,o.h-26,'#5a3434');
  rect(c,o.x-4,o.y+14,8,o.h-14,'#3a1f20');rect(c,o.x+o.w-4,o.y+14,8,o.h-14,'#3a1f20');
}
function drawTable(c,o){
  rect(c,o.x,o.y,o.w,56,'#4a1820');
  rect(c,o.x,o.y,o.w,3,'#6a2a30');
  rect(c,o.x,o.y+56,o.w,8,'#33101a');
  c.fillStyle='rgba(0,0,0,.25)';for(let x=o.x+10;x<o.x+o.w;x+=20)c.fillRect(x,o.y+56,3,8);
  for(let i=0;i<7;i++){
    const x=222+i*32;
    c.fillStyle='rgba(235,225,195,.5)';c.beginPath();c.ellipse(x,o.y+36,6,3,0,0,6.3);c.fill();
    rect(c,x-3,o.y+22,6,14,'#e6dcc3');rect(c,x-3,o.y+22,2,14,'#fff6dc');
    flame(c,x,o.y+22,1);
  }
}
function drawChair(c,o,bottom){
  rect(c,o.x,o.y+(bottom?0:8),o.w,o.h-8,'#4a2f1c');
  rect(c,o.x+3,o.y+(bottom?3:11),o.w-6,o.h-14,'#6a2a30');
  rect(c,o.x,bottom?o.y+o.h-8:o.y,o.w,8,'#2f1c10');
}
function drawClock(c){
  rect(c,536,6,48,8,'#2f1c10');rect(c,540,10,40,100,'#3b2517');rect(c,536,100,48,10,'#2f1c10');
  c.fillStyle='#e8dfc8';c.beginPath();c.arc(560,30,13,0,6.3);c.fill();c.strokeStyle='#6b4a22';c.lineWidth=2;c.stroke();
  const ha=(S.clockHour%12)*Math.PI/6;
  c.strokeStyle='#1a120c';c.lineWidth=2;c.beginPath();c.moveTo(560,30);c.lineTo(560+Math.sin(ha)*7,30-Math.cos(ha)*7);c.stroke();
  c.lineWidth=1;c.beginPath();c.moveTo(560,30);c.lineTo(560,20);c.stroke();
  rect(c,548,52,24,44,'#150e09');
  const px=560+Math.sin(time*3)*6;c.fillStyle='#c9a24a';c.beginPath();c.arc(px,86,5,0,6.3);c.fill();
  c.strokeStyle='#c9a24a';c.lineWidth=1;c.beginPath();c.moveTo(560,54);c.lineTo(px,86);c.stroke();
}
function drawCabinet(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#3b2517');rect(c,o.x,o.y,o.w,4,'#4e3322');
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(o.x+46,o.y+6,2,o.h-6);c.fillRect(o.x+6,o.y+8,36,26);c.fillRect(o.x+52,o.y+8,36,26);
  c.fillStyle='#d8d2c0';for(let i=0;i<4;i++){c.beginPath();c.ellipse(o.x+14+i*22,o.y+3,8,3,0,0,6.3);c.fill()}
}
function drawSafe(c){
  rect(c,48,32,72,80,'#2d2f33');rect(c,52,36,64,72,'#3a3d42');
  if(S.safe){rect(c,56,40,56,64,'#0c0d0f');rect(c,112,40,10,64,'#4a4d52')}
  else{
    c.fillStyle='#202226';c.beginPath();c.arc(84,70,15,0,6.3);c.fill();
    c.strokeStyle='#8a8d92';c.lineWidth=1.5;c.stroke();
    c.beginPath();c.moveTo(84,70);c.lineTo(90,60);c.stroke();
    rect(c,100,76,10,5,'#8a8d92');
  }
}
function drawAltar(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#5a5a5e');rect(c,o.x,o.y,o.w,4,'#7a7a80');rect(c,o.x,o.y+o.h-12,o.w,12,'#3d3d41');
  c.strokeStyle='rgba(20,20,22,.7)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(o.x+84,o.y+10);c.lineTo(o.x+84,o.y+38);c.moveTo(o.x+70,o.y+20);c.lineTo(o.x+98,o.y+20);c.stroke();
  if(S.altar){rect(c,o.x+60,o.y+10,48,24,'#0d0d0f')}
}
function drawStand(c,o,i){
  const cx=o.x+12,col=STANDS[i].c;
  rect(c,cx-9,o.y+30,18,12,'#4a4a4d');rect(c,cx-3,o.y+18,6,14,'#5a5a5e');rect(c,cx-8,o.y+14,16,5,'#6a6a6e');
  rect(c,cx-4,o.y+2,8,13,col);rect(c,cx-4,o.y+2,2,13,'rgba(255,255,255,.35)');
  if(lit[i])flame(c,cx,o.y+2,1.2,i===0?'rgba(255,90,60,.95)':i===2?'rgba(120,170,255,.95)':i===3?'rgba(255,255,240,.95)':'rgba(200,200,210,.95)');
  else rect(c,cx-.5,o.y,1,3,'#111');
}
function drawCrates(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#3e2c1c');c.strokeStyle='#2a1c10';c.lineWidth=2;
  c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2);c.beginPath();c.moveTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w/2,o.y+o.h);c.moveTo(o.x,o.y+o.h/2);c.lineTo(o.x+o.w,o.y+o.h/2);c.stroke();
}
function drawBarrel(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#4a3220');c.fillStyle='#2a1c10';c.fillRect(o.x,o.y+8,o.w,3);c.fillRect(o.x,o.y+o.h-12,o.w,3);
  c.fillStyle='#1d140c';c.beginPath();c.ellipse(o.x+o.w/2,o.y+3,o.w/2-2,4,0,0,6.3);c.fill();
}

/* ================= ROOMS ================= */
const D=(x,y,w,h,to,sx,sy,lock,lockMsg)=>({door:true,x,y,w,h,to,sx,sy,lock,lockMsg});
function lightCandle(i){
  if(S.altar){say('The candles burn steadily now.');return}
  if(lit[i]){say('That candle is already burning.');return}
  lit[i]=true;seq.push(i);sfx.light();
  if(seq.length===4){
    const ok=seq.every((p,k)=>STANDS[p].col===SOL[k]);
    if(ok){
      S.altar=true;S.iron=true;heal();updateHUD();sfx.solve();shake=.5;
      say('The flames flare white. The altar grinds open and an iron key waits inside. You take it.',6);
    }else{
      lit.fill(false);seq=[];sfx.bad();shake=.3;lightsOut=.5;
      say('All four flames gutter and die at once. Something in the dark has noticed you.',4.5);
      spawnGhost(true);
    }
  }else say('The wick catches. A small flame trembles.',2);
}
const ROOMS={
  foyer:{name:'Entrance Hall',paint:paintFoyer,
    lights:()=>[{x:130,y:70,r:115,a:.75},{x:450,y:75,r:125,a:.5,col:'80,120,200'}],
    objs:[
      ...[0,1,2].map(i=>({x:48+i*72,y:4,w:56,h:56,label:'Look at portrait',draw:(c,o)=>drawPortrait(c,o,i),act:()=>say(PORTRAIT_TEXT[i],5)})),
      {x:56,y:286,w:44,h:44,solid:true,label:'Examine',draw:drawRocker,act:()=>say('The rocking chair is rocking by itself. When you look straight at it, it stops.',4)},
      {x:520,y:290,w:40,h:40,solid:true,label:'Examine',draw:drawPlant,act:()=>say('Dead roses in a cracked vase. A petal drifts down, though no air moves.',4)},
      D(32,170,22,60,'library',550,210),
      D(586,170,22,60,'dining',70,210),
      D(292,64,56,20,'cellar',320,322,()=>!S.brass,'The cellar door is locked. The keyhole is small and brass-colored.'),
      D(292,336,56,16,'EXIT',0,0,()=>!S.iron,'The front door is bolted with an iron lock. You need an iron key.')
    ]},
  library:{name:'Library',paint:paintLibrary,
    lights:()=>[{x:320,y:60,r:120,a:.9},{x:200,y:180,r:80,a:.8},{x:506,y:66,r:50,a:.65}],
    objs:[
      {x:496,y:12,w:20,h:46,label:'Pull the strange book',draw:drawBook,act:()=>{
        if(S.page){say('Only dust is left where the book sat.');return}
        S.page=true;sfx.pick();addNote('Torn page',PAGE);
        showNote('Torn page','Behind the book, a folded page falls out.\n\n'+PAGE);
      }},
      {x:48,y:4,w:200,h:54,label:'Search the shelves',act:()=>say('Rotting books, pages eaten away. One spine is still legible: On the Burying of the Dead.',4)},
      {x:392,y:4,w:200,h:54,label:'Search the shelves',act:()=>say('Dusty volumes, mostly hymnals. Something near the right end looks out of place.',4)},
      {x:272,y:14,w:96,h:50,label:'Examine',draw:drawFire,act:()=>{addNote('Hearth scratches',HEARTH);showNote('Hearth scratches',HEARTH)}},
      {x:96,y:170,w:120,h:54,solid:true,label:'Search the desk',draw:drawDesk,act:()=>{
        if(!S.diary){S.diary=true;sfx.pick();addNote('Elara\u2019s diary',DIARY)}
        showNote('Elara\u2019s diary',DIARY);
      }},
      {x:440,y:196,w:56,h:56,solid:true,label:'Examine',draw:drawArmchair,act:()=>say('The cushion is still dented, as if someone just stood up.',4)},
      D(586,170,22,60,'foyer',70,210)
    ]},
  dining:{name:'Dining Room',paint:paintDining,
    lights:()=>[{x:320,y:205,r:150,a:.85},{x:560,y:60,r:50,a:.55}],
    objs:[
      {x:200,y:176,w:240,h:64,solid:true,label:'Examine the table',draw:drawTable,act:()=>say('A long table laid for a feast nobody attended. Candles burn and the wax pools on the cloth.',5)},
      ...[228,304,380].map(x=>({x,y:140,w:32,h:32,solid:true,draw:(c,o)=>drawChair(c,o,false)})),
      ...[228,304,380].map(x=>({x,y:244,w:32,h:32,solid:true,draw:(c,o)=>drawChair(c,o,true)})),
      {x:536,y:64,w:48,h:44,solid:true,label:'Set the clock',draw:drawClock,act:()=>{
        if(S.clock)say('The clock stands at seven. The empty drawer is still open.');else openClock();
      }},
      {x:56,y:64,w:96,h:40,solid:true,label:'Search the cabinet',draw:drawCabinet,act:()=>say('Stacked plates. One is spotless, as if someone ate from it tonight.',4)},
      D(32,170,22,60,'foyer',570,210)
    ]},
  cellar:{name:'Cellar',paint:paintCellar,
    lights:()=>[{x:320,y:100,r:105,a:.6},{x:84,y:92,r:70,a:.55},...STANDS.map((s,i)=>lit[i]?{x:224+i*64,y:180,r:70,a:.85}:null).filter(Boolean)],
    objs:[
      {x:52,y:64,w:64,h:48,solid:true,label:'Open the safe',draw:drawSafe,act:()=>{
        if(S.safe)say('The safe is open and empty.');else openSafe();
      }},
      {x:236,y:72,w:168,h:52,solid:true,label:'Examine the altar',draw:drawAltar,act:()=>{
        say(S.altar?'The slab has slid aside. The hollow beneath is empty now.':'A stone altar, stained dark. Four candle stands wait before it, each a different color.',5);
      }},
      ...[0,1,2,3].map(i=>({x:212+i*64,y:168,w:24,h:42,solid:true,label:'Light the '+STANDS[i].col+' candle',draw:(c,o)=>drawStand(c,o,i),act:()=>lightCandle(i)})),
      {x:500,y:96,w:80,h:56,solid:true,label:'Examine',draw:drawCrates,act:()=>say('Rotted crates. Everything inside has turned to dust.',3)},
      {x:520,y:270,w:36,h:40,solid:true,label:'Examine',draw:drawBarrel,act:()=>say('Empty except for gnawed bones. Rats, you tell yourself.',4)},
      D(296,336,48,16,'foyer',320,110)
    ]}
};
function buildBG(){for(const id in ROOMS){
  if(ROOMS[id].bg)continue;
  const R=ROOMS[id];
  R.bg=document.createElement('canvas');R.bg.width=W*2;R.bg.height=H*2;
  const c=R.bg.getContext('2d');c.scale(2,2);R.paint(c);
}}
buildBG();
const vig=document.createElement('canvas');vig.width=W;vig.height=H;
{const c=vig.getContext('2d'),g=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.95);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');c.fillStyle=g;c.fillRect(0,0,W,H)}
const room=()=>ROOMS[roomId];


/* ================= STAGE 2: THE FORGOTTEN WING ================= */
const FAM=[{n:'Elara Vane',s:1},{n:'Gideon Vane',s:3},{n:'Wren Vane',s:2},{n:'Aldric Vane',s:0},{n:'Margaret Vane',s:4}];
const CN='The dark doors only lead in circles. The house moves them whenever you look away.\n\nFollow the light three times.';
const REG='Vane family register (water-stained)\n\nGideon Vane: born 1802.\nMargaret, his wife: seven years younger than Gideon.\nAldric, their son: born the year Margaret turned forty.\nElara, his bride: twelve years younger than Aldric.\nWren, their only child: born in 1889.\n\nHang them eldest first, from left to right, by swapping the frames on the wall, and the wall will give up what it keeps.';
const RHYME2='Tell it twice and it is true,\nA single word is lying to you.\nKeep them in the order they came,\nThen dial them into the hidden frame.';
const VOICE='Seven... two... seven... nine... four... nine... five... two... eight...';
let corr={xs:[110,310,510],good:0};
function setupCorr(){corr.xs=[90,200,310,420,530].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a-b);corr.good=Math.floor(Math.random()*3)}
function corrPick(i){
  if(i===corr.good){
    T.route++;
    if(T.route>=3){changeRoom('archive',320,300);say('The last door opens onto a long gallery. Behind you, the corridor is gone.',5);return}
    say('The corridor shifts as you pass. The doors have moved.',3.5);
  }else{T.route=0;say('You step through and find yourself back where you started. Was the corridor always this long?',4.5)}
  sfx.door();setupCorr();fade=1;player.x=320;player.y=310;doorCool=.6;
}
const cdoor=i=>({door:true,get x(){return corr.xs[i]-28},y:64,w:56,h:20,fn:()=>corrPick(i),
  draw:(c,o)=>{rect(c,o.x,8,56,56,'#150c08');rect(c,o.x+4,12,48,52,'#33231a');rect(c,o.x+44,40,3,3,'#c9a24a');rect(c,o.x+26,16,4,8,'#4a4a4e');if(corr.good===i)flame(c,o.x+28,16,1.1)}});
function paintCorr(c){paintBase(c,{floor:'#2a2420',floor2:'#302a25',wall:'#1f1a1d',wall2:'#19151a',trim:'#120e11'});c.fillStyle='rgba(0,0,0,.3)';for(let x=60;x<600;x+=90)c.fillRect(x,64,40,288)}
function paintArchive(c){paintBase(c,{floor:'#2c2420',floor2:'#33291f',wall:'#251c20',wall2:'#1d1619',trim:'#150f12'});rect(c,160,150,320,150,'#26141c');c.strokeStyle='#6a4a30';c.lineWidth=1.2;c.strokeRect(168.5,158.5,303,133);doorLR(c,0,'#4a2e1a')}
function paintWhisper(c){paintBase(c,{floor:'#3a3030',floor2:'#40342f',wall:'#3a3544',wall2:'#2e2a38',trim:'#211d29'});c.fillStyle='rgba(200,190,230,.08)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);doorLR(c,608,'#5a4a3a')}
const STAGE2={
  corr:{name:'The Forgotten Corridor',paint:paintCorr,lights:()=>[{x:corr.xs[corr.good],y:30,r:75,a:.9}],objs:[cdoor(0),cdoor(1),cdoor(2),
    {x:34,y:180,w:14,h:26,label:'Read the note',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#d9ccab'),act:()=>{addNote('Pinned note',CN);showNote('Pinned note',CN)}}]},
  archive:{name:'The Gallery',paint:paintArchive,lights:()=>[{x:320,y:90,r:230,a:.6},{x:146,y:222,r:75,a:.85}],objs:[
    ...FAM.map((f,k)=>({x:100+k*88,y:4,w:56,h:56,label:'Read the plate',act:()=>say('Frame '+(k+1)+': '+f.n+'.',3),
      draw:(c,o)=>{drawPortrait(c,o,f.s);c.fillStyle='#e5c279';c.font='bold 10px Georgia';c.textAlign='left';c.fillText(k+1,o.x+4,o.y+14)}})),
    {x:540,y:4,w:48,h:56,label:'Look closer',draw:(c,o)=>{if(T.face)drawPortrait(c,o,5)},act:()=>say(T.face?'The painted eyes follow you. You feel it knows your name.':'A bare patch of wall. Faint hooks, as if a frame once hung here.',5)},
    {x:96,y:200,w:100,h:44,solid:true,label:'Read the register',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3020');rect(c,o.x,o.y,o.w,6,'#5e3f2a');rect(c,o.x+30,o.y+12,34,22,'#d9ccab')},
      act:()=>{if(!T.reg){T.reg=true;sfx.pick();addNote('Vane register',REG)}showNote('Vane register',REG)}},
    {x:290,y:96,w:60,h:30,solid:true,label:'Rearrange the frames',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3d42');rect(c,o.x+8,o.y+8,44,14,'#2a2c30');for(let i=0;i<5;i++)rect(c,o.x+11+i*8,o.y+12,5,6,T.port?'#e5c279':'#8a8d92')},
      act:()=>{if(T.port){say('The mechanism is spent. The frames hang in their true order.');return}openDial('The frame mechanism',5,'25413',portOk,'Five dials. Enter the frame numbers, eldest first.')}},
    {x:586,y:170,w:22,h:60,label:'Examine the wall',draw:c=>{if(T.door){rect(c,608,166,32,68,'#030208');for(let i=0;i<5;i++)rect(c,612,172+i*12,24-i*3,2,'#1a1a22')}else{c.fillStyle='rgba(255,255,255,.08)';c.fillRect(608,166,1,68);c.fillRect(639,166,1,68);c.fillRect(608,166,32,1)}},
      act:()=>{if(T.door)return;openDial('The hidden lock',3,'729',doorOk,'Three dials. The wall has no handle, only a lock.')}},
    D(32,170,22,60,'whisper',550,210)]},
  whisper:{name:'The Whispering Room',paint:paintWhisper,lights:()=>[{x:320,y:200,r:110,a:.6}],objs:[
    {x:290,y:170,w:44,h:44,solid:true,label:'Listen',draw:(c,o)=>{rect(c,o.x+8,o.y+22,28,18,'#5a4030');c.fillStyle='#d6b79c';c.beginPath();c.arc(o.x+22,o.y+12,10,0,6.3);c.fill();rect(c,o.x+17,o.y+10,3,3,'#111');rect(c,o.x+25,o.y+10,3,3,'#111')},
      act:()=>{sfx.bad();say('The doll\u2019s lips do not move, yet a voice whispers: "'+VOICE+'" Then it begins again.',9)}},
    {x:80,y:90,w:90,h:50,solid:true,label:'Examine',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a30');rect(c,o.x+4,o.y+4,o.w-8,o.h-12,'#2a2028')},act:()=>say('A small crib. The blanket is still warm.',4)},
    D(586,170,22,60,'archive',70,210)]}
};

/* ================= STAGE 3: THE UNDERGROUND LABORATORY ================= */
const visO=o=>(!o.vis||(o.vis==='red')===redMode)&&(!o.when||o.when());
const EXP='Experiment log, Dr. Vane\n\nBottle A (red, acid): alone, nothing. With B, it eats the paper and the writing with it.\nBottle B (glass, base): alone, nothing.\nBottle C (yellow, reagent): alone, nothing. With B, only foam.\nA and C together: the paper glows faintly blue and the hidden ink rises.\nAll three: never. The fumes make you forget your own name.';
const INK='Written in invisible ink:\n\nRestore the power in this order: 3, 1, 4, 2.\nThe heart wakes last.';
const PAT='Patient files\n\nHarlow: severe myopia, full beard.\nPike: facial scar, head injury.\nAmes: severe myopia, facial scar.\nDunn: full beard, head injury.\n\nNight report: the restraint bed is empty and the ward door stands open. The missing patient is Ames.';
const TAPE='Tape 1 shows a corridor on a grey monitor. A figure walks through it: your coat, your hair, your face. The time stamp is last week.\n\nTape 2 is a voice you know, thin with static:\n"If you\u2019re hearing this, don\u2019t trust what you remember."';
const PH=[['scar','bandage'],['beard','bandage'],['glasses','beard'],['glasses','scar']];
const BOT=[{n:'red',c:'#b3262b'},{n:'glass',c:'#a8c8d8'},{n:'yellow',c:'#d8b83a'}];
const LK='The door is dead. Its electric lock needs power.';
const botObj=(i,x,y,vis)=>({x,y,w:16,h:30,vis,label:'Take the '+BOT[i].n+' bottle',
  draw:(c,o)=>{if(!T.b[i]){rect(c,o.x+4,o.y,8,8,'#ccc');rect(c,o.x,o.y+8,16,22,BOT[i].c)}},
  act:()=>{if(T.b[i]){say('Nothing here now.');return}T.b[i]=true;sfx.pick();say('You take the '+BOT[i].n+' bottle (bottle '+'ABC'[i]+').',3)}});
function drawPhoto(c,o,k){
  rect(c,o.x,o.y,o.w,o.h,'#d8d2c0');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#3a3a3e');
  const cx=o.x+28,cy=o.y+28,t=PH[k];
  c.fillStyle='#d6b79c';c.beginPath();c.ellipse(cx,cy,12,15,0,0,6.3);c.fill();
  if(t.includes('beard')){c.fillStyle='#3a2a20';c.beginPath();c.ellipse(cx,cy+8,11,8,0,0,3.14);c.fill()}
  rect(c,cx-6,cy-4,3,3,'#111');rect(c,cx+3,cy-4,3,3,'#111');
  if(t.includes('glasses')){c.strokeStyle='#111';c.lineWidth=1.2;c.strokeRect(cx-9,cy-7,8,7);c.strokeRect(cx+1,cy-7,8,7)}
  if(t.includes('scar')){c.strokeStyle='#8a2a2a';c.lineWidth=1.5;c.beginPath();c.moveTo(cx+4,cy);c.lineTo(cx+9,cy+9);c.stroke()}
  if(t.includes('bandage'))rect(c,cx-10,cy-14,20,5,'#eee');
}
const paintLab=c=>{paintBase(c,{floor:'#2e3436',floor2:'#292f31',wall:'#1d2a2c',wall2:'#172224',trim:'#101a1c',stone:true});doorLR(c,0,'#3a4a4c');doorLR(c,608,'#3a4a4c')};
const paintRec=c=>{paintBase(c,{floor:'#33332e',floor2:'#2d2d28',wall:'#25282a',wall2:'#1d2022',trim:'#141618',stone:true});doorLR(c,0,'#3a4a4c')};
const paintObs=c=>{paintBase(c,{floor:'#2a2f33',floor2:'#252a2e',wall:'#1a2530',wall2:'#141c24',trim:'#0e141a',stone:true});doorLR(c,608,'#3a4a4c')};
const note3=(f,t,n)=>()=>{f();addNote(t,n);showNote(t,n)};
const STAGE3={
  lab:{name:'The Laboratory',paint:paintLab,lights:()=>[{x:320,y:200,r:T.power?290:80,a:.7},{x:318,y:60,r:70,a:.6}],objs:[
    botObj(0,70,24),botObj(2,200,24),botObj(1,500,296,'red'),
    {x:96,y:200,w:100,h:44,solid:true,label:'Read the experiment log',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3c');rect(c,o.x+30,o.y+12,34,22,'#d9ccab')},act:note3(()=>{},'Experiment log',EXP)},
    {x:290,y:170,w:110,h:50,solid:true,label:'Mix the reagents',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a5256');rect(c,o.x,o.y,o.w,5,'#6a7478');c.fillStyle='#cfd8dc';c.beginPath();c.ellipse(o.x+55,o.y+26,16,8,0,0,6.3);c.fill();if(T.ink){c.fillStyle='rgba(120,170,255,.8)';c.beginPath();c.ellipse(o.x+55,o.y+26,10,5,0,0,6.3);c.fill()}},
      act:()=>{if(T.ink){say('The dish still glows faintly blue.');return}if(!T.b.every(Boolean)){say('Three empty slots for bottles. You are still missing some.',4);return}
        openDial('Reagent dish',3,'101',()=>{T.ink=true;heal();sfx.solve();say('The paper glows blue. Writing rises on the wall board... but your eyes only catch it under the red emergency light (R).',7)},'Dials are bottles A, B, C. 1 pours it in, 0 leaves it out.')}},
    {x:420,y:8,w:100,h:48,label:'Read the board',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#10181a');c.strokeStyle='#6a7478';c.strokeRect(o.x+.5,o.y+.5,o.w-1,o.h-1);if(T.ink&&redMode){c.fillStyle='#ff6a5a';c.font='bold 18px Georgia';c.textAlign='center';c.fillText('3  1  4  2',o.x+50,o.y+30)}},
      act:()=>{if(!T.ink)say('A blank grey board.');else if(!redMode)say('Faint residue. A different light might show it.',4);else{T.board=true;addNote('Invisible writing',INK);showNote('Invisible writing',INK)}}},
    {x:290,y:8,w:56,h:48,label:'Breaker panel',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e52');for(let i=0;i<4;i++){rect(c,o.x+6+i*12,o.y+8,8,22,'#222');rect(c,o.x+6+i*12,o.y+(T.power?8:20),8,10,T.power?'#5fd35f':'#a03030')}},
      act:()=>{if(T.power)say('The panel hums.');else openDial('Breaker panel',4,'3142',()=>{T.power=true;heal();sfx.solve();shake=.4;say('Lights stutter on. Somewhere nearby, electric locks release.',5)},'Four breakers, numbered 1 to 4. Enter the order to switch them on.')}},
    D(32,170,22,60,'observe',550,210,()=>!T.power,LK),D(586,170,22,60,'records',70,210,()=>!T.power,LK)]},
  records:{name:'Patient Records',paint:paintRec,lights:()=>[{x:320,y:90,r:230,a:.6}],objs:[
    ...[0,1,2,3].map(k=>({x:110+k*100,y:4,w:56,h:56,label:'Look at photograph '+(k+1),draw:(c,o)=>{drawPhoto(c,o,k);c.fillStyle='#fff';c.font='bold 10px Georgia';c.textAlign='left';c.fillText(k+1,o.x+4,o.y+13)},act:()=>say('Photograph '+(k+1)+'. The subject stares past you.',3)})),
    {x:96,y:200,w:100,h:44,solid:true,label:'Read the patient files',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e50');for(let i=0;i<3;i++)rect(c,o.x+8+i*30,o.y+8,24,28,'#3a3e40')},act:note3(()=>{},'Patient files',PAT)},
    D(32,170,22,60,'lab',550,210)]},
  observe:{name:'Observation Chamber',paint:paintObs,lights:()=>[{x:320,y:50,r:140,a:.7}],objs:[
    {x:200,y:8,w:240,h:50,label:'Look through the window',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#0c1822');rect(c,o.x+30,o.y+26,180,14,'#8a8f94');if(!T.flick){rect(c,o.x+50,o.y+18,110,9,'#cfc3b8');c.fillStyle='#cfc3b8';c.beginPath();c.arc(o.x+168,o.y+23,8,0,6.3);c.fill()}c.strokeStyle='#4a5a66';c.lineWidth=2;c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2)},
      act:()=>{if(T.flick){say('The operating table is empty. The straps are still warm.',4);return}if(T.saw)return;T.saw=true;say('Behind the glass, someone lies strapped to an operating table. They are not moving.',4);
        setTimeout(()=>{lightsOut=.8;T.flick=true;sfx.scare();say('The lights flicker. When they return, the table is empty.',5)},2800)}},
    {x:70,y:150,w:60,h:56,solid:true,label:'Open the tape locker',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a4248');rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#2a3036');rect(c,o.x+24,o.y+22,12,12,'#8a8d92')},
      act:()=>{if(T.tape){say('The locker is empty. The tapes still play in your head.');return}openTapeLocker()}},
    D(586,170,22,60,'lab',70,210)]}
};
function beginStage3(){
  chapter=3;T={b:[false,false,false]};redMode=false;hearts=3;updateHUD();roomId='lab';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('The staircase ends in a cold laboratory. Glass, dust, a sour chemical smell. Press R to switch to emergency lighting.',7);
}
function hint3(){
  let t;
  if((T.pk||[]).filter(Boolean).length<3)t='Find the three reagent bottles in the lab and pick each one up at least once. One only shows under the red emergency light (R).';
  else if(!T.ink)t='Read the experiment log: only one pair works. Pick up a bottle, pour it into the beaker on the table, then another. If it goes wrong, empty the beaker at the sink. You can put a bottle down by pressing E away from objects.';
  else if(!T.board)t='Switch to red lighting (R) and read the board.';
  else if(!T.power)t='The breaker panel wants the order from the board.';
  else if(!T.valves)t='A new door south of the lab leads to the pressure room. Turn valves until all four tanks read 5.';
  else if(!T.exp4)t='Beyond the containment door, read the laboratory log. Rigs, hours and beds each follow a simple pattern. Work out the missing Experiment 4.';
  else t='Read the patient files east of the lab, match the traits to the photographs, then use that photo number at the tape locker west of the lab.';
  say('Hint: '+t,6);
}

/* ================= STAGE 4: THE NURSERY ================= */
const SCR=['The song begins on MI, the third step of the ladder.','Then it tumbles down to DO, the first step.','Then it climbs high to SOL, the fifth step. On the back, a little drawing: five candles in a ring.','And it goes to sleep where it began, on DO.'];
const FRG=['Wren\u2019s diary: "Papa says the dollhouse is a map of our house. The cradle always sits by the window, in the second corner. On cold nights the west wall whispers. Mama says it is only the draught."','Wren\u2019s diary: "The little wardrobe stays in the hall by the stairs, in the first corner. It hides the secret door. At the s\u00e9ance Mama laid a sixth place at the table. Papa said it was for the guest, but he never said which guest."','Wren\u2019s diary: "My bed is under the roof, in the third corner. When I sleep there the house goes quiet. When I want to hide, I use the little door at the bottom of my room. Nobody ever finds me there."'];
const BOXN='A folded slip inside the music box:\n\nTo wake the eye, the toys must face the way they did when Papa watched:\nthe bear looks right,\nthe rabbit looks up,\nthe horse looks left.';
const WREN='A letter in Aldric\u2019s hand, folded in the chest:\n\n"Wren did not vanish. She was our first success: a mind kept whole after the body failed. Every subject since has been an attempt to give her a new home."\n\nThe last line is scratched in pencil: "She is still listening."';
const paintNur=c=>{paintBase(c,{floor:'#4a3a34',floor2:'#52413a',wall:'#4a3d4f',wall2:'#3a3040',trim:'#2a2230'});c.fillStyle='rgba(255,220,240,.07)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);rect(c,210,140,220,150,'#3a2a44');c.strokeStyle='#8a6a8a';c.strokeRect(218.5,148.5,203,133);doorLR(c,608,'#5a4630')};
const paintAtt=c=>{paintBase(c,{floor:'#2a2018',floor2:'#30251c',wall:'#1d1814',wall2:'#16120f',trim:'#100d0a'});doorLR(c,0,'#4a2e1a')};
const dreadCol=()=>T.dread<2?'#e6c040':'#8a1a1a';
const scrapAct=i=>()=>{T.sc[i]=1;sfx.pick();const t='Torn sheet music, "Wren\u2019s Lullaby": '+SCR[i];addNote('Music scrap '+(i+1),t);showNote('Music scrap '+(i+1),t)};
const fragAct=i=>()=>{T.fr[i]=1;sfx.pick();addNote('Wren\u2019s diary '+(i+1),FRG[i]);showNote('Wren\u2019s diary '+(i+1),FRG[i])};
const STAGE4={
  nursery:{name:'The Nursery',paint:paintNur,lights:()=>[{x:320,y:200,r:210,a:.6}],objs:[
    {x:80,y:66,w:70,h:44,solid:true,label:'Look in the crib',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8c8b0');rect(c,o.x+5,o.y+6,o.w-10,o.h-12,'#a89ab8')},act:fragAct(0)},
    {x:480,y:290,w:70,h:40,solid:true,label:'Open the toy chest',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a3a2a');rect(c,o.x,o.y,o.w,8,'#7a4a3a');rect(c,o.x+30,o.y+14,10,8,'#c9a24a')},act:fragAct(1)},
    {x:400,y:4,w:120,h:54,label:'Search the bookshelf',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a2a');for(let i=0;i<8;i++)rect(c,o.x+4+i*14,o.y+8+(i%3)*3,9,36-(i%3)*3,['#c05050','#5080c0','#e0c050','#60a060'][i%4])},act:scrapAct(1)},
    {x:200,y:6,w:130,h:50,label:'Look at the drawings',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#e8e0d0');for(let i=0;i<4-Math.min(T.dread,1);i++){c.fillStyle=dreadCol();c.beginPath();c.arc(o.x+22+i*28,o.y+20,6,0,6.3);c.fill();c.fillRect(o.x+19+i*28,o.y+26,6,14)}if(T.dread>=3)rect(c,o.x+100,o.y+4,14,44,'#111')},
      act:()=>say(['Cheerful crayon drawings of a house, a cat and a family of four. In one corner, a tiny pink door.','The family has only three faces now.','One figure is scribbled out hard enough to tear the paper.','Every drawing shows the same tall dark figure standing at the window.'][T.dread],5)},
    {x:300,y:100,w:56,h:34,solid:true,label:'Wind the music box',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a5a3a');rect(c,o.x+4,o.y+4,o.w-8,10,'#c9a24a')},
      act:()=>{if(T.box){showNote('Music box slip',BOXN);return}if(!T.sc.every(Boolean)){say('The music box has four missing notes. Somewhere in this room are scraps of its song.',5);return}
        openKeys('The music box','3151',()=>{T.box=true;heal();sfx.solve();[330,262,392,262].forEach((f,i)=>setTimeout(()=>tone(f,.6,'triangle',.18),i*450));addNote('Music box slip',BOXN);showNote('Music box slip','The lullaby plays, slow and out of tune. A hidden drawer opens.\n\n'+BOXN)},'Eight keys: 1 do, 2 re, 3 mi, 4 fa, 5 sol, 6 la, 7 ti, 8 high do. Play the four notes of the song. You can also press 1 to 8 on your keyboard.')}},
    {x:470,y:150,w:76,h:70,solid:true,label:'Rearrange the dollhouse',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,o.h-14,'#8a7a9a');c.fillStyle='#6a3a3a';c.beginPath();c.moveTo(o.x-4,o.y+16);c.lineTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w+4,o.y+16);c.fill();rect(c,o.x+8,o.y+26,22,16,'#2a2030');rect(c,o.x+46,o.y+26,22,16,'#2a2030');rect(c,o.x+8,o.y+48,60,14,'#2a2030')},
      act:()=>{if(T.house){say('The little rooms are arranged just as Wren left them. In the dollhouse nursery, a tiny door in the west wall hangs ajar.');return}openDollhouse()}},
    {x:96,y:230,w:84,h:44,solid:true,label:'Search the desk',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a4a30');rect(c,o.x,o.y,o.w,6,'#7a5a40')},act:fragAct(2)},
    {x:122,y:232,w:34,h:20,when:()=>T.dread>=2,label:'Look at the drawing',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#efe6d4'),
      act:()=>showNote('Crayon drawing','A child\u2019s drawing of this very room: a girl beside a rocking chair, a lamp, a window. Behind the girl stands a tall black figure.\n\nThe girl is wearing your coat.',()=>{T.fig=5;lightsOut=.3;sfx.scare()})},
    {get x(){return 430-T.dread*40},y:250,w:24,h:28,label:'Pick up the teddy bear',draw:(c,o)=>{c.fillStyle='#8a6a4a';c.beginPath();c.arc(o.x+12,o.y+8,8,0,6.3);c.fill();rect(c,o.x+4,o.y+14,16,14,'#8a6a4a');rect(c,o.x+7,o.y+6,3,3,'#111');rect(c,o.x+14,o.y+6,3,3,'#111')},act:scrapAct(0)},
    {get x(){return [70,140,220,300][T.dread]},y:290,w:44,h:44,label:'Look at the rocking chair',draw:(c,o)=>{c.save();c.translate(o.x+22,o.y+40);c.rotate(Math.sin(time*(1.4+T.dread))*(.03+T.dread*.02));rect(c,-14,-38,28,24,'#6a4a30');rect(c,-16,-14,32,12,'#7a5a40');c.restore()},act:scrapAct(2)},
    {x:230,y:250,w:34,h:16,label:'Lift the rug corner',draw:(c,o)=>rect(c,o.x,o.y,o.w,6,'#4a3a54'),act:scrapAct(3)},
    D(586,170,22,60,'attic',70,210,()=>!T.house,'The door in the east wall is only painted on. In the dollhouse, the same door is blocked by a wardrobe.')]},
  attic:{name:'The Attic',paint:paintAtt,lights:()=>[{x:320,y:190,r:170,a:.65}],objs:[
    {x:270,y:200,w:100,h:40,solid:true,label:'Arrange the toys',draw:(c,o)=>{rect(c,o.x,o.y+20,o.w,20,'#4a3a2a');c.fillStyle='#8a6a4a';c.fillRect(o.x+8,o.y+4,18,16);c.fillStyle='#d8d0c0';c.fillRect(o.x+40,o.y+2,12,18);c.fillStyle='#6a4a30';c.fillRect(o.x+70,o.y+6,22,14);if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}},
      act:()=>{if(T.shadow){say('Three shadows form a single open eye on the wall.');return}openDial('Toy shadows',3,'103',()=>{T.shadow=true;heal();sfx.solve();say('A lamp swings on. Three shadows slide together on the wall into an eye. Somewhere, a lock clicks.',6)},'Bear, rabbit, horse. Each faces 0 up, 1 right, 2 down or 3 left.')}},
    {x:400,y:100,w:60,h:44,solid:true,label:'Open the chest',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a2a');rect(c,o.x,o.y,o.w,10,'#6a4a3a');rect(c,o.x+26,o.y+18,8,8,T.shadow?'#5fd35f':'#c9a24a')},
      act:()=>{if(!T.shadow){say('The chest\u2019s lock is carved in the shape of an eye.',4);return}if(T.done)return;T.done=true;heal();addNote('Aldric\u2019s letter',WREN);showNote('Aldric\u2019s letter',WREN,stageEnd)}},
    D(32,170,22,60,'nursery',566,210)]}
};
function beginStage4(){
  chapter=4;T={sc:[0,0,0,0],fr:[0,0,0],dread:0,dt:0,fig:0};redMode=false;hearts=3;updateHUD();roomId='nursery';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('The lab stairs end at a pastel door. Beyond it, a nursery, quiet and tidy. No monster here. Just the feeling of being watched. Not every door in this room is where it ought to be.',8);
}
function hint4(){
  let t;
  if(!T.sc.every(Boolean))t='Four scraps of the lullaby are hidden in toys and furniture around the nursery. Search everything.';
  else if(!T.box)t='Read the scraps in your journal (J) in order, then wind the music box.';
  else if(!T.fr.every(Boolean))t='Three diary pages are hidden in the crib, the toy chest and the desk.';
  else if(!T.house)t='The diary pages tell where the cradle, wardrobe and bed sit in the dollhouse. Their corner numbers are the code.';
  else if(!T.shadow)t='In the attic, face the toys the way the music box slip says: 0 up, 1 right, 2 down, 3 left.';
  else t='Open the chest in the attic.';
  if(!T.playIn)t+=' Optional: a small pink door is set into the bottom wall of the nursery.';
  if(!T.sec)t+=' Optional: cold air leaks from the west wall.';
  say('Hint: '+t,8);
}

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

/* ================= STAGE 6: THE HEART OF THE MANOR ================= */
const CREDIT_NAME='radostradi';
let E={t:0,len:36,kind:'destroy',i:0};
const SHARDS='Memory shards\n\n1. Your friend whispered "Count the candles" and you laughed.\n2. The lights turned red. Your friend pointed at an empty bed.\n3. You both reached the front door at dusk. It was already locked.\n4. Your friend stepped into the glass. You stood still and watched.\n\nPut them back in the order they happened.';
const LOGM='Restoration log, Subject 07\n\nAttempt 1: entered at dusk. Memory wiped at the front door.\nAttempt 2: reached the library. Memory wiped.\nAttempt 3: reached the laboratory. Memory wiped.\nAttempt 4: you are here now.\n\nYou have walked these halls before. Each time you failed, the machine gave you a clean mind and sent you back to the door. Your friend has been waiting in the heart of the manor the whole time.\n\nScratched under the last entry, in your own handwriting: "You have to accept the offer to remember who you are."';
const SYM=[['clock','A clock face with no hands. The seal of Time: the hour that mattered.'],['eye','An open eye. The seal of Blood: the photograph of the patient who escaped.'],['note','A musical note. The seal of Song: the step that begins the lullaby.'],['glass','A mirror. The seal of Truth: how many journal entries were true.']];
const paintCore=c=>{paintBase(c,{floor:'#22302f',floor2:'#1d2928',wall:'#151f20',wall2:'#101819',trim:'#0b1213',stone:true});doorTop(c,'#2a3a3c')};
const paintMach=c=>{paintBase(c,{floor:'#2a2f33',floor2:'#242a2e',wall:'#1a2024',wall2:'#13181b',trim:'#0d1114',stone:true});doorBottom(c,'#2a3a3c',false)};
function drawLocker(c,o){rect(c,o.x,o.y,o.w,o.h,'#3a4448');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#2a3236');for(let i=0;i<4;i++)rect(c,o.x+8,o.y+10+i*4,o.w-16,1.5,'#111')}
const lockerO=(x,y)=>({x,y,w:36,h:56,solid:true,label:()=>T.hide?'Leave the locker':'Hide in the locker',draw:drawLocker,act:()=>{if(T.hide){T.hide=0;say('You slip out of the locker.',2)}else{T.hide=1;say('You pull the door shut and hold your breath. Something drifts past, searching.',4)}}});
const lureO=(x,y,lab,msg)=>({x,y,w:36,h:32,solid:true,label:lab,draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4a50');c.fillStyle=T.lure>0?'#ff6a5a':'#8a8a92';c.beginPath();c.arc(o.x+18,o.y+14,8,0,6.3);c.fill()},
  act(){if(T.lure>0){say('It is still drawing the thing away.',2);return}T.lure=8;T.lx=this.x+18;T.ly=this.y+32;noise(.8,.25,1500);say(msg,4)}});
const sealO=k=>({x:[90,190,390,490][k],y:70,w:36,h:40,solid:true,label:'Examine the seal',
  draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,26,'#4a5256');rect(c,o.x+4,o.y,o.w-8,16,'#5a6468');c.strokeStyle=T.seals?'#5fd35f':'#9ab';c.lineWidth=1.6;const x=o.x+18,y=o.y+8,n=SYM[k][0];
    if(n==='clock'){c.beginPath();c.arc(x,y,6,0,6.3);c.stroke()}else if(n==='eye'){c.beginPath();c.ellipse(x,y,8,4,0,0,6.3);c.stroke();c.fillStyle=c.strokeStyle;c.beginPath();c.arc(x,y,2,0,6.3);c.fill()}
    else if(n==='note'){c.beginPath();c.arc(x-2,y+3,3,0,6.3);c.moveTo(x+1,y+3);c.lineTo(x+1,y-6);c.stroke()}else{c.strokeRect(x-5,y-6,10,12)}},act:()=>say(SYM[k][1],5)});
/* typed code for the four seals: one digit under each carved symbol */
const SEAL_SVG={
  clock:'<circle cx="0" cy="0" r="10"/>'+[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const a=i*Math.PI/6;return '<circle cx="'+(Math.sin(a)*7).toFixed(2)+'" cy="'+(-Math.cos(a)*7).toFixed(2)+'" r="'+(i%3?.6:1.1)+'" fill="currentColor" stroke="none"/>'}).join(''),
  eye:'<ellipse cx="0" cy="0" rx="12" ry="6"/><circle cx="0" cy="0" r="3" fill="currentColor"/>',
  note:'<circle cx="-3" cy="6" r="4.5"/><path d="M1.5 6V-10"/>',
  glass:'<rect x="-7" y="-10" width="14" height="20" rx="1"/>'};
let sealCfg=null;
const closeSeal=()=>{const a=document.activeElement;if(a&&a.blur)a.blur();closeModal()};
function openSealCode(title,target,ok,intro){
  let el=$('sealCode');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='sealCode';
    el.innerHTML='<div class="card"><h2></h2><p class="small" style="text-align:center;color:var(--muted)"></p><div class="seals" id="sealRow"></div><div id="sealMsg" role="status" aria-live="polite" style="min-height:1.6em;text-align:center;color:var(--muted);font-family:var(--ui);font-size:14px"></div><div class="row"><button class="btn primary" id="sealTry" type="button">Try the code</button><button class="btn" id="sealX" type="button">Step back</button></div><p class="small" style="text-align:center">Type a number under each seal. Backspace goes back. Enter tries. Esc closes.</p></div>';
    $('view').appendChild(el);
    el.querySelector('#sealTry').onclick=trySealCode;el.querySelector('#sealX').onclick=closeSeal;
  }
  sealCfg={target,ok,busy:false};
  el.querySelector('h2').textContent=title;el.querySelector('p').textContent=intro||'';
  const row=$('sealRow');row.innerHTML='';row.classList.remove('shake');$('sealMsg').textContent='';
  SYM.slice(0,target.length).forEach(([n,desc],i)=>{
    const s=document.createElement('div');s.className='seal';
    s.innerHTML='<div class="seal-glyph" title="'+desc.split('.')[0]+'"><svg viewBox="-13 -13 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'+SEAL_SVG[n]+'</svg></div>';
    const inp=document.createElement('input');inp.type='text';inp.inputMode='numeric';inp.maxLength=1;inp.autocomplete='off';inp.placeholder='–';
    inp.setAttribute('aria-label','Number for the '+n+' seal');
    inp.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(!modal||modal.id!=='sealCode'){inp.blur();return}
      const all=[...row.querySelectorAll('input')];
      if(e.key==='Enter'){e.preventDefault();trySealCode()}
      else if(e.key==='Escape'){e.preventDefault();closeSeal()}
      else if(e.key==='Backspace'&&!inp.value&&i>0){e.preventDefault();all[i-1].value='';all[i-1].focus()}
      else if(e.key==='ArrowLeft'&&i>0){e.preventDefault();all[i-1].focus()}
      else if(e.key==='ArrowRight'&&i<all.length-1){e.preventDefault();all[i+1].focus()}
      else if(/^\d$/.test(e.key)){e.preventDefault();inp.value=e.key;sfx.light();s.classList.remove('bad');if(i<all.length-1)all[i+1].focus()}
      else if(e.key.length===1)e.preventDefault();
    });
    inp.addEventListener('input',()=>{const d=inp.value.replace(/\D/g,'').slice(-1);inp.value=d;if(d){sfx.light();const all=row.querySelectorAll('input');if(i<all.length-1)all[i+1].focus()}});
    inp.addEventListener('focus',()=>inp.select());
    s.appendChild(inp);row.appendChild(s);
  });
  openModal('sealCode',c=>{if(c==='Escape')closeSeal();else if(c==='Enter')trySealCode()});
  setTimeout(()=>{const f=row.querySelector('input');if(f)f.focus()},50);
}
function trySealCode(){
  if(!sealCfg||sealCfg.busy)return;
  const row=$('sealRow'),ins=[...row.querySelectorAll('input')],seals=[...row.querySelectorAll('.seal')],code=ins.map(x=>x.value).join('');
  if(code.length<ins.length){sfx.bad();$('sealMsg').textContent='Every seal needs a number.';const e=ins.find(x=>!x.value);if(e)e.focus();return}
  if(code===sealCfg.target){
    sealCfg.busy=true;ins.forEach(x=>x.disabled=true);$('sealMsg').textContent='The seals drink the numbers in.';
    seals.forEach((s,i)=>setTimeout(()=>{s.classList.add('lit');sfx.light()},i*260));
    setTimeout(()=>{const f=sealCfg.ok;closeSeal();f()},seals.length*260+700);return}
  sfx.bad();row.classList.remove('shake');void row.offsetWidth;row.classList.add('shake');
  seals.forEach(s=>s.classList.add('bad'));setTimeout(()=>seals.forEach(s=>s.classList.remove('bad')),700);
  $('sealMsg').textContent='The symbols flare red, then go dark. Nothing moves.';setTimeout(()=>{ins.forEach(x=>x.value='');ins[0].focus()},450);
}
const STAGE6={
  core:{name:'The Heart of the Manor',paint:paintCore,lights:()=>[{x:320,y:100,r:210,a:.55}],objs:[
    ...[0,1,2,3].map(sealO),
    {x:290,y:6,w:60,h:52,label:'Place the seals',draw:(c,o)=>{if(T.seals)rect(c,o.x+6,o.y+6,o.w-12,o.h-6,'#04100f')},
      act:()=>{if(T.seals){say('The great door stands open.');return}openSealCode('The four seals','7432',()=>{T.seals=true;heal();sfx.solve();shake=.5;say('The four symbols ignite. Deep in the walls, something enormous begins to turn.',6)},'Four seals, left to right. Each wants one number from your memories of the manor.')}},
    lockerO(60,110),lockerO(544,270),
    lureO(470,110,'Switch on the radio','The old radio crackles to life. The thing drifts toward the sound.'),
    D(292,64,56,20,'machine',320,310,()=>!T.seals,'The great door is sealed. Four symbols are carved above it.')]},
  machine:{name:'The Machine',paint:paintMach,lights:()=>[{x:320,y:110,r:230,a:.65,col:'60,200,200'}],objs:[
    {x:240,y:66,w:160,h:66,solid:true,label:'Face the machine',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a4a4e');for(let i=0;i<8;i++){c.fillStyle=(Math.sin(time*3+i)>0)?'#5ae6e6':'#1d4a4a';c.fillRect(o.x+12+i*18,o.y+12,10,10)}rect(c,o.x+60,o.y+34,40,24,'#10181a')},
      act:()=>{if(!T.mem){say('The machine hums, waiting for one true memory.',4);return}openChoice()}},
    {x:280,y:160,w:80,h:40,solid:true,label:'Use the memory console',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a3236');rect(c,o.x+8,o.y+6,o.w-16,16,T.mem?'#1d6a3a':'#10181a')},
      act:()=>{if(T.mem){say('The console is quiet. The truth is out.');return}addNote('Memory shards',SHARDS);showNote('Memory shards',SHARDS,()=>openDial('Memory sequence',4,'3124',()=>{T.mem=true;heal();sfx.solve();addNote('Restoration log',LOGM);showNote('Restoration log',LOGM,()=>{shake=.6;sfx.scare();say('You have been here before. More than once. Face the machine.',6)})},'Enter the shard numbers in the order it happened.'))}},
    lockerO(60,280),lureO(520,110,'Open the steam valve','Steam shrieks from a pipe. The thing lurches toward the noise.'),
    D(296,336,48,16,'core',320,110)]}
};
function beginStage6(){
  chapter=6;T={lure:0,hide:0};redMode=false;hearts=3;updateHUD();roomId='core';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=6;fade=1;roomT=3;sfx.door();
  say('The study floor opens onto a vast chamber. Something that wears your shape is already walking toward you. Hide in lockers (E) or lure it away with noise.',8);
}
function hint6(){
  let t;
  if(!T.seals)t='Each seal wants a number from earlier: the clock hour, the escaped patient\u2019s photo number, the lullaby\u2019s first step, and how many journal entries were true. Your journal (J) helps.';
  else if(!T.mem)t='Touch the four memory shards in the machine room in the order the night really happened.';
  else t='Face the machine and make your choice.';
  say('Hint: '+t+' Lockers hide you. Radios and valves lure the entity away.',7);
}
function openChoice(){
  let ch=$('choice');
  if(!ch){ch=document.createElement('div');ch.className='screen';ch.id='choice';
    ch.innerHTML='<div class="card" style="text-align:center"><h2>The Final Choice</h2><p style="color:var(--muted)">The machine hums. From a glass cylinder, your friend\u2019s voice: "Please. Choose."</p><div class="row" style="flex-direction:column;align-items:stretch"></div></div>';
    [['destroy','Destroy the machine'],['rescue','Rescue your friend'],['accept','Accept the manor\u2019s offer'],['remember','Remember who you are']].forEach(([k,l])=>{const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=l;b.onclick=()=>{closeModal();chooseEnding(k)};ch.querySelector('.row').appendChild(b)});
    $('view').appendChild(ch)}
  ch.querySelector('.row').children[3].hidden=true;
  openModal('choice',c=>{if(c==='Escape')closeModal()});
}
const CAP={destroy:'The machine falls silent. The wipes stop. Somewhere far below, something begins to laugh.',rescue:'Mara leans on your shoulder. The morning is cold and bright. Behind your eyes, a door stays open.',accept:'You walk back inside. The door closes gently behind you.',remember:'You remember everything. The front door was never locked from the outside.',together:'Five of you walk into the sunrise, and Mara is with you. Nobody is watching.'};
let capT=0;
function startEnding(kind){
  mode='end';E={t:0,len:36,kind,i:0};ghost.on=false;$('msg').classList.remove('show');sfx.solve();
  E.mus=setInterval(()=>{tone([262,330,392,523,392,330,294,349][E.i++%8],1.6,'triangle',kind==='accept'?.04:.08)},650);
}
function drawEnding(){
  const t=E.t,acc=E.kind==='accept',k=acc?0:Math.min(1,t/12),mx=(a,b)=>Math.round(a+(b-a)*k);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgb('+mx(8,90)+','+mx(10,150)+','+mx(30,210)+')');g.addColorStop(.7,'rgb('+mx(20,255)+','+mx(20,170)+','+mx(40,110)+')');g.addColorStop(1,'rgb('+mx(10,255)+','+mx(10,210)+','+mx(20,160)+')');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(!acc){ctx.fillStyle='rgba(255,233,168,.95)';ctx.beginPath();ctx.arc(440,270-k*100,40,0,6.3);ctx.fill()}
  ctx.fillStyle='#0c1410';ctx.fillRect(0,300,W,H-300);
  ctx.fillStyle='#0a0c10';ctx.beginPath();ctx.moveTo(20,300);ctx.lineTo(20,200);ctx.lineTo(60,170);ctx.lineTo(100,200);ctx.lineTo(120,150);ctx.lineTo(170,200);ctx.lineTo(210,200);ctx.lineTo(210,300);ctx.fill();
  const px=acc?Math.max(60,330-t*14):260+Math.min(t,34)*14,sw=Math.sin(t*6)*4;
  ctx.fillStyle='#050608';ctx.fillRect(px-5,282,4,18+sw*.3);ctx.fillRect(px+1,282,4,18-sw*.3);ctx.fillRect(px-7,258,14,26);ctx.beginPath();ctx.arc(px,252,6,0,6.3);ctx.fill();
  if(E.kind==='destroy'&&t>9){ctx.fillStyle='#000';const fx=px-70+Math.sin(t)*2;ctx.fillRect(fx-7,246,14,38);ctx.beginPath();ctx.arc(fx,238,8,0,6.3);ctx.fill();ctx.fillRect(fx-14,250,5,30);ctx.fillRect(fx+9,250,5,30)}
  if(E.kind==='together'){for(let i=1;i<=4;i++){const fx=px-24-i*22;ctx.fillStyle='#050608';ctx.fillRect(fx-6,262,12,22);ctx.beginPath();ctx.arc(fx,256,5,0,6.3);ctx.fill()}}
  if(E.kind==='rescue'||E.kind==='remember'||E.kind==='together'){ctx.fillRect(px-26,260,12,24);ctx.beginPath();ctx.arc(px-20,254,5,0,6.3);ctx.fill()}
  ctx.textAlign='center';
  if(t<14){ctx.globalAlpha=Math.min(1,t/2,(14-t)/2);ctx.fillStyle='#fff';ctx.font='italic 17px Georgia,serif';ctx.fillText(CAP[E.kind],W/2,70);ctx.globalAlpha=1}
  else{
    const a=Math.min(.6,(t-14)/3);ctx.fillStyle='rgba(0,0,0,'+a+')';ctx.fillRect(0,0,W,H);
    const L=['THE HOLLOW MANOR','','A game by '+CREDIT_NAME,'','Stage 1: The Hollow Manor','Stage 2: The Forgotten Wing','Stage 3: The Underground Laboratory','Stage 4: The Nursery','Stage 5: The Mirror Realm','Stage 6: The Heart of the Manor','','Thank you for playing'];
    ctx.fillStyle='#f0e8d6';L.forEach((l,i)=>{ctx.font=(i===0?'bold 26px':'15px')+' Georgia,serif';ctx.fillText(l,W/2,H+20+i*30-(t-14)*24)});
  }
}
function flashEnd(kind){
  mode='fin';
  let f=$('fin');
  if(!f){f=document.createElement('div');f.id='fin';f.style.cssText='position:absolute;inset:0;background:#000;color:#4cff7a;font:700 clamp(12px,2.6vw,20px)/1.9 "Courier New",monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:9;letter-spacing:.08em';$('view').appendChild(f)}
  f.innerHTML='';f.style.display='flex';f.style.background='#fff';setTimeout(()=>{f.style.background='#000'},90);
  const L=kind==='together'?['SUBJECT 07','SUBJECTS 07-A TO 07-D: REINTEGRATED','CHOICE ORIGIN: SUBJECT','OBSERVATION CYCLE: TERMINATED','Nobody is watching.']:kind==='remember'?['SUBJECT 07','MEMORY RESTORATION: INCOMPLETE','Physical escape: SUCCESSFUL','Simulated escape: NOT REQUIRED','Observation cycle terminated.','\u00a0','Subject 08 has woken up.']:kind==='destroy'?['SUBJECT 07','MEMORY WIPES: TERMINATED','CONTAINMENT: FAILED','The thing the machine was holding is awake.']:['SUBJECT 07','MEMORY RESTORATION COMPLETE','Simulated escape: SUCCESSFUL','Physical escape: FAILED','Beginning next observation cycle...'];
  L.forEach((t,i)=>setTimeout(()=>{const d=document.createElement('div');d.textContent=t;f.appendChild(d);if(i===0)sfx.scare()},500+i*650));
  setTimeout(()=>{f.style.display='none';f.innerHTML='';reset();mode='title';$('title').classList.add('on')},500+L.length*650+2400);
}
Object.assign(ROOMS,STAGE2,STAGE3,STAGE4,STAGE5,STAGE6);buildBG();
/* ===== Hands-on puzzles replacing three code dials ===== */
const dropObj=(r,re)=>{ROOMS[r].objs=ROOMS[r].objs.filter(o=>!(typeof o.label==='string'&&re.test(o.label)))};
/* Stage 2: swap the portraits on the wall */
dropObj('archive',/^(Read the plate|Rearrange the frames)$/);
const SOLP=[1,4,3,0,2],pp=()=>T.pp||(T.pp=[0,1,2,3,4]);
ROOMS.archive.objs.push(...[0,1,2,3,4].map(k=>({x:100+k*88,y:4,w:56,h:56,
  label:()=>T.port?'Look at the portrait':T.sel===k?'Hang the frame back':T.sel!=null?'Swap with the lifted frame':'Lift this frame down',
  draw:(c,o)=>{drawPortrait(c,o,FAM[pp()[k]].s);if(T.sel===k){c.strokeStyle='#e5c279';c.lineWidth=3;c.strokeRect(o.x-1,o.y-1,o.w+2,o.h+2)}},
  act:()=>{
    const p=pp();
    if(T.port){say(FAM[p[k]].n+'.',3);return}
    if(T.sel==null){T.sel=k;sfx.light();say('You lift the portrait of '+FAM[p[k]].n+'. Choose another frame to swap it with.',4);return}
    if(T.sel===k){T.sel=null;say('You hang it back.',2);return}
    const t=p[k];p[k]=p[T.sel];p[T.sel]=t;T.sel=null;sfx.door();
    if(p.every((v,i)=>v===SOLP[i]))portOk();else say('The frames trade places.',2);
  }})));
/* Stage 3: flip four breakers in order */
dropObj('lab',/^Breaker panel$/);
ROOMS.lab.objs.push(...[0,1,2,3].map(i=>({x:230+i*44,y:8,w:32,h:48,label:'Flip breaker '+(i+1),
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e52');const on=T.power||(T.bs||[]).includes(i+1);rect(c,o.x+12,o.y+(on?8:22),8,16,on?'#5fd35f':'#a03030');c.fillStyle='#ddd';c.font='bold 10px Georgia';c.textAlign='center';c.fillText(i+1,o.x+16,o.y+46)},
  act:()=>{
    if(T.power){say('The panel hums.');return}
    const b=T.bs=T.bs||[];
    if(b.includes(i+1)){say('That breaker is already down.');return}
    b.push(i+1);sfx.light();
    if(b.length<4){say('Breaker '+(i+1)+' clunks into place.',2);return}
    if(b.join('')==='3142'){T.power=true;heal();sfx.solve();shake=.4;say('Lights stutter on. Somewhere nearby, electric locks release.',5)}
    else{T.bs=[];sfx.bad();shake=.3;lightsOut=.4;say('Sparks. All four breakers snap back up. Wrong order.',4)}
  }})));
/* Stage 4: turn the toys to cast the right shadows */
dropObj('attic',/^Arrange the toys$/);
const TOYS=[['bear','#8a6a4a',1],['rabbit','#d8d0c0',0],['horse','#6a4a30',3]],DX=[0,1,0,-1],DY=[-1,0,1,0];
ROOMS.attic.objs.push(...TOYS.map(([n,col,want],i)=>({x:250+i*60,y:200,w:44,h:40,solid:true,label:'Turn the '+n,
  draw:(c,o)=>{
    const d=(T.toy||[2,2,2])[i],cx=o.x+22,cy=o.y+22;
    rect(c,o.x,o.y+28,o.w,12,'#4a3a2a');c.fillStyle=col;c.beginPath();c.arc(cx,cy,13,0,6.3);c.fill();
    c.fillStyle='#111';c.beginPath();c.moveTo(cx+DX[d]*17,cy+DY[d]*17);c.lineTo(cx+DX[d]*6-DY[d]*6,cy+DY[d]*6+DX[d]*6);c.lineTo(cx+DX[d]*6+DY[d]*6,cy+DY[d]*6-DX[d]*6);c.fill();
    if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}
  },
  act:()=>{
    if(T.shadow){say('Three shadows form a single open eye on the wall.');return}
    const t=T.toy=T.toy||[2,2,2];t[i]=(t[i]+1)%4;sfx.light();
    say('The '+n+' now faces '+['up','right','down','left'][t[i]]+'.',2);
    if(TOYS.every((x,j)=>t[j]===x[2])){T.shadow=true;heal();sfx.solve();say('A lamp swings on. Three shadows slide together on the wall into an eye. Somewhere, a lock clicks.',6)}
  }})));
/* ===== Stage 3 extras: The Pressure Valves and The Missing Experiment ===== */
const LOGX='LABORATORY LOG, Dr. Vane\n\nExp 1: Rig 2, 01:00, bed 9. Patient: "I remember my mother\u2019s name."\nExp 2: Rig 4, 03:00, bed 8. Patient: "I remember the garden. Then I do not."\nExp 3: Rig 6, 05:00, bed 7. Patient: "Who is the woman at the window?"\nExp 4: [PAGE TORN OUT]\nExp 5: Rig 10, 09:00, bed 5. Patient: "I am not afraid anymore."\nExp 6: Rig 12, 11:00, bed 4. Patient: "Please stop. I know the way out."\n\nThe rigs, the hours and the beds each follow their own simple pattern. Fill in Experiment 4.';
const EXP4='The missing page is restored, in ink:\n\nExp 4: Rig 8, 07:00, bed 6.\nSubject: your own name, in your own handwriting.\nResult: consciousness copied, memory stored, subject returned to the gate for the next cycle.\n\nIt is dated three nights ago.';
const VEC=[[1,-1,0,0],[0,1,-1,0],[0,0,1,-1],[-1,0,0,1]],lv=()=>T.lv||(T.lv=[7,3,6,4]);
const paintTank=c=>{paintBase(c,{floor:'#2b3236',floor2:'#252b2f',wall:'#18262a',wall2:'#121c1f',trim:'#0c1416',stone:true});doorBottom(c,'#3a4a4c',false);doorLR(c,608,'#3a4a4c')};
const paintCon=c=>{paintBase(c,{floor:'#2a2a30',floor2:'#242429',wall:'#1a1a20',wall2:'#131318',trim:'#0e0e12',stone:true});doorLR(c,0,'#3a4a4c')};
ROOMS.tanks={name:'The Pressure Room',paint:paintTank,lights:()=>[{x:320,y:100,r:230,a:.6}],objs:[
  ...[0,1,2,3].map(k=>({x:110+k*100,y:8,w:60,h:52,label:'Read the gauge',
    draw:(c,o)=>{const v=lv()[k];rect(c,o.x,o.y,o.w,o.h,'#3a4a4e');rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#10181a');const h=Math.max(0,Math.min(10,v))*3.6;rect(c,o.x+6,o.y+o.h-6-h,o.w-12,h,v===5?'#5fd35f':'#4aa0d0');c.fillStyle='#fff';c.font='bold 13px Georgia';c.textAlign='center';c.fillText('ABCD'[k]+': '+v,o.x+o.w/2,o.y+o.h+12)},
    act:()=>say('Tank '+'ABCD'[k]+' reads '+lv()[k]+'. The safe level is 5.',3)})),
  {x:520,y:8,w:64,h:48,label:'Read the sign',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8d2c0');c.fillStyle='#222';c.font='bold 12px Georgia';c.textAlign='center';c.fillText('SAFE: 5',o.x+32,o.y+28)},act:()=>say('"Safe pressure in all four tanks: 5. The containment door releases when the system is balanced."',5)},
  ...[0,1,2,3].map(i=>({x:125+i*100,y:150,w:34,h:34,solid:true,label:'Turn valve '+(i+1),
    draw:(c,o)=>{rect(c,o.x+14,o.y+18,6,16,'#4a4a50');c.strokeStyle='#c9a24a';c.lineWidth=3;c.beginPath();c.arc(o.x+17,o.y+14,12,0,6.3);c.stroke();c.beginPath();c.moveTo(o.x+5,o.y+14);c.lineTo(o.x+29,o.y+14);c.moveTo(o.x+17,o.y+2);c.lineTo(o.x+17,o.y+26);c.stroke();c.fillStyle='#fff';c.font='bold 11px Georgia';c.textAlign='center';c.fillText(i+1,o.x+17,o.y+50)},
    act:()=>{
      if(T.valves){say('The valves are locked open. The system is balanced.');return}
      const l=lv();VEC[i].forEach((d,k)=>{l[k]+=d});sfx.light();
      say('Valve '+(i+1)+' turns. Tank '+'ABCD'[i]+' rises and tank '+'ABCD'[(i+1)%4]+' falls.',3);
      if(l.every(v=>v===5)){T.valves=true;heal();sfx.solve();shake=.4;say('The pressure equalises with a long hiss. Somewhere east, the containment door unlocks.',6)}
    }})),
  {x:300,y:250,w:40,h:30,solid:true,label:'Pull the vent lever',draw:(c,o)=>{rect(c,o.x,o.y+10,o.w,20,'#4a4a50');rect(c,o.x+16,o.y,8,16,'#a03030')},act:()=>{if(T.valves){say('The vent is sealed.');return}T.lv=null;sfx.bad();say('Steam vents. All four tanks drop back to where they started.',4)}},
  D(296,336,48,16,'lab',320,310),
  D(586,170,22,60,'contain',70,210,()=>!T.valves,'The containment door is sealed until the pressure equalises.')]};
ROOMS.contain={name:'Containment',paint:paintCon,lights:()=>[{x:320,y:200,r:200,a:.6}],objs:[
  {x:250,y:190,w:100,h:44,solid:true,label:'Read the laboratory log',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3c');rect(c,o.x+28,o.y+10,44,24,'#d9ccab');c.fillStyle='#822';c.fillRect(o.x+66,o.y+14,6,16)},
    act:()=>{
      if(T.exp4){showNote('Experiment 4',EXP4);return}
      addNote('Laboratory log',LOGX);
      showNote('Laboratory log',LOGX,()=>openLogForm(()=>{T.exp4=true;heal();sfx.solve();shake=.5;addNote('Experiment 4',EXP4);showNote('Experiment 4',EXP4,()=>{sfx.scare();say('Your name. In your handwriting.',5)})},'Three dials: rig number, hour, bed number.'))
    }},
  {x:80,y:100,w:90,h:50,solid:true,label:'Examine the cot',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e50');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#8a8f94');rect(c,o.x+20,o.y+14,40,20,'#4a3b5c')},act:()=>say('A narrow cot with leather straps. A coat is draped across it. Your coat.',5)},
  D(32,170,22,60,'tanks',550,210)]};
ROOMS.lab.objs.push({x:288,y:344,w:64,h:36,draw:c=>doorBottom(c,'#3a4a4c',false)},D(296,336,48,16,'tanks',320,310,()=>!T.power,LK));
{const lk=ROOMS.observe.objs.find(o=>o.label==='Open the tape locker'),orig=lk.act;
 lk.act=()=>{if(!T.exp4){say('A label on the locker: "Tapes are released only after the Experiment 4 record is verified."',5);return}orig()}}
buildBG();
/* ===== More hands-on puzzles for Stages 1, 2, 4, 5 and 6 ===== */
/* Stage 1: the coloured books (the strange book only appears once they are solved) */
const BK=[{n:'black',c:'#222'},{n:'blue',c:'#3a5ac0'},{n:'green',c:'#2f8a4a'},{n:'red',c:'#b3262b'}],BKS=['blue','red','green','black'];
ROOMS.library.objs.unshift(...BK.map((b,i)=>({x:70+i*42,y:12,w:26,h:46,label:'Press the '+b.n+' book',
  draw:(c,o)=>{const p=(S.bk||[]).includes(i)||S.books;rect(c,o.x,o.y+(p?7:0),o.w,o.h-(p?7:0),b.c);rect(c,o.x,o.y+(p?7:0)+8,o.w,3,'#c9a24a')},
  act:()=>{
    if(S.books){say('The books are locked in place.');return}
    const q=S.bk=S.bk||[];if(q.includes(i)){say('That book is already pressed in.');return}
    q.push(i);sfx.light();
    if(q.length<4){say('The '+b.n+' book sinks into the shelf.',2);return}
    if(q.every((v,k)=>BK[v].n===BKS[k])){S.books=true;heal();sfx.solve();say('A click inside the wall. On the right-hand shelf, a book slides out an inch.',5)}
    else{S.bk=[];sfx.bad();say('The books slide back out. That was not the order.',3)}
  }})));
{const sb=ROOMS.library.objs.find(o=>o.label==='Pull the strange book');sb.when=()=>S.books}
/* Stage 2: the hidden lock is a plain 3-digit dial again */
{const w=ROOMS.archive.objs.find(o=>o.label==='Examine the wall');w.label='Use the hidden lock';
 w.act=()=>{if(T.door)return;openTypeCode('The hidden lock','729',doorOk,'Type the three numbers the doll said twice, in the order they first appeared.')}}
/* Stage 4: play the music box keys */
const KP={s:'',t:'',ok:null,
  press(n){tone([262,294,330,349,392,440,494,523][n-1],.7,'triangle',.2);this.s=(this.s+n).slice(-this.t.length);$('kOut').textContent=this.s.split('').map(d=>['do','re','mi','fa','sol','la','ti','high do'][d-1]).join('   ');if(this.s.replace(/8/g,'1')===this.t){const f=this.ok;closeModal();setTimeout(f,200)}},
  clear(){this.s='';$('kOut').textContent=''}};
function openKeys(title,target,ok,intro){
  let el=$('keys');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='keys';
    el.innerHTML='<div class="card" style="text-align:center"><h2></h2><p class="small" id="kIntro"></p><div class="row" id="kRow"></div><div id="kOut" style="min-height:2em;font:700 24px system-ui,sans-serif;letter-spacing:.3em"></div><div class="row"><button class="btn" id="kClear" type="button">Clear</button><button class="btn" id="kX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    const row=el.querySelector('#kRow');
    ['do','re','mi','fa','sol','la','ti','high do'].forEach((n,i)=>{const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=(i+1)+' '+n;b.onclick=()=>KP.press(i+1);row.appendChild(b)});
    el.querySelector('#kX').onclick=closeModal;el.querySelector('#kClear').onclick=()=>KP.clear();
  }
  el.querySelector('h2').textContent=title;$('kIntro').textContent=intro;
  KP.t=target;KP.ok=ok;KP.s='';$('kOut').textContent='';
  openModal('keys',c=>{if(c==='Escape')closeModal();else if(/^(Digit|Numpad)[1-8]$/.test(c))KP.press(+c.slice(-1));else if(c==='Backspace')KP.clear()});
}
/* Stage 5: use your own delayed copy to hold the second pressure plate */
ROOMS.hallM.objs.push(...[180,460].map((x,i)=>({x:x-28,y:268,w:56,h:34,draw:(c,o)=>{const on=T.plates||(i?T.pb:T.pa);rect(c,o.x,o.y,o.w,o.h,on?'#3a6a5a':'#243438');c.strokeStyle=on?'#8af0c0':'#5a8a8a';c.lineWidth=2;c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2)}})));
{const k=ROOMS.hallM.objs.find(o=>o.label==='Take the silver key'),oa=k.act;
 k.act=()=>{if(!T.plates){say('The key sits under a glass dome. Two floor plates glow in front of the table, one on each side of the hall.',5);return}oa()}}
/* Stage 6: touch the memory shards in the order it happened */
const SH=['Your friend whispered "Count the candles" and you laughed.','The lights turned red. Your friend pointed at an empty bed.','You both reached the front door at dusk. It was already locked.','Your friend stepped into the glass. You stood still and watched.'],SHO='3124';
ROOMS.machine.objs.push(...[[130,190],[200,250],[450,250],[510,190]].map(([x,y],i)=>({x,y,w:30,h:30,solid:true,label:'Touch the memory shard',
  draw:(c,o)=>{const t=(T.ms||[]).includes(i+1)||T.mem;c.fillStyle=t?'rgba(90,230,230,.3)':'rgba(90,230,230,.9)';c.beginPath();c.arc(o.x+15,o.y+12+Math.sin(time*2+i)*3,10,0,6.3);c.fill();rect(c,o.x+6,o.y+22,18,8,'#2a3236')},
  act:()=>{
    if(T.mem){say('The shard is dark and empty now.');return}
    const m=T.ms=T.ms||[];if(m.includes(i+1)){say('You have already touched this memory.');return}
    m.push(i+1);sfx.light();say('"'+SH[i]+'"',5);
    if(m.length<4)return;
    if(m.join('')===SHO){T.mem=true;heal();sfx.solve();addNote('Restoration log',LOGM);saveCheckpoint();showNote('Restoration log',LOGM,()=>{shake=.6;sfx.scare();say('You have been here before. More than once. Face the machine.',6)})}
    else{T.ms=[];sfx.bad();say('The memories scatter and re-form. That was not the order it happened.',5)}
  }})));
{const cs=ROOMS.machine.objs.find(o=>o.label==='Use the memory console');cs.act=()=>{if(T.mem){say('The console is quiet. The truth is out.');return}say('The console waits. Four memory shards drift around the room. Touch them in the order it happened.',7)}}
buildBG();
/* ===== Stage 1: make the safe clue easier to follow ===== */
const HEARTH='A tiny child\u2019s shoe lies in the embers. Scratched into the hearthstone:\n\n"Blue first.\nRed comes after blue.\nGreen comes right after red.\nBlack ends the tale."\n\nThe colored books on the left shelf must be pressed in this order.';
{const sf=ROOMS.cellar.objs.find(o=>o.label==='Open the safe');
 sf.act=()=>{if(S.safe){say('The safe is open and empty.');return}if(!S.page){say('Three dials and no idea what to enter. The code must be written down somewhere upstairs. The library shelves are worth another look.',6);return}openSafe()}}
/* ===== Stage 2 expansion: four corridors, a carried candle, and a light that must be abandoned ===== */
const SIB=[['Edmund',1851],['Corvin',1857],['Aldric',1849],['Silas',1853]];
const TN3='A torn note, pinned beside the doors:\n\nSome doors breathe. One steals the breath away.\nThe rest only pretend to.';
const N4='Scratched into the floorboards:\n\nThree times you followed what burned.\nNow follow what remains.';
const whisperCfg=()=>V('audio/whisper.mp3',.8,.55,0,100,[["Don't turn around.",.85]]);
const cXs=()=>T.cor===2?[128,256,384,512]:[160,320,480];
const cDoor=i=>({door:true,get x(){return (cXs()[i]||-99)-28+((T.off||[])[i]||0)},y:64,w:56,h:20,when:()=>i<cXs().length,
  lock:()=>!T.candle,lockMsg:'It is too dark to choose a door. Take the candle from the wall first.',fn:()=>corrPick2(i),
  draw:(c,o)=>{
    rect(c,o.x,8,56,56,'#150c08');rect(c,o.x+4,12,48,52,'#33231a');rect(c,o.x+44,40,3,3,'#c9a24a');
    if(T.cor===3){c.fillStyle='rgba(220,200,150,.55)';c.font='bold 14px Georgia';c.textAlign='center';c.fillText('ABC'[i],o.x+28,34)}
    if(T.cor===4&&i===T.good){const g=.1+.5*Math.min(1,(T.t4||0)/50),gr=c.createLinearGradient(0,60,0,84);gr.addColorStop(0,'rgba(255,210,140,'+g+')');gr.addColorStop(1,'rgba(255,210,140,0)');c.fillStyle=gr;c.fillRect(o.x+4,60,48,24)}
  }});
const sibObj=k=>({x:[128,256,384,512][k]-22,y:352,w:44,h:30,when:()=>T.cor===2,label:'Look at the damaged portrait',
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6b4a22');rect(c,o.x+3,o.y+3,o.w-6,o.h-9,'#241a12');c.fillStyle='#cdbfa8';c.beginPath();c.ellipse(o.x+22,o.y+13,7,8,0,0,6.3);c.fill();c.strokeStyle='#8a2a2a';c.lineWidth=1.2;c.beginPath();c.moveTo(o.x+15,o.y+7);c.lineTo(o.x+29,o.y+19);c.moveTo(o.x+29,o.y+7);c.lineTo(o.x+15,o.y+19);c.stroke();c.fillStyle='#c9a24a';c.font='bold 8px Georgia';c.textAlign='center';c.fillText(SIB[k][1],o.x+22,o.y+o.h-1)},
  act:()=>say('A damaged portrait. The plate reads: '+SIB[k][0]+' Vane, born '+SIB[k][1]+'. The face has been scratched out.',5)});
const flameState=()=>T.fst||{s:1,dx:0,flick:0};
function playerLightR(){
  if(chapter===2&&roomId==='corr'){if(!T.candle)return 40;return 22+128*flameState().s}
  return chapter===8?115:150;
}
function drawFlame(x,y){
  if(!(chapter===2&&roomId==='corr')){ctx.fillStyle='rgba(255,215,130,.95)';ctx.beginPath();ctx.arc(x,y,2.6,0,6.3);ctx.fill();return}
  if(!T.candle)return;
  const st=flameState();if(st.s<=.03)return;
  const f=Math.sin(time*18)*.7*st.flick;
  ctx.fillStyle='rgba(255,170,60,'+Math.min(1,st.s+.25)+')';
  ctx.beginPath();ctx.moveTo(x-2.6,y+2);ctx.quadraticCurveTo(x-2+st.dx*.4,y-5*st.s,x+st.dx+f,y-9*st.s-1);ctx.quadraticCurveTo(x+2+st.dx*.4,y-4*st.s,x+2.6,y+2);ctx.fill();
  ctx.fillStyle='rgba(255,240,170,.95)';ctx.beginPath();ctx.ellipse(x+st.dx*.25,y-1,1.2,2.6*st.s,0,0,6.3);ctx.fill();
}
function corrUpdate(dt){
  if(T.rl>0)T.rl-=dt;
  corrParanoia(dt);
  if(T.cor===4)T.t4=(T.t4||0)+dt;
  if(!T.candle){T.fst={s:0,dx:0,flick:0};return}
  const xs=cXs();let s=1,dx=0,fl=0;
  if(T.back>0){T.back-=dt;dx=-10;s=.9}
  else if(T.cor===1)dx=clamp((xs[T.good]-player.x)/70,-1,1)*7;
  else if(T.cor===2){
    const d=Math.hypot(player.x-320,player.y-60),a=clamp((140-d)/80,0,1);T.wa=a;
    if(a>.7&&!T.read){T.read=true;addNote('Writing in the wall','Where the third brother stood, the passage remains.');say('Faint writing glows in the stone: "Where the third brother stood, the passage remains."',6)}
    if(T.read&&d>210)T.chg=Math.min(1,(T.chg||0)+dt*.4);
  }else if(T.cor===3){
    if(T.fs==null)T.fs=1;
    if(!T.out){
      const n=xs.findIndex(x=>Math.abs(player.x-x)<70&&player.y<170);
      if(n===2)T.fs-=dt*.8;else T.fs=Math.min(1,T.fs+dt*1.2);
      if(n===0)fl=1;
      if(T.fs<=0){T.out=true;T.fs=0;sfx.bad();say('Don\u2019t turn around.',4);speak(whisperCfg())}
    }
    s=T.out?0:Math.max(.05,T.fs);
  }else if(T.cor===4)s=(T.rl>.55&&T.rl<1.1)?1:0;
  T.fst={s,dx,flick:fl};
}
function corrReset(){T.off=[0,0,0,0];T.para=0;T.good=Math.floor(Math.random()*3);player.x=320;player.y=310;player.dir='up';fade=1;doorCool=.6;sfx.door();T.t4=0;T.fs=T.out?0:1}
function corrNext(){
  if(T.cor>=4){T.route=3;changeRoom('archive',320,300);say('The last door opens onto a long gallery. Behind you, the corridor is gone.',5);return}
  T.cor++;corrReset();
  say(['','Another corridor, longer than the last. Four doors, all alike. The candle no longer leans.','A third corridor. Three doors, marked A, B and C.','The last corridor is almost completely dark.'][T.cor-1],5);
}
function corrPick2(i){
  const cor=T.cor,good=cor===2?3:cor===3?2:T.good;
  if(i!==good){
    say(['You step through and find yourself back at the start. Was the corridor always this long?','The door opens onto the same corridor. Nothing has changed except you.','The door opens onto the same corridor. The doors seem to lean closer.','Darkness, and then the same corridor again.'][cor-1],4.5);
    sfx.bad();corrReset();return;
  }
  if(cor===1){T.back=1.1;doorCool=3;sfx.door();say('The flame lies flat and bends backward, as though something on the other side is breathing toward you.',4);setTimeout(corrNext,1100);return}
  if(cor===4){T.rl=1.3;doorCool=3;say('The candle relights by itself. For one breath. Then it is gone again.',3);setTimeout(corrNext,1350);return}
  corrNext();
}
function examineCandle(){
  if(!(chapter===2&&roomId==='corr'&&T.candle))return;
  say([
    'The flame leans, restless, as if something is pulling at it.',
    'The flame stands still. Something here is waiting to be seen.',
    T.out?'The candle is dead. It will not relight.':'The flame reacts to the doors in different ways. Try standing near each one.',
    'The candle is cold wax. The wick is black and will not take a spark.'][T.cor-1],4);
}
function corrHint(){
  return [
    !T.candle?'Take the candle from the holder on the left wall. Then watch which way its flame leans as you walk, and go through that door.':'Watch which way the candle flame leans as you walk. Go through that door.',
    'Hold the candle near the wall between the doors to read the writing. Then study the four portraits on the bottom wall: sort the brothers by birth year.',
    'Stand near each door and watch what the candle does. Read the torn note on the wall.',
    'Your candle is no use here. The note said to follow the light. Look for a faint glow under one door.'][T.cor-1];
}
ROOMS.corr.objs=[
  cDoor(0),cDoor(1),cDoor(2),cDoor(3),
  {x:34,y:230,w:16,h:36,when:()=>T.cor===1&&!T.candle,label:'Take candle',
    draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,22,'#4a3a2a');rect(c,o.x+5,o.y+8,6,8,'#e6dcc3');flame(c,o.x+8,o.y+8,1.1)},
    act:()=>{T.candle=true;sfx.pick();say('You take the candle. Its small flame is the only light you have.',4)}},
  {x:34,y:170,w:14,h:26,when:()=>T.cor===1,label:'Read the note',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#d9ccab'),act:()=>{addNote('Pinned note',CN);showNote('Pinned note',CN)}},
  {x:260,y:6,w:120,h:50,when:()=>T.cor===2,
    draw:c=>{const a=T.wa||0,ch=T.chg||0;c.textAlign='center';c.font='italic 10px Georgia';c.fillStyle='rgba(230,215,170,'+(a*(1-ch)).toFixed(2)+')';c.fillText('Where the third brother stood,',320,30);c.fillText('the passage remains.',320,43);c.font='italic bold 12px Georgia';c.fillStyle='rgba(200,60,50,'+(a*ch).toFixed(2)+')';c.fillText('He knows you saw it.',320,38)}},
  ...[0,1,2,3].map(sibObj),
  {x:34,y:170,w:14,h:26,when:()=>T.cor===3,label:'Read the torn note',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#cbbd98'),act:()=>{addNote('Torn note',TN3);showNote('Torn note',TN3)}},
  {x:322,y:322,w:18,h:12,when:()=>T.cor===4,label:'Read the scratched message',draw:(c,o)=>rect(c,o.x,o.y+4,o.w,3,'#6a5a48'),act:()=>{addNote('Scratched message',N4);showNote('Scratched message',N4)}}
];
ROOMS.corr.lights=()=>{
  const L=[];
  if(T.cor===1&&!T.candle)L.push({x:46,y:246,r:150,a:.8});
  if(T.cor===4){const g=.12+.55*Math.min(1,(T.t4||0)/50);L.push({x:cXs()[T.good],y:76,r:30+g*50,a:g})}
  return L;
};
/* ===== Endings: checkpoint, per-ending screens, endings counter ===== */
const REMEMBER_CARDS=[
  ['MEMORY RESTORED // ORIGIN','You remember a house before it was a manor. A girl named Mara, alone in a room with one window. The first subject.',null,38],
  ['MEMORY RESTORED // THE FRIEND','She was lonely. She remembered a friend she had never had, and the machine, which keeps everything, made her one.',null,38],
  ['MEMORY RESTORED // YOU','That friend was you. Every memory of a life outside these walls was hers, never yours.',null,38],
  ['MEMORY RESTORED // THE DOOR','Mara was never missing. She was waiting. You were the only thing that ever came when she called.',null,38],
  ['THE FRONT DOOR','It was never locked from the outside. Together, for the first time, you open it.',null,38]
];
const ACCEPT_CARDS=[
  ['THE MANOR ACCEPTS','The screen goes black. In the dark, the static from the beginning crackles again.',null,40],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,60],
  ['CYCLE 02','You are back in the entrance hall.',null,45]
];
function markEnding(k){try{const e=JSON.parse(localStorage.getItem('hmEnd')||'{}');e[k]=1;localStorage.setItem('hmEnd',JSON.stringify(e))}catch(x){}}
function endingsFound(){try{const e=JSON.parse(localStorage.getItem('hmEnd')||'{}');return['destroy','rescue','accept','remember','together'].filter(k=>e[k]).length}catch(x){return 0}}
function saveCheckpoint(){try{localStorage.setItem('hmCP',JSON.stringify({n:notes}))}catch(e){}}
function playCards(deck,done){closeModal();$('msg').classList.remove('show');noise(.8,.2,2500);runIntro(deck,done)}
function chooseEnding(k){
  if(k==='accept'){markEnding('accept');playCards(ACCEPT_CARDS,startCycle2);return}
  if(k==='destroy'||k==='rescue'){playCards(k==='destroy'?FOOL_DESTROY:FOOL_RESCUE,()=>startCycle2(true));return}
  if(k==='remember'){markEnding(k);playCards(rememberDeck(),()=>startEnding('remember'));return}
  markEnding(k);startEnding(k);
}
function startFromCheckpoint(){
  let d=null;try{d=JSON.parse(localStorage.getItem('hmCP'))}catch(e){}
  if(!d)return;
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  reset();notes=Array.isArray(d.n)?d.n:[];chapter=6;mode='play';initAudio();
  T={lure:0,hide:0,seals:true,mem:true};roomId='machine';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=2.5;hearts=3;updateHUD();
  say('Your memories are whole again. The machine waits. Face it when you are ready.',6);
}
function refreshTitleExtras(){
  const row=document.querySelector('#title .row');if(!row)return;
  let b=$('bFinal');
  if(!b){b=document.createElement('button');b.id='bFinal';b.className='btn';b.type='button';b.textContent='Return to the final choice';b.onclick=startFromCheckpoint;row.appendChild(b)}
  let has=false;try{has=!!localStorage.getItem('hmCP')}catch(e){}
  b.hidden=!has;
  let b2=$('bCycle2');
  if(!b2){b2=document.createElement('button');b2.id='bCycle2';b2.className='btn';b2.type='button';b2.textContent='Enter Cycle 02';b2.onclick=startCycle2;row.appendChild(b2)}
  let acc=false;try{acc=!!JSON.parse(localStorage.getItem('hmEnd')||'{}').accept}catch(e){}
  b2.hidden=!acc;
  let c=$('endCount');
  if(!c){c=document.createElement('p');c.id='endCount';c.className='small';row.parentNode.appendChild(c)}
  const n=endingsFound();c.textContent=n?('Endings found: '+n+' of 5'):'';
}
/* ===== CYCLE 02: the changed entrance hall (side quests) ===== */
const MARA2='Mara\u2019s note, folded small:\n\n"I remember you saying yes. I wish you hadn\u2019t.\n\nThe clock gave its hands away. One went where the stories sleep. One went where the guests were never fed.\n\nFind them. Find the hour it wants. The wall is only a door that forgot itself."';
const DIARY2='The diary\u2019s last page is dated TOMORROW. In Elara\u2019s hand:\n\n"At twenty past four the clock stops being kind. Set it, and the wall remembers it was a door.\n\nI will not be here to see it. Or I will, and I will not remember."';
const EXPTXT='The four screens flicker into one.\n\nFOUR EXPERIMENTS. ONE SUBJECT.\n\nSomewhere beyond the glass, a steel door unlocks.';
const C2END=[['CYCLE 02','The machine below is awake. It remembers that you said yes, and so does she.\n\nThe second confrontation arrives in the next update.',null,45]];
const MON=[['04:48','EXPERIMENT 07-B','Subject 07 destroys the machine. Something far below begins to laugh. Result: containment failure.'],['01:05','EXPERIMENT 07-A','Subject 07 carries a woman into the sunrise. Result: escape confirmed. Physical escape: failed.'],['06:30','EXPERIMENT 07-D','Subject 07 remembers. Subject 08 wakes. Result: an unexpected variable.'],['03:12','EXPERIMENT 07-C','Subject 07 accepts the offer. The hall resets. Result: cycle 02.']],MSEQ='1302';
const glint=(x,y,label,flag,text)=>({x,y,w:30,h:16,label,when:()=>!T[flag],
  draw:(c,o)=>{rect(c,o.x,o.y+6,o.w,6,'#3a2a1a');const g=.4+.4*Math.sin(time*4+x);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+15,o.y+8,3+g*2,0,6.3);c.fill()},
  act:()=>{T[flag]=true;sfx.pick();say(text,5)}});
function drawClock2(c){
  rect(c,536,6,48,8,'#2f1c10');rect(c,540,10,40,100,'#3b2517');rect(c,536,100,48,10,'#2f1c10');
  c.fillStyle='#e8dfc8';c.beginPath();c.arc(560,30,13,0,6.3);c.fill();c.strokeStyle='#6b4a22';c.lineWidth=2;c.stroke();
  if(T.clock2){c.strokeStyle='#1a120c';c.lineWidth=2;const ha=(4*30+10)*Math.PI/180,ma=120*Math.PI/180;c.beginPath();c.moveTo(560,30);c.lineTo(560+Math.sin(ha)*7,30-Math.cos(ha)*7);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(560,30);c.lineTo(560+Math.sin(ma)*10,30-Math.cos(ma)*10);c.stroke()}
  rect(c,548,52,24,44,'#150e09');const px=560+Math.sin(time*3)*6;c.fillStyle='#c9a24a';c.beginPath();c.arc(px,86,5,0,6.3);c.fill();
}
const lf=ROOMS.library.objs,fo=ROOMS.foyer.objs,dn=ROOMS.dining.objs;
ROOMS.foyer2={name:'The Entrance Hall',paint:paintFoyer,lights:()=>[{x:130,y:70,r:115,a:.75},{x:450,y:75,r:125,a:.5,col:'80,120,200'},...(T.hall?[{x:514,y:70,r:90,a:.8,col:'80,230,230'}]:[])],objs:[
  ...fo.filter(o=>!o.door&&(o.label==='Look at portrait'||o.solid)),
  {x:180,y:290,w:30,h:16,label:'Pry up the loose board',when:()=>!T.mnote,
    draw:(c,o)=>{rect(c,o.x,o.y+6,o.w,6,'#3a2a1a');const g=.4+.4*Math.sin(time*4);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+15,o.y+8,3+g*2,0,6.3);c.fill()},
    act:()=>{T.mnote=true;sfx.pick();addNote('Mara\u2019s note',MARA2);showNote('Mara\u2019s note',MARA2)}},
  {x:292,y:64,w:56,h:20,label:'Try the cellar door',act:()=>say('Bricked up. Whatever was beneath this house is not under it tonight.',5)},
  {...D(486,64,56,20,'ctrl2',320,310,()=>!T.hall,'The new door has no handle yet. The wall behind it is humming.'),
    draw:c=>{rect(c,486,8,56,56,'#0c0a08');rect(c,490,12,48,52,T.hall?'#1d3a3a':'#2a2a30');rect(c,524,40,3,3,'#c9a24a');if(T.hall){c.fillStyle='rgba(120,230,230,.3)';c.fillRect(490,56,48,10)}}},
  D(32,170,22,60,'library2',550,210),
  D(586,170,22,60,'dining2',70,210)]};
ROOMS.library2={name:'The Library',paint:paintLibrary,lights:()=>[{x:320,y:60,r:120,a:.9},{x:200,y:180,r:80,a:.8},{x:195,y:300,r:50,a:.55}],objs:[
  {...lf.find(o=>o.draw===drawFire),act:()=>say('The fire burns low. The child\u2019s shoe is gone from the embers.',5)},
  {...lf.find(o=>o.draw===drawDesk),label:'Read the diary',act:()=>{T.diary2=true;addNote('Diary: tomorrow',DIARY2);showNote('Diary: tomorrow',DIARY2)}},
  lf.find(o=>o.draw===drawArmchair),
  glint(180,290,'Take the hour hand','hand1','You work a heavy brass hour hand free from a gap between the books. It is warm.'),
  D(586,170,22,60,'foyer2',70,210)]};
ROOMS.dining2={name:'The Dining Room',paint:paintDining,lights:()=>[{x:320,y:205,r:150,a:.85},{x:560,y:60,r:50,a:.55},{x:135,y:300,r:50,a:.55}],objs:[
  dn.find(o=>o.label==='Examine the table'),
  ...dn.filter(o=>o.solid&&!o.label),
  {x:536,y:64,w:48,h:44,solid:true,label:'Set the clock',draw:drawClock2,act:()=>{
    if(T.clock2){say('The clock stands at twenty past four.');return}
    if(!(T.hand1&&T.hand2)){say('The clock face is bare. It needs both its hands.',5);return}
    openClockFace2()}},
  glint(120,290,'Take the minute hand','hand2','Behind a stack of plates lies the long minute hand. It points at you, then slowly away.'),
  D(32,170,22,60,'foyer2',570,210)]};
const paintCtl=c=>{paintBase(c,{floor:'#232b2e',floor2:'#1e2528',wall:'#142024',wall2:'#0f181b',trim:'#0a1214',stone:true});doorLR(c,0,'#3a4a4c')};
ROOMS.ctrl2={name:'The Control Room',paint:paintCtl,lights:()=>[{x:320,y:100,r:240,a:.6,col:'60,200,200'}],objs:[
  ...MON.map(([t,h,txt],k)=>({x:100+k*110,y:8,w:80,h:48,label:'Replay the recording',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a3236');rect(c,o.x+5,o.y+5,o.w-10,o.h-10,'#07100f');const on=T.ctrl||(T.ms2||[]).includes(k);for(let i=0;i<7;i++){c.fillStyle=on?'rgba(90,230,160,.25)':'rgba(120,170,170,'+(.08+.1*Math.abs(Math.sin(time*7+i+k*2)))+')';c.fillRect(o.x+7,o.y+8+i*5,o.w-14,2)}c.fillStyle=on?'#8af0b0':'#6fbf8a';c.font='bold 11px "Courier New",monospace';c.textAlign='center';c.fillText(t,o.x+o.w/2,o.y+o.h-12)},
    act:()=>{
      if(T.ctrl){say('The screens show a single word: SUBJECT.',3);return}
      const q=T.ms2=T.ms2||[];if(q.includes(k)){say('That recording has already played.',2);return}
      q.push(k);sfx.light();say(h+' ['+t+']: '+txt,8);addNote('Recording '+h.slice(-4),h+' ['+t+']: '+txt);
      if(q.length<4)return;
      if(q.join('')===MSEQ){T.ctrl=true;heal();sfx.solve();shake=.5;addNote('The four experiments',EXPTXT);showNote('The four experiments',EXPTXT,()=>say('At the east end of the room, a steel door unlocks with a heavy clunk.',6))}
      else{T.ms2=[];sfx.bad();say('The screens scramble. The recordings were not played in the order they happened.',5)}
    }})),
  D(32,170,22,60,'foyer2',514,110)]};
/* ===== Cycle 02 continued: the Cell Block, the Listening Room and the Threshold ===== */
const CODES=['105','448','312','630'];
const CELLTX=[
  'Cell A. A cot with leather straps. On it, a coat: your coat. A name tag in your handwriting: SUBJECT 07-A.\n\nScratched into the wall: "I carried her out. Mara was so light."',
  'Cell B. A burned coat: your coat. A name tag in your handwriting: SUBJECT 07-B.\n\nScratched into the wall: "I broke it. It was holding something. I should have asked what."',
  'Cell C. A neatly made bed. On it, a coat: your coat. A name tag in your handwriting: SUBJECT 07-C.\n\nScratched into the wall: "I said yes. She sounded so relieved. Why was she relieved?"',
  'Cell D. An empty cot, still warm. A coat beside it: your coat. A name tag in your handwriting: SUBJECT 07-D.\n\nScratched into the wall: "I remembered. She talks to us at 91.7. Listen."'];
const FOUR='Four cots. Four coats. Four name tags in your own handwriting.\n\nEvery one of them was you, and every one of them believed they were the only one.';
const TRANS='Static. Then Mara\u2019s voice, calm and kind:\n\n"Say yes. Say yes, my love, and I can keep you. I cannot keep the ones who say no. I cannot keep the ones who break things. Say yes."\n\nThe same words, again and again, to four different copies of you.';
const hasNote=t=>notes.some(n=>n.title===t);
const paintX=(w,e)=>c=>{paintBase(c,{floor:'#232b2e',floor2:'#1e2528',wall:'#142024',wall2:'#0f181b',trim:'#0a1214',stone:true});if(w)doorLR(c,0,'#3a4a4c');if(e)doorLR(c,608,'#3a4a4c')};
ROOMS.ctrl2.objs.push({...D(586,170,22,60,'cells',70,210,()=>!T.ctrl,'The steel door is sealed. The recordings have not all played in the right order.'),draw:c=>doorLR(c,608,'#3a4a4c')});
ROOMS.cells={name:'The Cell Block',paint:paintX(1,1),lights:()=>[{x:320,y:90,r:230,a:.55,col:'120,200,220'}],objs:[
  ...[0,1,2,3].map(k=>({x:100+k*110,y:8,w:64,h:48,label:'Open cell '+'ABCD'[k],
    draw:(c,o)=>{const op=(T.cell||[])[k];rect(c,o.x,o.y,o.w,o.h,op?'#1a2226':'#2a3236');if(!op){c.fillStyle='#8a9aa0';for(let i=0;i<5;i++)c.fillRect(o.x+8+i*11,o.y+4,3,o.h-8)}else rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#05090a');c.fillStyle='#cfe';c.font='bold 12px Georgia';c.textAlign='center';c.fillText('ABCD'[k],o.x+o.w/2,o.y+o.h+12)},
    act:()=>{
      const cl=T.cell=T.cell||[false,false,false,false],L='ABCD'[k];
      if(cl[k]){say('Cell '+L+' stands open. Its belongings are in your journal.',3);return}
      openCellEntry(k,()=>{
        cl[k]=true;sfx.pick();addNote('Cell '+L,CELLTX[k]);T.tags=(T.tags||0)+1;updateHUD();
        if(cl.every(Boolean)){T.cells=true;heal();sfx.solve();shake=.4;addNote('Four of you',FOUR);showNote('Cell '+L,CELLTX[k],()=>showNote('Four of you',FOUR,()=>say('Somewhere ahead, a steel door unlocks.',5)))}
        else showNote('Cell '+L,CELLTX[k]);
      },'Enter the timestamp of this experiment\u2019s recording, without the colon.');
    }})),
  lockerO(44,270),lureO(520,280,'Rattle the bars','The bars ring out down the corridor. The thing turns toward the sound.'),
  D(32,170,22,60,'ctrl2',550,210),
  D(586,170,22,60,'radio',70,210,()=>!T.cells,'The steel door ahead stays sealed until every cell is open.')]};
ROOMS.radio={name:'The Listening Room',paint:paintX(1,1),lights:()=>[{x:320,y:200,r:150,a:.6}],objs:[
  {x:280,y:170,w:80,h:50,solid:true,label:'Tune the radio',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a2a');rect(c,o.x+8,o.y+8,o.w-16,18,'#10181a');c.fillStyle='#c9a24a';c.beginPath();c.arc(o.x+22,o.y+36,6,0,6.3);c.arc(o.x+58,o.y+36,6,0,6.3);c.fill();if(T.tuned){c.fillStyle='#5fd35f';c.fillRect(o.x+12,o.y+14,56,6)}},
    act:()=>{
      if(T.tuned){showNote('Mara\u2019s transmission',TRANS);return}
      openRadioTuner(()=>{T.tuned=true;heal();sfx.solve();addNote('Mara\u2019s transmission',TRANS);speak(V('audio/mara4.mp3',.9,1.1,.02,220,[["Say yes.",.9],["Say yes, my love.",.95],["And I can keep you.",.9]]));showNote('Mara\u2019s transmission',TRANS)});
    }},
  lockerO(560,110),lureO(70,280,'Bang on the pipes','The pipes clang like a bell. The thing lurches toward the noise.'),
  D(32,170,22,60,'cells',550,210),
  D(586,170,22,60,'thresh',70,210,()=>!T.tuned,'The door is dead. Perhaps the radio can wake it.')]};
const SEALS=[['COPIES','Four of you','Four coats, four name tags. Each of them sure they were the only one.'],['VOICE','Mara\u2019s transmission','She asked every one of them to say yes.'],['OBSERVER','The four experiments','Someone watched all of it from this side of the glass.']];
ROOMS.thresh={name:'The Threshold',paint:paintX(1,0),lights:()=>[{x:320,y:110,r:230,a:.65,col:'90,230,230'}],objs:[
  ...SEALS.map(([n,req,txt],k)=>({x:130+k*160,y:110,w:60,h:50,solid:true,label:'Touch the seal',
    draw:(c,o)=>{const on=(T.sl||[])[k];rect(c,o.x,o.y+14,o.w,36,'#3a4448');rect(c,o.x+6,o.y,o.w-12,18,'#4a5458');c.fillStyle=on?'#8af0b0':'#6a7a7e';c.font='bold 10px Georgia';c.textAlign='center';c.fillText(n,o.x+o.w/2,o.y+12);if(on){c.fillStyle='rgba(120,240,170,.5)';c.beginPath();c.arc(o.x+o.w/2,o.y+34,8,0,6.3);c.fill()}},
    act:()=>{
      const sl=T.sl=T.sl||[false,false,false];
      if(sl[k]){say('The seal glows. '+txt,3);return}
      if(!hasNote(req)){say('The seal stays dark. You have not understood this yet.',4);return}
      sl[k]=true;sfx.light();say('The seal accepts. '+txt,5);
      if(sl.every(Boolean)){T.seals3=true;heal();sfx.solve();shake=.5;setTimeout(()=>say('All three seals burn white. The machine door begins to open on its own.',6),1200)}
    }})),
  {x:290,y:8,w:60,h:52,label:'Open the machine door',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#0c1214');rect(c,o.x+4,o.y+4,o.w-8,o.h-4,T.seals3?'#1d3a3a':'#2a3438');if(T.seals3){c.fillStyle='rgba(120,230,230,.35)';c.fillRect(o.x+4,o.y+4,o.w-8,o.h-4)}},
    act:()=>{if(!T.seals3){say('Three seals hold the door shut.',4);return}playCards(C2END,quitToTitle)}},
  D(32,170,22,60,'radio',550,210)]};
function hint7(){
  let t;
  if(T.wiped&&!T.jok)t='Your journal is gone. Mara\u2019s note under the loose board in this hall says where you hid it from yourself. Look in the dining room, then the library.';
  else if(!(T.hand1&&T.hand2))t='Mara\u2019s note says the clock gave its hands away: one where the stories sleep (the library), one where guests were never fed (the dining room). Look for glints. Ghosts wander these rooms now: use lockers and noise.';
  else if(!T.diary2)t='The desk in the library holds a diary with a date that should not exist. It says when the clock must stop.';
  else if(!T.hall)t='Set the clock in the dining room to the time in the diary: the hour, then the minutes.';
  else if(!T.ctrl)t='The new door in the entrance hall leads to the control room. The monitors do not say which experiment they hold until they play. Replay the four recordings in order: 07-A, then B, then C, then D. A wrong one resets the run, but the screens remember which letter each one is.';
  else if(!T.cells)t='The steel door in the control room leads to the cells. Each cell opens with the timestamp of one recording, without the colon. Your journal lists them.';
  else if(!T.tuned)t='A cell wall mentions a frequency. Tune the radio in the Listening Room to it, without the decimal point.';
  else if(!T.seals3)t='Touch the three seals in the Threshold. Each one needs something you have already uncovered: the four of you, her voice, the observer. Then open the machine door.';
  else if(!T.talk)t='Face the machine.';
  else if(!T.mara)t='Speak to Mara in her glass cylinder.';
  else if(!T.placed)t='Four slots shaped like name tags wait at the base of the machine. You took a tag from each cell.';
  else t='Face the machine. It has nothing left to offer you. Then go down, and end it.';
  say('Hint: '+t,8);
}
/* ===== Cycle 02: the second confrontation ===== */
const MACHINE_CARDS=[
  ['THE MACHINE','You said yes. I remember.',null,45],
  ['THE MACHINE','You were given four choices. You believed one of them would free you.',null,40],
  ['THE MACHINE','How many times must we repeat this experiment before you understand?',null,40],
  ['THE MACHINE','You were never the one choosing.',null,70],
  ['THE MACHINE','Look at her. She has been choosing for you the whole time.',null,45]];
const MARA_CARDS=[
  ['MARA, BEHIND THE GLASS','I remember you. Every one of you.',null,50],
  ['MARA','I did not know how to keep a friend. So I made one. And when he left, I made another.',null,40],
  ['MARA','I told them to say yes because yes was the only answer that stayed.',null,40],
  ['MARA','I am so tired of choosing for you. Please. Choose for yourself.',null,50]];
const YES_CARDS=[['YOU SAY YES','The machine hums. Mara smiles, relieved. The hall resets.',null,45],['CYCLE 03','You have done this before.',null,70]];
const NO_CARDS=[['YOU SAY NO','Mara cannot keep the ones who say no. The lights go out, one by one.',null,45],['TRY AGAIN','Nothing you remember is yours. Nothing you choose is final.',null,50]];
const TOGETHER_CARDS=[
  ['WE CHOOSE','Four coats. Four name tags. Four copies of you, standing behind you in the dark.',null,40],
  ['07-A, 07-B, 07-C, 07-D','"I carried her out." "I broke it." "I said yes." "I remembered."',null,40],
  ['ALL OF YOU','Not yes. Not no. Together: we choose to leave, and to take her with us.',null,45],
  ['THE MACHINE','Impossible. The subject cannot choose.',null,70]];
const backToPlay=()=>{mode='play'};
function openFinal5(){
  let ch=$('final5');
  if(!ch){
    ch=document.createElement('div');ch.className='screen';ch.id='final5';
    ch.innerHTML='<div class="card" style="text-align:center"><h2>The Last Choice</h2><p style="color:var(--muted)">The machine waits. Mara waits. Behind you, in the dark, so do the others.</p><div class="row" style="flex-direction:column;align-items:stretch"></div></div>';
    [['yes','Say yes, again'],['no','Say no'],['together','We choose together']].forEach(([k,l])=>{
      const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=l;
      b.onclick=()=>{closeModal();
        if(k==='yes')playCards(YES_CARDS,quitToTitle);
        else if(k==='no')playCards(NO_CARDS,quitToTitle);
        else{markEnding('together');playCards(TOGETHER_CARDS,()=>startEnding('together'))}};
      ch.querySelector('.row').appendChild(b)});
    $('view').appendChild(ch);
  }
  ch.querySelector('.row').children[2].hidden=!T.placed;
  openModal('final5',c=>{if(c==='Escape')closeModal()});
}
const mach=ROOMS.machine.objs.find(o=>o.label==='Face the machine');
ROOMS.heart2={name:'The Heart, Again',paint:paintMach,lights:()=>[{x:320,y:110,r:240,a:.65,col:'60,200,200'},{x:110,y:150,r:90,a:.6,col:'200,220,255'}],objs:[
  {...mach,act:()=>{
    if(!T.talk){playCards(MACHINE_CARDS,()=>{mode='play';T.talk=true;say('Her cylinder glows. She is watching you.',5)});return}
    if(!T.mara){say('Mara is waiting. Go to her.',4);return}
    openFinal5();
  }},
  {x:80,y:90,w:60,h:90,solid:true,label:'Speak to Mara',
    draw:(c,o)=>{c.fillStyle='rgba(160,210,230,.25)';c.fillRect(o.x,o.y,o.w,o.h);c.strokeStyle='#8ab0c0';c.lineWidth=2;c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2);c.fillStyle='rgba(235,235,245,.85)';c.beginPath();c.arc(o.x+30,o.y+32,10,0,6.3);c.fill();c.fillRect(o.x+19,o.y+43,22,34);rect(c,o.x-4,o.y+o.h,o.w+8,8,'#3a4448')},
    act:()=>{
      if(!T.talk){say('Mara looks at you through the glass. Her lips move. You cannot hear her yet.',5);return}
      if(T.mara){say('Mara watches you, and waits for you to choose.',4);return}
      playCards(maraDeck(),()=>{mode='play';T.mara=true;say('At the base of the machine, four slots glow. Each is shaped like a name tag.',6)});
    }},
  {x:280,y:230,w:80,h:40,solid:true,label:'Place the name tags',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a3236');rect(c,o.x,o.y,o.w,5,'#4a5458');for(let i=0;i<4;i++)rect(c,o.x+6+i*18,o.y+14,14,18,(T.placed?'#5fd35f':(T.tags||0)>i?'#4a6a70':'#10181a'))},
    act:()=>{
      if(T.placed){say('The four tags glow in their slots. SUBJECT 07-A, B, C, D.',4);return}
      if((T.tags||0)<4){say('Four slots, each shaped like a name tag. You are carrying '+(T.tags||0)+'. The cells hold the rest.',5);return}
      T.placed=true;heal();sfx.solve();shake=.5;say('One by one you press the four name tags into the slots. 07-A. 07-B. 07-C. 07-D. The machine falls silent, as if listening.',8);
    }},
  D(296,336,48,16,'thresh',320,200)]};
{const md=ROOMS.thresh.objs.find(o=>o.label==='Open the machine door');
 md.act=()=>{if(!T.seals3){say('Three seals hold the door shut.',4);return}changeRoom('heart2',320,310);say('The machine is awake. It has been waiting for you.',5)}}
/* hiding places and distractions for the ghosts that are back in the library and dining room */
ROOMS.library2.objs.push(lockerO(44,250),lureO(500,110,'Ring the desk bell','A bell rings from the far corner. The thing drifts toward the sound.'));
ROOMS.dining2.objs.push(lockerO(44,240),lureO(520,260,'Knock over the tea set','Porcelain shatters across the floor. The thing glides toward the noise.'));
function startCycle2(wiped){wiped=wiped===true;
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  if(wiped){JB=notes.length?notes.slice():(JB||[]);try{localStorage.setItem('hmJB',JSON.stringify(JB))}catch(e){}}
  let nn=wiped?[]:notes;try{const d=JSON.parse(localStorage.getItem('hmCP'));if(!wiped&&d&&Array.isArray(d.n)&&!nn.length)nn=d.n}catch(e){}
  reset();notes=nn;chapter=7;T={wiped,jok:!wiped};saveGame(7,{w:wiped,jb:JB||[]});mode='play';initAudio();roomId='foyer2';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;hearts=3;updateHUD();
  say(wiped?'You are back in the entrance hall. Your journal is gone, and your head feels strangely empty, like a room someone has cleared. Something here must remember for you.':'You are back in the entrance hall. The portraits are still there. The library, the dining room. But something is different.',9);
}
/* ===== Side quest: The Unfinished Seance (Stage 4, secret room) ===== */
const SQ_COL=['#c0392b','#ebe6d8','#4a7ad0','#2f8a4a','#222'],SQ_NAME=['red','white','blue','green','black'];
const SQ_SOL=[2,0,4,1,3],SQ_SEQ=[3,0,4,1],SQ_LAST=2;
const SQ_POS=[[310,160],[372,190],[352,246],[268,246],[248,190]];
const SQ_TEXT='The last flame does not go out. It burns white, and leans toward you.\n\nIn the smoke, three words:\n\n"There are still six of us."\n\nFive chairs. Five holders. And a sixth chair has appeared by the door, with a coat over its back. Your coat. A sixth portrait hangs among the Vanes, with your face. You were never a guest at this table.\n\nThe smoke draws a symbol on the wall: an open eye inside a ring of six dots. It stays burned into your mind. Somewhere in the manor, hidden writing will answer to it.';
function sqStartDemo(delay){
  const TT=T;T.sqp=1;T.fl=[1,1,1,1,1];T.sin=[];
  setTimeout(()=>{if(T!==TT)return;say('The flames catch by themselves. One by one, they begin to go out. Watch.',5);
    SQ_SEQ.forEach((h,i)=>setTimeout(()=>{if(T!==TT)return;T.fl[h]=0;sfx.light()},1800+i*1100));
    setTimeout(()=>{if(T!==TT)return;T.sqp=2;say('Silence. Four candles are dark, and one still burns. Touch the holders in the order they went out.',6)},1800+SQ_SEQ.length*1100+400)},delay||0);
}
function sqHolder(i){
  if(T.sqp===3){say('The holders are still. The last flame watches you.',3);return}
  if(T.sqp===1){say('Watch.',2);return}
  if(T.sqp===2){
    if(i===SQ_LAST){say('You pinch the wick. It does not go out. The flame only leans toward you.',4);return}
    const q=T.sin=T.sin||[];q.push(i);sfx.light();T.fl[i]=1;const TT=T;setTimeout(()=>{if(T===TT&&T.sqp===2)T.fl[i]=0},350);
    if(q[q.length-1]!==SQ_SEQ[q.length-1]){sfx.bad();say('The flames flare back to life. Not that order. Watch again.',4);sqStartDemo(1200);return}
    if(q.length===SQ_SEQ.length){
      T.sqp=3;T.sixth=true;heal();sfx.scare();lightsOut=.5;say('"There are still six of us."',8);
      setTimeout(()=>{addNote('Seance symbol',SQ_TEXT);showNote('The Unfinished Seance',SQ_TEXT)},1600);
    }
    return;
  }
  const cs=T.cs=T.cs||[0,0,0,0,0];cs[i]=(cs[i]+1)%6;sfx.light();
  say(cs[i]?'You set a '+SQ_NAME[cs[i]-1]+' candle in the holder.':'You take the candle out. The holder is empty.',2);
  if(cs.every((v,k)=>v===SQ_SOL[k]+1)){T.sqp=1;sfx.solve();say('The five candles stand in the shape of the diagram. The room goes cold.',4);sqStartDemo(1800)}
}
const sqHolderObj=i=>({x:SQ_POS[i][0],y:SQ_POS[i][1],w:20,h:26,solid:true,label:'Touch the candle holder',
  draw:(c,o)=>{
    rect(c,o.x+4,o.y+18,12,8,'#4a4a50');rect(c,o.x+8,o.y+12,4,8,'#5a5a60');
    const st=(T.cs||[])[i]||0;
    if(st){rect(c,o.x+6,o.y+2,8,12,SQ_COL[st-1]);if((T.fl||[])[i]){const big=T.sqp===3&&i===SQ_LAST;c.fillStyle=big?'rgba(235,245,255,.95)':'rgba(255,170,60,.95)';c.beginPath();c.ellipse(o.x+10,o.y-2,big?3.4:2.4,big?7:4.6,0,0,6.3);c.fill()}}
  },
  act:()=>sqHolder(i)});
ROOMS.seance={name:'The Seance Room',paint:paintX(0,1),lights:()=>{const L=[{x:320,y:210,r:130,a:.55}];(T.fl||[]).forEach((f,i)=>{if(f)L.push({x:SQ_POS[i][0]+10,y:SQ_POS[i][1],r:60,a:.8})});return L},objs:[
  {x:260,y:190,w:120,h:56,draw:c=>{c.fillStyle='#3a2a22';c.beginPath();c.ellipse(320,218,62,34,0,0,6.3);c.fill();c.strokeStyle='#6a4a30';c.lineWidth=2;c.stroke();c.fillStyle='#2a1c16';c.beginPath();c.ellipse(320,218,44,22,0,0,6.3);c.fill()}},
  ...[[320,138],[392,180],[366,262],[274,262],[248,180]].map(([x,y])=>({x:x-12,y:y-10,w:24,h:20,draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a2a22');rect(c,o.x+3,o.y+3,o.w-6,o.h-6,'#5a3a30')}})),
  {x:290,y:290,w:30,h:26,when:()=>T.sixth,draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a2a22');rect(c,o.x+3,o.y+3,o.w-6,o.h-6,'#4a3b5c')}},
  {x:240,y:8,w:160,h:52,label:'Study the ritual diagram',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8cdb0');const cx=o.x+o.w/2,cy=o.y+27,r=19,pts=[-90,-18,54,126,198].map(a=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)]);c.strokeStyle='#5a4a30';c.lineWidth=1.2;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.stroke();pts.forEach((p,i)=>{c.fillStyle=SQ_COL[SQ_SOL[i]];c.beginPath();c.arc(p[0],p[1],4.5,0,6.3);c.fill();c.strokeStyle='#222';c.lineWidth=.8;c.stroke()})},
    act:()=>say('A pentagon drawn in ash. Each point is marked with a colored candle. The top point is the holder nearest the wall; the rest follow clockwise.',7)},
  ...[0,1,2,3,4].map(sqHolderObj),
  D(586,170,22,60,'nursery',70,210)]};
/* secret entrance in the nursery's west wall */
{const nl=ROOMS.nursery.lights;ROOMS.nursery.lights=()=>[...nl(),...(T.sec?[]:[{x:40,y:200,r:70,a:.35}])];
 ROOMS.nursery.objs.push(
  {x:36,y:176,w:18,h:48,when:()=>!T.sec,label:'Feel the draught',draw:c=>{c.strokeStyle='rgba(220,210,230,.5)';c.lineWidth=1;c.beginPath();c.moveTo(34,176);c.lineTo(40,200);c.lineTo(34,224);c.stroke()},
    act:()=>{T.sec=true;sfx.door();say('Cold air seeps through the wallpaper. It peels away like a scab, and behind it is a narrow door.',6)}},
  {...D(32,170,22,60,'seance',550,210,()=>!T.sec,'There is only wall here.'),draw:c=>{if(T.sec)doorLR(c,0,'#3a2a3a')}})}
/* the symbol answers: hidden writing in other rooms */
const hw=(id,x,y,w,h,text)=>({x,y,w,h,draw:(c,o)=>{
  if(!hasNote('Seance symbol'))return;
  const d=Math.hypot(player.x-(o.x+o.w/2),(player.y-12)-(o.y+o.h/2)),a=clamp((120-d)/70,0,1),key='Hidden writing: '+id;
  if(a>.7&&!hasNote(key)){addNote(key,text);say('Faint writing glows in the dark: "'+text+'"',6)}
  if(a<=0)return;
  c.fillStyle='rgba(150,235,200,'+(a*.9).toFixed(2)+')';c.font='italic bold 11px Georgia';c.textAlign='center';
  let line='',ly=o.y+(o.h<30?10:14);
  text.split(' ').forEach(wd=>{if(c.measureText(line+wd).width>o.w-8){c.fillText(line,o.x+o.w/2,ly);ly+=14;line=''}line+=wd+' '});
  c.fillText(line,o.x+o.w/2,ly)}});
ROOMS.hallR.objs.push(hw('hall',120,6,140,50,'Five frames hung in the gallery. A sixth was always waiting for you.'));
ROOMS.foyer2.objs.push(hw('foyer',250,356,140,26,'Six chairs. Count yourself.'));
ROOMS.library2.objs.push(hw('library',250,356,140,26,'The last page was about you.'));
ROOMS.dining2.objs.push(hw('dining',250,356,140,26,'The table was set for six.'));
/* ===== Side quest: The Letter You Never Sent (Stage 5, readable only in the mirror world) ===== */
const LP=[
  'Dear Mara,\n\nI keep starting this and stopping. I think I know now what I am.',
  'You called me your friend. I believed every memory you gave me: the garden, the swing, the afternoon it rained and we laughed until we were sick.',
  'But I remember the swing from the wrong side. As if I was watching you from the window, not sitting beside you.',
  'Whatever I am, I came when you called. I would have stayed. I am sorry I never learned how to tell you.\n\nYours, whoever I am.'];
const LETTER=LP.join('\n\n');
const LETTER_CARD=['MARA','You wrote me a letter. You never sent it. I found a piece of it in every version of you. It says: "I would have stayed."',null,45];
const maraDeck=()=>hasNote('The letter you never sent')?[...MARA_CARDS.slice(0,3),LETTER_CARD,MARA_CARDS[3]]:MARA_CARDS;
function takeLP(i){
  const lp=T.lp=T.lp||[false,false,false,false];
  lp[i]=true;sfx.pick();addNote('Letter piece '+(i+1),LP[i]);updateHUD();
  if(lp.every(Boolean)){T.lpDone=true;heal();sfx.solve();addNote('The letter you never sent',LETTER);showNote('The letter you never sent',LETTER)}
  else showNote('Letter piece '+(i+1)+' of 4',LP[i]);
}
const lpObj=(i,x,y,mirror)=>({x,y,w:30,h:18,when:()=>!(T.lp||[])[i],label:mirror?'Read the letter piece':'Look at the paper',
  draw:(c,o)=>{rect(c,o.x,o.y+4,o.w,10,'#d9ccab');c.strokeStyle=mirror?'rgba(60,50,40,.75)':'rgba(60,50,40,.22)';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(o.x+3,o.y+7+k*3);c.lineTo(o.x+o.w-3-k*4,o.y+7+k*3);c.stroke()}const g=.3+.3*Math.sin(time*3+o.x);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+o.w-4,o.y+4,2+g,0,6.3);c.fill()},
  act:()=>{if(mirror)takeLP(i);else say('The page is covered in faint, reversed writing, as if it was meant to be read in a mirror. You cannot make it out.',6)}});
[[240,330],[560,290],[60,320]].forEach(([x,y],i)=>{ROOMS.hallR.objs.push(lpObj(i,x,y,false));ROOMS.hallM.objs.push(lpObj(i,x,y,true))});
ROOMS.study.objs.push(lpObj(3,420,290,true));
/* ===== Side quest: The Hide-and-Seek Dolls (Stage 4, the Playroom) ===== */
const DOLL=[
  'A cloth doll with button eyes, found under the bed. A paper tag on its wrist, in a child\u2019s writing:\n\n"Round 1. Under the bed. My friend looked everywhere and never found me. So I told her where I was."',
  'A porcelain doll in a faded dress, found in the wardrobe. Its tag:\n\n"Round 2. In the wardrobe. She counted to twenty out loud. I counted her answers in my head."',
  'A knitted doll with one ear, found behind the curtain. Its tag:\n\n"Round 3. Behind the curtain. I could see her shoes. I knew they were not there."',
  'A wooden doll with a chipped nose, found in the toy box. Its tag:\n\n"Round 4. In the toy box. I stayed until it was dark. She did not come. I said she had won."',
  'A tiny doll in a red coat, found under the little table. Its tag:\n\n"Round 5. Under the table. This time I hid the best, and I let her find me. I pretended her voice was warm."'];
const GAME='Five dolls, five rounds of hide-and-seek. A lonely girl, and a friend who was never there. Each time she hid as well as she could, and each time she let the friend find her. Each time, the friend won.\n\nOn the back of the last doll\u2019s tag, in pencil:\n\n"When I make a real friend, I will hide where he cannot find me, so that he has to come looking. Tell him I was easy to find."';
const GAME_CARD=['MEMORY RESTORED // THE GAME','She hid five dolls around the house and played seeker with a friend who was not there. When she found them all, she said the friend had won. She always let you win.',null,38];
const rememberDeck=()=>hasNote('The game of hide-and-seek')?[REMEMBER_CARDS[0],GAME_CARD,...REMEMBER_CARDS.slice(1)]:REMEMBER_CARDS;
function dollAct(i){
  const d=T.dolls=T.dolls||[0,0,0,0,0];
  if(d[i]){
    if(T.thud&&!T.sixth){
      if(i===1&&!T.drawing){T.drawing=true;addNote('The drawing',DRAW);showNote('The drawing',DRAW);return}
      say(EMPTYSPOT[i],4);return}
    say('The hiding place is empty now. Its doll sits on the shelf.',3);return}
  d[i]=1;sfx.pick();addNote('Doll '+(i+1)+' of 5',DOLL[i]);updateHUD();
  if(d.every(Boolean)){T.dollsDone=true;heal();sfx.solve();addNote('The game of hide-and-seek',GAME);showNote('The game of hide-and-seek',GAME,afterFifth)}
  else showNote('Doll '+(i+1)+' of 5',DOLL[i]);
}
const paintPlay=c=>{paintBase(c,{floor:'#4a3a3a',floor2:'#523f40',wall:'#5a4a5f',wall2:'#443847',trim:'#33283a'});c.fillStyle='rgba(255,220,240,.07)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);rect(c,230,170,180,110,'#3a2a44');c.strokeStyle='#8a6a8a';c.strokeRect(238.5,178.5,163,93);doorTop(c,'#6a4a5a')};
ROOMS.playroom={name:'The Playroom',paint:paintPlay,lights:()=>[{x:320,y:200,r:210,a:.6}],objs:[
  {x:200,y:8,w:90,h:48,label:'Read the paper sign',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#efe6d4');c.fillStyle='#b04a3a';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('HIDE AND SEEK',o.x+45,o.y+20);c.font='9px Georgia';c.fillText('five of us are hiding',o.x+45,o.y+34)},
    act:()=>say('A paper sign in crayon: "HIDE AND SEEK. Five of us are hiding. Come and find us." Underneath, smaller: "Look where a small girl would wait."',8)},
  {x:80,y:70,w:100,h:50,solid:true,label:'Look under the bed',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,o.h-14,'#6a4a5a');rect(c,o.x+4,o.y+4,o.w-8,18,'#d8c8d8');rect(c,o.x+6,o.y+6,28,12,'#efe6ef');rect(c,o.x,o.y+o.h-6,o.w,6,'#2a1a24')},act:()=>dollAct(0)},
  {x:230,y:64,w:70,h:50,solid:true,label:'Open the wardrobe',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a4a30');rect(c,o.x+4,o.y+4,30,o.h-8,'#5a3a24');rect(c,o.x+36,o.y+4,30,o.h-8,'#5a3a24');rect(c,o.x+30,o.y+22,3,6,'#c9a24a');rect(c,o.x+37,o.y+22,3,6,'#c9a24a')},act:()=>dollAct(1)},
  {x:440,y:8,w:80,h:52,label:'Look behind the curtain',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#1a2434');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#0b1424');rect(c,o.x,o.y,22,o.h,'#8a4a5a');rect(c,o.x+o.w-22,o.y,22,o.h,'#8a4a5a')},act:()=>dollAct(2)},
  {x:480,y:290,w:70,h:40,solid:true,label:'Open the toy box',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a6a8a');rect(c,o.x,o.y,o.w,8,'#5a7a9a');rect(c,o.x+30,o.y+14,10,8,'#c9a24a')},act:()=>dollAct(3)},
  {x:100,y:250,w:80,h:40,solid:true,label:'Look under the little table',draw:(c,o)=>{rect(c,o.x,o.y,o.w,10,'#8a6a4a');rect(c,o.x+6,o.y+10,6,28,'#6a4a30');rect(c,o.x+o.w-12,o.y+10,6,28,'#6a4a30');rect(c,o.x+10,o.y+2,60,6,'#d8d0c0')},act:()=>dollAct(4)},
  {x:330,y:8,w:90,h:48,label:'Look at the shelf',draw:(c,o)=>{rect(c,o.x,o.y+30,o.w,6,'#6a4a30');const d=T.dolls||[];for(let i=0;i<5;i++){if(d[i]){c.fillStyle=['#d8c8a0','#e8dcd0','#c0b0a0','#a08060','#c03a3a'][i];c.beginPath();c.arc(o.x+10+i*17,o.y+20,5,0,6.3);c.fill();c.fillRect(o.x+6+i*17,o.y+24,8,6)}}},
    act:()=>say('A shelf with five small gaps. '+((T.dolls||[]).filter(Boolean).length)+' of 5 dolls sit in them.',4)},
  D(292,64,56,20,'nursery',320,310)]};
ROOMS.nursery.objs.push({...D(296,336,48,16,'playroom',320,110),draw:c=>doorBottom(c,'#6a4a5a',false)});
/* ===== Hide and Seek, Round 6: the sixth player ===== */
const EMPTYSPOT=['Nothing under the bed but dust, and the feeling of being counted.','Empty. The wardrobe door creaks, as if it expected someone else.','Only curtain and cold glass. Not here.','Just toys. Something is still missing.','Nothing under the table. Someone has been here recently.'];
const DRAW='Behind the wardrobe, a child\u2019s drawing: six children holding hands. Five have their names written underneath. The sixth has no face.\n\nUnder it, in crayon:\n\n"Why are you looking for yourself?"';
const ROUND6='Hide and Seek, Round 6.\n\nFive dolls on the shelf. A sixth space, empty.\n\n"There you are."\n"Found you."\n\nThe sixth player was never a doll.';
function thud(){noise(.45,.7,260);tone(48,.9,'sine',.7,-18);tone(90,.4,'triangle',.4,-40)}
function afterFifth(){
  const TT=T;say('Five dolls found.',2.4);
  setTimeout(()=>{if(T!==TT)return;thud();shake=.8;T.thud=true;T.thudAt=time;say('"That\u2019s five."',2.6);
    setTimeout(()=>{if(T!==TT)return;say('"But we were six."',4.5);T.obj='Find the sixth player';updateHUD()},2800)},2400);
}
function sixthScare(){
  const TT=T;T.sixth=true;T.obj=null;updateHUD();say('"There you are."',3);
  setTimeout(()=>{if(T!==TT)return;thud();sfx.door();shake=1;lightsOut=3.6;T.doorShut=true},1300);
  setTimeout(()=>{if(T!==TT)return;speak(V('audio/child.mp3',1,1.9,0,100,[["Found you.",.9]]));say('"Found you."',3)},2900);
  setTimeout(()=>{if(T!==TT)return;T.doorShut=false;addNote('Round 6',ROUND6);say('The lights return. The door is open. The five dolls sit exactly where they were. On the shelf there is now a sixth space, and it is empty.',8)},5000);
}
ROOMS.playroom.objs.push({x:540,y:100,w:44,h:76,solid:true,label:'Look in the mirror',
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a7a5a');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#1c2c32');const rx=o.x+o.w/2,ry=o.y+o.h-10;c.globalAlpha=.8;rect(c,rx-7,ry-26,14,18,'#4a3b5c');c.fillStyle='#d6b79c';c.beginPath();c.arc(rx,ry-32,6,0,6.3);c.fill();c.globalAlpha=1},
  act:()=>{
    if(T.sixth){say('Your reflection looks back at you, a moment too late.',4);return}
    if(!T.thud){say('A tall mirror. Your reflection looks tired.',4);return}
    if(!(T.drawing||time-T.thudAt>40)){say('Your reflection looks back at you, a moment too late. Not here, you tell yourself. Keep looking.',5);return}
    sixthScare();
  }});
{const pd=ROOMS.playroom.objs.find(o=>o.door);pd.lock=()=>T.doorShut;pd.lockMsg='The door has slammed shut.'}
{const sh=ROOMS.playroom.objs.find(o=>o.label==='Look at the shelf');
 sh.draw=(c,o)=>{rect(c,o.x,o.y+30,o.w,6,'#6a4a30');const d=T.dolls||[];for(let i=0;i<5;i++){if(d[i]){c.fillStyle=['#d8c8a0','#e8dcd0','#c0b0a0','#a08060','#c03a3a'][i];c.beginPath();c.arc(o.x+10+i*14,o.y+20,4.5,0,6.3);c.fill();c.fillRect(o.x+6+i*14,o.y+23,8,7)}}if(T.sixth){c.strokeStyle='rgba(235,225,240,.55)';c.lineWidth=1;c.strokeRect(o.x+74,o.y+16,10,14)}};
 sh.act=()=>say(T.sixth?'A shelf with six small gaps. Five dolls sit in them. The sixth space is empty.':'A shelf with five small gaps. '+((T.dolls||[]).filter(Boolean).length)+' of 5 dolls sit in them.',5)}
/* a faint glow marks the Playroom door until the player has been inside */
{const nl2=ROOMS.nursery.lights;ROOMS.nursery.lights=()=>[...nl2(),...(T.playIn?[]:[{x:320,y:350,r:70,a:.35}])]}
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
/* ===== cable-patching mini-game for the Dead Switchboard ===== */
const WG={el:null,cv:null,cx:null,raf:0,ok:null,held:null,px:0,py:0,sx:0,sy:0,moved:false,drag:false,sparks:[],shk:0,done:false};
const WGW=600,WGH=340,WGL=96,WGR=500,wgY=i=>70+i*70;
const WSYM=[0,1,2,3]; /* red triangle, blue cross, green circle, yellow square */
function wgSym(c,k,x,y,s,col,lw){c.strokeStyle=col;c.lineWidth=lw||2.2;c.lineJoin='round';c.beginPath();
  if(k===0){c.moveTo(x,y-s);c.lineTo(x+s*1.05,y+s*.8);c.lineTo(x-s*1.05,y+s*.8);c.closePath()}
  else if(k===1){c.moveTo(x-s*.8,y-s*.8);c.lineTo(x+s*.8,y+s*.8);c.moveTo(x+s*.8,y-s*.8);c.lineTo(x-s*.8,y+s*.8)}
  else if(k===2){c.arc(x,y,s*.9,0,6.3)}
  else c.rect(x-s*.8,y-s*.8,s*1.6,s*1.6);
  c.stroke()}
function wgShade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  const m=v=>Math.max(0,Math.min(255,Math.round(f<0?v*(1+f):v+(255-v)*f)));return 'rgb('+m(r)+','+m(g)+','+m(b)+')'}
/* a sagging cable from the left wall to (x,y) */
function wgCable(c,k,y0,x1,y1){
  const col=CAB[k][3],x0=-10,dx=x1-x0,sag=26+Math.abs(dx)*.12+Math.abs(y1-y0)*.1;
  const path=()=>{c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(x0+dx*.35,y0+sag,x1-dx*.3,y1+sag*.7,x1,y1)};
  c.lineCap='round';
  path();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=15;c.stroke();
  path();c.strokeStyle=wgShade(col,-.45);c.lineWidth=12;c.stroke();
  path();c.strokeStyle=col;c.lineWidth=8;c.stroke();
  c.save();c.translate(0,-2.5);path();c.strokeStyle=wgShade(col,.45);c.globalAlpha=.55;c.lineWidth=2.5;c.stroke();c.restore();
}
/* plug head: coloured sleeve with symbol, copper tip pointing right */
function wgPlug(c,k,x,y,lift){
  const col=CAB[k][3];c.save();c.translate(x,y);if(lift){c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=14;c.shadowOffsetY=6}
  c.fillStyle=wgShade(col,-.35);c.beginPath();c.roundRect(-34,-13,36,26,6);c.fill();c.shadowColor='transparent';
  c.fillStyle=col;c.beginPath();c.roundRect(-32,-11,32,20,5);c.fill();
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-30,-9,28,5);
  wgSym(c,WSYM[k],-16,0,5.5,'rgba(20,14,10,.85)',2.4);
  /* brass collar + copper prong */
  c.fillStyle='#b48a3e';c.fillRect(1,-8,6,16);c.fillStyle='#e2bb6a';c.fillRect(1,-8,6,3);
  const g=c.createLinearGradient(0,-4,0,4);g.addColorStop(0,'#f0a56a');g.addColorStop(.5,'#c4672e');g.addColorStop(1,'#7a3a18');
  c.fillStyle=g;c.beginPath();c.moveTo(7,-4);c.lineTo(22,-4);c.quadraticCurveTo(27,0,22,4);c.lineTo(7,4);c.fill();
  c.strokeStyle='rgba(60,25,8,.6)';c.lineWidth=1;for(let i=11;i<20;i+=3){c.beginPath();c.moveTo(i,-4);c.lineTo(i,4);c.stroke()}
  c.restore();
}
function wgDraw(){
  const c=WG.cx,t=performance.now()/1000,wire=T.wire,ord=T.wireOrd;
  c.save();c.clearRect(0,0,WGW,WGH);
  if(WG.shk>0){c.translate((Math.random()-.5)*WG.shk*10,(Math.random()-.5)*WG.shk*10)}
  /* panel: dark wood frame, slate face */
  let g=c.createLinearGradient(0,0,0,WGH);g.addColorStop(0,'#2a1d16');g.addColorStop(1,'#140d0a');c.fillStyle=g;c.fillRect(0,0,WGW,WGH);
  g=c.createLinearGradient(0,0,WGW,WGH);g.addColorStop(0,'#1d2126');g.addColorStop(1,'#101317');c.fillStyle=g;c.fillRect(14,14,WGW-28,WGH-28);
  c.strokeStyle='#4a3626';c.lineWidth=2;c.strokeRect(14,14,WGW-28,WGH-28);
  for(const [x,y] of [[24,24],[WGW-24,24],[24,WGH-24],[WGW-24,WGH-24]]){c.fillStyle='#8a6a34';c.beginPath();c.arc(x,y,4,0,6.3);c.fill();c.fillStyle='#d9b36a';c.beginPath();c.arc(x-1,y-1,1.6,0,6.3);c.fill()}
  /* faint scratched lettering */
  c.fillStyle='rgba(229,194,121,.35)';c.font='bold 11px Georgia';c.textAlign='center';c.fillText('VANE ESTATE  ·  HOUSE EXCHANGE  No. 4',WGW/2,34);
  /* left rail where the loose cables hang */
  c.fillStyle='#0b0d10';c.fillRect(14,40,52,WGH-62);c.strokeStyle='#2c3138';c.strokeRect(14,40,52,WGH-62);
  /* right jack strip */
  c.fillStyle='#24201a';c.fillRect(WGR-34,44,108,WGH-70);c.strokeStyle='#5a4630';c.strokeRect(WGR-34,44,108,WGH-70);
  for(let j=0;j<4;j++){
    const y=wgY(j),k=ord[j],lit=wire[k]===j,fl=lit?1:Math.max(0,Math.sin(t*(2.1+j*.37)+j*1.9))**3*.8+.06*Math.random();
    /* enamel label with the socket's symbol */
    c.fillStyle='#d9cfb4';c.beginPath();c.roundRect(WGR+20,y-13,40,26,4);c.fill();
    wgSym(c,WSYM[k],WGR+31,y,6,'#2b2117',2.2);
    /* indicator lamp (flickers until wired) */
    const col=CAB[k][3];
    c.fillStyle='#0a0a0a';c.beginPath();c.arc(WGR+50,y,7,0,6.3);c.fill();
    c.save();c.globalAlpha=.25+.75*fl;c.fillStyle=col;c.shadowColor=col;c.shadowBlur=lit?22:16*fl;c.beginPath();c.arc(WGR+50,y,5.2,0,6.3);c.fill();c.restore();
    /* brass jack */
    g=c.createRadialGradient(WGR-2,y-3,2,WGR,y,15);g.addColorStop(0,'#f2d38a');g.addColorStop(.6,'#a77c34');g.addColorStop(1,'#4d3614');
    c.fillStyle=g;c.beginPath();c.arc(WGR,y,14,0,6.3);c.fill();
    c.fillStyle='#050505';c.beginPath();c.arc(WGR,y,6.5,0,6.3);c.fill();
    /* highlight socket under a held plug */
    if(WG.held!==null&&!lit&&Math.hypot(WG.px-WGR,WG.py-y)<34){c.strokeStyle='rgba(255,240,190,.8)';c.lineWidth=2;c.beginPath();c.arc(WGR,y,19,0,6.3);c.stroke()}
  }
  /* placed cables first, then resting plugs, then the one in hand on top */
  for(let k=0;k<4;k++)if(wire[k]!=null){const y=wgY(wire[k]);wgCable(c,k,wgY(k),WGR-30,y);wgPlug(c,k,WGR-22,y)}
  for(let k=0;k<4;k++)if(wire[k]==null&&WG.held!==k){const bob=Math.sin(t*1.6+k)*1.5;wgCable(c,k,wgY(k),WGL-6,wgY(k)+bob);wgPlug(c,k,WGL,wgY(k)+bob)}
  if(WG.held!==null){const k=WG.held;wgCable(c,k,wgY(k),WG.px-26,WG.py);wgPlug(c,k,WG.px-20,WG.py,true)}
  /* sparks */
  for(const s of WG.sparks){c.strokeStyle='rgba(255,'+(170+Math.random()*80|0)+',90,'+Math.min(1,s.l*2).toFixed(2)+')';c.lineWidth=1.6;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x-s.vx*.03,s.y-s.vy*.03);c.stroke()}
  if(WG.done){c.fillStyle='rgba(255,230,160,'+(.12+.08*Math.sin(t*20)).toFixed(2)+')';c.fillRect(0,0,WGW,WGH)}
  c.restore();
}
function wgLoop(){
  if(!modal||modal.id!=='wires'){WG.raf=0;WG.held=null;return}
  const dt=1/60;WG.shk=Math.max(0,WG.shk-dt*2.5);
  for(const s of WG.sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=500*dt;s.l-=dt}
  WG.sparks=WG.sparks.filter(s=>s.l>0);
  wgDraw();WG.raf=requestAnimationFrame(wgLoop);
}
function wgPos(e){const r=WG.cv.getBoundingClientRect();WG.px=(e.clientX-r.left)*WGW/r.width;WG.py=(e.clientY-r.top)*WGH/r.height}
function wgMsg(s){$('wOut').textContent=s}
function wgPick(k){if(WG.done||T.wire[k]!=null)return;WG.held=k;sfx.step();wgMsg('You lift the '+CAB[k][0]+' cable. Find the socket it belongs in.')}
function wgDrop(){
  const k=WG.held;if(k===null)return;
  let j=-1;for(let i=0;i<4;i++)if(Math.hypot(WG.px-WGR,WG.py-wgY(i))<34)j=i;
  if(j<0){WG.held=null;wgMsg('You let the '+CAB[k][0]+' cable fall back against the wall.');return}
  wgPlugInto(k,j);
}
function wgPlugInto(k,j){
  WG.held=null;
  if(T.wire.includes(j)){sfx.bad();wgMsg('Something is already plugged in there.');return}
  if(T.wireOrd[j]!==k){
    sfx.bad();sfx.light();WG.shk=1;
    for(let i=0;i<22;i++){const a=Math.random()*6.3,v=120+Math.random()*260;WG.sparks.push({x:WGR,y:wgY(j),vx:Math.cos(a)*v,vy:Math.sin(a)*v-120,l:.35+Math.random()*.4})}
    wgMsg('Wrong socket. It spits sparks and the '+CAB[k][0]+' cable jumps out of your hand.');return}
  T.wire[k]=j;sfx.pick();sfx.light();
  const n=T.wire.filter(v=>v!=null).length;
  if(n<4){wgMsg('Click. The '+CAB[k][0]+' lamp holds steady. '+n+' of 4.');return}
  WG.done=true;wgMsg('All four lamps burn steady. The switchboard groans awake.');
  setTimeout(()=>{const f=WG.ok;closeModal();if(f)setTimeout(f,200)},1300);
}
function openWires(ok){
  let el=$('wires');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='wires';
    el.innerHTML='<div class="card" style="max-width:680px;text-align:center;padding:clamp(12px,2.4vw,24px)"><h2 style="margin:0 0 .2em">The switchboard</h2><canvas id="wCv" style="display:block;width:100%;aspect-ratio:600/340;margin:8px 0;border-radius:10px;touch-action:none;cursor:grab"></canvas><div id="wOut" role="status" aria-live="polite" style="min-height:1.6em;font-family:var(--ui)"></div><p class="small" style="margin:.3em 0 .6em">Drag each cable to the socket with the same colour and symbol, or tap a cable and then a socket. Keys: 1\u20134 picks a cable, then 1\u20134 picks a socket.</p><div class="row"><button class="btn" id="wX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    const cv=WG.cv=el.querySelector('#wCv'),dpr=Math.min(2,window.devicePixelRatio||1);
    cv.width=WGW*dpr;cv.height=WGH*dpr;WG.cx=cv.getContext('2d');WG.cx.setTransform(dpr,0,0,dpr,0,0);
    el.querySelector('#wX').onclick=closeModal;
    cv.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;wgPos(e);
      if(WG.held!==null){wgDrop();return}
      for(let k=0;k<4;k++)if(T.wire[k]==null&&Math.hypot(WG.px-(WGL-8),WG.py-wgY(k))<30){
        wgPick(k);WG.drag=true;WG.moved=false;WG.sx=WG.px;WG.sy=WG.py;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';return}
    });
    cv.addEventListener('pointermove',e=>{wgPos(e);if(WG.drag&&Math.hypot(WG.px-WG.sx,WG.py-WG.sy)>10)WG.moved=true});
    const up=e=>{if(!WG.drag)return;WG.drag=false;cv.style.cursor='grab';wgPos(e);if(WG.moved)wgDrop()};
    cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',()=>{WG.drag=false;WG.held=null});
  }
  if(!T.wire)T.wire=[null,null,null,null];
  if(!T.wireOrd){const o=[0,1,2,3];do{for(let i=3;i>0;i--){const r=Math.random()*(i+1)|0;[o[i],o[r]]=[o[r],o[i]]}}while(o.some((v,i)=>v===i));T.wireOrd=o}
  WG.ok=ok;WG.held=null;WG.done=false;WG.sparks=[];WG.drag=false;
  const n=T.wire.filter(v=>v!=null).length;
  wgMsg(n?n+' of 4 cables are already in.':'Four dead sockets. Four loose cables. The lamps flicker, waiting.');
  openModal('wires',code=>{
    if(code==='Escape'){closeModal();return}
    const m=/^(?:Digit|Numpad)([1-4])$/.exec(code);if(!m)return;const i=+m[1]-1;
    if(WG.held===null){wgPick(i);WG.px=WGL+70;WG.py=wgY(i)-18}else wgPlugInto(WG.held,i);
  });
  if(!WG.raf)WG.raf=requestAnimationFrame(wgLoop);
}
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
  else{T={vis:{},parts:[],sp:[320,300]};saveGame(8)}
  chapter=8;mode='play';roomId='m0';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;hearts=3;invuln=0;updateHUD();
  say('The machine is not here. It is beneath the house, and the house has built a maze around the stairs. Ten rooms. Ten parts.',8);
}
function hint8(){
  const p=T.parts||[],n=p.filter(Boolean).length;let t;
  if(roomId==='base'||roomId==='mstairs')t='Use the workbench. Fit the four mechanism parts, then play Wren\u2019s whole lullaby backwards on the eight keys: ten notes, the last one first. The first four notes are the scraps you found in the nursery; the other six you found in the maze. Check your journal (J).';
  else if(n<10){const k=[0,1,2,3,4,5,6,7,8,9].find(j=>!p[j]);t='A part is still missing: '+MZP[k][0]+'. '+MZP[k][2]+' Chalk marks show the doors you have already used.'}
  else t='All ten parts are yours. A staircase has opened in the south-east of the maze, in the vault.';
  say('Hint: '+t,9);
}
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
/* ===== Restructured route: every path leads into Cycle 02; refusing the offer wipes your journal ===== */
let JB=null;
const FOOL_DESTROY=[
  ['YOU CHOOSE TO DESTROY IT','The machine hums, patient, almost amused.',null,45],
  ['THE MACHINE','You cannot destroy what you do not remember.',null,50],
  ['THE MACHINE','You fool. You were never the one choosing.',null,70],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,55],
  ['CYCLE 02','Your journal is gone.',null,60]];
const FOOL_RESCUE=[
  ['YOU CHOOSE TO RESCUE HER','Mara presses a hand against the glass.',null,45],
  ['THE MACHINE','You cannot rescue someone you have forgotten.',null,50],
  ['THE MACHINE','You fool. You were never the one choosing.',null,70],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,55],
  ['CYCLE 02','Your journal is gone.',null,60]];
const JOURNAL_CARDS=[
  ['YOUR JOURNAL','The pages come back one by one. Candles. A clock. A lullaby. A face you did not recognise at first.',null,45],
  ['YOUR JOURNAL','You remember. Not everything. But the shape of it.',null,55]];
const C2MAZE=[
  ['THE MACHINE','Then end me, if you can. I am not in this room. I am beneath the house, where the stairs go down.',null,40],
  ['THE MANOR','Ten rooms. Ten mechanisms. Find them, and the way down will open.',null,45]];
function restoreJournal(){
  const old=JB||[],cur=notes.slice();
  notes=[...old,...cur.filter(n=>!old.some(o=>o.title===n.title))];
  T.jok=true;updateHUD();sfx.solve();heal();
  playCards(JOURNAL_CARDS,()=>{mode='play';say('Your journal is whole again, in your own handwriting.',6)});
}
{const lb=ROOMS.foyer2.objs.find(o=>o.label==='Pry up the loose board');
 lb.act=()=>{T.mnote=true;sfx.pick();const tx=MARA2+(T.wiped&&!T.jok?'\n\nShe has added a line at the bottom, in a hurry: "You will ask where your journal is. You hid it from yourself, so the next you could not read it. The key is in the dining room, taped where the guests never sat. The drawer is in the library."':'');addNote('Mara\u2019s note',tx);showNote('Mara\u2019s note',tx)}}
ROOMS.dining2.objs.push({...glint(500,300,'Take the small key','jkey','You find a small brass key taped under the lip of the table.'),when:()=>T.wiped&&!T.jkey});
ROOMS.library2.objs.push({x:230,y:222,w:40,h:30,solid:true,label:'Search the little drawer',
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a24');rect(c,o.x,o.y,o.w,4,'#7a5a3a');rect(c,o.x+16,o.y+14,8,6,'#c9a24a')},
  act:()=>{
    if(!T.wiped||T.jok){say('A little drawer. Empty.',3);return}
    if(!T.jkey){say('Locked. The lock is tiny and brass. The key must be somewhere in this house.',5);return}
    restoreJournal();
  }});
{const md=ROOMS.thresh.objs.find(o=>o.label==='Open the machine door');
 md.act=()=>{
   if(!T.seals3){say('Three seals hold the door shut.',4);return}
   if(T.wiped&&!T.jok){say('You stand before the door with a mind full of holes. You cannot face the machine without your memories. Find your journal.',7);return}
   changeRoom('heart2',320,310);say('The machine is awake. It has been waiting for you.',5)}}
{const mc=ROOMS.heart2.objs.find(o=>o.label==='Face the machine');
 mc.act=()=>{
   if(!T.talk){playCards(MACHINE_CARDS,()=>{mode='play';T.talk=true;say('Her cylinder glows. She is watching you.',5)});return}
   if(!T.mara){say('Mara is waiting. Go to her.',4);return}
   if(!T.placed){say('The four slots at its base are empty. You have nothing to answer it with.',5);return}
   playCards(C2MAZE,startMaze);
 }}
/* ===== Cycle 02 control room: the recordings must be played in order A, B, C, D ===== */
{const mons=ROOMS.ctrl2.objs.filter(o=>o.label==='Replay the recording');
 mons.forEach((o,k)=>{
  const [t,h,txt]=MON[k],L=h.slice(-1);
  o.draw=(c,m)=>{
    rect(c,m.x,m.y,m.w,m.h,'#2a3236');rect(c,m.x+5,m.y+5,m.w-10,m.h-10,'#07100f');
    const on=T.ctrl||(T.ms2||[]).includes(k),sn=T.ctrl||(T.seen||[])[k];
    for(let i=0;i<7;i++){c.fillStyle=on?'rgba(90,230,160,.25)':'rgba(120,170,170,'+(.08+.1*Math.abs(Math.sin(time*7+i+k*2))).toFixed(2)+')';c.fillRect(m.x+7,m.y+8+i*5,m.w-14,2)}
    c.textAlign='center';c.fillStyle=on?'#8af0b0':'#6fbf8a';c.font='bold 11px "Courier New",monospace';c.fillText(t,m.x+m.w/2,m.y+m.h-9);
    if(sn){c.fillStyle='#ffe9a8';c.font='bold 22px Georgia';c.fillText(L,m.x+m.w/2,m.y+30)}};
  o.act=()=>{
    if(T.ctrl){say('The screens show a single word: SUBJECT.',3);return}
    (T.seen=T.seen||[])[k]=true;
    const q=T.ms2=T.ms2||[];
    if(q.includes(k)){say('That recording has already played in this run.',2);return}
    sfx.light();addNote('Recording '+h.slice(-4),h+' ['+t+']: '+txt);
    if(L!=='ABCD'[q.length]){T.ms2=[];sfx.bad();say('That was experiment 07-'+L+'. The recordings only play in order, starting with A. The screens reset, but they remember their letters.',7);return}
    q.push(k);say(h+' ['+t+']: '+txt,8);
    if(q.length===4){T.ctrl=true;heal();sfx.solve();shake=.5;addNote('The four experiments',EXPTXT);showNote('The four experiments',EXPTXT,()=>say('At the east end of the room, a steel door unlocks with a heavy clunk.',6))}
  };
 });
 ROOMS.ctrl2.objs.push({x:300,y:150,w:44,h:22,label:'Read the plate',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a6a2a');rect(c,o.x+3,o.y+3,o.w-6,o.h-6,'#c9a24a')},act:()=>say('A brass plate under the monitors: "EXPERIMENTS 07-A TO 07-D. REPLAY IN ORDER." The screens do not say which is which until they play.',8)})}
/* ===== The reveal: the cylinder cracks, Mara steps out with your face and coat ===== */
const MARA_REVEAL=[
  ['MARA','You came when I called.',null,50],
  ['MARA','I made you from the part of me that could leave.',null,45],
  ['MARA','I have only ever wanted to be found.',null,50]];
const CRK=[[320,190,280,100],[320,190,365,110],[320,190,275,260],[320,190,368,280],[320,190,320,95],[300,150,272,140],[340,230,368,215]];
let RV={t:0,ev:{},sh:[],flash:0};
function startReveal(){mode='reveal';RV={t:0,ev:{},sh:[],flash:0};$('msg').classList.remove('show');ghost.on=false}
function revealTick(dt){
  RV.t+=dt;const t=RV.t,ev=RV.ev,once=(k,at,f)=>{if(t>=at&&!ev[k]){ev[k]=1;f()}};
  once('hum',.2,()=>tone(55,3,'sine',.3));
  [3.2,4.1,4.9,5.6].forEach((a,i)=>once('c'+i,a,()=>{noise(.2,.25,3500);tone(900+i*140,.15,'square',.07,-300)}));
  once('shatter',6,()=>{noise(1,.6,6000);tone(1400,.6,'triangle',.2,-900);tone(70,1,'sine',.5,-30);RV.flash=1;for(let i=0;i<46;i++)RV.sh.push({x:320+(Math.random()-.5)*70,y:120+Math.random()*160,vx:(Math.random()-.5)*160,vy:-Math.random()*120,r:Math.random()*5+2})});
  [7.4,8.4,9.4].forEach((a,i)=>once('st'+i,a,()=>sfx.step()));
  RV.sh.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=380*dt;if(p.y>306){p.y=306;p.vy=0;p.vx*=.6}});
  if(RV.flash>0)RV.flash=Math.max(0,RV.flash-dt*1.6);
  if(t>12.5&&!ev.done){ev.done=1;playCards(MARA_REVEAL,handPrompt)}
}
function drawFig(x,y,dir){
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,10,4,0,0,6.3);ctx.fill();
  rect(ctx,x-6,y-8,5,8,'#1d1a26');rect(ctx,x+1,y-8,5,8,'#1d1a26');
  rect(ctx,x-8,y-24,16,17,'#4a3b5c');rect(ctx,x-8,y-24,16,4,'#6a5a80');
  ctx.fillStyle='#d6b79c';ctx.beginPath();ctx.arc(x,y-30,7,0,6.3);ctx.fill();
  ctx.fillStyle='#3a2418';ctx.beginPath();ctx.arc(x,y-32,7.2,Math.PI,0);ctx.fill();ctx.fillRect(x-7,y-32,3,10);ctx.fillRect(x+4,y-32,3,10);
  ctx.fillStyle='#111';if(dir==='left')ctx.fillRect(x-4,y-30,1.8,2);else ctx.fillRect(x+2,y-30,1.8,2);
}
function drawReveal(){
  const t=RV.t,g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071012');g.addColorStop(1,'#101a1e');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#0b1316';ctx.fillRect(0,300,W,84);
  const gl=ctx.createRadialGradient(320,190,10,320,190,230);gl.addColorStop(0,'rgba(60,200,200,'+(t<6?.30:.10)+')');gl.addColorStop(1,'rgba(60,200,200,0)');ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#2a3a40';ctx.fillRect(264,296,112,10);ctx.fillRect(264,82,112,10);
  if(t<6){
    ctx.fillStyle='rgba(150,205,225,.18)';ctx.fillRect(272,92,96,204);
    ctx.strokeStyle='rgba(190,230,245,.7)';ctx.lineWidth=2;ctx.strokeRect(272.5,92.5,95,203);
    ctx.fillStyle='rgba(235,235,245,.88)';ctx.beginPath();ctx.arc(320,196,10,0,6.3);ctx.fill();ctx.fillRect(309,207,22,50);
    for(let i=0;i<6;i++){ctx.fillStyle='rgba(200,235,245,.35)';ctx.beginPath();ctx.arc(284+i*14,290-((time*30+i*37)%190),2,0,6.3);ctx.fill()}
    const p=Math.max(0,Math.min(1,(t-3)/3));
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;
    CRK.forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1+(x2-x1)*p,y1+(y2-y1)*p);ctx.stroke()});
  }
  RV.sh.forEach(p=>{ctx.fillStyle='rgba(200,235,245,.7)';ctx.fillRect(p.x,p.y,p.r,p.r*.6)});
  drawFig(190,300,'right');
  if(t>=6.6){const mx=Math.max(240,320-(t-6.6)*22);drawFig(mx,300,'left')}
  ctx.textAlign='center';ctx.font='italic 17px Georgia,serif';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillStyle='#ebe3d3';
  if(t<3)ctx.fillText('The machine is unwinding.',W/2,48);
  else if(t<6)ctx.fillText('The glass begins to crack.',W/2,48);
  else if(t>=9)ctx.fillText('She is wearing your coat. She has your face.',W/2,48);
  ctx.shadowBlur=0;
  if(RV.flash>0){ctx.fillStyle='rgba(255,255,255,'+RV.flash+')';ctx.fillRect(0,0,W,H)}
}
function handPrompt(){
  let el=$('hand');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='hand';
    el.innerHTML='<div class="card" style="text-align:center"><h2>She holds out her hand</h2><p style="color:var(--muted)">She wears your coat. She has your face. She does not ask you to save her. She waits.</p><div class="row"><button class="btn primary" id="hBtn" type="button">Take her hand</button></div></div>';
    $('view').appendChild(el);el.querySelector('#hBtn').onclick=()=>{closeModal();chooseFinal()};
  }
  openModal('hand',c=>{if(c==='Enter'||c==='Space'||c==='KeyE'){closeModal();chooseFinal()}});
}
function trueDeck(){
  const d=[
    ['MEMORY RESTORED // ORIGIN','There was a girl named Mara, in a house with one window. The machine took her loneliness and split it in two.',null,38],
    ['MEMORY RESTORED // THE SPLIT','One half stayed behind the glass and kept the memories. The other half could walk. It woke up at a gate, wearing a coat, with a reason to go in.',null,38]];
  if(hasNote('The game of hide-and-seek'))d.push(['THE GAME','Five dolls, five rounds of hide-and-seek. She hid as well as she could, and let you find her every time. She always let you win.',null,38]);
  if(hasNote('The letter you never sent'))d.push(['THE LETTER','"Whatever I am, I came when you called. I would have stayed." You wrote it to yourself.',null,38]);
  if(hasNote('Seance symbol'))d.push(['THE SIXTH CHAIR','"There are still six of us." Five holders, five chairs, and one place laid for the guest who was always you.',null,38]);
  d.push(['MEMORY RESTORED // YOU','You were never her friend. You were the part of her that could leave. Every cycle, you came back for the rest of yourself.',null,38]);
  d.push(['THE FRONT DOOR','It was never locked from the outside. It only waited for both of you to walk through it. A small piece of you stays behind, on purpose, so that someone can come looking.',null,38]);
  return d;
}
function chooseFinal(){
  if(fragCount()>=5){markEnding('remember');playCards(trueDeck(),()=>startEnding('remember'))}
  else{markEnding('rescue');playCards([['YOU TAKE HER HAND','She is warm. She is real. She is also, somehow, you.',null,40],['BUT','You walk out into the morning. Her voice stays behind your eyes, and the manor goes with it.',null,40]],()=>startEnding('rescue'))}
}
/* three more fragments in Cycle 02, so one missed fragment does not close the true ending (any 5 of 8) */
[['foyer2',400,320,'Pry up the loose board','Fragment 6','Under the board, a tag in your handwriting and in hers, the same loops, the same slant: "The handwriting on every wall is yours. And hers."'],
 ['library2',400,320,'Check behind the book','Fragment 7','A birthday card with no name, dated the day you remember arriving: "Mara, you will not remember this. But I will."'],
 ['dining2',330,320,'Look under the plate','Fragment 8','A note under a plate: "On the radio there are two people speaking. They breathe at the same moment."']
].forEach(([r,x,y,l,title,t])=>ROOMS[r].objs.push({x,y,w:30,h:16,label:l,when:()=>!hasNote(title),
  draw:(c,o)=>{rect(c,o.x,o.y+6,o.w,6,'#3a2a1a');const g=.4+.4*Math.sin(time*4+x);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+15,o.y+8,3+g*2,0,6.3);c.fill()},
  act:()=>{sfx.pick();addNote(title,t);showNote(title,t)}}));
/* ===== A real rotary safe dial: spin it, right then left then right ===== */
const RD={th:0,step:0,dir:0,moved:0,lastTick:0,code:'000',ok:null,raf:0,drag:null,t0:0};
const rdVal=()=>(((Math.round(RD.th/36))%10)+10)%10;
const RDTXT=['Step 1 of 3: turn the dial RIGHT (clockwise) to the first number, then lock it in.','Step 2 of 3: now turn the dial LEFT (counterclockwise) to the second number.','Step 3 of 3: turn the dial RIGHT again to the third number.'];
function rdStatus(msg){$('rdS').textContent=msg||RDTXT[Math.min(RD.step,2)];$('rdP').textContent=[0,1,2].map(i=>i<RD.step?'\u25CF':'\u25CB').join('  ')}
function rdTurn(d){
  RD.th+=d;if(Math.abs(d)>.01)RD.dir=d>0?1:-1;RD.moved+=Math.abs(d);
  const v=Math.round(RD.th/36);if(v!==RD.lastTick){RD.lastTick=v;tone(1100,.03,'square',.05)}
}
function rdLock(){
  const need=[1,-1,1][RD.step],val=rdVal();
  if(RD.moved<34){rdStatus('Turn the dial first. It will not lock where it already is.');return}
  const fail=m=>{RD.step=0;RD.moved=0;sfx.bad();rdStatus(m)};
  if(RD.dir!==need){fail('The mechanism catches: you turned the wrong way. The tumblers fall back. Start again.');return}
  if(val!==+RD.code[RD.step]){fail('The dial grinds and nothing gives. The tumblers fall back. Start again.');return}
  RD.step++;RD.moved=0;sfx.light();
  if(RD.step>=3){rdStatus('Click. The handle turns.');sfx.solve();setTimeout(()=>{if(modal&&modal.id==='rotary'){closeModal();RD.ok()}},700)}
  else rdStatus();
}
function rdDraw(){
  const cv2=$('rdC'),c=cv2.getContext('2d'),cx=150,cy=150;
  c.clearRect(0,0,300,300);
  let g=c.createRadialGradient(cx-30,cy-30,20,cx,cy,142);g.addColorStop(0,'#e5c279');g.addColorStop(.7,'#9a7430');g.addColorStop(1,'#5a4318');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,142,0,6.3);c.fill();
  c.save();c.translate(cx,cy);c.rotate(RD.th*Math.PI/180);
  for(let i=0;i<60;i++){c.rotate(Math.PI/30);c.fillStyle=i%6?'#6a4e1e':'#2a1c08';c.fillRect(-1,-141,2,i%6?6:10)}
  c.fillStyle='#1a140a';c.beginPath();c.arc(0,0,122,0,6.3);c.fill();
  c.strokeStyle='#caa24a';c.lineWidth=2;c.beginPath();c.arc(0,0,122,0,6.3);c.stroke();
  for(let n=0;n<10;n++){
    c.save();c.rotate(-n*36*Math.PI/180);
    c.fillStyle='#e5c279';c.font='bold 26px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(n,0,-92);
    c.fillRect(-1,-120,2,10);c.restore();
    c.save();c.rotate((-n*36-18)*Math.PI/180);c.fillStyle='#7a5e28';c.fillRect(-1,-120,2,6);c.restore();
  }
  c.restore();
  g=c.createRadialGradient(cx-8,cy-8,4,cx,cy,34);g.addColorStop(0,'#d8b45a');g.addColorStop(1,'#6a4e1e');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,34,0,6.3);c.fill();c.strokeStyle='#2a1c08';c.lineWidth=2;c.stroke();
  c.fillStyle='#2a1c08';c.font='bold 30px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(rdVal(),cx,cy+1);
  c.fillStyle='#c0392b';c.beginPath();c.moveTo(cx,cy-112);c.lineTo(cx-10,cy-140);c.lineTo(cx+10,cy-140);c.closePath();c.fill();c.strokeStyle='#2a0a06';c.lineWidth=1.5;c.stroke();
}
function rdLoop(ts){
  if(!modal||modal.id!=='rotary'){RD.raf=0;return}
  const dt=Math.min(.05,((ts||0)-RD.t0)/1000||0);RD.t0=ts||0;
  if(keys.KeyD||keys.ArrowRight)rdTurn(150*dt);
  if(keys.KeyA||keys.ArrowLeft)rdTurn(-150*dt);
  rdDraw();RD.raf=requestAnimationFrame(rdLoop);
}
function openRotary(title,code,ok){
  let el=$('rotary');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='rotary';
    el.innerHTML='<div class="card" style="text-align:center;max-width:640px"><h2></h2><div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center"><canvas id="rdC" width="300" height="300" style="display:block;width:min(250px,44vh,60vw);height:auto;touch-action:none;cursor:grab"></canvas><div style="flex:1 1 210px;min-width:200px"><div id="rdP" style="font-size:18px;letter-spacing:.2em;color:var(--gold);min-height:1.4em"></div><div id="rdS" class="small" style="min-height:4em;text-align:left"></div><div class="stack" style="margin:8px 0"><button class="btn primary" id="rdL" type="button">Lock in this number</button><button class="btn" id="rdR" type="button">Start over</button><button class="btn" id="rdX" type="button">Step back</button></div><p class="small" style="margin:4px 0 0;text-align:left">Drag the dial with the mouse, or hold A / D. Enter locks the number.</p></div></div></div>';
    $('view').appendChild(el);
    const cvs=el.querySelector('#rdC');
    const ang=e=>{const r=cvs.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
    cvs.addEventListener('pointerdown',e=>{RD.drag=ang(e);cvs.setPointerCapture(e.pointerId);cvs.style.cursor='grabbing'});
    cvs.addEventListener('pointermove',e=>{if(RD.drag==null)return;const a=ang(e);let d=a-RD.drag;if(d>180)d-=360;if(d<-180)d+=360;RD.drag=a;rdTurn(d)});
    const up=()=>{RD.drag=null;cvs.style.cursor='grab'};cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up);
    el.querySelector('#rdL').onclick=rdLock;el.querySelector('#rdR').onclick=()=>{RD.step=0;RD.moved=0;rdStatus()};el.querySelector('#rdX').onclick=closeModal;
  }
  el.querySelector('h2').textContent=title;
  Object.assign(RD,{code,ok,step:0,moved:0,dir:0,drag:null,th:RD.th||0});RD.lastTick=Math.round(RD.th/36);
  rdStatus();
  openModal('rotary',c=>{if(c==='Escape')closeModal();else if(c==='Enter'||c==='Space'||c==='KeyE')rdLock();else if(c==='Backspace'){RD.step=0;RD.moved=0;rdStatus()}});
  if(!RD.raf){RD.t0=0;RD.raf=requestAnimationFrame(rdLoop)}
}
/* ===== The grandfather clock: drag the hour hand around a worn clock face ===== */
const CK={th:0,tg:0,drag:false,raf:0,t0:0,lastTick:0,stains:null};
const ckHour=()=>{const h=((Math.round(CK.th/30)%12)+12)%12;return h===0?12:h};
function ckStatus(){$('ckS').textContent='The hour hand points at '+ckHour()+' o\u2019clock.'}
function ckDraw(){
  const c=$('ckC').getContext('2d'),cx=150,cy=150;
  if(!CK.stains){const r=rng(41);CK.stains=Array.from({length:14},()=>[r()*220+40,r()*220+40,r()*26+8,r()*.12+.04])}
  c.clearRect(0,0,300,300);
  let g=c.createRadialGradient(cx-30,cy-30,20,cx,cy,146);g.addColorStop(0,'#c9a24a');g.addColorStop(.8,'#7a5a22');g.addColorStop(1,'#4a3414');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,146,0,6.3);c.fill();
  g=c.createRadialGradient(cx-20,cy-20,10,cx,cy,128);g.addColorStop(0,'#efe6cf');g.addColorStop(.75,'#ddd0aa');g.addColorStop(1,'#bda977');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,128,0,6.3);c.fill();
  c.save();c.beginPath();c.arc(cx,cy,128,0,6.3);c.clip();
  CK.stains.forEach(([x,y,r,a])=>{c.fillStyle='rgba(110,80,40,'+a+')';c.beginPath();c.arc(x,y,r,0,6.3);c.fill()});
  c.strokeStyle='rgba(70,50,30,.35)';c.lineWidth=1;c.beginPath();c.moveTo(190,60);c.lineTo(176,92);c.lineTo(186,118);c.lineTo(170,150);c.stroke();
  c.restore();
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,l=i%5?5:12;c.strokeStyle='#3a2a18';c.lineWidth=i%5?1:2.2;c.beginPath();c.moveTo(cx+Math.sin(a)*(122-l),cy-Math.cos(a)*(122-l));c.lineTo(cx+Math.sin(a)*122,cy-Math.cos(a)*122);c.stroke()}
  c.fillStyle='#2b2017';c.font='bold 22px Georgia';c.textAlign='center';c.textBaseline='middle';
  for(let h=1;h<=12;h++){const a=h*30*Math.PI/180;c.fillText(h,cx+Math.sin(a)*100,cy-Math.cos(a)*100)}
  /* minute hand, fixed at twelve */
  c.save();c.translate(cx,cy);c.fillStyle='#1a120c';c.beginPath();c.moveTo(-3,0);c.lineTo(0,-84);c.lineTo(3,0);c.closePath();c.fill();c.restore();
  /* hour hand, the one you turn */
  c.save();c.translate(cx,cy);c.rotate(CK.th*Math.PI/180);
  c.fillStyle='#1a120c';c.beginPath();c.moveTo(-6,10);c.lineTo(-4,-50);c.lineTo(0,-72);c.lineTo(4,-50);c.lineTo(6,10);c.closePath();c.fill();
  c.strokeStyle=CK.drag?'#e5c279':'rgba(229,194,121,.55)';c.lineWidth=2;c.beginPath();c.arc(0,-60,10,0,6.3);c.stroke();
  c.restore();
  g=c.createRadialGradient(cx-3,cy-3,1,cx,cy,9);g.addColorStop(0,'#e5c279');g.addColorStop(1,'#6a4e1e');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,8,0,6.3);c.fill();
}
function ckLoop(ts){
  if(!modal||modal.id!=='clockx'){CK.raf=0;return}
  const dt=Math.min(.05,((ts||0)-CK.t0)/1000||0);CK.t0=ts||0;
  const L=keys.KeyA||keys.ArrowLeft,R=keys.KeyD||keys.ArrowRight;
  if(R||L){CK.th+=(R?1:-1)*95*dt;CK.tg=CK.th}
  else if(CK.drag){const d=((CK.tg-CK.th+540)%360)-180;CK.th+=d*Math.min(1,dt*9)}
  else{const sn=Math.round(CK.th/30)*30;CK.th+=(sn-CK.th)*Math.min(1,dt*10)}
  const tk=Math.round(CK.th/30);if(tk!==CK.lastTick){CK.lastTick=tk;tone(170,.05,'square',.09)}
  ckStatus();ckDraw();CK.raf=requestAnimationFrame(ckLoop);
}
function openClockFace(){
  let el=$('clockx');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='clockx';
    el.innerHTML='<div class="card" style="text-align:center;max-width:640px"><h2>The grandfather clock</h2><div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center"><canvas id="ckC" width="300" height="300" style="display:block;width:min(250px,44vh,60vw);height:auto;touch-action:none;cursor:grab"></canvas><div style="flex:1 1 210px;min-width:200px"><div id="ckS" style="font-size:18px;color:var(--gold);min-height:2.6em;text-align:left"></div><div class="stack" style="margin:8px 0"><button class="btn primary" id="ckSet" type="button">Set the clock</button><button class="btn" id="ckX" type="button">Step back</button></div><p class="small" style="margin:4px 0 0;text-align:left">Drag the hour hand around the face, or hold A / D. Let go and it settles on an hour. Enter sets the clock.</p></div></div></div>';
    $('view').appendChild(el);
    const cvs=el.querySelector('#ckC');
    const ang=e=>{const r=cvs.getBoundingClientRect(),a=Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)))*180/Math.PI;return a<0?a+360:a};
    const near=a=>{const d=((a-CK.th)%360+540)%360-180;return d};
    cvs.addEventListener('pointerdown',e=>{CK.drag=true;CK.tg=CK.th+near(ang(e));cvs.setPointerCapture(e.pointerId);cvs.style.cursor='grabbing'});
    cvs.addEventListener('pointermove',e=>{if(CK.drag)CK.tg=CK.th+near(ang(e))});
    const up=()=>{CK.drag=false;cvs.style.cursor='grab'};cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up);
    el.querySelector('#ckSet').onclick=()=>{clkH=ckHour();setClock()};el.querySelector('#ckX').onclick=closeModal;
  }
  CK.th=CK.tg=((S.clockHour%12)*30);CK.drag=false;CK.lastTick=Math.round(CK.th/30);
  openModal('clockx',c=>{if(c==='Escape')closeModal();else if(c==='Enter'||c==='Space'||c==='KeyE'){clkH=ckHour();setClock()}});
  ckStatus();ckDraw();
  if(!CK.raf){CK.t0=0;CK.raf=requestAnimationFrame(ckLoop)}
}
/* ===== Cycle 02 clock: independent hour and minute hands ===== */
const C2CK={hour:0,minute:0,drag:null};
const c2Hour=()=>{const h=Math.round(C2CK.hour/30)%12;return h||12};
const c2Minute=()=>((Math.round(C2CK.minute/6)%60)+60)%60;
function c2Status(){
  $('c2ckS').textContent='The hands point to '+c2Hour()+':'+String(c2Minute()).padStart(2,'0')+'.';
}
function c2Draw(){
  const c=$('c2ckC').getContext('2d'),cx=150,cy=150;
  c.clearRect(0,0,300,300);
  let g=c.createRadialGradient(120,120,15,150,150,146);
  g.addColorStop(0,'#c9a24a');g.addColorStop(.8,'#7a5a22');g.addColorStop(1,'#4a3414');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,146,0,Math.PI*2);c.fill();
  g=c.createRadialGradient(130,130,10,150,150,128);
  g.addColorStop(0,'#efe6cf');g.addColorStop(.75,'#ddd0aa');g.addColorStop(1,'#bda977');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,128,0,Math.PI*2);c.fill();
  for(let i=0;i<60;i++){
    const a=i*Math.PI/30,l=i%5?5:12;
    c.strokeStyle='#3a2a18';c.lineWidth=i%5?1:2.2;
    c.beginPath();c.moveTo(cx+Math.sin(a)*(122-l),cy-Math.cos(a)*(122-l));
    c.lineTo(cx+Math.sin(a)*122,cy-Math.cos(a)*122);c.stroke();
  }
  c.fillStyle='#2b2017';c.font='bold 22px Georgia';c.textAlign='center';c.textBaseline='middle';
  for(let h=1;h<=12;h++){
    const a=h*Math.PI/6;c.fillText(h,cx+Math.sin(a)*100,cy-Math.cos(a)*100);
  }
  function hand(angle,length,width,active){
    c.save();c.translate(cx,cy);c.rotate(angle*Math.PI/180);
    c.fillStyle=active?'#704019':'#1a120c';
    c.beginPath();c.moveTo(-width,10);c.lineTo(-width*.65,-length*.73);
    c.lineTo(0,-length);c.lineTo(width*.65,-length*.73);c.lineTo(width,10);c.closePath();c.fill();
    if(active){c.strokeStyle='#e5c279';c.lineWidth=2;c.stroke()}
    c.restore();
  }
  hand(C2CK.hour,72,6,C2CK.drag==='hour');
  hand(C2CK.minute,105,3,C2CK.drag==='minute');
  c.fillStyle='#b9914b';c.beginPath();c.arc(cx,cy,7,0,Math.PI*2);c.fill();
}
function openClockFace2(){
  let el=$('clock2face');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='clock2face';
    el.innerHTML='<div class="card" style="text-align:center;max-width:640px"><h2>The grandfather clock</h2><div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center"><canvas id="c2ckC" width="300" height="300" style="display:block;width:min(250px,44vh,60vw);height:auto;touch-action:none;cursor:grab" aria-label="Clock with draggable hour and minute hands"></canvas><div style="flex:1 1 210px;min-width:200px"><div id="c2ckS" style="font-size:18px;color:var(--gold);min-height:2.6em;text-align:left"></div><div class="stack" style="margin:8px 0"><button class="btn primary" id="c2ckSet" type="button">Set the clock</button><button class="btn" id="c2ckX" type="button">Step back</button></div><p class="small" style="margin:4px 0 0;text-align:left">Drag the short hand to set the hour and the long hand to set the minutes.</p><p id="c2ckMsg" class="small" style="text-align:left" role="status"></p></div></div></div>';
    $('view').appendChild(el);
    const cvs=el.querySelector('#c2ckC');
    const pos=e=>{
      const r=cvs.getBoundingClientRect();
      return {x:(e.clientX-r.left)*300/r.width-150,y:(e.clientY-r.top)*300/r.height-150};
    };
    const angle=p=>(Math.atan2(p.x,-p.y)*180/Math.PI+360)%360;
    const distance=(a,b)=>Math.abs(((a-b+540)%360)-180);
    const setFromPointer=e=>{
      const a=angle(pos(e));
      if(C2CK.drag==='hour')C2CK.hour=(Math.round(a/30)%12)*30;
      else if(C2CK.drag==='minute')C2CK.minute=(Math.round(a/30)%12)*30;
      c2Status();c2Draw();
    };
    cvs.addEventListener('pointerdown',e=>{
      const p=pos(e),r=Math.hypot(p.x,p.y),a=angle(p);
      if(r<12||r>117)return;
      const dh=distance(a,C2CK.hour),dm=distance(a,C2CK.minute);
      // Select the hand nearest the pointer; long-hand tip takes priority.
      if(r>79)C2CK.drag='minute';
      else if(r<48)C2CK.drag='hour';
      else C2CK.drag=dh<=dm?'hour':'minute';
      cvs.setPointerCapture(e.pointerId);cvs.style.cursor='grabbing';setFromPointer(e);
    });
    cvs.addEventListener('pointermove',e=>{if(C2CK.drag)setFromPointer(e)});
    const release=()=>{C2CK.drag=null;cvs.style.cursor='grab';c2Draw()};
    cvs.addEventListener('pointerup',release);cvs.addEventListener('pointercancel',release);
    el.querySelector('#c2ckSet').onclick=tryClockFace2;
    el.querySelector('#c2ckX').onclick=closeModal;
  }
  C2CK.hour=0;C2CK.minute=0;C2CK.drag=null;
  $('c2ckMsg').textContent='';
  openModal('clock2face',code=>{
    if(code==='Escape'||code==='KeyE')closeModal();
    else if(code==='Enter')tryClockFace2();
  });
  c2Status();c2Draw();
}
function tryClockFace2(){
  if(c2Hour()!==4||c2Minute()!==20){
    $('c2ckMsg').textContent='The clock shudders, but nothing opens.';
    sfx.bad();return;
  }
  closeModal();T.clock2=true;T.hall=true;heal();sfx.solve();shake=.4;
  say('The hands snap into place. In the entrance hall, something opens with a long, tired sigh.',6);
}
/* ===== Stage 2 paranoia: doors that drift when you look away, and footsteps that are not yours ===== */
function corrParanoia(dt){
  if(!T.candle)return;
  const away=player.dir!=='up';
  T.away=away?(T.away||0)+dt:0;
  if(away&&T.away>1.3){
    T.pt=(T.pt==null?2:T.pt)-dt;
    if(T.pt<=0){
      T.pt=2.2+Math.random()*2.2;
      const n=cXs().length,i=Math.floor(Math.random()*n),off=T.off=T.off||[0,0,0,0];
      let d=(Math.random()<.5?-1:1)*(4+Math.random()*7);
      if(Math.abs(off[i]+d)>18)d=-d;
      off[i]=Math.max(-18,Math.min(18,off[i]+d));
      tone(90+Math.random()*30,.3,'sawtooth',.03,-25);
      if(!T.para){T.para=1;say('Behind you, wood creaks, as if a door has shifted.',3.5)}
    }
  }
}
function archiveParanoia(dt){
  if(player.moving){
    T.still=0;T.foot=0;T.echo=(T.echo==null?.4:T.echo)-dt;
    if(T.echo<=0){T.echo=.34;if(Math.random()<.45)setTimeout(()=>{if(roomId==='archive'&&mode==='play')tone(46+Math.random()*12,.07,'square',.03)},560)}
  }else{
    T.still=(T.still||0)+dt;
    if(T.still>3.5&&!T.foot&&time-(T.footAt||-99)>25){
      T.foot=1;T.footAt=time;
      [0,600,1200].forEach((ms,i)=>setTimeout(()=>{if(roomId==='archive')tone(44+i*2,.08,'square',.025+i*.012)},ms));
      if(!T.footMsg){T.footMsg=1;setTimeout(()=>{if(roomId==='archive')say('Footsteps. Not yours. You have not moved.',4)},1500)}
    }
  }
}
/* ===== Experiment 04: a form on the facility's archive screen (selects, not counters) ===== */
const LF={ok:null,done:false};
function lfGo(){
  const rig=$('lfRig').value,tm=$('lfTime').value,bed=$('lfBed').value,f=$('lfF');
  if(LF.done)return;
  if(!rig||!tm||!bed){f.textContent='Fill every field before restoring the record.';f.style.color='#c9a24a';sfx.bad();return}
  if(rig==='08'&&tm==='07:00'&&bed==='BED 6'){
    LF.done=true;f.textContent='Archive integrity: restored';f.style.color='#5fd35f';sfx.solve();
    setTimeout(()=>{if(modal&&modal.id==='logform'){closeModal();LF.ok()}},900);
  }else{f.textContent='Entry rejected: it does not fit the pattern of the other records.';f.style.color='#d0584a';sfx.bad();shake=.2}
}
function openLogForm(ok){
  let el=$('logform');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='logform';
    const opt=a=>'<option value="">Select</option>'+a.map(v=>'<option value="'+v+'">'+v+'</option>').join('');
    const rigs=[...Array(12)].map((_,i)=>String(i+1).padStart(2,'0')),times=[...Array(12)].map((_,i)=>String(i+1).padStart(2,'0')+':00'),beds=[...Array(10)].map((_,i)=>'BED '+(i+1));
    el.innerHTML='<div class="card lf"><div class="lf-top"><span>Vane Research Facility</span><span class="lf-tools"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d9bfb6" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/></svg><button class="lf-x" id="lfX" type="button" aria-label="Step back" title="Step back">\u00d7</button></span></div><div class="lf-body"><h2>Experiment 04</h2><p class="lf-sub">Reconstruct the missing patient record.</p><div class="lf-panel"><div class="lf-row"><label for="lfRig">Rig assignment</label><select id="lfRig" class="lf-sel">'+opt(rigs)+'</select></div><div class="lf-row"><label for="lfTime">Session time</label><select id="lfTime" class="lf-sel">'+opt(times)+'</select></div><div class="lf-row"><label for="lfBed">Patient bed</label><select id="lfBed" class="lf-sel">'+opt(beds)+'</select></div></div><details class="lf-ex"><summary>Archive extract</summary><pre>EXP 1   RIG 02   01:00   BED 9\nEXP 2   RIG 04   03:00   BED 8\nEXP 3   RIG 06   05:00   BED 7\nEXP 4   [ PAGE TORN OUT ]\nEXP 5   RIG 10   09:00   BED 5\nEXP 6   RIG 12   11:00   BED 4</pre></details><button class="lf-btn" id="lfGo" type="button">Restore record</button><div class="lf-foot" id="lfF">Archive integrity: compromised</div></div></div>';
    $('view').appendChild(el);
    el.querySelector('#lfGo').onclick=lfGo;el.querySelector('#lfX').onclick=closeModal;
  }
  LF.ok=ok;LF.done=false;['lfRig','lfTime','lfBed'].forEach(i=>{$(i).value=''});
  $('lfF').textContent='Archive integrity: compromised';$('lfF').style.color='';
  openModal('logform',c=>{if(c==='Escape')closeModal();else if(c==='Enter')lfGo()});
}
/* ===== The attic toys now look like a bear, a rabbit and a horse (seen from above, head first) ===== */
function toyBear(c){
  c.fillStyle='#8a5a32';[[-9,8],[9,8]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,4,0,6.3);c.fill()});
  [[-12,-2],[12,-2]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.6,0,6.3);c.fill()});
  c.fillStyle='#a06a3a';c.beginPath();c.ellipse(0,1,10,11,0,0,6.3);c.fill();
  c.fillStyle='#d8b184';c.beginPath();c.ellipse(0,2,5.5,6.5,0,0,6.3);c.fill();
  c.fillStyle='#a06a3a';c.beginPath();c.arc(0,-11,8,0,6.3);c.fill();
  c.fillStyle='#8a5a32';[[-6,-17],[6,-17]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.2,0,6.3);c.fill()});
  c.fillStyle='#d8b184';c.beginPath();c.ellipse(0,-15,3.6,3,0,0,6.3);c.fill();
  c.fillStyle='#1a120c';c.beginPath();c.arc(0,-16,1.3,0,6.3);c.fill();
  [[-3,-11.5],[3,-11.5]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1,0,6.3);c.fill()});
}
function toyRabbit(c){
  c.fillStyle='#f0ece4';[[-6,9],[6,9]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,3,4.5,0,0,6.3);c.fill()});
  c.beginPath();c.ellipse(0,2,8.5,11,0,0,6.3);c.fill();
  c.beginPath();c.arc(0,13,4,0,6.3);c.fill();
  c.beginPath();c.arc(0,-10,6.5,0,6.3);c.fill();
  [-1,1].forEach(k=>{c.save();c.translate(k*3.4,-20);c.rotate(k*.14);c.fillStyle='#f0ece4';c.beginPath();c.ellipse(0,0,2.7,8,0,0,6.3);c.fill();c.fillStyle='#e8a0b0';c.beginPath();c.ellipse(0,0,1.2,6,0,0,6.3);c.fill();c.restore()});
  c.fillStyle='#e8a0b0';c.beginPath();c.arc(0,-15.5,1.5,0,6.3);c.fill();
  c.fillStyle='#1a120c';[[-3,-10.5],[3,-10.5]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1,0,6.3);c.fill()});
}
function toyHorse(c){
  c.fillStyle='#6a4426';[[-9,-5],[9,-5],[-9,9],[9,9]].forEach(([x,y])=>c.fillRect(x-2,y-4,4,8));
  c.fillStyle='#b07840';c.beginPath();c.ellipse(0,3,8,14,0,0,6.3);c.fill();
  c.fillStyle='#b8302a';c.fillRect(-6,-1,12,8);c.fillStyle='#e5c279';c.fillRect(-6,1,12,1.4);
  c.fillStyle='#b07840';c.beginPath();c.ellipse(0,-14,5.6,9,0,0,6.3);c.fill();
  c.fillStyle='#e8d2ac';c.beginPath();c.ellipse(0,-21,4,4.6,0,0,6.3);c.fill();
  c.fillStyle='#f4eee2';c.beginPath();c.ellipse(0,-14,1.4,6,0,0,6.3);c.fill();
  c.fillStyle='#3a2412';c.fillRect(-1.6,-19,3.2,18);
  for(let k=0;k<4;k++){c.fillRect(-4,-17+k*4.5,2.4,2.4);c.fillRect(1.6,-17+k*4.5,2.4,2.4)}
  c.beginPath();c.moveTo(-3,16);c.quadraticCurveTo(0,29,3,16);c.fill();
  c.fillStyle='#8a5a30';[-1,1].forEach(k=>{c.beginPath();c.moveTo(k*2.6,-19);c.lineTo(k*6.4,-24);c.lineTo(k*5,-16);c.closePath();c.fill()});
  c.fillStyle='#1a120c';[[-3.8,-15],[3.8,-15]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1.1,0,6.3);c.fill()});
  [[-1.5,-23],[1.5,-23]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,.8,0,6.3);c.fill()});
}
{const fn={bear:toyBear,rabbit:toyRabbit,horse:toyHorse};
 ROOMS.attic.objs.filter(o=>/^Turn the (bear|rabbit|horse)$/.test(o.label)).forEach(o=>{
  const n=o.label.slice(9),i=['bear','rabbit','horse'].indexOf(n);
  o.draw=(c,m)=>{
    const d=(T.toy||[2,2,2])[i],cx=m.x+22,cy=m.y+18;
    rect(c,m.x,m.y+28,m.w,12,'#4a3a2a');
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(cx,cy+17,17,5,0,0,6.3);c.fill();
    c.save();c.translate(cx,cy);c.rotate(d*Math.PI/2);fn[n](c);c.restore();
    const px=-DY[d],py=DX[d];c.fillStyle='rgba(229,194,121,.85)';c.beginPath();c.moveTo(cx+DX[d]*30,cy+DY[d]*30);c.lineTo(cx+DX[d]*24+px*4,cy+DY[d]*24+py*4);c.lineTo(cx+DX[d]*24-px*4,cy+DY[d]*24-py*4);c.closePath();c.fill();
    if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}
  }})}
/* ===== Stage 3: carry the bottles to the table and pour them into the beaker (no counters) ===== */
const BPOS0=[[70,24],[200,24],[500,296]],BLBL=['Acid. Handle with care.','Base. Clear as water.','Reagent. Yellow as old teeth.'];
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function drawHeld(){const c=BOT[T.held].c;rect(ctx,player.x+6,player.y-32,8,6,'#ccc');rect(ctx,player.x+4,player.y-26,12,16,c);ctx.fillStyle='#fff';ctx.font='bold 9px Georgia';ctx.textAlign='center';ctx.fillText('ABC'[T.held],player.x+10,player.y-14)}
function dropBottle(){
  if(T.held==null)return;
  const i=T.held;(T.bp=T.bp||BPOS0.map(a=>a.slice()))[i]=[clamp(player.x-8,40,570),clamp(player.y-18,70,320)];
  T.held=null;sfx.light();say('You put bottle '+'ABC'[i]+' down.',2);updateHUD();
}
function pickBottle(i){
  if(T.held!=null){say('Your hands are full. Step away from everything and press E to put your bottle down first.',4);return}
  T.held=i;(T.pk=T.pk||[])[i]=1;sfx.pick();updateHUD();
  say('You pick up bottle '+'ABC'[i]+' ('+BOT[i].n+'). A label in faded ink: "'+BLBL[i]+'" Press E away from objects to put it down.',6);
}
function pourBottle(){
  if(T.ink){say('The beaker glows faintly blue. It has done its work.',3);return}
  if(T.held==null){say('A reagent table with a glass beaker. Pick up a bottle, then pour it in. Pour a second one in the order the log suggests. A sink at the end of the table empties the beaker.',5);return}
  const i=T.held,m=T.mix=T.mix||[];
  if(m.includes(i)){say('You have already poured bottle '+'ABC'[i]+' into this beaker.',3);return}
  m.push(i);sfx.light();say('You pour bottle '+'ABC'[i]+' into the beaker.',3);
  const has=k=>m.includes(k);
  if(has(0)&&has(1)){T.mix=[];sfx.bad();shake=.3;say('Acid meets base. The mixture hisses, the paper in the beaker eats itself, and the writing goes with it. You empty the beaker and start again.',7);return}
  if(m.length===2&&has(0)&&has(2)){T.ink=true;heal();sfx.solve();say('The mixture glows faintly blue. Across the room, writing rises on the board... but your eyes only catch it under the red emergency light (R).',8);return}
  if(m.length===2&&has(1)&&has(2))say('Foam rises, then settles. Nothing else happens.',5);
}
function drawBeaker(c,o){
  const m=T.mix||[];c.strokeStyle='rgba(190,230,245,.85)';c.lineWidth=2;c.strokeRect(o.x+7,o.y+2,22,28);
  if(m.length||T.ink){const cs=T.ink?[[100,170,255]]:m.map(k=>hexRgb(BOT[k].c)),r=Math.round(cs.reduce((a,x)=>a+x[0],0)/cs.length),g=Math.round(cs.reduce((a,x)=>a+x[1],0)/cs.length),b=Math.round(cs.reduce((a,x)=>a+x[2],0)/cs.length),h=T.ink?20:8+m.length*8;c.fillStyle='rgb('+r+','+g+','+b+')';c.fillRect(o.x+9,o.y+30-h,18,h-1);
    if(T.ink){const gl=c.createRadialGradient(o.x+18,o.y+14,2,o.x+18,o.y+14,26);gl.addColorStop(0,'rgba(120,180,255,.5)');gl.addColorStop(1,'rgba(120,180,255,0)');c.fillStyle=gl;c.fillRect(o.x-10,o.y-12,56,56)}}
}
ROOMS.lab.objs=ROOMS.lab.objs.filter(o=>!(typeof o.label==='string'&&/^(Take the (red|glass|yellow) bottle|Mix the reagents)$/.test(o.label)));
ROOMS.lab.objs.unshift(
  ...[0,1,2].map(i=>({get x(){return (T.bp=T.bp||BPOS0.map(a=>a.slice()))[i][0]},get y(){return (T.bp=T.bp||BPOS0.map(a=>a.slice()))[i][1]},w:16,h:30,
    get vis(){return (T.pk||[])[i]?undefined:(i===1?'red':undefined)},when:()=>T.held!==i,label:()=>'Pick up bottle '+'ABC'[i],
    draw:(c,o)=>{rect(c,o.x+4,o.y,8,8,'#ccc');rect(c,o.x,o.y+8,16,22,BOT[i].c);c.fillStyle='#fff';c.font='bold 11px Georgia';c.textAlign='center';c.fillText('ABC'[i],o.x+8,o.y+24)},
    act:()=>pickBottle(i)})),
  {x:410,y:176,w:36,h:40,solid:true,label:'Empty the beaker',draw:(c,o)=>{rect(c,o.x,o.y+10,o.w,30,'#4a5256');rect(c,o.x+6,o.y+16,o.w-12,16,'#10181a')},act:()=>{if(T.ink){say('The beaker is not to be emptied. The mixture is working.',3);return}if(!(T.mix||[]).length){say('The beaker is already empty.',2);return}T.mix=[];sfx.light();say('You tip the beaker into the sink. It is empty again.',3)}},
  {x:290,y:170,w:110,h:50,solid:true,label:'Pour into the beaker',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a5256');rect(c,o.x,o.y,o.w,5,'#6a7478');c.fillStyle='rgba(0,0,0,.25)';c.fillRect(o.x,o.y+o.h-8,o.w,8);drawBeaker(c,{x:o.x+28,y:o.y+2})},act:pourBottle}
);
/* ===== A lock you type on the keyboard (used for the hidden lock in Stage 2) ===== */
const TC={code:'',ok:null,s:'',done:false};
function tcShow(msg,col){
  const sl=$('tcSlots').children;
  for(let i=0;i<TC.code.length;i++){const ch=TC.s[i];sl[i].textContent=ch||'';sl[i].style.borderColor=(i===TC.s.length&&!TC.done)?'#e5c279':'#4a4a52'}
  $('tcM').textContent=msg||'';$('tcM').style.color=col||'';
}
function tcKey(n){
  if(TC.done||TC.s.length>=TC.code.length)return;
  TC.s+=n;sfx.light();tone(300+TC.s.length*40,.06,'square',.05);tcShow();
  if(TC.s.length===TC.code.length)$('tcM').textContent='Press Enter to try it.';
}
function tcSubmit(){
  if(TC.done)return;
  if(TC.s.length<TC.code.length){tcShow('Type all '+TC.code.length+' numbers first.','#c9a24a');return}
  if(TC.s===TC.code){TC.done=true;tcShow('The stone grinds open.','#5fd35f');sfx.solve();setTimeout(()=>{if(modal&&modal.id==='typecode'){closeModal();TC.ok()}},800)}
  else{sfx.bad();shake=.15;TC.s='';tcShow('Nothing moves. The wall stays cold. Try again.','#d0584a')}
}
function openTypeCode(title,code,ok,intro){
  let el=$('typecode');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='typecode';
    el.innerHTML='<div class="card" style="text-align:center;max-width:480px"><h2></h2><p class="small" id="tcI"></p><div id="tcSlots" style="display:flex;gap:12px;justify-content:center;margin:18px 0"></div><div id="tcM" class="small" style="min-height:2.4em"></div><div class="row"><button class="btn primary" id="tcGo" type="button">Try it</button><button class="btn" id="tcBk" type="button">Delete</button><button class="btn" id="tcX" type="button">Step back</button></div><p class="small" style="margin:4px 0 0">Type the numbers on your keyboard. Backspace deletes. Enter tries.</p></div>';
    $('view').appendChild(el);
    el.querySelector('#tcGo').onclick=tcSubmit;el.querySelector('#tcX').onclick=closeModal;
    el.querySelector('#tcBk').onclick=()=>{if(!TC.done){TC.s=TC.s.slice(0,-1);tcShow()}};
  }
  el.querySelector('h2').textContent=title;$('tcI').textContent=intro;
  const sl=$('tcSlots');sl.innerHTML='';
  for(let i=0;i<code.length;i++){const d=document.createElement('div');d.style.cssText='width:64px;height:80px;display:flex;align-items:center;justify-content:center;font:700 38px Georgia,serif;color:#e5c279;background:linear-gradient(145deg,#2a2a30,#1a1a1f);border:2px solid #4a4a52;border-radius:8px;box-shadow:inset 0 3px 8px rgba(0,0,0,.6)';sl.appendChild(d)}
  Object.assign(TC,{code,ok,s:'',done:false});tcShow();
  openModal('typecode',c=>{
    if(c==='Escape')closeModal();
    else if(c==='Enter')tcSubmit();
    else if(c==='Backspace'){if(!TC.done){TC.s=TC.s.slice(0,-1);tcShow()}}
    else if(/^(Digit|Numpad)\d$/.test(c))tcKey(c.slice(-1));
  });
}
/* ===== The false journal: drag each entry into the TRUE or FALSE box ===== */
const FJS=['Entry 1: "The dining room clock had to show seven."','Entry 2: "Wren was Aldric\u2019s eldest child, born in 1802."','Entry 3: "The escaped patient was Ames, photograph four."','Entry 4: "The lullaby ended on the fifth step, SOL."'],FJT=[true,false,true,false];
const SJ={ok:null,sel:null,done:false,drag:null};
function sjMove(el,box){
  box.querySelector('.sjlist').appendChild(el);el.style.position='';el.style.left='';el.style.top='';el.style.width='';el.style.zIndex='';
  el.classList.remove('sel');SJ.sel=null;sfx.light();
}
function sjAllPlaced(){return $('sjTray').children.length===0}
function sjGo(){
  if(SJ.done)return;
  const m=$('sjM');
  if(!sjAllPlaced()){m.textContent='Sort every entry into a box first.';m.style.color='#c9a24a';return}
  const ok=[...$('sjT').querySelectorAll('.sjslip')].every(e=>FJT[+e.dataset.i])&&[...$('sjF').querySelectorAll('.sjslip')].every(e=>!FJT[+e.dataset.i]);
  if(ok){SJ.done=true;m.textContent='The glass clears. The lies fall away.';m.style.color='#5fd35f';sfx.solve();setTimeout(()=>{if(modal&&modal.id==='sortj'){closeModal();SJ.ok()}},900)}
  else{sfx.bad();shake=.2;m.textContent='The pages shudder and slide apart. The house does not like that answer.';m.style.color='#d0584a';[...document.querySelectorAll('#sortj .sjslip')].forEach(e=>$('sjTray').appendChild(e))}
}
function openSortJournal(ok){
  let el=$('sortj');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='sortj';
    el.innerHTML='<div class="card" style="text-align:center;max-width:640px"><h2>The false journal</h2><p class="small">Drag each entry into the box where it belongs: TRUE or FALSE. (Or click an entry, then click a box.) The house wrote some of these lies.</p><div id="sjTray" style="display:flex;flex-direction:column;gap:8px;margin:12px 0;min-height:60px"></div><div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><div class="sjbox" id="sjT"><div class="sjlab" style="color:#5fd35f">TRUE</div><div class="sjlist"></div></div><div class="sjbox" id="sjF"><div class="sjlab" style="color:#d0584a">FALSE</div><div class="sjlist"></div></div></div><div id="sjM" class="small" style="min-height:2.6em;margin-top:8px"></div><div class="row"><button class="btn primary" id="sjGo" type="button">Seal the journal</button><button class="btn" id="sjX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    el.querySelector('#sjGo').onclick=sjGo;el.querySelector('#sjX').onclick=closeModal;
    [...el.querySelectorAll('.sjbox')].forEach(b=>b.addEventListener('click',()=>{const s=SJ.sel;if(s&&!SJ.done)sjMove(s,b)}));
  }
  SJ.ok=ok;SJ.sel=null;SJ.done=false;
  const tray=$('sjTray');tray.innerHTML='';el.querySelectorAll('.sjlist').forEach(l=>l.innerHTML='');
  $('sjM').textContent='';$('sjM').style.color='';
  FJS.forEach((t,i)=>{
    const sl=document.createElement('div');sl.className='sjslip';sl.dataset.i=i;sl.textContent=t;sl.style.transform='rotate('+((i%2?1:-1)*(.3+i*.15))+'deg)';
    let st=null;
    sl.addEventListener('pointerdown',e=>{if(SJ.done)return;const r=sl.getBoundingClientRect();st={x:e.clientX,y:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,w:r.width,h:r.height,moved:false};sl.setPointerCapture(e.pointerId)});
    sl.addEventListener('pointermove',e=>{
      if(!st)return;
      if(!st.moved&&Math.hypot(e.clientX-st.x,e.clientY-st.y)<5)return;
      if(!st.moved){st.moved=true;st.ph=document.createElement('div');st.ph.style.height=st.h+'px';sl.parentNode.insertBefore(st.ph,sl);sl.style.position='fixed';sl.style.width=st.w+'px';sl.style.zIndex=60;sl.style.transform='rotate(0deg)';sl.style.cursor='grabbing';sl.style.left='0px';sl.style.top='0px';const r0=sl.getBoundingClientRect();st.ox=r0.left;st.oy=r0.top}
      sl.style.left=(e.clientX-st.dx-st.ox)+'px';sl.style.top=(e.clientY-st.dy-st.oy)+'px';
    });
    const end=e=>{
      if(!st)return;const was=st;st=null;sl.style.cursor='';
      if(!was.moved){const s=SJ.sel;if(s&&s!==sl)s.classList.remove('sel');sl.classList.toggle('sel');SJ.sel=sl.classList.contains('sel')?sl:null;return}
      const hit=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains('sjbox'));
      if(was.ph)was.ph.remove();
      sl.style.position='';sl.style.left='';sl.style.top='';sl.style.width='';sl.style.zIndex='';sl.style.transform='';
      if(hit)sjMove(sl,hit);else{$('sjTray').appendChild(sl);sfx.light()}
    };
    sl.addEventListener('pointerup',end);sl.addEventListener('pointercancel',end);
    tray.appendChild(sl);
  });
  openModal('sortj',c=>{if(c==='Escape')closeModal();else if(c==='Enter')sjGo()});
}
buildBG();
/* ===== Hidden lore fragments (collect all 5 to unlock the secret ending) ===== */
const hasFrag=i=>notes.some(n=>n.title==='Fragment '+(i+1));
const fragCount=()=>notes.filter(n=>n.title.startsWith('Fragment')).length;
[['foyer',180,290,'Pry up the loose board','Under the loose board, a page in your own handwriting:\n\n"If you are reading this again, the front door is not the exit. Do not trust the lock. Look for Mara."'],
 ['archive',500,290,'Check the loose tile','A scrap tucked under a cracked tile:\n\n"Your friend\u2019s name is Mara. She left you a message in every room, in a code only you would understand."'],
 ['records',500,300,'Pick up the dropped tape label','A tape label, smudged:\n\n"The face on the monitor is not a stranger. It is the face you wear after each wipe."'],
 ['attic',200,300,'Pick up the crayon scrap','A crayon scrap in a child\u2019s hand:\n\n"The girl keeps coming back. She never remembers me, but the dog always does. She has her friend\u2019s eyes."'],
 ['study',400,300,'Pick up the mirror shard','A shard of glass etched with tiny letters:\n\n"The copy is not your enemy. It is what is left of every attempt. It has been trying to warn you."']
].forEach(([r,x,y,l,t],i)=>ROOMS[r].objs.push({x,y,w:30,h:16,label:l,
  draw:(c,o)=>{if(!hasFrag(i)){rect(c,o.x,o.y+6,o.w,6,'#3a2a1a');const g=.4+.4*Math.sin(time*4+i);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+15,o.y+8,3+g*2,0,6.3);c.fill()}},
  act:()=>{if(hasFrag(i)){say('Nothing more here.');return}sfx.pick();addNote('Fragment '+(i+1),t);showNote('Fragment '+(i+1)+' of 5',t);if(fragCount()===5)setTimeout(()=>say('That is all five fragments. Something deep in you begins to remember.',6),500)}}));
function portOk(){T.port=true;heal();sfx.solve();shake=.3;addNote('Nursery rhyme',RHYME2);showNote('Nursery rhyme','The frames click into place. Behind the middle one a panel slides open. Inside, in a child\u2019s handwriting:\n\n'+RHYME2)}
function doorOk(){T.door=true;heal();sfx.solve();shake=.5;say('The wall splits open. Beyond it, a staircase winds down into the dark.',5);setTimeout(stageEnd,3200)}
function beginStage(n){saveGame(n);return n===2?beginStage2():n===3?beginStage3():n===4?beginStage4():n===5?beginStage5():beginStage6()}
function beginStage2(){
  chapter=2;T={route:0,cor:1,good:Math.floor(Math.random()*3)};hearts=3;updateHUD();roomId='corr';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('The iron key turns, but the door opens onto a corridor you have never seen. The air smells of old dust. A single candle burns in a holder on the left wall.',7);
}
function stageEnd(){if(chapter>=2&&chapter<=5){beginStage(chapter+1);return}
  mode='win';sfx.solve();const c=$('win').querySelector('.card'),p=c.querySelectorAll('p');
  c.querySelector('h2').textContent='Stage 5 complete';
  p[0].textContent='The thing in the glass has been copying your memories. Your friend may have met an earlier version of you.';
  p[1].textContent='Stage 6, The Heart of the Manor, is coming next.';
  $('winStats').textContent='';$('win').classList.add('on');
}
function hint2(){
  let t;
  if(T.route<3)t=corrHint();
  else if(!T.reg)t='The desk in the gallery holds the family register.';
  else if(!T.port)t='Work out each birth year from the register, then swap the frames on the wall until they hang eldest first, from left to right.';
  else t='Read the rhyme (J), then listen to the doll in the whispering room. The hidden lock is in the gallery wall, on the right. Enter the numbers the doll said twice, in the order they first appeared.';
  say('Hint: '+t,6);
}

/* ================= GAME LOGIC ================= */
function start(skip){
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  if(modal){$(modal.id).classList.remove('on')}
  reset();initAudio();
  if(skip===true){beginPlay();return}
  runIntro();
}
function beginPlay(){mode='play';fade=1;say('The front door slammed behind you and the bolt slid home. There must be another way out.',6)}
function changeRoom(to,sx,sy){
  sfx.door();roomId=to;if(to==='whisper')T.heard=true;if(to==='playroom')T.playIn=true;if(to==='seance')T.seIn=true;if(to==='archive'&&T.port&&T.heard&&!T.face){T.face=true;setTimeout(()=>{say('A sixth portrait hangs among the Vanes. The face in the frame is yours.',6);sfx.scare();lightsOut=.4},700)}player.x=sx;player.y=sy;unstick();fade=1;roomT=2.5;
  ghost.on=false;ghost.timer=GH.includes(to)?5:Infinity;doorCool=.6;
  if(to==='foyer')say('The hall is quiet. Nothing has ever followed you here.',3);
}
const GH=['library','dining','cellar','whisper','core','machine','library2','dining2','cells','radio','m10'];
const ghostRoom=()=>GH.includes(roomId);
function stage(){return[S.clock,S.safe,S.altar].filter(Boolean).length}
function spawnGhost(nearP){
  ghost.on=true;ghost.a=0;ghost.ph=Math.random()*6;ghost.life=22;
  if(nearP){
    const a=Math.random()*6.28;ghost.x=clamp(player.x+Math.cos(a)*170,50,590);ghost.y=clamp(player.y-14+Math.sin(a)*170,80,340);ghost.a=.3;
  }else{
    const cs=[[80,100],[560,100],[80,320],[560,320]];
    let best=cs[0],bd=-1;
    for(const p of cs){const d=Math.hypot(p[0]-player.x,p[1]-player.y);if(d>bd){bd=d;best=p}}
    ghost.x=best[0];ghost.y=best[1];
  }
}
function caught(){
  hearts--;updateHUD();invuln=2.5;shake=.7;flash=1;sfx.scare();ghost.on=false;
  if(hearts<=0){mode='over';$('over').classList.add('on');return}
  roomId=chapter===1?'foyer':chapter===5?'hallR':chapter===6?'core':chapter===7?'foyer2':chapter===8?'m0':'archive';player.x=320;player.y=250;unstick();fade=1;roomT=2.5;ghost.timer=chapter===6?6:Infinity;T.hide=0;
  say('You wake on the cold floor, heart hammering. It cannot follow you here.',5);
}
function win(){if(chapter===1){beginStage(2);return}
  mode='win';sfx.solve();
  const m=Math.floor(playTime/60),s=Math.floor(playTime%60);
  $('winStats').textContent='Time in the manor: '+m+':'+String(s).padStart(2,'0')+'. Sanity left: '+hearts+' of 3.';
  $('win').classList.add('on');
}
function blocked(x,y){
  const L=x-9,R=x+9,T=y-12,B=y;
  if(L<32||R>608||T<64||B>352)return true;
  for(const o of room().objs)if(o.solid&&visO(o)&&L<o.x+o.w&&R>o.x&&T<o.y+o.h&&B>o.y)return true;
  return false;
}
function tryMove(dx,dy){
  if(!dx&&!dy)return;
  const nx=player.x+dx,ny=player.y+dy;
  if(!blocked(nx,ny)){player.x=nx;player.y=ny}
}
function unstick(){
  const ok=(x,y)=>!blocked(x,y)&&!room().objs.some(o=>o.door&&x-9<o.x+o.w&&x+9>o.x&&y-12<o.y+o.h&&y>o.y);
  if(ok(player.x,player.y))return;
  for(let r=8;r<=240;r+=8)for(let a=0;a<16;a++){
    const x=player.x+Math.cos(a*Math.PI/8)*r,y=player.y+Math.sin(a*Math.PI/8)*r;
    if(ok(x,y)){player.x=x;player.y=y;return}
  }
}
function interact(){
  if(!near){if(chapter===3&&T.held!=null){dropBottle();return}examineCandle();return}
  near.act();
}
function labelOf(o){return typeof o.label==='function'?o.label():(o.label||'Examine')}

function update(dt){
  time+=dt;
  if(mode==='end'){E.t+=dt;if(E.t>E.len){clearInterval(E.mus);flashEnd(E.kind)}}
  if(mode==='reveal')revealTick(dt);
  if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').classList.remove('show')}
  if(shake>0)shake=Math.max(0,shake-dt*1.6);
  if(flash>0)flash=Math.max(0,flash-dt*1.8);
  if(fade>0)fade=Math.max(0,fade-dt*2.5);
  if(roomT>0)roomT-=dt;
  if(lightsOut>0)lightsOut-=dt;
  if(mode==='modal'||mode==='play')playTime+=dt;
  if(mode!=='play')return;
  invuln=Math.max(0,invuln-dt);
  doorCool=Math.max(0,doorCool-dt);
  if(T.fig>0)T.fig-=dt;
  if(T.refl>0)T.refl-=dt;
  if(T.lure>0)T.lure-=dt;
  if(chapter===2&&roomId==='corr')corrUpdate(dt);
  if(chapter===2&&roomId==='archive')archiveParanoia(dt);
  if(chapter===8)mazeUpdate(dt);
  if(chapter===5){
    const inH=roomId==='hallR'||roomId==='hallM';
    T.h.push([time,player.x,player.y]);while(T.h.length>2&&T.h[1][0]<time-1)T.h.shift();
    if(T.dop&&inH){const d=T.h[0];if(Math.hypot(640-d[1]-player.x,d[2]-player.y)<16&&invuln<=0){caught();return}}
    if(T.dop&&roomId==='hallM'&&!T.plates){const d=T.h[0],a=Math.abs(player.x-180)<28&&Math.abs(player.y-285)<18,b=Math.abs(640-d[1]-460)<28&&Math.abs(d[2]-285)<18;T.pa=a;T.pb=b;if(a&&b){T.pc=(T.pc||0)+dt;if(T.pc>1.2){T.plates=true;heal();sfx.solve();say('Both plates sink together. Under the glass dome on the table, a latch releases.',5)}}else T.pc=0}
    if(!T.scared&&inH&&Math.abs(player.x-320)<70&&player.y<130){T.scared=1;T.refl=7;say('Your reflection has stopped moving. Slowly, it turns its head toward something behind you.',6);sfx.beat()}
  }
  if(chapter===4&&roomId==='nursery'&&T.dread<3){T.dt+=dt;if(T.dt>22){T.dt=0;T.dread++;say(['Behind you, a chair creaks.','Something is not where you left it.','The drawings on the wall look different.'][T.dread-1],3.5);sfx.step()}}

  let mx=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0);
  let my=((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0);
  if(T.hide){mx=0;my=0}
  if(mx&&my){mx*=.7071;my*=.7071}
  player.moving=!!(mx||my);
  if(player.moving){
    player.step+=dt*10;
    if(Math.abs(mx)>Math.abs(my))player.dir=mx>0?'right':'left';else player.dir=my>0?'down':'up';
    stepT-=dt;if(stepT<=0){sfx.step();stepT=.34}
  }
  const sp=118;
  tryMove(mx*sp*dt,0);tryMove(0,my*sp*dt);

  const box={L:player.x-9,R:player.x+9,T:player.y-12,B:player.y};
  if(doorCool<=0){
    for(const o of room().objs){
      if(o.door&&visO(o)&&box.L<o.x+o.w&&box.R>o.x&&box.T<o.y+o.h&&box.B>o.y){
        if(o.lock&&o.lock()){
          doorCool=3;sfx.bad();say(o.lockMsg,4);
        }else if(o.to==='EXIT'){win();return}
        else if(o.fn)o.fn();else{changeRoom(o.to,o.sx,o.sy)}
        break;
      }
    }
  }

  near=null;let bd=1e9;
  const px=player.x,py=player.y-8;
  for(const o of room().objs){
    if(!o.act||!visO(o))continue;
    const d=rdist(px,py,o);
    if(d<36&&d<bd){near=o;bd=d}
  }

  if(ghostRoom()){
    if(!ghost.on){
      ghost.timer-=dt;
      if(ghost.timer<=0)spawnGhost(false);
    }else{
      ghost.a=Math.min(1,ghost.a+dt*.7);
      ghost.life-=dt;
      let tx=player.x,ty=player.y-14;
      if(chapter>=6){if(T.lure>0){tx=T.lx;ty=T.ly}else if(T.hide){tx=player.x<320?580:60;ty=330}}
      const gx=tx-ghost.x,gy=ty-ghost.y,d=Math.hypot(gx,gy)||1;
      const spd=chapter>=6?(chapter===6?72:66):54+stage()*12;
      const wob=Math.sin(time*2.3+ghost.ph)*.55,ux=gx/d,uy=gy/d;
      ghost.x+=(ux-uy*wob)*spd*dt;ghost.y+=(uy+ux*wob)*spd*dt;
      if(!T.hide&&Math.hypot(player.x-ghost.x,player.y-14-ghost.y)<20&&ghost.a>.7&&invuln<=0){caught();return}
      if(d<240){beatT-=dt;if(beatT<=0){sfx.beat();beatT=.4+(d/240)*.9}}
      if(d<130&&Math.random()<dt*3)lightsOut=Math.max(lightsOut,.08);
      if(ghost.life<=0&&chapter!==6){ghost.on=false;ghost.timer=8}
    }
    eventT-=dt;
    if(eventT<=0){
      eventT=28+Math.random()*20;lightsOut=.25;noise(.3,.1,600);
      say(WHISPERS[Math.floor(Math.random()*WHISPERS.length)],2.6);
    }
  }
}

/* ================= RENDER ================= */
function drawPlayer(){
  const x=player.x,y=player.y,sw=player.moving?Math.sin(player.step)*3:0,bob=player.moving?Math.abs(Math.sin(player.step))*1.2:0;
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y,10,4,0,0,6.3);ctx.fill();
  rect(ctx,x-6,y-8+(sw>0?0:0),5,8+sw*.4,'#1d1a26');rect(ctx,x+1,y-8,5,8-sw*.4,'#1d1a26');
  rect(ctx,x-8,y-24-bob,16,17,'#4a3b5c');rect(ctx,x-8,y-24-bob,16,4,'#6a5a80');
  ctx.fillStyle='#d6b79c';ctx.beginPath();ctx.arc(x,y-30-bob,7,0,6.3);ctx.fill();
  ctx.fillStyle='#3a2418';
  if(player.dir==='up'){ctx.beginPath();ctx.arc(x,y-30-bob,7.2,0,6.3);ctx.fill()}
  else{ctx.beginPath();ctx.arc(x,y-32-bob,7.2,Math.PI,0);ctx.fill();ctx.fillRect(x-7,y-32-bob,3,10);ctx.fillRect(x+4,y-32-bob,3,10)}
  ctx.fillStyle='#111';
  if(player.dir==='down'){ctx.fillRect(x-3,y-30-bob,1.8,2);ctx.fillRect(x+1.5,y-30-bob,1.8,2)}
  else if(player.dir==='left')ctx.fillRect(x-4,y-30-bob,1.8,2);
  else if(player.dir==='right')ctx.fillRect(x+2,y-30-bob,1.8,2);
  const lx=x+(player.dir==='left'?-11:11),ly=y-14-bob;
  ctx.fillStyle='#8a6a3a';ctx.fillRect(lx-2,ly-2,4,6);
  drawFlame(lx,ly-4);
}
function drawGhost(){
  const g=ghost,x=g.x,y=g.y;
  ctx.save();ctx.globalAlpha=g.a*.82;
  ctx.fillStyle='#cdd6e4';
  ctx.beginPath();ctx.arc(x,y-16,12,Math.PI,0);ctx.lineTo(x+13,y+12);
  for(let i=0;i<=6;i++){const px=x+13-i*(26/6);ctx.lineTo(px,y+14+(i%2?6:-2)+Math.sin(time*6+i)*2)}
  ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(180,195,215,.6)';
  ctx.beginPath();ctx.moveTo(x-12,y-6);ctx.quadraticCurveTo(x-24,y+4+Math.sin(time*4)*3,x-20,y+16);ctx.lineTo(x-12,y+8);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+12,y-6);ctx.quadraticCurveTo(x+24,y+4+Math.cos(time*4)*3,x+20,y+16);ctx.lineTo(x+12,y+8);ctx.fill();
  ctx.fillStyle='#0d0709';
  ctx.beginPath();ctx.ellipse(x-5,y-16,2.8,4.5,0,0,6.3);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+5,y-16,2.8,4.5,0,0,6.3);ctx.fill();
  ctx.beginPath();ctx.ellipse(x,y-6,3,6+Math.sin(time*5)*1.5,0,0,6.3);ctx.fill();
  ctx.restore();
}
function lightAt(x,y,r,a){
  const g=dx.createRadialGradient(x,y,r*.08,x,y,r);
  g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(.55,'rgba(0,0,0,'+(a*.7)+')');g.addColorStop(1,'rgba(0,0,0,0)');
  dx.fillStyle=g;dx.fillRect(x-r,y-r,r*2,r*2);
}
function draw(){
  ctx.setTransform(2,0,0,2,0,0);
  ctx.clearRect(0,0,W,H);
  if(mode==='end'){drawEnding();return}
  if(mode==='reveal'){drawReveal();return}
  ctx.save();
  if(shake>0)ctx.translate((Math.random()-.5)*8*shake,(Math.random()-.5)*8*shake);
  const R=room();
  ctx.drawImage(R.bg,0,0,W,H);
  const items=R.objs.filter(o=>o.draw&&visO(o)).map(o=>({y:o.solid?o.y+o.h:-1,f:()=>o.draw(ctx,o)}));
  if(!T.hide)items.push({y:player.y,f:()=>{drawPlayer();if(chapter===3&&T.held!=null)drawHeld()}});
  if(T.dop&&(roomId==='hallR'||roomId==='hallM')){const d=T.h[0];items.push({y:d[2],f:()=>{const sv=[player.x,player.y,player.dir];player.x=640-d[1];player.y=d[2];player.dir=sv[2]==='left'?'right':sv[2]==='right'?'left':sv[2];ctx.save();ctx.globalAlpha=.7;ctx.filter='hue-rotate(160deg) brightness(1.4)';drawPlayer();ctx.restore();player.x=sv[0];player.y=sv[1];player.dir=sv[2]}})}
  items.sort((a,b)=>a.y-b.y);
  items.forEach(i=>i.f());
  if(ghost.on&&ghostRoom())drawGhost();
  if(redMode){ctx.fillStyle='rgba(170,0,0,.3)';ctx.fillRect(0,0,W,H)}

  dx.globalCompositeOperation='source-over';
  dx.clearRect(0,0,W,H);
  dx.fillStyle='rgba(4,3,9,'+(lightsOut>0?1:.94)+')';dx.fillRect(0,0,W,H);
  dx.globalCompositeOperation='destination-out';
  if(lightsOut<=0){
    const fl=1+Math.sin(time*13)*.02+Math.sin(time*5.1)*.03+(Math.random()-.5)*.02;
    lightAt(player.x,player.y-16,playerLightR()*fl,1);
    for(const L of R.lights())lightAt(L.x,L.y,L.r*(1+Math.sin(time*9+L.x)*.025),L.a);
  }
  dx.globalCompositeOperation='source-over';
  ctx.drawImage(dk,0,0,W,H);

  if(lightsOut<=0){
    ctx.globalCompositeOperation='lighter';
    for(const L of R.lights()){
      const col=L.col||'255,170,70',g=ctx.createRadialGradient(L.x,L.y,2,L.x,L.y,L.r*.7);
      g.addColorStop(0,'rgba('+col+',.13)');g.addColorStop(1,'rgba('+col+',0)');
      ctx.fillStyle=g;ctx.fillRect(L.x-L.r,L.y-L.r,L.r*2,L.r*2);
    }
    ctx.globalCompositeOperation='source-over';
  }

  if(ghost.on&&ghostRoom()&&ghost.a>.25){
    ctx.save();ctx.shadowColor='#ff3030';ctx.shadowBlur=10;ctx.fillStyle='rgba(255,235,225,'+Math.min(.95,ghost.a)+')';
    ctx.beginPath();ctx.ellipse(ghost.x-5,ghost.y-16,1.7,2.6,0,0,6.3);ctx.fill();
    ctx.beginPath();ctx.ellipse(ghost.x+5,ghost.y-16,1.7,2.6,0,0,6.3);ctx.fill();
    ctx.restore();
  }

  ctx.drawImage(vig,0,0,W,H);
  if(T.fig>0){ctx.save();ctx.globalAlpha=Math.min(.85,T.fig*.5);ctx.fillStyle='#000';const fx=player.x-34,fy=player.y;ctx.beginPath();ctx.ellipse(fx,fy-60,9,12,0,0,6.3);ctx.fill();ctx.fillRect(fx-11,fy-50,22,52);ctx.fillRect(fx-16,fy-48,5,40);ctx.fillRect(fx+11,fy-48,5,40);ctx.restore()}
  if(ghost.on&&ghostRoom()){
    const d=Math.hypot(player.x-ghost.x,player.y-14-ghost.y);
    if(d<190){
      const a=(1-d/190)*.45,g=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);
      g.addColorStop(0,'rgba(120,0,0,0)');g.addColorStop(1,'rgba(150,0,0,'+a+')');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }
  }
  if(flash>0){ctx.fillStyle='rgba(190,0,0,'+(flash*.6)+')';ctx.fillRect(0,0,W,H)}
  if(near&&mode==='play'){
    const t='[E] '+labelOf(near);
    ctx.font='12px "Palatino Linotype",Georgia,serif';ctx.textAlign='center';
    const tw=ctx.measureText(t).width+16,px=clamp(player.x,tw/2+4,W-tw/2-4),py=Math.max(26,player.y-48);
    ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(px-tw/2,py-13,tw,19);
    ctx.strokeStyle='rgba(196,56,43,.9)';ctx.lineWidth=1;ctx.strokeRect(px-tw/2+.5,py-12.5,tw-1,18);
    ctx.fillStyle='#ebe3d3';ctx.fillText(t,px,py+1);
  }
  if(roomT>0&&mode!=='title'){
    ctx.globalAlpha=clamp(roomT,0,1);ctx.font='italic 22px "Palatino Linotype",Georgia,serif';ctx.textAlign='center';
    ctx.fillStyle='#ebe3d3';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(R.name,W/2,H/2-96);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  ctx.restore();
  if(fade>0){ctx.fillStyle='rgba(0,0,0,'+fade+')';ctx.fillRect(0,0,W,H)}
}

/* ================= INPUT ================= */
function handleKey(code){
  if(code==='KeyM'){toggleMute();return}
  if(mode==='title'){if(code==='Enter')start();return}
  if(mode==='reveal'){if(code==='Escape'||code==='Enter'||code==='Space')RV.t=Math.max(RV.t,12.4);return}
  if(mode==='intro'){if(code==='Escape')endIntro();else if(code==='Enter'||code==='Space'||code==='KeyE')nextCard();return}
  if(mode==='over'||mode==='win'){if(code==='Enter')start(true);return}
  if(mode==='modal'){if(modal)modal.key(code);return}
  if(mode==='play'){
    if(code==='KeyE')interact();
    else if(code==='KeyH')hint();
    else if(code==='KeyR'&&chapter===3){redMode=!redMode;sfx.light();say(redMode?'Emergency lighting on.':'Normal lighting restored.',2)}
    else if(code==='KeyJ'||code==='Tab')openJournal();
    else if(code==='Escape'||code==='KeyP')openMenu();
  }
}
const GAMEKEYS=['KeyW','KeyA','KeyS','KeyD','KeyE','KeyH','KeyJ','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(GAMEKEYS.includes(e.code)&&mode!=='title')e.preventDefault();
  keys[e.code]=true;
  if(!e.repeat)handleKey(e.code);
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});

$('bStart').onclick=()=>start();$('bAgain').onclick=()=>start(true);
$('bHint').onclick=e=>{e.currentTarget.blur();if(mode==='play')hint()};
$('bJournal').onclick=e=>{e.currentTarget.blur();if(mode==='play')openJournal();else if(modal&&modal.id==='journal')closeModal()};
$('bSound').onclick=e=>{e.currentTarget.blur();initAudio();toggleMute()};
$('noteX').onclick=closeModal;$('jX').onclick=closeModal;$('safeX').onclick=closeModal;
$('clkM').onclick=()=>clkTurn(-1);$('clkP').onclick=()=>clkTurn(1);$('clkSet').onclick=setClock;
$('safeTry').onclick=trySafe;
document.querySelectorAll('[data-hold]').forEach(b=>{
  const k=b.dataset.hold;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{keys[k]=false}));
});
document.querySelectorAll('[data-tap]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();handleKey(b.dataset.tap)});
});

/* ================= INTRO ================= */
const V=(file,rate,pitch,shake,gap,say)=>({file,rate,pitch,shake,gap,say});
const CARDS=[
  ['VOICEMAIL // 3 DAYS AGO','"Hey, it\u2019s Mara. I\u2019m at the old Vane estate. The research I told you about... it\u2019s bigger than I thought. Come if you can. Bring a lantern, the power out here is..."\n\n[message ends]',
    V('audio/mara1.mp3',.95,1.05,0,320,[["Hey, it's Mara.",1],["I'm at the old Vane estate.",1],["The research I told you about... it's bigger than I thought.",1],["Come if you can. Bring a lantern. The power out here is...",.92]]),55],
  ['VOICEMAIL // YESTERDAY','"Don\u2019t trust the lock. Whatever you do, don\u2019t trust the lock. I keep seeing you at the gate. That can\u2019t be right. Can it?"\n\n[message ends]',
    V('audio/mara2.mp3',1.12,1.25,.03,150,[["Don't trust the lock.",1],["Whatever you do, don't trust the lock.",1.1],["I keep seeing you at the gate.",1],["That can't be right.",1.1],["Can it?",.85]]),48],
  ['VOICEMAIL // 20 MINUTES AGO','"Please don\u2019t come in. Please. I can hear you in the hall. That\u2019s not possible. You\u2019re not here yet. You\u2019re not here yet!"\n\n[message ends]',
    V('audio/mara3.mp3',1.3,1.5,.05,70,[["Please don't come in.",1.1],["Please.",.85],["I can hear you in the hall.",1.2],["That's not possible.",1.3],["You're not here yet.",1.2],["You're not here yet!",1.45]]),40],
  ['GATE CAMERA // 19:42','Dusk. The Vane estate waits at the end of a drive you feel you have walked before. The iron gate is already open.'],
  ['GATE CAMERA // 19:58 // CYCLE 04','The front door closes behind you. The bolt slides home on its own.'],
  ['RECORDING CONTINUES','\u00a0']
];
/* voice-over: recorded files if present, otherwise the browser voice, more frightened each message */
let voiceOn=true,VA=null,vq=0;
function stopVoice(){vq++;try{speechSynthesis.cancel()}catch(e){}if(VA){VA.pause();VA=null}}
function pickVoice(){
  let v=[];try{v=speechSynthesis.getVoices()}catch(e){}
  return v.find(x=>/^en/i.test(x.lang)&&/(female|zira|samantha|susan|hazel|aria|jenny|karen|moira|victoria|google uk english female)/i.test(x.name))||v.find(x=>/^en/i.test(x.lang))||null;
}
function speak(cfg){
  stopVoice();const id=vq;
  if(muted||!voiceOn||!cfg)return;
  noise(.35,.12,2500);
  let used=false;
  const tts=()=>{
    if(used||!('speechSynthesis' in window))return;used=true;
    let i=0;
    const next=()=>{
      if(id!==vq||i>=cfg.say.length)return;
      const u=new SpeechSynthesisUtterance(cfg.say[i][0]),vo=pickVoice();
      if(vo)u.voice=vo;u.lang='en-US';u.rate=cfg.rate*cfg.say[i][1];u.pitch=Math.min(2,cfg.pitch+i*cfg.shake);u.volume=Math.min(1,vol*1.1);
      u.onend=()=>{i++;setTimeout(next,cfg.gap)};speechSynthesis.speak(u);
    };
    next();
  };
  try{const a=new Audio(cfg.file);a.volume=vol;VA=a;a.onerror=tts;a.play().catch(tts)}catch(e){tts()}
}
let I={i:-1,t:null,full:'',pos:0};
let DECK=null,DONE=null;
function runIntro(deck,done){DECK=deck||CARDS;DONE=done||null;
  mode='intro';I={i:-1,t:null,full:'',pos:0};
  let el=$('intro');
  if(!el){
    el=document.createElement('div');el.id='intro';
    el.style.cssText='position:absolute;inset:0;z-index:8;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6%;text-align:center;cursor:pointer';
    el.innerHTML='<div id="iHead" style="font:700 clamp(11px,2vw,14px) \'Courier New\',monospace;letter-spacing:.14em;color:#6fbf8a;margin-bottom:1.4em"></div><div id="iBody" style="font:italic clamp(16px,3vw,26px)/1.6 Georgia,serif;color:#eee3cf;max-width:30em;min-height:6em;white-space:pre-line"></div><div style="position:absolute;bottom:4%;font:13px system-ui,sans-serif;color:#8a8070">Click or press Enter to continue. Esc to skip.</div>';
    $('view').appendChild(el);el.onclick=nextCard;
  }
  el.style.display='flex';nextCard();
}
function nextCard(){
  if(I.t){clearInterval(I.t);I.t=null;$('iBody').textContent=I.full;return}
  I.i++;
  if(I.i>=DECK.length){endIntro();return}
  I.full=DECK[I.i][1];I.pos=0;$('iHead').textContent=DECK[I.i][0];$('iBody').textContent='';
  I.t=setInterval(()=>{I.pos++;$('iBody').textContent=I.full.slice(0,I.pos);if(I.pos>=I.full.length){clearInterval(I.t);I.t=null}},DECK[I.i][3]||30);
  speak(DECK[I.i][2]);
}
function endIntro(){stopVoice();
  if(I.t){clearInterval(I.t);I.t=null}
  const el=$('intro');if(el)el.style.display='none';
  if(DONE){const f=DONE;DONE=null;f()}else beginPlay();
}

/* ================= MENU, SAVE, OPTIONS ================= */
function toast(t){
  let el=$('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:absolute;right:12px;top:12px;padding:6px 14px;background:rgba(13,10,16,.88);border:1px solid var(--line);border-radius:999px;font:600 12px var(--ui);color:var(--gold);letter-spacing:.06em;text-transform:uppercase;opacity:0;transition:opacity .4s;pointer-events:none;z-index:6';$('view').appendChild(el)}
  el.textContent=t;el.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.style.opacity=0},2600);
}
function saveGame(n,x){try{localStorage.setItem('hm',JSON.stringify(Object.assign({c:n,n:notes},x||{})));toast('Checkpoint saved')}catch(e){}}
function cpLabel(c){return c===8?'The Maze':c===7?'Cycle 02':'Stage '+c+': '+STN[c-1]}
function refreshContinue(){let ok=false,lab='';try{const d=JSON.parse(localStorage.getItem('hm'));ok=!!(d&&d.c>1);if(ok)lab=cpLabel(d.c)}catch(e){}$('bContinue').hidden=!ok;if(ok)$('bContinue').textContent='Continue: '+lab;refreshTitleExtras()}
function continueGame(){
  let d=null;try{d=JSON.parse(localStorage.getItem('hm'))}catch(e){}
  if(!d||!(d.c>1)){start();return}
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  reset();notes=Array.isArray(d.n)?d.n:[];mode='play';initAudio();
  if(d.c===7){if(d.w){notes=Array.isArray(d.jb)?d.jb.slice():[];startCycle2(true)}else startCycle2();return}
  if(d.c===8){startMaze();return}
  beginStage(d.c);updateHUD();
}
function openMenu(){
  if(mode!=='play')return;
  $('vol').value=Math.round(vol*100);$('bSound').textContent='Sound: '+(muted?'off':'on');$('bVoice').textContent='Voice-over: '+(voiceOn?'on':'off');
  openModal('menu',c=>{if(c==='Escape'||c==='KeyP')closeModal()});
}
function restartStage(){
  closeModal();$('over').classList.remove('on');
  if(chapter===1)start(true);else if(chapter===7)startCycle2(!!T.wiped&&!T.jok);else if(chapter===8)startMaze(true);else{mode='play';beginStage(chapter)}
}
function quitToTitle(){
  closeModal();['over','win'].forEach(i=>$(i).classList.remove('on'));$('msg').classList.remove('show');
  reset();mode='title';$('title').classList.add('on');
}
$('bMenu').onclick=e=>{e.currentTarget.blur();if(mode==='play')openMenu();else if(modal&&modal.id==='menu')closeModal()};
$('mResume').onclick=closeModal;$('mStage').onclick=restartStage;$('mQuit').onclick=quitToTitle;$('bQuit2').onclick=quitToTitle;
$('bVoice').onclick=e=>{e.currentTarget.blur();voiceOn=!voiceOn;e.currentTarget.textContent='Voice-over: '+(voiceOn?'on':'off');if(!voiceOn)stopVoice()};
$('bRetry').onclick=restartStage;$('bContinue').onclick=continueGame;
$('vol').oninput=e=>{vol=e.target.value/100;if(master&&!muted)master.gain.value=vol};

/* ================= LOOP ================= */
reset();
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  update(dt);draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
