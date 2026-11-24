/* ================= STAGE 6: THE HEART OF THE MANOR ================= */
const CREDIT_NAME='radostradi';
let E={t:0,len:36,kind:'destroy',i:0};
const SHARDS='Memory shards\n\n1. Your friend whispered "Count the candles" and you laughed.\n2. The lights turned red. Your friend pointed at an empty bed.\n3. You both reached the front door at dusk. It was already locked.\n4. Your friend stepped into the glass. You stood still and watched.\n\nPut them back in the order they happened.';
const LOGM='Restoration log, Subject 07\n\nAttempt 1: entered at dusk. Memory wiped at the front door.\nAttempt 2: reached the library. Memory wiped.\nAttempt 3: reached the laboratory. Memory wiped.\nAttempt 4: you are here now.\n\nYou have walked these halls before. Each time you failed, the machine gave you a clean mind and sent you back to the door. Your friend has been waiting in the heart of the manor the whole time.\n\nScratched under the last entry, in your own handwriting: "You have to accept the offer to remember who you are."';
const SYM=[['clock','A clock face with no hands. The seal of Time: the hour that mattered.'],['eye','An open eye. The seal of Blood: the photograph of the patient who escaped.'],['note','A musical note. The seal of Song: the step that begins the lullaby.'],['glass','A mirror. The seal of Truth: how many journal entries were true.']];
const paintCore=c=>{paintBase(c,{floor:'#22302f',floor2:'#1d2928',wall:'#151f20',wall2:'#101819',trim:'#0b1213',stone:true});doorTop(c,'#2a3a3c')};
const paintMach=c=>{paintBase(c,{floor:'#2a2f33',floor2:'#242a2e',wall:'#1a2024',wall2:'#13181b',trim:'#0d1114',stone:true});doorBottom(c,'#2a3a3c',false)};
function drawLocker(c,o){rect(c,o.x,o.y,o.w,o.h,'#3a4448');rect(c,o.x+4,o.y+4,o.w-8,o.h-8,'#2a3236');for(let i=0;i<4;i++)rect(c,o.x+8,o.y+10+i*4,o.w-16,1.5,'#111')}
const lockerO=(x,y)=>({x,y,w:36,h:56,solid:true,label:()=>T.hide?'Leave the locker':'Hide in the locker',draw:drawLocker,act:()=>{if(T.hide){T.hide=0;say('You slip out of the locker.',2)}else{T.hide=1;say('You pull the door shut and hold your breath. Something drifts past, searching.',4)}}});
const lureO=(x,y,lab,msg)=>({x,y,w:36,h:32,solid:true,label:lab,draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#4a4a50');c.fillStyle=T.lure>0?'#ff6a5a':'#8a8a92';c.beginPath();c.arc(o.x+18,o.y+14,8,0,6.3);c.fill()},
  act(){if(T.lure>0){say('It is still drawing the thing away.',2);return}T.lure=8;T.lx=this.x+18;T.ly=this.y+32;noise(.8,.25,1500);say(msg,4)}});
const sealO=k=>({x:[90,190,390,490][k],y:70,w:36,h:40,solid:true,label:'Examine the seal',
  draw:(c,o)=>{rect(c,o.x,o.y+14,o.w,26,'#4a5256');rect(c,o.x+4,o.y,o.w-8,16,'#5a6468');c.strokeStyle=T.seals?'#5fd35f':'#9ab';c.lineWidth=1.6;const x=o.x+18,y=o.y+8,n=SYM[k][0];
    if(n==='clock'){c.beginPath();c.arc(x,y,6,0,6.3);c.stroke()}else if(n==='eye'){c.beginPath();c.ellipse(x,y,8,4,0,0,6.3);c.stroke();c.fillStyle=c.strokeStyle;c.beginPath();c.arc(x,y,2,0,6.3);c.fill()}
    else if(n==='note'){c.beginPath();c.arc(x-2,y+3,3,0,6.3);c.moveTo(x+1,y+3);c.lineTo(x+1,y-6);c.stroke()}else{c.strokeRect(x-5,y-6,10,12)}},act:()=>say(SYM[k][1],5)});
