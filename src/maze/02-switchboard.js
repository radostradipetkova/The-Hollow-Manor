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
