/* ================= TEXT ================= */
const PORTRAIT_TEXT=[
  'A stern man in a black coat. The plate reads: Aldric Vane, master of the house. His eyes seem to follow you.',
  'A woman with a sad smile. Elara Vane. Dust covers every frame in the hall except hers.',
  'A little girl clutching a doll. The nameplate has been scraped away with something sharp.'
];
const DIARY='Aldric has lit the dining table again, candle after candle, as if a feast were coming.\n\nWhen the clock strikes the hour that matches their number, the house will listen. I have hidden the cellar key where time itself is kept.\n\nThe hearth remembers the order of the colored books beside it. Press them as it says, and the shelf will show you what I hid.\n\nIf you read this, do not let it see you hesitate.';
const PAGE='The vault beneath the house answers to three numbers, in this order:\n\nI. The hour the clock must show.\nII. The chairs that wait at the table.\nIII. The portraits in the entrance hall.\n\nSet them true and the iron safe will open.';
const WHISPERS=['"...stay..."','"She is still here."','"Count them. Count them all."','"It is so cold down here."','"Behind you."'];

function hint(){if(chapter===2)return hint2();if(chapter===3)return hint3();if(chapter===4)return hint4();if(chapter===5)return hint5();if(chapter===6)return hint6();if(chapter===7)return hint7();if(chapter===8)return hint8();
  let t;
  if(!S.brass){
    t=!S.diary?'Search the library. Desks and shelves keep secrets.':'The diary speaks of candles and a clock. Both are in the dining room. Count carefully.';
  }else if(!S.safe){
    t=!S.page?(S.books?'A book in the library now sticks out from the shelf. Look for a glint.':'The library hearth has a rhyme about the colored books on the left shelf. Press them in order.'):'Three numbers in order: the clock hour, the chairs, the portraits. The safe is in the cellar.';
  }else if(!S.iron){
    t='Read the vellum scrap in your journal (J). Light the four candles in the order of the rhyme.';
  }else{
    t='The iron key fits the front door in the entrance hall.';
  }
  say('Hint: '+t,6);
}

