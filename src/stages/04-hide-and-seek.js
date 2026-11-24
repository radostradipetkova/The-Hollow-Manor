/* ===== Side quest: The Hide-and-Seek Dolls (Stage 4, the Playroom) ===== */
const DOLL=[
  'A cloth doll with button eyes, found under the bed. A paper tag on its wrist, in a child\u2019s writing:\n\n"Round 1. Under the bed. My friend looked everywhere and never found me. So I told her where I was."',
  'A porcelain doll in a faded dress, found in the wardrobe. Its tag:\n\n"Round 2. In the wardrobe. She counted to twenty out loud. I counted her answers in my head."',
  'A knitted doll with one ear, found behind the curtain. Its tag:\n\n"Round 3. Behind the curtain. I could see her shoes. I knew they were not there."',
  'A wooden doll with a chipped nose, found in the toy box. Its tag:\n\n"Round 4. In the toy box. I stayed until it was dark. She did not come. I said she had won."',
  'A tiny doll in a red coat, found under the little table. Its tag:\n\n"Round 5. Under the table. This time I hid the best, and I let her find me. I pretended her voice was warm."'];
const GAME='Five dolls, five rounds of hide-and-seek. A lonely girl, and a friend who was never there. Each time she hid as well as she could, and each time she let the friend find her. Each time, the friend won.\n\nOn the back of the last doll\u2019s tag, in pencil:\n\n"When I make a real friend, I will hide where he cannot find me, so that he has to come looking. Tell him I was easy to find."';
const GAME_CARD=['MEMORY RESTORED // THE GAME','She hid five dolls around the house and played seeker with a friend who was not there. When she found them all, she said the friend had won. She always let you win.',null,38];
const rememberDeck=()=>hasNote('The game of hide-and-seek')?[REMEMBER_CARDS[0],GAME_CARD,...REMEMBER_CARDS.slice(1)]:REMEMBER_CARDS;
function dollAct(i){
  const d=T.dolls=T.dolls||[0,0,0,0,0];
  if(d[i]){
    if(T.thud&&!T.sixth){
      if(i===1&&!T.drawing){T.drawing=true;addNote('The drawing',DRAW);showNote('The drawing',DRAW);return}
      say(EMPTYSPOT[i],4);return}
    say('The hiding place is empty now. Its doll sits on the shelf.',3);return}
  d[i]=1;sfx.pick();addNote('Doll '+(i+1)+' of 5',DOLL[i]);updateHUD();
  if(d.every(Boolean)){T.dollsDone=true;heal();sfx.solve();addNote('The game of hide-and-seek',GAME);showNote('The game of hide-and-seek',GAME,afterFifth)}
  else showNote('Doll '+(i+1)+' of 5',DOLL[i]);
}
const paintPlay=c=>{paintBase(c,{floor:'#4a3a3a',floor2:'#523f40',wall:'#5a4a5f',wall2:'#443847',trim:'#33283a'});c.fillStyle='rgba(255,220,240,.07)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);rect(c,230,170,180,110,'#3a2a44');c.strokeStyle='#8a6a8a';c.strokeRect(238.5,178.5,163,93);doorTop(c,'#6a4a5a')};
ROOMS.playroom={name:'The Playroom',paint:paintPlay,lights:()=>[{x:320,y:200,r:210,a:.6}],objs:[
  {x:200,y:8,w:90,h:48,label:'Read the paper sign',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#efe6d4');c.fillStyle='#b04a3a';c.font='bold 10px Georgia';c.textAlign='center';c.fillText('HIDE AND SEEK',o.x+45,o.y+20);c.font='9px Georgia';c.fillText('five of us are hiding',o.x+45,o.y+34)},
    act:()=>say('A paper sign in crayon: "HIDE AND SEEK. Five of us are hiding. Come and find us." Underneath, smaller: "Look where a small girl would wait."',8)},
  {x:80,y:70,w:100,h:50,solid:true,label:'Look under the bed',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,o.h-14,'#6a4a5a');rect(c,o.x+4,o.y+4,o.w-8,18,'#d8c8d8');rect(c,o.x+6,o.y+6,28,12,'#efe6ef');rect(c,o.x,o.y+o.h-6,o.w,6,'#2a1a24')},act:()=>dollAct(0)},
  {x:230,y:64,w:70,h:50,solid:true,label:'Open the wardrobe',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a4a30');rect(c,o.x+4,o.y+4,30,o.h-8,'#5a3a24');rect(c,o.x+36,o.y+4,30,o.h-8,'#5a3a24');rect(c,o.x+30,o.y+22,3,6,'#c9a24a');rect(c,o.x+37,o.y+22,3,6,'#c9a24a')},act:()=>dollAct(1)},
  {x:440,y:8,w:80,h:52,label:'Look behind the curtain',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#1a2434');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#0b1424');rect(c,o.x,o.y,22,o.h,'#8a4a5a');rect(c,o.x+o.w-22,o.y,22,o.h,'#8a4a5a')},act:()=>dollAct(2)},
  {x:480,y:290,w:70,h:40,solid:true,label:'Open the toy box',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a6a8a');rect(c,o.x,o.y,o.w,8,'#5a7a9a');rect(c,o.x+30,o.y+14,10,8,'#c9a24a')},act:()=>dollAct(3)},
  {x:100,y:250,w:80,h:40,solid:true,label:'Look under the little table',draw:(c,o)=>{rect(c,o.x,o.y,o.w,10,'#8a6a4a');rect(c,o.x+6,o.y+10,6,28,'#6a4a30');rect(c,o.x+o.w-12,o.y+10,6,28,'#6a4a30');rect(c,o.x+10,o.y+2,60,6,'#d8d0c0')},act:()=>dollAct(4)},
  {x:330,y:8,w:90,h:48,label:'Look at the shelf',draw:(c,o)=>{rect(c,o.x,o.y+30,o.w,6,'#6a4a30');const d=T.dolls||[];for(let i=0;i<5;i++){if(d[i]){c.fillStyle=['#d8c8a0','#e8dcd0','#c0b0a0','#a08060','#c03a3a'][i];c.beginPath();c.arc(o.x+10+i*17,o.y+20,5,0,6.3);c.fill();c.fillRect(o.x+6+i*17,o.y+24,8,6)}}},
    act:()=>say('A shelf with five small gaps. '+((T.dolls||[]).filter(Boolean).length)+' of 5 dolls sit in them.',4)},
  D(292,64,56,20,'nursery',320,310)]};
ROOMS.nursery.objs.push({...D(296,336,48,16,'playroom',320,110),draw:c=>doorBottom(c,'#6a4a5a',false)});
/* ===== Hide and Seek, Round 6: the sixth player ===== */
const EMPTYSPOT=['Nothing under the bed but dust, and the feeling of being counted.','Empty. The wardrobe door creaks, as if it expected someone else.','Only curtain and cold glass. Not here.','Just toys. Something is still missing.','Nothing under the table. Someone has been here recently.'];
const DRAW='Behind the wardrobe, a child\u2019s drawing: six children holding hands. Five have their names written underneath. The sixth has no face.\n\nUnder it, in crayon:\n\n"Why are you looking for yourself?"';
const ROUND6='Hide and Seek, Round 6.\n\nFive dolls on the shelf. A sixth space, empty.\n\n"There you are."\n"Found you."\n\nThe sixth player was never a doll.';
function thud(){noise(.45,.7,260);tone(48,.9,'sine',.7,-18);tone(90,.4,'triangle',.4,-40)}
function afterFifth(){
  const TT=T;say('Five dolls found.',2.4);
  setTimeout(()=>{if(T!==TT)return;thud();shake=.8;T.thud=true;T.thudAt=time;say('"That\u2019s five."',2.6);
    setTimeout(()=>{if(T!==TT)return;say('"But we were six."',4.5);T.obj='Find the sixth player';updateHUD()},2800)},2400);
}
function sixthScare(){
  const TT=T;T.sixth=true;T.obj=null;updateHUD();say('"There you are."',3);
  setTimeout(()=>{if(T!==TT)return;thud();sfx.door();shake=1;lightsOut=3.6;T.doorShut=true},1300);
  setTimeout(()=>{if(T!==TT)return;speak(V('audio/child.mp3',1,1.9,0,100,[["Found you.",.9]]));say('"Found you."',3)},2900);
  setTimeout(()=>{if(T!==TT)return;T.doorShut=false;addNote('Round 6',ROUND6);say('The lights return. The door is open. The five dolls sit exactly where they were. On the shelf there is now a sixth space, and it is empty.',8)},5000);
}
ROOMS.playroom.objs.push({x:540,y:100,w:44,h:76,solid:true,label:'Look in the mirror',
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a7a5a');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#1c2c32');const rx=o.x+o.w/2,ry=o.y+o.h-10;c.globalAlpha=.8;rect(c,rx-7,ry-26,14,18,'#4a3b5c');c.fillStyle='#d6b79c';c.beginPath();c.arc(rx,ry-32,6,0,6.3);c.fill();c.globalAlpha=1},
  act:()=>{
    if(T.sixth){say('Your reflection looks back at you, a moment too late.',4);return}
    if(!T.thud){say('A tall mirror. Your reflection looks tired.',4);return}
    if(!(T.drawing||time-T.thudAt>40)){say('Your reflection looks back at you, a moment too late. Not here, you tell yourself. Keep looking.',5);return}
    sixthScare();
  }});
{const pd=ROOMS.playroom.objs.find(o=>o.door);pd.lock=()=>T.doorShut;pd.lockMsg='The door has slammed shut.'}
{const sh=ROOMS.playroom.objs.find(o=>o.label==='Look at the shelf');
 sh.draw=(c,o)=>{rect(c,o.x,o.y+30,o.w,6,'#6a4a30');const d=T.dolls||[];for(let i=0;i<5;i++){if(d[i]){c.fillStyle=['#d8c8a0','#e8dcd0','#c0b0a0','#a08060','#c03a3a'][i];c.beginPath();c.arc(o.x+10+i*14,o.y+20,4.5,0,6.3);c.fill();c.fillRect(o.x+6+i*14,o.y+23,8,7)}}if(T.sixth){c.strokeStyle='rgba(235,225,240,.55)';c.lineWidth=1;c.strokeRect(o.x+74,o.y+16,10,14)}};
 sh.act=()=>say(T.sixth?'A shelf with six small gaps. Five dolls sit in them. The sixth space is empty.':'A shelf with five small gaps. '+((T.dolls||[]).filter(Boolean).length)+' of 5 dolls sit in them.',5)}
/* a faint glow marks the Playroom door until the player has been inside */
{const nl2=ROOMS.nursery.lights;ROOMS.nursery.lights=()=>[...nl2(),...(T.playIn?[]:[{x:320,y:350,r:70,a:.35}])]}
