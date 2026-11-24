/* ===== Hands-on puzzles replacing three code dials ===== */
const dropObj=(r,re)=>{ROOMS[r].objs=ROOMS[r].objs.filter(o=>!(typeof o.label==='string'&&re.test(o.label)))};
/* Stage 2: swap the portraits on the wall */
dropObj('archive',/^(Read the plate|Rearrange the frames)$/);
const SOLP=[1,4,3,0,2],pp=()=>T.pp||(T.pp=[0,1,2,3,4]);
ROOMS.archive.objs.push(...[0,1,2,3,4].map(k=>({x:100+k*88,y:4,w:56,h:56,
  label:()=>T.port?'Look at the portrait':T.sel===k?'Hang the frame back':T.sel!=null?'Swap with the lifted frame':'Lift this frame down',
  draw:(c,o)=>{drawPortrait(c,o,FAM[pp()[k]].s);if(T.sel===k){c.strokeStyle='#e5c279';c.lineWidth=3;c.strokeRect(o.x-1,o.y-1,o.w+2,o.h+2)}},
  act:()=>{
    const p=pp();
    if(T.port){say(FAM[p[k]].n+'.',3);return}
    if(T.sel==null){T.sel=k;sfx.light();say('You lift the portrait of '+FAM[p[k]].n+'. Choose another frame to swap it with.',4);return}
    if(T.sel===k){T.sel=null;say('You hang it back.',2);return}
    const t=p[k];p[k]=p[T.sel];p[T.sel]=t;T.sel=null;sfx.door();
    if(p.every((v,i)=>v===SOLP[i]))portOk();else say('The frames trade places.',2);
  }})));
/* Stage 3: flip four breakers in order */
dropObj('lab',/^Breaker panel$/);
ROOMS.lab.objs.push(...[0,1,2,3].map(i=>({x:230+i*44,y:8,w:32,h:48,label:'Flip breaker '+(i+1),
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4e52');const on=T.power||(T.bs||[]).includes(i+1);rect(c,o.x+12,o.y+(on?8:22),8,16,on?'#5fd35f':'#a03030');c.fillStyle='#ddd';c.font='bold 10px Georgia';c.textAlign='center';c.fillText(i+1,o.x+16,o.y+46)},
  act:()=>{
    if(T.power){say('The panel hums.');return}
    const b=T.bs=T.bs||[];
    if(b.includes(i+1)){say('That breaker is already down.');return}
    b.push(i+1);sfx.light();
    if(b.length<4){say('Breaker '+(i+1)+' clunks into place.',2);return}
    if(b.join('')==='3142'){T.power=true;heal();sfx.solve();shake=.4;say('Lights stutter on. Somewhere nearby, electric locks release.',5)}
    else{T.bs=[];sfx.bad();shake=.3;lightsOut=.4;say('Sparks. All four breakers snap back up. Wrong order.',4)}
  }})));
/* Stage 4: turn the toys to cast the right shadows */
dropObj('attic',/^Arrange the toys$/);
const TOYS=[['bear','#8a6a4a',1],['rabbit','#d8d0c0',0],['horse','#6a4a30',3]],DX=[0,1,0,-1],DY=[-1,0,1,0];
ROOMS.attic.objs.push(...TOYS.map(([n,col,want],i)=>({x:250+i*60,y:200,w:44,h:40,solid:true,label:'Turn the '+n,
  draw:(c,o)=>{
    const d=(T.toy||[2,2,2])[i],cx=o.x+22,cy=o.y+22;
    rect(c,o.x,o.y+28,o.w,12,'#4a3a2a');c.fillStyle=col;c.beginPath();c.arc(cx,cy,13,0,6.3);c.fill();
    c.fillStyle='#111';c.beginPath();c.moveTo(cx+DX[d]*17,cy+DY[d]*17);c.lineTo(cx+DX[d]*6-DY[d]*6,cy+DY[d]*6+DX[d]*6);c.lineTo(cx+DX[d]*6+DY[d]*6,cy+DY[d]*6-DX[d]*6);c.fill();
    if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}
  },
  act:()=>{
    if(T.shadow){say('Three shadows form a single open eye on the wall.');return}
    const t=T.toy=T.toy||[2,2,2];t[i]=(t[i]+1)%4;sfx.light();
    say('The '+n+' now faces '+['up','right','down','left'][t[i]]+'.',2);
    if(TOYS.every((x,j)=>t[j]===x[2])){T.shadow=true;heal();sfx.solve();say('A lamp swings on. Three shadows slide together on the wall into an eye. Somewhere, a lock clicks.',6)}
  }})));
