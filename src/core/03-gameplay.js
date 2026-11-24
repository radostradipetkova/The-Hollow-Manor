/* ================= GAME LOGIC ================= */
function start(skip){
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  if(modal){$(modal.id).classList.remove('on')}
  try{localStorage.removeItem(SAVE_KEY)}catch(e){}
  lastSaveJson='';reset();initAudio();
  if(skip===true){beginPlay();return}
  runIntro();
}
function beginPlay(){mode='play';fade=1;say('The front door slammed behind you and the bolt slid home. There must be another way out.',6);saveGame()}
function changeRoom(to,sx,sy){
  sfx.door();roomId=to;if(to==='whisper')T.heard=true;if(to==='playroom')T.playIn=true;if(to==='seance')T.seIn=true;if(to==='archive'&&T.port&&T.heard&&!T.face){T.face=true;setTimeout(()=>{say('A sixth portrait hangs among the Vanes. The face in the frame is yours.',6);sfx.scare();lightsOut=.4},700)}player.x=sx;player.y=sy;unstick();fade=1;roomT=2.5;
  ghost.on=false;ghost.timer=GH.includes(to)?5:Infinity;doorCool=.6;
  if(to==='foyer')say('The hall is quiet. Nothing has ever followed you here.',3);
  saveGame();
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
  if(!near){if(chapter===3&&T.held!=null){dropBottle();saveGame();return}examineCandle();return}
  near.act();saveGame();
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

