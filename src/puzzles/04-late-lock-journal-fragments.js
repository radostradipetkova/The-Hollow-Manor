/* ===== A lock you type on the keyboard (used for the hidden lock in Stage 2) ===== */
const TC={code:'',ok:null,s:'',done:false};
function tcShow(msg,col){
  const sl=$('tcSlots').children;
  for(let i=0;i<TC.code.length;i++){const ch=TC.s[i];sl[i].textContent=ch||'';sl[i].style.borderColor=(i===TC.s.length&&!TC.done)?'#e5c279':'#4a4a52'}
  $('tcM').textContent=msg||'';$('tcM').style.color=col||'';
}
function tcKey(n){
  if(TC.done||TC.s.length>=TC.code.length)return;
  TC.s+=n;sfx.light();tone(300+TC.s.length*40,.06,'square',.05);tcShow();
  if(TC.s.length===TC.code.length)$('tcM').textContent='Press Enter to try it.';
}
function tcSubmit(){
  if(TC.done)return;
  if(TC.s.length<TC.code.length){tcShow('Type all '+TC.code.length+' numbers first.','#c9a24a');return}
  if(TC.s===TC.code){TC.done=true;tcShow('The stone grinds open.','#5fd35f');sfx.solve();setTimeout(()=>{if(modal&&modal.id==='typecode'){closeModal();TC.ok()}},800)}
  else{sfx.bad();shake=.15;TC.s='';tcShow('Nothing moves. The wall stays cold. Try again.','#d0584a')}
}
function openTypeCode(title,code,ok,intro){
  let el=$('typecode');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='typecode';
    el.innerHTML='<div class="card" style="text-align:center;max-width:480px"><h2></h2><p class="small" id="tcI"></p><div id="tcSlots" style="display:flex;gap:12px;justify-content:center;margin:18px 0"></div><div id="tcM" class="small" style="min-height:2.4em"></div><div class="row"><button class="btn primary" id="tcGo" type="button">Try it</button><button class="btn" id="tcBk" type="button">Delete</button><button class="btn" id="tcX" type="button">Step back</button></div><p class="small" style="margin:4px 0 0">Type the numbers on your keyboard. Backspace deletes. Enter tries.</p></div>';
    $('view').appendChild(el);
    el.querySelector('#tcGo').onclick=tcSubmit;el.querySelector('#tcX').onclick=closeModal;
    el.querySelector('#tcBk').onclick=()=>{if(!TC.done){TC.s=TC.s.slice(0,-1);tcShow()}};
  }
  el.querySelector('h2').textContent=title;$('tcI').textContent=intro;
  const sl=$('tcSlots');sl.innerHTML='';
  for(let i=0;i<code.length;i++){const d=document.createElement('div');d.style.cssText='width:64px;height:80px;display:flex;align-items:center;justify-content:center;font:700 38px Georgia,serif;color:#e5c279;background:linear-gradient(145deg,#2a2a30,#1a1a1f);border:2px solid #4a4a52;border-radius:8px;box-shadow:inset 0 3px 8px rgba(0,0,0,.6)';sl.appendChild(d)}
  Object.assign(TC,{code,ok,s:'',done:false});tcShow();
  openModal('typecode',c=>{
    if(c==='Escape')closeModal();
    else if(c==='Enter')tcSubmit();
    else if(c==='Backspace'){if(!TC.done){TC.s=TC.s.slice(0,-1);tcShow()}}
    else if(/^(Digit|Numpad)\d$/.test(c))tcKey(c.slice(-1));
  });
}
/* ===== The false journal: drag each entry into the TRUE or FALSE box ===== */
const FJS=['Entry 1: "The dining room clock had to show seven."','Entry 2: "Wren was Aldric\u2019s eldest child, born in 1802."','Entry 3: "The escaped patient was Ames, photograph four."','Entry 4: "The lullaby ended on the fifth step, SOL."'],FJT=[true,false,true,false];
const SJ={ok:null,sel:null,done:false,drag:null};
function sjMove(el,box){
  box.querySelector('.sjlist').appendChild(el);el.style.position='';el.style.left='';el.style.top='';el.style.width='';el.style.zIndex='';
  el.classList.remove('sel');SJ.sel=null;sfx.light();
}
function sjAllPlaced(){return $('sjTray').children.length===0}
function sjGo(){
  if(SJ.done)return;
  const m=$('sjM');
  if(!sjAllPlaced()){m.textContent='Sort every entry into a box first.';m.style.color='#c9a24a';return}
  const ok=[...$('sjT').querySelectorAll('.sjslip')].every(e=>FJT[+e.dataset.i])&&[...$('sjF').querySelectorAll('.sjslip')].every(e=>!FJT[+e.dataset.i]);
  if(ok){SJ.done=true;m.textContent='The glass clears. The lies fall away.';m.style.color='#5fd35f';sfx.solve();setTimeout(()=>{if(modal&&modal.id==='sortj'){closeModal();SJ.ok()}},900)}
  else{sfx.bad();shake=.2;m.textContent='The pages shudder and slide apart. The house does not like that answer.';m.style.color='#d0584a';[...document.querySelectorAll('#sortj .sjslip')].forEach(e=>$('sjTray').appendChild(e))}
}
function openSortJournal(ok){
  let el=$('sortj');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='sortj';
    el.innerHTML='<div class="card" style="text-align:center;max-width:640px"><h2>The false journal</h2><p class="small">Drag each entry into the box where it belongs: TRUE or FALSE. (Or click an entry, then click a box.) The house wrote some of these lies.</p><div id="sjTray" style="display:flex;flex-direction:column;gap:8px;margin:12px 0;min-height:60px"></div><div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><div class="sjbox" id="sjT"><div class="sjlab" style="color:#5fd35f">TRUE</div><div class="sjlist"></div></div><div class="sjbox" id="sjF"><div class="sjlab" style="color:#d0584a">FALSE</div><div class="sjlist"></div></div></div><div id="sjM" class="small" style="min-height:2.6em;margin-top:8px"></div><div class="row"><button class="btn primary" id="sjGo" type="button">Seal the journal</button><button class="btn" id="sjX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    el.querySelector('#sjGo').onclick=sjGo;el.querySelector('#sjX').onclick=closeModal;
    [...el.querySelectorAll('.sjbox')].forEach(b=>b.addEventListener('click',()=>{const s=SJ.sel;if(s&&!SJ.done)sjMove(s,b)}));
  }
  SJ.ok=ok;SJ.sel=null;SJ.done=false;
  const tray=$('sjTray');tray.innerHTML='';el.querySelectorAll('.sjlist').forEach(l=>l.innerHTML='');
  $('sjM').textContent='';$('sjM').style.color='';
  FJS.forEach((t,i)=>{
    const sl=document.createElement('div');sl.className='sjslip';sl.dataset.i=i;sl.textContent=t;sl.style.transform='rotate('+((i%2?1:-1)*(.3+i*.15))+'deg)';
    let st=null;
    sl.addEventListener('pointerdown',e=>{if(SJ.done)return;const r=sl.getBoundingClientRect();st={x:e.clientX,y:e.clientY,dx:e.clientX-r.left,dy:e.clientY-r.top,w:r.width,h:r.height,moved:false};sl.setPointerCapture(e.pointerId)});
    sl.addEventListener('pointermove',e=>{
      if(!st)return;
      if(!st.moved&&Math.hypot(e.clientX-st.x,e.clientY-st.y)<5)return;
      if(!st.moved){st.moved=true;st.ph=document.createElement('div');st.ph.style.height=st.h+'px';sl.parentNode.insertBefore(st.ph,sl);sl.style.position='fixed';sl.style.width=st.w+'px';sl.style.zIndex=60;sl.style.transform='rotate(0deg)';sl.style.cursor='grabbing';sl.style.left='0px';sl.style.top='0px';const r0=sl.getBoundingClientRect();st.ox=r0.left;st.oy=r0.top}
      sl.style.left=(e.clientX-st.dx-st.ox)+'px';sl.style.top=(e.clientY-st.dy-st.oy)+'px';
    });
    const end=e=>{
      if(!st)return;const was=st;st=null;sl.style.cursor='';
      if(!was.moved){const s=SJ.sel;if(s&&s!==sl)s.classList.remove('sel');sl.classList.toggle('sel');SJ.sel=sl.classList.contains('sel')?sl:null;return}
      const hit=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains('sjbox'));
      if(was.ph)was.ph.remove();
      sl.style.position='';sl.style.left='';sl.style.top='';sl.style.width='';sl.style.zIndex='';sl.style.transform='';
      if(hit)sjMove(sl,hit);else{$('sjTray').appendChild(sl);sfx.light()}
    };
    sl.addEventListener('pointerup',end);sl.addEventListener('pointercancel',end);
    tray.appendChild(sl);
  });
  openModal('sortj',c=>{if(c==='Escape')closeModal();else if(c==='Enter')sjGo()});
}
buildBG();
/* ===== Hidden lore fragments (collect all 5 to unlock the secret ending) ===== */
const hasFrag=i=>notes.some(n=>n.title==='Fragment '+(i+1));
const fragCount=()=>notes.filter(n=>n.title.startsWith('Fragment')).length;
[['foyer',180,290,'Pry up the loose board','Under the loose board, a page in your own handwriting:\n\n"If you are reading this again, the front door is not the exit. Do not trust the lock. Look for Mara."'],
 ['archive',500,290,'Check the loose tile','A scrap tucked under a cracked tile:\n\n"Your friend\u2019s name is Mara. She left you a message in every room, in a code only you would understand."'],
 ['records',500,300,'Pick up the dropped tape label','A tape label, smudged:\n\n"The face on the monitor is not a stranger. It is the face you wear after each wipe."'],
 ['attic',200,300,'Pick up the crayon scrap','A crayon scrap in a child\u2019s hand:\n\n"The girl keeps coming back. She never remembers me, but the dog always does. She has her friend\u2019s eyes."'],
 ['study',400,300,'Pick up the mirror shard','A shard of glass etched with tiny letters:\n\n"The copy is not your enemy. It is what is left of every attempt. It has been trying to warn you."']
].forEach(([r,x,y,l,t],i)=>ROOMS[r].objs.push({x,y,w:30,h:16,label:l,
  draw:(c,o)=>{if(!hasFrag(i)){rect(c,o.x,o.y+6,o.w,6,'#3a2a1a');const g=.4+.4*Math.sin(time*4+i);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+15,o.y+8,3+g*2,0,6.3);c.fill()}},
  act:()=>{if(hasFrag(i)){say('Nothing more here.');return}sfx.pick();addNote('Fragment '+(i+1),t);showNote('Fragment '+(i+1)+' of 5',t);if(fragCount()===5)setTimeout(()=>say('That is all five fragments. Something deep in you begins to remember.',6),500)}}));
