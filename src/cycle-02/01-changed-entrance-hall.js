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
