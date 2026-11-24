/* ===== Cycle 02 continued: the Cell Block, the Listening Room and the Threshold ===== */
const CODES=['105','448','312','630'];
const CELLTX=[
  'Cell A. A cot with leather straps. On it, a coat: your coat. A name tag in your handwriting: SUBJECT 07-A.\n\nScratched into the wall: "I carried her out. Mara was so light."',
  'Cell B. A burned coat: your coat. A name tag in your handwriting: SUBJECT 07-B.\n\nScratched into the wall: "I broke it. It was holding something. I should have asked what."',
  'Cell C. A neatly made bed. On it, a coat: your coat. A name tag in your handwriting: SUBJECT 07-C.\n\nScratched into the wall: "I said yes. She sounded so relieved. Why was she relieved?"',
  'Cell D. An empty cot, still warm. A coat beside it: your coat. A name tag in your handwriting: SUBJECT 07-D.\n\nScratched into the wall: "I remembered. She talks to us at 91.7. Listen."'];
const FOUR='Four cots. Four coats. Four name tags in your own handwriting.\n\nEvery one of them was you, and every one of them believed they were the only one.';
const TRANS='Static. Then Mara\u2019s voice, calm and kind:\n\n"Say yes. Say yes, my love, and I can keep you. I cannot keep the ones who say no. I cannot keep the ones who break things. Say yes."\n\nThe same words, again and again, to four different copies of you.';
const hasNote=t=>notes.some(n=>n.title===t);
const paintX=(w,e)=>c=>{paintBase(c,{floor:'#232b2e',floor2:'#1e2528',wall:'#142024',wall2:'#0f181b',trim:'#0a1214',stone:true});if(w)doorLR(c,0,'#3a4a4c');if(e)doorLR(c,608,'#3a4a4c')};
ROOMS.ctrl2.objs.push({...D(586,170,22,60,'cells',70,210,()=>!T.ctrl,'The steel door is sealed. The recordings have not all played in the right order.'),draw:c=>doorLR(c,608,'#3a4a4c')});
ROOMS.cells={name:'The Cell Block',paint:paintX(1,1),lights:()=>[{x:320,y:90,r:230,a:.55,col:'120,200,220'}],objs:[
  ...[0,1,2,3].map(k=>({x:100+k*110,y:8,w:64,h:48,label:'Open cell '+'ABCD'[k],
    draw:(c,o)=>{const op=(T.cell||[])[k];rect(c,o.x,o.y,o.w,o.h,op?'#1a2226':'#2a3236');if(!op){c.fillStyle='#8a9aa0';for(let i=0;i<5;i++)c.fillRect(o.x+8+i*11,o.y+4,3,o.h-8)}else rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#05090a');c.fillStyle='#cfe';c.font='bold 12px Georgia';c.textAlign='center';c.fillText('ABCD'[k],o.x+o.w/2,o.y+o.h+12)},
    act:()=>{
      const cl=T.cell=T.cell||[false,false,false,false],L='ABCD'[k];
      if(cl[k]){say('Cell '+L+' stands open. Its belongings are in your journal.',3);return}
      openCellEntry(k,()=>{
        cl[k]=true;sfx.pick();addNote('Cell '+L,CELLTX[k]);T.tags=(T.tags||0)+1;updateHUD();
        if(cl.every(Boolean)){T.cells=true;heal();sfx.solve();shake=.4;addNote('Four of you',FOUR);showNote('Cell '+L,CELLTX[k],()=>showNote('Four of you',FOUR,()=>say('Somewhere ahead, a steel door unlocks.',5)))}
        else showNote('Cell '+L,CELLTX[k]);
      },'Enter the timestamp of this experiment\u2019s recording, without the colon.');
    }})),
  lockerO(44,270),lureO(520,280,'Rattle the bars','The bars ring out down the corridor. The thing turns toward the sound.'),
  D(32,170,22,60,'ctrl2',550,210),
  D(586,170,22,60,'radio',70,210,()=>!T.cells,'The steel door ahead stays sealed until every cell is open.')]};
ROOMS.radio={name:'The Listening Room',paint:paintX(1,1),lights:()=>[{x:320,y:200,r:150,a:.6}],objs:[
  {x:280,y:170,w:80,h:50,solid:true,label:'Tune the radio',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a2a');rect(c,o.x+8,o.y+8,o.w-16,18,'#10181a');c.fillStyle='#c9a24a';c.beginPath();c.arc(o.x+22,o.y+36,6,0,6.3);c.arc(o.x+58,o.y+36,6,0,6.3);c.fill();if(T.tuned){c.fillStyle='#5fd35f';c.fillRect(o.x+12,o.y+14,56,6)}},
    act:()=>{
      if(T.tuned){showNote('Mara\u2019s transmission',TRANS);return}
      openRadioTuner(()=>{T.tuned=true;heal();sfx.solve();addNote('Mara\u2019s transmission',TRANS);speak(V('audio/mara4.mp3',.9,1.1,.02,220,[["Say yes.",.9],["Say yes, my love.",.95],["And I can keep you.",.9]]));showNote('Mara\u2019s transmission',TRANS)});
    }},
  lockerO(560,110),lureO(70,280,'Bang on the pipes','The pipes clang like a bell. The thing lurches toward the noise.'),
  D(32,170,22,60,'cells',550,210),
  D(586,170,22,60,'thresh',70,210,()=>!T.tuned,'The door is dead. Perhaps the radio can wake it.')]};
const SEALS=[['COPIES','Four of you','Four coats, four name tags. Each of them sure they were the only one.'],['VOICE','Mara\u2019s transmission','She asked every one of them to say yes.'],['OBSERVER','The four experiments','Someone watched all of it from this side of the glass.']];
ROOMS.thresh={name:'The Threshold',paint:paintX(1,0),lights:()=>[{x:320,y:110,r:230,a:.65,col:'90,230,230'}],objs:[
  ...SEALS.map(([n,req,txt],k)=>({x:130+k*160,y:110,w:60,h:50,solid:true,label:'Touch the seal',
    draw:(c,o)=>{const on=(T.sl||[])[k];rect(c,o.x,o.y+14,o.w,36,'#3a4448');rect(c,o.x+6,o.y,o.w-12,18,'#4a5458');c.fillStyle=on?'#8af0b0':'#6a7a7e';c.font='bold 10px Georgia';c.textAlign='center';c.fillText(n,o.x+o.w/2,o.y+12);if(on){c.fillStyle='rgba(120,240,170,.5)';c.beginPath();c.arc(o.x+o.w/2,o.y+34,8,0,6.3);c.fill()}},
    act:()=>{
      const sl=T.sl=T.sl||[false,false,false];
      if(sl[k]){say('The seal glows. '+txt,3);return}
      if(!hasNote(req)){say('The seal stays dark. You have not understood this yet.',4);return}
      sl[k]=true;sfx.light();say('The seal accepts. '+txt,5);
      if(sl.every(Boolean)){T.seals3=true;heal();sfx.solve();shake=.5;setTimeout(()=>say('All three seals burn white. The machine door begins to open on its own.',6),1200)}
    }})),
  {x:290,y:8,w:60,h:52,label:'Open the machine door',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#0c1214');rect(c,o.x+4,o.y+4,o.w-8,o.h-4,T.seals3?'#1d3a3a':'#2a3438');if(T.seals3){c.fillStyle='rgba(120,230,230,.35)';c.fillRect(o.x+4,o.y+4,o.w-8,o.h-4)}},
    act:()=>{if(!T.seals3){say('Three seals hold the door shut.',4);return}playCards(C2END,quitToTitle)}},
  D(32,170,22,60,'radio',550,210)]};
function hint7(){
  let t;
  if(T.wiped&&!T.jok)t='Your journal is gone. Mara\u2019s note under the loose board in this hall says where you hid it from yourself. Look in the dining room, then the library.';
  else if(!(T.hand1&&T.hand2))t='Mara\u2019s note says the clock gave its hands away: one where the stories sleep (the library), one where guests were never fed (the dining room). Look for glints. Ghosts wander these rooms now: use lockers and noise.';
  else if(!T.diary2)t='The desk in the library holds a diary with a date that should not exist. It says when the clock must stop.';
  else if(!T.hall)t='Set the clock in the dining room to the time in the diary: the hour, then the minutes.';
  else if(!T.ctrl)t='The new door in the entrance hall leads to the control room. The monitors do not say which experiment they hold until they play. Replay the four recordings in order: 07-A, then B, then C, then D. A wrong one resets the run, but the screens remember which letter each one is.';
  else if(!T.cells)t='The steel door in the control room leads to the cells. Each cell opens with the timestamp of one recording, without the colon. Your journal lists them.';
  else if(!T.tuned)t='A cell wall mentions a frequency. Tune the radio in the Listening Room to it, without the decimal point.';
  else if(!T.seals3)t='Touch the three seals in the Threshold. Each one needs something you have already uncovered: the four of you, her voice, the observer. Then open the machine door.';
  else if(!T.talk)t='Face the machine.';
  else if(!T.mara)t='Speak to Mara in her glass cylinder.';
  else if(!T.placed)t='Four slots shaped like name tags wait at the base of the machine. You took a tag from each cell.';
  else t='Face the machine. It has nothing left to offer you. Then go down, and end it.';
  say('Hint: '+t,8);
}
