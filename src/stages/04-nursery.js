/* ================= STAGE 4: THE NURSERY ================= */
const SCR=['The song begins on MI, the third step of the ladder.','Then it tumbles down to DO, the first step.','Then it climbs high to SOL, the fifth step. On the back, a little drawing: five candles in a ring.','And it goes to sleep where it began, on DO.'];
const FRG=['Wren\u2019s diary: "Papa says the dollhouse is a map of our house. The cradle always sits by the window, in the second corner. On cold nights the west wall whispers. Mama says it is only the draught."','Wren\u2019s diary: "The little wardrobe stays in the hall by the stairs, in the first corner. It hides the secret door. At the s\u00e9ance Mama laid a sixth place at the table. Papa said it was for the guest, but he never said which guest."','Wren\u2019s diary: "My bed is under the roof, in the third corner. When I sleep there the house goes quiet. When I want to hide, I use the little door at the bottom of my room. Nobody ever finds me there."'];
const BOXN='A folded slip inside the music box:\n\nTo wake the eye, the toys must face the way they did when Papa watched:\nthe bear looks right,\nthe rabbit looks up,\nthe horse looks left.';
const WREN='A letter in Aldric\u2019s hand, folded in the chest:\n\n"Wren did not vanish. She was our first success: a mind kept whole after the body failed. Every subject since has been an attempt to give her a new home."\n\nThe last line is scratched in pencil: "She is still listening."';
const paintNur=c=>{paintBase(c,{floor:'#4a3a34',floor2:'#52413a',wall:'#4a3d4f',wall2:'#3a3040',trim:'#2a2230'});c.fillStyle='rgba(255,220,240,.07)';for(let x=32;x<608;x+=20)c.fillRect(x,6,8,52);rect(c,210,140,220,150,'#3a2a44');c.strokeStyle='#8a6a8a';c.strokeRect(218.5,148.5,203,133);doorLR(c,608,'#5a4630')};
const paintAtt=c=>{paintBase(c,{floor:'#2a2018',floor2:'#30251c',wall:'#1d1814',wall2:'#16120f',trim:'#100d0a'});doorLR(c,0,'#4a2e1a')};
const dreadCol=()=>T.dread<2?'#e6c040':'#8a1a1a';
const scrapAct=i=>()=>{T.sc[i]=1;sfx.pick();const t='Torn sheet music, "Wren\u2019s Lullaby": '+SCR[i];addNote('Music scrap '+(i+1),t);showNote('Music scrap '+(i+1),t)};
const fragAct=i=>()=>{T.fr[i]=1;sfx.pick();addNote('Wren\u2019s diary '+(i+1),FRG[i]);showNote('Wren\u2019s diary '+(i+1),FRG[i])};
const STAGE4={
  nursery:{name:'The Nursery',paint:paintNur,lights:()=>[{x:320,y:200,r:210,a:.6}],objs:[
    {x:80,y:66,w:70,h:44,solid:true,label:'Look in the crib',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#d8c8b0');rect(c,o.x+5,o.y+6,o.w-10,o.h-12,'#a89ab8')},act:fragAct(0)},
    {x:480,y:290,w:70,h:40,solid:true,label:'Open the toy chest',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a3a2a');rect(c,o.x,o.y,o.w,8,'#7a4a3a');rect(c,o.x+30,o.y+14,10,8,'#c9a24a')},act:fragAct(1)},
    {x:400,y:4,w:120,h:54,label:'Search the bookshelf',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a2a');for(let i=0;i<8;i++)rect(c,o.x+4+i*14,o.y+8+(i%3)*3,9,36-(i%3)*3,['#c05050','#5080c0','#e0c050','#60a060'][i%4])},act:scrapAct(1)},
    {x:200,y:6,w:130,h:50,label:'Look at the drawings',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#e8e0d0');for(let i=0;i<4-Math.min(T.dread,1);i++){c.fillStyle=dreadCol();c.beginPath();c.arc(o.x+22+i*28,o.y+20,6,0,6.3);c.fill();c.fillRect(o.x+19+i*28,o.y+26,6,14)}if(T.dread>=3)rect(c,o.x+100,o.y+4,14,44,'#111')},
      act:()=>say(['Cheerful crayon drawings of a house, a cat and a family of four. In one corner, a tiny pink door.','The family has only three faces now.','One figure is scribbled out hard enough to tear the paper.','Every drawing shows the same tall dark figure standing at the window.'][T.dread],5)},
    {x:300,y:100,w:56,h:34,solid:true,label:'Wind the music box',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a5a3a');rect(c,o.x+4,o.y+4,o.w-8,10,'#c9a24a')},
      act:()=>{if(T.box){showNote('Music box slip',BOXN);return}if(!T.sc.every(Boolean)){say('The music box has four missing notes. Somewhere in this room are scraps of its song.',5);return}
        openKeys('The music box','3151',()=>{T.box=true;heal();sfx.solve();[330,262,392,262].forEach((f,i)=>setTimeout(()=>tone(f,.6,'triangle',.18),i*450));addNote('Music box slip',BOXN);showNote('Music box slip','The lullaby plays, slow and out of tune. A hidden drawer opens.\n\n'+BOXN)},'Eight keys: 1 do, 2 re, 3 mi, 4 fa, 5 sol, 6 la, 7 ti, 8 high do. Play the four notes of the song. You can also press 1 to 8 on your keyboard.')}},
    {x:470,y:150,w:76,h:70,solid:true,label:'Rearrange the dollhouse',draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,o.h-14,'#8a7a9a');c.fillStyle='#6a3a3a';c.beginPath();c.moveTo(o.x-4,o.y+16);c.lineTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w+4,o.y+16);c.fill();rect(c,o.x+8,o.y+26,22,16,'#2a2030');rect(c,o.x+46,o.y+26,22,16,'#2a2030');rect(c,o.x+8,o.y+48,60,14,'#2a2030')},
      act:()=>{if(T.house){say('The little rooms are arranged just as Wren left them. In the dollhouse nursery, a tiny door in the west wall hangs ajar.');return}openDollhouse()}},
    {x:96,y:230,w:84,h:44,solid:true,label:'Search the desk',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#6a4a30');rect(c,o.x,o.y,o.w,6,'#7a5a40')},act:fragAct(2)},
    {x:122,y:232,w:34,h:20,when:()=>T.dread>=2,label:'Look at the drawing',draw:(c,o)=>rect(c,o.x,o.y,o.w,o.h,'#efe6d4'),
      act:()=>showNote('Crayon drawing','A child\u2019s drawing of this very room: a girl beside a rocking chair, a lamp, a window. Behind the girl stands a tall black figure.\n\nThe girl is wearing your coat.',()=>{T.fig=5;lightsOut=.3;sfx.scare()})},
    {get x(){return 430-T.dread*40},y:250,w:24,h:28,label:'Pick up the teddy bear',draw:(c,o)=>{c.fillStyle='#8a6a4a';c.beginPath();c.arc(o.x+12,o.y+8,8,0,6.3);c.fill();rect(c,o.x+4,o.y+14,16,14,'#8a6a4a');rect(c,o.x+7,o.y+6,3,3,'#111');rect(c,o.x+14,o.y+6,3,3,'#111')},act:scrapAct(0)},
    {get x(){return [70,140,220,300][T.dread]},y:290,w:44,h:44,label:'Look at the rocking chair',draw:(c,o)=>{c.save();c.translate(o.x+22,o.y+40);c.rotate(Math.sin(time*(1.4+T.dread))*(.03+T.dread*.02));rect(c,-14,-38,28,24,'#6a4a30');rect(c,-16,-14,32,12,'#7a5a40');c.restore()},act:scrapAct(2)},
    {x:230,y:250,w:34,h:16,label:'Lift the rug corner',draw:(c,o)=>rect(c,o.x,o.y,o.w,6,'#4a3a54'),act:scrapAct(3)},
    D(586,170,22,60,'attic',70,210,()=>!T.house,'The door in the east wall is only painted on. In the dollhouse, the same door is blocked by a wardrobe.')]},
  attic:{name:'The Attic',paint:paintAtt,lights:()=>[{x:320,y:190,r:170,a:.65}],objs:[
    {x:270,y:200,w:100,h:40,solid:true,label:'Arrange the toys',draw:(c,o)=>{rect(c,o.x,o.y+20,o.w,20,'#4a3a2a');c.fillStyle='#8a6a4a';c.fillRect(o.x+8,o.y+4,18,16);c.fillStyle='#d8d0c0';c.fillRect(o.x+40,o.y+2,12,18);c.fillStyle='#6a4a30';c.fillRect(o.x+70,o.y+6,22,14);if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}},
      act:()=>{if(T.shadow){say('Three shadows form a single open eye on the wall.');return}openDial('Toy shadows',3,'103',()=>{T.shadow=true;heal();sfx.solve();say('A lamp swings on. Three shadows slide together on the wall into an eye. Somewhere, a lock clicks.',6)},'Bear, rabbit, horse. Each faces 0 up, 1 right, 2 down or 3 left.')}},
    {x:400,y:100,w:60,h:44,solid:true,label:'Open the chest',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a2a');rect(c,o.x,o.y,o.w,10,'#6a4a3a');rect(c,o.x+26,o.y+18,8,8,T.shadow?'#5fd35f':'#c9a24a')},
      act:()=>{if(!T.shadow){say('The chest\u2019s lock is carved in the shape of an eye.',4);return}if(T.done)return;T.done=true;heal();addNote('Aldric\u2019s letter',WREN);showNote('Aldric\u2019s letter',WREN,stageEnd)}},
    D(32,170,22,60,'nursery',566,210)]}
};
function beginStage4(){
  chapter=4;T={sc:[0,0,0,0],fr:[0,0,0],dread:0,dt:0,fig:0};redMode=false;hearts=3;updateHUD();roomId='nursery';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('The lab stairs end at a pastel door. Beyond it, a nursery, quiet and tidy. No monster here. Just the feeling of being watched. Not every door in this room is where it ought to be.',8);
}
function hint4(){
  let t;
  if(!T.sc.every(Boolean))t='Four scraps of the lullaby are hidden in toys and furniture around the nursery. Search everything.';
  else if(!T.box)t='Read the scraps in your journal (J) in order, then wind the music box.';
  else if(!T.fr.every(Boolean))t='Three diary pages are hidden in the crib, the toy chest and the desk.';
  else if(!T.house)t='The diary pages tell where the cradle, wardrobe and bed sit in the dollhouse. Their corner numbers are the code.';
  else if(!T.shadow)t='In the attic, face the toys the way the music box slip says: 0 up, 1 right, 2 down, 3 left.';
  else t='Open the chest in the attic.';
  if(!T.playIn)t+=' Optional: a small pink door is set into the bottom wall of the nursery.';
  if(!T.sec)t+=' Optional: cold air leaks from the west wall.';
  say('Hint: '+t,8);
}

