/* ===== Endings: checkpoint, per-ending screens, endings counter ===== */
const REMEMBER_CARDS=[
  ['MEMORY RESTORED // ORIGIN','You remember a house before it was a manor. A girl named Mara, alone in a room with one window. The first subject.',null,38],
  ['MEMORY RESTORED // THE FRIEND','She was lonely. She remembered a friend she had never had, and the machine, which keeps everything, made her one.',null,38],
  ['MEMORY RESTORED // YOU','That friend was you. Every memory of a life outside these walls was hers, never yours.',null,38],
  ['MEMORY RESTORED // THE DOOR','Mara was never missing. She was waiting. You were the only thing that ever came when she called.',null,38],
  ['THE FRONT DOOR','It was never locked from the outside. Together, for the first time, you open it.',null,38]
];
const ACCEPT_CARDS=[
  ['THE MANOR ACCEPTS','The screen goes black. In the dark, the static from the beginning crackles again.',null,40],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,60],
  ['CYCLE 02','You are back in the entrance hall.',null,45]
];
function markEnding(k){try{const e=JSON.parse(localStorage.getItem('hmEnd')||'{}');e[k]=1;localStorage.setItem('hmEnd',JSON.stringify(e))}catch(x){}}
function endingsFound(){try{const e=JSON.parse(localStorage.getItem('hmEnd')||'{}');return['destroy','rescue','accept','remember','together'].filter(k=>e[k]).length}catch(x){return 0}}
function saveCheckpoint(){try{localStorage.setItem('hmCP',JSON.stringify({n:notes}))}catch(e){}}
function playCards(deck,done){closeModal();$('msg').classList.remove('show');noise(.8,.2,2500);runIntro(deck,done)}
function chooseEnding(k){
  if(k==='accept'){markEnding('accept');playCards(ACCEPT_CARDS,startCycle2);return}
  if(k==='destroy'||k==='rescue'){playCards(k==='destroy'?FOOL_DESTROY:FOOL_RESCUE,()=>startCycle2(true));return}
  if(k==='remember'){markEnding(k);playCards(rememberDeck(),()=>startEnding('remember'));return}
  markEnding(k);startEnding(k);
}
function startFromCheckpoint(){
  let d=null;try{d=JSON.parse(localStorage.getItem('hmCP'))}catch(e){}
  if(!d)return;
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  reset();notes=Array.isArray(d.n)?d.n:[];chapter=6;mode='play';initAudio();
  T={lure:0,hide:0,seals:true,mem:true};roomId='machine';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=2.5;hearts=3;updateHUD();
  say('Your memories are whole again. The machine waits. Face it when you are ready.',6);
  saveGame();
}
function refreshTitleExtras(){
  const row=document.querySelector('#title .row');if(!row)return;
  let b=$('bFinal');
  if(!b){b=document.createElement('button');b.id='bFinal';b.className='btn';b.type='button';b.textContent='Return to the final choice';b.onclick=startFromCheckpoint;row.appendChild(b)}
  let has=false;try{has=!!localStorage.getItem('hmCP')}catch(e){}
  b.hidden=!has;
  let b2=$('bCycle2');
  if(!b2){b2=document.createElement('button');b2.id='bCycle2';b2.className='btn';b2.type='button';b2.textContent='Enter Cycle 02';b2.onclick=startCycle2;row.appendChild(b2)}
  let acc=false;try{acc=!!JSON.parse(localStorage.getItem('hmEnd')||'{}').accept}catch(e){}
  b2.hidden=!acc;
  let c=$('endCount');
  if(!c){c=document.createElement('p');c.id='endCount';c.className='small';row.parentNode.appendChild(c)}
  const n=endingsFound();c.textContent=n?('Endings found: '+n+' of 5'):'';
}
