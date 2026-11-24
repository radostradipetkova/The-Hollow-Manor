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
    botObj(0,70,24),botObj(2,200,24,'red'),botObj(1,500,296),
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

