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