/* ================= ROOM PAINTING ================= */
function paintBase(c,o){
  rect(c,0,0,W,H,'#000');
  if(o.stone){
    for(let y=64;y<352;y+=32)for(let x=32;x<608;x+=32){
      c.fillStyle=((x/32+y/32)%2)?o.floor:o.floor2;c.fillRect(x,y,32,32);
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.strokeRect(x+.5,y+.5,31,31);
    }
  }else{
    for(let r=0,y=64;y<352;y+=24,r++){
      c.fillStyle=r%2?o.floor:o.floor2;c.fillRect(32,y,576,24);
      c.fillStyle='rgba(0,0,0,.35)';c.fillRect(32,y,576,1);
      for(let x=32+(r*37)%96;x<608;x+=96)c.fillRect(x,y,1,24);
    }
  }
  rect(c,0,0,W,64,o.wall);
  c.fillStyle='rgba(0,0,0,.28)';
  for(let y=0;y<64;y+=16){c.fillRect(0,y,W,1);for(let x=((y/16)%2)*20;x<W;x+=40)c.fillRect(x,y,1,16)}
  rect(c,0,58,W,6,o.trim);
  rect(c,0,0,32,H,o.wall2);rect(c,608,0,32,H,o.wall2);rect(c,0,352,W,32,o.wall2);
  c.fillStyle='rgba(0,0,0,.35)';
  for(let y=0;y<H;y+=16){c.fillRect(0,y,32,1);c.fillRect(608,y,32,1)}
  for(let x=0;x<W;x+=40)c.fillRect(x,352+16,1,16);
  c.fillRect(0,368,W,1);
  const g=c.createLinearGradient(0,64,0,96);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(32,64,576,32);
  const gl=c.createLinearGradient(32,0,60,0);gl.addColorStop(0,'rgba(0,0,0,.45)');gl.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gl;c.fillRect(32,64,28,288);
  const gr=c.createLinearGradient(608,0,580,0);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=gr;c.fillRect(580,64,28,288);
}
function doorLR(c,x,col){
  rect(c,x,164,32,72,'#150c08');
  rect(c,x+2,168,28,64,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+6,174,20,22);c.fillRect(x+6,204,20,22);
  c.fillStyle='#c9a24a';c.beginPath();c.arc(x?x+8:x+24,202,2.6,0,6.3);c.fill();
}
function doorTop(c,col){
  rect(c,286,6,68,58,'#150c08');rect(c,290,10,60,54,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(296,16,20,34);c.fillRect(324,16,20,34);
  c.fillStyle='#c9a24a';c.beginPath();c.arc(344,44,2.6,0,6.3);c.fill();
}
function doorBottom(c,col,iron){
  rect(c,286,352,68,32,'#150c08');rect(c,290,352,60,28,col);
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(296,356,20,18);c.fillRect(324,356,20,18);
  if(iron){c.fillStyle='#2a2a2e';c.fillRect(290,360,60,4);c.fillRect(290,370,60,4);c.fillStyle='#6a6a70';c.beginPath();c.arc(320,367,4,0,6.3);c.fill()}
  else{c.fillStyle='#c9a24a';c.beginPath();c.arc(344,366,2.6,0,6.3);c.fill()}
}
function shelf(c,x,w,seed){
  const r=rng(seed);rect(c,x,4,w,54,'#2b1b11');
  const cols=['#5b2a2a','#2c4a3b','#3b3a5c','#6b5a2a','#4a2f4a','#2b2b2b','#6a3f23'];
  for(let row=0;row<3;row++){
    const by=6+row*17;rect(c,x+3,by+14,w-6,3,'#1a0f09');
    let bx=x+4;
    while(bx<x+w-10){
      const bw=4+Math.floor(r()*5),bh=9+Math.floor(r()*5);
      c.fillStyle=cols[Math.floor(r()*cols.length)];c.fillRect(bx,by+14-bh,bw,bh);
      bx+=bw+(r()<.15?3:1);
    }
  }
}

function paintFoyer(c){
  paintBase(c,{floor:'#34261e',floor2:'#3b2b22',wall:'#2a2029',wall2:'#221a22',trim:'#171016'});
  rect(c,210,150,220,150,'#3a1a24');rect(c,216,156,208,138,'#2a131b');
  c.strokeStyle='#8a6a3a';c.lineWidth=1.5;c.strokeRect(222.5,162.5,195,125);
  c.fillStyle='#4a2230';c.beginPath();c.moveTo(320,176);c.lineTo(380,225);c.lineTo(320,274);c.lineTo(260,225);c.closePath();c.fill();
  rect(c,420,8,60,50,'#241a14');rect(c,424,12,52,42,'#0b1424');
  c.fillStyle='#cfe0f5';c.beginPath();c.arc(452,28,9,0,6.3);c.fill();
  c.fillStyle='#0b1424';c.beginPath();c.arc(456,26,8,0,6.3);c.fill();
  rect(c,449,12,3,42,'#241a14');rect(c,424,32,52,3,'#241a14');
  doorLR(c,0,'#4a2e1a');doorLR(c,608,'#4a2e1a');doorTop(c,'#3d2616');doorBottom(c,'#2a1a12',true);
}
function paintLibrary(c){
  paintBase(c,{floor:'#2d2118',floor2:'#34271c',wall:'#241c1c',wall2:'#1e1717',trim:'#150f0f'});
  shelf(c,48,200,11);shelf(c,392,200,23);
  rect(c,130,150,380,150,'#2e1620');rect(c,136,156,368,138,'#3a1c28');
  c.strokeStyle='#7a5a32';c.lineWidth=1.5;c.strokeRect(142.5,162.5,355,125);
  rect(c,272,14,96,50,'#3b3436');rect(c,280,22,80,42,'#2f292b');rect(c,288,28,64,36,'#0a0607');
  doorLR(c,608,'#4a2e1a');
}
function paintDining(c){
  paintBase(c,{floor:'#33241f',floor2:'#3a2923',wall:'#2b1c20',wall2:'#241619',trim:'#170e11'});
  c.fillStyle='rgba(120,40,50,.18)';for(let x=32;x<608;x+=24)c.fillRect(x,6,10,50);
  rect(c,170,130,300,170,'#241216');rect(c,176,136,288,158,'#2f171c');
  c.strokeStyle='#6a4a30';c.lineWidth=1.2;c.strokeRect(182.5,142.5,275,145);
  doorLR(c,0,'#4a2e1a');
}
function paintCellar(c){
  paintBase(c,{floor:'#2b2d30',floor2:'#25272a',wall:'#1b1d20',wall2:'#16181a',trim:'#101113',stone:true});
  c.strokeStyle='#3a3c40';c.lineWidth=2;
  for(const x of [100,180,460,540]){c.beginPath();c.moveTo(x,0);c.lineTo(x,20+((x*7)%14));c.stroke();c.fillStyle='#3a3c40';for(let k=0;k<4;k++)c.fillRect(x-3,4+k*5,6,3)}
  c.fillStyle='rgba(60,10,12,.55)';c.beginPath();c.ellipse(320,150,90,22,0,0,6.3);c.fill();
  c.strokeStyle='rgba(220,220,220,.14)';c.lineWidth=1;
  for(let i=1;i<6;i++){c.beginPath();c.moveTo(32,64);c.lineTo(32+i*9,64+(6-i)*7);c.stroke();c.beginPath();c.moveTo(608,64);c.lineTo(608-i*9,64+(6-i)*7);c.stroke()}
  c.fillStyle='#cfc8b4';c.beginPath();c.arc(90,312,9,0,6.3);c.fill();c.fillRect(85,318,10,5);
  c.fillStyle='#16181a';c.fillRect(86,309,3,4);c.fillRect(92,309,3,4);
  c.strokeStyle='#cfc8b4';c.lineWidth=3;c.beginPath();c.moveTo(106,322);c.lineTo(130,316);c.moveTo(110,330);c.lineTo(138,334);c.stroke();
  doorBottom(c,'#3a2f24',false);
}

/* ================= OBJECT DRAWING ================= */
function flame(c,x,y,s,col){
  const f=Math.sin(time*18+x*3)*.8;
  c.fillStyle=col||'rgba(255,165,60,.95)';
  c.beginPath();c.ellipse(x,y-4*s+f*.3,2.4*s,4.6*s+f*.5,0,0,6.3);c.fill();
  c.fillStyle='rgba(255,240,170,.95)';
  c.beginPath();c.ellipse(x,y-3*s,1.2*s,2.4*s,0,0,6.3);c.fill();
}
function drawPortrait(c,o,i){
  const{x,y,w,h}=o;
  rect(c,x,y,w,h,'#6b4a22');rect(c,x+3,y+3,w-6,h-9,'#2a1f14');
  rect(c,x+6,y+6,w-12,h-15,['#1d2230','#2a1d2b','#1f2a22','#2a2018','#1c2430','#1f1f2a'][i]);
  const cx=x+w/2,cy=y+h/2-2;
  c.fillStyle=['#161616','#3b1f33','#c9bfae','#3b3020','#2a3a4a','#4a3b5c'][i];c.fillRect(cx-14,cy+10,28,12);
  c.fillStyle=['#8a8a8a','#2a1a12','#6a4a2a','#5a5a5a','#c9a24a','#3a2418'][i];
  if(i===1)c.fillRect(cx-11,cy-4,22,18);
  c.beginPath();c.arc(cx,cy-4,11,0,6.3);c.fill();
  c.fillStyle='#d9cdb8';c.beginPath();c.ellipse(cx,cy-1,8,10,0,0,6.3);c.fill();
  const ex=clamp((player.x-cx)/80,-1.4,1.4),ey=clamp((player.y-cy)/160,-1,1);
  for(const s of[-3.5,3.5]){
    c.fillStyle='#fff';c.beginPath();c.arc(cx+s,cy-3,2.2,0,6.3);c.fill();
    c.fillStyle='#000';c.beginPath();c.arc(cx+s+ex,cy-3+ey,1.1,0,6.3);c.fill();
  }
  c.strokeStyle='#5a3a30';c.lineWidth=1;c.beginPath();c.moveTo(cx-3,cy+4);c.lineTo(cx+3,cy+4);c.stroke();
  rect(c,cx-8,y+h-6,16,3,'#c9a24a');
}
function drawRocker(c,o){
  c.save();c.translate(o.x+22,o.y+40);c.rotate(Math.sin(time*1.4)*.035);
  rect(c,-14,-38,28,24,'#3a2415');rect(c,-16,-14,32,12,'#4b2f1c');
  c.strokeStyle='#2a170d';c.lineWidth=3;c.beginPath();c.moveTo(-18,2);c.quadraticCurveTo(0,8,18,2);c.stroke();
  c.restore();
}
function drawPlant(c,o){
  rect(c,o.x,o.y+14,o.w,26,'#3b2618');rect(c,o.x,o.y+14,o.w,4,'#4e3322');
  c.fillStyle='#4a5a66';c.beginPath();c.ellipse(o.x+20,o.y+14,9,10,0,0,6.3);c.fill();
  c.strokeStyle='#3a2a22';c.lineWidth=1.5;
  for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(o.x+20,o.y+6);c.lineTo(o.x+20+i*9,o.y-8+Math.abs(i)*4);c.stroke();c.fillStyle='#5a1a22';c.beginPath();c.arc(o.x+20+i*9,o.y-8+Math.abs(i)*4,3,0,6.3);c.fill()}
  const py=((time*14)%26);c.fillStyle='#5a1a22';c.fillRect(o.x+26,o.y-4+py,2,2);
}
function drawFire(c){
  c.fillStyle='#2a1810';c.fillRect(292,56,56,6);
  for(let i=0;i<4;i++){
    const fx=300+i*14+Math.sin(time*9+i*2)*1.5,fh=15+Math.sin(time*11+i*1.7)*5+(i%2?5:0);
    c.fillStyle=i%2?'#ffb347':'#ff6a2a';
    c.beginPath();c.moveTo(fx-6,58);c.quadraticCurveTo(fx-3,58-fh*.6,fx,58-fh);c.quadraticCurveTo(fx+3,58-fh*.6,fx+6,58);c.fill();
  }
}
function drawBook(c,o){
  if(S.page){rect(c,o.x,o.y+2,o.w-4,o.h-8,'#0a0604');return}
  rect(c,o.x+1,o.y+2,o.w-4,o.h-6,'#5a1220');rect(c,o.x+1,o.y+8,o.w-4,3,'#c9a24a');rect(c,o.x+1,o.y+o.h-14,o.w-4,3,'#c9a24a');
  const g=.35+.35*Math.sin(time*3);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';
  c.beginPath();c.arc(o.x+16,o.y+10,2.5+g,0,6.3);c.fill();
}
function drawDesk(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#4a3020');rect(c,o.x,o.y,o.w,7,'#5e3f2a');rect(c,o.x,o.y+o.h-8,o.w,8,'#33201a');
  rect(c,o.x+28,o.y+12,26,18,'#6a1f24');rect(c,o.x+31,o.y+15,20,12,'#d9ccab');
  c.strokeStyle='rgba(43,33,23,.5)';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(o.x+33,o.y+18+i*3);c.lineTo(o.x+49,o.y+18+i*3);c.stroke()}
  rect(c,o.x+88,o.y+22,6,12,'#6a5a2a');c.fillStyle='rgba(255,210,120,.9)';c.beginPath();c.arc(o.x+91,o.y+18,7,0,6.3);c.fill();
}
function drawArmchair(c,o){
  rect(c,o.x,o.y+8,o.w,o.h-8,'#4a2a2a');rect(c,o.x,o.y,o.w,18,'#3a1f20');rect(c,o.x+4,o.y+20,o.w-8,o.h-26,'#5a3434');
  rect(c,o.x-4,o.y+14,8,o.h-14,'#3a1f20');rect(c,o.x+o.w-4,o.y+14,8,o.h-14,'#3a1f20');
}
function drawTable(c,o){
  rect(c,o.x,o.y,o.w,56,'#4a1820');
  rect(c,o.x,o.y,o.w,3,'#6a2a30');
  rect(c,o.x,o.y+56,o.w,8,'#33101a');
  c.fillStyle='rgba(0,0,0,.25)';for(let x=o.x+10;x<o.x+o.w;x+=20)c.fillRect(x,o.y+56,3,8);
  for(let i=0;i<7;i++){
    const x=222+i*32;
    c.fillStyle='rgba(235,225,195,.5)';c.beginPath();c.ellipse(x,o.y+36,6,3,0,0,6.3);c.fill();
    rect(c,x-3,o.y+22,6,14,'#e6dcc3');rect(c,x-3,o.y+22,2,14,'#fff6dc');
    flame(c,x,o.y+22,1);
  }
}
function drawChair(c,o,bottom){
  rect(c,o.x,o.y+(bottom?0:8),o.w,o.h-8,'#4a2f1c');
  rect(c,o.x+3,o.y+(bottom?3:11),o.w-6,o.h-14,'#6a2a30');
  rect(c,o.x,bottom?o.y+o.h-8:o.y,o.w,8,'#2f1c10');
}
function drawClock(c){
  rect(c,536,6,48,8,'#2f1c10');rect(c,540,10,40,100,'#3b2517');rect(c,536,100,48,10,'#2f1c10');
  c.fillStyle='#e8dfc8';c.beginPath();c.arc(560,30,13,0,6.3);c.fill();c.strokeStyle='#6b4a22';c.lineWidth=2;c.stroke();
  const ha=(S.clockHour%12)*Math.PI/6;
  c.strokeStyle='#1a120c';c.lineWidth=2;c.beginPath();c.moveTo(560,30);c.lineTo(560+Math.sin(ha)*7,30-Math.cos(ha)*7);c.stroke();
  c.lineWidth=1;c.beginPath();c.moveTo(560,30);c.lineTo(560,20);c.stroke();
  rect(c,548,52,24,44,'#150e09');
  const px=560+Math.sin(time*3)*6;c.fillStyle='#c9a24a';c.beginPath();c.arc(px,86,5,0,6.3);c.fill();
  c.strokeStyle='#c9a24a';c.lineWidth=1;c.beginPath();c.moveTo(560,54);c.lineTo(px,86);c.stroke();
}
function drawCabinet(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#3b2517');rect(c,o.x,o.y,o.w,4,'#4e3322');
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(o.x+46,o.y+6,2,o.h-6);c.fillRect(o.x+6,o.y+8,36,26);c.fillRect(o.x+52,o.y+8,36,26);
  c.fillStyle='#d8d2c0';for(let i=0;i<4;i++){c.beginPath();c.ellipse(o.x+14+i*22,o.y+3,8,3,0,0,6.3);c.fill()}
}
function drawSafe(c){
  rect(c,48,32,72,80,'#2d2f33');rect(c,52,36,64,72,'#3a3d42');
  if(S.safe){rect(c,56,40,56,64,'#0c0d0f');rect(c,112,40,10,64,'#4a4d52')}
  else{
    c.fillStyle='#202226';c.beginPath();c.arc(84,70,15,0,6.3);c.fill();
    c.strokeStyle='#8a8d92';c.lineWidth=1.5;c.stroke();
    c.beginPath();c.moveTo(84,70);c.lineTo(90,60);c.stroke();
    rect(c,100,76,10,5,'#8a8d92');
  }
}
function drawAltar(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#5a5a5e');rect(c,o.x,o.y,o.w,4,'#7a7a80');rect(c,o.x,o.y+o.h-12,o.w,12,'#3d3d41');
  c.strokeStyle='rgba(20,20,22,.7)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(o.x+84,o.y+10);c.lineTo(o.x+84,o.y+38);c.moveTo(o.x+70,o.y+20);c.lineTo(o.x+98,o.y+20);c.stroke();
  if(S.altar){rect(c,o.x+60,o.y+10,48,24,'#0d0d0f')}
}
function drawStand(c,o,i){
  const cx=o.x+12,col=STANDS[i].c;
  rect(c,cx-9,o.y+30,18,12,'#4a4a4d');rect(c,cx-3,o.y+18,6,14,'#5a5a5e');rect(c,cx-8,o.y+14,16,5,'#6a6a6e');
  rect(c,cx-4,o.y+2,8,13,col);rect(c,cx-4,o.y+2,2,13,'rgba(255,255,255,.35)');
  if(lit[i])flame(c,cx,o.y+2,1.2,i===0?'rgba(255,90,60,.95)':i===2?'rgba(120,170,255,.95)':i===3?'rgba(255,255,240,.95)':'rgba(200,200,210,.95)');
  else rect(c,cx-.5,o.y,1,3,'#111');
}
function drawCrates(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#3e2c1c');c.strokeStyle='#2a1c10';c.lineWidth=2;
  c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2);c.beginPath();c.moveTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w/2,o.y+o.h);c.moveTo(o.x,o.y+o.h/2);c.lineTo(o.x+o.w,o.y+o.h/2);c.stroke();
}
function drawBarrel(c,o){
  rect(c,o.x,o.y,o.w,o.h,'#4a3220');c.fillStyle='#2a1c10';c.fillRect(o.x,o.y+8,o.w,3);c.fillRect(o.x,o.y+o.h-12,o.w,3);
  c.fillStyle='#1d140c';c.beginPath();c.ellipse(o.x+o.w/2,o.y+3,o.w/2-2,4,0,0,6.3);c.fill();
}

