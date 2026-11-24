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
