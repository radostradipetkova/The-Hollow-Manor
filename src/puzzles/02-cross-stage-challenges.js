/* ===== More hands-on puzzles for Stages 1, 2, 4, 5 and 6 ===== */
/* Stage 1: the coloured books (the strange book only appears once they are solved) */
const BK=[{n:'black',c:'#222'},{n:'blue',c:'#3a5ac0'},{n:'green',c:'#2f8a4a'},{n:'red',c:'#b3262b'}],BKS=['blue','red','green','black'];
ROOMS.library.objs.unshift(...BK.map((b,i)=>({x:70+i*42,y:12,w:26,h:46,label:'Press the '+b.n+' book',
  draw:(c,o)=>{const p=(S.bk||[]).includes(i)||S.books;rect(c,o.x,o.y+(p?7:0),o.w,o.h-(p?7:0),b.c);rect(c,o.x,o.y+(p?7:0)+8,o.w,3,'#c9a24a')},
  act:()=>{
    if(S.books){say('The books are locked in place.');return}
    const q=S.bk=S.bk||[];if(q.includes(i)){say('That book is already pressed in.');return}
    q.push(i);sfx.light();
    if(q.length<4){say('The '+b.n+' book sinks into the shelf.',2);return}
    if(q.every((v,k)=>BK[v].n===BKS[k])){S.books=true;heal();sfx.solve();say('A click inside the wall. On the right-hand shelf, a book slides out an inch.',5)}
    else{S.bk=[];sfx.bad();say('The books slide back out. That was not the order.',3)}
  }})));
{const sb=ROOMS.library.objs.find(o=>o.label==='Pull the strange book');sb.when=()=>S.books}
/* Stage 2: the hidden lock is a plain 3-digit dial again */
{const w=ROOMS.archive.objs.find(o=>o.label==='Examine the wall');w.label='Use the hidden lock';
 w.act=()=>{if(T.door)return;openTypeCode('The hidden lock','729',doorOk,'Type the three numbers the doll said twice, in the order they first appeared.')}}
/* Stage 4: play the music box keys */
const KP={s:'',t:'',ok:null,
  press(n){tone([262,294,330,349,392,440,494,523][n-1],.7,'triangle',.2);this.s=(this.s+n).slice(-this.t.length);$('kOut').textContent=this.s.split('').map(d=>['do','re','mi','fa','sol','la','ti','high do'][d-1]).join('   ');if(this.s.replace(/8/g,'1')===this.t){const f=this.ok;closeModal();setTimeout(f,200)}},
  clear(){this.s='';$('kOut').textContent=''}};
function openKeys(title,target,ok,intro){
  let el=$('keys');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='keys';
    el.innerHTML='<div class="card" style="text-align:center"><h2></h2><p class="small" id="kIntro"></p><div class="row" id="kRow"></div><div id="kOut" style="min-height:2em;font:700 24px system-ui,sans-serif;letter-spacing:.3em"></div><div class="row"><button class="btn" id="kClear" type="button">Clear</button><button class="btn" id="kX" type="button">Step back</button></div></div>';
    $('view').appendChild(el);
    const row=el.querySelector('#kRow');
    ['do','re','mi','fa','sol','la','ti','high do'].forEach((n,i)=>{const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=(i+1)+' '+n;b.onclick=()=>KP.press(i+1);row.appendChild(b)});
    el.querySelector('#kX').onclick=closeModal;el.querySelector('#kClear').onclick=()=>KP.clear();
  }
  el.querySelector('h2').textContent=title;$('kIntro').textContent=intro;
  KP.t=target;KP.ok=ok;KP.s='';$('kOut').textContent='';
  openModal('keys',c=>{if(c==='Escape')closeModal();else if(/^(Digit|Numpad)[1-8]$/.test(c))KP.press(+c.slice(-1));else if(c==='Backspace')KP.clear()});
}
/* Stage 5: use your own delayed copy to hold the second pressure plate */
ROOMS.hallM.objs.push(...[180,460].map((x,i)=>({x:x-28,y:268,w:56,h:34,draw:(c,o)=>{const on=T.plates||(i?T.pb:T.pa);rect(c,o.x,o.y,o.w,o.h,on?'#3a6a5a':'#243438');c.strokeStyle=on?'#8af0c0':'#5a8a8a';c.lineWidth=2;c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2)}})));
{const k=ROOMS.hallM.objs.find(o=>o.label==='Take the silver key'),oa=k.act;
 k.act=()=>{if(!T.plates){say('The key sits under a glass dome. Two floor plates glow in front of the table, one on each side of the hall.',5);return}oa()}}
/* Stage 6: touch the memory shards in the order it happened */
const SH=['Your friend whispered "Count the candles" and you laughed.','The lights turned red. Your friend pointed at an empty bed.','You both reached the front door at dusk. It was already locked.','Your friend stepped into the glass. You stood still and watched.'],SHO='3124';
ROOMS.machine.objs.push(...[[130,190],[200,250],[450,250],[510,190]].map(([x,y],i)=>({x,y,w:30,h:30,solid:true,label:'Touch the memory shard',
  draw:(c,o)=>{const t=(T.ms||[]).includes(i+1)||T.mem;c.fillStyle=t?'rgba(90,230,230,.3)':'rgba(90,230,230,.9)';c.beginPath();c.arc(o.x+15,o.y+12+Math.sin(time*2+i)*3,10,0,6.3);c.fill();rect(c,o.x+6,o.y+22,18,8,'#2a3236')},
  act:()=>{
    if(T.mem){say('The shard is dark and empty now.');return}
    const m=T.ms=T.ms||[];if(m.includes(i+1)){say('You have already touched this memory.');return}
    m.push(i+1);sfx.light();say('"'+SH[i]+'"',5);
    if(m.length<4)return;
    if(m.join('')===SHO){T.mem=true;heal();sfx.solve();addNote('Restoration log',LOGM);saveCheckpoint();showNote('Restoration log',LOGM,()=>{shake=.6;sfx.scare();say('You have been here before. More than once. Face the machine.',6)})}
    else{T.ms=[];sfx.bad();say('The memories scatter and re-form. That was not the order it happened.',5)}
  }})));
{const cs=ROOMS.machine.objs.find(o=>o.label==='Use the memory console');cs.act=()=>{if(T.mem){say('The console is quiet. The truth is out.');return}say('The console waits. Four memory shards drift around the room. Touch them in the order it happened.',7)}}
buildBG();
/* ===== Stage 1: make the safe clue easier to follow ===== */
const HEARTH='A tiny child\u2019s shoe lies in the embers. Scratched into the hearthstone:\n\n"Blue first.\nRed comes after blue.\nGreen comes right after red.\nBlack ends the tale."\n\nThe colored books on the left shelf must be pressed in this order.';
{const sf=ROOMS.cellar.objs.find(o=>o.label==='Open the safe');
 sf.act=()=>{if(S.safe){say('The safe is open and empty.');return}if(!S.page){say('Three dials and no idea what to enter. The code must be written down somewhere upstairs. The library shelves are worth another look.',6);return}openSafe()}}