/* typed code for the four seals: one digit under each carved symbol */
const SEAL_SVG={
  clock:'<circle cx="0" cy="0" r="10"/>'+[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const a=i*Math.PI/6;return '<circle cx="'+(Math.sin(a)*7).toFixed(2)+'" cy="'+(-Math.cos(a)*7).toFixed(2)+'" r="'+(i%3?.6:1.1)+'" fill="currentColor" stroke="none"/>'}).join(''),
  eye:'<ellipse cx="0" cy="0" rx="12" ry="6"/><circle cx="0" cy="0" r="3" fill="currentColor"/>',
  note:'<circle cx="-3" cy="6" r="4.5"/><path d="M1.5 6V-10"/>',
  glass:'<rect x="-7" y="-10" width="14" height="20" rx="1"/>'};
let sealCfg=null;
const closeSeal=()=>{const a=document.activeElement;if(a&&a.blur)a.blur();closeModal()};
function openSealCode(title,target,ok,intro){
  let el=$('sealCode');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='sealCode';
    el.innerHTML='<div class="card"><h2></h2><p class="small" style="text-align:center;color:var(--muted)"></p><div class="seals" id="sealRow"></div><div id="sealMsg" role="status" aria-live="polite" style="min-height:1.6em;text-align:center;color:var(--muted);font-family:var(--ui);font-size:14px"></div><div class="row"><button class="btn primary" id="sealTry" type="button">Try the code</button><button class="btn" id="sealX" type="button">Step back</button></div><p class="small" style="text-align:center">Type a number under each seal. Backspace goes back. Enter tries. Esc closes.</p></div>';
    $('view').appendChild(el);
    el.querySelector('#sealTry').onclick=trySealCode;el.querySelector('#sealX').onclick=closeSeal;
  }
  sealCfg={target,ok,busy:false};
  el.querySelector('h2').textContent=title;el.querySelector('p').textContent=intro||'';
  const row=$('sealRow');row.innerHTML='';row.classList.remove('shake');$('sealMsg').textContent='';
  SYM.slice(0,target.length).forEach(([n,desc],i)=>{
    const s=document.createElement('div');s.className='seal';
    s.innerHTML='<div class="seal-glyph" title="'+desc.split('.')[0]+'"><svg viewBox="-13 -13 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'+SEAL_SVG[n]+'</svg></div>';
    const inp=document.createElement('input');inp.type='text';inp.inputMode='numeric';inp.maxLength=1;inp.autocomplete='off';inp.placeholder='–';
    inp.setAttribute('aria-label','Number for the '+n+' seal');
    inp.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(!modal||modal.id!=='sealCode'){inp.blur();return}
      const all=[...row.querySelectorAll('input')];
      if(e.key==='Enter'){e.preventDefault();trySealCode()}
      else if(e.key==='Escape'){e.preventDefault();closeSeal()}
      else if(e.key==='Backspace'&&!inp.value&&i>0){e.preventDefault();all[i-1].value='';all[i-1].focus()}
      else if(e.key==='ArrowLeft'&&i>0){e.preventDefault();all[i-1].focus()}
      else if(e.key==='ArrowRight'&&i<all.length-1){e.preventDefault();all[i+1].focus()}
      else if(/^\d$/.test(e.key)){e.preventDefault();inp.value=e.key;sfx.light();s.classList.remove('bad');if(i<all.length-1)all[i+1].focus()}
      else if(e.key.length===1)e.preventDefault();
    });
    inp.addEventListener('input',()=>{const d=inp.value.replace(/\D/g,'').slice(-1);inp.value=d;if(d){sfx.light();const all=row.querySelectorAll('input');if(i<all.length-1)all[i+1].focus()}});
    inp.addEventListener('focus',()=>inp.select());
    s.appendChild(inp);row.appendChild(s);
  });
  openModal('sealCode',c=>{if(c==='Escape')closeSeal();else if(c==='Enter')trySealCode()});
  setTimeout(()=>{const f=row.querySelector('input');if(f)f.focus()},50);
}
function trySealCode(){
  if(!sealCfg||sealCfg.busy)return;
  const row=$('sealRow'),ins=[...row.querySelectorAll('input')],seals=[...row.querySelectorAll('.seal')],code=ins.map(x=>x.value).join('');
  if(code.length<ins.length){sfx.bad();$('sealMsg').textContent='Every seal needs a number.';const e=ins.find(x=>!x.value);if(e)e.focus();return}
  if(code===sealCfg.target){
    sealCfg.busy=true;ins.forEach(x=>x.disabled=true);$('sealMsg').textContent='The seals drink the numbers in.';
    seals.forEach((s,i)=>setTimeout(()=>{s.classList.add('lit');sfx.light()},i*260));
    setTimeout(()=>{const f=sealCfg.ok;closeSeal();f()},seals.length*260+700);return}
  sfx.bad();row.classList.remove('shake');void row.offsetWidth;row.classList.add('shake');
  seals.forEach(s=>s.classList.add('bad'));setTimeout(()=>seals.forEach(s=>s.classList.remove('bad')),700);
  $('sealMsg').textContent='The symbols flare red, then go dark. Nothing moves.';setTimeout(()=>{ins.forEach(x=>x.value='');ins[0].focus()},450);
}
const STAGE6={
  core:{name:'The Heart of the Manor',paint:paintCore,lights:()=>[{x:320,y:100,r:210,a:.55}],objs:[
    ...[0,1,2,3].map(sealO),
    {x:290,y:6,w:60,h:52,label:'Place the seals',draw:(c,o)=>{if(T.seals)rect(c,o.x+6,o.y+6,o.w-12,o.h-6,'#04100f')},
      act:()=>{if(T.seals){say('The great door stands open.');return}openSealCode('The four seals','7432',()=>{T.seals=true;heal();sfx.solve();shake=.5;say('The four symbols ignite. Deep in the walls, something enormous begins to turn.',6)},'Four seals, left to right. Each wants one number from your memories of the manor.')}},
    lockerO(60,110),lockerO(544,270),
    lureO(470,110,'Switch on the radio','The old radio crackles to life. The thing drifts toward the sound.'),
    D(292,64,56,20,'machine',320,310,()=>!T.seals,'The great door is sealed. Four symbols are carved above it.')]},
  machine:{name:'The Machine',paint:paintMach,lights:()=>[{x:320,y:110,r:230,a:.65,col:'60,200,200'}],objs:[
    {x:240,y:66,w:160,h:66,solid:true,label:'Face the machine',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#3a4a4e');for(let i=0;i<8;i++){c.fillStyle=(Math.sin(time*3+i)>0)?'#5ae6e6':'#1d4a4a';c.fillRect(o.x+12+i*18,o.y+12,10,10)}rect(c,o.x+60,o.y+34,40,24,'#10181a')},
      act:()=>{if(!T.mem){say('The machine hums, waiting for one true memory.',4);return}openChoice()}},
    {x:280,y:160,w:80,h:40,solid:true,label:'Use the memory console',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a3236');rect(c,o.x+8,o.y+6,o.w-16,16,T.mem?'#1d6a3a':'#10181a')},
      act:()=>{if(T.mem){say('The console is quiet. The truth is out.');return}addNote('Memory shards',SHARDS);showNote('Memory shards',SHARDS,()=>openDial('Memory sequence',4,'3124',()=>{T.mem=true;heal();sfx.solve();addNote('Restoration log',LOGM);showNote('Restoration log',LOGM,()=>{shake=.6;sfx.scare();say('You have been here before. More than once. Face the machine.',6)})},'Enter the shard numbers in the order it happened.'))}},
    lockerO(60,280),lureO(520,110,'Open the steam valve','Steam shrieks from a pipe. The thing lurches toward the noise.'),
    D(296,336,48,16,'core',320,110)]}
};
function beginStage6(){
  chapter=6;T={lure:0,hide:0};redMode=false;hearts=3;updateHUD();roomId='core';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=6;fade=1;roomT=3;sfx.door();
  say('The study floor opens onto a vast chamber. Something that wears your shape is already walking toward you. Hide in lockers (E) or lure it away with noise.',8);
}
function hint6(){
  let t;
  if(!T.seals)t='Each seal wants a number from earlier: the clock hour, the escaped patient\u2019s photo number, the lullaby\u2019s first step, and how many journal entries were true. Your journal (J) helps.';
  else if(!T.mem)t='Touch the four memory shards in the machine room in the order the night really happened.';
  else t='Face the machine and make your choice.';
  say('Hint: '+t+' Lockers hide you. Radios and valves lure the entity away.',7);
}
function openChoice(){
  let ch=$('choice');
  if(!ch){ch=document.createElement('div');ch.className='screen';ch.id='choice';
    ch.innerHTML='<div class="card" style="text-align:center"><h2>The Final Choice</h2><p style="color:var(--muted)">The machine hums. From a glass cylinder, your friend\u2019s voice: "Please. Choose."</p><div class="row" style="flex-direction:column;align-items:stretch"></div></div>';
    [['destroy','Destroy the machine'],['rescue','Rescue your friend'],['accept','Accept the manor\u2019s offer'],['remember','Remember who you are']].forEach(([k,l])=>{const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=l;b.onclick=()=>{closeModal();chooseEnding(k)};ch.querySelector('.row').appendChild(b)});
    $('view').appendChild(ch)}
  ch.querySelector('.row').children[3].hidden=true;
  openModal('choice',c=>{if(c==='Escape')closeModal()});
}
const CAP={destroy:'The machine falls silent. The wipes stop. Somewhere far below, something begins to laugh.',rescue:'Mara leans on your shoulder. The morning is cold and bright. Behind your eyes, a door stays open.',accept:'You walk back inside. The door closes gently behind you.',remember:'You remember everything. The front door was never locked from the outside.',together:'Five of you walk into the sunrise, and Mara is with you. Nobody is watching.'};
let capT=0;
function startEnding(kind){
  mode='end';E={t:0,len:36,kind,i:0};ghost.on=false;$('msg').classList.remove('show');sfx.solve();
  E.mus=setInterval(()=>{tone([262,330,392,523,392,330,294,349][E.i++%8],1.6,'triangle',kind==='accept'?.04:.08)},650);
}
function drawEnding(){
  const t=E.t,acc=E.kind==='accept',k=acc?0:Math.min(1,t/12),mx=(a,b)=>Math.round(a+(b-a)*k);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgb('+mx(8,90)+','+mx(10,150)+','+mx(30,210)+')');g.addColorStop(.7,'rgb('+mx(20,255)+','+mx(20,170)+','+mx(40,110)+')');g.addColorStop(1,'rgb('+mx(10,255)+','+mx(10,210)+','+mx(20,160)+')');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(!acc){ctx.fillStyle='rgba(255,233,168,.95)';ctx.beginPath();ctx.arc(440,270-k*100,40,0,6.3);ctx.fill()}
  ctx.fillStyle='#0c1410';ctx.fillRect(0,300,W,H-300);
  ctx.fillStyle='#0a0c10';ctx.beginPath();ctx.moveTo(20,300);ctx.lineTo(20,200);ctx.lineTo(60,170);ctx.lineTo(100,200);ctx.lineTo(120,150);ctx.lineTo(170,200);ctx.lineTo(210,200);ctx.lineTo(210,300);ctx.fill();
  const px=acc?Math.max(60,330-t*14):260+Math.min(t,34)*14,sw=Math.sin(t*6)*4;
  ctx.fillStyle='#050608';ctx.fillRect(px-5,282,4,18+sw*.3);ctx.fillRect(px+1,282,4,18-sw*.3);ctx.fillRect(px-7,258,14,26);ctx.beginPath();ctx.arc(px,252,6,0,6.3);ctx.fill();
  if(E.kind==='destroy'&&t>9){ctx.fillStyle='#000';const fx=px-70+Math.sin(t)*2;ctx.fillRect(fx-7,246,14,38);ctx.beginPath();ctx.arc(fx,238,8,0,6.3);ctx.fill();ctx.fillRect(fx-14,250,5,30);ctx.fillRect(fx+9,250,5,30)}
  if(E.kind==='together'){for(let i=1;i<=4;i++){const fx=px-24-i*22;ctx.fillStyle='#050608';ctx.fillRect(fx-6,262,12,22);ctx.beginPath();ctx.arc(fx,256,5,0,6.3);ctx.fill()}}
  if(E.kind==='rescue'||E.kind==='remember'||E.kind==='together'){ctx.fillRect(px-26,260,12,24);ctx.beginPath();ctx.arc(px-20,254,5,0,6.3);ctx.fill()}
  ctx.textAlign='center';
  if(t<14){ctx.globalAlpha=Math.min(1,t/2,(14-t)/2);ctx.fillStyle='#fff';ctx.font='italic 17px Georgia,serif';ctx.fillText(CAP[E.kind],W/2,70);ctx.globalAlpha=1}
  else{
    const a=Math.min(.6,(t-14)/3);ctx.fillStyle='rgba(0,0,0,'+a+')';ctx.fillRect(0,0,W,H);
    const L=['THE HOLLOW MANOR','','A game by '+CREDIT_NAME,'','Stage 1: The Hollow Manor','Stage 2: The Forgotten Wing','Stage 3: The Underground Laboratory','Stage 4: The Nursery','Stage 5: The Mirror Realm','Stage 6: The Heart of the Manor','','Thank you for playing'];
    ctx.fillStyle='#f0e8d6';L.forEach((l,i)=>{ctx.font=(i===0?'bold 26px':'15px')+' Georgia,serif';ctx.fillText(l,W/2,H+20+i*30-(t-14)*24)});
  }
}
function flashEnd(kind){
  mode='fin';
  let f=$('fin');
  if(!f){f=document.createElement('div');f.id='fin';f.style.cssText='position:absolute;inset:0;background:#000;color:#4cff7a;font:700 clamp(12px,2.6vw,20px)/1.9 "Courier New",monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:9;letter-spacing:.08em';$('view').appendChild(f)}
  f.innerHTML='';f.style.display='flex';f.style.background='#fff';setTimeout(()=>{f.style.background='#000'},90);
  const L=kind==='together'?['SUBJECT 07','SUBJECTS 07-A TO 07-D: REINTEGRATED','CHOICE ORIGIN: SUBJECT','OBSERVATION CYCLE: TERMINATED','Nobody is watching.']:kind==='remember'?['SUBJECT 07','MEMORY RESTORATION: INCOMPLETE','Physical escape: SUCCESSFUL','Simulated escape: NOT REQUIRED','Observation cycle terminated.','\u00a0','Subject 08 has woken up.']:kind==='destroy'?['SUBJECT 07','MEMORY WIPES: TERMINATED','CONTAINMENT: FAILED','The thing the machine was holding is awake.']:['SUBJECT 07','MEMORY RESTORATION COMPLETE','Simulated escape: SUCCESSFUL','Physical escape: FAILED','Beginning next observation cycle...'];
  L.forEach((t,i)=>setTimeout(()=>{const d=document.createElement('div');d.textContent=t;f.appendChild(d);if(i===0)sfx.scare()},500+i*650));
  setTimeout(()=>{f.style.display='none';f.innerHTML='';reset();mode='title';$('title').classList.add('on')},500+L.length*650+2400);
}
Object.assign(ROOMS,STAGE2,STAGE3,STAGE4,STAGE5,STAGE6);buildBG();
