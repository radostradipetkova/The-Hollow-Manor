/* ===== Stage 3 extras: The Pressure Valves and The Missing Experiment ===== */
const LOGX='LABORATORY LOG, Dr. Vane\n\nExp 1: Rig 2, 01:00, bed 9. Patient: "I remember my mother\u2019s name."\nExp 2: Rig 4, 03:00, bed 8. Patient: "I remember the garden. Then I do not."\nExp 3: Rig 6, 05:00, bed 7. Patient: "Who is the woman at the window?"\nExp 4: [PAGE TORN OUT]\nExp 5: Rig 10, 09:00, bed 5. Patient: "I am not afraid anymore."\nExp 6: Rig 12, 11:00, bed 4. Patient: "Please stop. I know the way out."\n\nThe rigs, the hours and the beds each follow their own simple pattern. Fill in Experiment 4.';
const EXP4='The missing page is restored, in ink:\n\nExp 4: Rig 8, 07:00, bed 6.\nSubject: your own name, in your own handwriting.\nResult: consciousness copied, memory stored, subject returned to the gate for the next cycle.\n\nIt is dated three nights ago.';
const VEC=[[1,-1,0,0],[0,1,-1,0],[0,0,1,-1],[-1,0,0,1]],lv=()=>T.lv||(T.lv=[7,3,6,4]);
const paintTank=c=>{paintBase(c,{floor:'#2b3236',floor2:'#252b2f',wall:'#18262a',wall2:'#121c1f',trim:'#0c1416',stone:true});doorBottom(c,'#3a4a4c',false);doorLR(c,608,'#3a4a4c')};
const paintCon=c=>{paintBase(c,{floor:'#2a2a30',floor2:'#242429',wall:'#1a1a20',wall2:'#131318',trim:'#0e0e12',stone:true});doorLR(c,0,'#3a4a4c')};
ROOMS.tanks={name:'The Pressure Room',paint:paintTank,lights:()=>[{x:320,y:100,r:230,a:.6}],objs:[
  ...[0,1,2,3].map(k=>({x:110+k*100,y:8,w:60,h:52,label:'Read the gauge',
    draw:(c,o)=>{const v=lv()[k];rect(c,o.x,o.y,o.w,o.h,'#3a4a4e');rect(c,o.x+6,o.y+6,o.w-12,o.h-12,'#10181a');const h=Math.max(0,Math.min(10,v))*3.6;rect(c,o.x+6,o.y+o.h-6-h,o.w-12,h,v===5?'#5fd35f':'#4aa0d0');c.fillStyle='#fff';c.font='bold 13px Georgia';c.textAlign='center';c.fillText('ABCD'[k]+': '+v,o.x+o.w/2,o.y+o.h+12)},
    act:()=>say('Tank '+'ABCD'[k]+' reads '+lv()[k]+'. The safe level is 5.',3)})),
  {x:520,y:8,w:64,h:48,label:'Read the sign',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8d2c0');c.fillStyle='#222';c.font='bold 12px Georgia';c.textAlign='center';c.fillText('SAFE: 5',o.x+32,o.y+28)},act:()=>say('"Safe pressure in all four tanks: 5. The containment door releases when the system is balanced."',5)},
  ...[0,1,2,3].map(i=>({x:125+i*100,y:150,w:34,h:34,solid:true,label:'Turn valve '+(i+1),
    draw:(c,o)=>{rect(c,o.x+14,o.y+18,6,16,'#4a4a50');c.strokeStyle='#c9a24a';c.lineWidth=3;c.beginPath();c.arc(o.x+17,o.y+14,12,0,6.3);c.stroke();c.beginPath();c.moveTo(o.x+5,o.y+14);c.lineTo(o.x+29,o.y+14);c.moveTo(o.x+17,o.y+2);c.lineTo(o.x+17,o.y+26);c.stroke();c.fillStyle='#fff';c.font='bold 11px Georgia';c.textAlign='center';c.fillText(i+1,o.x+17,o.y+50)},
    act:()=>{
      if(T.valves){say('The valves are locked open. The system is balanced.');return}
      const l=lv();VEC[i].forEach((d,k)=>{l[k]+=d});sfx.light();
      say('Valve '+(i+1)+' turns. Tank '+'ABCD'[i]+' rises and tank '+'ABCD'[(i+1)%4]+' falls.',3);
      if(l.every(v=>v===5)){T.valves=true;heal();sfx.solve();shake=.4;say('The pressure equalises with a long hiss. Somewhere east, the containment door unlocks.',6)}
    }})),
  {x:300,y:250,w:40,h:30,solid:true,label:'Pull the vent lever',draw:(c,o)=>{rect(c,o.x,o.y+10,o.w,20,'#4a4a50');rect(c,o.x+16,o.y,8,16,'#a03030')},act:()=>{if(T.valves){say('The vent is sealed.');return}T.lv=null;sfx.bad();say('Steam vents. All four tanks drop back to where they started.',4)}},
  D(296,336,48,16,'lab',320,310),
  D(586,170,22,60,'contain',70,210,()=>!T.valves,'The containment door is sealed until the pressure equalises.')]};
ROOMS.contain={name:'Containment',paint:paintCon,lights:()=>[{x:320,y:200,r:200,a:.6}],objs:[
  {x:250,y:190,w:100,h:44,solid:true,label:'Read the laboratory log',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3a3c');rect(c,o.x+28,o.y+10,44,24,'#d9ccab');c.fillStyle='#822';c.fillRect(o.x+66,o.y+14,6,16)},
    act:()=>{
      if(T.exp4){showNote('Experiment 4',EXP4);return}
      addNote('Laboratory log',LOGX);
      showNote('Laboratory log',LOGX,()=>openLogForm(()=>{T.exp4=true;heal();sfx.solve();shake=.5;addNote('Experiment 4',EXP4);showNote('Experiment 4',EXP4,()=>{sfx.scare();say('Your name. In your handwriting.',5)})},'Three dials: rig number, hour, bed number.'))
    }},
  {x:80,y:100,w:90,h:50,solid:true,label:'Examine the cot',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e50');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#8a8f94');rect(c,o.x+20,o.y+14,40,20,'#4a3b5c')},act:()=>say('A narrow cot with leather straps. A coat is draped across it. Your coat.',5)},
  D(32,170,22,60,'tanks',550,210)]};
ROOMS.lab.objs.push({x:288,y:344,w:64,h:36,draw:c=>doorBottom(c,'#3a4a4c',false)},D(296,336,48,16,'tanks',320,310,()=>!T.power,LK));
{const lk=ROOMS.observe.objs.find(o=>o.label==='Open the tape locker'),orig=lk.act;
 lk.act=()=>{if(!T.exp4){say('A label on the locker: "Tapes are released only after the Experiment 4 record is verified."',5);return}orig()}}
buildBG();
