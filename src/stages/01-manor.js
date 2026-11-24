/* ================= ROOMS ================= */
const D=(x,y,w,h,to,sx,sy,lock,lockMsg)=>({door:true,x,y,w,h,to,sx,sy,lock,lockMsg});
function lightCandle(i){
  if(S.altar){say('The candles burn steadily now.');return}
  if(lit[i]){say('That candle is already burning.');return}
  lit[i]=true;seq.push(i);sfx.light();
  if(seq.length===4){
    const ok=seq.every((p,k)=>STANDS[p].col===SOL[k]);
    if(ok){
      S.altar=true;S.iron=true;heal();updateHUD();sfx.solve();shake=.5;
      say('The flames flare white. The altar grinds open and an iron key waits inside. You take it.',6);
    }else{
      lit.fill(false);seq=[];sfx.bad();shake=.3;lightsOut=.5;
      say('All four flames gutter and die at once. Something in the dark has noticed you.',4.5);
      spawnGhost(true);
    }
  }else say('The wick catches. A small flame trembles.',2);
}
const ROOMS={
  foyer:{name:'Entrance Hall',paint:paintFoyer,
    lights:()=>[{x:130,y:70,r:115,a:.75},{x:450,y:75,r:125,a:.5,col:'80,120,200'}],
    objs:[
      ...[0,1,2].map(i=>({x:48+i*72,y:4,w:56,h:56,label:'Look at portrait',draw:(c,o)=>drawPortrait(c,o,i),act:()=>say(PORTRAIT_TEXT[i],5)})),
      {x:56,y:286,w:44,h:44,solid:true,label:'Examine',draw:drawRocker,act:()=>say('The rocking chair is rocking by itself. When you look straight at it, it stops.',4)},
      {x:520,y:290,w:40,h:40,solid:true,label:'Examine',draw:drawPlant,act:()=>say('Dead roses in a cracked vase. A petal drifts down, though no air moves.',4)},
      D(32,170,22,60,'library',550,210),
      D(586,170,22,60,'dining',70,210),
      D(292,64,56,20,'cellar',320,322,()=>!S.brass,'The cellar door is locked. The keyhole is small and brass-colored.'),
      D(292,336,56,16,'EXIT',0,0,()=>!S.iron,'The front door is bolted with an iron lock. You need an iron key.')
    ]},
  library:{name:'Library',paint:paintLibrary,
    lights:()=>[{x:320,y:60,r:120,a:.9},{x:200,y:180,r:80,a:.8},{x:506,y:66,r:50,a:.65}],
    objs:[
      {x:496,y:12,w:20,h:46,label:'Pull the strange book',draw:drawBook,act:()=>{
        if(S.page){say('Only dust is left where the book sat.');return}
        S.page=true;sfx.pick();addNote('Torn page',PAGE);
        showNote('Torn page','Behind the book, a folded page falls out.\n\n'+PAGE);
      }},
      {x:48,y:4,w:200,h:54,label:'Search the shelves',act:()=>say('Rotting books, pages eaten away. One spine is still legible: On the Burying of the Dead.',4)},
      {x:392,y:4,w:200,h:54,label:'Search the shelves',act:()=>say('Dusty volumes, mostly hymnals. Something near the right end looks out of place.',4)},
      {x:272,y:14,w:96,h:50,label:'Examine',draw:drawFire,act:()=>{addNote('Hearth scratches',HEARTH);showNote('Hearth scratches',HEARTH)}},
      {x:96,y:170,w:120,h:54,solid:true,label:'Search the desk',draw:drawDesk,act:()=>{
        if(!S.diary){S.diary=true;sfx.pick();addNote('Elara\u2019s diary',DIARY)}
        showNote('Elara\u2019s diary',DIARY);
      }},
      {x:440,y:196,w:56,h:56,solid:true,label:'Examine',draw:drawArmchair,act:()=>say('The cushion is still dented, as if someone just stood up.',4)},
      D(586,170,22,60,'foyer',70,210)
    ]},
  dining:{name:'Dining Room',paint:paintDining,
    lights:()=>[{x:320,y:205,r:150,a:.85},{x:560,y:60,r:50,a:.55}],
    objs:[
      {x:200,y:176,w:240,h:64,solid:true,label:'Examine the table',draw:drawTable,act:()=>say('A long table laid for a feast nobody attended. Candles burn and the wax pools on the cloth.',5)},
      ...[228,304,380].map(x=>({x,y:140,w:32,h:32,solid:true,draw:(c,o)=>drawChair(c,o,false)})),
      ...[228,304,380].map(x=>({x,y:244,w:32,h:32,solid:true,draw:(c,o)=>drawChair(c,o,true)})),
      {x:536,y:64,w:48,h:44,solid:true,label:'Set the clock',draw:drawClock,act:()=>{
        if(S.clock)say('The clock stands at seven. The empty drawer is still open.');else openClock();
      }},
      {x:56,y:64,w:96,h:40,solid:true,label:'Search the cabinet',draw:drawCabinet,act:()=>say('Stacked plates. One is spotless, as if someone ate from it tonight.',4)},
      D(32,170,22,60,'foyer',570,210)
    ]},
  cellar:{name:'Cellar',paint:paintCellar,
    lights:()=>[{x:320,y:100,r:105,a:.6},{x:84,y:92,r:70,a:.55},...STANDS.map((s,i)=>lit[i]?{x:224+i*64,y:180,r:70,a:.85}:null).filter(Boolean)],
    objs:[
      {x:52,y:64,w:64,h:48,solid:true,label:'Open the safe',draw:drawSafe,act:()=>{
        if(S.safe)say('The safe is open and empty.');else openSafe();
      }},
      {x:236,y:72,w:168,h:52,solid:true,label:'Examine the altar',draw:drawAltar,act:()=>{
        say(S.altar?'The slab has slid aside. The hollow beneath is empty now.':'A stone altar, stained dark. Four candle stands wait before it, each a different color.',5);
      }},
      ...[0,1,2,3].map(i=>({x:212+i*64,y:168,w:24,h:42,solid:true,label:'Light the '+STANDS[i].col+' candle',draw:(c,o)=>drawStand(c,o,i),act:()=>lightCandle(i)})),
      {x:500,y:96,w:80,h:56,solid:true,label:'Examine',draw:drawCrates,act:()=>say('Rotted crates. Everything inside has turned to dust.',3)},
      {x:520,y:270,w:36,h:40,solid:true,label:'Examine',draw:drawBarrel,act:()=>say('Empty except for gnawed bones. Rats, you tell yourself.',4)},
      D(296,336,48,16,'foyer',320,110)
    ]}
};
function buildBG(){for(const id in ROOMS){
  if(ROOMS[id].bg)continue;
  const R=ROOMS[id];
  R.bg=document.createElement('canvas');R.bg.width=W*2;R.bg.height=H*2;
  const c=R.bg.getContext('2d');c.scale(2,2);R.paint(c);
}}
buildBG();
const vig=document.createElement('canvas');vig.width=W;vig.height=H;
{const c=vig.getContext('2d'),g=c.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.95);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');c.fillStyle=g;c.fillRect(0,0,W,H)}
const room=()=>ROOMS[roomId];


