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
