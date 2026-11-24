/* ===== Stage 3: carry the bottles to the table and pour them into the beaker (no counters) ===== */
const BPOS0=[[70,24],[500,296],[200,24]],BLBL=['Acid. Handle with care.','Base. Clear as water.','Reagent. Yellow as old teeth.'];
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
    get vis(){return i===2?'red':undefined},when:()=>T.held!==i,label:()=>'Pick up bottle '+'ABC'[i],
    draw:(c,o)=>{rect(c,o.x+4,o.y,8,8,'#ccc');rect(c,o.x,o.y+8,16,22,BOT[i].c);c.fillStyle='#fff';c.font='bold 11px Georgia';c.textAlign='center';c.fillText('ABC'[i],o.x+8,o.y+24)},
    act:()=>pickBottle(i)})),
  {x:410,y:176,w:36,h:40,solid:true,label:'Empty the beaker',draw:(c,o)=>{rect(c,o.x,o.y+10,o.w,30,'#4a5256');rect(c,o.x+6,o.y+16,o.w-12,16,'#10181a')},act:()=>{if(T.ink){say('The beaker is not to be emptied. The mixture is working.',3);return}if(!(T.mix||[]).length){say('The beaker is already empty.',2);return}T.mix=[];sfx.light();say('You tip the beaker into the sink. It is empty again.',3)}},
  {x:290,y:170,w:110,h:50,solid:true,label:'Pour into the beaker',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a5256');rect(c,o.x,o.y,o.w,5,'#6a7478');c.fillStyle='rgba(0,0,0,.25)';c.fillRect(o.x,o.y+o.h-8,o.w,8);drawBeaker(c,{x:o.x+28,y:o.y+2})},act:pourBottle}
);
