/* ================= STAGE 2: THE FORGOTTEN WING ================= */
const FAM=[{n:'Elara Vane',s:1},{n:'Gideon Vane',s:3},{n:'Wren Vane',s:2},{n:'Aldric Vane',s:0},{n:'Margaret Vane',s:4}];
const CN='The dark doors only lead in circles. The house moves them whenever you look away.\n\nFollow the light three times.';
const REG='Vane family register (water-stained)\n\nGideon Vane: born 1802.\nMargaret, his wife: seven years younger than Gideon.\nAldric, their son: born the year Margaret turned forty.\nElara, his bride: twelve years younger than Aldric.\nWren, their only child: born in 1889.\n\nHang them eldest first, from left to right, by swapping the frames on the wall, and the wall will give up what it keeps.';
const RHYME2='Tell it twice and it is true,\nA single word is lying to you.\nKeep them in the order they came,\nThen dial them into the hidden frame.';
const VOICE='Seven... two... seven... nine... four... nine... five... two... eight...';
let corr={xs:[110,310,510],good:0};
function setupCorr(){corr.xs=[90,200,310,420,530].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a-b);corr.good=Math.floor(Math.random()*3)}
function corrPick(i){
  if(i===corr.good){
    T.route++;
    if(T.route>=3){changeRoom('archive',320,300);say('The last door opens onto a long gallery. Behind you, the corridor is gone.',5);return}
    say('The corridor shifts as you pass. The doors have moved.',3.5);
  }else{T.route=0;say('You step through and find yourself back where you started. Was the corridor always this long?',4.5)}
  sfx.door();setupCorr();fade=1;player.x=320;player.y=310;doorCool=.6;
}
const cdoor=i=>({door:true,get x(){return corr.xs[i]-28},y:64,w:56,h:20,fn:()=>corrPick(i),
  draw:(c,o)=>{rect(c,o.x,8,56,56,'#150c08');rect(c,o.x+4,12,48,52,'#33231a');rect(c,o.x+44,40,3,3,'#c9a24a');rect(c,o.x+26,16,4,8,'#4a4a4e');if(corr.good===i)flame(c,o.x+28,16,1.1)}});
function paintCorr(c){paintBase(c,{floor:'#2a2420',floor2:'#302a25',wall:'#1f1a1d',wall2:'#19151a',trim:'#120e11'});c.fillStyle='rgba(0,0,0,.3)';for(let x=60;x<600;x+=90)c.fillRect(x,64,40,288)}
function paintArchive(c){paintBase(c,{floor:'#2c2420',floor2:'#33291f',wall:'#251c20',wall2:'#1d1619',trim:'#150f12'});rect(c,160,150,320,150,'#26141c');c.strokeStyle='#6a4a30';c.lineWidth=1.2;c.strokeRect(168.5,158.5,303,133);doorLR(c,0,'#4a2e1a')}
function paintWhisper(c){paintBase(c,{floor:'#3a3030',floor2:'#40342f',wall:'#3a3544',wall2:'#2e2a38',trim:'#211d29'});c.fillStyle='rgba(200,190,230,.08)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);doorLR(c,608,'#5a4a3a')}
const STAGE2={
  corr:{name:'The Forgotten Corridor',paint:paintCorr,lights:()=>[{x:corr.xs[corr.good],y:30,r:75,a:.9}],objs:[cdoor(0),cdoor(1),cdoor(2),
    {x:34,y:180,w:14,h:26,label:'Read the note',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#d9ccab'),act:()=>{addNote('Pinned note',CN);showNote('Pinned note',CN)}}]},
  archive:{name:'The Gallery',paint:paintArchive,lights:()=>[{x:320,y:90,r:230,a:.6},{x:146,y:222,r:75,a:.85}],objs:[
    ...FAM.map((f,k)=>({x:100+k*88,y:4,w:56,h:56,label:'Read the plate',act:()=>say('Frame '+(k+1)+': '+f.n+'.',3),
      draw:(c,o)=>{drawPortrait(c,o,f.s);c.fillStyle='#e5c279';c.font='bold 10px Georgia';c.textAlign='left';c.fillText(k+1,o.x+4,o.y+14)}})),
    {x:540,y:4,w:48,h:56,label:'Look closer',draw:(c,o)=>{if(T.face)drawPortrait(c,o,5)},act:()=>say(T.face?'The painted eyes follow you. You feel it knows your name.':'A bare patch of wall. Faint hooks, as if a frame once hung here.',5)},
    {x:96,y:200,w:100,h:44,solid:true,label:'Read the register',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3020');rect(c,o.x,o.y,o.w,6,'#5e3f2a');rect(c,o.x+30,o.y+12,34,22,'#d9ccab')},
      act:()=>{if(!T.reg){T.reg=true;sfx.pick();addNote('Vane register',REG)}showNote('Vane register',REG)}},
    {x:290,y:96,w:60,h:30,solid:true,label:'Rearrange the frames',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a3d42');rect(c,o.x+8,o.y+8,44,14,'#2a2c30');for(let i=0;i<5;i++)rect(c,o.x+11+i*8,o.y+12,5,6,T.port?'#e5c279':'#8a8d92')},
      act:()=>{if(T.port){say('The mechanism is spent. The frames hang in their true order.');return}openDial('The frame mechanism',5,'25413',portOk,'Five dials. Enter the frame numbers, eldest first.')}},
    {x:586,y:170,w:22,h:60,label:'Examine the wall',draw:c=>{if(T.door){rect(c,608,166,32,68,'#030208');for(let i=0;i<5;i++)rect(c,612,172+i*12,24-i*3,2,'#1a1a22')}else{c.fillStyle='rgba(255,255,255,.08)';c.fillRect(608,166,1,68);c.fillRect(639,166,1,68);c.fillRect(608,166,32,1)}},
      act:()=>{if(T.door)return;openDial('The hidden lock',3,'729',doorOk,'Three dials. The wall has no handle, only a lock.')}},
    D(32,170,22,60,'whisper',550,210)]},
  whisper:{name:'The Whispering Room',paint:paintWhisper,lights:()=>[{x:320,y:200,r:110,a:.6}],objs:[
    {x:290,y:170,w:44,h:44,solid:true,label:'Listen',draw:(c,o)=>{rect(c,o.x+8,o.y+22,28,18,'#5a4030');c.fillStyle='#d6b79c';c.beginPath();c.arc(o.x+22,o.y+12,10,0,6.3);c.fill();rect(c,o.x+17,o.y+10,3,3,'#111');rect(c,o.x+25,o.y+10,3,3,'#111')},
      act:()=>{sfx.bad();say('The doll\u2019s lips do not move, yet a voice whispers: "'+VOICE+'" Then it begins again.',9)}},
    {x:80,y:90,w:90,h:50,solid:true,label:'Examine',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a3a30');rect(c,o.x+4,o.y+4,o.w-8,o.h-12,'#2a2028')},act:()=>say('A small crib. The blanket is still warm.',4)},
    D(586,170,22,60,'archive',70,210)]}
};

