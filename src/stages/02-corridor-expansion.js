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
