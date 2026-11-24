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