function portOk(){T.port=true;heal();sfx.solve();shake=.3;addNote('Nursery rhyme',RHYME2);showNote('Nursery rhyme','The frames click into place. Behind the middle one a panel slides open. Inside, in a child\u2019s handwriting:\n\n'+RHYME2)}
function doorOk(){T.door=true;heal();sfx.solve();shake=.5;say('The wall splits open. Beyond it, a staircase winds down into the dark.',5);setTimeout(stageEnd,3200)}
function beginStage(n){const result=n===2?beginStage2():n===3?beginStage3():n===4?beginStage4():n===5?beginStage5():beginStage6();saveGame();return result}
function beginStage2(){
  chapter=2;T={route:0,cor:1,good:Math.floor(Math.random()*3)};hearts=3;updateHUD();roomId='corr';player.x=320;player.y=310;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;sfx.door();
  say('The iron key turns, but the door opens onto a corridor you have never seen. The air smells of old dust. A single candle burns in a holder on the left wall.',7);
}
function stageEnd(){if(chapter>=2&&chapter<=5){beginStage(chapter+1);return}
  mode='win';sfx.solve();const c=$('win').querySelector('.card'),p=c.querySelectorAll('p');
  c.querySelector('h2').textContent='Stage 5 complete';
  p[0].textContent='The thing in the glass has been copying your memories. Your friend may have met an earlier version of you.';
  p[1].textContent='Stage 6, The Heart of the Manor, is coming next.';
  $('winStats').textContent='';$('win').classList.add('on');
}
function hint2(){
  let t;
  if(T.route<3)t=corrHint();
  else if(!T.reg)t='The desk in the gallery holds the family register.';
  else if(!T.port)t='Work out each birth year from the register, then swap the frames on the wall until they hang eldest first, from left to right.';
  else t='Read the rhyme (J), then listen to the doll in the whispering room. The hidden lock is in the gallery wall, on the right. Enter the numbers the doll said twice, in the order they first appeared.';
  say('Hint: '+t,6);
}

